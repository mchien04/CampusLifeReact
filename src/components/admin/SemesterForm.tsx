import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Semester, CreateSemesterRequest, UpdateSemesterRequest, AcademicYear } from '../../types/admin';
import { academicYearAPI } from '../../services/adminAPI';

interface SemesterFormProps {
    onSubmit: (data: CreateSemesterRequest | UpdateSemesterRequest) => void;
    loading?: boolean;
    initialData?: Partial<Semester>;
    title?: string;
    onCancel?: () => void;
}

const SemesterForm: React.FC<SemesterFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo học kỳ mới",
    onCancel
}) => {
    const { yearId } = useParams<{ yearId: string }>();
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loadingYears, setLoadingYears] = useState(true);

    const initialFormData = useMemo(() => ({
        yearId: initialData.yearId || (yearId ? parseInt(yearId) : 0),
        name: initialData.name || '',
        startDate: initialData.startDate ? initialData.startDate.substring(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.substring(0, 10) : '',
        open: initialData.open !== undefined ? initialData.open : true
    }), [initialData.yearId, initialData.name, initialData.startDate, initialData.endDate, initialData.open, yearId]);

    const [formData, setFormData] = useState<CreateSemesterRequest>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    const fetchAcademicYears = async () => {
        setLoadingYears(true);
        try {
            const response = await academicYearAPI.getAcademicYears();
            if (response.status && response.data) {
                setAcademicYears(response.data);
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
        } finally {
            setLoadingYears(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.yearId) {
            newErrors.yearId = 'Niên khóa là bắt buộc';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Tên học kỳ là bắt buộc';
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

    if (loadingYears) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                        {title}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Academic Year */}
                        <div>
                            <label htmlFor="yearId" className="block text-sm font-medium text-gray-700">
                                Niên khóa *
                            </label>
                            <select
                                id="yearId"
                                name="yearId"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={formData.yearId}
                                onChange={handleChange}
                            >
                                <option value={0}>Chọn niên khóa</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                            {errors.yearId && (
                                <p className="mt-1 text-sm text-red-600">{errors.yearId}</p>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Tên học kỳ *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Ví dụ: HK1, HK2"
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

                        {/* Open Status */}
                        <div className="flex items-center">
                            <input
                                id="open"
                                name="open"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                checked={formData.open}
                                onChange={handleChange}
                            />
                            <label htmlFor="open" className="ml-2 block text-sm text-gray-900">
                                Học kỳ đang mở
                            </label>
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

export default SemesterForm;
