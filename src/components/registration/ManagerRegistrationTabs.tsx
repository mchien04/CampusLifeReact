import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { registrationAPI } from '../../services/registrationAPI';
import { ActivityRegistrationResponse, RegistrationStatus, getRegistrationStatusLabel } from '../../types/registration';
import { downloadBlobResponse, getBlobErrorMessage } from '../../utils/downloadBlob';

type RegistrationViewTab = 'pending' | 'approved' | 'attended' | 'cancelled';

interface ManagerRegistrationTabsProps {
    registrations: ActivityRegistrationResponse[];
    activityId?: number | null;
    eventName?: string;
    onUpdateStatus: (registrationId: number, status: string) => Promise<boolean | void> | boolean | void;
    onBulkUpdateStatus?: (
        registrationIds: number[],
        status: string
    ) => Promise<{ successCount: number; failedCount: number } | void> | { successCount: number; failedCount: number } | void;
}

const REGISTRATIONS_PER_PAGE = 6;

const TAB_META: Record<
    RegistrationViewTab,
    {
        label: string;
        badgeClass: string;
        emptyTitle: string;
        emptyDescription: string;
    }
> = {
    pending: {
        label: 'Chưa duyệt',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        emptyTitle: 'Không có đăng ký chờ duyệt',
        emptyDescription: 'Tất cả đăng ký đã được xử lý hoặc không khớp bộ lọc hiện tại.',
    },
    approved: {
        label: 'Đã duyệt',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        emptyTitle: 'Không có đăng ký đã duyệt',
        emptyDescription: 'Không tìm thấy sinh viên nào đã được duyệt trong bộ lọc hiện tại.',
    },
    attended: {
        label: 'Đã tham gia',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        emptyTitle: 'Không có sinh viên đã tham gia',
        emptyDescription: 'Không tìm thấy sinh viên nào đã hoàn thành tham gia trong bộ lọc hiện tại.',
    },
    cancelled: {
        label: 'Đã hủy',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        emptyTitle: 'Không có đăng ký bị hủy / từ chối',
        emptyDescription: 'Không có đăng ký hủy duyệt hoặc từ chối trong bộ lọc hiện tại.',
    },
};

const formatRegistrationDate = (value?: string) => {
    if (!value) return 'Chưa có';
    return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getCancelledBadgeClass = (status: RegistrationStatus) =>
    status === RegistrationStatus.CANCELLED
        ? 'bg-slate-100 text-slate-700 border-slate-200'
        : 'bg-rose-100 text-rose-700 border-rose-200';

const escapeCsvValue = (value: string | number) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

const getSafeFileName = (value?: string) => {
    const normalized = (value || 'danh-sach-tham-gia')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

    return normalized || 'danh-sach-tham-gia';
};

const ManagerRegistrationTabs: React.FC<ManagerRegistrationTabsProps> = ({
    registrations,
    activityId,
    eventName,
    onUpdateStatus,
    onBulkUpdateStatus,
}) => {
    const [activeTab, setActiveTab] = useState<RegistrationViewTab>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
    const [exporting, setExporting] = useState(false);

    const counts = useMemo(
        () => ({
            all: registrations.length,
            pending: registrations.filter((item) => item.status === RegistrationStatus.PENDING).length,
            approved: registrations.filter((item) => item.status === RegistrationStatus.APPROVED).length,
            attended: registrations.filter((item) => item.status === RegistrationStatus.ATTENDED).length,
            cancelled: registrations.filter(
                (item) => item.status === RegistrationStatus.REJECTED || item.status === RegistrationStatus.CANCELLED
            ).length,
        }),
        [registrations]
    );

    const registrationsByTab = useMemo<Record<RegistrationViewTab, ActivityRegistrationResponse[]>>(
        () => ({
            pending: registrations.filter((item) => item.status === RegistrationStatus.PENDING),
            approved: registrations.filter((item) => item.status === RegistrationStatus.APPROVED),
            attended: registrations.filter((item) => item.status === RegistrationStatus.ATTENDED),
            cancelled: registrations.filter(
                (item) => item.status === RegistrationStatus.REJECTED || item.status === RegistrationStatus.CANCELLED
            ),
        }),
        [registrations]
    );

    const filteredRegistrations = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        const source = registrationsByTab[activeTab];

        if (!keyword) return source;

        return source.filter((item) =>
            [item.studentName, item.studentCode, item.ticketCode || '']
                .join(' ')
                .toLowerCase()
                .includes(keyword)
        );
    }, [activeTab, registrationsByTab, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / REGISTRATIONS_PER_PAGE));
    const paginatedRegistrations = filteredRegistrations.slice((page - 1) * REGISTRATIONS_PER_PAGE, page * REGISTRATIONS_PER_PAGE);

    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
    }, [activeTab, searchTerm, registrations]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const toggleSelect = (registrationId: number) => {
        setSelectedIds((prev) =>
            prev.includes(registrationId) ? prev.filter((id) => id !== registrationId) : [...prev, registrationId]
        );
    };

    const toggleSelectAllOnPage = () => {
        const pageIds = paginatedRegistrations.map((item) => item.id);
        if (pageIds.length === 0) return;

        const allSelected = pageIds.every((id) => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
            return;
        }

        setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    };

    const handleSingleAction = async (registrationId: number, status: string) => {
        setIsUpdatingId(registrationId);
        try {
            await onUpdateStatus(registrationId, status);
        } finally {
            setIsUpdatingId(null);
        }
    };

    const handleBulkAction = async (status: string) => {
        if (selectedIds.length === 0) return;

        setIsBulkUpdating(true);
        try {
            if (onBulkUpdateStatus) {
                const result = await onBulkUpdateStatus(selectedIds, status);
                const successCount = result?.successCount ?? selectedIds.length;
                const failedCount = result?.failedCount ?? 0;

                if (failedCount > 0) {
                    toast.warn(`Đã xử lý ${successCount}/${selectedIds.length} đăng ký. ${failedCount} mục thất bại.`);
                } else {
                    toast.success(`Đã xử lý ${successCount} đăng ký.`);
                }
            } else {
                const results = await Promise.all(
                    selectedIds.map(async (registrationId) => {
                        const result = await onUpdateStatus(registrationId, status);
                        return result !== false;
                    })
                );
                const successCount = results.filter(Boolean).length;
                const failedCount = results.length - successCount;

                if (failedCount > 0) {
                    toast.warn(`Đã xử lý ${successCount}/${results.length} đăng ký. ${failedCount} mục thất bại.`);
                } else {
                    toast.success(`Đã xử lý ${successCount} đăng ký.`);
                }
            }
        } finally {
            setIsBulkUpdating(false);
            setSelectedIds([]);
        }
    };

    const handleExportAttended = () => {
        if (activeTab !== 'attended' || filteredRegistrations.length === 0) {
            toast.info('Không có dữ liệu đã tham gia để xuất.');
            return;
        }

        const rows = [
            ['Họ tên', 'MSSV', 'Mã vé', 'Thời gian đăng ký', 'Trạng thái'],
            ...filteredRegistrations.map((registration) => [
                registration.studentName,
                registration.studentCode,
                registration.ticketCode || '',
                formatRegistrationDate(registration.registeredDate),
                getRegistrationStatusLabel(registration.status),
            ]),
        ];

        const csvContent = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStamp = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = `${getSafeFileName(eventName)}-da-tham-gia-${dateStamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`Đã xuất ${filteredRegistrations.length} sinh viên đã tham gia.`);
    };

    const handleExportExcel = async () => {
        if (!activityId) {
            toast.error('Chưa chọn sự kiện để xuất.');
            return;
        }
        try {
            setExporting(true);
            const res = await registrationAPI.exportActivityParticipationExcel(activityId);
            await downloadBlobResponse(res, `ds_tham_gia_${activityId}.xlsx`);
            toast.success('Xuất danh sách tham gia thành công');
        } catch (error) {
            toast.error(await getBlobErrorMessage(error));
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="w-full lg:max-w-2xl">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Tìm theo tên, MSSV, mã vé..."
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15 transition-all"
                        />
                        {activityId != null && (
                            <button
                                type="button"
                                onClick={() => void handleExportExcel()}
                                disabled={exporting}
                                className="whitespace-nowrap rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-all hover:bg-emerald-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                {exporting ? 'Đang xuất...' : 'Xuất DS tham gia'}
                            </button>
                        )}
                        {activeTab === 'attended' && (
                            <button
                                type="button"
                                onClick={handleExportAttended}
                                disabled={filteredRegistrations.length === 0}
                                className="whitespace-nowrap rounded-xl border border-sky-200/80 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition-all hover:bg-sky-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                            >
                                Xuất file CSV
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {(['pending', 'approved', 'attended', 'cancelled'] as RegistrationViewTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
                            activeTab === tab
                                ? 'border-primary-900 bg-primary-900 text-white shadow-premium'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-900/30 hover:text-primary-900'
                        }`}
                    >
                        <span>{TAB_META[tab].label}</span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                                activeTab === tab ? 'bg-white/20 text-white' : TAB_META[tab].badgeClass
                            }`}
                        >
                            {tab === 'pending'
                                ? counts.pending
                                : tab === 'approved'
                                    ? counts.approved
                                    : tab === 'attended'
                                        ? counts.attended
                                        : counts.cancelled}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab === 'pending' && filteredRegistrations.length > 0 && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={paginatedRegistrations.length > 0 && paginatedRegistrations.every((item) => selectedIds.includes(item.id))}
                                onChange={toggleSelectAllOnPage}
                                className="h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900"
                            />
                            <span className="text-sm font-medium text-primary-900">
                                Chọn tất cả trên trang ({paginatedRegistrations.length})
                            </span>
                        </div>
                        <span className="text-sm text-amber-900/90 tabular-nums">
                            Đang chờ xử lý: {filteredRegistrations.length} sinh viên
                        </span>
                    </div>
                </div>
            )}

            {filteredRegistrations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center">
                    <h4 className="text-base font-semibold text-gray-800">{TAB_META[activeTab].emptyTitle}</h4>
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{TAB_META[activeTab].emptyDescription}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedRegistrations.map((registration) => {
                        const showCheckbox = activeTab === 'pending';
                        const showHeaderBadge = activeTab !== 'approved' && activeTab !== 'attended';
                        const reason = registration.feedback?.trim();
                        const badgeClass =
                            activeTab === 'approved'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : activeTab === 'attended'
                                    ? 'bg-sky-100 text-sky-700 border-sky-200'
                                : activeTab === 'cancelled'
                                    ? getCancelledBadgeClass(registration.status)
                                    : 'bg-amber-100 text-amber-700 border-amber-200';

                        return (
                            <div
                                key={registration.id}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-primary-900/20 hover:shadow-premium"
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="flex min-w-0 flex-1 gap-4">
                                        {showCheckbox && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(registration.id)}
                                                onChange={() => toggleSelect(registration.id)}
                                                className="mt-1 h-5 w-5 rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                <div className="min-w-0">
                                                    <h4 className="text-lg font-semibold tracking-tight text-primary-900">{registration.studentName}</h4>
                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                        <span>MSSV: <span className="font-medium text-gray-800 tabular-nums">{registration.studentCode}</span></span>
                                                        <span>Mã vé: <span className="font-mono font-medium text-gray-800">{registration.ticketCode || 'Chưa cấp'}</span></span>
                                                        <span>Đăng ký lúc: <span className="font-medium text-gray-800 tabular-nums">{formatRegistrationDate(registration.registeredDate)}</span></span>
                                                    </div>
                                                    {activeTab === 'cancelled' && reason && (
                                                        <div className="mt-3 inline-flex max-w-full rounded-xl border border-rose-200/80 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                                            Lý do: {reason}
                                                        </div>
                                                    )}
                                                </div>

                                                {showHeaderBadge && (
                                                    <span className={`inline-flex min-h-[42px] items-center rounded-2xl border px-4 py-2.5 text-sm font-semibold ${badgeClass}`}>
                                                        {activeTab === 'cancelled' ? getRegistrationStatusLabel(registration.status) : TAB_META[activeTab].label}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                                        {activeTab === 'pending' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSingleAction(registration.id, 'APPROVED')}
                                                    disabled={isUpdatingId === registration.id}
                                                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                                                >
                                                    Duyệt
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSingleAction(registration.id, 'REJECTED')}
                                                    disabled={isUpdatingId === registration.id}
                                                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-60"
                                                >
                                                    Từ chối
                                                </button>
                                            </>
                                        )}

                                        {activeTab === 'approved' && (
                                            <>
                                                <span className={`inline-flex min-h-[42px] items-center rounded-2xl border px-4 py-2.5 text-sm font-semibold ${badgeClass}`}>
                                                    {TAB_META.approved.label}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSingleAction(registration.id, 'REJECTED')}
                                                    disabled={isUpdatingId === registration.id}
                                                    className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-60"
                                                >
                                                    Hủy duyệt
                                                </button>
                                            </>
                                        )}

                                        {activeTab === 'attended' && (
                                            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700">
                                                Đã tham gia
                                            </div>
                                        )}

                                        {activeTab === 'cancelled' && (
                                            <button
                                                type="button"
                                                onClick={() => void handleSingleAction(registration.id, 'APPROVED')}
                                                disabled={isUpdatingId === registration.id}
                                                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                                            >
                                                Duyệt lại
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'pending' && selectedIds.length > 0 && (
                <div className="sticky bottom-4 z-10 rounded-2xl bg-primary-900 px-5 py-4 shadow-premium ring-1 ring-primary-900/10">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-white">
                            <div className="text-base font-semibold tracking-tight">Đã chọn {selectedIds.length} đăng ký</div>
                            <div className="text-sm text-primary-100/90 mt-0.5">Bạn có thể duyệt nhanh hoặc từ chối hàng loạt.</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => void handleBulkAction('APPROVED')}
                                disabled={isBulkUpdating}
                                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary-900 transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                {isBulkUpdating ? 'Đang xử lý...' : 'Duyệt đã chọn'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleBulkAction('REJECTED')}
                                disabled={isBulkUpdating}
                                className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                            >
                                {isBulkUpdating ? 'Đang xử lý...' : 'Từ chối đã chọn'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                disabled={isBulkUpdating}
                                className="rounded-xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/90 transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                            >
                                Bỏ chọn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {filteredRegistrations.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm text-gray-500 tabular-nums">
                        Hiển thị {(page - 1) * REGISTRATIONS_PER_PAGE + 1}–{Math.min(page * REGISTRATIONS_PER_PAGE, filteredRegistrations.length)} / {filteredRegistrations.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-900 hover:text-primary-900 active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                        >
                            Trang trước
                        </button>
                        <span className="px-2 text-sm font-medium text-gray-600 tabular-nums">
                            {page}/{totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-900 hover:text-primary-900 active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                        >
                            Trang sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerRegistrationTabs;
