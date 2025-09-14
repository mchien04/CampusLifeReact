import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest, Semester, CreateSemesterRequest } from '../../types/admin';
import { academicYearAPI, semesterAPI } from '../../services/adminAPI';

const AcademicYears: React.FC = () => {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSemesters, setLoadingSemesters] = useState(false);
    const [error, setError] = useState('');
    const [showYearForm, setShowYearForm] = useState(false);
    const [showSemesterForm, setShowSemesterForm] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

    useEffect(() => {
        loadAcademicYears();
    }, []);

    const loadAcademicYears = async () => {
        setLoading(true);
        try {
            const response = await academicYearAPI.getAcademicYears();
            if (response.status && response.data) {
                setAcademicYears(response.data);
                if (response.data.length > 0) {
                    setSelectedYear(response.data[0]);
                }
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải danh sách năm học');
            }
        } catch (error) {
            console.error('Error loading academic years:', error);
            setError('Có lỗi xảy ra khi tải danh sách năm học');
        } finally {
            setLoading(false);
        }
    };

    const loadSemesters = async (yearId: number) => {
        setLoadingSemesters(true);
        try {
            const response = await semesterAPI.getSemestersByYear(yearId);
            if (response.status && response.data) {
                setSemesters(response.data);
            } else {
                setSemesters([]);
            }
        } catch (error) {
            console.error('Error loading semesters:', error);
            setSemesters([]);
        } finally {
            setLoadingSemesters(false);
        }
    };

    useEffect(() => {
        if (selectedYear) {
            loadSemesters(selectedYear.id);
        }
    }, [selectedYear]);

    const handleCreateYear = async (data: CreateAcademicYearRequest) => {
        try {
            const response = await academicYearAPI.createAcademicYear(data);
            if (response.status) {
                setShowYearForm(false);
                loadAcademicYears();
                alert('Tạo năm học thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo năm học');
            }
        } catch (error) {
            console.error('Error creating academic year:', error);
            alert('Có lỗi xảy ra khi tạo năm học');
        }
    };

    const handleUpdateYear = async (data: UpdateAcademicYearRequest) => {
        if (!editingYear) return;

        try {
            const response = await academicYearAPI.updateAcademicYear(editingYear.id, data);
            if (response.status) {
                setShowYearForm(false);
                setEditingYear(null);
                loadAcademicYears();
                alert('Cập nhật năm học thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật năm học');
            }
        } catch (error) {
            console.error('Error updating academic year:', error);
            alert('Có lỗi xảy ra khi cập nhật năm học');
        }
    };

    const handleDeleteYear = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa năm học này? Tất cả học kỳ trong năm học cũng sẽ bị xóa.')) {
            return;
        }

        try {
            const response = await academicYearAPI.deleteAcademicYear(id);
            if (response.status) {
                loadAcademicYears();
                if (selectedYear?.id === id) {
                    setSelectedYear(null);
                    setSemesters([]);
                }
                alert('Xóa năm học thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa năm học');
            }
        } catch (error) {
            console.error('Error deleting academic year:', error);
            alert('Có lỗi xảy ra khi xóa năm học');
        }
    };

    const handleCreateSemester = async (data: CreateSemesterRequest) => {
        try {
            const response = await semesterAPI.createSemester(data);
            if (response.status) {
                setShowSemesterForm(false);
                if (selectedYear) {
                    loadSemesters(selectedYear.id);
                }
                alert('Tạo học kỳ thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo học kỳ');
            }
        } catch (error) {
            console.error('Error creating semester:', error);
            alert('Có lỗi xảy ra khi tạo học kỳ');
        }
    };

    const handleUpdateSemester = async (data: CreateSemesterRequest) => {
        if (!editingSemester) return;

        try {
            const response = await semesterAPI.updateSemester(editingSemester.id, data);
            if (response.status) {
                setShowSemesterForm(false);
                setEditingSemester(null);
                if (selectedYear) {
                    loadSemesters(selectedYear.id);
                }
                alert('Cập nhật học kỳ thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật học kỳ');
            }
        } catch (error) {
            console.error('Error updating semester:', error);
            alert('Có lỗi xảy ra khi cập nhật học kỳ');
        }
    };

    const handleDeleteSemester = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) {
            return;
        }

        try {
            const response = await semesterAPI.deleteSemester(id);
            if (response.status) {
                if (selectedYear) {
                    loadSemesters(selectedYear.id);
                }
                alert('Xóa học kỳ thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa học kỳ');
            }
        } catch (error) {
            console.error('Error deleting semester:', error);
            alert('Có lỗi xảy ra khi xóa học kỳ');
        }
    };

    const handleToggleSemester = async (id: number, open: boolean) => {
        try {
            const response = await semesterAPI.toggleSemester(id, open);
            if (response.status) {
                if (selectedYear) {
                    loadSemesters(selectedYear.id);
                }
                alert(`${open ? 'Mở' : 'Đóng'} học kỳ thành công!`);
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật trạng thái học kỳ');
            }
        } catch (error) {
            console.error('Error toggling semester:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái học kỳ');
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadAcademicYears}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Thử lại
                    </button>
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
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý năm học & học kỳ</h1>
                            <p className="text-gray-600 mt-1">Quản lý các năm học và học kỳ trong hệ thống</p>
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
                                    setEditingYear(null);
                                    setShowYearForm(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                + Tạo năm học
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Academic Years List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Danh sách năm học</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {academicYears.map((year) => (
                                    <div
                                        key={year.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedYear?.id === year.id ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                        onClick={() => setSelectedYear(year)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                    {year.name}
                                                </h4>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingYear(year);
                                                        setShowYearForm(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                    title="Chỉnh sửa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteYear(year.id);
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    title="Xóa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Semesters List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Học kỳ
                                        {selectedYear && ` - ${selectedYear.name}`}
                                    </h3>
                                    {selectedYear && (
                                        <button
                                            onClick={() => {
                                                setEditingSemester(null);
                                                setShowSemesterForm(true);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            + Tạo học kỳ
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-6">
                                {selectedYear ? (
                                    <div className="space-y-4">
                                        {loadingSemesters ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                <p className="mt-2 text-gray-600">Đang tải học kỳ...</p>
                                            </div>
                                        ) : semesters.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="text-gray-400 text-4xl mb-4">📚</div>
                                                <p className="text-gray-600">Chưa có học kỳ nào trong năm học này</p>
                                            </div>
                                        ) : (
                                            semesters.map((semester) => (
                                                <div key={semester.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                                                                {semester.name}
                                                            </h4>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                <span>Bắt đầu: {formatDate(semester.startDate)}</span>
                                                                <span>•</span>
                                                                <span>Kết thúc: {formatDate(semester.endDate)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${semester.open
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {semester.open ? 'Đang mở' : 'Đã đóng'}
                                                            </span>
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    onClick={() => handleToggleSemester(semester.id, !semester.open)}
                                                                    className={`px-3 py-1 text-xs rounded-md ${semester.open
                                                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                                                        : 'bg-green-600 text-white hover:bg-green-700'
                                                                        }`}
                                                                >
                                                                    {semester.open ? 'Đóng' : 'Mở'}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingSemester(semester);
                                                                        setShowSemesterForm(true);
                                                                    }}
                                                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                                >
                                                                    Sửa
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSemester(semester.id)}
                                                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-4xl mb-4">📚</div>
                                        <p className="text-gray-600">Chọn một năm học để xem học kỳ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Year Form Modal */}
            {showYearForm && (
                <YearFormModal
                    year={editingYear}
                    onSubmit={editingYear ? handleUpdateYear : handleCreateYear}
                    onClose={() => {
                        setShowYearForm(false);
                        setEditingYear(null);
                    }}
                />
            )}

            {/* Semester Form Modal */}
            {showSemesterForm && selectedYear && (
                <SemesterFormModal
                    yearId={selectedYear.id}
                    yearName={selectedYear.name}
                    semester={editingSemester}
                    onSubmit={editingSemester ? handleUpdateSemester : handleCreateSemester}
                    onClose={() => {
                        setShowSemesterForm(false);
                        setEditingSemester(null);
                    }}
                />
            )}
        </div>
    );
};

// Year Form Modal Component
interface YearFormModalProps {
    year: AcademicYear | null;
    onSubmit: (data: CreateAcademicYearRequest) => void;
    onClose: () => void;
}

const YearFormModal: React.FC<YearFormModalProps> = ({ year, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<CreateAcademicYearRequest>({
        name: '',
        startDate: '',
        endDate: '',
        ...year
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên năm học là bắt buộc';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {year ? 'Chỉnh sửa năm học' : 'Tạo năm học mới'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên năm học *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ví dụ: 2024-2025"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày bắt đầu *
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày kết thúc *
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {year ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Semester Form Modal Component
interface SemesterFormModalProps {
    yearId: number;
    yearName: string;
    semester: Semester | null;
    onSubmit: (data: CreateSemesterRequest) => void;
    onClose: () => void;
}

const SemesterFormModal: React.FC<SemesterFormModalProps> = ({ yearId, yearName, semester, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<CreateSemesterRequest>({
        yearId: yearId,
        name: '',
        startDate: '',
        endDate: '',
        open: true,
        ...semester
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên học kỳ là bắt buộc';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {semester ? 'Chỉnh sửa học kỳ' : 'Tạo học kỳ mới'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                            <strong>Năm học:</strong> {yearName}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên học kỳ *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ví dụ: Học kỳ 1, Học kỳ 2"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày bắt đầu *
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày kết thúc *
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="open"
                                checked={formData.open}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                                Mở học kỳ (cho phép sinh viên đăng ký)
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                {semester ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AcademicYears;
