import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CriteriaItem, CreateCriteriaItemRequest, UpdateCriteriaItemRequest, CriteriaGroup, Department } from '../../types/admin';
import { criteriaGroupAPI, departmentAPI } from '../../services/adminAPI';

interface CriteriaItemFormProps {
    onSubmit: (data: CreateCriteriaItemRequest | UpdateCriteriaItemRequest) => void;
    loading?: boolean;
    initialData?: Partial<CriteriaItem>;
    title?: string;
    onCancel?: () => void;
}

const CriteriaItemForm: React.FC<CriteriaItemFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo tiêu chí mới",
    onCancel
}) => {
    const { groupId } = useParams<{ groupId: string }>();
    const [criteriaGroups, setCriteriaGroups] = useState<CriteriaGroup[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const initialFormData = useMemo(() => ({
        groupId: initialData.groupId || (groupId ? parseInt(groupId) : 0),
        name: initialData.name || '',
        maxScore: initialData.maxScore || 0,
        minScore: initialData.minScore || 0,
        departmentId: initialData.departmentId || undefined,
        description: initialData.description || ''
    }), [initialData.groupId, initialData.name, initialData.maxScore, initialData.minScore, initialData.departmentId, initialData.description, groupId]);

    const [formData, setFormData] = useState<CreateCriteriaItemRequest>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [groupsResponse, departmentsResponse] = await Promise.all([
                criteriaGroupAPI.getCriteriaGroups(),
                departmentAPI.getDepartments()
            ]);

            if (groupsResponse.status && groupsResponse.data) {
                setCriteriaGroups(groupsResponse.data);
            }

            if (departmentsResponse.status && departmentsResponse.data) {
                setDepartments(departmentsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.groupId) {
            newErrors.groupId = 'Nhóm tiêu chí là bắt buộc';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Tên tiêu chí là bắt buộc';
        }

        if (formData.maxScore <= 0) {
            newErrors.maxScore = 'Điểm tối đa phải lớn hơn 0';
        }

        if (formData.minScore < 0) {
            newErrors.minScore = 'Điểm tối thiểu không được âm';
        }

        if (formData.minScore >= formData.maxScore) {
            newErrors.minScore = 'Điểm tối thiểu phải nhỏ hơn điểm tối đa';
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

    if (loadingData) {
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
                        {/* Criteria Group */}
                        <div>
                            <label htmlFor="groupId" className="block text-sm font-medium text-gray-700">
                                Nhóm tiêu chí *
                            </label>
                            <select
                                id="groupId"
                                name="groupId"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={formData.groupId}
                                onChange={handleChange}
                            >
                                <option value={0}>Chọn nhóm tiêu chí</option>
                                {criteriaGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            {errors.groupId && (
                                <p className="mt-1 text-sm text-red-600">{errors.groupId}</p>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Tên tiêu chí *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Ví dụ: Khen thưởng cấp trường"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Score Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="minScore" className="block text-sm font-medium text-gray-700">
                                    Điểm tối thiểu *
                                </label>
                                <input
                                    type="number"
                                    id="minScore"
                                    name="minScore"
                                    min="0"
                                    step="0.1"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    value={formData.minScore}
                                    onChange={handleChange}
                                />
                                {errors.minScore && (
                                    <p className="mt-1 text-sm text-red-600">{errors.minScore}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700">
                                    Điểm tối đa *
                                </label>
                                <input
                                    type="number"
                                    id="maxScore"
                                    name="maxScore"
                                    min="0.1"
                                    step="0.1"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    value={formData.maxScore}
                                    onChange={handleChange}
                                />
                                {errors.maxScore && (
                                    <p className="mt-1 text-sm text-red-600">{errors.maxScore}</p>
                                )}
                            </div>
                        </div>

                        {/* Department */}
                        <div>
                            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                                Khoa/Phòng ban phụ trách
                            </label>
                            <select
                                id="departmentId"
                                name="departmentId"
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={formData.departmentId || ''}
                                onChange={handleChange}
                            >
                                <option value="">Chọn khoa/phòng ban (tùy chọn)</option>
                                {departments.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.name}
                                    </option>
                                ))}
                            </select>
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
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Mô tả chi tiết về tiêu chí này"
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

export default CriteriaItemForm;
