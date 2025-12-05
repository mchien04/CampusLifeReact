import React, { useState, useEffect, useMemo } from 'react';
import { Department, DepartmentType, CreateDepartmentRequest, UpdateDepartmentRequest } from '../../types/admin';

interface DepartmentFormProps {
    onSubmit: (data: CreateDepartmentRequest | UpdateDepartmentRequest) => void;
    loading?: boolean;
    initialData?: Partial<Department>;
    title?: string;
    onCancel?: () => void;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo khoa/phòng ban mới",
    onCancel
}) => {
    const initialFormData = useMemo(() => ({
        name: initialData.name || '',
        type: initialData.type || DepartmentType.KHOA,
        description: initialData.description || ''
    }), [initialData.name, initialData.type, initialData.description]);

    const [formData, setFormData] = useState<CreateDepartmentRequest>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên khoa/phòng ban là bắt buộc';
        }

        if (!formData.type) {
            newErrors.type = 'Loại là bắt buộc';
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
        <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-5">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="mr-3 text-2xl">🏢</span>
                        {title}
                    </h3>
                </div>
                <div className="px-6 py-6">

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Tên khoa/phòng ban *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                placeholder="Nhập tên khoa/phòng ban"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                Loại *
                            </label>
                            <select
                                id="type"
                                name="type"
                                required
                                className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                <option value={DepartmentType.KHOA}>Khoa</option>
                                <option value={DepartmentType.PHONG_BAN}>Phòng ban</option>
                            </select>
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Mô tả
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                className="mt-1 block w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors resize-none"
                                placeholder="Nhập mô tả (tùy chọn)"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 font-semibold transition-all"
                                >
                                    Hủy
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                {loading ? 'Đang xử lý...' : (initialData.id ? 'Cập nhật' : 'Tạo mới')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DepartmentForm;
