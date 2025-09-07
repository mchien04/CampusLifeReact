import React, { useState, useEffect, useMemo } from 'react';
import { AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest } from '../../types/admin';

interface AcademicYearFormProps {
    onSubmit: (data: CreateAcademicYearRequest | UpdateAcademicYearRequest) => void;
    loading?: boolean;
    initialData?: Partial<AcademicYear>;
    title?: string;
    onCancel?: () => void;
}

const AcademicYearForm: React.FC<AcademicYearFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo niên khóa mới",
    onCancel
}) => {
    const initialFormData = useMemo(() => ({
        name: initialData.name || '',
        startDate: initialData.startDate ? initialData.startDate.substring(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.substring(0, 10) : ''
    }), [initialData.name, initialData.startDate, initialData.endDate]);

    const [formData, setFormData] = useState<CreateAcademicYearRequest>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            newErrors.name = 'Tên niên khóa là bắt buộc';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        if (formData.startDate && formData.endDate) {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            if (startDate >= endDate) {
                newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
            }
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
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                        {title}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Tên niên khóa *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Ví dụ: 2025-2026"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                Ngày bắt đầu *
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                            {errors.startDate && (
                                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                            )}
                        </div>

                        {/* End Date */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                                Ngày kết thúc *
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                            {errors.endDate && (
                                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    Hủy
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AcademicYearForm;
