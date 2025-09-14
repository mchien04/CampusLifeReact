import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CriteriaGroup, CreateCriteriaGroupRequest, UpdateCriteriaGroupRequest,
    CriteriaItem, CreateCriteriaItemRequest, UpdateCriteriaItemRequest,
    Department, DepartmentType
} from '../../types/admin';
import { criteriaGroupAPI, criteriaItemAPI, departmentAPI } from '../../services/adminAPI';

const CriteriaManagement: React.FC = () => {
    const [criteriaGroups, setCriteriaGroups] = useState<CriteriaGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<CriteriaGroup | null>(null);
    const [criteriaItems, setCriteriaItems] = useState<CriteriaItem[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [error, setError] = useState('');
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [showItemForm, setShowItemForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CriteriaGroup | null>(null);
    const [editingItem, setEditingItem] = useState<CriteriaItem | null>(null);

    useEffect(() => {
        loadCriteriaGroups();
        loadDepartments();
    }, []);

    const loadCriteriaGroups = async () => {
        setLoading(true);
        try {
            const response = await criteriaGroupAPI.getCriteriaGroups();
            if (response.status && response.data) {
                setCriteriaGroups(response.data);
                if (response.data.length > 0) {
                    setSelectedGroup(response.data[0]);
                }
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải danh sách nhóm tiêu chí');
            }
        } catch (error) {
            console.error('Error loading criteria groups:', error);
            setError('Có lỗi xảy ra khi tải danh sách nhóm tiêu chí');
        } finally {
            setLoading(false);
        }
    };

    const loadDepartments = async () => {
        try {
            const response = await departmentAPI.getDepartments();
            if (response.status && response.data) {
                setDepartments(response.data);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const loadCriteriaItems = async (groupId: number) => {
        setLoadingItems(true);
        try {
            const response = await criteriaItemAPI.getCriteriaItemsByGroup(groupId);
            if (response.status && response.data) {
                setCriteriaItems(response.data);
            } else {
                setCriteriaItems([]);
            }
        } catch (error) {
            console.error('Error loading criteria items:', error);
            setCriteriaItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    useEffect(() => {
        if (selectedGroup) {
            loadCriteriaItems(selectedGroup.id);
        }
    }, [selectedGroup]);

    const handleCreateGroup = async (data: CreateCriteriaGroupRequest) => {
        try {
            const response = await criteriaGroupAPI.createCriteriaGroup(data);
            if (response.status) {
                setShowGroupForm(false);
                loadCriteriaGroups();
                alert('Tạo nhóm tiêu chí thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo nhóm tiêu chí');
            }
        } catch (error) {
            console.error('Error creating criteria group:', error);
            alert('Có lỗi xảy ra khi tạo nhóm tiêu chí');
        }
    };

    const handleUpdateGroup = async (data: UpdateCriteriaGroupRequest) => {
        if (!editingGroup) return;

        try {
            const response = await criteriaGroupAPI.updateCriteriaGroup(editingGroup.id, data);
            if (response.status) {
                setShowGroupForm(false);
                setEditingGroup(null);
                loadCriteriaGroups();
                alert('Cập nhật nhóm tiêu chí thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật nhóm tiêu chí');
            }
        } catch (error) {
            console.error('Error updating criteria group:', error);
            alert('Có lỗi xảy ra khi cập nhật nhóm tiêu chí');
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm tiêu chí này? Tất cả tiêu chí trong nhóm cũng sẽ bị xóa.')) {
            return;
        }

        try {
            const response = await criteriaGroupAPI.deleteCriteriaGroup(id);
            if (response.status) {
                loadCriteriaGroups();
                if (selectedGroup?.id === id) {
                    setSelectedGroup(null);
                    setCriteriaItems([]);
                }
                alert('Xóa nhóm tiêu chí thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa nhóm tiêu chí');
            }
        } catch (error) {
            console.error('Error deleting criteria group:', error);
            alert('Có lỗi xảy ra khi xóa nhóm tiêu chí');
        }
    };

    const handleCreateItem = async (data: CreateCriteriaItemRequest) => {
        try {
            const response = await criteriaItemAPI.createCriteriaItem(data);
            if (response.status) {
                setShowItemForm(false);
                if (selectedGroup) {
                    loadCriteriaItems(selectedGroup.id);
                }
                alert('Tạo tiêu chí thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo tiêu chí');
            }
        } catch (error) {
            console.error('Error creating criteria item:', error);
            alert('Có lỗi xảy ra khi tạo tiêu chí');
        }
    };

    const handleUpdateItem = async (data: CreateCriteriaItemRequest) => {
        if (!editingItem) return;

        try {
            const response = await criteriaItemAPI.updateCriteriaItem(editingItem.id, data);
            if (response.status) {
                setShowItemForm(false);
                setEditingItem(null);
                if (selectedGroup) {
                    loadCriteriaItems(selectedGroup.id);
                }
                alert('Cập nhật tiêu chí thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật tiêu chí');
            }
        } catch (error) {
            console.error('Error updating criteria item:', error);
            alert('Có lỗi xảy ra khi cập nhật tiêu chí');
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tiêu chí này?')) {
            return;
        }

        try {
            const response = await criteriaItemAPI.deleteCriteriaItem(id);
            if (response.status) {
                if (selectedGroup) {
                    loadCriteriaItems(selectedGroup.id);
                }
                alert('Xóa tiêu chí thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa tiêu chí');
            }
        } catch (error) {
            console.error('Error deleting criteria item:', error);
            alert('Có lỗi xảy ra khi xóa tiêu chí');
        }
    };

    const getDepartmentName = (departmentId?: number): string => {
        if (!departmentId) return 'Tất cả phòng ban';
        const dept = departments.find(d => d.id === departmentId);
        return dept ? dept.name : 'Không xác định';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadCriteriaGroups}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý tiêu chí đánh giá</h1>
                            <p className="text-gray-600 mt-1">Quản lý các nhóm tiêu chí và tiêu chí đánh giá</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại Dashboard
                            </Link>
                            <button
                                onClick={() => {
                                    setEditingGroup(null);
                                    setShowGroupForm(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                + Tạo nhóm tiêu chí
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Criteria Groups List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Nhóm tiêu chí</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {criteriaGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedGroup?.id === group.id ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                        onClick={() => setSelectedGroup(group)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                    {group.name}
                                                </h4>
                                                {group.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-2">
                                                        {group.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingGroup(group);
                                                        setShowGroupForm(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                    title="Chỉnh sửa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteGroup(group.id);
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    title="Xóa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Criteria Items List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Tiêu chí
                                        {selectedGroup && ` - ${selectedGroup.name}`}
                                    </h3>
                                    {selectedGroup && (
                                        <button
                                            onClick={() => {
                                                setEditingItem(null);
                                                setShowItemForm(true);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            + Tạo tiêu chí
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-6">
                                {selectedGroup ? (
                                    <div className="space-y-4">
                                        {loadingItems ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                <p className="mt-2 text-gray-600">Đang tải tiêu chí...</p>
                                            </div>
                                        ) : criteriaItems.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="text-gray-400 text-4xl mb-4">📋</div>
                                                <p className="text-gray-600">Chưa có tiêu chí nào trong nhóm này</p>
                                            </div>
                                        ) : (
                                            criteriaItems.map((item) => (
                                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                                                                {item.name}
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                                                                <div>
                                                                    <span className="font-medium">Điểm tối đa:</span> {item.maxScore}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Điểm tối thiểu:</span> {item.minScore}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Phòng ban:</span> {getDepartmentName(item.departmentId)}
                                                                </div>
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-gray-600 text-sm mt-2">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(item);
                                                                    setShowItemForm(true);
                                                                }}
                                                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
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
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-4xl mb-4">📋</div>
                                        <p className="text-gray-600">Chọn một nhóm tiêu chí để xem tiêu chí</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Group Form Modal */}
            {showGroupForm && (
                <GroupFormModal
                    group={editingGroup}
                    onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
                    onClose={() => {
                        setShowGroupForm(false);
                        setEditingGroup(null);
                    }}
                />
            )}

            {/* Item Form Modal */}
            {showItemForm && selectedGroup && (
                <ItemFormModal
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                    item={editingItem}
                    departments={departments}
                    onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
                    onClose={() => {
                        setShowItemForm(false);
                        setEditingItem(null);
                    }}
                />
            )}
        </div>
    );
};

// Group Form Modal Component
interface GroupFormModalProps {
    group: CriteriaGroup | null;
    onSubmit: (data: CreateCriteriaGroupRequest) => void;
    onClose: () => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ group, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<CreateCriteriaGroupRequest>({
        name: '',
        description: '',
        ...group
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên nhóm tiêu chí là bắt buộc';
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {group ? 'Chỉnh sửa nhóm tiêu chí' : 'Tạo nhóm tiêu chí mới'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên nhóm tiêu chí *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ví dụ: Tiêu chí rèn luyện"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mô tả về nhóm tiêu chí..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {group ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Item Form Modal Component
interface ItemFormModalProps {
    groupId: number;
    groupName: string;
    item: CriteriaItem | null;
    departments: Department[];
    onSubmit: (data: CreateCriteriaItemRequest) => void;
    onClose: () => void;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({ groupId, groupName, item, departments, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<CreateCriteriaItemRequest>({
        groupId: groupId,
        name: '',
        maxScore: 10,
        minScore: 0,
        departmentId: undefined,
        description: '',
        ...item
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxScore' || name === 'minScore' ? parseInt(value) || 0 : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên tiêu chí là bắt buộc';
        }

        if (formData.maxScore <= 0) {
            newErrors.maxScore = 'Điểm tối đa phải lớn hơn 0';
        }

        if (formData.minScore < 0) {
            newErrors.minScore = 'Điểm tối thiểu không được âm';
        }

        if (formData.maxScore <= formData.minScore) {
            newErrors.maxScore = 'Điểm tối đa phải lớn hơn điểm tối thiểu';
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {item ? 'Chỉnh sửa tiêu chí' : 'Tạo tiêu chí mới'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                            <strong>Nhóm tiêu chí:</strong> {groupName}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên tiêu chí *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ví dụ: Tham gia hoạt động ngoại khóa"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Điểm tối đa *
                                </label>
                                <input
                                    type="number"
                                    name="maxScore"
                                    value={formData.maxScore}
                                    onChange={handleChange}
                                    min="1"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maxScore ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.maxScore && <p className="text-red-500 text-sm mt-1">{errors.maxScore}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Điểm tối thiểu *
                                </label>
                                <input
                                    type="number"
                                    name="minScore"
                                    value={formData.minScore}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.minScore ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.minScore && <p className="text-red-500 text-sm mt-1">{errors.minScore}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phòng ban áp dụng
                            </label>
                            <select
                                name="departmentId"
                                value={formData.departmentId || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả phòng ban</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mô tả chi tiết về tiêu chí..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                {item ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CriteriaManagement;
