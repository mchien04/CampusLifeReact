import React, { useState, useEffect, useCallback } from 'react';
import { StudentClass, Department, ClassFilters } from '../../types';
import { classAPI, departmentAPI } from '../../services';
import { ClassForm } from '../../components/class/ClassForm';
import { ClassStudentList } from '../../components/class/ClassStudentList';

const ClassManagement: React.FC = () => {
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingClass, setEditingClass] = useState<StudentClass | null>(null);
    const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
    const [showStudents, setShowStudents] = useState(false);
    const [filters, setFilters] = useState<ClassFilters>({
        page: 0,
        size: 10,
    });
    const [searchInput, setSearchInput] = useState('');
    const [pagination, setPagination] = useState({
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
    });

    const loadData = useCallback(async () => {
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
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange({ search: searchInput || undefined });
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchInput]);

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
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="mr-3 text-4xl">🏫</span>
                            Quản lý lớp học
                        </h1>
                        <p className="text-gray-200 text-lg">Quản lý các lớp học trong hệ thống</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingClass(null);
                            setShowForm(true);
                        }}
                        className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        + Thêm lớp mới
                    </button>
                </div>
            </div>

            <div>
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                🏛️ Khoa
                            </label>
                            <select
                                value={filters.departmentId || ''}
                                onChange={(e) => handleFilterChange({
                                    departmentId: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                🔍 Tìm kiếm
                            </label>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Tìm theo tên lớp..."
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ page: 0, size: 10 });
                                    setSearchInput('');
                                }}
                                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border-2 border-gray-300 font-semibold transition-all"
                            >
                                🔄 Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Classes Grid */}
                {classes.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <div className="text-gray-400 text-6xl mb-4">🏫</div>
                        <p className="text-gray-600 text-lg font-medium">Chưa có lớp học nào</p>
                        <p className="text-gray-500 text-sm mt-2">Bắt đầu bằng cách tạo lớp học đầu tiên</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((classItem) => {
                            const studentCount = classItem.studentCount || (classItem.students ? classItem.students.length : 0);
                            return (
                                <div
                                    key={classItem.id}
                                    className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                        {classItem.className.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-lg font-bold text-[#001C44] truncate">
                                                            {classItem.className}
                                                        </h4>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 bg-blue-50 text-blue-700 border border-blue-200">
                                                            🏛️ {classItem.department.name}
                                                        </span>
                                                    </div>
                                                </div>
                                                {classItem.description && (
                                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                        {classItem.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <div className="flex items-center text-gray-600">
                                                        <span className="mr-2">👥</span>
                                                        <span className="font-semibold">{studentCount}</span>
                                                        <span className="ml-1">sinh viên</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => handleViewStudents(classItem)}
                                                className="flex-1 px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all"
                                            >
                                                👥 Xem SV
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingClass(classItem);
                                                    setShowForm(true);
                                                }}
                                                className="flex-1 px-4 py-2 text-sm font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all"
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClass(classItem.id)}
                                                className="px-4 py-2 text-sm font-semibold bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 transition-all"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 0}
                                className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ← Trước
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages - 1}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Sau →
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 font-medium">
                                    Hiển thị{' '}
                                    <span className="font-bold text-[#001C44]">{pagination.currentPage * 10 + 1}</span>
                                    {' '}đến{' '}
                                    <span className="font-bold text-[#001C44]">
                                        {Math.min((pagination.currentPage + 1) * 10, pagination.totalElements)}
                                    </span>
                                    {' '}trong{' '}
                                    <span className="font-bold text-[#001C44]">{pagination.totalElements}</span>
                                    {' '}kết quả
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i)}
                                            className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-semibold transition-all ${
                                                i === pagination.currentPage
                                                    ? 'z-10 bg-gradient-to-r from-[#001C44] to-[#002A66] border-[#001C44] text-white shadow-md'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
