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
        <div className="w-full">
            <div className="bg-white rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Task Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-[#001C44] mb-2">
                            Tên nhiệm vụ *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Nhập tên nhiệm vụ"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1 font-medium">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-[#001C44] mb-2">
                            Mô tả nhiệm vụ
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all resize-none"
                            placeholder="Mô tả chi tiết về nhiệm vụ..."
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label htmlFor="deadline" className="block text-sm font-semibold text-[#001C44] mb-2">
                            Hạn chót
                        </label>
                        <input
                            type="datetime-local"
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all ${errors.deadline ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.deadline && <p className="text-red-500 text-sm mt-1 font-medium">{errors.deadline}</p>}
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border-l-4 border-[#FFD66D]">
                            💡 Để trống nếu không có hạn chót cụ thể
                        </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t-2 border-gray-200">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-all font-medium"
                            >
                                Hủy
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium"
                        >
                            {loading ? 'Đang xử lý...' : (initialData?.name ? '💾 Cập nhật nhiệm vụ' : '✨ Tạo nhiệm vụ')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
