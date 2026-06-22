import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { TaskAssignmentResponse, TaskStatus } from '../types/task';
import { taskAPI } from '../services/taskAPI';
import { studentAPI } from '../services/studentAPI';
import { useAuth } from '../contexts/AuthContext';
import { TaskSubmissionResponse, CreateSubmissionRequest, UpdateSubmissionRequest } from '../types/submission';
import { submissionAPI } from '../services/submissionAPI';
import { getSubmissionStatusColor, getSubmissionStatusLabel } from '../utils/submissionUtils';
import StudentLayout from '../components/layout/StudentLayout';

const StudentTasks: React.FC = () => {
    const { username } = useAuth(); // Get username from auth context
    const [assignments, setAssignments] = useState<TaskAssignmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // Submission states
    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [currentTaskForSubmission, setCurrentTaskForSubmission] = useState<TaskAssignmentResponse | null>(null);
    const [currentSubmission, setCurrentSubmission] = useState<TaskSubmissionResponse | null>(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
    const [submissionFilePreviews, setSubmissionFilePreviews] = useState<string[]>([]);
    const [submissionImages, setSubmissionImages] = useState<File[]>([]);
    const [submissionImagePreviews, setSubmissionImagePreviews] = useState<string[]>([]);
    const [submissionLoading, setSubmissionLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [submissionSuccess, setSubmissionSuccess] = useState('');
    const [mySubmissionsByTask, setMySubmissionsByTask] = useState<Record<number, TaskSubmissionResponse | null>>({});

    const loadStudentTasks = useCallback(async () => {
        if (!username) {
            setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Get student ID from profile
            const studentProfile = await studentAPI.getMyProfile();
            console.log('🔍 StudentTasks: Profile response:', studentProfile);
            const studentId = studentProfile.id;
            console.log('🔍 StudentTasks: Using studentId:', studentId);

            const response = await taskAPI.getStudentTasksNew(studentId);
            console.log('🔍 StudentTasks: API response:', response);

            if (response.status && response.data) {
                const assignmentsList = response.data as TaskAssignmentResponse[];
                console.log('🔍 StudentTasks: Assignments list:', assignmentsList);
                setAssignments(assignmentsList);
                // Load my submissions for ALL tasks to allow viewing even if requiresSubmission flag is absent
                if (assignmentsList.length > 0) {
                    const results = await Promise.allSettled(
                        assignmentsList.map((a: TaskAssignmentResponse) => submissionAPI.getMySubmissionForTask(a.taskId))
                    );
                    const map: Record<number, TaskSubmissionResponse | null> = {};
                    results.forEach((res, idx) => {
                        const taskId = assignmentsList[idx].taskId;
                        if (res.status === 'fulfilled' && res.value.status && res.value.data) {
                            map[taskId] = res.value.data;
                        } else {
                            map[taskId] = null;
                        }
                    });
                    setMySubmissionsByTask(map);
                } else {
                    setMySubmissionsByTask({});
                }
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải nhiệm vụ');
            }
        } catch (err) {
            console.error('Error loading student tasks:', err);
            setError('Có lỗi xảy ra khi tải nhiệm vụ');
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        loadStudentTasks();
    }, [loadStudentTasks]);

    const loadMySubmission = useCallback(async (taskId: number) => {
        setSubmissionLoading(true);
        setSubmissionError('');
        setSubmissionSuccess('');
        try {
            const response = await submissionAPI.getMySubmissionForTask(taskId);
            if (response.status && response.data) {
                setCurrentSubmission(response.data);
                setSubmissionContent(response.data.content || '');
                const atts = response.data.attachments || [];
                setSubmissionFilePreviews(atts.filter((a: any) => a.type === 'file').map((a: any) => a.url));
                setSubmissionImagePreviews(atts.filter((a: any) => a.type === 'image').map((a: any) => a.url));
                setSubmissionFiles([]); // Clear file input for existing submissions
                setSubmissionImages([]);
            } else {
                setCurrentSubmission(null);
                setSubmissionContent('');
                setSubmissionFiles([]);
                setSubmissionFilePreviews([]);
                setSubmissionImages([]);
                setSubmissionImagePreviews([]);
            }
        } catch (error) {
            console.error('Error loading submission:', error);
            setSubmissionError('Không thể tải bài nộp của bạn.');
            setCurrentSubmission(null);
            setSubmissionContent('');
            setSubmissionFiles([]);
            setSubmissionFilePreviews([]);
            setSubmissionImages([]);
            setSubmissionImagePreviews([]);
        } finally {
            setSubmissionLoading(false);
        }
    }, []);

    const openSubmissionModal = async (assignment: TaskAssignmentResponse) => {
        setCurrentTaskForSubmission(assignment);
        setIsSubmissionModalOpen(true);
        await loadMySubmission(assignment.taskId);
    };

    const closeSubmissionModal = () => {
        setIsSubmissionModalOpen(false);
        setCurrentTaskForSubmission(null);
        setCurrentSubmission(null);
        setSubmissionContent('');
        setSubmissionFiles([]);
        setSubmissionFilePreviews([]);
        setSubmissionImages([]);
        setSubmissionImagePreviews([]);
        setSubmissionError('');
        setSubmissionSuccess('');
        loadStudentTasks(); // Reload tasks to update submission status
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSubmissionFiles(Array.from(e.target.files));
            const newPreviews = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setSubmissionFilePreviews(newPreviews);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSubmissionImages(Array.from(e.target.files));
            const newPreviews = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setSubmissionImagePreviews(newPreviews);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTaskForSubmission || !username) return;

        setSubmissionLoading(true);
        setSubmissionError('');
        setSubmissionSuccess('');

        try {
            const data: CreateSubmissionRequest = {
                content: submissionContent.trim() || undefined,
                files: submissionFiles.length > 0 ? submissionFiles : undefined,
                images: submissionImages.length > 0 ? submissionImages : undefined,
            };

            let response;
            if (currentSubmission) {
                response = await submissionAPI.updateSubmission(currentSubmission.id, data);
            } else {
                response = await submissionAPI.submitTask(currentTaskForSubmission.taskId, data);
            }

            if (response.status) {
                setSubmissionSuccess(currentSubmission ? 'Cập nhật bài nộp thành công!' : 'Nộp bài thành công!');
                await loadMySubmission(currentTaskForSubmission.taskId); // Reload submission after action
                setSubmissionFiles([]); // Clear new files after successful upload
            } else {
                setSubmissionError(response.message || 'Có lỗi xảy ra khi nộp bài.');
            }
        } catch (err) {
            console.error('Error submitting task:', err);
            setSubmissionError('Có lỗi xảy ra khi nộp bài.');
        } finally {
            setSubmissionLoading(false);
        }
    };

    const filteredAssignments = filter === 'ALL'
        ? assignments
        : assignments.filter(assignment => assignment.status === filter);

    const getStatusColor = (status: TaskStatus): string => {
        switch (status) {
            case TaskStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800';
            case TaskStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-800';
            case TaskStatus.COMPLETED:
                return 'bg-green-100 text-green-800';
            case TaskStatus.CANCELLED:
                return 'bg-gray-100 text-gray-800';
            case TaskStatus.OVERDUE:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: TaskStatus): string => {
        switch (status) {
            case TaskStatus.PENDING:
                return 'Chờ xử lý';
            case TaskStatus.IN_PROGRESS:
                return 'Đang thực hiện';
            case TaskStatus.COMPLETED:
                return 'Hoàn thành';
            case TaskStatus.CANCELLED:
                return 'Đã hủy';
            case TaskStatus.OVERDUE:
                return 'Quá hạn';
            default:
                return status;
        }
    };

    const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
        switch (currentStatus) {
            case TaskStatus.PENDING:
                return TaskStatus.IN_PROGRESS;
            case TaskStatus.IN_PROGRESS:
                return TaskStatus.COMPLETED;
            case TaskStatus.COMPLETED:
                return null; // No next status
            case TaskStatus.CANCELLED:
                return TaskStatus.PENDING;
            default:
                return null;
        }
    };

    const handleStatusUpdate = async (assignmentId: number, newStatus: TaskStatus) => {
        setUpdatingId(assignmentId);
        try {
            const response = await taskAPI.updateTaskStatus(assignmentId, newStatus);
            if (response.status) {
                // Update local state
                setAssignments(prev => prev.map(assignment =>
                    assignment.id === assignmentId
                        ? { ...assignment, status: newStatus, updatedAt: new Date().toISOString() }
                        : assignment
                ));
                alert('Cập nhật trạng thái thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDownload = async (fileUrl: string) => {
        try {
            const filename = (fileUrl.split('/').pop() || 'file').trim();
            const response = await api.get(fileUrl, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
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


    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải nhiệm vụ...</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">❌</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={loadStudentTasks}
                            className="btn-primary px-4 py-2 text-sm font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center">
                                <span className="mr-3 text-4xl">📋</span>
                                Nhiệm vụ của tôi
                            </h1>
                            <p className="text-gray-200">Quản lý và theo dõi các nhiệm vụ đã được phân công</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-200 mb-1">Tổng số nhiệm vụ</div>
                            <div className="text-4xl font-bold text-[#FFD66D]">{assignments.length}</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                filter === 'ALL'
                                    ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                            }`}
                        >
                            Tất cả ({assignments.length})
                        </button>
                        {[TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.OVERDUE, TaskStatus.CANCELLED].map(status => {
                            const count = assignments.filter(a => a.status === status).length;
                            const statusColors = {
                                [TaskStatus.PENDING]: 'from-yellow-400 to-yellow-500',
                                [TaskStatus.IN_PROGRESS]: 'from-blue-400 to-blue-500',
                                [TaskStatus.COMPLETED]: 'from-green-400 to-green-500',
                                [TaskStatus.OVERDUE]: 'from-red-400 to-red-500',
                                [TaskStatus.CANCELLED]: 'from-gray-400 to-gray-500',
                            };
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                        filter === status
                                            ? `bg-gradient-to-r ${statusColors[status]} text-white shadow-md`
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                                    }`}
                                >
                                    {getStatusLabel(status)} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tasks List */}
                {filteredAssignments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <div className="text-gray-400 text-7xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {filter === 'ALL' ? 'Chưa có nhiệm vụ nào' : `Không có nhiệm vụ ${getStatusLabel(filter as TaskStatus).toLowerCase()}`}
                        </h3>
                        <p className="text-gray-600">
                            {filter === 'ALL'
                                ? 'Bạn chưa được phân công nhiệm vụ nào.'
                                : `Không có nhiệm vụ nào ở trạng thái ${getStatusLabel(filter as TaskStatus).toLowerCase()}.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAssignments.map((assignment) => {
                            const nextStatus = getNextStatus(assignment.status);
                            const mySubmission = mySubmissionsByTask[assignment.taskId] || null;

                            return (
                                <div key={assignment.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-center text-2xl text-white shadow-md flex-shrink-0">
                                                        📝
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                                                            {assignment.taskName}
                                                            {assignment.requiresSubmission === false && (
                                                                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 align-middle">
                                                                    Tùy chọn
                                                                </span>
                                                            )}
                                                        </h3>
                                                        {assignment.activityName && (
                                                            <div className="mb-3 flex items-center flex-wrap gap-2">
                                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#001C44] to-[#002A66] text-white shadow-sm">
                                                                    📅 {assignment.activityName}
                                                                </span>
                                                                {assignment.activityId && (
                                                                    <Link
                                                                        to={`/student/events/${assignment.activityId}`}
                                                                        className="inline-flex items-center text-sm text-[#001C44] hover:text-[#002A66] hover:underline font-medium transition-colors"
                                                                    >
                                                                        Xem chi tiết sự kiện →
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="font-semibold text-gray-700 mr-2">Mã SV:</span>
                                                        <span>{assignment.studentCode}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="font-semibold text-gray-700 mr-2">Cập nhật:</span>
                                                        <span>{formatDate(assignment.updatedAt)}</span>
                                                    </div>
                                                </div>
                                                
                                                {assignment.submissionDeadline && assignment.requiresSubmission !== false && (
                                                    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                                                        assignment.status === TaskStatus.OVERDUE 
                                                            ? 'bg-red-50 text-red-700 border-2 border-red-200' 
                                                            : 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                                                    }`}>
                                                        <span className="mr-2">⏰</span>
                                                        Hạn nộp: {formatDate(assignment.submissionDeadline)}
                                                        {assignment.status === TaskStatus.OVERDUE && <span className="ml-2 font-bold">(Đã quá hạn)</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                                <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${getStatusColor(assignment.status)}`}>
                                                    {getStatusLabel(assignment.status)}
                                                </span>

                                                <button
                                                    onClick={() => openSubmissionModal(assignment)}
                                                    className="px-5 py-2.5 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#001C44] font-semibold shadow-md hover:shadow-lg transition-all text-sm"
                                                >
                                                    {mySubmission 
                                                        ? (mySubmission.status === 'GRADED' || mySubmission.isCompleted !== null || mySubmission.gradedAt !== null)
                                                            ? '👁️ Xem bài nộp'
                                                            : '✏️ Xem/Sửa bài nộp'
                                                        : '📤 Nộp bài'}
                                                </button>
                                            </div>
                                        </div>
                                        {mySubmission && (
                                            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                                    <div className="flex items-center">
                                                        <span className="font-semibold text-gray-700 mr-2">Trạng thái:</span>
                                                        <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${getSubmissionStatusColor(mySubmission.status)}`}>
                                                            {getSubmissionStatusLabel(mySubmission.status)}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-400">•</span>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="mr-2">📅</span>
                                                        <span className="font-medium">Nộp lúc: {formatDate(mySubmission.submittedAt)}</span>
                                                    </div>
                                                </div>
                                                {mySubmission.content && (
                                                    <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                                                        <p className="text-gray-700 whitespace-pre-wrap">{mySubmission.content}</p>
                                                    </div>
                                                )}
                                                {((mySubmission.attachments && mySubmission.attachments.length > 0) || (mySubmission.fileUrls && (Array.isArray(mySubmission.fileUrls) ? mySubmission.fileUrls.length > 0 : String(mySubmission.fileUrls).length > 0))) && (
                                                    <div className="mb-3">
                                                        <p className="text-gray-700 font-semibold mb-2">📎 File đính kèm:</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {((mySubmission.attachments && mySubmission.attachments.length > 0)
                                                                ? mySubmission.attachments.filter((attachment) => attachment.type === 'file').map((attachment) => attachment.url)
                                                                : (Array.isArray(mySubmission.fileUrls) ? mySubmission.fileUrls : String(mySubmission.fileUrls).split(',').map((u: string) => u.trim()))
                                                            ).map((url: string, idx: number) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => handleDownload(url)}
                                                                    className="flex items-center p-2 bg-white rounded-lg border border-gray-200 hover:border-[#001C44] hover:bg-gray-50 transition-all text-sm font-medium text-[#001C44]"
                                                                >
                                                                    <svg className="h-5 w-5 mr-2 text-[#001C44]" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="truncate">{url.split('/').pop()}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {mySubmission.attachments?.some((attachment) => attachment.type === 'image') && (
                                                    <div className="mb-3">
                                                        <p className="text-gray-700 font-semibold mb-2">🖼️ Hình ảnh minh chứng:</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {mySubmission.attachments
                                                                .filter((attachment) => attachment.type === 'image')
                                                                .map((attachment, idx) => (
                                                                <a
                                                                    key={`image-${idx}`}
                                                                    href={attachment.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-[#001C44]"
                                                                >
                                                                    <img
                                                                        src={attachment.url}
                                                                        alt={`Minh chứng ${idx + 1}`}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {(mySubmission.isCompleted !== null || mySubmission.feedback) && (
                                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                                        {mySubmission.isCompleted !== null && (
                                                            <p className="text-gray-700 mb-2">
                                                                <span className="font-semibold">Kết quả:</span>{' '}
                                                                <span className={`font-bold ${
                                                                    mySubmission.isCompleted === true ? 'text-green-600' : 
                                                                    mySubmission.isCompleted === false ? 'text-red-600' : 
                                                                    'text-gray-600'
                                                                }`}>
                                                                    {mySubmission.isCompleted === true ? '✅ Đạt' : mySubmission.isCompleted === false ? '❌ Không đạt' : '⏳ Chưa chấm'}
                                                                </span>
                                                            </p>
                                                        )}
                                                        {mySubmission.feedback && (
                                                            <p className="text-gray-700">
                                                                <span className="font-semibold">💬 Phản hồi:</span>{' '}
                                                                <span>{mySubmission.feedback}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            {isSubmissionModalOpen && currentTaskForSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] p-6 rounded-t-xl">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-2">Nộp bài cho: {currentTaskForSubmission.taskName}</h3>
                                    {currentTaskForSubmission.activityName && (
                                        <div className="flex items-center flex-wrap gap-2">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#FFD66D] text-[#001C44] shadow-sm">
                                                📅 {currentTaskForSubmission.activityName}
                                            </span>
                                            {currentTaskForSubmission.activityId && (
                                                <Link
                                                    to={`/student/events/${currentTaskForSubmission.activityId}`}
                                                    className="inline-flex items-center text-sm text-white hover:text-[#FFD66D] hover:underline font-medium transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        closeSubmissionModal();
                                                    }}
                                                >
                                                    Xem chi tiết sự kiện →
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={closeSubmissionModal} 
                                    className="text-white hover:text-[#FFD66D] ml-4 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label htmlFor="submissionContent" className="block text-sm font-semibold text-gray-700 mb-2">
                                    📝 Nội dung (tùy chọn)
                                </label>
                                <textarea
                                    id="submissionContent"
                                    rows={5}
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                    className={`block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors ${
                                        currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                            ? 'bg-gray-100 cursor-not-allowed'
                                            : ''
                                    }`}
                                    placeholder="Nhập nội dung bài nộp của bạn..."
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="submissionFiles" className="block text-sm font-semibold text-gray-700 mb-2">
                                    📎 File đính kèm (tùy chọn)
                                </label>
                                <input
                                    type="file"
                                    id="submissionFiles"
                                    multiple
                                    onChange={handleFileChange}
                                    disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                    className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#001C44] file:to-[#002A66] file:text-[#FFD66D] hover:file:from-[#002A66] hover:file:to-[#001C44] transition-all ${
                                        currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                />
                                <p className="mt-2 text-xs text-gray-500">Cho phép chọn nhiều file cùng lúc.</p>
                                {submissionFilePreviews.length > 0 && (
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {submissionFilePreviews.map((fileUrl, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-[#001C44] hover:bg-gray-100 transition-all">
                                                <div className="w-10 h-10 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 3.414L16.586 7A2 2 0 0118 8.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h10V8.414L11.586 4H6z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            const filename = (fileUrl.split('/').pop() || 'file').trim();
                                                            const response = await api.get(fileUrl, { responseType: 'blob' });
                                                            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
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
                                                    className="text-[#001C44] hover:text-[#002A66] hover:underline text-sm truncate font-semibold transition-colors flex-1 text-left"
                                                >
                                                    {fileUrl.split('/').pop()}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="submissionImages" className="block text-sm font-semibold text-gray-700 mb-2">
                                    🖼️ Hình ảnh đính kèm (tùy chọn)
                                </label>
                                <input
                                    type="file"
                                    id="submissionImages"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                    className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#001C44] file:to-[#002A66] file:text-[#FFD66D] hover:file:from-[#002A66] hover:file:to-[#001C44] transition-all ${
                                        currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                />
                                <p className="mt-2 text-xs text-gray-500">Cho phép chọn nhiều hình ảnh cùng lúc.</p>
                                {submissionImagePreviews.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {submissionImagePreviews.map((imageUrl, index) => (
                                            <div key={index} className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group hover:border-[#001C44] transition-all">
                                                <img src={imageUrl} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {submissionError && (
                                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm font-medium">
                                    <div className="flex items-center">
                                        <span className="mr-2 text-lg">❌</span>
                                        {submissionError}
                                    </div>
                                </div>
                            )}
                            {submissionSuccess && (
                                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 text-sm font-medium">
                                    <div className="flex items-center">
                                        <span className="mr-2 text-lg">✅</span>
                                        {submissionSuccess}
                                    </div>
                                </div>
                            )}
                            {/* Graded result (if already graded) */}
                            {currentSubmission && (currentSubmission.isCompleted !== null || currentSubmission.feedback || currentSubmission.status === 'GRADED') && (
                                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span className="font-semibold text-gray-700">Trạng thái:</span>
                                        <span className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${getSubmissionStatusColor(currentSubmission.status)}`}>
                                            {getSubmissionStatusLabel(currentSubmission.status)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <span className="text-gray-600 text-xs block mb-1">Kết quả</span>
                                            <span className={`font-bold text-base ${
                                                currentSubmission.isCompleted === true ? 'text-green-600' : 
                                                currentSubmission.isCompleted === false ? 'text-red-600' : 
                                                'text-gray-600'
                                            }`}>
                                                {currentSubmission.isCompleted === true ? '✅ Đạt' : currentSubmission.isCompleted === false ? '❌ Không đạt' : '⏳ Chưa chấm'}
                                            </span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <span className="text-gray-600 text-xs block mb-1">Chấm lúc</span>
                                            <span className="font-semibold text-gray-900">{currentSubmission.gradedAt ? new Date(currentSubmission.gradedAt).toLocaleString('vi-VN') : '-'}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <span className="text-gray-600 text-xs block mb-1">Người chấm</span>
                                            <span className="font-semibold text-gray-900">{currentSubmission.graderUsername || '-'}</span>
                                        </div>
                                    </div>
                                    {currentSubmission.feedback && (
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <span className="text-gray-600 text-xs block mb-1">💬 Phản hồi</span>
                                            <span className="font-medium text-gray-900">{currentSubmission.feedback}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                {currentSubmission && (currentSubmission.status !== 'GRADED' && currentSubmission.isCompleted === null && currentSubmission.gradedAt === null) && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!currentSubmission) return;
                                            const confirmed = window.confirm('Bạn có chắc muốn xóa bài nộp này?');
                                            if (!confirmed) return;
                                            try {
                                                setSubmissionLoading(true);
                                                const res = await submissionAPI.deleteSubmission(currentSubmission.id);
                                                if (!res.status) {
                                                    throw new Error(res.message || 'Xóa bài nộp thất bại');
                                                }
                                                setSubmissionSuccess('Đã xóa bài nộp.');
                                                setCurrentSubmission(null);
                                                setSubmissionContent('');
                                                setSubmissionFiles([]);
                                                setSubmissionFilePreviews([]);
                                                // Refresh mapping and tasks
                                                await loadStudentTasks();
                                            } catch (e: any) {
                                                setSubmissionError(e.message || 'Có lỗi xảy ra khi xóa bài nộp.');
                                            } finally {
                                                setSubmissionLoading(false);
                                            }
                                        }}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md hover:shadow-lg"
                                    >
                                        🗑️ Xóa bài nộp
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeSubmissionModal}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    {currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null) ? 'Đóng' : 'Hủy'}
                                </button>
                                {!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)) && (
                                    <button
                                        type="submit"
                                        disabled={submissionLoading}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                                    >
                                        {submissionLoading ? '⏳ Đang lưu...' : (currentSubmission ? '💾 Cập nhật bài nộp' : '📤 Nộp bài')}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
};

export default StudentTasks;
