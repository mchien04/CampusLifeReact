import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';
import { taskAPI } from '../services/taskAPI';
import { submissionAPI } from '../services/submissionAPI';
import { getSubmissionStatusColor, getSubmissionStatusLabel } from '../utils/submissionUtils';
import { ActivityResponse, ActivityType, ScoreType } from '../types';
import { ActivityTaskResponse } from '../types/task';
import { TaskSubmissionResponse } from '../types/submission';
import { RegistrationStatus, ParticipationType } from '../types/registration';
import { LoadingSpinner } from '../components/common';

const StudentEventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showParticipationForm, setShowParticipationForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [participationType, setParticipationType] = useState<ParticipationType>(ParticipationType.ATTENDED);
    const [pointsEarned, setPointsEarned] = useState<number>(0);
    const [notes, setNotes] = useState('');

    // Tasks and submissions (within this event page)
    const [tasks, setTasks] = useState<ActivityTaskResponse[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ActivityTaskResponse | null>(null);
    const [mySubmission, setMySubmission] = useState<TaskSubmissionResponse | null>(null);
    const [submitContent, setSubmitContent] = useState('');
    const [submitFiles, setSubmitFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            loadEvent();
        }
    }, [id]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvent(parseInt(id!));
            if (response.status && response.data) {
                setEvent(response.data);
                await checkRegistrationStatus(response.data.id);
                await loadTasksByActivity(response.data.id);
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

    const loadTasksByActivity = async (activityId: number) => {
        try {
            setLoadingTasks(true);
            const res = await taskAPI.getTasksByActivity(activityId);
            if (res.status && res.data) {
                setTasks(res.data);
            } else {
                setTasks([]);
            }
        } catch (e) {
            console.error('Error loading tasks for activity:', e);
            setTasks([]);
        } finally {
            setLoadingTasks(false);
        }
    };

    const checkRegistrationStatus = async (eventId: number) => {
        try {
            const status = await registrationAPI.checkRegistrationStatus(eventId);
            setRegistrationStatus(status.status);
        } catch (err) {
            console.error('Error checking registration status:', err);
        }
    };

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
                setRegistrationStatus(RegistrationStatus.PENDING);
                setShowRegistrationForm(false);
                alert('Đăng ký thành công! Vui lòng chờ phê duyệt.');
            }
        } catch (err: any) {
            console.error('Registration error details:', err);
            console.error('Error response:', err.response?.data);
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
            setRegistrationStatus(RegistrationStatus.CANCELLED);
            alert('Hủy đăng ký thành công!');
        } catch (err: any) {
            alert('Có lỗi xảy ra khi hủy đăng ký: ' + (err.response?.data?.message || err.message));
            console.error('Error canceling registration:', err);
        }
    };

    const handleRecordParticipation = async () => {
        if (!event) return;

        try {
            const response = await registrationAPI.checkIn({
                activityId: event.id,
                participationType,
                pointsEarned: pointsEarned || undefined,
                notes
            });

            if (response.status) {
                setShowParticipationForm(false);
                alert(response.message || 'Ghi nhận tham gia thành công!');
            } else {
                alert(response.message || 'Ghi nhận thất bại');
            }

        } catch (err: any) {
            alert('Có lỗi xảy ra khi ghi nhận tham gia: ' + (err.response?.data?.message || err.message));
            console.error('Error recording participation:', err);
        }
    };


    const getTypeLabel = (type: ActivityType) => {
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.SERIES_BONUS]: 'Chuỗi sự kiện',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp',
        };

        return typeLabels[type] || type;
    };

    const getScoreTypeLabel = (scoreType: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề',
            [ScoreType.KHAC]: 'Khác'
        };
        return labels[scoreType] || scoreType;
    };

    const getStatusLabel = (status: RegistrationStatus) => {
        const labels: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'Chờ duyệt',
            [RegistrationStatus.APPROVED]: 'Đã duyệt',
            [RegistrationStatus.REJECTED]: 'Từ chối',
            [RegistrationStatus.CANCELLED]: 'Đã hủy'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: RegistrationStatus) => {
        const colors: Record<RegistrationStatus, string> = {
            [RegistrationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
            [RegistrationStatus.APPROVED]: 'bg-green-100 text-green-800',
            [RegistrationStatus.REJECTED]: 'bg-red-100 text-red-800',
            [RegistrationStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
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
        const eventStatus = getEventStatus();
        return eventStatus === 'UPCOMING' && !registrationStatus;
    };

    const canCancel = () => {
        if (!event) return false;
        const eventStatus = getEventStatus();
        return eventStatus === 'UPCOMING' &&
            registrationStatus === RegistrationStatus.PENDING;
    };

    const canRecordParticipation = () => {
        if (!event) return false;
        const eventStatus = getEventStatus();
        return eventStatus === 'ONGOING' && registrationStatus === RegistrationStatus.APPROVED;
    };

    const openSubmissionModal = async (task: ActivityTaskResponse) => {
        setSelectedTask(task);
        setShowSubmissionModal(true);
        setMySubmission(null);
        setSubmitContent('');
        setSubmitFiles([]);
        setFilePreviews([]);
        try {
            const res = await submissionAPI.getMySubmissionForTask(task.id);
            if (res.status && res.data) {
                setMySubmission(res.data);
                setSubmitContent(res.data.content || '');
                // Normalize fileUrls for preview (read-only links)
                const urls = Array.isArray(res.data.fileUrls)
                    ? res.data.fileUrls
                    : (res.data.fileUrls ? (res.data.fileUrls as string).split(',').map(u => u.trim()) : []);
                setFilePreviews(urls);
            }
        } catch (e) {
            console.warn('No existing submission or failed to fetch:', e);
        }
    };

    const closeSubmissionModal = () => {
        setShowSubmissionModal(false);
        setSelectedTask(null);
        setMySubmission(null);
        setSubmitContent('');
        setSubmitFiles([]);
        setFilePreviews([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSubmitFiles(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setFilePreviews(previews);
    };

    const handleSubmitTask = async () => {
        if (!selectedTask) return;
        setSubmitting(true);
        try {
            if (mySubmission) {
                const res = await submissionAPI.updateSubmission(mySubmission.id, {
                    content: submitContent || undefined,
                    files: submitFiles.length > 0 ? submitFiles : undefined,
                });
                if (!res.status) throw new Error(res.message || 'Cập nhật bài nộp thất bại');
                alert('Cập nhật bài nộp thành công');
            } else {
                const res = await submissionAPI.submitTask(selectedTask.id, {
                    content: submitContent || undefined,
                    files: submitFiles.length > 0 ? submitFiles : undefined,
                });
                if (!res.status) throw new Error(res.message || 'Nộp bài thất bại');
                alert('Nộp bài thành công');
            }
            // Refresh my submission
            const latest = await submissionAPI.getMySubmissionForTask(selectedTask.id);
            if (latest.status && latest.data) setMySubmission(latest.data);
        } catch (e: any) {
            alert(e.message || 'Có lỗi xảy ra khi nộp bài');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-4">{error || 'Không tìm thấy sự kiện'}</p>
                    <button
                        onClick={() => navigate('/student/events')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const eventStatus = getEventStatus();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Chi tiết sự kiện hoạt động
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <Link
                                    to="/student/events"
                                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                                >
                                    ← Quay lại danh sách
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Event Info */}
                        <div className="bg-white shadow rounded-lg mb-6">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventStatus === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                                            eventStatus === 'ONGOING' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {eventStatus === 'UPCOMING' ? 'Sắp diễn ra' :
                                                eventStatus === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc'}
                                        </span>
                                        {registrationStatus && (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registrationStatus)}`}>
                                                {getStatusLabel(registrationStatus)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.name}</h2>

                                {event.description && (
                                    <p className="text-gray-600 mb-6">{event.description}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">📅</span>
                                        <span>
                                            {new Date(event.startDate).toLocaleDateString('vi-VN')} - {new Date(event.endDate).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">📍</span>
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">🏷️</span>
                                        <span>{getTypeLabel(event.type)}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">⭐</span>
                                        <span>{getScoreTypeLabel(event.scoreType)}</span>
                                    </div>
                                </div>

                                {event.ticketQuantity && (
                                    <div className="text-sm text-gray-500 mb-2">
                                        <span className="mr-2">🎫</span>
                                        <span>Số lượng vé: {event.ticketQuantity}</span>
                                    </div>
                                )}

                                {event.mandatoryForFacultyStudents && (
                                    <div className="text-sm text-orange-600 mb-2">
                                        <span className="mr-2">⚠️</span>
                                        <span>Bắt buộc cho sinh viên khoa</span>
                                    </div>
                                )}

                                {event.benefits && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Lợi ích:</h3>
                                        <p className="text-sm text-gray-600">{event.benefits}</p>
                                    </div>
                                )}

                                {event.requirements && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Yêu cầu:</h3>
                                        <p className="text-sm text-gray-600">{event.requirements}</p>
                                    </div>
                                )}

                                {event.contactInfo && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Thông tin liên hệ:</h3>
                                        <p className="text-sm text-gray-600">{event.contactInfo}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Thao tác</h3>
                                <div className="flex flex-wrap gap-3">
                                    {canRegister() && (
                                        <button
                                            onClick={() => setShowRegistrationForm(true)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                                        >
                                            Đăng ký tham gia
                                        </button>
                                    )}

                                    {canCancel() && (
                                        <button
                                            onClick={handleCancelRegistration}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                                        >
                                            Hủy đăng ký
                                        </button>
                                    )}

                                    {registrationStatus === RegistrationStatus.APPROVED && getEventStatus() === 'UPCOMING' && (
                                        <div className="text-center">
                                            <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800">
                                                ✅ Đã được duyệt - Không thể hủy
                                            </span>
                                        </div>
                                    )}

                                    {canRecordParticipation() && (
                                        <button
                                            onClick={() => setShowParticipationForm(true)}
                                            className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                                        >
                                            Ghi nhận tham gia
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Event Tasks and Submission (Student) */}
                        {event.requiresSubmission && (
                            <div className="bg-white shadow rounded-lg mt-6">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Nhiệm vụ cần nộp bài</h3>
                                    </div>
                                    {loadingTasks ? (
                                        <p className="text-sm text-gray-500">Đang tải nhiệm vụ...</p>
                                    ) : tasks.length === 0 ? (
                                        <p className="text-sm text-gray-500">Chưa có nhiệm vụ.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {tasks.map((t) => (
                                                <div key={t.id} className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                                        {t.deadline && (
                                                            <p className="text-xs text-gray-500">Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => openSubmissionModal(t)}
                                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                                                        >
                                                            Nộp bài
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Event Stats */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin sự kiện</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Loại sự kiện:</span>
                                        <span className="text-sm font-medium">{getTypeLabel(event.type)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Loại điểm:</span>
                                        <span className="text-sm font-medium">{getScoreTypeLabel(event.scoreType)}</span>
                                    </div>
                                    {event.maxPoints && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Điểm tối đa:</span>
                                            <span className="text-sm font-medium">{event.maxPoints}</span>
                                        </div>
                                    )}
                                    {event.penaltyPointsIncomplete && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Điểm phạt:</span>
                                            <span className="text-sm font-medium text-red-600">{event.penaltyPointsIncomplete}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Registration Info */}
                        {registrationStatus && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái đăng ký</h3>
                                    <div className="text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(registrationStatus)}`}>
                                            {getStatusLabel(registrationStatus)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Submission Modal */}
            {showSubmissionModal && selectedTask && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Nộp bài: {selectedTask.name}</h3>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập nội dung nộp bài..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tệp đính kèm (tùy chọn)</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {/* Previews */}
                                {(filePreviews.length > 0 || (mySubmission && mySubmission.fileUrls)) && (
                                    <div className="mt-2 space-y-1">
                                        {filePreviews.map((url, idx) => (
                                            <button
                                                key={`p-${idx}`}
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        const filename = (url.split('/').pop() || `file-${idx + 1}`).trim();
                                                        const resp = await api.get(url, { responseType: 'blob' });
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
                                                }}
                                                className="text-blue-600 text-sm hover:underline"
                                            >
                                                File mới {idx + 1}
                                            </button>
                                        ))}
                                        {mySubmission && (() => {
                                            const urls = Array.isArray(mySubmission.fileUrls)
                                                ? mySubmission.fileUrls
                                                : (mySubmission.fileUrls ? (mySubmission.fileUrls as string).split(',').map(u => u.trim()) : []);
                                            return urls.map((u, idx) => (
                                                <button
                                                    key={`e-${idx}`}
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            const filename = (u.split('/').pop() || `file-${idx + 1}`).trim();
                                                            const resp = await api.get(u, { responseType: 'blob' });
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
                                                    }}
                                                    className="text-gray-700 text-sm hover:underline"
                                                >
                                                    File hiện có {idx + 1}
                                                </button>
                                            ));
                                        })()}
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
                                            setFilePreviews([]);
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập lời nhắn cho ban tổ chức..."
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowRegistrationForm(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRegister}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                                >
                                    Đăng ký
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Participation Modal */}
            {showParticipationForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ghi nhận tham gia</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại tham gia
                                    </label>
                                    <select
                                        value={participationType}
                                        onChange={(e) => setParticipationType(e.target.value as ParticipationType)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={ParticipationType.REGISTERED}>Đã đăng ký</option>
                                        <option value={ParticipationType.ATTENDED}>Đã tham gia</option>
                                        <option value={ParticipationType.CHECKED_IN}>Đã check-in</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điểm đạt được (tùy chọn)
                                    </label>
                                    <input
                                        type="number"
                                        value={pointsEarned}
                                        onChange={(e) => setPointsEarned(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập điểm đạt được..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú (tùy chọn)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ghi chú..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowParticipationForm(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRecordParticipation}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                                >
                                    Ghi nhận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentEventDetail;
