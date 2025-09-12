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
                return 'bg-blue-100 text-blue-800';
            case DepartmentType.PHONG_BAN:
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Khoa/Phòng ban</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý thông tin các khoa và phòng ban trong trường
                    </p>
                </div>
                <Link
                    to="/admin/departments/create"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    Thêm mới
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
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Lọc theo loại:</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as DepartmentType | 'ALL')}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value={DepartmentType.KHOA}>Khoa</option>
                        <option value={DepartmentType.PHONG_BAN}>Phòng ban</option>
                    </select>
                </div>
            </div>

            {/* Departments List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {filteredDepartments.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có khoa/phòng ban nào</h3>
                        <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo khoa/phòng ban đầu tiên.</p>
                        <div className="mt-6">
                            <Link
                                to="/admin/departments/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                            >
                                Thêm mới
                            </Link>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredDepartments.map((department) => (
                            <li key={department.id}>
                                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                <span className="text-primary-600 font-medium text-sm">
                                                    {department.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {department.name}
                                                </p>
                                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(department.type)}`}>
                                                    {getTypeLabel(department.type)}
                                                </span>
                                            </div>
                                            {department.description && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {department.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Tạo bởi: {department.createdBy} • {new Date(department.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Link
                                            to={`/admin/departments/${department.id}/edit`}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            Chỉnh sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(department.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DepartmentList;
