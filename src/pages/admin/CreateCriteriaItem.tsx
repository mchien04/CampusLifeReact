import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriteriaItemForm from '../../components/admin/CriteriaItemForm';
import { CreateCriteriaItemRequest, UpdateCriteriaItemRequest } from '../../types/admin';
import { criteriaItemAPI } from '../../services/adminAPI';

const CreateCriteriaItem: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (data: CreateCriteriaItemRequest | UpdateCriteriaItemRequest) => {
        setLoading(true);
        setError('');
        try {
            const response = await criteriaItemAPI.createCriteriaItem(data as CreateCriteriaItemRequest);
            if (response.status) {
                alert('Tạo tiêu chí thành công!');
                navigate(`/admin/criteria-groups/${groupId}/items`);
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tạo tiêu chí');
            }
        } catch (err: any) {
            console.error('Create criteria item error:', err);
            setError(err.message || 'Có lỗi xảy ra khi tạo tiêu chí');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tạo tiêu chí mới</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Thêm tiêu chí mới vào nhóm
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
            <CriteriaItemForm
                onSubmit={handleSubmit}
                loading={loading}
                title="Tạo tiêu chí mới"
                onCancel={() => navigate(`/admin/criteria-groups/${groupId}/items`)}
            />
        </div>
    );
};

export default CreateCriteriaItem;
