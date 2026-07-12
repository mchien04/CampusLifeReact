import React, { useState, useEffect } from 'react';
import { StudentClass, Department, CreateClassRequest, UpdateClassRequest } from '../../types';
import {
    StructureModal,
    modalCancelBtnClass,
    modalFieldClass,
    modalLabelClass,
    modalPrimaryBtnClass,
} from '../admin/StructureModal';

interface ClassFormProps {
    classData?: StudentClass | null;
    departments: Department[];
    onSubmit: (data: CreateClassRequest | UpdateClassRequest) => Promise<void>;
    onClose: () => void;
}

export const ClassForm: React.FC<ClassFormProps> = ({
    classData,
    departments,
    onSubmit,
    onClose,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        departmentId: 0,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (classData) {
            setFormData({
                name: classData.className,
                description: classData.description || '',
                departmentId: classData.department.id,
            });
        }
    }, [classData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên lớp là bắt buộc';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Tên lớp phải có ít nhất 2 ký tự';
        }

        if (!formData.departmentId) {
            newErrors.departmentId = 'Vui lòng chọn khoa';
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
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'departmentId' ? parseInt(value) : value,
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    return (
        <StructureModal
            title={classData ? 'Chỉnh sửa lớp học' : 'Thêm lớp học'}
            subtitle="Gán lớp vào khoa tương ứng"
            onClose={onClose}
            size="md"
            footer={
                <>
                    <button type="button" onClick={onClose} className={modalCancelBtnClass}>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="class-form"
                        disabled={loading}
                        className={modalPrimaryBtnClass}
                    >
                        {loading ? 'Đang lưu...' : classData ? 'Cập nhật' : 'Tạo lớp'}
                    </button>
                </>
            }
        >
            <form id="class-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className={modalLabelClass}>
                        Tên lớp <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={modalFieldClass(!!errors.name)}
                        placeholder="Ví dụ: D21CQCN01"
                    />
                    {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="departmentId" className={modalLabelClass}>
                        Khoa <span className="text-rose-500">*</span>
                    </label>
                    <select
                        id="departmentId"
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleChange}
                        className={modalFieldClass(!!errors.departmentId)}
                    >
                        <option value={0}>Chọn khoa</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                    {errors.departmentId && (
                        <p className="mt-1 text-sm text-rose-600">{errors.departmentId}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className={modalLabelClass}>
                        Mô tả
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className={`${modalFieldClass()} resize-none`}
                        placeholder="Mô tả ngắn (tùy chọn)"
                    />
                </div>
            </form>
        </StructureModal>
    );
};
