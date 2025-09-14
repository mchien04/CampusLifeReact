import React, { useState } from 'react';
import { TaskAssignmentResponse, TaskStatus } from '../../types/task';

interface TaskAssignmentsListProps {
    assignments: TaskAssignmentResponse[];
    loading?: boolean;
    onUpdateStatus?: (assignmentId: number, status: TaskStatus) => void;
    onRemove?: (assignmentId: number) => void;
    showActions?: boolean;
}

const TaskAssignmentsList: React.FC<TaskAssignmentsListProps> = ({
    assignments,
    loading = false,
    onUpdateStatus,
    onRemove,
    showActions = true
}) => {
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);

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
        if (!onUpdateStatus) return;

        setUpdatingId(assignmentId);
        try {
            await onUpdateStatus(assignmentId, newStatus);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRemove = async (assignmentId: number) => {
        if (!onRemove) return;

        if (!window.confirm('Bạn có chắc chắn muốn hủy phân công này?')) {
            return;
        }

        setRemovingId(assignmentId);
        try {
            await onRemove(assignmentId);
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-4 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có phân công nào</h3>
                <p className="text-gray-600">Nhiệm vụ này chưa được phân công cho sinh viên nào.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {assignments.map((assignment) => {
                const nextStatus = getNextStatus(assignment.status);

                return (
                    <div key={assignment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {assignment.studentName}
                                        </h4>
                                        <span className="text-sm text-gray-500">
                                            {assignment.studentCode}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cập nhật: {new Date(assignment.updatedAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                                        {getStatusLabel(assignment.status)}
                                    </span>

                                    {showActions && (
                                        <div className="flex space-x-2">
                                            {nextStatus && onUpdateStatus && (
                                                <button
                                                    onClick={() => handleStatusUpdate(assignment.id, nextStatus)}
                                                    disabled={updatingId === assignment.id}
                                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updatingId === assignment.id ? 'Đang cập nhật...' :
                                                        nextStatus === TaskStatus.IN_PROGRESS ? 'Bắt đầu' :
                                                            nextStatus === TaskStatus.COMPLETED ? 'Hoàn thành' : 'Tiếp tục'}
                                                </button>
                                            )}

                                            {onRemove && (
                                                <button
                                                    onClick={() => handleRemove(assignment.id)}
                                                    disabled={removingId === assignment.id}
                                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {removingId === assignment.id ? 'Đang xóa...' : 'Hủy'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TaskAssignmentsList;
