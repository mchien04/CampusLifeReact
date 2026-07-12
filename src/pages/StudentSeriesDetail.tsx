import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    WarningCircle,
    CalendarBlank,
    Clock,
    ClipboardText,
    Medal,
    Users,
    Star,
    Flag,
    Ticket,
    CheckCircle,
    Hourglass,
    XCircle,
} from '@phosphor-icons/react';
import { seriesAPI } from '../services/seriesAPI';
import { registrationAPI } from '../services/registrationAPI';
import { SeriesResponse, StudentSeriesProgress, SeriesSlotInfo } from '../types/series';
import { ActivityResponse } from '../types/activity';
import { SeriesProgress, MilestoneDisplay, SeriesProgressBanner } from '../components/series';
import { SeriesActivityList } from '../components/series';
import StudentLayout from '../components/layout/StudentLayout';
import { toast } from 'react-toastify';
import { RegistrationStatus } from '../types/registration';
import { computeSeriesSlots } from '../utils/seriesSlots';
import { getScoreTypeLabel } from '../types/score';
import { getPresetDisplayName, getCodeLabel, localizeVi } from '../utils/vietnameseLabels';

const btnPrimary =
    'inline-flex items-center justify-center rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed';
const btnAccent =
    'inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary-900 transition-all hover:bg-accent/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed';
const btnDanger =
    'inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed';
const btnWaitlist =
    'inline-flex items-center justify-center rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 transition-all hover:bg-amber-100 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed';

const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const StudentSeriesDetailSkeleton: React.FC = () => (
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
}> = ({ icon, label, value }) => (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
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

const StudentSeriesDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [series, setSeries] = useState<SeriesResponse | null>(null);
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [progress, setProgress] = useState<StudentSeriesProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [canCancelSeries, setCanCancelSeries] = useState(false);
    const [cancelReason, setCancelReason] = useState<string | null>(null);
    const [isWaitlist, setIsWaitlist] = useState(false);
    const [slotInfo, setSlotInfo] = useState<SeriesSlotInfo | null>(null);
    const [cancellingSeries, setCancellingSeries] = useState(false);
    const [waitlistingSeries, setWaitlistingSeries] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    useEffect(() => {
        if (id) {
            loadSeries();
        }
    }, [id]);

    const loadSeries = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const seriesId = parseInt(id);

            const [seriesResponse, activitiesResponse] = await Promise.all([
                seriesAPI.getSeriesById(seriesId),
                seriesAPI.getSeriesActivities(seriesId),
            ]);

            if (seriesResponse.status && seriesResponse.data) {
                setSeries(seriesResponse.data);
                await loadRegistrationAndProgress(seriesResponse.data.id);
                const loadedActivities =
                    activitiesResponse.status && activitiesResponse.data
                        ? activitiesResponse.data
                        : [];
                const regResponse = await seriesAPI.getMySeriesRegistrationStatus(seriesResponse.data.id);
                const registered = !!(regResponse.status && regResponse.data?.isRegistered);
                loadSeriesSlotsAndWaitlist(
                    seriesResponse.data.id,
                    loadedActivities,
                    registered,
                    seriesResponse.data.ticketQuantity
                );
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

    const loadRegistrationAndProgress = async (seriesId: number) => {
        try {
            const [registrationResponse, progressResponse] = await Promise.all([
                seriesAPI.getMySeriesRegistrationStatus(seriesId),
                seriesAPI.getMySeriesProgress(seriesId),
            ]);

            if (registrationResponse.status && registrationResponse.data) {
                setIsRegistered(registrationResponse.data.isRegistered);
                setCanCancelSeries(registrationResponse.data.canCancel ?? false);
                setCancelReason(registrationResponse.data.cancelReason ?? null);
            } else {
                setIsRegistered(false);
                setCanCancelSeries(false);
                setCancelReason(null);
            }

            if (progressResponse.status && progressResponse.data) {
                setProgress(progressResponse.data);
            } else {
                setProgress(null);
            }
        } catch (err) {
            console.error('Error loading registration/progress:', err);
            setIsRegistered(false);
            setProgress(null);
        }
    };

    const loadSeriesSlotsAndWaitlist = async (
        seriesId: number,
        children: ActivityResponse[],
        registered: boolean,
        ticketQuantity: number | null | undefined
    ) => {
        if (ticketQuantity != null) {
            try {
                const seriesRegs = await registrationAPI.getSeriesRegistrations(seriesId);
                setSlotInfo(computeSeriesSlots(ticketQuantity, seriesRegs));
            } catch (err) {
                console.error('Error computing series slots:', err);
                setSlotInfo(computeSeriesSlots(ticketQuantity, []));
            }
        } else {
            setSlotInfo(computeSeriesSlots(null, []));
        }

        if (registered && children.length > 0) {
            try {
                const childStatus = await registrationAPI.getActivityRegistrationStatus(children[0].id);
                const waitlist = childStatus?.status === RegistrationStatus.WAITLIST;
                setIsWaitlist(waitlist);
            } catch (err) {
                console.error('Error detecting series waitlist:', err);
                setIsWaitlist(false);
            }
        } else {
            setIsWaitlist(false);
        }
    };

    const handleRegister = async () => {
        if (!series) return;

        try {
            const response = await seriesAPI.registerForSeries(series.id);
            if (response.status) {
                toast.success(response.message || 'Đăng ký thành công');
                await loadRegistrationAndProgress(series.id);
                const regResponse = await seriesAPI.getMySeriesRegistrationStatus(series.id);
                const registered = !!(regResponse.status && regResponse.data?.isRegistered);
                loadSeriesSlotsAndWaitlist(series.id, activities, registered, series.ticketQuantity);
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

    const handleCancelSeriesRegistration = async () => {
        if (!series) return;

        setCancellingSeries(true);
        try {
            const response = await seriesAPI.cancelSeriesRegistration(series.id);
            if (response.status) {
                toast.success(response.message || 'Đã huỷ đăng ký chuỗi sự kiện');
                setShowCancelConfirm(false);
                await loadRegistrationAndProgress(series.id);
                const regResponse = await seriesAPI.getMySeriesRegistrationStatus(series.id);
                const registered = !!(regResponse.status && regResponse.data?.isRegistered);
                loadSeriesSlotsAndWaitlist(series.id, activities, registered, series.ticketQuantity);
            } else {
                toast.error(response.message || 'Không thể huỷ đăng ký chuỗi sự kiện');
            }
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Có lỗi xảy ra khi huỷ đăng ký';
            toast.error(msg);
            console.error('Error cancelling series registration:', err);
        } finally {
            setCancellingSeries(false);
        }
    };

    const handleWaitlistSeries = async () => {
        if (!series) return;
        setWaitlistingSeries(true);
        try {
            const response = await seriesAPI.waitlistSeries(series.id);
            if (response.status) {
                toast.success(response.message || 'Đã thêm vào danh sách chờ');
                await loadRegistrationAndProgress(series.id);
                const regResponse = await seriesAPI.getMySeriesRegistrationStatus(series.id);
                const registered = !!(regResponse.status && regResponse.data?.isRegistered);
                loadSeriesSlotsAndWaitlist(series.id, activities, registered, series.ticketQuantity);
            } else {
                toast.error(response.message || 'Không thể đăng ký danh sách chờ');
            }
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Có lỗi xảy ra khi đăng ký danh sách chờ';
            toast.error(msg);
            console.error('Error waitlisting series:', err);
        } finally {
            setWaitlistingSeries(false);
        }
    };

    const canRegister = () => {
        if (!series || isRegistered) return false;
        const now = new Date();
        if (series.registrationStartDate && new Date(series.registrationStartDate) > now) {
            return false;
        }
        if (series.registrationDeadline && new Date(series.registrationDeadline) < now) {
            return false;
        }
        return true;
    };

    if (loading) {
        return (
            <StudentLayout>
                <StudentSeriesDetailSkeleton />
            </StudentLayout>
        );
    }

    if (error || !series) {
        return (
            <StudentLayout>
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
                            onClick={() => navigate('/student/series')}
                            className={`${btnPrimary} gap-2 px-5`}
                        >
                            <ArrowLeft size={16} weight="bold" />
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const displayName = localizeVi(series.name) || series.name;
    const displayDescription = series.description ? localizeVi(series.description) : null;
    const eventCount = activities.length || series.totalActivities || 0;

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
                    <div className="relative space-y-5">
                        <button
                            type="button"
                            onClick={() => navigate('/student/series')}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-100/90 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-lg px-1 -ml-1"
                        >
                            <ArrowLeft size={16} weight="bold" />
                            Danh sách chuỗi sự kiện
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-primary-100 ring-1 ring-white/15">
                                <Medal size={14} weight="duotone" />
                                {getScoreTypeLabel(series.scoreType)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-primary-100 ring-1 ring-white/15">
                                {series.requiresApproval ? 'Cần duyệt đăng ký' : 'Tự duyệt đăng ký'}
                            </span>
                            {isRegistered && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
                                    <CheckCircle size={14} weight="fill" />
                                    {isWaitlist ? 'Danh sách chờ' : 'Đã đăng ký'}
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                                {displayName}
                            </h1>
                            {displayDescription && (
                                <p className="mt-2 text-sm text-primary-100/90 max-w-3xl leading-relaxed">
                                    {displayDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {isRegistered && progress && <SeriesProgressBanner progress={progress} />}

                        <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium">
                            <h2 className="text-base font-semibold text-primary-900 mb-4">
                                Thông tin chuỗi sự kiện
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoTile
                                    icon={<CalendarBlank size={18} weight="duotone" />}
                                    label="Số sự kiện"
                                    value={`${eventCount} sự kiện trong chuỗi`}
                                />
                                <InfoTile
                                    icon={<Medal size={18} weight="duotone" />}
                                    label="Loại điểm"
                                    value={getScoreTypeLabel(series.scoreType)}
                                />
                                {series.registrationStartDate && (
                                    <InfoTile
                                        icon={<Clock size={18} weight="duotone" />}
                                        label="Mở đăng ký"
                                        value={formatDateTime(series.registrationStartDate)}
                                    />
                                )}
                                {series.registrationDeadline && (
                                    <InfoTile
                                        icon={<Clock size={18} weight="duotone" />}
                                        label="Hạn đăng ký"
                                        value={formatDateTime(series.registrationDeadline)}
                                    />
                                )}
                                <InfoTile
                                    icon={<ClipboardText size={18} weight="duotone" />}
                                    label="Hình thức duyệt"
                                    value={series.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}
                                />
                                {series.audience && series.audience !== 'ALL_PARTICIPANTS' && (
                                    <InfoTile
                                        icon={<Users size={18} weight="duotone" />}
                                        label="Đối tượng"
                                        value={getCodeLabel(series.audience, series.audience)}
                                    />
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {series.isImportant && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                                        <Star size={14} weight="fill" />
                                        Quan trọng
                                    </span>
                                )}
                                {series.mandatoryForFacultyStudents && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200/80">
                                        <Flag size={14} weight="duotone" />
                                        Bắt buộc cho sinh viên khoa
                                    </span>
                                )}
                                {series.presetCode && series.presetCode !== 'CUSTOM' && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-900 ring-1 ring-primary-100">
                                        Mẫu: {getPresetDisplayName(series.presetCode, series.presetCode)}
                                    </span>
                                )}
                                {series.minimumRequirementEnabled && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                                        Yêu cầu tối thiểu: {series.minimumRequiredEvents} sự kiện
                                    </span>
                                )}
                            </div>
                        </section>

                        <SeriesActivityList
                            series={{
                                ...series,
                                activities: activities,
                            }}
                            canManage={false}
                        />
                    </div>

                    <aside className="space-y-6">
                        {isRegistered && progress && (
                            <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                                <SeriesProgress series={series} progress={progress} />
                            </div>
                        )}

                        {isRegistered && progress && (
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium">
                                <MilestoneDisplay
                                    milestonePoints={progress.milestonePoints || series.milestonePoints}
                                    scoreType={progress.scoreType || series.scoreType}
                                    completedCount={progress.completedCount}
                                    currentPoints={progress.pointsEarned}
                                    currentMilestone={progress.currentMilestone}
                                    nextMilestoneCount={progress.nextMilestoneCount}
                                    nextMilestonePoints={progress.nextMilestonePoints}
                                />
                            </div>
                        )}

                        {!isRegistered && canRegister() && (
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium">
                                <h3 className="text-base font-semibold text-primary-900 mb-2">Đăng ký</h3>
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                    Đăng ký để tham gia tất cả các sự kiện trong chuỗi và nhận điểm milestone.
                                </p>
                                {slotInfo && slotInfo.ticketQuantity !== null && (
                                    <div className="mb-4">
                                        {slotInfo.isFull ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200/80 tabular-nums">
                                                <Ticket size={16} weight="duotone" />
                                                Đã đầy ({slotInfo.approvedCount}/{slotInfo.ticketQuantity})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200/80 tabular-nums">
                                                <Ticket size={16} weight="duotone" />
                                                Còn {slotInfo.remainingSlots} slot / {slotInfo.ticketQuantity}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRegister}
                                    disabled={slotInfo?.isFull === true}
                                    className={`${btnAccent} w-full`}
                                >
                                    Đăng ký chuỗi sự kiện
                                </button>
                                {slotInfo?.isFull === true && (
                                    <button
                                        type="button"
                                        onClick={handleWaitlistSeries}
                                        disabled={waitlistingSeries}
                                        className={`${btnWaitlist} w-full mt-2`}
                                    >
                                        {waitlistingSeries ? 'Đang xử lý…' : 'Đăng ký danh sách chờ'}
                                    </button>
                                )}
                            </div>
                        )}

                        {isRegistered && (
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium space-y-4">
                                <div className="text-center">
                                    {isWaitlist ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200/80">
                                            <Hourglass size={16} weight="duotone" />
                                            Đang chờ (danh sách chờ)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                                            <CheckCircle size={16} weight="fill" />
                                            Đã đăng ký
                                        </span>
                                    )}
                                    {activities.length === 0 && (
                                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                                            Chưa có sự kiện con trong chuỗi — trạng thái chờ chưa xác định.
                                        </p>
                                    )}
                                </div>

                                {canCancelSeries && !showCancelConfirm && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCancelConfirm(true)}
                                        className={`${btnDanger} w-full`}
                                    >
                                        Huỷ đăng ký chuỗi sự kiện
                                    </button>
                                )}

                                {canCancelSeries && showCancelConfirm && (
                                    <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 space-y-3">
                                        <p className="text-sm text-red-800 leading-relaxed">
                                            Bạn có chắc muốn huỷ đăng ký chuỗi sự kiện này? Tất cả đăng ký sự kiện con
                                            cũng sẽ bị huỷ.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleCancelSeriesRegistration}
                                                disabled={cancellingSeries}
                                                className={`${btnDanger} flex-1`}
                                            >
                                                {cancellingSeries ? 'Đang huỷ…' : 'Xác nhận huỷ'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCancelConfirm(false)}
                                                disabled={cancellingSeries}
                                                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/50"
                                            >
                                                Không
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!canCancelSeries && cancelReason && (
                                    <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-600 ring-1 ring-gray-100">
                                        <XCircle size={16} className="shrink-0 text-gray-400 mt-0.5" />
                                        <span className="leading-relaxed">{localizeVi(cancelReason)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentSeriesDetail;
