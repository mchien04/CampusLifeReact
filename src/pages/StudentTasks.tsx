import React, { useState, useEffect } from 'react';
import { TaskAssignmentResponse, TaskStatus } from '../types/task';
import { taskAPI } from '../services/taskAPI';

const StudentTasks: React.FC = () => {
    const [assignments, setAssignments] = useState<TaskAssignmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // TODO: Get student ID from auth context
    const studentId = 1;

    useEffect(() => {
        loadStudentTasks();
    }, []);

    const loadStudentTasks = async () => {
        setLoading(true);
        try {
            const response = await taskAPI.getStudentTasksNew(studentId);
            if (response.status && response.data) {
                setAssignments(response.data);
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải nhiệm vụ');
            }
        } catch (error) {
            console.error('Error loading student tasks:', error);
            setError('Có lỗi xảy ra khi tải nhiệm vụ');
        } finally {
            setLoading(false);
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
        } catch (error) {
            console.error('Error updating status:', error);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải nhiệm vụ...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadStudentTasks}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Thử lại
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
                            <h1 className="text-2xl font-bold text-gray-900">Nhiệm vụ của tôi</h1>
                            <p className="text-gray-600 mt-1">Danh sách các nhiệm vụ được phân công</p>
                        </div>
                        <div className="text-sm text-gray-500">
                            Tổng: {assignments.length} nhiệm vụ
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'ALL'
                                ? 'bg-blue-600 text-white'
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
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${filter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {getStatusLabel(status)} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {filteredAssignments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
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

                            return (
                                <div key={assignment.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    {assignment.taskName}
                                                </h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span>Mã sinh viên: {assignment.studentCode}</span>
                                                    <span>•</span>
                                                    <span>Cập nhật: {formatDate(assignment.updatedAt)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                                                    {getStatusLabel(assignment.status)}
                                                </span>

                                                {nextStatus && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(assignment.id, nextStatus)}
                                                        disabled={updatingId === assignment.id}
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updatingId === assignment.id ? 'Đang cập nhật...' :
                                                            nextStatus === TaskStatus.IN_PROGRESS ? 'Bắt đầu' :
                                                                nextStatus === TaskStatus.COMPLETED ? 'Hoàn thành' : 'Tiếp tục'}
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
    );
};

export default StudentTasks;
