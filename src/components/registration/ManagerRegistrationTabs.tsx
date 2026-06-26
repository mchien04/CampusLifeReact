import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ActivityRegistrationResponse, RegistrationStatus, getRegistrationStatusLabel } from '../../types/registration';

type RegistrationViewTab = 'pending' | 'approved' | 'attended' | 'cancelled';

interface ManagerRegistrationTabsProps {
    registrations: ActivityRegistrationResponse[];
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
        label: 'Chua duyet',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        emptyTitle: 'Khong co dang ky cho duyet',
        emptyDescription: 'Tat ca dang ky da duoc xu ly hoac khong khop bo loc hien tai.',
    },
    approved: {
        label: 'Da duyet',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        emptyTitle: 'Khong co dang ky da duyet',
        emptyDescription: 'Khong tim thay sinh vien nao da duoc duyet trong bo loc hien tai.',
    },
    attended: {
        label: 'Da tham gia',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        emptyTitle: 'Khong co sinh vien da tham gia',
        emptyDescription: 'Khong tim thay sinh vien nao da hoan thanh tham gia trong bo loc hien tai.',
    },
    cancelled: {
        label: 'Da huy',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        emptyTitle: 'Khong co dang ky bi huy/tu choi',
        emptyDescription: 'Khong co dang ky huy duyet hoac tu choi trong bo loc hien tai.',
    },
};

const formatRegistrationDate = (value?: string) => {
    if (!value) return 'Chua co';
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
                    toast.warn(`Da xu ly ${successCount}/${selectedIds.length} dang ky. ${failedCount} muc that bai.`);
                } else {
                    toast.success(`Da xu ly ${successCount} dang ky.`);
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
                    toast.warn(`Da xu ly ${successCount}/${results.length} dang ky. ${failedCount} muc that bai.`);
                } else {
                    toast.success(`Da xu ly ${successCount} dang ky.`);
                }
            }
        } finally {
            setIsBulkUpdating(false);
            setSelectedIds([]);
        }
    };

    const handleExportAttended = () => {
        if (activeTab !== 'attended' || filteredRegistrations.length === 0) {
            toast.info('Khong co du lieu da tham gia de xuat.');
            return;
        }

        const rows = [
            ['Ho ten', 'MSSV', 'Ma ve', 'Thoi gian dang ky', 'Trang thai'],
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

        toast.success(`Da xuat ${filteredRegistrations.length} sinh vien da tham gia.`);
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
                            placeholder="Tim theo ten, MSSV, ma ve..."
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44]/20"
                        />
                        {activeTab === 'attended' && (
                            <button
                                type="button"
                                onClick={handleExportAttended}
                                disabled={filteredRegistrations.length === 0}
                                className="whitespace-nowrap rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Xuat file CSV
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {(['pending', 'approved', 'attended', 'cancelled'] as RegistrationViewTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                            activeTab === tab
                                ? 'border-[#001C44] bg-[#001C44] text-white shadow-lg'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-[#001C44] hover:text-[#001C44]'
                        }`}
                    >
                        <span>{TAB_META[tab].label}</span>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
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
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={paginatedRegistrations.length > 0 && paginatedRegistrations.every((item) => selectedIds.includes(item.id))}
                                onChange={toggleSelectAllOnPage}
                                className="h-5 w-5 rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                            />
                            <span className="text-sm font-semibold text-[#001C44]">
                                Chon tat ca tren trang ({paginatedRegistrations.length})
                            </span>
                        </div>
                        <span className="text-sm text-amber-900">
                            Dang cho xu ly: {filteredRegistrations.length} sinh vien
                        </span>
                    </div>
                </div>
            )}

            {filteredRegistrations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
                    <h4 className="text-lg font-semibold text-gray-700">{TAB_META[activeTab].emptyTitle}</h4>
                    <p className="mt-2 text-sm text-gray-500">{TAB_META[activeTab].emptyDescription}</p>
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
                                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#001C44]/30 hover:shadow-md"
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
                                                    <h4 className="text-xl font-bold text-[#001C44]">{registration.studentName}</h4>
                                                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                                                        <span>MSSV: <span className="font-semibold text-gray-800">{registration.studentCode}</span></span>
                                                        <span>Ma ve: <span className="font-mono font-semibold text-gray-800">{registration.ticketCode || 'Chua cap'}</span></span>
                                                        <span>Dang ky luc: <span className="font-semibold text-gray-800">{formatRegistrationDate(registration.registeredDate)}</span></span>
                                                    </div>
                                                    {activeTab === 'cancelled' && reason && (
                                                        <div className="mt-3 inline-flex max-w-full rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                                            Ly do: {reason}
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
                                                    Duyet
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSingleAction(registration.id, 'REJECTED')}
                                                    disabled={isUpdatingId === registration.id}
                                                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-60"
                                                >
                                                    Tu choi
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
                                                    Huy duyet
                                                </button>
                                            </>
                                        )}

                                        {activeTab === 'attended' && (
                                            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700">
                                                Da tham gia
                                            </div>
                                        )}

                                        {activeTab === 'cancelled' && (
                                            <button
                                                type="button"
                                                onClick={() => void handleSingleAction(registration.id, 'APPROVED')}
                                                disabled={isUpdatingId === registration.id}
                                                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                                            >
                                                Duyet lai
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
                <div className="sticky bottom-4 z-10 rounded-3xl bg-gradient-to-r from-[#001C44] to-[#133b78] px-5 py-4 shadow-2xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-white">
                            <div className="text-lg font-bold">Da chon {selectedIds.length} dang ky</div>
                            <div className="text-sm text-blue-100">Ban co the duyet nhanh hoac tu choi hang loat.</div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => void handleBulkAction('APPROVED')}
                                disabled={isBulkUpdating}
                                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#001C44] transition-all hover:bg-slate-100 disabled:opacity-60"
                            >
                                {isBulkUpdating ? 'Dang xu ly...' : 'Duyet da chon'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleBulkAction('REJECTED')}
                                disabled={isBulkUpdating}
                                className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-60"
                            >
                                {isBulkUpdating ? 'Dang xu ly...' : 'Tu choi da chon'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                disabled={isBulkUpdating}
                                className="rounded-2xl border border-white/30 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-60"
                            >
                                Bo chon
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {filteredRegistrations.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm text-gray-500">
                        Hien thi {(page - 1) * REGISTRATIONS_PER_PAGE + 1}-{Math.min(page * REGISTRATIONS_PER_PAGE, filteredRegistrations.length)} / {filteredRegistrations.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-[#001C44] hover:text-[#001C44] disabled:opacity-50"
                        >
                            Trang truoc
                        </button>
                        <span className="px-2 text-sm font-medium text-gray-600">
                            {page}/{totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                            className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-[#001C44] hover:text-[#001C44] disabled:opacity-50"
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
