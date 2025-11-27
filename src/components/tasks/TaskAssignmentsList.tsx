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
                return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300';
            case TaskStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-800 border-2 border-blue-300';
            case TaskStatus.COMPLETED:
                return 'bg-green-100 text-green-800 border-2 border-green-300';
            case TaskStatus.CANCELLED:
                return 'bg-red-100 text-red-800 border-2 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-2 border-gray-300';
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
                    <div key={assignment.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                        <div className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h4 className="text-base font-bold text-[#001C44]">
                                            {assignment.studentName}
                                        </h4>
                                        <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                                            {assignment.studentCode}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        📅 Cập nhật: {new Date(assignment.updatedAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border-2 shadow-sm ${getStatusColor(assignment.status)}`}>
                                        {getStatusLabel(assignment.status)}
                                    </span>

                                    {showActions && (
                                        <div className="flex space-x-2">
                                            {onRemove && (
                                                <button
                                                    onClick={() => handleRemove(assignment.id)}
                                                    disabled={removingId === assignment.id}
                                                    className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                                                >
                                                    {removingId === assignment.id ? 'Đang xóa...' : '🗑️ Hủy'}
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
