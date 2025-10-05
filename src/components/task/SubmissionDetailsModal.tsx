import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { TaskAssignmentResponse, TaskStatus, ActivityTask } from '../../types/task';
import { SubmissionStatus, TaskSubmissionResponse } from '../../types/submission';
import { submissionAPI } from '../../services/submissionAPI';
import { getSubmissionStatusColor, getSubmissionStatusLabel } from '../../utils/submissionUtils';

interface SubmissionDetailsModalProps {
    task: ActivityTask;
    onClose: () => void;
    onSubmissionGraded: () => void; // Callback to refresh parent data
}

const SubmissionDetailsModal: React.FC<SubmissionDetailsModalProps> = ({
    task,
    onClose,
    onSubmissionGraded,
}) => {
    const [submissions, setSubmissions] = useState<TaskSubmissionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
    const [currentScore, setCurrentScore] = useState<number | ''>('');
    const [currentFeedback, setCurrentFeedback] = useState('');
    const [gradingError, setGradingError] = useState('');
    const [gradingSuccess, setGradingSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const loadSubmissions = useCallback(async () => {
        console.log('🔍 SubmissionDetailsModal: loading submissions for taskId=', task.id);
        setLoading(true);
        setError('');
        try {
            const response = await submissionAPI.getTaskSubmissions(task.id);
            console.log('🔍 SubmissionDetailsModal: API response:', response);
            if (response.status && response.data) {
                const list = Array.isArray(response.data)
                    ? response.data
                    : typeof response.data === 'object'
                        ? [response.data]
                        : [];
                setSubmissions(list);
            } else {
                setError(response.message || 'Không thể tải danh sách bài nộp.');
            }
        } catch (err) {
            console.error('Error loading submissions:', err);
            setError('Có lỗi xảy ra khi tải danh sách bài nộp.');
        } finally {
            setLoading(false);
        }
    }, [task.id]);

    useEffect(() => {
        loadSubmissions();
    }, [loadSubmissions]);

    const handleGradeSubmission = async (submissionId: number) => {
        if (currentScore === '' || isNaN(Number(currentScore))) {
            setGradingError('Vui lòng nhập điểm hợp lệ.');
            return;
        }
        if (currentScore < 0 || currentScore > (task.maxPoints || 10)) {
            setGradingError(`Điểm phải nằm trong khoảng từ 0 đến ${task.maxPoints || 10}.`);
            return;
        }

        setGradingSubmissionId(submissionId);
        setGradingError('');
        setGradingSuccess('');

        try {
            setIsSaving(true);
            const response = await submissionAPI.gradeSubmission(submissionId, Number(currentScore), currentFeedback || undefined);
            if (response.status) {
                setGradingSuccess('Chấm điểm thành công!');
                onSubmissionGraded(); // Notify parent to refresh
                await loadSubmissions(); // Reload submissions in modal
                setCurrentScore(''); // Clear form
                setCurrentFeedback('');
            } else {
                setGradingError(response.message || 'Có lỗi xảy ra khi chấm điểm.');
            }
        } catch (err) {
            console.error('Error grading submission:', err);
            setGradingError('Có lỗi xảy ra khi chấm điểm.');
        } finally {
            setIsSaving(false);
            setGradingSubmissionId(null);
        }
    };

    const handleEditGrade = (submission: TaskSubmissionResponse) => {
        setCurrentScore(submission.score ?? '');
        setCurrentFeedback(submission.feedback ?? '');
        setGradingSubmissionId(submission.id);
        setGradingError('');
        setGradingSuccess('');
    };

    const handleCancelGrade = () => {
        setGradingSubmissionId(null);
        setCurrentScore('');
        setCurrentFeedback('');
        setGradingError('');
        setGradingSuccess('');
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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Bài nộp cho: {task.title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Đang tải bài nộp...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-600">
                            <p>{error}</p>
                        </div>
                    ) : (!Array.isArray(submissions) || submissions.length === 0) ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Chưa có bài nộp nào cho nhiệm vụ này.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {submissions.map((submission) => (
                                <div key={submission.id} className="border border-gray-200 rounded-md p-4 bg-white shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-md font-semibold text-gray-800">Sinh viên: {submission.studentName} ({submission.studentCode})</p>
                                            <p className="text-sm text-gray-500">Nộp lúc: {formatDate(submission.submittedAt)}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubmissionStatusColor(submission.status)}`}>
                                            {getSubmissionStatusLabel(submission.status)}
                                        </span>
                                    </div>

                                    {submission.content && (
                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-gray-700">Nội dung:</p>
                                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{submission.content}</p>
                                        </div>
                                    )}

                                    {submission.fileUrls && (() => {
                                        // Normalize fileUrls to always be an array
                                        const fileUrlsArray = Array.isArray(submission.fileUrls)
                                            ? submission.fileUrls
                                            : (typeof submission.fileUrls === 'string'
                                                ? submission.fileUrls.split(',').map((url: string) => url.trim())
                                                : []);

                                        return fileUrlsArray.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-700">File đính kèm:</p>
                                                <div className="mt-1 space-y-1">
                                                    {fileUrlsArray.map((fileUrl: string, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleDownload(fileUrl)}
                                                            className="flex items-center text-blue-600 hover:underline text-sm"
                                                        >
                                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                                            </svg>
                                                            {fileUrl.split('/').pop()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Grading Section */}
                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h4 className="text-md font-semibold text-gray-800 mb-2">Chấm điểm:</h4>
                                        {(submission.status === SubmissionStatus.GRADED || gradingSubmissionId === submission.id) && (
                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-700">Điểm: <span className="font-normal">{submission.score ?? 'Chưa chấm'}</span></p>
                                                {submission.feedback && <p className="text-sm font-medium text-gray-700">Phản hồi: <span className="font-normal">{submission.feedback}</span></p>}
                                            </div>
                                        )}

                                        {gradingSubmissionId === submission.id ? (
                                            <div>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <label htmlFor={`score-${submission.id}`} className="block text-sm font-medium text-gray-700">Điểm ({0}-{task.maxPoints || 10})</label>
                                                        <input
                                                            type="number"
                                                            id={`score-${submission.id}`}
                                                            value={currentScore}
                                                            onChange={(e) => setCurrentScore(Number(e.target.value))}
                                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            min="0"
                                                            max={task.maxPoints || 10}
                                                            step="0.5"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`feedback-${submission.id}`} className="block text-sm font-medium text-gray-700">Phản hồi (tùy chọn)</label>
                                                        <textarea
                                                            id={`feedback-${submission.id}`}
                                                            rows={2}
                                                            value={currentFeedback}
                                                            onChange={(e) => setCurrentFeedback(e.target.value)}
                                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Nhập phản hồi..."
                                                        ></textarea>
                                                    </div>
                                                </div>
                                                {gradingError && <p className="text-sm text-red-600 mb-2">{gradingError}</p>}
                                                {gradingSuccess && <p className="text-sm text-green-600 mb-2">{gradingSuccess}</p>}
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleGradeSubmission(submission.id)}
                                                        disabled={isSaving}
                                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {isSaving ? 'Đang lưu...' : 'Lưu điểm'}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelGrade}
                                                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditGrade(submission)}
                                                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                                            >
                                                {submission.status === SubmissionStatus.GRADED ? 'Sửa điểm' : 'Chấm điểm'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetailsModal;
