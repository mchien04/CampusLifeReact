import React, { useState, useEffect } from 'react';
import { AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest, Semester, CreateSemesterRequest } from '../../types/admin';
import { academicYearAPI, semesterAPI } from '../../services/adminAPI';
import {
    StructureModal,
    modalCancelBtnClass,
    modalFieldClass,
    modalLabelClass,
    modalPrimaryBtnClass,
} from '../../components/admin/StructureModal';

interface AcademicYearsProps {
    embedded?: boolean;
}

const AcademicYears: React.FC<AcademicYearsProps> = ({ embedded = false }) => {
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
                        onClick={loadAcademicYears}
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
                                <span className="mr-3 text-4xl">📅</span>
                                Quản lý năm học & học kỳ
                            </h1>
                            <p className="text-gray-200 text-lg">Quản lý các năm học và học kỳ trong hệ thống</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingYear(null);
                                setShowYearForm(true);
                            }}
                            className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            + Tạo năm học
                        </button>
                    </div>
                </div>
            )}

            {embedded && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-primary-900 tracking-tight">Năm học & học kỳ</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Chọn năm học bên trái để quản lý học kỳ</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingYear(null);
                            setShowYearForm(true);
                        }}
                        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary-900 transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                    >
                        Thêm năm học
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Academic Years List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                                Danh sách năm học
                            </h3>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto bg-white">
                            {academicYears.length === 0 ? (
                                <div className="p-8 text-center bg-white">
                                    <p className="text-gray-800 font-medium">Chưa có năm học nào</p>
                                    <p className="text-gray-500 text-sm mt-1">Tạo năm học đầu tiên để bắt đầu</p>
                                </div>
                            ) : (
                                academicYears.map((year) => (
                                    <div
                                        key={year.id}
                                        className={`p-4 border-b border-gray-100 bg-white cursor-pointer transition-all ${
                                            selectedYear?.id === year.id 
                                                ? 'border-l-4 border-primary-900 bg-primary-50/60'
                                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                                        }`}
                                        onClick={() => setSelectedYear(year)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-base font-semibold mb-1.5 text-primary-900 tracking-tight">
                                                    {year.name}
                                                </h4>
                                                <div className="text-xs text-gray-500 tabular-nums">
                                                    {formatDate(year.startDate)} – {formatDate(year.endDate)}
                                                </div>
                                            </div>
                                            <div className="flex space-x-1 ml-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingYear(year);
                                                        setShowYearForm(true);
                                                    }}
                                                    className="p-2 text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
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
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Semesters List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                                        Học kỳ
                                    </h3>
                                    {selectedYear && (
                                        <p className="text-sm font-medium text-primary-900 mt-0.5">{selectedYear.name}</p>
                                    )}
                                </div>
                                {selectedYear && (
                                    <button
                                        onClick={() => {
                                            setEditingSemester(null);
                                            setShowSemesterForm(true);
                                        }}
                                        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-primary-900 transition-all hover:bg-accent-hover active:scale-[0.98]"
                                    >
                                        Thêm học kỳ
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-5">
                            {selectedYear ? (
                                <div className="space-y-3">
                                    {loadingSemesters ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-900 mx-auto"></div>
                                            <p className="mt-3 text-gray-600 text-sm">Đang tải học kỳ...</p>
                                        </div>
                                    ) : semesters.length === 0 ? (
                                        <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                                            <p className="text-gray-800 font-medium">Chưa có học kỳ trong năm này</p>
                                            <p className="text-gray-500 text-sm mt-1">Tạo học kỳ mới để bắt đầu</p>
                                        </div>
                                    ) : (
                                        semesters.map((semester) => (
                                            <div key={semester.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-premium transition-all">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 shrink-0 bg-primary-900 rounded-xl flex items-center justify-center text-sm font-semibold text-white tabular-nums">
                                                                {semester.name.replace(/[^0-9]/g, '').slice(0, 2) || 'HK'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-base font-semibold text-primary-900 tracking-tight">
                                                                    {semester.name}
                                                                </h4>
                                                                <p className="text-sm text-gray-500 mt-0.5 tabular-nums">
                                                                    {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                            semester.open
                                                                ? 'bg-emerald-50 text-emerald-800'
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {semester.open ? 'Đang mở' : 'Đã đóng'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleToggleSemester(semester.id, !semester.open)}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all active:scale-[0.98] ${
                                                                semester.open
                                                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                                            }`}
                                                        >
                                                            {semester.open ? 'Đóng' : 'Mở'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingSemester(semester);
                                                                setShowSemesterForm(true);
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 text-primary-900 hover:bg-primary-100 transition-all active:scale-[0.98]"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSemester(semester.id)}
                                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all active:scale-[0.98]"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                                    <p className="text-gray-800 font-medium">Chọn một năm học để xem học kỳ</p>
                                    <p className="text-gray-500 text-sm mt-1">Danh sách học kỳ sẽ hiện ở đây</p>
                                </div>
                            )}
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
        <StructureModal
            title={year ? 'Chỉnh sửa năm học' : 'Thêm năm học'}
            subtitle="Đặt tên và khoảng thời gian cho năm học"
            onClose={onClose}
            size="lg"
            footer={
                <>
                    <button type="button" onClick={onClose} className={modalCancelBtnClass}>
                        Hủy
                    </button>
                    <button type="submit" form="year-form" className={modalPrimaryBtnClass}>
                        {year ? 'Cập nhật' : 'Tạo năm học'}
                    </button>
                </>
            }
        >
            <form id="year-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={modalLabelClass}>
                        Tên năm học <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={modalFieldClass(!!errors.name)}
                        placeholder="Ví dụ: 2024-2025"
                    />
                    {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={modalLabelClass}>
                            Ngày bắt đầu <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className={modalFieldClass(!!errors.startDate)}
                        />
                        {errors.startDate && <p className="mt-1 text-sm text-rose-600">{errors.startDate}</p>}
                    </div>
                    <div>
                        <label className={modalLabelClass}>
                            Ngày kết thúc <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className={modalFieldClass(!!errors.endDate)}
                        />
                        {errors.endDate && <p className="mt-1 text-sm text-rose-600">{errors.endDate}</p>}
                    </div>
                </div>
            </form>
        </StructureModal>
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
        <StructureModal
            title={semester ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ'}
            subtitle={`Thuộc năm học ${yearName}`}
            onClose={onClose}
            size="lg"
            footer={
                <>
                    <button type="button" onClick={onClose} className={modalCancelBtnClass}>
                        Hủy
                    </button>
                    <button type="submit" form="semester-form" className={modalPrimaryBtnClass}>
                        {semester ? 'Cập nhật' : 'Tạo học kỳ'}
                    </button>
                </>
            }
        >
            <form id="semester-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-3.5 py-2.5 text-sm text-primary-900">
                    Năm học: <span className="font-semibold">{yearName}</span>
                </div>

                <div>
                    <label className={modalLabelClass}>
                        Tên học kỳ <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={modalFieldClass(!!errors.name)}
                        placeholder="Ví dụ: Học kỳ 1"
                    />
                    {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={modalLabelClass}>
                            Ngày bắt đầu <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className={modalFieldClass(!!errors.startDate)}
                        />
                        {errors.startDate && <p className="mt-1 text-sm text-rose-600">{errors.startDate}</p>}
                    </div>
                    <div>
                        <label className={modalLabelClass}>
                            Ngày kết thúc <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className={modalFieldClass(!!errors.endDate)}
                        />
                        {errors.endDate && <p className="mt-1 text-sm text-rose-600">{errors.endDate}</p>}
                    </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="open"
                        checked={formData.open}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900"
                    />
                    <span className="text-sm font-medium text-gray-800">
                        Mở học kỳ — cho phép sinh viên đăng ký hoạt động
                    </span>
                </label>
            </form>
        </StructureModal>
    );
};

export default AcademicYears;
