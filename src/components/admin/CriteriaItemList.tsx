import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CriteriaItem, CriteriaGroup, Department } from '../../types/admin';
import { criteriaItemAPI, criteriaGroupAPI, departmentAPI } from '../../services/adminAPI';

const CriteriaItemList: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const [criteriaItems, setCriteriaItems] = useState<CriteriaItem[]>([]);
    const [criteriaGroup, setCriteriaGroup] = useState<CriteriaGroup | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (groupId) {
            fetchData();
        }
    }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async () => {
        if (!groupId) return;

        setLoading(true);
        setError('');
        try {
            // Fetch criteria group info
            const groupResponse = await criteriaGroupAPI.getCriteriaGroup(parseInt(groupId));
            if (groupResponse.status && groupResponse.data) {
                setCriteriaGroup(groupResponse.data);
            }

            // Fetch departments for display
            const departmentsResponse = await departmentAPI.getDepartments();
            if (departmentsResponse.status && departmentsResponse.data) {
                setDepartments(departmentsResponse.data);
            }

            // Fetch criteria items
            const itemsResponse = await criteriaItemAPI.getCriteriaItemsByGroup(parseInt(groupId));
            if (itemsResponse.status && itemsResponse.data) {
                setCriteriaItems(itemsResponse.data);
            } else {
                setError(itemsResponse.message || 'Không thể tải danh sách tiêu chí');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tiêu chí này?')) {
            return;
        }

        try {
            const response = await criteriaItemAPI.deleteCriteriaItem(id);
            if (response.status) {
                setCriteriaItems(prev => prev.filter(item => item.id !== id));
                alert('Xóa thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa');
            }
        } catch (error) {
            console.error('Error deleting criteria item:', error);
            alert('Có lỗi xảy ra khi xóa');
        }
    };

    const getDepartmentName = (departmentId?: number) => {
        if (!departmentId) return 'Không xác định';
        const department = departments.find(dept => dept.id === departmentId);
        return department ? department.name : 'Không xác định';
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
                        Quản lý Tiêu chí
                    </h1>
                    {criteriaGroup && (
                        <p className="mt-1 text-sm text-gray-500">
                            Nhóm: {criteriaGroup.name}
                        </p>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Link
                        to="/admin/criteria-groups"
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Quay lại
                    </Link>
                    {groupId && (
                        <Link
                            to={`/admin/criteria-groups/${groupId}/items/create`}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            Thêm tiêu chí
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

            {/* Criteria Items List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {criteriaItems.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có tiêu chí nào</h3>
                        <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo tiêu chí đầu tiên.</p>
                        {groupId && (
                            <div className="mt-6">
                                <Link
                                    to={`/admin/criteria-groups/${groupId}/items/create`}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                >
                                    Thêm tiêu chí
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {criteriaItems.map((item) => (
                            <li key={item.id}>
                                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                                <span className="text-red-600 font-medium text-sm">
                                                    ✅
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </p>
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {item.minScore} - {item.maxScore} điểm
                                                </span>
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {item.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Phụ trách: {getDepartmentName(item.departmentId)} •
                                                Tạo bởi: {item.createdBy} • {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Link
                                            to={`/admin/criteria-items/${item.id}/edit`}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            Chỉnh sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(item.id)}
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

export default CriteriaItemList;
