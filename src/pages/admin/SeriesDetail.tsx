import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    PencilSimple,
    WarningCircle,
    Info,
    CalendarBlank,
    Clock,
    Medal,
    Users,
    ChartBar,
    MagnifyingGlass,
    CalendarCheck,
    GameController,
    LinkSimple,
    X,
    GraduationCap,
    Ticket,
    Flag,
} from '@phosphor-icons/react';
import { seriesAPI } from '../../services/seriesAPI';
import { SeriesResponse, SeriesOverviewResponse, SeriesProgressListResponse } from '../../types/series';
import { ActivityResponse, SeriesChildActivityCreateRequest, SeriesChildActivityResponse } from '../../types/activity';
import { SeriesActivityList } from '../../components/series';
import { toast } from 'react-toastify';
import { getScoreTypeLabel } from '../../types/score';
import SeriesActivityForm from '../../components/events/SeriesActivityForm';
import QuizForm from '../../components/minigame/QuizForm';
import { minigameAPI } from '../../services/minigameAPI';
import { departmentAPI } from '../../services/api';
import { CreateMiniGameRequest, UpdateMiniGameRequest } from '../../types/minigame';
import { getPresetDisplayName, getCodeLabel, localizeVi } from '../../utils/vietnameseLabels';
import { mapSeriesError } from '../../utils/seriesHelpers';

const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const SeriesDetailSkeleton: React.FC = () => (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-gray-200/80" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="h-64 rounded-2xl bg-gray-200/80" />
                <div className="h-80 rounded-2xl bg-gray-200/80" />
            </div>
            <div className="h-[520px] rounded-2xl bg-gray-200/80" />
        </div>
    </div>
);

const InfoTile: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    className?: string;
}> = ({ icon, label, value, className = '' }) => (
    <div className={`rounded-xl border border-gray-100 bg-gray-50/60 p-4 ${className}`}>
        <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-900 shadow-sm ring-1 ring-gray-100">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                <div className="mt-1 text-sm font-medium text-gray-900 leading-relaxed">{value}</div>
            </div>
        </div>
    </div>
);

const SeriesStatusBadge: React.FC<{ series: SeriesResponse }> = ({ series }) => {
    const isDraft = series.isDraft ?? series.draft ?? false;

    if (isDraft) {
        return (
            <span className="inline-flex items-center rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/30">
                Nháp
            </span>
        );
    }

    if (series.ended) {
        return (
            <span className="inline-flex items-center rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/25">
                Đã kết thúc
                {series.latestEndDate
                    ? ` · ${new Date(series.latestEndDate).toLocaleDateString('vi-VN')}`
                    : ''}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-lg bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
            Đang diễn ra
        </span>
    );
};

const SeriesDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [series, setSeries] = useState<SeriesResponse | null>(null);
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddActivityModal, setShowAddActivityModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activityType, setActivityType] = useState<'normal' | 'minigame' | 'attach' | null>(null);
    const [createdActivityId, setCreatedActivityId] = useState<number | null>(null);
    const [showQuizForm, setShowQuizForm] = useState(false);
    const [createdActivity, setCreatedActivity] = useState<SeriesChildActivityResponse | null>(null);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [attachActivityId, setAttachActivityId] = useState('');
    const [attachOrder, setAttachOrder] = useState<number>(0);

    // Overview and Progress states
    const [overview, setOverview] = useState<SeriesOverviewResponse | null>(null);
    const [progress, setProgress] = useState<SeriesProgressListResponse | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'progress'>('overview');
    const [progressPage, setProgressPage] = useState(0);
    const [progressSize] = useState(20);
    const [progressKeyword, setProgressKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (id) {
            loadSeries();
            loadOverview();
        }
        loadDepartments();
    }, [id]);

    const loadDepartments = async () => {
        try {
            const res = await departmentAPI.getAll();
            if (res.status && res.data) {
                const raw = res.data as any;
                const list = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.body)
                        ? raw.body
                        : Array.isArray(raw?.data)
                        ? raw.data
                        : [];
                setDepartments(list);
            }
        } catch (err) {
            console.error('Error loading departments:', err);
        }
    };

    // Debounce search keyword
    useEffect(() => {
        if (searchDebounceTimerRef.current) {
            clearTimeout(searchDebounceTimerRef.current);
        }

        searchDebounceTimerRef.current = setTimeout(() => {
            setDebouncedKeyword(progressKeyword);
        }, 400);

        return () => {
            if (searchDebounceTimerRef.current) {
                clearTimeout(searchDebounceTimerRef.current);
            }
        };
    }, [progressKeyword]);

    useEffect(() => {
        if (id && activeTab === 'progress') {
            loadProgress();
        }
    }, [id, activeTab, progressPage, debouncedKeyword]);

    const loadSeries = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const seriesId = parseInt(id);

            // Load series info and activities in parallel
            const [seriesResponse, activitiesResponse] = await Promise.all([
                seriesAPI.getSeriesById(seriesId),
                seriesAPI.getSeriesActivities(seriesId)
            ]);

            if (seriesResponse.status && seriesResponse.data) {
                setSeries(seriesResponse.data);
            } else {
                setError(seriesResponse.message || 'Không thể tải thông tin chuỗi sự kiện');
            }

            if (activitiesResponse.status && activitiesResponse.data) {
                setActivities(activitiesResponse.data);
            } else {
                console.warn('Could not load activities:', activitiesResponse.message);
                setActivities([]);
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải thông tin chuỗi sự kiện');
            console.error('Error loading series:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateActivity = async (data: SeriesChildActivityCreateRequest) => {
        if (!id || !series) return;

        if (!series.organizerIds?.length) {
            toast.error('Chuỗi chưa có khoa tổ chức — cập nhật chuỗi trước');
            return;
        }

        try {
            setIsCreating(true);

            const response = await seriesAPI.createActivityInSeries(parseInt(id), data);
            if (response.status && response.data) {
                if (activityType === 'minigame') {
                    // Save activity ID and show quiz form
                    setCreatedActivityId(response.data.id);
                    setCreatedActivity(response.data);
                    setShowQuizForm(true);
                    toast.success('Tạo sự kiện minigame thành công! Bây giờ hãy tạo quiz.');
                } else {
                    toast.success('Tạo sự kiện trong chuỗi thành công!');
                    setShowAddActivityModal(false);
                    setActivityType(null);
                    // Reload both series and activities
                    await loadSeries();
                }
            } else {
                toast.error(mapSeriesError(response.message || 'Tạo sự kiện thất bại'));
            }
        } catch (err: any) {
            toast.error(mapSeriesError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện'));
            console.error('Error creating activity:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateQuiz = async (data: CreateMiniGameRequest | UpdateMiniGameRequest) => {
        if (!createdActivityId) return;

        try {
            setIsCreatingQuiz(true);
            // Since we're creating a new quiz, we need CreateMiniGameRequest
            // Ensure all required fields are present and series activities only carry supported fields
            const createData = data as CreateMiniGameRequest;
            const quizData: CreateMiniGameRequest = {
                activityId: createdActivityId,
                title: createData.title || createdActivity?.name || '',
                description: createData.description,
                questionCount: createData.questionCount || 0,
                timeLimit: createData.timeLimit,
                requiredCorrectAnswers: createData.requiredCorrectAnswers,
                maxAttempts: createData.maxAttempts ?? null,
                questions: createData.questions || []
                // Series activities rely on series-level score configuration
            };

            const response = await minigameAPI.createMiniGame(quizData);
            if (response.status && response.data) {
                toast.success('Tạo quiz thành công!');
                setShowAddActivityModal(false);
                setShowQuizForm(false);
                setActivityType(null);
                setCreatedActivityId(null);
                setCreatedActivity(null);
                // Reload both series and activities
                await loadSeries();
            } else {
                toast.error(response.message || 'Tạo quiz thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo quiz');
            console.error('Error creating quiz:', err);
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const handleCloseModal = () => {
        setShowAddActivityModal(false);
        setShowQuizForm(false);
        setActivityType(null);
        setCreatedActivityId(null);
        setCreatedActivity(null);
    };

    const handleAttachActivity = async (activityId: number, order: number) => {
        if (!id) return;
        try {
            setIsCreating(true);
            const response = await seriesAPI.addActivityToSeries(parseInt(id), {
                activityId,
                order
            });
            if (response.status) {
                toast.success('Gắn sự kiện vào chuỗi thành công!');
                handleCloseModal();
                await loadSeries();
            } else {
                toast.error(response.message || 'Gắn sự kiện thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gắn sự kiện');
            console.error('Error attaching activity:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const loadOverview = async () => {
        if (!id) return;

        try {
            setLoadingOverview(true);
            const seriesId = parseInt(id);
            const response = await seriesAPI.getSeriesOverview(seriesId);

            if (response.status && response.data) {
                setOverview(response.data);
            } else {
                console.warn('Could not load overview:', response.message);
            }
        } catch (err) {
            console.error('Error loading overview:', err);
        } finally {
            setLoadingOverview(false);
        }
    };

    const loadProgress = async () => {
        if (!id) return;

        try {
            setLoadingProgress(true);
            const seriesId = parseInt(id);
            const response = await seriesAPI.getSeriesProgress(seriesId, {
                page: progressPage,
                size: progressSize,
                keyword: debouncedKeyword || undefined
            });

            if (response.status && response.data) {
                setProgress(response.data);
            } else {
                console.warn('Could not load progress:', response.message);
            }
        } catch (err) {
            console.error('Error loading progress:', err);
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setProgressKeyword(value);
        setProgressPage(0); // Reset to first page when searching
        // Debounced keyword will be set by useEffect, which will trigger loadProgress
    };

    const handlePageChange = (newPage: number) => {
        setProgressPage(newPage);
    };

    // Helper functions
    const formatPercentage = (value: number): string => {
        return (value * 100).toFixed(1) + '%';
    };

    const formatBigDecimal = (value: string): string => {
        return parseFloat(value).toFixed(2);
    };

    const formatDate = (date: string): string => formatDateTime(date);

    const getCompletionRateColor = (rate: number): string => {
        if (rate >= 0.8) return 'text-emerald-600';
        if (rate >= 0.5) return 'text-amber-600';
        return 'text-rose-600';
    };

    const getMilestoneColor = (milestoneKey: string): string => {
        const colors: Record<string, string> = {
            '3': 'bg-blue-50 text-blue-800 ring-blue-200/80',
            '4': 'bg-purple-50 text-purple-800 ring-purple-200/80',
            '5': 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
        };
        return colors[milestoneKey] || 'bg-gray-100 text-gray-800 ring-gray-200/80';
    };

    const getDepartmentNames = (ids?: number[] | null): string => {
        if (!ids || ids.length === 0) return 'Tất cả sinh viên (hoặc chưa cấu hình)';
        const names = ids.map(id => {
            const dept = departments.find(d => d.id === id);
            return dept ? dept.name : `ID: ${id}`;
        });
        return names.join(', ');
    };

    const milestoneEntries = Object.entries(series?.milestonePoints || {})
        .map(([count, points]) => ({ count: parseInt(count, 10), points: Number(points) }))
        .filter((m) => !Number.isNaN(m.count))
        .sort((a, b) => a.count - b.count);

    if (loading) {
        return <SeriesDetailSkeleton />;
    }

    if (error || !series) {
        return (
            <div className="mx-auto max-w-6xl flex items-center justify-center min-h-[50vh]">
                <div className="text-center max-w-md px-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <WarningCircle size={28} weight="duotone" />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight text-primary-900 mb-2">
                        Không tải được dữ liệu
                    </h2>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        {error || 'Không tìm thấy chuỗi sự kiện'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/manager/series')}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                    >
                        <ArrowLeft size={18} weight="bold" />
                        Quay lại danh sách
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
                <div className="relative space-y-5">
                    <button
                        type="button"
                        onClick={() => navigate('/manager/series')}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-100/90 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-lg px-1 -ml-1"
                    >
                        <ArrowLeft size={16} weight="bold" />
                        Danh sách chuỗi sự kiện
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <SeriesStatusBadge series={series} />
                                {series.requiresApproval ? (
                                    <span className="inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-primary-100 ring-1 ring-white/15">
                                        Cần duyệt đăng ký
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-primary-100 ring-1 ring-white/15">
                                        Tự duyệt đăng ký
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                                {series.name}
                            </h1>
                            {series.description && (
                                <p className="mt-2 text-sm text-primary-100/90 max-w-3xl leading-relaxed">
                                    {series.description}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                            <Link
                                to={`/manager/series/${id}/edit`}
                                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-primary-900 shadow-premium transition-all hover:bg-accent/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                            >
                                <PencilSimple size={18} weight="bold" />
                                Chỉnh sửa
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <section className="rounded-2xl border border-gray-100 bg-white shadow-premium p-5 sm:p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900">
                                <Info size={22} weight="duotone" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                                    Thông tin chuỗi
                                </p>
                                <h2 className="text-lg font-semibold tracking-tight text-primary-900">
                                    Cấu hình & đăng ký
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoTile
                                icon={<CalendarCheck size={18} weight="duotone" />}
                                label="Số sự kiện"
                                value={
                                    <span className="tabular-nums">
                                        {activities.length || series.totalActivities || 0} sự kiện
                                    </span>
                                }
                            />
                            <InfoTile
                                icon={<Medal size={18} weight="duotone" />}
                                label="Loại điểm"
                                value={getScoreTypeLabel(series.scoreType)}
                            />
                            {series.audience && (
                                <InfoTile
                                    icon={<Users size={18} weight="duotone" />}
                                    label="Đối tượng điểm"
                                    value={
                                        series.audience === 'SPECIFIC_FACULTY' 
                                            ? getDepartmentNames(series.targetDepartmentIds)
                                            : getCodeLabel(series.audience, series.audience)
                                    }
                                />
                            )}
                            <InfoTile
                                icon={<Users size={18} weight="duotone" />}
                                label="Khoa tổ chức"
                                value={
                                    series.organizerIds?.length
                                        ? getDepartmentNames(series.organizerIds)
                                        : 'Chưa cấu hình'
                                }
                            />
                            {series.registrationStartDate && (
                                <InfoTile
                                    icon={<CalendarBlank size={18} weight="duotone" />}
                                    label="Mở đăng ký"
                                    value={
                                        <span className="tabular-nums">{formatDate(series.registrationStartDate)}</span>
                                    }
                                />
                            )}
                            {series.registrationDeadline && (
                                <InfoTile
                                    icon={<Clock size={18} weight="duotone" />}
                                    label="Hạn đăng ký"
                                    value={
                                        <span className="tabular-nums">{formatDate(series.registrationDeadline)}</span>
                                    }
                                />
                            )}
                            <InfoTile
                                icon={<Ticket size={18} weight="duotone" />}
                                label="Trạng thái duyệt"
                                value={series.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}
                            />
                            <InfoTile
                                icon={<GraduationCap size={18} weight="duotone" />}
                                label="Học kỳ cộng điểm"
                                value={
                                    series.targetSemesterId
                                        ? `Học kỳ ID: ${series.targetSemesterId}`
                                        : 'Tự động (theo sự kiện đầu tiên)'
                                }
                            />
                            {series.ticketQuantity != null && (
                                <InfoTile
                                    icon={<Users size={18} weight="duotone" />}
                                    label="Số lượng vé"
                                    value={<span className="tabular-nums">{series.ticketQuantity}</span>}
                                />
                            )}
                            {series.minimumRequirementEnabled && (
                                <InfoTile
                                    className="sm:col-span-2"
                                    icon={<WarningCircle size={18} weight="duotone" />}
                                    label="Yêu cầu tối thiểu"
                                    value={
                                        <span>
                                            Phải hoàn thành{' '}
                                            <strong className="tabular-nums">{series.minimumRequiredEvents}</strong> sự kiện,
                                            nếu không bị trừ{' '}
                                            <strong className="tabular-nums">{series.minimumPenaltyPoints}</strong> điểm
                                        </span>
                                    }
                                />
                            )}
                        </div>

                        {milestoneEntries.length > 0 && (
                            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                                    Mốc điểm thưởng
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {milestoneEntries.map((m) => (
                                        <span
                                            key={m.count}
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-gray-100 shadow-sm"
                                        >
                                            <span className="font-semibold text-primary-900 tabular-nums">
                                                {m.count} sự kiện
                                            </span>
                                            <span className="text-gray-400">→</span>
                                            <span className="font-medium text-gray-700 tabular-nums">
                                                +{m.points} {localizeVi(getScoreTypeLabel(series.scoreType))}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <SeriesActivityList
                        series={{
                            ...series,
                            activities,
                        }}
                        onAddActivity={() => setShowAddActivityModal(true)}
                        canManage
                    />
                </div>

                <aside className="lg:sticky lg:top-6 space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                        <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab('overview')}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/25 ${
                                    activeTab === 'overview'
                                        ? 'bg-primary-900 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-white hover:text-primary-900'
                                }`}
                            >
                                <ChartBar size={18} weight={activeTab === 'overview' ? 'fill' : 'duotone'} />
                                Tổng quan
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('progress')}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/25 ${
                                    activeTab === 'progress'
                                        ? 'bg-primary-900 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-white hover:text-primary-900'
                                }`}
                            >
                                <Users size={18} weight={activeTab === 'progress' ? 'fill' : 'duotone'} />
                                Tiến độ
                            </button>
                        </div>

                        {activeTab === 'overview' && (
                            <div className="p-5 sm:p-6">
                                {loadingOverview ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="h-20 rounded-xl bg-gray-100" />
                                            ))}
                                        </div>
                                        <div className="h-32 rounded-xl bg-gray-100" />
                                    </div>
                                ) : overview ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: overview.totalActivities, label: 'Sự kiện' },
                                                { value: overview.totalRegisteredStudents, label: 'Đã đăng ký' },
                                                {
                                                    value: overview.totalCompletedStudents,
                                                    label: 'Đã hoàn thành',
                                                    sub: formatPercentage(overview.completionRate),
                                                    subClass: getCompletionRateColor(overview.completionRate),
                                                },
                                                {
                                                    value: formatBigDecimal(overview.totalMilestonePointsAwarded),
                                                    label: 'Điểm đã trao',
                                                },
                                            ].map((stat) => (
                                                <div
                                                    key={stat.label}
                                                    className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5"
                                                >
                                                    <div className="text-xl font-bold text-primary-900 tabular-nums">
                                                        {stat.value}
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {stat.label}
                                                        {'sub' in stat && stat.sub && (
                                                            <span className={`ml-1 font-semibold ${stat.subClass}`}>
                                                                {stat.sub}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {overview.milestoneProgress && overview.milestoneProgress.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-primary-900 mb-3">
                                                    Phân bố theo mốc
                                                </h4>
                                                <div className="space-y-3">
                                                    {overview.milestoneProgress.map((milestone) => (
                                                        <div key={milestone.milestoneKey} className="space-y-1.5">
                                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                                <span className="font-medium text-gray-700">
                                                                    Mốc {milestone.milestoneKey}{' '}
                                                                    <span className="text-gray-500 tabular-nums">
                                                                        ({milestone.milestoneCount} sự kiện)
                                                                    </span>
                                                                </span>
                                                                <span className="text-gray-500 tabular-nums shrink-0">
                                                                    {milestone.studentCount} SV (
                                                                    {formatPercentage(milestone.percentage / 100)})
                                                                </span>
                                                            </div>
                                                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                                <div
                                                                    className="h-full rounded-full bg-primary-900 transition-all"
                                                                    style={{ width: `${milestone.percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {overview.activityStats && overview.activityStats.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-primary-900 mb-3">
                                                    Thống kê từng sự kiện
                                                </h4>
                                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                                    {overview.activityStats.map((activity, index) => {
                                                        const barColor =
                                                            activity.participationRate >= 0.8
                                                                ? 'bg-emerald-500'
                                                                : activity.participationRate >= 0.5
                                                                  ? 'bg-amber-500'
                                                                  : 'bg-rose-500';

                                                        return (
                                                            <div
                                                                key={activity.activityId}
                                                                className="rounded-xl border border-gray-100 bg-white p-3.5 transition-colors hover:border-primary-900/20"
                                                            >
                                                                <div className="flex items-start gap-2.5 mb-3">
                                                                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-900 text-xs font-bold text-white tabular-nums">
                                                                        {activity.order || index + 1}
                                                                    </span>
                                                                    <p className="text-sm font-semibold text-primary-900 line-clamp-2 leading-snug">
                                                                        {activity.activityName}
                                                                    </p>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 mb-2.5 text-xs">
                                                                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                                                                        <p className="text-gray-500">Đăng ký</p>
                                                                        <p className="font-bold text-primary-900 tabular-nums">
                                                                            {activity.registrationCount}
                                                                        </p>
                                                                    </div>
                                                                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                                                                        <p className="text-gray-500">Tham gia</p>
                                                                        <p className="font-bold text-primary-900 tabular-nums">
                                                                            {activity.participationCount}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs mb-1">
                                                                    <span className="text-gray-500">Tỷ lệ tham gia</span>
                                                                    <span
                                                                        className={`font-semibold tabular-nums ${
                                                                            activity.participationRate >= 0.8
                                                                                ? 'text-emerald-600'
                                                                                : activity.participationRate >= 0.5
                                                                                  ? 'text-amber-600'
                                                                                  : 'text-rose-600'
                                                                        }`}
                                                                    >
                                                                        {formatPercentage(activity.participationRate)}
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${barColor}`}
                                                                        style={{
                                                                            width: `${activity.participationRate * 100}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-sm text-gray-500">
                                        Không có dữ liệu tổng quan
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'progress' && (
                            <div className="p-5 sm:p-6">
                                {loadingProgress ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-11 rounded-xl bg-gray-100" />
                                        <div className="h-16 rounded-xl bg-gray-100" />
                                        <div className="h-48 rounded-xl bg-gray-100" />
                                    </div>
                                ) : progress ? (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <MagnifyingGlass
                                                size={18}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Tìm theo tên hoặc mã sinh viên…"
                                                value={progressKeyword}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors hover:border-gray-300 focus:border-primary-900/40 focus:outline-none focus:ring-2 focus:ring-primary-900/20"
                                            />
                                        </div>

                                        <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                                Tổng sinh viên đăng ký
                                            </p>
                                            <p className="mt-1 text-2xl font-bold text-primary-900 tabular-nums">
                                                {progress.totalRegistered}
                                            </p>
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                            <table className="w-full min-w-[520px] text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                                        <th className="px-3 py-2.5 text-left">Mã SV</th>
                                                        <th className="px-3 py-2.5 text-left">Tên</th>
                                                        <th className="px-3 py-2.5 text-left">Hoàn thành</th>
                                                        <th className="px-3 py-2.5 text-left">Điểm</th>
                                                        <th className="px-3 py-2.5 text-left">Mốc</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {progress.progressList.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-3 py-10 text-center">
                                                                <p className="text-sm font-medium text-gray-600">
                                                                    Không có dữ liệu
                                                                </p>
                                                                {progressKeyword && (
                                                                    <p className="mt-1 text-xs text-gray-400">
                                                                        Thử từ khóa khác
                                                                    </p>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        progress.progressList.map((item) => (
                                                            <tr
                                                                key={item.studentId}
                                                                className="transition-colors hover:bg-primary-50/30"
                                                            >
                                                                <td className="px-3 py-2.5 font-semibold text-primary-900 tabular-nums">
                                                                    {item.studentCode}
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <p className="font-medium text-gray-900 line-clamp-1">
                                                                        {item.studentName}
                                                                    </p>
                                                                    {(item.className || item.departmentName) && (
                                                                        <p className="text-xs text-gray-500 line-clamp-1">
                                                                            {[item.className, item.departmentName]
                                                                                .filter(Boolean)
                                                                                .join(' · ')}
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="tabular-nums text-gray-800">
                                                                            {item.completedCount}/{item.totalActivities}
                                                                        </span>
                                                                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
                                                                            <div
                                                                                className={`h-full rounded-full ${
                                                                                    item.completedCount === item.totalActivities
                                                                                        ? 'bg-emerald-500'
                                                                                        : 'bg-primary-900'
                                                                                }`}
                                                                                style={{
                                                                                    width: `${(item.completedCount / item.totalActivities) * 100}%`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2.5 font-medium tabular-nums">
                                                                    {formatBigDecimal(item.pointsEarned)}
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    {item.currentMilestone ? (
                                                                        <span
                                                                            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${getMilestoneColor(item.currentMilestone)}`}
                                                                        >
                                                                            Mốc {item.currentMilestone}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400">
                                                                            Chưa đạt
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {progress.totalPages > 1 && (
                                            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                                                <p className="text-xs text-gray-500 tabular-nums">
                                                    Trang {progress.page + 1}/{progress.totalPages}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePageChange(progressPage - 1)}
                                                        disabled={progressPage === 0}
                                                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-primary-900 hover:text-primary-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                                                    >
                                                        Trước
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePageChange(progressPage + 1)}
                                                        disabled={progressPage >= progress.totalPages - 1}
                                                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-primary-900 hover:text-primary-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                                                    >
                                                        Sau
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-sm text-gray-500">
                                        Không có dữ liệu tiến độ
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {showAddActivityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/40 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-premium">
                        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold tracking-tight text-primary-900">
                                    {showQuizForm ? 'Tạo quiz' : 'Thêm sự kiện vào chuỗi'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {activityType === 'minigame' && (
                                <div className="mb-4 flex items-center gap-2">
                                    <div className={`flex items-center gap-2 ${showQuizForm ? 'text-gray-400' : 'text-primary-900'}`}>
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${showQuizForm ? 'bg-gray-200' : 'bg-primary-900 text-white'}`}>
                                            1
                                        </div>
                                        <span className="text-sm">Thông tin sự kiện</span>
                                    </div>
                                    <div className="h-0.5 flex-1 bg-gray-200">
                                        <div className={`h-full transition-all ${showQuizForm ? 'w-full bg-primary-900' : 'w-0'}`} />
                                    </div>
                                    <div className={`flex items-center gap-2 ${showQuizForm ? 'text-primary-900' : 'text-gray-400'}`}>
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${showQuizForm ? 'bg-primary-900 text-white' : 'bg-gray-200'}`}>
                                            2
                                        </div>
                                        <span className="text-sm">Tạo quiz</span>
                                    </div>
                                </div>
                            )}

                            {!activityType && !showQuizForm && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        {
                                            type: 'normal' as const,
                                            icon: CalendarCheck,
                                            title: 'Tạo sự kiện thường',
                                            desc: 'Tạo sự kiện hoạt động thông thường trong chuỗi',
                                        },
                                        {
                                            type: 'minigame' as const,
                                            icon: GameController,
                                            title: 'Tạo minigame',
                                            desc: 'Tạo quiz/minigame với câu hỏi và đáp án',
                                        },
                                        {
                                            type: 'attach' as const,
                                            icon: LinkSimple,
                                            title: 'Gắn sự kiện có sẵn',
                                            desc: 'Gắn một sự kiện đã tồn tại vào chuỗi này',
                                        },
                                    ].map(({ type, icon: Icon, title, desc }) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setActivityType(type)}
                                            className="rounded-xl border-2 border-gray-200 p-5 text-left transition-all hover:border-primary-900 hover:bg-primary-900 hover:text-white active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/25 group"
                                        >
                                            <Icon size={28} weight="duotone" className="mb-3" />
                                            <h4 className="font-semibold mb-1">{title}</h4>
                                            <p className="text-sm text-gray-500 group-hover:text-primary-100/90 leading-relaxed">
                                                {desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            {showQuizForm && createdActivity ? (
                                <QuizForm
                                    activity={createdActivity}
                                    onSubmit={handleCreateQuiz}
                                    loading={isCreatingQuiz}
                                    isInSeries={true}
                                    title=""
                                    onCancel={() => {
                                        setShowQuizForm(false);
                                        setCreatedActivityId(null);
                                        setCreatedActivity(null);
                                    }}
                                />
                            ) : activityType === 'attach' ? (
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm text-primary-900 leading-relaxed">
                                        Gắn một sự kiện đã tồn tại vào chuỗi này. Sự kiện sẽ kế thừa cấu hình đăng ký và điểm từ chuỗi.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            ID sự kiện <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={attachActivityId}
                                            onChange={(e) => setAttachActivityId(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm transition-colors hover:border-gray-300 focus:border-primary-900/40 focus:outline-none focus:ring-2 focus:ring-primary-900/20"
                                            placeholder="Nhập ID sự kiện"
                                            min={1}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Thứ tự trong chuỗi <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={attachOrder || (activities.length > 0 ? Math.max(...activities.map(a => a.seriesOrder || 0), 0) + 1 : 1)}
                                            onChange={(e) => setAttachOrder(parseInt(e.target.value) || 0)}
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm transition-colors hover:border-gray-300 focus:border-primary-900/40 focus:outline-none focus:ring-2 focus:ring-primary-900/20"
                                            placeholder="Nhập thứ tự"
                                            min={1}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const activityId = parseInt(attachActivityId);
                                                const order = attachOrder || (activities.length > 0 ? Math.max(...activities.map(a => a.seriesOrder || 0), 0) + 1 : 1);
                                                if (!activityId || activityId <= 0) {
                                                    toast.error('Vui lòng nhập ID sự kiện hợp lệ');
                                                    return;
                                                }
                                                handleAttachActivity(activityId, order);
                                            }}
                                            disabled={isCreating}
                                            className="flex-1 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                                        >
                                            {isCreating ? 'Đang gắn…' : 'Gắn sự kiện'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActivityType(null);
                                                setAttachActivityId('');
                                                setAttachOrder(0);
                                            }}
                                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-primary-900 hover:text-primary-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                                        >
                                            Quay lại
                                        </button>
                                    </div>
                                </div>
                            ) : activityType && (
                                <SeriesActivityForm
                                    onSubmit={handleCreateActivity}
                                    loading={isCreating}
                                    isMinigame={activityType === 'minigame'}
                                    seriesOrganizerIds={series?.organizerIds ?? []}
                                    initialData={{
                                        order: activities.length > 0 ? Math.max(...activities.map(a => a.seriesOrder || 0), 0) + 1 : 1
                                    }}
                                    title=""
                                    onCancel={() => {
                                        setActivityType(null);
                                        if (!showQuizForm) {
                                            handleCloseModal();
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeriesDetail;

