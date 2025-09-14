import React, { useState } from 'react';
import { CreateActivityTaskRequest } from '../../types/task';

interface TaskFormProps {
    onSubmit: (data: CreateActivityTaskRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateActivityTaskRequest>;
    title?: string;
    onCancel?: () => void;
    activityId: number;
    activityName: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo nhiệm vụ mới",
    onCancel,
    activityId,
    activityName
}) => {
    const [formData, setFormData] = useState<CreateActivityTaskRequest>({
        name: '',
        description: '',
        deadline: '',
        activityId: activityId,
        ...initialData
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên nhiệm vụ là bắt buộc';
        }

        if (formData.deadline && new Date(formData.deadline) < new Date()) {
            newErrors.deadline = 'Hạn chót không thể là ngày trong quá khứ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="text-gray-600 mt-1">
                        Nhiệm vụ cho hoạt động: <span className="font-medium">{activityName}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Task Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Tên nhiệm vụ *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Nhập tên nhiệm vụ"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả nhiệm vụ
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Mô tả chi tiết về nhiệm vụ..."
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                            Hạn chót
                        </label>
                        <input
                            type="date"
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.deadline ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                            Để trống nếu không có hạn chót cụ thể
                        </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang xử lý...' : (initialData.name ? 'Cập nhật nhiệm vụ' : 'Tạo nhiệm vụ')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
