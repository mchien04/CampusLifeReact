import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Stack,
    Plus,
    MagnifyingGlass,
    Eye,
    PencilSimple,
    Trash,
    WarningCircle,
    CalendarBlank,
    Medal,
    FolderOpen,
    ArrowClockwise,
} from '@phosphor-icons/react';
import { seriesAPI } from '../../services/seriesAPI';
import { SeriesResponse } from '../../types/series';
import { getScoreTypeLabel } from '../../types/score';
import { sortSeriesForDisplay } from '../../utils/seriesHelpers';
import { toast } from 'react-toastify';

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

const SeriesStatusBadge: React.FC<{ series: SeriesResponse }> = ({ series }) => {
    const isDraft = series.isDraft ?? series.draft ?? false;

    if (isDraft) {
        return (
            <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                Nháp
            </span>
        );
    }

    if (series.ended) {
        return (
            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200/80">
                Đã kết thúc
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
            Đang diễn ra
        </span>
    );
};

const SeriesManagementSkeleton: React.FC = () => (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-gray-200/80" />
        <div className="h-14 rounded-2xl bg-gray-200/80" />
        <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
            <div className="h-12 bg-gray-100/80" />
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 border-t border-gray-100 px-6 py-5">
                    <div className="h-10 w-10 rounded-xl bg-gray-200/80 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 rounded bg-gray-200/80" />
                        <div className="h-3 w-72 rounded bg-gray-100/80" />
                    </div>
                    <div className="h-8 w-20 rounded-lg bg-gray-100/80" />
                </div>
            ))}
        </div>
    </div>
);

const SeriesManagement: React.FC = () => {
    const [series, setSeries] = useState<SeriesResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSeries();
    }, []);

    const loadSeries = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await seriesAPI.getSeries();
            if (response.status && response.data) {
                const activeSeries = sortSeriesForDisplay(
                    response.data.filter((s) => !s.isDeleted)
                );
                setSeries(activeSeries);
            } else {
                setError(response.message || 'Không thể tải danh sách chuỗi sự kiện');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải danh sách chuỗi sự kiện');
            console.error('Error loading series:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa chuỗi sự kiện "${name}"?`)) {
            return;
        }

        try {
            const response = await seriesAPI.deleteSeries(id);
            if (response.status) {
                toast.success('Xóa chuỗi sự kiện thành công');
                await loadSeries();
            } else {
                toast.error(response.message || 'Xóa thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
            console.error('Error deleting series:', err);
        }
    };

    const filteredSeries = series.filter((s) => {
        const term = searchTerm.toLowerCase();
        return (
            s.name.toLowerCase().includes(term) ||
            s.description?.toLowerCase().includes(term)
        );
    });

    if (loading) {
        return <SeriesManagementSkeleton />;
    }

    if (error) {
        return (
            <div className="mx-auto max-w-6xl flex items-center justify-center min-h-[50vh]">
                <div className="text-center max-w-md px-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <WarningCircle size={28} weight="duotone" />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight text-primary-900 mb-2">
                        Không tải được dữ liệu
                    </h2>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">{error}</p>
                    <button
                        type="button"
                        onClick={loadSeries}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                    >
                        <ArrowClockwise size={18} weight="bold" />
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                    }}
                />
                <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                            Quản lý chuỗi sự kiện
                        </p>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                            Danh sách chuỗi sự kiện
                        </h1>
                        <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed">
                            Tạo, theo dõi và quản lý các chuỗi sự kiện cùng mốc điểm thưởng trong hệ thống.
                        </p>
                    </div>
                    <Link
                        to="/manager/series/create"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-primary-900 shadow-premium transition-all hover:bg-accent/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                        <Plus size={18} weight="bold" />
                        Tạo chuỗi mới
                    </Link>
                </div>
            </header>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-premium">
                <div className="relative">
                    <MagnifyingGlass
                        size={20}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên hoặc mô tả chuỗi sự kiện…"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors hover:border-gray-300 focus:border-primary-900/40 focus:outline-none focus:ring-2 focus:ring-primary-900/20"
                    />
                </div>
                {searchTerm && (
                    <p className="mt-3 text-xs text-gray-500 tabular-nums">
                        {filteredSeries.length} kết quả cho &ldquo;{searchTerm}&rdquo;
                    </p>
                )}
            </div>

            {filteredSeries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-premium">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-900">
                        <FolderOpen size={28} weight="duotone" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-primary-900">
                        {searchTerm ? 'Không tìm thấy chuỗi sự kiện' : 'Chưa có chuỗi sự kiện nào'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                        {searchTerm
                            ? 'Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                            : 'Tạo chuỗi sự kiện đầu tiên để gom các hoạt động và thiết lập mốc điểm thưởng.'}
                    </p>
                    {!searchTerm && (
                        <Link
                            to="/manager/series/create"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                        >
                            <Plus size={18} weight="bold" />
                            Tạo chuỗi sự kiện đầu tiên
                        </Link>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                    <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_100px_140px_110px_120px_auto] gap-4 border-b border-gray-100 bg-gray-50/80 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        <span>Chuỗi sự kiện</span>
                        <span className="text-right tabular-nums">Sự kiện</span>
                        <span>Loại điểm</span>
                        <span>Trạng thái</span>
                        <span className="tabular-nums">Ngày tạo</span>
                        <span className="text-right">Thao tác</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {filteredSeries.map((s) => {
                            const eventCount = s.activities?.length ?? s.totalActivities ?? 0;

                            return (
                                <div
                                    key={s.id}
                                    className="group px-4 py-4 sm:px-6 transition-colors hover:bg-primary-50/30 md:grid md:grid-cols-[minmax(0,1fr)_100px_140px_110px_120px_auto] md:items-center md:gap-4"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-900 text-white">
                                            <Stack size={20} weight="duotone" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                to={`/manager/series/${s.id}`}
                                                className="text-sm font-semibold text-primary-900 hover:underline line-clamp-1"
                                            >
                                                {s.name}
                                            </Link>
                                            {s.description && (
                                                <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                    {s.description}
                                                </p>
                                            )}
                                            <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-600 tabular-nums">
                                                    <CalendarBlank size={14} />
                                                    {formatDate(s.createdAt)}
                                                </span>
                                                <SeriesStatusBadge series={s} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:justify-end">
                                        <span className="md:hidden text-xs font-medium text-gray-500">Sự kiện</span>
                                        <span className="text-sm font-semibold text-primary-900 tabular-nums">
                                            {eventCount}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between gap-3 md:mt-0">
                                        <span className="md:hidden text-xs font-medium text-gray-500">Loại điểm</span>
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-900 ring-1 ring-primary-100">
                                            <Medal size={14} weight="duotone" />
                                            {getScoreTypeLabel(s.scoreType)}
                                        </span>
                                    </div>

                                    <div className="hidden md:block">
                                        <SeriesStatusBadge series={s} />
                                    </div>

                                    <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 tabular-nums">
                                        <CalendarBlank size={16} className="text-gray-400 shrink-0" />
                                        {formatDate(s.createdAt)}
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 md:mt-0 md:justify-end">
                                        <Link
                                            to={`/manager/series/${s.id}`}
                                            title="Xem chi tiết"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-primary-900 transition-all hover:border-primary-900 hover:bg-primary-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                                        >
                                            <Eye size={18} />
                                        </Link>
                                        <Link
                                            to={`/manager/series/${s.id}/edit`}
                                            title="Chỉnh sửa"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-all hover:border-primary-900 hover:text-primary-900 hover:bg-primary-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                                        >
                                            <PencilSimple size={18} />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(s.id, s.name)}
                                            title="Xóa"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/40"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-3 text-xs text-gray-500 tabular-nums">
                        {filteredSeries.length} chuỗi sự kiện
                        {searchTerm ? ' (đã lọc)' : ''}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeriesManagement;
