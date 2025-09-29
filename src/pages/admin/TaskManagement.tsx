import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityTask, ActivityResponse, TaskFilters } from '../../types';
import { taskAPI, eventAPI } from '../../services';
import { TaskForm } from '../../components/task/TaskForm';
import { TaskAssignmentModal } from '../../components/task/TaskAssignmentModal';
import SubmissionDetailsModal from '../../components/task/SubmissionDetailsModal';

const TaskManagement: React.FC = () => {
    const [tasks, setTasks] = useState<ActivityTask[]>([]);
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<ActivityTask | null>(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ActivityTask | null>(null);
    const [showSubmissionDetailsModal, setShowSubmissionDetailsModal] = useState(false);
    const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<ActivityTask | null>(null);
    const [filters, setFilters] = useState<TaskFilters>({
        page: 0,
        size: 10,
    });
    const [pagination, setPagination] = useState({
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tasksResponse, activitiesResponse] = await Promise.all([
                taskAPI.getTasks(filters),
                eventAPI.getEvents()
            ]);

            // Build a quick lookup for requiresSubmission from activities
            const activityIdToRequires: Record<number, boolean> = {};
            (activitiesResponse.data || []).forEach((act) => {
                activityIdToRequires[act.id] = !!act.requiresSubmission;
            });

            const tasksWithSubmissionInfo = tasksResponse.content.map((task) => ({
                ...task,
                requiresSubmission: task.activity?.id ? activityIdToRequires[task.activity.id] : false,
            }));

            setTasks(tasksWithSubmissionInfo as ActivityTask[]);
            setPagination({
                totalElements: tasksResponse.totalElements,
                totalPages: tasksResponse.totalPages,
                currentPage: tasksResponse.number,
            });
            setActivities(activitiesResponse.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (data: any) => {
        try {
            const response = await taskAPI.createTaskNew(data);
            if (response.status) {
                setShowForm(false);
                await loadData();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    const handleUpdateTask = async (data: any) => {
        if (!editingTask) return;

        try {
            const response = await taskAPI.updateTaskNew(editingTask.id, data);
            if (response.status) {
                setShowForm(false);
                setEditingTask(null);
                await loadData();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
            return;
        }

        try {
            const response = await taskAPI.deleteTaskNew(taskId);
            if (response.status) {
                await loadData();
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Có lỗi xảy ra khi xóa nhiệm vụ');
        }
    };

    const handleAssignTask = (task: ActivityTask) => {
        setSelectedTask(task);
        setShowAssignmentModal(true);
    };

    const handleViewSubmissions = (task: ActivityTask) => {
        console.log('🔍 Manager: Open SubmissionDetailsModal for task:', { taskId: task.id, title: task.title, activityId: task.activity?.id });
        setSelectedTaskForSubmission(task);
        setShowSubmissionDetailsModal(true);
    };

    const handleFilterChange = (newFilters: Partial<TaskFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 0 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const getActivityName = (activityId: number): string => {
        const activity = activities.find(a => a.id === activityId);
        return activity?.name || 'Không xác định';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
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
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý nhiệm vụ</h1>
                            <p className="text-gray-600 mt-1">Quản lý và phân công nhiệm vụ cho sinh viên</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại Dashboard
                            </Link>
                            <button
                                onClick={() => {
                                    setEditingTask(null);
                                    setShowForm(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                + Tạo nhiệm vụ mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sự kiện
                            </label>
                            <select
                                value={filters.activityId || ''}
                                onChange={(e) => handleFilterChange({
                                    activityId: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả sự kiện</option>
                                {activities.map(activity => (
                                    <option key={activity.id} value={activity.id}>
                                        {activity.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ xử lý</option>
                                <option value="ACTIVE">Đang hoạt động</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <input
                                type="text"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange({ search: e.target.value })}
                                placeholder="Tìm theo tên nhiệm vụ..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Tasks Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tên nhiệm vụ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mô tả
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sự kiện
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Điểm tối đa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {task.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 max-w-xs truncate">
                                                {task.description || 'Không có mô tả'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {getActivityName(task.activity.id)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                task.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                                                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {task.status === 'PENDING' ? 'Chờ xử lý' :
                                                    task.status === 'ACTIVE' ? 'Đang hoạt động' :
                                                        task.status === 'COMPLETED' ? 'Hoàn thành' :
                                                            'Đã hủy'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {task.maxPoints || 'Không có'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {task.requiresSubmission && (
                                                    <button
                                                        onClick={() => handleViewSubmissions(task)}
                                                        className="text-purple-600 hover:text-purple-900"
                                                    >
                                                        Xem bài nộp
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleAssignTask(task)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Phân công
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingTask(task);
                                                        setShowForm(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 0}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages - 1}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Hiển thị{' '}
                                        <span className="font-medium">{pagination.currentPage * 10 + 1}</span>
                                        {' '}đến{' '}
                                        <span className="font-medium">
                                            {Math.min((pagination.currentPage + 1) * 10, pagination.totalElements)}
                                        </span>
                                        {' '}trong{' '}
                                        <span className="font-medium">{pagination.totalElements}</span>
                                        {' '}kết quả
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        {Array.from({ length: pagination.totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${i === pagination.currentPage
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Form Modal */}
            {showForm && (
                <TaskForm
                    taskData={editingTask}
                    activities={activities}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    onClose={() => {
                        setShowForm(false);
                        setEditingTask(null);
                    }}
                />
            )}

            {/* Task Assignment Modal */}
            {showAssignmentModal && selectedTask && (
                <TaskAssignmentModal
                    task={selectedTask}
                    onClose={() => {
                        setShowAssignmentModal(false);
                        setSelectedTask(null);
                    }}
                    onRefresh={loadData}
                />
            )}

            {/* Submission Details Modal */}
            {showSubmissionDetailsModal && selectedTaskForSubmission && (
                <SubmissionDetailsModal
                    task={selectedTaskForSubmission}
                    onClose={() => {
                        setShowSubmissionDetailsModal(false);
                        setSelectedTaskForSubmission(null);
                    }}
                    onSubmissionGraded={loadData} // Refresh parent data when submission is graded
                />
            )}
        </div>
    );
};

export default TaskManagement;
