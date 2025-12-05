import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DepartmentForm from '../../components/admin/DepartmentForm';
import { Department, UpdateDepartmentRequest } from '../../types/admin';
import { departmentAPI } from '../../services/adminAPI';

const EditDepartment: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDepartment = async () => {
            if (!id) return;
            setInitialLoading(true);
            try {
                const response = await departmentAPI.getDepartment(parseInt(id));
                if (response.status && response.data) {
                    setDepartment(response.data);
                } else {
                    setError(response.message || 'Không thể tải thông tin khoa/phòng ban');
                }
            } catch (err: any) {
                console.error('Fetch department error:', err);
                setError(err.message || 'Có lỗi xảy ra khi tải thông tin');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchDepartment();
    }, [id]);

    const handleSubmit = async (data: UpdateDepartmentRequest) => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const response = await departmentAPI.updateDepartment(parseInt(id), data);
            if (response.status) {
                alert('Cập nhật khoa/phòng ban thành công!');
                navigate('/admin/departments');
            } else {
                setError(response.message || 'Có lỗi xảy ra khi cập nhật khoa/phòng ban');
            }
        } catch (err: any) {
            console.error('Update department error:', err);
            setError(err.message || 'Có lỗi xảy ra khi cập nhật khoa/phòng ban');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (!department) {
        return (
            <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy khoa/phòng ban</h3>
                <p className="text-gray-600 mb-6">Khoa/phòng ban bạn đang tìm có thể đã bị xóa hoặc không tồn tại.</p>
                <button
                    onClick={() => navigate('/admin/departments')}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-xl hover:from-[#002A66] hover:to-[#001C44] shadow-lg hover:shadow-xl font-semibold transition-all"
                >
                    ← Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44] flex items-center">
                        <span className="mr-3 text-4xl">✏️</span>
                        Chỉnh sửa khoa/phòng ban
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Cập nhật thông tin khoa/phòng ban: <span className="font-semibold text-[#001C44]">{department.name}</span>
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
            <DepartmentForm
                onSubmit={handleSubmit}
                loading={loading}
                initialData={department}
                title="Chỉnh sửa khoa/phòng ban"
                onCancel={() => navigate('/admin/departments')}
            />
        </div>
    );
};

export default EditDepartment;
