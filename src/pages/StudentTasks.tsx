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
                // fileUrls is now always an array from backend
                if (response.data.fileUrls && response.data.fileUrls.length > 0) {
                    setSubmissionFilePreviews(response.data.fileUrls);
                } else {
                    setSubmissionFilePreviews([]);
                }
                setSubmissionFiles([]); // Clear file input for existing submissions
            } else {
                setCurrentSubmission(null);
                setSubmissionContent('');
                setSubmissionFiles([]);
                setSubmissionFilePreviews([]);
            }
        } catch (error) {
            console.error('Error loading submission:', error);
            setSubmissionError('Không thể tải bài nộp của bạn.');
            setCurrentSubmission(null);
            setSubmissionContent('');
            setSubmissionFiles([]);
            setSubmissionFilePreviews([]);
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
        setSubmissionError('');
        setSubmissionSuccess('');
        loadStudentTasks(); // Reload tasks to update submission status
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSubmissionFiles(Array.from(e.target.files));
            // Generate previews for newly selected files
            const newPreviews = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setSubmissionFilePreviews(prev => [...prev, ...newPreviews]);
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
                {/* Summary */}
                <div className="flex justify-end items-center gap-3">
                    <div className="text-sm text-gray-600 font-medium">
                        Tổng: <span className="text-[#001C44]">{assignments.length}</span> nhiệm vụ
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-6">
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'ALL'
                                ? 'btn-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tất cả ({assignments.length})
                        </button>
                        {[TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED].map(status => {
                            const count = assignments.filter(a => a.status === status).length;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === status
                                        ? 'btn-primary text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    <div className="card p-8 text-center">
                        <div className="text-gray-400 text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
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
                            const isLate = assignment.submissionDeadline ? new Date() > new Date(assignment.submissionDeadline) : false;

                            return (
                                <div key={assignment.id} className="card hover:shadow-lg transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    {assignment.taskName}
                                                </h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                                    <span>Mã sinh viên: {assignment.studentCode}</span>
                                                    <span>•</span>
                                                    <span>Cập nhật: {formatDate(assignment.updatedAt)}</span>
                                                </div>
                                                {assignment.submissionDeadline && (
                                                    <p className={`text-sm ${isLate ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                                        Hạn nộp: {formatDate(assignment.submissionDeadline)}
                                                        {isLate && ' (Đã quá hạn)'}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                                                    {getStatusLabel(assignment.status)}
                                                </span>

                                                <button
                                                    onClick={() => openSubmissionModal(assignment)}
                                                    className="btn-primary px-4 py-2 text-sm font-medium rounded-md"
                                                >
                                                    {mySubmission 
                                                        ? (mySubmission.status === 'GRADED' || mySubmission.isCompleted !== null || mySubmission.gradedAt !== null)
                                                            ? 'Xem bài nộp'
                                                            : 'Xem/Sửa bài nộp'
                                                        : 'Nộp bài'}
                                                </button>
                                            </div>
                                        </div>
                                        {mySubmission && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium text-gray-700">Trạng thái:
                                                        <span className={`ml-2 px-2 py-1 rounded-full ${getSubmissionStatusColor(mySubmission.status)}`}>
                                                            {getSubmissionStatusLabel(mySubmission.status)}
                                                        </span>
                                                    </p>
                                                    <span className="text-gray-500">•</span>
                                                    <p className="text-gray-700">Nộp lúc: {formatDate(mySubmission.submittedAt)}</p>
                                                </div>
                                                {mySubmission.content && (
                                                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{mySubmission.content}</p>
                                                )}
                                                {(mySubmission.fileUrls && (Array.isArray(mySubmission.fileUrls) ? mySubmission.fileUrls.length > 0 : String(mySubmission.fileUrls).length > 0)) && (
                                                    <div className="mt-2">
                                                        <p className="text-gray-700 font-medium">File đính kèm:</p>
                                                        <div className="mt-1 space-y-1">
                                                            {(Array.isArray(mySubmission.fileUrls) ? mySubmission.fileUrls : String(mySubmission.fileUrls).split(',').map((u: string) => u.trim())).map((url: string, idx: number) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => handleDownload(url)}
                                                                    className="text-[#001C44] hover:text-[#002A66] hover:underline flex items-center text-sm font-medium transition-colors"
                                                                >
                                                                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                                                    </svg>
                                                                    {url.split('/').pop()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {(mySubmission.isCompleted !== null || mySubmission.feedback) && (
                                                    <div className="mt-2">
                                                        {mySubmission.isCompleted !== null && (
                                                            <p className="text-gray-700">Kết quả: {mySubmission.isCompleted === true ? 'Đạt' : mySubmission.isCompleted === false ? 'Không đạt' : 'Chưa chấm'}</p>
                                                        )}
                                                        {mySubmission.feedback && (
                                                            <p className="text-gray-700">Phản hồi: {mySubmission.feedback}</p>
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-900">Nộp bài cho: {currentTaskForSubmission.taskName}</h3>
                            <button onClick={closeSubmissionModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="submissionContent" className="block text-sm font-medium text-gray-700">Nội dung (tùy chọn)</label>
                                <textarea
                                    id="submissionContent"
                                    rows={5}
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors ${
                                        currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                            ? 'bg-gray-100 cursor-not-allowed'
                                            : ''
                                    }`}
                                    placeholder="Nhập nội dung bài nộp của bạn..."
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="submissionFiles" className="block text-sm font-medium text-gray-700">File đính kèm (tùy chọn)</label>
                                <input
                                    type="file"
                                    id="submissionFiles"
                                    multiple
                                    onChange={handleFileChange}
                                    disabled={!!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null))}
                                    className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#001C44] file:text-[#FFD66D] hover:file:bg-[#002A66] transition-colors ${
                                        currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }`}
                                />
                                <p className="mt-1 text-xs text-gray-500">Cho phép nhiều file.</p>
                                {submissionFilePreviews.length > 0 && (
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {submissionFilePreviews.map((fileUrl, index) => (
                                            <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md">
                                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 3.414L16.586 7A2 2 0 0118 8.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h10V8.414L11.586 4H6z" clipRule="evenodd" />
                                                </svg>
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
                                                    className="text-[#001C44] hover:text-[#002A66] hover:underline text-sm truncate font-medium transition-colors"
                                                >
                                                    {fileUrl.split('/').pop()}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {submissionError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                    {submissionError}
                                </div>
                            )}
                            {submissionSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                                    {submissionSuccess}
                                </div>
                            )}
                            {/* Graded result (if already graded) */}
                            {currentSubmission && (currentSubmission.isCompleted !== null || currentSubmission.feedback || currentSubmission.status === 'GRADED') && (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="font-medium text-gray-700">Trạng thái:</span>
                                        <span className={`px-2 py-1 rounded-full ${getSubmissionStatusColor(currentSubmission.status)}`}>
                                            {getSubmissionStatusLabel(currentSubmission.status)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div>
                                            <span className="text-gray-600">Kết quả: </span>
                                            <span className="font-medium">
                                                {currentSubmission.isCompleted === true ? 'Đạt' : currentSubmission.isCompleted === false ? 'Không đạt' : 'Chưa chấm'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Chấm lúc: </span>
                                            <span className="font-medium">{currentSubmission.gradedAt ? new Date(currentSubmission.gradedAt).toLocaleString('vi-VN') : '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Người chấm: </span>
                                            <span className="font-medium">{currentSubmission.graderUsername || '-'}</span>
                                        </div>
                                    </div>
                                    {currentSubmission.feedback && (
                                        <div className="mt-2">
                                            <span className="text-gray-600">Phản hồi: </span>
                                            <span className="font-medium">{currentSubmission.feedback}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end space-x-3">
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
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    >
                                        Xóa bài nộp
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeSubmissionModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    {currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null) ? 'Đóng' : 'Hủy'}
                                </button>
                                {!(currentSubmission && (currentSubmission.status === 'GRADED' || currentSubmission.isCompleted !== null || currentSubmission.gradedAt !== null)) && (
                                    <button
                                        type="submit"
                                        disabled={submissionLoading}
                                        className="btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
                                    >
                                        {submissionLoading ? 'Đang lưu...' : (currentSubmission ? 'Cập nhật bài nộp' : 'Nộp bài')}
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
