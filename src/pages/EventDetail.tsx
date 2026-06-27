import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ActivityResponse, ActivityType, ScoreType } from '../types/activity';
import { ActivityTaskResponse, TaskAssignmentResponse, CreateActivityTaskRequest, TaskAssignmentRequest, TaskStatus } from '../types/task';
import { ActivityRegistrationResponse, RegistrationStatus, ActivityParticipationRequest, ParticipationType } from '../types/registration';
import { eventAPI } from '../services/eventAPI';
import { taskAPI } from '../services/taskAPI';
import { registrationAPI } from '../services/registrationAPI';
import { TaskList, TaskForm, TaskAssignmentsList } from '../components/tasks';

import { ScoreRulesDisplay } from '../components/events/ScoreRulesDisplay';
import SubmissionDetailsModal from '../components/task/SubmissionDetailsModal';
import { submissionAPI } from '../services/submissionAPI';
import { TaskAssignmentModal } from '../components/task/TaskAssignmentModal';
import { RegistrationForm, ParticipationForm } from '../components/registration';
import { useAuth } from '../contexts/AuthContext';
import { EventBannerImage, PhotoUploadForm, PhotoGrid } from '../components/events';
import { activityPhotoAPI } from '../services/activityPhotoAPI';
import { ActivityPhotoResponse } from '../types/activity';
import { minigameAPI } from '../services/minigameAPI';
import { MiniGame } from '../types/minigame';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';

const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const [tasks, setTasks] = useState<ActivityTaskResponse[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState<ActivityTaskResponse | null>(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ActivityTaskResponse | null>(null);
    const [showAssignments, setShowAssignments] = useState(false);
    const [taskAssignments, setTaskAssignments] = useState<TaskAssignmentResponse[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [showSubmissionDetailsModal, setShowSubmissionDetailsModal] = useState(false);
    const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<ActivityTaskResponse | null>(null);

    // Registration states
    const [registrationStatus, setRegistrationStatus] = useState<{ status: RegistrationStatus; registrationId?: number } | null>(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showParticipationForm, setShowParticipationForm] = useState(false);
    const [loadingRegistration, setLoadingRegistration] = useState(false);

    // Photo gallery states
    const [photos, setPhotos] = useState<ActivityPhotoResponse[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);

    // Minigame/Quiz states
    const [minigame, setMinigame] = useState<MiniGame | null>(null);
    const [loadingMinigame, setLoadingMinigame] = useState(false);

    // QR Code states
    const [showQrCode, setShowQrCode] = useState(false);
    const [backfilling, setBackfilling] = useState(false);
    const [showFullScreenQr, setShowFullScreenQr] = useState(false);

    const navigate = useNavigate();
    const refetch = async () => {
        if (!id) return;
        try {
            const response = await eventAPI.getEvent(parseInt(id));
            if (response.status && response.data) setEvent(response.data);
        } catch { }
    };

    const handlePublish = async () => {
        if (!event) return;
        if (!window.confirm('Công bố sự kiện này?')) return;
        const res = await eventAPI.publishActivity(event.id);
        if (res.status) {
            await refetch();
            alert('Đã công bố sự kiện');
        } else {
            alert(res.message || 'Không thể công bố');
        }
    };

    const handleUnpublish = async () => {
        if (!event) return;
        if (!window.confirm('Thu hồi công bố sự kiện này?')) return;
        const res = await eventAPI.unpublishActivity(event.id);
        if (res.status) {
            await refetch();
            alert('Đã thu hồi công bố');
        } else {
            alert(res.message || 'Không thể thu hồi');
        }
    };

    const handleCopy = async () => {
        if (!event) return;
        const val = window.prompt('Sao chép sự kiện. Nhập số ngày dịch (có thể bỏ trống):', '0');
        const offset = val === null || val.trim() === '' ? undefined : Number(val);
        const res = await eventAPI.copyActivity(event.id, isNaN(offset as any) ? undefined : offset);
        if (res.status && res.data) {
            alert('Đã tạo bản sao sự kiện');
            navigate(`/manager/events/${res.data.id}`);
        } else {
            alert(res.message || 'Không thể sao chép sự kiện');
        }
    };

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) {
                setError('ID sự kiện không hợp lệ');
                setLoading(false);
                return;
            }

            try {
                const response = await eventAPI.getEvent(parseInt(id));
                if (response.status && response.data) {
                    setEvent(response.data);
                } else {
                    setError('Không tìm thấy sự kiện');
                }
            } catch (err: any) {
                console.error('Error fetching event:', err);
                setError('Có lỗi xảy ra khi tải thông tin sự kiện');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
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
                if (response.status && response.data) {
                    setPhotos(response.data);
                }
            } catch (err) {
                console.error('Error loading photos:', err);
            } finally {
                setLoadingPhotos(false);
            }
        };

        loadPhotos();
    }, [event, id]);

    // Check registration status for students
    useEffect(() => {
        const checkRegistrationStatus = async () => {
            if (!id || !user || user.role !== 'STUDENT') return;

            try {
                const status = await registrationAPI.checkRegistrationStatus(parseInt(id));
                setRegistrationStatus(status);
            } catch (error) {
                console.error('Error checking registration status:', error);
            }
        };

        checkRegistrationStatus();
    }, [id, user]);

    // Load tasks when event is loaded (only if not MINIGAME)
    useEffect(() => {
        if (event && event.type !== ActivityType.MINIGAME) {
            loadTasks();
        }
    }, [event]);

    // Load minigame/quiz when event is loaded (only if MINIGAME)
    useEffect(() => {
        if (event && event.type === ActivityType.MINIGAME) {
            loadMinigame();
        }
    }, [event]);

    const loadTasks = async () => {
        if (!event) return;

        setLoadingTasks(true);
        try {
            const response = await taskAPI.getTasksByActivity(event.id);
            if (response.status && response.data) {
                // Optionally enrich tasks with requiresSubmission info from activity
                const enriched = (response.data || []).map(t => ({ ...t, requiresSubmission: event.requiresSubmission }));
                setTasks(enriched);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const loadMinigame = async () => {
        if (!event) return;

        setLoadingMinigame(true);
        try {
            const response = await minigameAPI.getMiniGameByActivity(event.id);
            if (response.status && response.data) {
                setMinigame(response.data);
            } else {
                setMinigame(null);
            }
        } catch (error) {
            console.error('Error loading minigame:', error);
            setMinigame(null);
        } finally {
            setLoadingMinigame(false);
        }
    };

    // Photo gallery handlers
    const handleDeletePhoto = async (photoId: number) => {
        if (!event || !id) return;
        try {
            const response = await activityPhotoAPI.deletePhoto(parseInt(id), photoId);
            if (response.status) {
                // Reload photos
                const photosResponse = await activityPhotoAPI.getActivityPhotos(parseInt(id));
                if (photosResponse.status && photosResponse.data) {
                    setPhotos(photosResponse.data);
                }
                alert('Đã xóa ảnh');
            } else {
                alert(response.message || 'Không thể xóa ảnh');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Có lỗi xảy ra khi xóa ảnh');
        }
    };

    const handleReorderPhoto = async (photoId: number, newOrder: number) => {
        if (!event || !id) return;
        try {
            const response = await activityPhotoAPI.updatePhotoOrder(parseInt(id), photoId, newOrder);
            if (response.status) {
                // Reload photos
                const photosResponse = await activityPhotoAPI.getActivityPhotos(parseInt(id));
                if (photosResponse.status && photosResponse.data) {
                    setPhotos(photosResponse.data);
                }
            } else {
                alert(response.message || 'Không thể cập nhật thứ tự');
            }
        } catch (error) {
            console.error('Error reordering photo:', error);
            alert('Có lỗi xảy ra khi cập nhật thứ tự');
        }
    };

    const handleUploadSuccess = async () => {
        if (!id) return;
        setShowUploadForm(false);
        // Reload photos
        try {
            const response = await activityPhotoAPI.getActivityPhotos(parseInt(id));
            if (response.status && response.data) {
                setPhotos(response.data);
            }
        } catch (error) {
            console.error('Error reloading photos:', error);
        }
    };

    // QR Code handlers
    const handleBackfillCheckInCodes = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn tạo checkInCode cho tất cả các sự kiện chưa có? Thao tác này có thể mất một chút thời gian.')) {
            return;
        }
        setBackfilling(true);
        try {
            const response = await eventAPI.backfillCheckInCodes();
            if (response.status && response.data) {
                toast.success(`Đã tạo checkInCode cho ${response.data.updatedCount}/${response.data.totalActivities} sự kiện`);
                await refetch(); // Reload event to get new checkInCode
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi tạo checkInCode');
            }
        } catch (error: any) {
            console.error('Error backfilling checkInCodes:', error);
            toast.error('Có lỗi xảy ra khi tạo checkInCode');
        } finally {
            setBackfilling(false);
        }
    };

    const handleCopyCheckInCode = () => {
        if (event?.checkInCode) {
            navigator.clipboard.writeText(event.checkInCode);
            toast.success('Đã sao chép mã QR code');
        }
    };

    const handlePrintQrCode = () => {
        if (!event?.checkInCode) return;

        // Tạo một cửa sổ mới để in
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${event.name}</title>
                <style>
                    @media print {
                        @page {
                            margin: 20mm;
                            size: A4;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    }
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 20px;
                        text-align: center;
                    }
                    .qr-container {
                        background: white;
                        padding: 40px;
                        border: 2px solid #001C44;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .qr-title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #001C44;
                        margin-bottom: 20px;
                    }
                    .qr-code {
                        margin: 20px 0;
                    }
                    .qr-code-text {
                        font-family: monospace;
                        font-size: 16px;
                        color: #333;
                        margin-top: 20px;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 5px;
                    }
                    .qr-event-name {
                        font-size: 18px;
                        color: #666;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div class="qr-title">QR Code Check-in</div>
                    <div class="qr-event-name">${event.name}</div>
                    <div class="qr-code" id="qr-code-placeholder"></div>
                    <div class="qr-code-text">Mã: ${event.checkInCode}</div>
                </div>
                <script>
                    // Tạo QR code bằng cách sử dụng API hoặc thư viện
                    // Tạm thời sử dụng URL của QR code service
                    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent('${event.checkInCode}');
                    document.getElementById('qr-code-placeholder').innerHTML = '<img src="' + qrUrl + '" alt="QR Code" />';
                    
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Không thể mở cửa sổ in. Vui lòng cho phép popup.');
            return;
        }

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const handleCreateTask = async (data: CreateActivityTaskRequest) => {
        try {
            const response = await taskAPI.createTaskNew(data);
            if (response.status) {
                setShowTaskForm(false);
                loadTasks(); // Reload tasks
                alert('Tạo nhiệm vụ thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo nhiệm vụ');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Có lỗi xảy ra khi tạo nhiệm vụ');
        }
    };

    const handleUpdateTask = async (data: CreateActivityTaskRequest) => {
        if (!editingTask) return;

        try {
            const response = await taskAPI.updateTaskNew(editingTask.id, data);
            if (response.status) {
                setShowTaskForm(false);
                setEditingTask(null);
                loadTasks(); // Reload tasks
                alert('Cập nhật nhiệm vụ thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật nhiệm vụ');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Có lỗi xảy ra khi cập nhật nhiệm vụ');
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
            return;
        }

        try {
            const response = await taskAPI.deleteTaskNew(taskId);
            if (response.status) {
                loadTasks(); // Reload tasks
                alert('Xóa nhiệm vụ thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa nhiệm vụ');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Có lỗi xảy ra khi xóa nhiệm vụ');
        }
    };

    const handleAssignTask = async (data: TaskAssignmentRequest) => {
        try {
            const response = await taskAPI.assignTaskNew(data);
            if (response.status) {
                setShowAssignmentModal(false);
                setSelectedTask(null);
                loadTasks(); // Reload tasks to update assignment counts
                alert(`Phân công nhiệm vụ thành công cho ${data.studentIds.length} sinh viên!`);
            } else {
                alert(response.message || 'Có lỗi xảy ra khi phân công nhiệm vụ');
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Có lỗi xảy ra khi phân công nhiệm vụ');
        }
    };

    const handleViewAssignments = async (task: ActivityTaskResponse) => {
        setSelectedTask(task);
        setLoadingAssignments(true);
        try {
            const response = await taskAPI.getTaskAssignmentsNew(task.id);
            if (response.status && response.data) {
                setTaskAssignments(response.data);
                setShowAssignments(true);
            } else {
                alert(response.message || 'Có lỗi xảy ra khi lấy danh sách phân công');
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            alert('Có lỗi xảy ra khi lấy danh sách phân công');
        } finally {
            setLoadingAssignments(false);
        }
    };

    const handleViewSubmissions = (task: ActivityTaskResponse) => {
        setSelectedTaskForSubmission(task);
        setShowSubmissionDetailsModal(true);
    };

    const handleUpdateAssignmentStatus = async (assignmentId: number, status: TaskStatus) => {
        try {
            const response = await taskAPI.updateTaskStatus(assignmentId, status);
            if (response.status) {
                // Reload assignments
                if (selectedTask) {
                    handleViewAssignments(selectedTask);
                }
                alert('Cập nhật trạng thái thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Error updating assignment status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const handleRemoveAssignment = async (assignmentId: number) => {
        try {
            const response = await taskAPI.removeTaskAssignment(assignmentId);
            if (response.status) {
                // Reload assignments
                if (selectedTask) {
                    handleViewAssignments(selectedTask);
                }
                loadTasks(); // Reload tasks to update counts
                alert('Hủy phân công thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi hủy phân công');
            }
        } catch (error) {
            console.error('Error removing assignment:', error);
            alert('Có lỗi xảy ra khi hủy phân công');
        }
    };

    const handleAutoAssign = async () => {
        if (!event) return;

        if (!window.confirm('Bạn có chắc chắn muốn tự động phân công tất cả nhiệm vụ cho sinh viên thuộc các khoa tổ chức?')) {
            return;
        }

        try {
            const response = await taskAPI.autoAssignMandatoryTasks(event.id);
            if (response.status) {
                loadTasks(); // Reload tasks
                alert(response.message || 'Tự động phân công thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tự động phân công');
            }
        } catch (error) {
            console.error('Error auto-assigning tasks:', error);
            alert('Có lỗi xảy ra khi tự động phân công');
        }
    };

    // Registration handlers
    const handleRegister = async (data: any) => {
        if (!event) return;

        try {
            setLoadingRegistration(true);
            await registrationAPI.registerForActivity({
                activityId: event.id,
                feedback: data.feedback
            });
            setShowRegistrationForm(false);
            // Reload registration status
            const status = await registrationAPI.checkRegistrationStatus(event.id);
            setRegistrationStatus(status);
            alert('Đăng ký thành công! Vui lòng chờ duyệt.');
        } catch (error) {
            console.error('Error registering:', error);
            alert('Có lỗi xảy ra khi đăng ký');
        } finally {
            setLoadingRegistration(false);
        }
    };

    const handleCancelRegistration = async () => {
        if (!event) return;

        if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký sự kiện này?')) {
            return;
        }

        try {
            await registrationAPI.cancelRegistration(event.id);
            setRegistrationStatus(null);
            alert('Hủy đăng ký thành công!');
        } catch (error) {
            console.error('Error canceling registration:', error);
            alert('Có lỗi xảy ra khi hủy đăng ký');
        }
    };

    const handleRecordParticipation = async (data: ActivityParticipationRequest) => {
        if (!event) return;

        try {
            const response = await registrationAPI.checkIn(data);

            if (response.status) {
                setShowParticipationForm(false);
                alert(response.message || 'Ghi nhận tham gia thành công!');
                console.log('Participation:', response.body); // đây mới là dữ liệu chi tiết
            } else {
                alert(response.message || 'Ghi nhận tham gia thất bại');
            }
        } catch (error) {
            console.error('Error recording participation:', error);
            alert('Có lỗi xảy ra khi ghi nhận tham gia');
        }
    };



    const getTypeLabel = (type: ActivityType | null): string => {
        if (!type) return 'N/A';
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return typeLabels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType | null | undefined): string => {
        if (!scoreType) return 'N/A';
        const scoreTypeLabels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Điểm rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Điểm công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Điểm chuyên đề doanh nghiệp'
        };
        return scoreTypeLabels[scoreType] || scoreType;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error || 'Không tìm thấy sự kiện'}</p>
                    <button
                        onClick={() => navigate('/manager/events')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header Actions */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#001C44]">Chi tiết sự kiện</h1>
                    <p className="text-gray-600 mt-1">Thông tin chi tiết về sự kiện</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        to={`/manager/events/${event.id}/article`}
                        className="bg-white border border-[#001C44] text-[#001C44] hover:bg-[#001C44] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Bài viết
                    </Link>
                    <Link
                        to={`/manager/events/${event.id}/edit`}
                        className="bg-[#001C44] hover:bg-[#002A66] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Chỉnh sửa
                    </Link>
                </div>
            </div>

            {/* Event Details */}
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Banner */}
                    <EventBannerImage
                        bannerUrl={event.bannerUrl}
                        alt={`Banner ${event.name}`}
                        wrapperClassName="h-64 bg-gray-200"
                        imageClassName="h-full w-full object-cover"
                    />

                    <div className="p-8">
                        {/* Header Info */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                    <h2 className="text-3xl font-bold text-[#001C44]">{event.name}</h2>
                                    {event.isDraft && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                                            📝 Bản nháp
                                        </span>
                                    )}
                                    {event.isImportant && (
                                        <span className="text-[#FFD66D] text-2xl" title="Sự kiện quan trọng">⭐</span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3 flex-wrap">
                                    <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-[#001C44] text-white">
                                        {getTypeLabel(event.type)}
                                    </span>
                                    <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-[#FFD66D] bg-opacity-30 text-[#001C44] border border-[#FFD66D]">
                                        {event.seriesId
                                            ? 'Chuỗi sự kiện'
                                            : event.scoreRules && event.scoreRules.length > 0
                                                ? Array.from(new Set(event.scoreRules.map(r => r.scoreType)))
                                                    .map(type => getScoreTypeLabel(type))
                                                    .join(', ')
                                                : 'Không cộng điểm'}
                                    </span>
                                    <span className="text-sm text-gray-500 font-mono">
                                        ID: {event.id}
                                    </span>
                                    {event.seriesId && (
                                        <Link
                                            to={`/manager/series/${event.seriesId}`}
                                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 transition-colors"
                                        >
                                            📋 Thuộc chuỗi sự kiện
                                            {event.seriesOrder && ` (Thứ tự: ${event.seriesOrder})`}
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {event.isDraft ? (
                                    <button onClick={handlePublish} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">Công bố</button>
                                ) : (
                                    <button onClick={handleUnpublish} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">Thu hồi</button>
                                )}
                                <button onClick={handleCopy} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-all border-2 border-gray-300 hover:border-[#001C44]">Sao chép</button>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-[#001C44]">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-3">Mô tả</h3>
                                <p className="text-gray-700 leading-relaxed">{event.description}</p>
                            </div>
                        )}

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Date & Time */}
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4 flex items-center">
                                    <span className="mr-2">📅</span>
                                    Thời gian & Địa điểm
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-blue-600">📅</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                                            <p className="font-medium">{formatDate(event.startDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-blue-600">📅</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Ngày kết thúc</p>
                                            <p className="font-medium">{formatDate(event.endDate)}</p>
                                        </div>
                                    </div>
                                    {event.registrationStartDate && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-green-600">🚀</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Ngày mở đăng ký</p>
                                                <p className="font-medium">{formatDate(event.registrationStartDate)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.registrationDeadline && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-orange-600">⏰</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Hạn đăng ký</p>
                                                <p className="font-medium">{formatDate(event.registrationDeadline)}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-green-600">📍</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Địa điểm</p>
                                            <p className="font-medium">{event.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Info */}
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4 flex items-center">
                                    <span className="mr-2">ℹ️</span>
                                    Thông tin sự kiện
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-purple-600">🏢</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Đơn vị tổ chức</p>
                                            <p className="font-medium">
                                                {event.organizerIds && event.organizerIds.length > 0
                                                    ? `ID: ${event.organizerIds.join(', ')}`
                                                    : 'Chưa xác định'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    {event.seriesId ? (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                            ℹ️ Hoạt động thuộc chuỗi sự kiện. Điểm số sẽ tính theo tiến độ của chuỗi sự kiện.
                                        </div>
                                    ) : (
                                        <div>
                                            {event.presetCode && event.presetCode !== 'CUSTOM' && (
                                                <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    <span>Mẫu cấu hình: {event.presetCode}</span>
                                                </div>
                                            )}
                                            <ScoreRulesDisplay rules={event.scoreRules} />
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-indigo-600">🎫</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Số lượng vé/slot</p>
                                            <p className="font-medium">
                                                {event.ticketQuantity && event.ticketQuantity > 0 ? event.ticketQuantity : 'Không giới hạn'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-indigo-600">📝</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Yêu cầu nộp bài</p>
                                            <p className="font-medium">
                                                {event.requiresSubmission ? 'Có' : 'Không'}
                                            </p>
                                        </div>
                                    </div>
                                    {event.isImportant && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-yellow-600">⭐</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Sự kiện quan trọng</p>
                                                <p className="font-medium">Có</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-orange-600">🎯</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Bắt buộc cho sinh viên khoa</p>
                                            <p className="font-medium">
                                                {event.mandatoryForFacultyStudents ? 'Có' : 'Không'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-blue-600">✅</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Đăng ký cần duyệt</p>
                                            <p className="font-medium">
                                                {event.requiresApproval ? 'Có' : 'Không (Tự động duyệt)'}
                                            </p>
                                        </div>
                                    </div>
                                    {event.shareLink && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-blue-600">🔗</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Link chia sẻ</p>
                                                <a
                                                    href={event.shareLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Xem link
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        {(event.benefits || event.requirements || event.contactInfo) && (
                            <div className="border-t border-gray-200 pt-6 mb-8">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4">Thông tin bổ sung</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {event.benefits && (
                                        <div>
                                            <h4 className="text-md font-medium text-gray-900 mb-2">Quyền lợi khi tham gia</h4>
                                            <p className="text-gray-700 text-sm leading-relaxed">{event.benefits}</p>
                                        </div>
                                    )}
                                    {event.requirements && (
                                        <div>
                                            <h4 className="text-md font-medium text-gray-900 mb-2">Yêu cầu tham gia</h4>
                                            <p className="text-gray-700 text-sm leading-relaxed">{event.requirements}</p>
                                        </div>
                                    )}
                                    {event.contactInfo && (
                                        <div>
                                            <h4 className="text-md font-medium text-gray-900 mb-2">Thông tin liên hệ</h4>
                                            <p className="text-gray-700 text-sm leading-relaxed">{event.contactInfo}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-[#001C44] mb-4">Thông tin hệ thống</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <p><span className="font-medium">Ngày tạo:</span> {event.createdAt ? formatDate(event.createdAt) : '-'}</p>
                                    {event.createdBy && (
                                        <p><span className="font-medium">Người tạo:</span> {event.createdBy}</p>
                                    )}
                                </div>
                                <div>
                                    <p><span className="font-medium">Cập nhật lần cuối:</span> {event.updatedAt ? formatDate(event.updatedAt) : '-'}</p>
                                    {event.lastModifiedBy && (
                                        <p><span className="font-medium">Người cập nhật:</span> {event.lastModifiedBy}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code Section - Only for Admin/Manager */}
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <div className="mt-8">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#001C44] to-[#002A66]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center">
                                            <span className="mr-2">📱</span>
                                            QR Code Check-in
                                        </h3>
                                        <p className="text-sm text-gray-200 mt-1">
                                            Mã QR code để sinh viên điểm danh sự kiện
                                        </p>
                                    </div>
                                    <div className="flex space-x-3">
                                        {event.checkInCode ? (
                                            <button
                                                onClick={() => setShowQrCode(!showQrCode)}
                                                className="px-4 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg text-sm font-medium hover:bg-[#FFE082] transition-colors"
                                            >
                                                {showQrCode ? 'Ẩn QR Code' : 'Hiển thị QR Code'}
                                            </button>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-yellow-300 text-sm">⚠️ Chưa có mã QR</span>
                                                <button
                                                    onClick={handleBackfillCheckInCodes}
                                                    disabled={backfilling}
                                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {backfilling ? 'Đang tạo...' : 'Tạo QR Code'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {event.checkInCode ? (
                                    <div>
                                        {showQrCode && (
                                            <div className="flex flex-col items-center space-y-4 mb-6">
                                                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 qr-code-svg">
                                                    <QRCodeSVG
                                                        value={event.checkInCode}
                                                        size={256}
                                                        level="H"
                                                        includeMargin={true}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 mb-2">Mã QR Code:</p>
                                                    <div className="flex items-center space-x-2">
                                                        <code className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-mono text-gray-800">
                                                            {event.checkInCode}
                                                        </code>
                                                        <button
                                                            onClick={handleCopyCheckInCode}
                                                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                                            title="Sao chép mã"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-3 mt-4">
                                                    <button
                                                        onClick={() => setShowFullScreenQr(true)}
                                                        className="px-4 py-2 bg-gradient-to-r from-[#001C44] to-[#002A66] hover:from-[#002A66] hover:to-[#003A88] text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                                                    >
                                                        🖥️ Hiển thị Full Màn hình
                                                    </button>
                                                    <button
                                                        onClick={handlePrintQrCode}
                                                        className="px-4 py-2 bg-[#FFD66D] hover:bg-[#FFE082] text-[#001C44] rounded-lg text-sm font-medium transition-colors shadow-md"
                                                    >
                                                        🖨️ In QR Code
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {!showQrCode && (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600 mb-4">Nhấn "Hiển thị QR Code" để xem mã QR</p>
                                                <p className="text-sm text-gray-500">Mã QR Code: <code className="bg-gray-100 px-2 py-1 rounded">{event.checkInCode}</code></p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
                                        <p className="text-gray-700 mb-4">Sự kiện này chưa có mã QR code để điểm danh.</p>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Nhấn "Tạo QR Code" để tạo mã cho sự kiện này.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Screen QR Code Modal */}
                {showFullScreenQr && event?.checkInCode && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setShowFullScreenQr(false)}>
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setShowFullScreenQr(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                ×
                            </button>
                            <div className="flex flex-col items-center space-y-6">
                                <h3 className="text-2xl font-bold text-[#001C44]">QR Code Check-in</h3>
                                <p className="text-lg text-gray-600">{event.name}</p>
                                <div className="bg-white p-6 rounded-lg border-4 border-[#001C44]">
                                    <QRCodeSVG
                                        value={event.checkInCode}
                                        size={400}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">Mã QR Code:</p>
                                    <code className="px-4 py-2 bg-gray-100 rounded-lg text-base font-mono text-gray-800">
                                        {event.checkInCode}
                                    </code>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleCopyCheckInCode}
                                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                    >
                                        📋 Sao chép mã
                                    </button>
                                    <button
                                        onClick={handlePrintQrCode}
                                        className="px-6 py-2 bg-[#FFD66D] hover:bg-[#FFE082] text-[#001C44] rounded-lg font-medium transition-colors shadow-md"
                                    >
                                        🖨️ In QR Code
                                    </button>
                                    <button
                                        onClick={() => setShowFullScreenQr(false)}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Gallery Section - Only show if event has ended */}
                {event && new Date(event.endDate) < new Date() && (
                    <div className="mt-8">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#001C44] to-[#002A66]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center">
                                            <span className="mr-2">📸</span>
                                            Hình ảnh sự kiện
                                        </h3>
                                        <p className="text-sm text-gray-200 mt-1">
                                            {photos.length > 0 ? `${photos.length} ảnh` : 'Chưa có ảnh nào'}
                                        </p>
                                    </div>
                                    <div className="flex space-x-3">
                                        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                                            <button
                                                onClick={() => setShowUploadForm(!showUploadForm)}
                                                className="px-4 py-2 bg-[#FFD66D] text-[#001C44] text-sm font-medium rounded-lg hover:bg-[#FFC947] focus:outline-none focus:ring-2 focus:ring-[#FFD66D] transition-all shadow-sm hover:shadow-md"
                                            >
                                                {showUploadForm ? 'Ẩn form' : '+ Thêm ảnh'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {showUploadForm && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                                    <div className="mb-6">
                                        <PhotoUploadForm
                                            activityId={event.id}
                                            currentPhotoCount={photos.length}
                                            onUploadSuccess={handleUploadSuccess}
                                            onCancel={() => setShowUploadForm(false)}
                                        />
                                    </div>
                                )}
                                {loadingPhotos ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Đang tải ảnh...</p>
                                    </div>
                                ) : photos.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Chưa có ảnh nào được tải lên</p>
                                    </div>
                                ) : (
                                    <PhotoGrid
                                        photos={photos}
                                        onDelete={(user?.role === 'MANAGER' || user?.role === 'ADMIN') ? handleDeletePhoto : undefined}
                                        onReorder={(user?.role === 'MANAGER' || user?.role === 'ADMIN') ? handleReorderPhoto : undefined}
                                        canManage={user?.role === 'MANAGER' || user?.role === 'ADMIN' || false}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Student Registration Section */}
                {user && user.role === 'STUDENT' && (
                    <div className="mt-8">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Đăng ký tham gia</h3>
                                <p className="text-sm text-gray-600 mt-1">Đăng ký tham gia sự kiện này</p>
                            </div>
                            <div className="p-6">
                                {registrationStatus ? (
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${registrationStatus.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                registrationStatus.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    registrationStatus.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {registrationStatus.status === 'PENDING' ? 'Chờ duyệt' :
                                                    registrationStatus.status === 'APPROVED' ? 'Đã duyệt' :
                                                        registrationStatus.status === 'REJECTED' ? 'Từ chối' :
                                                            'Đã hủy'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-4">
                                            {registrationStatus.status === 'PENDING' && 'Đăng ký của bạn đang chờ duyệt.'}
                                            {registrationStatus.status === 'APPROVED' && 'Đăng ký của bạn đã được duyệt. Bạn có thể tham gia sự kiện.'}
                                            {registrationStatus.status === 'REJECTED' && 'Đăng ký của bạn đã bị từ chối.'}
                                            {registrationStatus.status === 'CANCELLED' && 'Bạn đã hủy đăng ký sự kiện này.'}
                                        </p>
                                        <div className="flex justify-center space-x-3">
                                            {(registrationStatus.status === 'PENDING' || registrationStatus.status === 'APPROVED') && (
                                                <button
                                                    onClick={handleCancelRegistration}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                >
                                                    Hủy đăng ký
                                                </button>
                                            )}
                                            {registrationStatus.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => setShowParticipationForm(true)}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                >
                                                    Ghi nhận tham gia
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-600 mb-4">Bạn chưa đăng ký tham gia sự kiện này.</p>
                                        <button
                                            onClick={() => setShowRegistrationForm(true)}
                                            className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Đăng ký tham gia
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tasks Management Section (only for non-MINIGAME activities) */}
                {event.type !== ActivityType.MINIGAME && (
                    <div className="mt-8">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#001C44] to-[#002A66]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center">
                                            <span className="mr-2">📋</span>
                                            Quản lý nhiệm vụ
                                        </h3>
                                        <p className="text-sm text-gray-200 mt-1">Tạo và quản lý các nhiệm vụ cho hoạt động này</p>
                                    </div>
                                    <div className="flex space-x-3">
                                        {event.mandatoryForFacultyStudents && (
                                            <button
                                                onClick={handleAutoAssign}
                                                className="px-4 py-2 bg-[#FFD66D] text-[#001C44] text-sm font-medium rounded-lg hover:bg-[#FFC947] focus:outline-none focus:ring-2 focus:ring-[#FFD66D] transition-all shadow-sm hover:shadow-md"
                                            >
                                                ⚡ Tự động phân công
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditingTask(null);
                                                setShowTaskForm(true);
                                            }}
                                            className="px-4 py-2 bg-[#FFD66D] text-[#001C44] text-sm font-medium rounded-lg hover:bg-[#FFC947] focus:outline-none focus:ring-2 focus:ring-[#FFD66D] transition-all shadow-sm hover:shadow-md"
                                        >
                                            + Tạo nhiệm vụ
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <TaskList
                                    tasks={tasks}
                                    loading={loadingTasks}
                                    onEdit={(task) => {
                                        setEditingTask(task);
                                        setShowTaskForm(true);
                                    }}
                                    onDelete={handleDeleteTask}
                                    onAssign={(task) => {
                                        setSelectedTask(task);
                                        setShowAssignmentModal(true);
                                    }}
                                    onViewAssignments={handleViewAssignments}
                                    showActions={true}
                                />
                                {event.requiresSubmission && tasks.length > 0 && (
                                    <div className="mt-6 border-t-2 border-[#FFD66D] pt-6">
                                        <div className="bg-gradient-to-r from-[#FFD66D] to-[#FFC947] p-4 rounded-lg mb-4 shadow-md">
                                            <h4 className="text-lg font-bold text-[#001C44] flex items-center mb-1">
                                                <span className="mr-2 text-xl">📝</span>
                                                Bài nộp theo nhiệm vụ
                                            </h4>
                                            <p className="text-sm text-[#001C44] text-opacity-80">
                                                Xem và chấm điểm các bài nộp của sinh viên cho từng nhiệm vụ
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {tasks.map(t => (
                                                <div key={t.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-[#001C44] hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h5 className="text-base font-semibold text-[#001C44] mb-1">
                                                                📋 {t.name}
                                                            </h5>
                                                            {t.description && (
                                                                <p className="text-sm text-gray-600 line-clamp-1">
                                                                    {t.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewSubmissions(t)}
                                                            className="ml-4 px-5 py-2.5 bg-[#001C44] text-white text-sm font-medium rounded-lg hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                                                        >
                                                            👁️ Xem bài nộp
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quiz Management Section (only for MINIGAME activities) */}
                {event.type === ActivityType.MINIGAME && (
                    <div className="mt-8">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#001C44] to-[#002A66]">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center">
                                        <span className="mr-2">🎮</span>
                                        Quản lý Quiz
                                    </h3>
                                    <p className="text-sm text-gray-200 mt-1">Quản lý quiz cho minigame này</p>
                                </div>
                            </div>

                            <div className="p-6">
                                {loadingMinigame ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001C44] mx-auto"></div>
                                        <p className="mt-4 text-gray-600">Đang tải thông tin quiz...</p>
                                    </div>
                                ) : minigame ? (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 className="text-lg font-semibold text-[#001C44] mb-3">{minigame.title}</h4>
                                            {minigame.description && (
                                                <p className="text-gray-700 mb-4">{minigame.description}</p>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex items-center">
                                                    <span className="w-5 h-5 mr-2 text-blue-600">❓</span>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Số câu hỏi</p>
                                                        <p className="font-semibold">{minigame.questionCount}</p>
                                                    </div>
                                                </div>
                                                {minigame.timeLimit && (
                                                    <div className="flex items-center">
                                                        <span className="w-5 h-5 mr-2 text-green-600">⏱️</span>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Thời gian</p>
                                                            <p className="font-semibold">{Math.floor(minigame.timeLimit / 60)} phút</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {minigame.requiredCorrectAnswers && (
                                                    <div className="flex items-center">
                                                        <span className="w-5 h-5 mr-2 text-orange-600">✅</span>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Yêu cầu đúng</p>
                                                            <p className="font-semibold">{minigame.requiredCorrectAnswers}/{minigame.questionCount} câu</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center">
                                                    <span className="w-5 h-5 mr-2 text-purple-600">📊</span>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Trạng thái</p>
                                                        <p className="font-semibold">{minigame.isActive ? 'Hoạt động' : 'Tạm dừng'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Link
                                                to={`/manager/minigames/edit/${minigame.id}`}
                                                className="px-6 py-2 bg-[#001C44] text-white text-sm font-medium rounded-lg hover:bg-[#002A66] transition-all shadow-sm hover:shadow-md"
                                            >
                                                ✏️ Chỉnh sửa Quiz
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-6xl mb-4">🎮</div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Chưa có Quiz</h4>
                                        <p className="text-gray-600 mb-4">Sự kiện này chưa có quiz. Vui lòng tạo quiz cho minigame này.</p>
                                        <Link
                                            to="/admin/create-minigame"
                                            className="inline-block px-6 py-2 bg-[#001C44] text-white text-sm font-medium rounded-lg hover:bg-[#002A66] transition-all shadow-sm hover:shadow-md"
                                        >
                                            + Tạo Quiz
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Task Form Modal */}
            {showTaskForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center">
                                        <span className="mr-2">{editingTask ? '✏️' : '✨'}</span>
                                        {editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}
                                    </h2>
                                    <p className="text-sm text-gray-200 mt-1">
                                        Hoạt động: <span className="font-semibold">{event.name}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowTaskForm(false);
                                        setEditingTask(null);
                                    }}
                                    className="text-white hover:text-[#FFD66D] transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <TaskForm
                                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                                initialData={editingTask ? {
                                    name: editingTask.name,
                                    description: editingTask.description,
                                    deadline: editingTask.deadline,
                                    activityId: editingTask.activityId
                                } : undefined}
                                title={editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}
                                activityId={event.id}
                                activityName={event.name}
                                onCancel={() => {
                                    setShowTaskForm(false);
                                    setEditingTask(null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Task Assignment Modal */}
            {showAssignmentModal && selectedTask && (
                <TaskAssignmentModal
                    task={selectedTask}
                    onClose={() => {
                        setShowAssignmentModal(false);
                        setSelectedTask(null);
                    }}
                    onRefresh={() => loadTasks()}
                />
            )}

            {/* Task Assignments Modal */}
            {showAssignments && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        📋 {selectedTask.name}
                                    </h3>
                                    <p className="text-sm text-gray-200 mt-1">
                                        Danh sách phân công nhiệm vụ
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAssignments(false);
                                        setSelectedTask(null);
                                        setTaskAssignments([]);
                                    }}
                                    className="text-white hover:text-[#FFD66D] transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">

                            <TaskAssignmentsList
                                assignments={taskAssignments}
                                loading={loadingAssignments}
                                onUpdateStatus={handleUpdateAssignmentStatus}
                                onRemove={handleRemoveAssignment}
                                showActions={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Submission Details Modal */}
            {showSubmissionDetailsModal && selectedTaskForSubmission && (
                <SubmissionDetailsModal
                    // Map ActivityTaskResponse -> minimal ActivityTask shape needed by modal
                    task={{
                        id: selectedTaskForSubmission.id,
                        title: selectedTaskForSubmission.name,
                        activity: { id: selectedTaskForSubmission.activityId } as any,
                    } as any}
                    onClose={() => {
                        setShowSubmissionDetailsModal(false);
                        setSelectedTaskForSubmission(null);
                    }}
                    onSubmissionGraded={() => {
                        // Refresh if needed
                        loadTasks();
                    }}
                />
            )}

            {/* Registration Form Modal */}
            {showRegistrationForm && event && (
                <RegistrationForm
                    activityId={event.id}
                    activityName={event.name}
                    onSubmit={handleRegister}
                    onCancel={() => setShowRegistrationForm(false)}
                    isLoading={loadingRegistration}
                />
            )}

            {/* Participation Form Modal */}
            {showParticipationForm && event && (
                <ParticipationForm
                    activityId={event.id}
                    activityName={event.name}
                    onSubmit={handleRecordParticipation}
                    onCancel={() => setShowParticipationForm(false)}
                    isLoading={loadingRegistration}
                />
            )}

        </div>
    );
};

export default EventDetail;
