import React, { useState, useEffect } from 'react';
import {
    Stack,
    MagnifyingGlass,
    WarningCircle,
    ArrowClockwise,
    FolderOpen,
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { seriesAPI } from '../services/seriesAPI';
import { SeriesResponse, StudentSeriesProgress } from '../types/series';
import { SeriesCard } from '../components/series';
import StudentLayout from '../components/layout/StudentLayout';
import { sortSeriesForDisplay, getSeriesStatus } from '../utils/seriesHelpers';
import { toast } from 'react-toastify';

type RegistrationFilter = 'ALL' | 'REGISTERED' | 'NOT_REGISTERED';
type StatusFilter = 'ALL' | 'ACTIVE' | 'ENDED';

const StudentSeriesSkeleton: React.FC = () => (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-gray-200/80" />
        <div className="h-14 rounded-2xl bg-gray-200/80" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[420px] rounded-2xl bg-gray-200/80" />
            ))}
        </div>
    </div>
);

const StudentSeries: React.FC = () => {
    const { user } = useAuth();
    void user;

    const [series, setSeries] = useState<SeriesResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [registeredSeriesIds, setRegisteredSeriesIds] = useState<Set<number>>(new Set());
    const [progressMap, setProgressMap] = useState<Map<number, StudentSeriesProgress>>(new Map());

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
                    response.data.filter(
                        (s) => !s.isDeleted && !(s.isDraft ?? s.draft)
                    )
                );
                setSeries(activeSeries);
                await loadProgressForAllSeries(activeSeries);
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

    const loadProgressForAllSeries = async (seriesList: SeriesResponse[]) => {
        const registeredIds = new Set<number>();
        const progress = new Map<number, StudentSeriesProgress>();

        for (const s of seriesList) {
            try {
                const [registrationResponse, progressResponse] = await Promise.all([
                    seriesAPI.getMySeriesRegistrationStatus(s.id),
                    seriesAPI.getMySeriesProgress(s.id),
                ]);

                if (registrationResponse.status && registrationResponse.data?.isRegistered) {
                    registeredIds.add(s.id);
                }

                if (progressResponse.status && progressResponse.data) {
                    progress.set(s.id, progressResponse.data);
                }
            } catch {
                // Ignore per-series errors
            }
        }

        setRegisteredSeriesIds(registeredIds);
        setProgressMap(progress);
    };

    const handleRegister = async (seriesId: number) => {
        try {
            const response = await seriesAPI.registerForSeries(seriesId);
            if (response.status) {
                toast.success(response.message || 'Đăng ký thành công');
                await loadSeries();
            } else {
                toast.error(response.message || 'Đăng ký thất bại');
            }
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Có lỗi xảy ra khi đăng ký';
            toast.error(msg);
            console.error('Error registering for series:', err);
        }
    };

    const filteredSeries = series.filter((s) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            s.name.toLowerCase().includes(term) ||
            s.description?.toLowerCase().includes(term);

        const isRegistered = registeredSeriesIds.has(s.id);
        const matchesRegistration =
            registrationFilter === 'ALL' ||
            (registrationFilter === 'REGISTERED' && isRegistered) ||
            (registrationFilter === 'NOT_REGISTERED' && !isRegistered);

        const tone = getSeriesStatus(s).tone;
        const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE' && tone === 'active') ||
            (statusFilter === 'ENDED' && tone === 'ended');

        return matchesSearch && matchesRegistration && matchesStatus;
    });

    const registeredCount = registeredSeriesIds.size;

    const registrationFilterOptions: { value: RegistrationFilter; label: string }[] = [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'REGISTERED', label: 'Đã đăng ký' },
        { value: 'NOT_REGISTERED', label: 'Chưa đăng ký' },
    ];

    const statusFilterOptions: { value: StatusFilter; label: string }[] = [
        { value: 'ALL', label: 'Tất cả trạng thái' },
        { value: 'ACTIVE', label: 'Đang diễn ra' },
        { value: 'ENDED', label: 'Đã kết thúc' },
    ];

    const hasActiveFilters =
        !!searchTerm || registrationFilter !== 'ALL' || statusFilter !== 'ALL';

    const resetFilters = () => {
        setSearchTerm('');
        setRegistrationFilter('ALL');
        setStatusFilter('ALL');
    };

    return (
        <StudentLayout>
            <div className="mx-auto max-w-6xl space-y-6 pb-12">
                <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.12]"
                        style={{
                            backgroundImage:
                                'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                        }}
                    />
                    <div className="relative">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                            Chuỗi sự kiện
                        </p>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                            Khám phá chuỗi sự kiện
                        </h1>
                        <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed">
                            Đăng ký tham gia các chuỗi sự kiện để tích lũy điểm milestone theo từng mốc hoàn thành.
                        </p>
                        {!loading && series.length > 0 && (
                            <p className="mt-4 text-xs font-medium text-primary-100/70 tabular-nums">
                                {series.length} chuỗi · {registeredCount} đã đăng ký
                            </p>
                        )}
                    </div>
                </header>

                {!loading && !error && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-premium space-y-4">
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

                        <div className="space-y-3">
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    Đăng ký
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {registrationFilterOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRegistrationFilter(opt.value)}
                                            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
                                                registrationFilter === opt.value
                                                    ? 'bg-primary-900 text-white shadow-sm'
                                                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    Trạng thái
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {statusFilterOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setStatusFilter(opt.value)}
                                            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
                                                statusFilter === opt.value
                                                    ? 'bg-primary-900 text-white shadow-sm'
                                                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <p className="text-xs text-gray-500 tabular-nums">
                                {filteredSeries.length} kết quả
                                {searchTerm && (
                                    <>
                                        {' '}
                                        cho &ldquo;{searchTerm}&rdquo;
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                )}

                {loading && <StudentSeriesSkeleton />}

                {error && !loading && (
                    <div className="flex items-center justify-center min-h-[40vh]">
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
                )}

                {!loading && !error && filteredSeries.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-premium">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-900">
                            <FolderOpen size={28} weight="duotone" />
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight text-primary-900">
                            {hasActiveFilters
                                ? 'Không tìm thấy chuỗi sự kiện'
                                : 'Chưa có chuỗi sự kiện nào'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                            {hasActiveFilters
                                ? 'Thử từ khóa khác hoặc đổi bộ lọc.'
                                : 'Hiện chưa có chuỗi sự kiện nào được mở cho sinh viên.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                            >
                                <Stack size={18} weight="bold" />
                                Xem tất cả
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && filteredSeries.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredSeries.map((s) => {
                            const progress = progressMap.get(s.id);
                            const isRegistered = registeredSeriesIds.has(s.id);

                            return (
                                <SeriesCard
                                    key={s.id}
                                    series={s}
                                    progress={
                                        progress
                                            ? {
                                                  completedCount: progress.completedCount,
                                                  pointsEarned: progress.pointsEarned,
                                              }
                                            : undefined
                                    }
                                    onRegister={handleRegister}
                                    isRegistered={isRegistered}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentSeries;
