import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Department, DepartmentType } from '../../types/admin';
import { departmentAPI } from '../../services/adminAPI';

const DepartmentList: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<DepartmentType | 'ALL'>('ALL');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await departmentAPI.getDepartments();
            if (response.status && response.data) {
                setDepartments(response.data);
            } else {
                setError(response.message || 'Không thể tải danh sách khoa/phòng ban');
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            setError('Có lỗi xảy ra khi tải danh sách');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa khoa/phòng ban này?')) {
            return;
        }

        try {
            const response = await departmentAPI.deleteDepartment(id);
            if (response.status) {
                setDepartments(prev => prev.filter(dept => dept.id !== id));
                alert('Xóa thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa');
            }
        } catch (error) {
            console.error('Error deleting department:', error);
            alert('Có lỗi xảy ra khi xóa');
        }
    };

    const filteredDepartments = filter === 'ALL'
        ? departments
        : departments.filter(dept => dept.type === filter);

    const getTypeLabel = (type: DepartmentType) => {
        switch (type) {
            case DepartmentType.KHOA:
                return 'Khoa';
            case DepartmentType.PHONG_BAN:
                return 'Phòng ban';
            default:
                return type;
        }
    };

    const getTypeColor = (type: DepartmentType) => {
        switch (type) {
            case DepartmentType.KHOA:
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case DepartmentType.PHONG_BAN:
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            default:
                return 'bg-gray-50 text-gray-700 border border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44] flex items-center">
                        <span className="mr-3 text-4xl">🏢</span>
                        Quản lý Khoa/Phòng ban
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Quản lý thông tin các khoa và phòng ban trong trường
                    </p>
                </div>
                <Link
                    to="/admin/departments/create"
                    className="px-6 py-3 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-xl hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                    + Thêm mới
                </Link>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            filter === 'ALL'
                                ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                    >
                        📋 Tất cả ({departments.length})
                    </button>
                    {[DepartmentType.KHOA, DepartmentType.PHONG_BAN].map(type => {
                        const count = departments.filter(d => d.type === type).length;
                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    filter === type
                                        ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                            >
                                {type === DepartmentType.KHOA ? '🏛️' : '🏢'} {getTypeLabel(type)} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Departments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <div className="text-gray-400 text-6xl mb-4">🏢</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có khoa/phòng ban nào</h3>
                        <p className="text-gray-500 text-sm mb-6">Bắt đầu bằng cách tạo khoa/phòng ban đầu tiên.</p>
                        <Link
                            to="/admin/departments/create"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-xl hover:from-[#002A66] hover:to-[#001C44] shadow-lg hover:shadow-xl font-semibold transition-all"
                        >
                            + Thêm mới
                        </Link>
                    </div>
                ) : (
                    filteredDepartments.map((department) => (
                        <div
                            key={department.id}
                            className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                {department.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-bold text-[#001C44] truncate">
                                                    {department.name}
                                                </h4>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${getTypeColor(department.type)}`}>
                                                    {getTypeLabel(department.type)}
                                                </span>
                                            </div>
                                        </div>
                                        {department.description && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {department.description}
                                            </p>
                                        )}
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p>👤 Tạo bởi: {department.createdBy}</p>
                                            <p>🕒 {new Date(department.createdAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4 border-t border-gray-200">
                                    <Link
                                        to={`/admin/departments/${department.id}/edit`}
                                        className="flex-1 px-4 py-2 text-sm font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all text-center"
                                    >
                                        ✏️ Chỉnh sửa
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(department.id)}
                                        className="flex-1 px-4 py-2 text-sm font-semibold bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 transition-all"
                                    >
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DepartmentList;
