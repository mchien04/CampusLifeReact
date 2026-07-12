import React, { useState, useEffect, useCallback } from 'react';
import { StudentClass, Department, ClassFilters } from '../../types';
import { classAPI, departmentAPI } from '../../services';
import { ClassForm } from '../../components/class/ClassForm';
import { ClassStudentList } from '../../components/class/ClassStudentList';

interface ClassManagementProps {
    embedded?: boolean;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ embedded = false }) => {
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
            {!embedded && (
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
            )}

            {embedded && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-primary-900 tracking-tight">Lớp học</h2>
                        <p className="text-sm text-gray-500 mt-0.5 tabular-nums">
                            {pagination.totalElements} lớp
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingClass(null);
                            setShowForm(true);
                        }}
                        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary-900 transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                    >
                        Thêm lớp
                    </button>
                </div>
            )}

            <div>
                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-5 mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                                Khoa
                            </label>
                            <select
                                value={filters.departmentId || ''}
                                onChange={(e) => handleFilterChange({
                                    departmentId: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-colors"
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
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                                Tìm kiếm
                            </label>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Tên lớp..."
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-colors"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ page: 0, size: 10 });
                                    setSearchInput('');
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 border border-gray-200 text-sm font-medium transition-all active:scale-[0.98]"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Classes Grid */}
                {classes.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-premium p-12 text-center">
                        <p className="text-gray-800 font-medium">Chưa có lớp học nào</p>
                        <p className="text-gray-500 text-sm mt-1">Tạo lớp đầu tiên hoặc đổi bộ lọc</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {classes.map((classItem) => {
                            const studentCount = classItem.studentCount || (classItem.students ? classItem.students.length : 0);
                            return (
                                <div
                                    key={classItem.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-all duration-200 overflow-hidden"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-11 h-11 shrink-0 bg-primary-900 rounded-xl flex items-center justify-center text-white font-semibold">
                                                        {classItem.className.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-base font-semibold text-primary-900 truncate">
                                                            {classItem.className}
                                                        </h4>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium mt-1 bg-primary-50 text-primary-800">
                                                            {classItem.department.name}
                                                        </span>
                                                    </div>
                                                </div>
                                                {classItem.description && (
                                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                        {classItem.description}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-500 tabular-nums">
                                                    <span className="font-semibold text-primary-900">{studentCount}</span> sinh viên
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => handleViewStudents(classItem)}
                                                className="flex-1 px-3 py-2 text-sm font-medium bg-sky-50 text-sky-800 rounded-xl hover:bg-sky-100 transition-all active:scale-[0.98]"
                                            >
                                                Sinh viên
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingClass(classItem);
                                                    setShowForm(true);
                                                }}
                                                className="flex-1 px-3 py-2 text-sm font-medium bg-primary-50 text-primary-900 rounded-xl hover:bg-primary-100 transition-all active:scale-[0.98]"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClass(classItem.id)}
                                                className="px-3 py-2 text-sm font-medium bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-all active:scale-[0.98]"
                                            >
                                                Xóa
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
                    <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-premium px-5 py-4 flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 0}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages - 1}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Sau
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-600 tabular-nums">
                                    <span className="font-semibold text-primary-900">{pagination.currentPage * 10 + 1}</span>
                                    {' – '}
                                    <span className="font-semibold text-primary-900">
                                        {Math.min((pagination.currentPage + 1) * 10, pagination.totalElements)}
                                    </span>
                                    {' / '}
                                    <span className="font-semibold text-primary-900">{pagination.totalElements}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-xl overflow-hidden border border-gray-200">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i)}
                                            className={`relative inline-flex items-center px-3.5 py-2 text-sm font-medium transition-all tabular-nums ${
                                                i === pagination.currentPage
                                                    ? 'bg-primary-900 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
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
