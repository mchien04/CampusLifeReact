import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AcademicYear } from '../../types/admin';
import { academicYearAPI } from '../../services/adminAPI';

const AcademicYearList: React.FC = () => {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    const fetchAcademicYears = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await academicYearAPI.getAcademicYears();
            if (response.status && response.data) {
                setAcademicYears(response.data);
            } else {
                setError(response.message || 'Không thể tải danh sách niên khóa');
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            setError('Có lỗi xảy ra khi tải danh sách');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa niên khóa này?')) {
            return;
        }

        try {
            const response = await academicYearAPI.deleteAcademicYear(id);
            if (response.status) {
                setAcademicYears(prev => prev.filter(year => year.id !== id));
                alert('Xóa thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa');
            }
        } catch (error) {
            console.error('Error deleting academic year:', error);
            alert('Có lỗi xảy ra khi xóa');
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Niên khóa</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý các năm học và thời gian hoạt động
                    </p>
                </div>
                <Link
                    to="/admin/academic-years/create"
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

            {/* Academic Years List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {academicYears.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có niên khóa nào</h3>
                        <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo niên khóa đầu tiên.</p>
                        <div className="mt-6">
                            <Link
                                to="/admin/academic-years/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                            >
                                Thêm mới
                            </Link>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {academicYears.map((year) => (
                            <li key={year.id}>
                                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <span className="text-green-600 font-medium text-sm">
                                                    📅
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {year.name}
                                                </p>
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Niên khóa
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Từ {formatDate(year.startDate)} đến {formatDate(year.endDate)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Tạo bởi: {year.createdBy} • {formatDate(year.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Link
                                            to={`/admin/academic-years/${year.id}/semesters`}
                                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                        >
                                            Xem học kỳ
                                        </Link>
                                        <Link
                                            to={`/admin/academic-years/${year.id}/edit`}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            Chỉnh sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(year.id)}
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

export default AcademicYearList;
