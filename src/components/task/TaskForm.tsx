import React, { useState, useEffect } from 'react';
import { ActivityTask, ActivityResponse, CreateTaskRequest, UpdateTaskRequest } from '../../types';

interface TaskFormProps {
    taskData?: ActivityTask | null;
    activities: ActivityResponse[];
    onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
    onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
    taskData,
    activities,
    onSubmit,
    onClose,
}) => {
    const [formData, setFormData] = useState({
        activityId: 0,
        title: '',
        description: '',
        requiresSubmission: false,
        maxPoints: '',
        dueDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (taskData) {
            setFormData({
                activityId: taskData.activity.id,
                title: taskData.title,
                description: taskData.description || '',
                requiresSubmission: taskData.requiresSubmission,
                maxPoints: taskData.maxPoints?.toString() || '',
                dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : '',
            });
        }
    }, [taskData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tên nhiệm vụ là bắt buộc';
        } else if (formData.title.trim().length < 2) {
            newErrors.title = 'Tên nhiệm vụ phải có ít nhất 2 ký tự';
        }

        if (!formData.activityId) {
            newErrors.activityId = 'Vui lòng chọn sự kiện';
        }

        if (formData.requiresSubmission && formData.maxPoints) {
            const points = parseFloat(formData.maxPoints);
            if (isNaN(points) || points <= 0) {
                newErrors.maxPoints = 'Điểm tối đa phải là số dương';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                activityId: formData.activityId,
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                requiresSubmission: formData.requiresSubmission,
                maxPoints: formData.requiresSubmission && formData.maxPoints ? parseFloat(formData.maxPoints) : undefined,
                dueDate: formData.dueDate || undefined,
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {taskData ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <span className="sr-only">Đóng</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="activityId" className="block text-sm font-medium text-gray-700">
                                Sự kiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="activityId"
                                name="activityId"
                                value={formData.activityId}
                                onChange={handleChange}
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.activityId ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value={0}>Chọn sự kiện</option>
                                {activities.map(activity => (
                                    <option key={activity.id} value={activity.id}>
                                        {activity.name}
                                    </option>
                                ))}
                            </select>
                            {errors.activityId && (
                                <p className="mt-1 text-sm text-red-600">{errors.activityId}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Tên nhiệm vụ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Nhập tên nhiệm vụ"
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Mô tả
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập mô tả nhiệm vụ"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="requiresSubmission"
                                name="requiresSubmission"
                                type="checkbox"
                                checked={formData.requiresSubmission}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="requiresSubmission" className="ml-2 block text-sm text-gray-900">
                                Yêu cầu nộp bài
                            </label>
                        </div>

                        {formData.requiresSubmission && (
                            <div>
                                <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700">
                                    Điểm tối đa
                                </label>
                                <input
                                    type="number"
                                    id="maxPoints"
                                    name="maxPoints"
                                    value={formData.maxPoints}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.1"
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.maxPoints ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Nhập điểm tối đa"
                                />
                                {errors.maxPoints && (
                                    <p className="mt-1 text-sm text-red-600">{errors.maxPoints}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                                Hạn hoàn thành
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Đang xử lý...' : (taskData ? 'Cập nhật' : 'Tạo mới')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
