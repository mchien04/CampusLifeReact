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
import { 
    Notepad, 
    CalendarBlank, 
    Clock, 
    Eye, 
    PencilSimple, 
    UploadSimple, 
    Paperclip, 
    Image as ImageIcon, 
    CheckCircle, 
    ChatCircle, 
    Trash,
    WarningCircle,
    ClipboardText,
    FileText,
    X,
    DownloadSimple,
    ListChecks,
    XCircle,
    CircleNotch,
    FloppyDisk,
    PaperPlaneRight
} from '@phosphor-icons/react';

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
                <div className="relative overflow-hidden bg-primary-900 rounded-3xl shadow-premium p-8 md:p-10 text-white mb-8 border border-primary-900/10">
                    <div className="absolute inset-0 bg-white/5" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.1 }}></div>
                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm border border-white/10">
                                <ListChecks weight="duotone" className="w-8 h-8 text-accent" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Nhiệm vụ của tôi</h1>
                            <p className="text-white/70 text-lg max-w-xl">Quản lý và theo dõi tiến độ các nhiệm vụ được phân công từ sự kiện.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 min-w-[160px] text-center">
                            <div className="text-sm text-white/70 font-medium uppercase tracking-wider mb-1">Tổng số</div>
                            <div className="text-5xl font-black text-accent">{assignments.length}</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex flex-wrap gap-1">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            filter === 'ALL'
                                ? 'bg-primary-900 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                    >
                        Tất cả ({assignments.length})
                    </button>
                    {[TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.OVERDUE, TaskStatus.CANCELLED].map(status => {
                        const count = assignments.filter(a => a.status === status).length;
                        return (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    filter === status
                                        ? 'bg-primary-900 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                                }`}
                            >
                                {getStatusLabel(status)} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Tasks List */}
                {filteredAssignments.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ListChecks weight="duotone" className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {filter === 'ALL' ? 'Chưa có nhiệm vụ nào' : `Không có nhiệm vụ ${getStatusLabel(filter as TaskStatus).toLowerCase()}`}
                        </h3>
                        <p className="text-gray-500">
                            {filter === 'ALL'
                                ? 'Bạn chưa được phân công nhiệm vụ nào từ các sự kiện.'
                                : `Hiện tại không có nhiệm vụ nào ở trạng thái này.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAssignments.map((assignment) => {
                            const nextStatus = getNextStatus(assignment.status);
                            const mySubmission = mySubmissionsByTask[assignment.taskId] || null;

                            return (
                                <div key={assignment.id} className="bg-white rounded-3xl shadow-sm hover:shadow-premium-hover border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden">
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-900 border border-primary-100 flex-shrink-0">
                                                        <Notepad weight="duotone" className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center flex-wrap gap-2 mb-1">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${getStatusColor(assignment.status).replace('bg-', 'bg-opacity-20 text-').replace('text-', 'text-')}`}>
                                                                {getStatusLabel(assignment.status)}
                                                            </span>
                                                            {assignment.requiresSubmission === false && (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gray-100 text-gray-600">
                                                                    Tùy chọn
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                                                            {assignment.taskName}
                                                        </h3>
                                                        {assignment.activityName && (
                                                            <div className="mb-4 flex items-center flex-wrap gap-2">
                                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                                                                    <CalendarBlank className="w-4 h-4 mr-1.5 text-gray-500" />
                                                                    {assignment.activityName}
                                                                </span>
                                                                {assignment.activityId && (
                                                                    <Link
                                                                        to={`/student/events/${assignment.activityId}`}
                                                                        className="inline-flex items-center text-sm text-primary-900 hover:text-primary-800 hover:underline font-semibold transition-colors"
                                                                    >
                                                                        Xem chi tiết →
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-gray-500">ID</span>
                                                        </div>
                                                        <span className="font-semibold text-gray-900">{assignment.studentCode}</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span>Cập nhật: <span className="font-semibold text-gray-900">{formatDate(assignment.updatedAt)}</span></span>
                                                    </div>
                                                </div>
                                                
                                                {assignment.submissionDeadline && assignment.requiresSubmission !== false && (
                                                    <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold ${
                                                        assignment.status === TaskStatus.OVERDUE 
                                                            ? 'bg-red-50 text-red-700 border border-red-100' 
                                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}>
                                                        <Clock weight="fill" className="w-4 h-4 mr-2" />
                                                        Hạn nộp: {formatDate(assignment.submissionDeadline)}
                                                        {assignment.status === TaskStatus.OVERDUE && <span className="ml-2 font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 bg-red-100 rounded-full">Quá hạn</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex lg:flex-col items-center lg:items-end gap-3 flex-shrink-0 w-full lg:w-auto">
                                                <button
                                                    onClick={() => openSubmissionModal(assignment)}
                                                    className="w-full lg:w-auto inline-flex items-center justify-center px-6 py-3 bg-primary-900 text-white rounded-xl hover:bg-primary-800 font-semibold shadow-sm hover:shadow-md transition-all text-sm group"
                                                >
                                                    {mySubmission 
                                                        ? (mySubmission.status === 'GRADED' || mySubmission.isCompleted !== null || mySubmission.gradedAt !== null)
                                                            ? <><Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Xem bài nộp</>
                                                            : <><PencilSimple className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Xem/Sửa bài nộp</>
                                                        : <><UploadSimple className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 transition-transform" /> Nộp bài</>}
                                                </button>
                                            </div>
                                        </div>
                                        {mySubmission && (
                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                                                            <CheckCircle className={`w-6 h-6 ${mySubmission.status === 'GRADED' ? 'text-green-500' : 'text-gray-400'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm text-gray-500 font-medium mb-0.5">Trạng thái bài nộp</div>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getSubmissionStatusColor(mySubmission.status).replace('bg-', 'bg-opacity-20 text-').replace('text-', 'text-')}`}>
                                                                {getSubmissionStatusLabel(mySubmission.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                                        <Clock className="w-4 h-4 mr-1.5" />
                                                        Nộp lúc: <span className="font-semibold text-gray-900 ml-1">{formatDate(mySubmission.submittedAt)}</span>
                                                    </div>
                                                </div>
                                                
                                                {mySubmission.content && (
                                                    <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 whitespace-pre-wrap text-sm relative">
                                                        <ClipboardText className="absolute top-4 right-4 w-5 h-5 text-gray-300" />
                                                        {mySubmission.content}
                                                    </div>
                                                )}

                                                {((mySubmission.attachments && mySubmission.attachments.length > 0) || (mySubmission.fileUrls && (Array.isArray(mySubmission.fileUrls) ? mySubmission.fileUrls.length > 0 : String(mySubmission.fileUrls).length > 0))) && (
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                                                            <Paperclip className="w-4 h-4 mr-1.5" /> File đính kèm
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {((mySubmission.attachments && mySubmission.attachments.length > 0)
                                                                ? mySubmission.attachments.filter((attachment) => attachment.type === 'file').map((attachment) => attachment.url)
                                                                : (Array.isArray(mySubmission.fileUrls) ? mySubmission.fileUrls : String(mySubmission.fileUrls).split(',').map((u: string) => u.trim()))
                                                            ).map((url: string, idx: number) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => handleDownload(url)}
                                                                    className="flex items-center p-3 bg-white rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-sm transition-all text-sm font-medium group"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors">
                                                                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                                                                    </div>
                                                                    <span className="truncate flex-1 text-left text-gray-700 group-hover:text-primary-700">{url.split('/').pop()}</span>
                                                                    <DownloadSimple className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {mySubmission.attachments?.some((attachment) => attachment.type === 'image') && (
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                                                            <ImageIcon className="w-4 h-4 mr-1.5" /> Hình ảnh minh chứng
                                                        </h4>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                            {mySubmission.attachments
                                                                .filter((attachment) => attachment.type === 'image')
                                                                .map((attachment, idx) => (
                                                                <a
                                                                    key={`image-${idx}`}
                                                                    href={attachment.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 hover:border-primary-500 group"
                                                                >
                                                                    <img
                                                                        src={attachment.url}
                                                                        alt={`Minh chứng ${idx + 1}`}
                                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {(mySubmission.isCompleted !== null || mySubmission.feedback) && (
                                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mt-4">
                                                        {mySubmission.isCompleted !== null && (
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mySubmission.isCompleted === true ? 'bg-green-100 text-green-600' : mySubmission.isCompleted === false ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                                                                    {mySubmission.isCompleted === true ? <CheckCircle weight="fill" className="w-6 h-6" /> : mySubmission.isCompleted === false ? <XCircle weight="fill" className="w-6 h-6" /> : <Clock weight="fill" className="w-6 h-6" />}
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Kết quả đánh giá</div>
                                                                    <div className={`font-bold ${
                                                                        mySubmission.isCompleted === true ? 'text-green-600' : 
                                                                        mySubmission.isCompleted === false ? 'text-red-600' : 
                                                                        'text-gray-600'
                                                                    }`}>
                                                                        {mySubmission.isCompleted === true ? 'Đạt yêu cầu' : mySubmission.isCompleted === false ? 'Không đạt' : 'Chưa có kết quả'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {mySubmission.feedback && (
                                                            <div className="bg-white p-4 rounded-xl border border-gray-200 relative mt-4 ml-2">
                                                                <div className="absolute -left-3 top-4 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                                                                    <ChatCircle weight="fill" className="w-3.5 h-3.5 text-primary-500" />
                                                                </div>
                                                                <div className="text-sm font-bold text-gray-900 mb-1 ml-2">Phản hồi từ người chấm:</div>
                                                                <div className="text-gray-700 text-sm ml-2">{mySubmission.feedback}</div>
                                                            </div>
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
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative border border-white/20">
                        <div className="bg-white p-6 md:p-8 border-b border-gray-100">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-900 border border-primary-100">
                                            <UploadSimple weight="duotone" className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-2xl font-extrabold text-gray-900">Nộp bài</h3>
                                    </div>
                                    <p className="text-gray-500 font-medium ml-13">Nhiệm vụ: <span className="text-gray-900 font-bold">{currentTaskForSubmission.taskName}</span></p>
                                    
                                    {currentTaskForSubmission.activityName && (
                                        <div className="flex items-center flex-wrap gap-2 mt-4 ml-13">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                                                <CalendarBlank className="w-4 h-4 mr-1.5 text-gray-500" />
                                                {currentTaskForSubmission.activityName}
                                            </span>
                                            {currentTaskForSubmission.activityId && (
                                                <Link
                                                    to={`/student/events/${currentTaskForSubmission.activityId}`}
                                                    className="inline-flex items-center text-sm text-primary-900 hover:text-primary-700 hover:underline font-semibold transition-colors"
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
                                    className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 bg-gray-50/30">
                            <div>
                                <label htmlFor="submissionContent" className="flex items-center text-sm font-bold text-gray-900 mb-2">
                                    <Notepad className="w-4 h-4 mr-2 text-gray-500" />
                                    Nội dung bài nộp <span className="ml-2 text-xs font-normal text-gray-500">(tùy chọn)</span>
                                </label>
                                <textarea
                                    id="submissionContent"
                                    rows={5}
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                    className={`block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-gray-400 ${
                                        currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                            ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                                            : ''
                                    }`}
                                    placeholder="Nhập nội dung bài nộp của bạn..."
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="submissionFiles" className="flex items-center text-sm font-bold text-gray-900 mb-2">
                                    <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
                                    File đính kèm <span className="ml-2 text-xs font-normal text-gray-500">(tùy chọn, cho phép nhiều file)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="submissionFiles"
                                        multiple
                                        onChange={handleFileChange}
                                        disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                        className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all ${
                                            currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                                ? 'opacity-50 cursor-not-allowed'
                                                : ''
                                        }`}
                                    />
                                </div>
                                {submissionFilePreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {submissionFilePreviews.map((fileUrl, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-sm transition-all group">
                                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 transition-colors">
                                                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
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
                                                    className="text-gray-700 group-hover:text-primary-700 text-sm truncate font-medium transition-colors flex-1 text-left"
                                                >
                                                    {fileUrl.split('/').pop()}
                                                </button>
                                                <DownloadSimple className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="submissionImages" className="flex items-center text-sm font-bold text-gray-900 mb-2">
                                    <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
                                    Hình ảnh đính kèm <span className="ml-2 text-xs font-normal text-gray-500">(tùy chọn)</span>
                                </label>
                                <input
                                    type="file"
                                    id="submissionImages"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                    className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all ${
                                        currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                />
                                {submissionImagePreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {submissionImagePreviews.map((imageUrl, index) => (
                                            <div key={index} className="relative aspect-square border border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-all group">
                                                <img src={imageUrl} alt={`Preview ${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {submissionError && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium flex items-center">
                                    <WarningCircle weight="fill" className="w-5 h-5 mr-2 text-red-500" />
                                    {submissionError}
                                </div>
                            )}
                            {submissionSuccess && (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex items-center">
                                    <CheckCircle weight="fill" className="w-5 h-5 mr-2 text-green-500" />
                                    {submissionSuccess}
                                </div>
                            )}

                            {/* Graded result (if already graded) */}
                            {currentSubmission && (currentSubmission.isCompleted !== null || currentSubmission.feedback || currentSubmission.status === 'GRADED') && (
                                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSubmission.isCompleted === true ? 'bg-green-100 text-green-600' : currentSubmission.isCompleted === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {currentSubmission.isCompleted === true ? <CheckCircle weight="fill" className="w-6 h-6" /> : currentSubmission.isCompleted === false ? <XCircle weight="fill" className="w-6 h-6" /> : <Clock weight="fill" className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">Kết quả đánh giá</div>
                                                <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getSubmissionStatusColor(currentSubmission.status).replace('bg-', 'bg-opacity-20 text-').replace('text-', 'text-')}`}>
                                                    {getSubmissionStatusLabel(currentSubmission.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right w-full sm:w-auto bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Chấm lúc</div>
                                            <div className="font-semibold text-gray-900">{currentSubmission.gradedAt ? new Date(currentSubmission.gradedAt).toLocaleString('vi-VN') : '-'}</div>
                                        </div>
                                    </div>
                                    
                                    {currentSubmission.feedback && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative mt-4 ml-4">
                                            <div className="absolute -left-4 top-4 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                                                <ChatCircle weight="fill" className="w-4 h-4 text-primary-500" />
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 mb-1 ml-2">Phản hồi từ {currentSubmission.graderUsername || 'người chấm'}:</div>
                                            <div className="text-gray-700 text-sm ml-2">{currentSubmission.feedback}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end items-center gap-3 pt-6 border-t border-gray-100 mt-8">
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
                                        className="px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all flex items-center justify-center border border-transparent hover:border-red-200"
                                    >
                                        <Trash className="w-5 h-5 mr-2" />
                                        Xóa bài nộp
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeSubmissionModal}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center shadow-sm"
                                >
                                    {currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null) ? 'Đóng' : 'Hủy'}
                                </button>
                                {!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)) && (
                                    <button
                                        type="submit"
                                        disabled={submissionLoading}
                                        className="px-6 py-2.5 text-sm font-bold text-white bg-primary-900 rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {submissionLoading ? (
                                            <>
                                                <CircleNotch className="w-5 h-5 animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : currentSubmission ? (
                                            <>
                                                <FloppyDisk className="w-5 h-5" />
                                                Cập nhật
                                            </>
                                        ) : (
                                            <>
                                                <PaperPlaneRight className="w-5 h-5" />
                                                Nộp bài
                                            </>
                                        )}
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
