import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AcademicYearForm from '../../components/admin/AcademicYearForm';
import { CreateAcademicYearRequest, UpdateAcademicYearRequest } from '../../types/admin';
import { academicYearAPI } from '../../services/adminAPI';

const CreateAcademicYear: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (data: CreateAcademicYearRequest | UpdateAcademicYearRequest) => {
        setLoading(true);
        setError('');
        try {
            const response = await academicYearAPI.createAcademicYear(data as CreateAcademicYearRequest);
            if (response.status) {
                alert('Tạo niên khóa thành công!');
                navigate('/admin/academic-years');
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tạo niên khóa');
            }
        } catch (err: any) {
            console.error('Create academic year error:', err);
            setError(err.message || 'Có lỗi xảy ra khi tạo niên khóa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tạo niên khóa mới</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Thêm niên khóa mới vào hệ thống
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
                title="Tạo niên khóa mới"
                onCancel={() => navigate('/admin/academic-years')}
            />
        </div>
    );
};

export default CreateAcademicYear;
