import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { taskAPI } from '../services/taskAPI';
import { submissionAPI } from '../services/submissionAPI';
import { studentAPI } from '../services/studentAPI';
import { preparationAPI } from '../services/preparationAPI';
import { getSubmissionStatusColor, getSubmissionStatusLabel } from '../utils/submissionUtils';
import { ActivityResponse, ActivityType, ScoreType, ActivityPhotoResponse } from '../types';
import { ActivityTaskResponse, TaskAssignmentResponse } from '../types/task';
import { TaskSubmissionResponse, SubmissionAttachment } from '../types/submission';
import { RegistrationStatus, ParticipationType, ActivityRegistrationResponse, ActivityRegistrationStatusResponse } from '../types/registration';
import { hasCancelledBefore } from '../utils/registrationRules';
import { formatTicketQuantityLabel } from '../utils/ticketUtils';
import { LoadingSpinner } from '../components/common';

import { ScoreRulesDisplay } from '../components/events/ScoreRulesDisplay';
import { EventBannerImage, PhotoGrid } from '../components/events';
import { activityPhotoAPI } from '../services/activityPhotoAPI';
import StudentLayout from '../components/layout/StudentLayout';
import { minigameAPI } from '../services/minigameAPI';
import { MiniGame } from '../types/minigame';
import { seriesAPI } from '../services/seriesAPI';
import { StudentSeriesProgress } from '../types/series';
import SeriesProgressBanner from '../components/series/SeriesProgressBanner';
import { getPresetDisplayName } from '../utils/vietnameseLabels';

const StudentEventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const contextActivityId = id && !Number.isNaN(Number(id)) ? Number(id) : null;
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registration, setRegistration] = useState<ActivityRegistrationResponse | null>(null);
    // P7-1: registration-status Map (canCancel + isRegistered + status) từ BE.
    const [regStatus, setRegStatus] = useState<ActivityRegistrationStatusResponse | null>(null);
    // P7-5 (Q3): cache /my để chặn re-register sau khi huỷ.
    const [myRegistrations, setMyRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [feedback, setFeedback] = useState('');

    // Minigame state (for activities with type MINIGAME)
    const [minigame, setMinigame] = useState<MiniGame | null>(null);
    const [loadingMinigame, setLoadingMinigame] = useState(false);

    const [seriesProgress, setSeriesProgress] = useState<StudentSeriesProgress | null>(null);

    // Tasks and submissions (within this event page)
    const [tasks, setTasks] = useState<TaskAssignmentResponse[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [mySubmissionsByTask, setMySubmissionsByTask] = useState<Record<number, TaskSubmissionResponse | null>>({});
    const [isSupervisor, setIsSupervisor] = useState(false);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskAssignmentResponse | null>(null);
    const [mySubmission, setMySubmission] = useState<TaskSubmissionResponse | null>(null);
    const [submitContent, setSubmitContent] = useState('');
    const [submitFiles, setSubmitFiles] = useState<File[]>([]);
    const [submitImages, setSubmitImages] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Departments for display
    const [departments, setDepartments] = useState<any[]>([]);

    // Photo gallery states
    const [photos, setPhotos] = useState<ActivityPhotoResponse[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    useEffect(() => {
        if (id) {
            loadEvent();
        }
    }, [id]);

    // Load photos when event is loaded and ended
    useEffect(() => {
        const loadPhotos = async () => {
            if (!event || !id) return;

            // Only load photos if event has ended
            const isEventEnded = new Date(event.endDate) < new Date();
            if (!isEventEnded) return;

            try {
                setLoadingPhotos(true);
                const response = await activityPhotoAPI.getActivityPhotos(parseInt(id));
                if (response.status) {
                    // Handle both array and object with data property
                    const photosData = Array.isArray(response.data) ? response.data : (response.data || []);
                    setPhotos(photosData);
                } else {
                    console.error('Failed to load photos:', response.message);
                    setPhotos([]);
                }
            } catch (err) {
                console.error('Error loading photos:', err);
                setPhotos([]);
            } finally {
                setLoadingPhotos(false);
            }
        };

        loadPhotos();
    }, [event, id]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvent(parseInt(id!));
            if (response.status && response.data) {
                setEvent(response.data);
                await Promise.all([
                    checkRegistrationStatus(response.data.id),
                    loadTasksByActivity(response.data.id),
                    checkSupervisorStatus(response.data.id),
                    loadMyRegistrations()
                ]);

                if (response.data.seriesId) {
                    try {
                        const seriesProgressRes = await seriesAPI.getMySeriesProgress(response.data.seriesId);
                        if (seriesProgressRes.status && seriesProgressRes.data) {
                            setSeriesProgress(seriesProgressRes.data);
                        }
                    } catch (e) {
                        console.error('Error loading series progress:', e);
                    }
                }

                // If this is a minigame activity, load its quiz info
                if (response.data.type === ActivityType.MINIGAME) {
                    await loadMinigame(response.data.id);
                } else {
                    setMinigame(null);
                }
            } else {
                setError(response.message || 'Không thể tải thông tin sự kiện');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải thông tin sự kiện');
            console.error('Error loading event:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await api.get('/api/departments');
                if (res.data) setDepartments(Array.isArray(res.data) ? res.data : (res.data.body || []));
            } catch (err) {
                console.error("Error fetching departments", err);
            }
        };
        fetchDepartments();
    }, []);

    const translatePreset = (code?: string | null) => getPresetDisplayName(code);

    const getDepartmentNames = (ids?: number[]) => {
        if (!ids || ids.length === 0) return 'Chưa xác định';
        return ids.map(id => {
            const d = departments.find(dept => dept.id === id);
            return d ? d.name : `Khoa ${id}`;
        }).join(', ');
    };

    const checkSupervisorStatus = async (activityId: number) => {
        try {
            const studentProfile = await studentAPI.getMyProfile();
            const organizers = await preparationAPI.listOrganizers(activityId);
            const isSup = organizers.some(o => o.studentId === studentProfile.id && o.prepSupervisor);
            setIsSupervisor(isSup);
        } catch (err) {
            console.error('Error checking supervisor status:', err);
            setIsSupervisor(false);
        }
    };

    const loadMinigame = async (activityId: number) => {
        try {
            setLoadingMinigame(true);
            const minigameResponse = await minigameAPI.getMiniGameByActivity(activityId);
            if (minigameResponse.status && minigameResponse.data) {
                setMinigame(minigameResponse.data);
            } else {
                setMinigame(null);
            }
        } catch (err) {
            console.error('Error loading minigame for activity:', err);
            setMinigame(null);
        } finally {
            setLoadingMinigame(false);
        }
    };

    const loadTasksByActivity = async (activityId: number) => {
        try {
            setLoadingTasks(true);
            // Tải tất cả task của activity này từ BE (lọc server-side), tìm assignment của student hiện tại.
            const tasksRes = await taskAPI.getTasksByActivity(activityId);
            if (tasksRes.status && tasksRes.data) {
                const studentProfile = await studentAPI.getMyProfile();
                const studentId = studentProfile.id;
                const myAssignments = tasksRes.data
                    .map((t: ActivityTaskResponse) =>
                        t.assignments?.find((a: any) => a.studentId === studentId)
                    )
                    .filter(Boolean) as TaskAssignmentResponse[];
                setTasks(myAssignments);
                // Pre-load submissions cho tất cả task để hiển thị trạng thái nộp bài.
                const results = await Promise.allSettled(
                    myAssignments.map((a: TaskAssignmentResponse) => submissionAPI.getMySubmissionForTask(a.taskId))
                );
                const submissionsMap: Record<number, TaskSubmissionResponse | null> = {};
                results.forEach((res, idx) => {
                    const taskId = myAssignments[idx].taskId;
                    if (res.status === 'fulfilled' && res.value.status && res.value.data) {
                        submissionsMap[taskId] = res.value.data;
                    } else {
                        submissionsMap[taskId] = null;
                    }
                });
                setMySubmissionsByTask(submissionsMap);
            } else {
                setTasks([]);
                setMySubmissionsByTask({});
            }
        } catch (e) {
            console.error('Error loading assigned tasks for activity:', e);
            setTasks([]);
            setMySubmissionsByTask({});
        } finally {
            setLoadingTasks(false);
        }
    };

    const checkRegistrationStatus = async (eventId: number) => {
        try {
            // P7-2: song song /check/{id} (ticketCode) + /registration-status (canCancel).
            const [registrationData, statusData] = await Promise.all([
                registrationAPI.checkRegistrationStatus(eventId),
                registrationAPI.getActivityRegistrationStatus(eventId).catch(() => null)
            ]);
            setRegistration(registrationData);
            setRegStatus(statusData);
        } catch (err) {
            console.error('Error checking registration status:', err);
            setRegistration(null);
            setRegStatus(null);
        }
    };

    const loadMyRegistrations = async () => {
        try {
            // P7-5: tái dùng /my để build cache đã huỷ (chặn re-register).
            const myRegs = await registrationAPI.getMyRegistrations();
            setMyRegistrations(myRegs || []);
        } catch (err) {
            console.error('Error loading my registrations:', err);
            setMyRegistrations([]);
        }
    };

    const isCancelledBefore = (activityId: number) => hasCancelledBefore(activityId, myRegistrations);

    const handleRegister = async () => {
        if (!event) return;

        const requestData = {
            activityId: event.id,
            feedback: feedback || undefined
        };

        console.log('Registration request data:', requestData);
        console.log('Event data:', event);

        try {
            const response = await registrationAPI.registerForActivity(requestData);
            console.log('Registration response:', response);

            if (response) {
                // Store full registration response which includes ticketCode
                setRegistration(response);
                setShowRegistrationForm(false);
                // P7-5: refresh reg-status + /my cache sau khi đăng ký thành công.
                await Promise.all([
                    checkRegistrationStatus(event.id),
                    loadMyRegistrations()
                ]);

                if (response.status === RegistrationStatus.APPROVED) {
                    alert('Đăng ký thành công! Bạn đã được duyệt tự động.');
                } else {
                    alert('Đăng ký thành công! Vui lòng chờ phê duyệt.');
                }
            }
        } catch (err: any) {
            console.error('Registration error details:', err);
            console.error('Error response:', err.response?.data);
            // P7-5: safety net — /my chưa kịp refetch thì BE vẫn chặn re-register.
            alert('Có lỗi xảy ra khi đăng ký: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCancelRegistration = async () => {
        if (!event) return;

        // Hiển thị thông báo xác nhận
        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn hủy đăng ký sự kiện này?\n\n' +
            '⚠️ Lưu ý: Sau khi hủy, bạn sẽ không thể đăng ký lại sự kiện này.'
        );

        if (!confirmed) {
            return; // Người dùng không xác nhận, không làm gì
        }

        try {
            await registrationAPI.cancelRegistration(event.id);
            // P7-5: refresh registration-status + /my cache để chặn re-register chính xác.
            await Promise.all([
                checkRegistrationStatus(event.id),
                loadMyRegistrations()
            ]);
            alert('Hủy đăng ký thành công!');
        } catch (err: any) {
            alert('Có lỗi xảy ra khi hủy đăng ký: ' + (err.response?.data?.message || err.message));
            console.error('Error canceling registration:', err);
        }
    };

    // Removed manual participation recording - now handled by manager check-in


    const getTypeLabel = (type: ActivityType | null) => {
        if (!type) return 'N/A';
        const labels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return labels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType | null | undefined) => {
        if (!scoreType) return 'N/A';
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[scoreType] || scoreType;
    };

    const getStatusLabel = (status: RegistrationStatus) => {
        const labels: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'Chờ duyệt',
            [RegistrationStatus.APPROVED]: 'Đã duyệt',
            [RegistrationStatus.REJECTED]: 'Từ chối',
            [RegistrationStatus.CANCELLED]: 'Đã hủy',
            [RegistrationStatus.ATTENDED]: 'Đã tham dự',
            [RegistrationStatus.WAITLIST]: 'Danh sách chờ'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: RegistrationStatus) => {
        const colors: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
            [RegistrationStatus.APPROVED]: 'bg-green-100 text-green-800',
            [RegistrationStatus.REJECTED]: 'bg-red-100 text-red-800',
            [RegistrationStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
            [RegistrationStatus.ATTENDED]: 'bg-blue-100 text-blue-800',
            [RegistrationStatus.WAITLIST]: 'bg-purple-100 text-purple-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getEventStatus = () => {
        if (!event) return 'UNKNOWN';
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (now < startDate) return 'UPCOMING';
        if (now >= startDate && now <= endDate) return 'ONGOING';
        return 'ENDED';
    };

    const canRegister = () => {
        if (!event) return false;
        // P7-5: đã huỷ trước đó → không cho đăng ký lại (safety net ở BE).
        if (isCancelledBefore(event.id)) return false;
        // Đã đăng ký rồi nếu có registration với status APPROVED, PENDING, hoặc ATTENDED,
        // hoặc BE trả isRegistered:true qua /registration-status.
        if (registration) {
            const registeredStatuses = [
                RegistrationStatus.APPROVED,
                RegistrationStatus.PENDING,
                RegistrationStatus.ATTENDED
            ];
            if (registeredStatuses.includes(registration.status)) {
                return false; // Đã đăng ký rồi (bao gồm cả ATTENDED)
            }
        }
        if (regStatus?.isRegistered === true) return false;

        const now = new Date();
        const registrationStartDate = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
        const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

        // Kiểm tra thời gian đăng ký
        if (registrationStartDate && now < registrationStartDate) {
            return false; // Chưa đến thời gian mở đăng ký
        }
        if (registrationDeadline && now > registrationDeadline) {
            return false; // Đã hết hạn đăng ký
        }

        // Kiểm tra sự kiện chưa kết thúc
        const eventStatus = getEventStatus();
        return eventStatus === 'UPCOMING' || eventStatus === 'ONGOING';
    };

    const canStartQuiz = () => {
        if (!event || !minigame) return false;
        // Chỉ cho làm quiz nếu đã đăng ký sự kiện
        // Với MINIGAME, ATTENDED cũng được coi là đã đăng ký (cho phép làm quiz lại)
        if (!registration) return false;

        const allowedStatuses = [
            RegistrationStatus.APPROVED,
            RegistrationStatus.PENDING,
            RegistrationStatus.ATTENDED
        ];
        if (!allowedStatuses.includes(registration.status)) {
            return false;
        }

        // Áp dụng thêm điều kiện thời gian: chỉ khi sự kiện đang diễn ra
        const eventStatus = getEventStatus();
        return eventStatus === 'ONGOING' || eventStatus === 'UPCOMING';
    };

    const canCancel = () => {
        // P7-2: dùng canCancel từ BE (/registration-status) thay vì tự tính (line 413, L715).
        return regStatus?.canCancel === true && event?.seriesId == null;
    };

    const canRecordParticipation = () => {
        if (!event) return false;
        const eventStatus = getEventStatus();
        return eventStatus === 'ONGOING' && registration?.status === RegistrationStatus.APPROVED;
    };

    const openSubmissionModal = async (task: TaskAssignmentResponse) => {
        setSelectedTask(task);
        setShowSubmissionModal(true);
        setMySubmission(null);
        setSubmitContent('');
        setSubmitFiles([]);
        setSubmitImages([]);
        setFilePreviews([]);
        setImagePreviews([]);
        // Dùng pre-loaded submission nếu có.
        const cached = mySubmissionsByTask[task.taskId];
        if (cached) {
            setMySubmission(cached);
            setSubmitContent(cached.content || '');
            const attachments = getSubmissionAttachments(cached);
            setFilePreviews(attachments.filter((attachment: { type: string }) => attachment.type === 'file').map((attachment: { url: string }) => attachment.url));
            setImagePreviews(attachments.filter((attachment: { type: string }) => attachment.type === 'image').map((attachment: { url: string }) => attachment.url));
        } else {
            try {
                const res = await submissionAPI.getMySubmissionForTask(task.taskId);
                if (res.status && res.data) {
                    setMySubmission(res.data);
                    setSubmitContent(res.data.content || '');
                    const attachments = getSubmissionAttachments(res.data);
                    setFilePreviews(attachments.filter((attachment: { type: string }) => attachment.type === 'file').map((attachment: { url: string }) => attachment.url));
                    setImagePreviews(attachments.filter((attachment: { type: string }) => attachment.type === 'image').map((attachment: { url: string }) => attachment.url));
                }
            } catch (e) {
                console.warn('No existing submission or failed to fetch:', e);
            }
        }
    };

    const closeSubmissionModal = () => {
        setShowSubmissionModal(false);
        setSelectedTask(null);
        setMySubmission(null);
        setSubmitContent('');
        setSubmitFiles([]);
        setSubmitImages([]);
        setFilePreviews([]);
        setImagePreviews([]);
        setSelectedImagePreview(null);
        // Refresh submissions cache for task cards.
        loadTasksByActivity(event!.id);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSubmitFiles(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setFilePreviews(previews);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSubmitImages(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const getSubmissionAttachments = (submission: TaskSubmissionResponse): SubmissionAttachment[] => {
        if (submission.attachments && submission.attachments.length > 0) {
            return submission.attachments;
        }

        return (submission.fileUrls || []).map((url) => ({
            url,
            type: 'file' as const,
        }));
    };

    const handleDownload = async (fileUrl: string) => {
        try {
            const filename = (fileUrl.split('/').pop() || 'file').trim();
            const resp = await api.get(fileUrl, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error('Download failed', e);
            alert('Tải file thất bại. Vui lòng thử lại.');
        }
    };

    const handleSubmitTask = async () => {
        if (!selectedTask) return;
        setSubmitting(true);
        try {
            if (mySubmission) {
                const res = await submissionAPI.updateSubmission(mySubmission.id, {
                    content: submitContent || undefined,
                    files: submitFiles.length > 0 ? submitFiles : undefined,
                    images: submitImages.length > 0 ? submitImages : undefined,
                });
                if (!res.status) throw new Error(res.message || 'Cập nhật bài nộp thất bại');
                alert('Cập nhật bài nộp thành công');
            } else {
                const res = await submissionAPI.submitTask(selectedTask.taskId, {
                    content: submitContent || undefined,
                    files: submitFiles.length > 0 ? submitFiles : undefined,
                    images: submitImages.length > 0 ? submitImages : undefined,
                });
                if (!res.status) throw new Error(res.message || 'Nộp bài thất bại');
                alert('Nộp bài thành công');
            }
            // Refresh my submission
            const latest = await submissionAPI.getMySubmissionForTask(selectedTask.taskId);
            if (latest.status && latest.data) {
                setMySubmission(latest.data);
                const attachments = getSubmissionAttachments(latest.data);
                setFilePreviews(attachments.filter((attachment) => attachment.type === 'file').map((attachment) => attachment.url));
                setImagePreviews(attachments.filter((attachment) => attachment.type === 'image').map((attachment) => attachment.url));
            }
            setSubmitFiles([]);
            setSubmitImages([]);
        } catch (e: any) {
            alert(e.message || 'Có lỗi xảy ra khi nộp bài');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout chatbotPageContext="ACTIVITY_DETAIL" chatbotContextActivityId={contextActivityId}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (error || !event) {
        return (
            <StudentLayout chatbotPageContext="ACTIVITY_DETAIL" chatbotContextActivityId={contextActivityId}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6">{error || 'Không tìm thấy sự kiện'}</p>
                        <button
                            onClick={() => navigate('/student/events')}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const eventStatus = getEventStatus();

    return (
        <StudentLayout chatbotPageContext="ACTIVITY_DETAIL" chatbotContextActivityId={event?.id ?? contextActivityId}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Info Hero Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden relative">
                            <EventBannerImage
                                bannerUrl={event.bannerUrl}
                                alt={`Banner ${event.name}`}
                                wrapperClassName="relative bg-gray-200"
                                imageClassName="h-64 sm:h-80 w-full object-cover"
                            />
                            
                            <div className="p-8 relative">
                                <div className="absolute top-0 right-8 -translate-y-1/2 flex items-center gap-2 flex-wrap justify-end max-w-[70%]">
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-md ${
                                        eventStatus === 'UPCOMING' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                        eventStatus === 'ONGOING' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                        'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                        {eventStatus === 'UPCOMING' ? '⏳ Sắp diễn ra' :
                                            eventStatus === 'ONGOING' ? '🔥 Đang diễn ra' : '✅ Đã kết thúc'}
                                    </span>
                                    {registration && (
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-md border border-white ${getStatusColor(registration.status)}`}>
                                            {getStatusLabel(registration.status)}
                                        </span>
                                    )}
                                    {isSupervisor && (
                                        <span className="px-4 py-1.5 rounded-full text-sm font-bold shadow-md bg-purple-100 text-purple-800 border border-purple-200">
                                            🛡️ Giám sát viên
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 mb-4 flex-wrap mt-2">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                                        {getTypeLabel(event.type)}
                                    </span>
                                    {event.isImportant && (
                                        <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-100 flex items-center gap-1">
                                            ⭐ Quan trọng
                                        </span>
                                    )}
                                    {event.seriesId && (
                                        <Link 
                                            to={`/student/series/${event.seriesId}`}
                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                        >
                                            📋 Thuộc chuỗi sự kiện {event.seriesOrder && `(#${event.seriesOrder})`}
                                        </Link>
                                    )}
                                </div>

                                <h1 className="text-3xl font-extrabold text-stone-900 mb-4 leading-snug">{event.name}</h1>
                                <p className="text-stone-600 text-lg leading-relaxed mb-6">{event.description || "Chưa có mô tả"}</p>
                            </div>
                        </div>

                        {/* Additional Information */}
                        {(event.benefits || event.requirements || event.contactInfo) && (
                            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
                                <h3 className="text-lg font-bold text-stone-900 mb-5 flex items-center gap-2">
                                    <span className="text-xl">✨</span> Thông tin bổ sung
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {event.benefits && (
                                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">🎁 Quyền lợi</h4>
                                            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{event.benefits}</p>
                                        </div>
                                    )}
                                    {event.requirements && (
                                        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                                            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-2">📋 Yêu cầu</h4>
                                            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{event.requirements}</p>
                                        </div>
                                    )}
                                    {event.contactInfo && (
                                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">📞 Liên hệ</h4>
                                            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{event.contactInfo}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Event Properties + Time & Location (side-by-side below Additional Info) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Event Properties */}
                            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-lg">⚙️</div>
                                    <h3 className="text-base font-bold text-stone-900">Thông số sự kiện</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Đơn vị tổ chức</span>
                                        <span className="text-xs font-bold text-stone-900 text-right max-w-[55%] leading-snug">{getDepartmentNames(event.organizerIds)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Loại sự kiện</span>
                                        <span className="text-xs font-bold text-stone-900">{getTypeLabel(event.type)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Số lượng vé</span>
                                        <span className="text-xs font-bold text-stone-900 tabular-nums">{formatTicketQuantityLabel(event.ticketQuantity)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Bắt buộc khoa</span>
                                        <span className="text-xs font-bold text-stone-900">{event.mandatoryForFacultyStudents ? 'Có' : 'Không'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Yêu cầu nộp bài</span>
                                        <span className="text-xs font-bold text-stone-900">{event.requiresSubmission ? 'Có' : 'Không'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-1">
                                        <span className="text-xs text-stone-500 font-medium">Duyệt đăng ký</span>
                                        <span className="text-xs font-bold text-stone-900">{event.requiresApproval ? 'Cần duyệt' : 'Tự động'}</span>
                                    </div>
                                    {event.presetCode && event.presetCode !== 'CUSTOM' && (
                                        <div className="pt-1 border-t border-stone-100">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {translatePreset(event.presetCode)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Time & Location */}
                            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">📅</div>
                                    <h3 className="text-base font-bold text-stone-900">Thời gian & Địa điểm</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Bắt đầu</span>
                                        <span className="text-xs font-bold text-stone-900 text-right">{new Date(event.startDate).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Kết thúc</span>
                                        <span className="text-xs font-bold text-stone-900 text-right">{new Date(event.endDate).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                                        <span className="text-xs text-stone-500 font-medium">Địa điểm</span>
                                        <span className="text-xs font-bold text-stone-900 text-right max-w-[55%] leading-snug">{event.location || 'Chưa cập nhật'}</span>
                                    </div>
                                    {event.registrationStartDate && (
                                        <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                                            <span className="text-xs text-stone-500 font-medium">Mở đăng ký</span>
                                            <span className="text-xs font-bold text-green-700 text-right">{new Date(event.registrationStartDate).toLocaleString('vi-VN')}</span>
                                        </div>
                                    )}
                                    {event.registrationDeadline && (
                                        <div className="flex justify-between items-start pb-1">
                                            <span className="text-xs text-stone-500 font-medium">Hạn đăng ký</span>
                                            <span className="text-xs font-bold text-orange-600 text-right">{new Date(event.registrationDeadline).toLocaleString('vi-VN')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {seriesProgress && (
                            <div>
                                <SeriesProgressBanner progress={seriesProgress} />
                            </div>
                        )}

                        {/* Actions Card */}
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-[#001C44] to-[#002A66] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">🎟️</div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Thao tác</h3>
                                    <p className="text-xs text-blue-200">Quản lý tham gia sự kiện</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-wrap gap-3">
                                    {canRegister() && (
                                        <button
                                            onClick={() => setShowRegistrationForm(true)}
                                            className="px-6 py-2.5 bg-[#FFD66D] hover:bg-[#FFC947] text-[#001C44] rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                        >
                                            ✅ Đăng ký tham gia
                                        </button>
                                    )}

                                    {!canRegister() && event && isCancelledBefore(event.id) && !registration && (
                                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                            ℹ️ Bạn đã huỷ đăng ký và không thể đăng ký lại.
                                        </div>
                                    )}

                                    {canCancel() && (
                                        <button
                                            onClick={handleCancelRegistration}
                                            className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                                        >
                                            ❌ Hủy đăng ký
                                        </button>
                                    )}

                                    {registration?.status === RegistrationStatus.APPROVED && !canCancel() && getEventStatus() === 'UPCOMING' && (
                                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            ✅ Đã được duyệt — không thể hủy
                                        </div>
                                    )}

                                    {isSupervisor && (
                                        <button
                                            onClick={() => navigate(`/manager/preparation/${event.id}`)}
                                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                        >
                                            🛡️ Giao diện Supervisor
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Minigame Quiz Section (only for MINIGAME activities) */}
                        {event.type === ActivityType.MINIGAME && (
                            <div className="card">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-[#001C44]">
                                            Quiz Mini Game
                                        </h3>
                                        {loadingMinigame && (
                                            <span className="text-xs text-gray-500">Đang tải quiz...</span>
                                        )}
                                    </div>

                                    {minigame ? (
                                        <>
                                            <p className="text-sm text-gray-700 mb-3">
                                                <span className="font-medium">{minigame.title}</span>
                                            </p>
                                            {minigame.description && (
                                                <p className="text-sm text-gray-600 mb-4">
                                                    {minigame.description}
                                                </p>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500">Số câu hỏi</span>
                                                    <span className="font-semibold">
                                                        {minigame.questionCount}
                                                    </span>
                                                </div>
                                                {minigame.timeLimit && (
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500">Thời gian</span>
                                                        <span className="font-semibold">
                                                            {Math.floor(minigame.timeLimit / 60)} phút
                                                        </span>
                                                    </div>
                                                )}

                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                {registration ? (
                                                    <button
                                                        type="button"
                                                        disabled={!canStartQuiz()}
                                                        onClick={() => navigate(`/student/minigames/${event.id}/play`)}
                                                        className={`btn-yellow px-6 py-2 rounded-lg text-sm font-medium ${!canStartQuiz()
                                                            ? 'opacity-60 cursor-not-allowed'
                                                            : ''
                                                            }`}
                                                    >
                                                        Làm quiz
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="btn-yellow px-6 py-2 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed"
                                                    >
                                                        Vui lòng đăng ký sự kiện để làm quiz
                                                    </button>
                                                )}

                                                {!registration && (
                                                    <p className="text-xs text-gray-500">
                                                        Bạn cần đăng ký sự kiện trước khi có thể làm quiz.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            Chưa cấu hình quiz cho minigame này. Vui lòng liên hệ quản trị viên.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Photo Gallery Section - Only show if event has ended */}
                        {event && new Date(event.endDate) < new Date() && (
                            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-[#001C44] to-[#002A66] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">📸</div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">Hình ảnh sự kiện</h3>
                                            <p className="text-xs text-blue-200">
                                                {loadingPhotos ? 'Đang tải...' : photos.length > 0 ? `${photos.length} ảnh` : 'Chưa có ảnh'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {loadingPhotos ? (
                                        <div className="text-center py-12 text-stone-400">
                                            <div className="text-4xl mb-3">⏳</div>
                                            <p className="text-sm">Đang tải ảnh...</p>
                                        </div>
                                    ) : photos.length === 0 ? (
                                        <div className="text-center py-12 text-stone-400">
                                            <div className="text-4xl mb-3">🖼️</div>
                                            <p className="text-sm">Chưa có ảnh nào được tải lên</p>
                                        </div>
                                    ) : (
                                        <PhotoGrid
                                            photos={photos}
                                            canManage={false}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Event Tasks and Submission (Student) */}
                        {tasks.length > 0 && (
                            <div className="card">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-[#001C44]">Danh sách nhiệm vụ</h3>
                                    </div>
                                    {loadingTasks ? (
                                        <p className="text-sm text-gray-500">Đang tải nhiệm vụ...</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {tasks.map((t) => {
                                                const mySubmission = mySubmissionsByTask[t.taskId] || null;
                                                const isGraded = mySubmission?.status === 'GRADED' || mySubmission?.isCompleted || mySubmission?.gradedAt != null;
                                                return (
                                                    <div key={t.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                                                        <div className="p-4">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start gap-3 mb-2">
                                                                        <div className="w-10 h-10 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-center text-lg text-white shadow-md flex-shrink-0">
                                                                            📝
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h3 className="text-base font-bold text-gray-900 truncate">
                                                                                {t.taskName}
                                                                                {t.requiresSubmission === false && (
                                                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                                                        Tùy chọn
                                                                                    </span>
                                                                                )}
                                                                            </h3>
                                                                        </div>
                                                                    </div>

                                                                    {t.submissionDeadline && t.requiresSubmission !== false && (
                                                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                                            t.status === 'OVERDUE' 
                                                                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                        }`}>
                                                                            <span className="mr-1">⏰</span>
                                                                            Hạn: {new Date(t.submissionDeadline).toLocaleString('vi-VN')}
                                                                            {t.status === 'OVERDUE' && <span className="ml-1 font-bold">(Quá hạn)</span>}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                                                                        t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                        t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                                        t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                        t.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {t.status === 'PENDING' ? 'Chờ xử lý' :
                                                                         t.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                                                                         t.status === 'COMPLETED' ? 'Hoàn thành' :
                                                                         t.status === 'OVERDUE' ? 'Quá hạn' :
                                                                         t.status}
                                                                    </span>

                                                                    {mySubmission ? (
                                                                        isGraded ? (
                                                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                                                                                ✅ Đã nộp (Đã chấm)
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => openSubmissionModal(t)}
                                                                                className="px-4 py-1.5 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#001C44] font-semibold shadow-md hover:shadow-lg transition-all text-xs"
                                                                            >
                                                                                📄 Đã nộp
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => openSubmissionModal(t)}
                                                                            disabled={t.requiresSubmission === false}
                                                                            className="px-4 py-1.5 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#001C44] font-semibold shadow-md hover:shadow-lg transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            📤 Nộp bài
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Score Rules Card — replaces duplicate "Thông tin sự kiện" */}
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">🎯</div>
                                <h3 className="text-lg font-bold text-stone-900">Luật tính điểm</h3>
                            </div>
                            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                                {event.seriesId ? (
                                    <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                        ℹ️ Thuộc chuỗi sự kiện. Điểm tính theo tiến độ chuỗi.
                                    </div>
                                ) : (
                                    <>
                                        {event.presetCode && event.presetCode !== 'CUSTOM' && (
                                            <div className="mb-3 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                {translatePreset(event.presetCode)}
                                            </div>
                                        )}
                                        <ScoreRulesDisplay rules={event.scoreRules} hideTitle />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Registration Status */}
                        {registration && (
                            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl">📋</div>
                                    <h3 className="text-lg font-bold text-stone-900">Trạng thái đăng ký</h3>
                                </div>
                                <div className="flex justify-center">
                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getStatusColor(registration.status)}`}>
                                        {getStatusLabel(registration.status)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* QR Code for Check-in */}
                        {registration && registration.status === RegistrationStatus.APPROVED && registration.ticketCode && (
                            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-xl">🎫</div>
                                    <h3 className="text-lg font-bold text-stone-900">Mã vé tham gia</h3>
                                </div>
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="bg-white p-4 rounded-2xl border-2 border-stone-200 shadow-inner">
                                        <QRCodeSVG
                                            value={registration.ticketCode}
                                            size={180}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-stone-500 mb-1">Mã vé</p>
                                        <p className="text-base font-bold text-stone-900 font-mono tracking-wider">{registration.ticketCode}</p>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 w-full">
                                        <h4 className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide">Hướng dẫn check-in</h4>
                                        <ul className="text-xs text-blue-800 space-y-1">
                                            <li>• <strong>Lần 1:</strong> Check-in khi đến</li>
                                            <li>• <strong>Lần 2:</strong> Check-out khi rời</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submission Modal */}
                {showSubmissionModal && selectedTask && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Nộp bài: {selectedTask.taskName}</h3>
                                <button onClick={closeSubmissionModal} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {mySubmission && (
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubmissionStatusColor(mySubmission.status)}`}>
                                    {getSubmissionStatusLabel(mySubmission.status)}
                                </div>
                            )}
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung (tùy chọn)</label>
                                    <textarea
                                        value={submitContent}
                                        onChange={(e) => setSubmitContent(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                        placeholder="Nhập nội dung nộp bài..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tệp đính kèm (tùy chọn)</label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                    />
                                    {filePreviews.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {filePreviews.map((url, idx) => (
                                                <button
                                                    key={`p-${idx}`}
                                                    type="button"
                                                    onClick={() => handleDownload(url)}
                                                    className="text-blue-600 text-sm hover:underline"
                                                >
                                                    {url.split('/').pop() || `file-${idx + 1}`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh minh chứng (tùy chọn)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                    />
                                    {imagePreviews.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {imagePreviews.map((url, idx) => (
                                                <button
                                                    key={`img-${idx}`}
                                                    type="button"
                                                    onClick={() => setSelectedImagePreview(url)}
                                                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-[#001C44]"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Minh chứng ${idx + 1}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                {mySubmission && (
                                    <button
                                        onClick={async () => {
                                            if (!mySubmission) return;
                                            const confirmed = window.confirm('Bạn có chắc muốn xóa bài nộp này?');
                                            if (!confirmed) return;
                                            try {
                                                const res = await submissionAPI.deleteSubmission(mySubmission.id);
                                                if (!res.status) throw new Error(res.message || 'Xóa bài nộp thất bại');
                                                setMySubmission(null);
                                                setSubmitContent('');
                                                setSubmitFiles([]);
                                                setSubmitImages([]);
                                                setFilePreviews([]);
                                                setImagePreviews([]);
                                                alert('Đã xóa bài nộp.');
                                            } catch (e: any) {
                                                alert(e.message || 'Có lỗi xảy ra khi xóa bài nộp');
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        Xóa bài nộp
                                    </button>
                                )}
                                <button onClick={closeSubmissionModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Hủy</button>
                                <button onClick={handleSubmitTask} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {mySubmission ? (submitting ? 'Đang cập nhật...' : 'Cập nhật bài nộp') : (submitting ? 'Đang nộp...' : 'Nộp bài')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedImagePreview && (
                    <div
                        className="fixed inset-0 z-[60] bg-black bg-opacity-80 flex items-center justify-center p-4"
                        onClick={() => setSelectedImagePreview(null)}
                    >
                        <img
                            src={selectedImagePreview}
                            alt="Xem trước minh chứng"
                            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
                        />
                    </div>
                )}

                {/* Registration Modal */}
                {showRegistrationForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Đăng ký tham gia sự kiện</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lời nhắn (tùy chọn)
                                    </label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                        placeholder="Nhập lời nhắn cho ban tổ chức..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowRegistrationForm(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleRegister}
                                        className="btn-yellow px-4 py-2 rounded-lg text-sm font-medium"
                                    >
                                        Đăng ký
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentEventDetail;
