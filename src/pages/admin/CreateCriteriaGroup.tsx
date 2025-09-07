import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CriteriaGroupForm from '../../components/admin/CriteriaGroupForm';
import { CreateCriteriaGroupRequest, UpdateCriteriaGroupRequest } from '../../types/admin';
import { criteriaGroupAPI } from '../../services/adminAPI';

const CreateCriteriaGroup: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (data: CreateCriteriaGroupRequest | UpdateCriteriaGroupRequest) => {
        setLoading(true);
        setError('');
        try {
            const response = await criteriaGroupAPI.createCriteriaGroup(data as CreateCriteriaGroupRequest);
            if (response.status) {
                alert('Tạo nhóm tiêu chí thành công!');
                navigate('/admin/criteria-groups');
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tạo nhóm tiêu chí');
            }
        } catch (err: any) {
            console.error('Create criteria group error:', err);
            setError(err.message || 'Có lỗi xảy ra khi tạo nhóm tiêu chí');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tạo nhóm tiêu chí mới</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Thêm nhóm tiêu chí mới vào hệ thống
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
            <CriteriaGroupForm
                onSubmit={handleSubmit}
                loading={loading}
                title="Tạo nhóm tiêu chí mới"
                onCancel={() => navigate('/admin/criteria-groups')}
            />
        </div>
    );
};

export default CreateCriteriaGroup;
