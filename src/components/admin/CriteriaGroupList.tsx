import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CriteriaGroup } from '../../types/admin';
import { criteriaGroupAPI } from '../../services/adminAPI';

const CriteriaGroupList: React.FC = () => {
    const [criteriaGroups, setCriteriaGroups] = useState<CriteriaGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCriteriaGroups();
    }, []);

    const fetchCriteriaGroups = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await criteriaGroupAPI.getCriteriaGroups();
            if (response.status && response.data) {
                setCriteriaGroups(response.data);
            } else {
                setError(response.message || 'Không thể tải danh sách nhóm tiêu chí');
            }
        } catch (error) {
            console.error('Error fetching criteria groups:', error);
            setError('Có lỗi xảy ra khi tải danh sách');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm tiêu chí này?')) {
            return;
        }

        try {
            const response = await criteriaGroupAPI.deleteCriteriaGroup(id);
            if (response.status) {
                setCriteriaGroups(prev => prev.filter(group => group.id !== id));
                alert('Xóa thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa');
            }
        } catch (error) {
            console.error('Error deleting criteria group:', error);
            alert('Có lỗi xảy ra khi xóa');
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhóm tiêu chí</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý các nhóm tiêu chí đánh giá điểm rèn luyện
                    </p>
                </div>
                <Link
                    to="/admin/criteria-groups/create"
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

            {/* Criteria Groups List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {criteriaGroups.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có nhóm tiêu chí nào</h3>
                        <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo nhóm tiêu chí đầu tiên.</p>
                        <div className="mt-6">
                            <Link
                                to="/admin/criteria-groups/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                            >
                                Thêm mới
                            </Link>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {criteriaGroups.map((group) => (
                            <li key={group.id}>
                                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                <span className="text-orange-600 font-medium text-sm">
                                                    📋
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {group.name}
                                                </p>
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    Nhóm tiêu chí
                                                </span>
                                            </div>
                                            {group.description && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {group.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Tạo bởi: {group.createdBy} • {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Link
                                            to={`/admin/criteria-groups/${group.id}/items`}
                                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                        >
                                            Xem tiêu chí
                                        </Link>
                                        <Link
                                            to={`/admin/criteria-groups/${group.id}/edit`}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            Chỉnh sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(group.id)}
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

export default CriteriaGroupList;
