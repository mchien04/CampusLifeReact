import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AcademicYearForm from '../../components/admin/AcademicYearForm';
import { AcademicYear, UpdateAcademicYearRequest } from '../../types/admin';
import { academicYearAPI } from '../../services/adminAPI';

const EditAcademicYear: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAcademicYear = async () => {
            if (!id) return;
            setInitialLoading(true);
            try {
                const response = await academicYearAPI.getAcademicYear(parseInt(id));
                if (response.status && response.data) {
                    setAcademicYear(response.data);
                } else {
                    setError(response.message || 'Không thể tải thông tin niên khóa');
                }
            } catch (err: any) {
                console.error('Fetch academic year error:', err);
                setError(err.message || 'Có lỗi xảy ra khi tải thông tin');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchAcademicYear();
    }, [id]);

    const handleSubmit = async (data: UpdateAcademicYearRequest) => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const response = await academicYearAPI.updateAcademicYear(parseInt(id), data);
            if (response.status) {
                alert('Cập nhật niên khóa thành công!');
                navigate('/admin/academic-years');
            } else {
                setError(response.message || 'Có lỗi xảy ra khi cập nhật niên khóa');
            }
        } catch (err: any) {
            console.error('Update academic year error:', err);
            setError(err.message || 'Có lỗi xảy ra khi cập nhật niên khóa');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!academicYear) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Không tìm thấy niên khóa</h3>
                <p className="mt-1 text-sm text-gray-500">Niên khóa bạn đang tìm có thể đã bị xóa hoặc không tồn tại.</p>
                <div className="mt-6">
                    <button
                        onClick={() => navigate('/admin/academic-years')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa niên khóa</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Cập nhật thông tin niên khóa: {academicYear.name}
                    </p>
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

            {/* Form */}
            <AcademicYearForm
                onSubmit={handleSubmit}
                loading={loading}
                initialData={academicYear}
                title="Chỉnh sửa niên khóa"
                onCancel={() => navigate('/admin/academic-years')}
            />
        </div>
    );
};

export default EditAcademicYear;
