import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentType } from '../../types/admin';
import { departmentAPI } from '../../services/adminAPI';

const Departments: React.FC = () => {
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
                return 'bg-blue-100 text-blue-800';
            case DepartmentType.PHONG_BAN:
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredDepartments = filter === 'ALL'
        ? departments
        : departments.filter(dept => dept.type === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadDepartments}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#001C44]">Quản lý phòng ban</h1>
                    <p className="text-gray-600 mt-1">Quản lý các khoa và phòng ban trong hệ thống</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDepartment(null);
                        setShowForm(true);
                    }}
                    className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-colors"
                >
                    + Tạo phòng ban
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white rounded-lg shadow p-6">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            filter === 'ALL'
                                ? 'bg-[#001C44] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    filter === type
                                        ? 'bg-[#001C44] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {getTypeLabel(type)} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Departments List */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-[#001C44]">
                        Danh sách phòng ban
                    </h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredDepartments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">🏢</div>
                            <p className="text-gray-600 text-lg">Chưa có phòng ban nào</p>
                        </div>
                    ) : (
                        filteredDepartments.map((department) => (
                            <div key={department.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                {department.name}
                                            </h4>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(department.type)}`}>
                                                {getTypeLabel(department.type)}
                                            </span>
                                        </div>
                                        {department.description && (
                                            <p className="text-gray-600 text-sm mb-2">
                                                {department.description}
                                            </p>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            Tạo bởi: {department.createdBy} • Cập nhật: {new Date(department.updatedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingDepartment(department);
                                                setShowForm(true);
                                            }}
                                            className="px-4 py-2 text-sm font-semibold bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                                        >
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(department.id)}
                                            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#FFD66D] rounded-lg flex items-center justify-center mr-3">
                                <span className="text-2xl">🏢</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {department ? 'Chỉnh sửa phòng ban' : 'Tạo phòng ban mới'}
                                </h3>
                                <p className="text-xs text-gray-200 mt-0.5">
                                    {department ? 'Cập nhật thông tin phòng ban' : 'Thêm phòng ban mới vào hệ thống'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:text-[#FFD66D] transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tên phòng ban <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-colors ${
                                    errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Ví dụ: Khoa Công nghệ thông tin"
                            />
                            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Loại phòng ban <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-colors"
                            >
                                <option value={DepartmentType.KHOA}>Khoa</option>
                                <option value={DepartmentType.PHONG_BAN}>Phòng ban</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-colors resize-none"
                                placeholder="Mô tả về phòng ban (tùy chọn)..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-all shadow-lg hover:shadow-xl"
                            >
                                {department ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Departments;
