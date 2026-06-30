import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { seriesAPI } from '../services/seriesAPI';
import { registrationAPI } from '../services/registrationAPI';
import { SeriesResponse, StudentSeriesProgress, SeriesSlotInfo } from '../types/series';
import { ActivityResponse } from '../types/activity';
import { LoadingSpinner } from '../components/common';
import { SeriesProgress, MilestoneDisplay, SeriesProgressBanner } from '../components/series';
import { SeriesActivityList } from '../components/series';
import StudentLayout from '../components/layout/StudentLayout';
import { toast } from 'react-toastify';
import { ScoreType } from '../types/activity';
import { RegistrationStatus } from '../types/registration';
import { computeSeriesSlots } from '../utils/seriesSlots';

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
    // P7-10 (Q5): detect WAITLIST qua per-activity status của 1 activity con.
    const [isWaitlist, setIsWaitlist] = useState(false);
    // P7-7/P7-9 (Q4): FE client-side compute slot APPROVED-only.
    const [slotInfo, setSlotInfo] = useState<SeriesSlotInfo | null>(null);
    const [cancellingSeries, setCancellingSeries] = useState(false);
    const [waitlistingSeries, setWaitlistingSeries] = useState(false);

    useEffect(() => {
        if (id) {
            loadSeries();
        }
    }, [id]);

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
                await loadRegistrationAndProgress(seriesResponse.data.id);
                // Cần activities trước khi compute slot/waitlist → đảm bảo đã set.
                const loadedActivities = activitiesResponse.status && activitiesResponse.data
                    ? activitiesResponse.data
                    : [];
                const regResponse = await seriesAPI.getMySeriesRegistrationStatus(seriesResponse.data.id);
                const registered = !!(regResponse.status && regResponse.data?.isRegistered);
                // P7-7/9/10: compute slot + detect WAITLIST (FE client-side, Q4/Q5).
                loadSeriesSlotsAndWaitlist(seriesResponse.data.id, loadedActivities, registered, seriesResponse.data.ticketQuantity);
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
                seriesAPI.getMySeriesProgress(seriesId)
            ]);

            // Update registration flag based on new API
            if (registrationResponse.status && registrationResponse.data) {
                setIsRegistered(registrationResponse.data.isRegistered);
                setCanCancelSeries(registrationResponse.data.canCancel ?? false);
                setCancelReason(registrationResponse.data.cancelReason ?? null);
            } else {
                setIsRegistered(false);
                setCanCancelSeries(false);
                setCancelReason(null);
            }

            // Update progress info (may be undefined if chưa có)
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

    // P7-7/P7-9 (Q4): compute slot APPROVED-only client-side + WAITLIST detection (P7-10/Q5).
    const loadSeriesSlotsAndWaitlist = async (
        seriesId: number,
        children: ActivityResponse[],
        registered: boolean,
        ticketQuantity: number | null | undefined
    ) => {
        // Slot compute — đếm distinct APPROVED từ /api/registrations/series/{id}.
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

        // WAITLIST detection — chỉ khi đã đăng ký và có ít nhất 1 activity con.
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
                toast.success(response.message || 'Đăng ký thành công!');
                await loadRegistrationAndProgress(series.id);
                const regResponse = await seriesAPI.getMySeriesRegistrationStatus(series.id);
                const registered = !!(regResponse.status && regResponse.data?.isRegistered);
                loadSeriesSlotsAndWaitlist(series.id, activities, registered, series.ticketQuantity);
            } else {
                toast.error(response.message || 'Đăng ký thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
            console.error('Error registering for series:', err);
        }
    };

    // P7-6: huỷ đăng ký series — confirm dialog + refresh state.
    const handleCancelSeriesRegistration = async () => {
        if (!series) return;
        const confirmed = window.confirm(
            'Bạn có chắc muốn huỷ đăng ký chuỗi sự kiện này?\n\n' +
            '⚠️ Tất cả đăng ký sự kiện con cũng sẽ bị huỷ.'
        );
        if (!confirmed) return;

        setCancellingSeries(true);
        try {
            const response = await seriesAPI.cancelSeriesRegistration(series.id);
            if (response.status) {
                toast.success(response.message || 'Đã huỷ đăng ký chuỗi sự kiện');
                await loadRegistrationAndProgress(series.id);
                const regResponse = await seriesAPI.getMySeriesRegistrationStatus(series.id);
                const registered = !!(regResponse.status && regResponse.data?.isRegistered);
                loadSeriesSlotsAndWaitlist(series.id, activities, registered, series.ticketQuantity);
            } else {
                // BE trả message (isImportant / mandatory / ATTENDED...).
                toast.error(response.message || 'Không thể huỷ đăng ký chuỗi sự kiện');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi huỷ đăng ký');
            console.error('Error cancelling series registration:', err);
        } finally {
            setCancellingSeries(false);
        }
    };

    // P7-7: đăng ký chờ (waitlist) khi series đã full.
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
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký danh sách chờ');
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
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (error || !series) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6">{error || 'Không tìm thấy chuỗi sự kiện'}</p>
                        <button
                            onClick={() => navigate('/student/series')}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const getScoreTypeLabel = (type: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[type] || type;
    };

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{series.name}</h1>
                            <p className="text-gray-200">{series.description}</p>
                        </div>
                        <button
                            onClick={() => navigate('/student/series')}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            ← Quay lại
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Banner */}
                        {isRegistered && progress && (
                            <SeriesProgressBanner progress={progress} />
                        )}

                        {/* Series Info */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-[#001C44] mb-4">Thông tin chuỗi sự kiện</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center">
                                    <span className="w-4 h-4 mr-2">📋</span>
                                    <span className="text-gray-600">
                                        {activities.length || series.totalActivities || 0} sự kiện trong chuỗi
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-4 h-4 mr-2">⭐</span>
                                    <span className="text-gray-600">
                                        Loại điểm: {getScoreTypeLabel(series.scoreType)}
                                    </span>
                                </div>
                                {series.registrationStartDate && (
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 mr-2">🚀</span>
                                        <span className="text-gray-600">
                                            Mở đăng ký:{' '}
                                            {new Date(series.registrationStartDate).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                                {series.registrationDeadline && (
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 mr-2">⏰</span>
                                        <span className="text-gray-600">
                                            Hạn đăng ký:{' '}
                                            {new Date(series.registrationDeadline).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <span className="w-4 h-4 mr-2">📝</span>
                                    <span className="text-gray-600">
                                        {series.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}
                                    </span>
                                </div>
                                {series.audience && series.audience !== 'ALL_PARTICIPANTS' && (
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 mr-2">🎯</span>
                                        <span className="text-gray-600">
                                            Đối tượng: {series.audience === 'DEPARTMENT_SCOPED' ? 'Theo khoa/ngành' : series.audience}
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {series.isImportant && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                            ⭐ Quan trọng
                                        </span>
                                    )}
                                    {series.mandatoryForFacultyStudents && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                            ⚠️ Bắt buộc cho sinh viên khoa
                                        </span>
                                    )}
                                    {series.presetCode && series.presetCode !== 'CUSTOM' && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                                            Mẫu: {series.presetCode}
                                        </span>
                                    )}
                                    {series.minimumRequirementEnabled && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                            Yêu cầu tối thiểu: {series.minimumRequiredEvents} sự kiện
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Activities List */}
                        <SeriesActivityList 
                            series={{
                                ...series,
                                activities: activities
                            }} 
                            canManage={false} 
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Progress */}
                        {isRegistered && progress && (
                            <SeriesProgress series={series} progress={progress} />
                        )}

                        {/* Milestone Display */}
                        {isRegistered && progress && (
                            <MilestoneDisplay
                                milestonePoints={progress.milestonePoints || series.milestonePoints}
                                scoreType={progress.scoreType || series.scoreType}
                                completedCount={progress.completedCount}
                                currentPoints={progress.pointsEarned}
                                currentMilestone={progress.currentMilestone}
                                nextMilestoneCount={progress.nextMilestoneCount}
                                nextMilestonePoints={progress.nextMilestonePoints}
                            />
                        )}

                        {/* Registration */}
                        {!isRegistered && canRegister() && (
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4">Đăng ký</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Đăng ký để tham gia tất cả các sự kiện trong chuỗi này và nhận điểm milestone
                                </p>
                                {slotInfo && slotInfo.ticketQuantity !== null && (
                                    <div className="mb-4 text-sm">
                                        {slotInfo.isFull ? (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-medium">
                                                ⚠️ Đã đầy ({slotInfo.approvedCount}/{slotInfo.ticketQuantity})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-50 text-green-700 border border-green-200 font-medium">
                                                Còn {slotInfo.remainingSlots} slot / {slotInfo.ticketQuantity}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={handleRegister}
                                    disabled={slotInfo?.isFull === true}
                                    className="w-full btn-yellow px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Đăng ký chuỗi sự kiện
                                </button>
                                {/* P7-7: nút "Đăng ký chờ" khi còn slot nhưng đã full. */}
                                {slotInfo?.isFull === true && (
                                    <button
                                        onClick={handleWaitlistSeries}
                                        disabled={waitlistingSeries}
                                        className="w-full mt-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {waitlistingSeries ? 'Đang xử lý...' : 'Đăng ký danh sách chờ'}
                                    </button>
                                )}
                            </div>
                        )}

                        {isRegistered && (
                            <div className="card p-6 space-y-4">
                                <div className="text-center">
                                    {isWaitlist ? (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                            ⏳ Đang chờ (danh sách chờ)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                            ✅ Đã đăng ký
                                        </span>
                                    )}
                                    {activities.length === 0 && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Chưa có sự kiện con trong chuỗi — trạng thái chờ chưa xác định.
                                        </p>
                                    )}
                                </div>
                                {/* P7-6: nút huỷ đăng ký series — chỉ hiện khi BE cho phép. */}
                                {canCancelSeries && (
                                    <button
                                        onClick={handleCancelSeriesRegistration}
                                        disabled={cancellingSeries}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {cancellingSeries ? 'Đang huỷ...' : 'Huỷ đăng ký chuỗi sự kiện'}
                                    </button>
                                )}
                                {!canCancelSeries && cancelReason && (
                                    <div className="text-xs text-gray-500 text-center bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                                        {cancelReason}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentSeriesDetail;

