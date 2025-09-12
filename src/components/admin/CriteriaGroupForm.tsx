import React, { useState, useEffect, useMemo } from 'react';
import { CriteriaGroup, CreateCriteriaGroupRequest, UpdateCriteriaGroupRequest } from '../../types/admin';

interface CriteriaGroupFormProps {
    onSubmit: (data: CreateCriteriaGroupRequest | UpdateCriteriaGroupRequest) => void;
    loading?: boolean;
    initialData?: Partial<CriteriaGroup>;
    title?: string;
    onCancel?: () => void;
}

const CriteriaGroupForm: React.FC<CriteriaGroupFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo nhóm tiêu chí mới",
    onCancel
}) => {
    const initialFormData = useMemo(() => ({
        name: initialData.name || '',
        description: initialData.description || ''
    }), [initialData.name, initialData.description]);

    const [formData, setFormData] = useState<CreateCriteriaGroupRequest>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            newErrors.name = 'Tên nhóm tiêu chí là bắt buộc';
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
                                Tên nhóm tiêu chí *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Ví dụ: Khen thưởng - Kỷ luật"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
                                rows={4}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Mô tả chi tiết về nhóm tiêu chí này"
                                value={formData.description}
                                onChange={handleChange}
                            />
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

export default CriteriaGroupForm;
