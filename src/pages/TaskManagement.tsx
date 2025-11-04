import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityResponse, ActivityType } from '../types/activity';
import { ActivityTaskResponse } from '../types/task';
import { eventAPI } from '../services/eventAPI';
import { taskAPI } from '../services/taskAPI';
import { TaskList } from '../components/tasks';

const TaskManagement: React.FC = () => {
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<ActivityResponse | null>(null);
    const [tasks, setTasks] = useState<ActivityTaskResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const response = await eventAPI.getEvents();
            if (response.status && response.data) {
                setEvents(response.data);
                if (response.data.length > 0) {
                    setSelectedEvent(response.data[0]);
                }
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải danh sách hoạt động');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            setError('Có lỗi xảy ra khi tải danh sách hoạt động');
        } finally {
            setLoading(false);
        }
    };

    const loadTasks = async (eventId: number) => {
        setLoadingTasks(true);
        try {
            const response = await taskAPI.getTasksByActivity(eventId);
            if (response.status && response.data) {
                setTasks(response.data);
            } else {
                setTasks([]);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        if (selectedEvent) {
            loadTasks(selectedEvent.id);
        }
    }, [selectedEvent]);

    const getTypeLabel = (type: ActivityType): string => {
        const typeLabels: Record<ActivityType, string> = {
            [ActivityType.SUKIEN]: 'Sự kiện',
            [ActivityType.MINIGAME]: 'Mini Game',
            [ActivityType.SERIES_BONUS]: 'Chuỗi sự kiện',
            [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp',
        };

        return typeLabels[type] || type;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const getTotalStats = () => {
        const totalTasks = tasks.length;
        const totalAssignments = tasks.reduce((sum, task) => sum + task.totalAssignments, 0);
        const completedAssignments = tasks.reduce((sum, task) => sum + task.completedAssignments, 0);
        const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

        return {
            totalTasks,
            totalAssignments,
            completedAssignments,
            completionRate
        };
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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadEvents}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const stats = getTotalStats();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý nhiệm vụ</h1>
                            <p className="text-gray-600 mt-1">Tổng quan và quản lý tất cả nhiệm vụ</p>
                        </div>
                        <Link
                            to="/manager/events"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Quay lại sự kiện
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                                    <span className="text-blue-600 text-lg">📋</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng nhiệm vụ</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalTasks}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                                    <span className="text-green-600 text-lg">👥</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng phân công</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalAssignments}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                                    <span className="text-yellow-600 text-lg">✅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Đã hoàn thành</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.completedAssignments}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                                    <span className="text-purple-600 text-lg">📊</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tỷ lệ hoàn thành</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.completionRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Selection and Tasks */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Event List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Chọn hoạt động</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {events.map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 ${selectedEvent?.id === event.id ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                    {event.name}
                                                </h4>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded-full">
                                                        {getTypeLabel(event.type)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{formatDate(event.startDate)}</span>
                                                </div>
                                                {event.isImportant && (
                                                    <span className="text-yellow-500 text-sm">⭐ Quan trọng</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tasks List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Nhiệm vụ
                                        {selectedEvent && ` - ${selectedEvent.name}`}
                                    </h3>
                                    {selectedEvent && (
                                        <Link
                                            to={`/manager/events/${selectedEvent.id}`}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Quản lý chi tiết
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="p-6">
                                {selectedEvent ? (
                                    <TaskList
                                        tasks={tasks}
                                        loading={loadingTasks}
                                        showActions={false}
                                    />
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-4xl mb-4">📋</div>
                                        <p className="text-gray-600">Chọn một hoạt động để xem nhiệm vụ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskManagement;
