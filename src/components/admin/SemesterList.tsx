import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Semester, AcademicYear } from '../../types/admin';
import { semesterAPI, academicYearAPI } from '../../services/adminAPI';

const SemesterList: React.FC = () => {
    const { yearId } = useParams<{ yearId: string }>();
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (yearId) {
            fetchData();
        }
    }, [yearId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async () => {
        if (!yearId) return;

        setLoading(true);
        setError('');
        try {
            // Fetch academic year info
            const yearResponse = await academicYearAPI.getAcademicYear(parseInt(yearId));
            if (yearResponse.status && yearResponse.data) {
                setAcademicYear(yearResponse.data);
            }

            // Fetch semesters
            const semestersResponse = await semesterAPI.getSemestersByYear(parseInt(yearId));
            if (semestersResponse.status && semestersResponse.data) {
                setSemesters(semestersResponse.data);
            } else {
                setError(semestersResponse.message || 'Không thể tải danh sách học kỳ');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) {
            return;
        }

        try {
            const response = await semesterAPI.deleteSemester(id);
            if (response.status) {
                setSemesters(prev => prev.filter(semester => semester.id !== id));
                alert('Xóa thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa');
            }
        } catch (error) {
            console.error('Error deleting semester:', error);
            alert('Có lỗi xảy ra khi xóa');
        }
    };

    const handleToggleOpen = async (id: number, currentOpen: boolean) => {
        try {
            const response = await semesterAPI.toggleSemester(id, !currentOpen);
            if (response.status) {
                setSemesters(prev => prev.map(semester =>
                    semester.id === id
                        ? { ...semester, open: !currentOpen }
                        : semester
                ));
                alert(`Học kỳ đã được ${!currentOpen ? 'mở' : 'đóng'}!`);
            } else {
                alert(response.message || 'Có lỗi xảy ra khi thay đổi trạng thái');
            }
        } catch (error) {
            console.error('Error toggling semester:', error);
            alert('Có lỗi xảy ra khi thay đổi trạng thái');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý Học kỳ
                    </h1>
                    {academicYear && (
                        <p className="mt-1 text-sm text-gray-500">
                            Niên khóa: {academicYear.name}
                        </p>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Link
                        to="/admin/academic-years"
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Quay lại
                    </Link>
                    {yearId && (
                        <Link
                            to={`/admin/academic-years/${yearId}/semesters/create`}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            Thêm học kỳ
                        </Link>
                    )}
                </div>
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

            {/* Semesters List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {semesters.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có học kỳ nào</h3>
                        <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo học kỳ đầu tiên.</p>
                        {yearId && (
                            <div className="mt-6">
                                <Link
                                    to={`/admin/academic-years/${yearId}/semesters/create`}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                >
                                    Thêm học kỳ
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {semesters.map((semester) => (
                            <li key={semester.id}>
                                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${semester.open ? 'bg-green-100' : 'bg-red-100'
                                                }`}>
                                                <span className={`font-medium text-sm ${semester.open ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    📚
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {semester.name}
                                                </p>
                                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${semester.open
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {semester.open ? 'Đang mở' : 'Đã đóng'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Từ {formatDate(semester.startDate)} đến {formatDate(semester.endDate)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Tạo bởi: {semester.createdBy} • {formatDate(semester.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleToggleOpen(semester.id, semester.open)}
                                            className={`text-sm font-medium ${semester.open
                                                ? 'text-red-600 hover:text-red-900'
                                                : 'text-green-600 hover:text-green-900'
                                                }`}
                                        >
                                            {semester.open ? 'Đóng' : 'Mở'}
                                        </button>
                                        <Link
                                            to={`/admin/semesters/${semester.id}/edit`}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            Chỉnh sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(semester.id)}
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

export default SemesterList;
