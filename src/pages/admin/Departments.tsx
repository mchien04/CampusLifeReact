import React, { useState, useEffect } from 'react';
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentType } from '../../types/admin';
import { departmentAPI } from '../../services/adminAPI';
import {
    StructureModal,
    modalCancelBtnClass,
    modalFieldClass,
    modalLabelClass,
    modalPrimaryBtnClass,
} from '../../components/admin/StructureModal';

interface DepartmentsProps {
    embedded?: boolean;
}

const Departments: React.FC<DepartmentsProps> = ({ embedded = false }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [filter, setFilter] = useState<DepartmentType | 'ALL'>('ALL');

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        setLoading(true);
        try {
            const response = await departmentAPI.getDepartments();
            if (response.status && response.data) {
                setDepartments(response.data);
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải danh sách phòng ban');
            }
        } catch (error) {
            console.error('Error loading departments:', error);
            setError('Có lỗi xảy ra khi tải danh sách phòng ban');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data: CreateDepartmentRequest) => {
        try {
            const response = await departmentAPI.createDepartment(data);
            if (response.status) {
                setShowForm(false);
                loadDepartments();
                alert('Tạo phòng ban thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo phòng ban');
            }
        } catch (error) {
            console.error('Error creating department:', error);
            alert('Có lỗi xảy ra khi tạo phòng ban');
        }
    };

    const handleUpdate = async (data: UpdateDepartmentRequest) => {
        if (!editingDepartment) return;

        try {
            const response = await departmentAPI.updateDepartment(editingDepartment.id, data);
            if (response.status) {
                setShowForm(false);
                setEditingDepartment(null);
                loadDepartments();
                alert('Cập nhật phòng ban thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật phòng ban');
            }
        } catch (error) {
            console.error('Error updating department:', error);
            alert('Có lỗi xảy ra khi cập nhật phòng ban');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
            return;
        }

        try {
            const response = await departmentAPI.deleteDepartment(id);
            if (response.status) {
                loadDepartments();
                alert('Xóa phòng ban thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa phòng ban');
            }
        } catch (error) {
            console.error('Error deleting department:', error);
            alert('Có lỗi xảy ra khi xóa phòng ban');
        }
    };

    const getTypeLabel = (type: DepartmentType): string => {
        switch (type) {
            case DepartmentType.KHOA:
                return 'Khoa';
            case DepartmentType.PHONG_BAN:
                return 'Phòng ban';
            default:
                return type;
        }
    };

    const getTypeColor = (type: DepartmentType): string => {
        switch (type) {
            case DepartmentType.KHOA:
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case DepartmentType.PHONG_BAN:
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            default:
                return 'bg-gray-50 text-gray-700 border border-gray-200';
        }
    };

    const filteredDepartments = filter === 'ALL'
        ? departments
        : departments.filter(dept => dept.type === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadDepartments}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:from-[#002A66] hover:to-[#001C44] font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!embedded && (
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center">
                                <span className="mr-3 text-4xl">🏢</span>
                                Quản lý phòng ban
                            </h1>
                            <p className="text-gray-200 text-lg">Quản lý các khoa và phòng ban trong hệ thống</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingDepartment(null);
                                setShowForm(true);
                            }}
                            className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            + Tạo phòng ban
                        </button>
                    </div>
                </div>
            )}

            {embedded && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-primary-900 tracking-tight">Khoa & phòng ban</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {filteredDepartments.length} mục
                            {filter !== 'ALL' ? ` · lọc ${getTypeLabel(filter)}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingDepartment(null);
                            setShowForm(true);
                        }}
                        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary-900 transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                    >
                        Thêm phòng ban
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-premium p-4 ${embedded ? '' : 'mb-6 p-6'}`}>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            filter === 'ALL'
                                ? 'bg-primary-900 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        Tất cả ({departments.length})
                    </button>
                    {[DepartmentType.KHOA, DepartmentType.PHONG_BAN].map(type => {
                        const count = departments.filter(d => d.type === type).length;
                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    filter === type
                                        ? 'bg-primary-900 text-white shadow-sm'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                {getTypeLabel(type)} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Departments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDepartments.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-premium">
                        <p className="text-gray-800 font-medium">Chưa có phòng ban nào</p>
                        <p className="text-gray-500 text-sm mt-1">Tạo khoa hoặc phòng ban đầu tiên để bắt đầu</p>
                    </div>
                ) : (
                    filteredDepartments.map((department) => (
                        <div
                            key={department.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-all duration-200 overflow-hidden group"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-11 h-11 shrink-0 bg-primary-900 rounded-xl flex items-center justify-center text-white font-semibold tabular-nums">
                                                {department.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-base font-semibold text-primary-900 truncate">
                                                    {department.name}
                                                </h4>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium mt-1 ${getTypeColor(department.type)}`}>
                                                    {getTypeLabel(department.type)}
                                                </span>
                                            </div>
                                        </div>
                                        {department.description && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {department.description}
                                            </p>
                                        )}
                                        <div className="text-xs text-gray-400 space-y-0.5 tabular-nums">
                                            <p>Tạo bởi: {department.createdBy}</p>
                                            <p>Cập nhật: {new Date(department.updatedAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            setEditingDepartment(department);
                                            setShowForm(true);
                                        }}
                                        className="flex-1 px-3 py-2 text-sm font-medium bg-primary-50 text-primary-900 rounded-xl hover:bg-primary-100 transition-all active:scale-[0.98]"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(department.id)}
                                        className="flex-1 px-3 py-2 text-sm font-medium bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-all active:scale-[0.98]"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <DepartmentFormModal
                    department={editingDepartment}
                    onSubmit={editingDepartment ? handleUpdate : handleCreate}
                    onClose={() => {
                        setShowForm(false);
                        setEditingDepartment(null);
                    }}
                />
            )}
        </div>
    );
};

// Department Form Modal Component
interface DepartmentFormModalProps {
    department: Department | null;
    onSubmit: (data: CreateDepartmentRequest) => void;
    onClose: () => void;
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({ department, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<CreateDepartmentRequest>({
        name: '',
        type: DepartmentType.KHOA,
        description: '',
        ...department
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên phòng ban là bắt buộc';
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
        <StructureModal
            title={department ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban'}
            subtitle="Khoa hoặc đơn vị hành chính trong hệ thống"
            onClose={onClose}
            size="md"
            footer={
                <>
                    <button type="button" onClick={onClose} className={modalCancelBtnClass}>
                        Hủy
                    </button>
                    <button type="submit" form="department-form" className={modalPrimaryBtnClass}>
                        {department ? 'Cập nhật' : 'Tạo phòng ban'}
                    </button>
                </>
            }
        >
            <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={modalLabelClass}>
                        Tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={modalFieldClass(!!errors.name)}
                        placeholder="Ví dụ: Khoa Công nghệ thông tin"
                    />
                    {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                </div>

                <div>
                    <label className={modalLabelClass}>
                        Loại <span className="text-rose-500">*</span>
                    </label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={modalFieldClass()}
                    >
                        <option value={DepartmentType.KHOA}>Khoa</option>
                        <option value={DepartmentType.PHONG_BAN}>Phòng ban</option>
                    </select>
                </div>

                <div>
                    <label className={modalLabelClass}>Mô tả</label>
                    <textarea
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

export default Departments;
