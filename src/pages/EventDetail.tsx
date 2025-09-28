import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ActivityResponse, ActivityType, ScoreType } from '../types/activity';
import { ActivityTaskResponse, TaskAssignmentResponse, CreateActivityTaskRequest, TaskAssignmentRequest, TaskStatus } from '../types/task';
import { ActivityRegistrationResponse, RegistrationStatus, ActivityParticipationRequest, ParticipationType } from '../types/registration';
import { eventAPI } from '../services/eventAPI';
import { taskAPI } from '../services/taskAPI';
import { registrationAPI } from '../services/registrationAPI';
import { getImageUrl } from '../utils/imageUtils';
import { TaskList, TaskForm, TaskAssignmentsList } from '../components/tasks';
import { TaskAssignmentModal } from '../components/task/TaskAssignmentModal';
import { RegistrationForm, ParticipationForm } from '../components/registration';
import { useAuth } from '../contexts/AuthContext';

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

    // Registration states
    const [registrationStatus, setRegistrationStatus] = useState<{ status: RegistrationStatus; registrationId?: number } | null>(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showParticipationForm, setShowParticipationForm] = useState(false);
    const [loadingRegistration, setLoadingRegistration] = useState(false);
    const navigate = useNavigate();

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

    // Load tasks when event is loaded
    useEffect(() => {
        if (event) {
            loadTasks();
        }
    }, [event]);

    const loadTasks = async () => {
        if (!event) return;

        setLoadingTasks(true);
        try {
            const response = await taskAPI.getTasksByActivity(event.id);
            if (response.status && response.data) {
                setTasks(response.data);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoadingTasks(false);
        }
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
            setLoadingRegistration(true);
            await registrationAPI.recordParticipation(data);
            setShowParticipationForm(false);
            alert('Ghi nhận tham gia thành công!');
        } catch (error) {
            console.error('Error recording participation:', error);
            alert('Có lỗi xảy ra khi ghi nhận tham gia');
        } finally {
            setLoadingRegistration(false);
        }
    };

    const getTypeLabel = (type: ActivityType): string => {
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp'
        };
        return typeLabels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType): string => {
        const scoreTypeLabels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Điểm rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Điểm công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Điểm chuyên đề doanh nghiệp',
            [ScoreType.KHAC]: 'Các loại khác'
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chi tiết sự kiện</h1>
                            <p className="text-gray-600 mt-1">Thông tin chi tiết về sự kiện</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to={`/manager/events/${event.id}/edit`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Chỉnh sửa
                            </Link>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/manager/events')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại danh sách
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Banner */}
                    {event.bannerUrl && (
                        <div className="h-64 bg-gray-200 bg-cover bg-center"
                            style={{ backgroundImage: `url(${getImageUrl(event.bannerUrl)})` }}>
                        </div>
                    )}

                    <div className="p-8">
                        {/* Header Info */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h2 className="text-3xl font-bold text-gray-900">{event.name}</h2>
                                    {event.isImportant && (
                                        <span className="text-yellow-500 text-2xl">⭐</span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                        {getTypeLabel(event.type)}
                                    </span>
                                    <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                        {getScoreTypeLabel(event.scoreType)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ID: {event.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mô tả</h3>
                                <p className="text-gray-700 leading-relaxed">{event.description}</p>
                            </div>
                        )}

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Date & Time */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thời gian & Địa điểm</h3>
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
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sự kiện</h3>
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
                                    {event.maxPoints && parseFloat(event.maxPoints) > 0 && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-yellow-600">🏆</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Điểm tối đa</p>
                                                <p className="font-medium">{event.maxPoints} điểm</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.penaltyPointsIncomplete && parseFloat(event.penaltyPointsIncomplete) > 0 && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-red-600">⚠️</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Điểm trừ khi không hoàn thành</p>
                                                <p className="font-medium">{event.penaltyPointsIncomplete} điểm</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.ticketQuantity && event.ticketQuantity > 0 && (
                                        <div className="flex items-center">
                                            <span className="w-5 h-5 mr-3 text-indigo-600">🎫</span>
                                            <div>
                                                <p className="text-sm text-gray-500">Số lượng vé/slot</p>
                                                <p className="font-medium">{event.ticketQuantity}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-indigo-600">📝</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Yêu cầu nộp bài</p>
                                            <p className="font-medium">
                                                {event.requiresSubmission ? 'Có' : 'Không'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-5 h-5 mr-3 text-orange-600">🎯</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Bắt buộc cho sinh viên khoa</p>
                                            <p className="font-medium">
                                                {event.mandatoryForFacultyStudents ? 'Có' : 'Không'}
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin bổ sung</h3>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hệ thống</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <p><span className="font-medium">Ngày tạo:</span> {formatDate(event.createdAt)}</p>
                                    {event.createdBy && (
                                        <p><span className="font-medium">Người tạo:</span> {event.createdBy}</p>
                                    )}
                                </div>
                                <div>
                                    <p><span className="font-medium">Cập nhật lần cuối:</span> {formatDate(event.updatedAt)}</p>
                                    {event.lastModifiedBy && (
                                        <p><span className="font-medium">Người cập nhật:</span> {event.lastModifiedBy}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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

                {/* Tasks Management Section */}
                <div className="mt-8">
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Quản lý nhiệm vụ</h3>
                                    <p className="text-sm text-gray-600 mt-1">Tạo và quản lý các nhiệm vụ cho hoạt động này</p>
                                </div>
                                <div className="flex space-x-3">
                                    {event.mandatoryForFacultyStudents && (
                                        <button
                                            onClick={handleAutoAssign}
                                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            Tự động phân công
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setEditingTask(null);
                                            setShowTaskForm(true);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Form Modal */}
            {showTaskForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Phân công nhiệm vụ: {selectedTask.name}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAssignments(false);
                                    setSelectedTask(null);
                                    setTaskAssignments([]);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <TaskAssignmentsList
                            assignments={taskAssignments}
                            loading={loadingAssignments}
                            onUpdateStatus={handleUpdateAssignmentStatus}
                            onRemove={handleRemoveAssignment}
                            showActions={true}
                        />
                    </div>
                </div>
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
