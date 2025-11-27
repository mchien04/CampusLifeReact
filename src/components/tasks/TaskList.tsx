import React, { useState } from 'react';
import { ActivityTaskResponse, TaskStatus } from '../../types/task';

interface TaskListProps {
    tasks: ActivityTaskResponse[];
    loading?: boolean;
    onEdit?: (task: ActivityTaskResponse) => void;
    onDelete?: (taskId: number) => void;
    onAssign?: (task: ActivityTaskResponse) => void;
    onViewAssignments?: (task: ActivityTaskResponse) => void;
    showActions?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
    tasks,
    loading = false,
    onEdit,
    onDelete,
    onAssign,
    onViewAssignments,
    showActions = true
}) => {
    const [deletingId, setDeletingId] = useState<number | null>(null);

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

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Không có hạn chót';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const isOverdue = (deadline?: string): boolean => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="flex space-x-4">
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có nhiệm vụ nào</h3>
                <p className="text-gray-600">Chưa có nhiệm vụ nào được tạo cho hoạt động này.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-[#001C44] mb-2">
                                    {task.name}
                                </h3>
                                {task.description && (
                                    <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">
                                        {task.description}
                                    </p>
                                )}
                            </div>
                            {showActions && (
                                <div className="flex space-x-2 ml-4">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(task)}
                                            className="p-2.5 text-[#001C44] hover:bg-[#001C44] hover:text-white rounded-lg transition-all"
                                            title="Chỉnh sửa nhiệm vụ"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(task.id)}
                                            disabled={deletingId === task.id}
                                            className="p-2.5 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all disabled:opacity-50"
                                            title="Xóa nhiệm vụ"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Task Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <span className="w-6 h-6 mr-3 text-[#001C44] text-lg">📅</span>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hạn chót</p>
                                    <p className={`font-bold text-sm mt-1 ${isOverdue(task.deadline) ? 'text-red-600' : 'text-[#001C44]'}`}>
                                        {formatDate(task.deadline)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <span className="w-6 h-6 mr-3 text-blue-600 text-lg">👥</span>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tổng phân công</p>
                                    <p className="font-bold text-sm mt-1 text-[#001C44]">{task.totalAssignments || 0}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <span className="w-6 h-6 mr-3 text-green-600 text-lg">✅</span>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hoàn thành</p>
                                    <p className="font-bold text-sm mt-1 text-[#001C44]">
                                        {task.completedAssignments || 0}/{task.totalAssignments || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {task.totalAssignments > 0 && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm font-semibold text-[#001C44] mb-2">
                                    <span>Tiến độ hoàn thành</span>
                                    <span className="text-[#FFD66D]">{Math.round((task.completedAssignments / task.totalAssignments) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-[#001C44] to-[#002A66] h-3 rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${(task.completedAssignments / task.totalAssignments) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {showActions && (
                            <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-200">
                                {onAssign && (
                                    <button
                                        onClick={() => onAssign(task)}
                                        className="px-5 py-2.5 bg-[#001C44] text-white text-sm font-medium rounded-lg hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-all shadow-sm hover:shadow-md"
                                    >
                                        ➕ Phân công
                                    </button>
                                )}
                                {onViewAssignments && (
                                    <button
                                        onClick={() => onViewAssignments(task)}
                                        className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] text-sm font-medium rounded-lg hover:bg-[#FFC947] focus:outline-none focus:ring-2 focus:ring-[#FFD66D] transition-all shadow-sm hover:shadow-md"
                                    >
                                        👁️ Xem phân công ({task.totalAssignments || 0})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TaskList;
