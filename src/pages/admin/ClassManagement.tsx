import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StudentClass, Department, ClassFilters } from '../../types';
import { classAPI, departmentAPI } from '../../services';
import { ClassForm } from '../../components/class/ClassForm';
import { ClassStudentList } from '../../components/class/ClassStudentList';

const ClassManagement: React.FC = () => {
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClass, setEditingClass] = useState<StudentClass | null>(null);
    const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
    const [showStudents, setShowStudents] = useState(false);
    const [filters, setFilters] = useState<ClassFilters>({
        page: 0,
        size: 10,
    });
    const [pagination, setPagination] = useState({
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            console.log('Loading classes with filters:', filters);

            const [classesResponse, departmentsResponse] = await Promise.all([
                classAPI.getClasses(filters),
                departmentAPI.getAll()
            ]);

            console.log('Classes response:', classesResponse);
            console.log('Departments response:', departmentsResponse);

            setClasses(classesResponse.content || []);
            setPagination({
                totalElements: classesResponse.totalElements || 0,
                totalPages: classesResponse.totalPages || 0,
                currentPage: classesResponse.number || 0,
            });
            setDepartments(departmentsResponse.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (data: any) => {
        try {
            await classAPI.createClass(data);
            setShowForm(false);
            await loadData();
        } catch (error) {
            console.error('Error creating class:', error);
            throw error;
        }
    };

    const handleUpdateClass = async (data: any) => {
        if (!editingClass) return;

        try {
            await classAPI.updateClass(editingClass.id, data);
            setShowForm(false);
            setEditingClass(null);
            await loadData();
        } catch (error) {
            console.error('Error updating class:', error);
            throw error;
        }
    };

    const handleDeleteClass = async (classId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
            return;
        }

        try {
            await classAPI.deleteClass(classId);
            await loadData();
        } catch (error) {
            console.error('Error deleting class:', error);
            alert('Có lỗi xảy ra khi xóa lớp học');
        }
    };

    const handleViewStudents = async (classData: StudentClass) => {
        setSelectedClass(classData);
        setShowStudents(true);
    };

    const handleFilterChange = (newFilters: Partial<ClassFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 0 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý lớp học</h1>
                            <p className="text-gray-600 mt-1">Quản lý các lớp học trong hệ thống</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại Dashboard
                            </Link>
                            <button
                                onClick={() => {
                                    setEditingClass(null);
                                    setShowForm(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                + Thêm lớp mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Khoa
                            </label>
                            <select
                                value={filters.departmentId || ''}
                                onChange={(e) => handleFilterChange({
                                    departmentId: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả khoa</option>
                                {departments && departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <input
                                type="text"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange({ search: e.target.value })}
                                placeholder="Tìm theo tên lớp..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ page: 0, size: 10 })}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Classes Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tên lớp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mô tả
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Khoa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số sinh viên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classes && classes.map((classItem) => {
                                    console.log('Rendering class item:', classItem);
                                    console.log('🔍 Class item studentCount:', classItem.studentCount);
                                    return (
                                        <tr key={classItem.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {classItem.className}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {classItem.description || 'Không có mô tả'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {classItem.department.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {classItem.studentCount || (classItem.students ? classItem.students.length : 0)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewStudents(classItem)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Xem sinh viên
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingClass(classItem);
                                                            setShowForm(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClass(classItem.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 0}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages - 1}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Hiển thị{' '}
                                        <span className="font-medium">{pagination.currentPage * 10 + 1}</span>
                                        {' '}đến{' '}
                                        <span className="font-medium">
                                            {Math.min((pagination.currentPage + 1) * 10, pagination.totalElements)}
                                        </span>
                                        {' '}trong{' '}
                                        <span className="font-medium">{pagination.totalElements}</span>
                                        {' '}kết quả
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        {Array.from({ length: pagination.totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${i === pagination.currentPage
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Class Form Modal */}
            {showForm && (
                <ClassForm
                    classData={editingClass}
                    departments={departments}
                    onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
                    onClose={() => {
                        setShowForm(false);
                        setEditingClass(null);
                    }}
                />
            )}

            {/* Class Students Modal */}
            {showStudents && selectedClass && (
                <ClassStudentList
                    classData={selectedClass}
                    onClose={() => {
                        setShowStudents(false);
                        setSelectedClass(null);
                    }}
                    onRefresh={loadData}
                />
            )}
        </div>
    );
};

export default ClassManagement;
