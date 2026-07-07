import React, { useState, useEffect } from 'react';
import { UserResponse, CreateUserRequest, UpdateUserRequest, Role } from '../../types/auth';
import { Department } from '../../types/admin';
import { userAPI, departmentAPI } from '../../services/adminAPI';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVATED' | 'DEACTIVATED'>('ALL');
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; userId: number | null; username: string }>({
        show: false,
        userId: null,
        username: ''
    });
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        loadUsers();
        loadDepartments();
    }, []);

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

    const loadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await userAPI.getUsers();
            if (response.status && response.data) {
                setUsers(response.data);
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải danh sách tài khoản');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            setError('Có lỗi xảy ra khi tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data: CreateUserRequest) => {
        try {
            const response = await userAPI.createUser(data);
            if (response.status) {
                setShowCreateModal(false);
                loadUsers();
                alert('Tạo tài khoản thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo tài khoản');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Có lỗi xảy ra khi tạo tài khoản');
        }
    };

    const handleUpdate = async (userId: number, data: UpdateUserRequest) => {
        try {
            const response = await userAPI.updateUser(userId, data);
            if (response.status) {
                setShowCreateModal(false);
                setEditingUser(null);
                loadUsers();
                alert('Cập nhật tài khoản thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi cập nhật tài khoản');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Có lỗi xảy ra khi cập nhật tài khoản');
        }
    };

    const handleDelete = async (userId: number) => {
        try {
            const response = await userAPI.deleteUser(userId);
            if (response.status) {
                setDeleteConfirm({ show: false, userId: null, username: '' });
                loadUsers();
                alert('Xóa tài khoản thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa tài khoản');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Có lỗi xảy ra khi xóa tài khoản');
        }
    };

    const handleBulkActivate = async () => {
        if (selectedUsers.length === 0) return;
        try {
            const promises = selectedUsers.map(userId => userAPI.updateUser(userId, { isActivated: true }));
            await Promise.all(promises);
            setSelectedUsers([]);
            loadUsers();
            alert(`Đã kích hoạt ${selectedUsers.length} tài khoản!`);
        } catch (error) {
            console.error('Error bulk activating users:', error);
            alert('Có lỗi xảy ra khi kích hoạt tài khoản');
        }
    };

    const handleBulkDeactivate = async () => {
        if (selectedUsers.length === 0) return;
        try {
            const promises = selectedUsers.map(userId => userAPI.updateUser(userId, { isActivated: false }));
            await Promise.all(promises);
            setSelectedUsers([]);
            loadUsers();
            alert(`Đã vô hiệu hóa ${selectedUsers.length} tài khoản!`);
        } catch (error) {
            console.error('Error bulk deactivating users:', error);
            alert('Có lỗi xảy ra khi vô hiệu hóa tài khoản');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedUsers.length} tài khoản?`)) {
            return;
        }
        try {
            const promises = selectedUsers.map(userId => userAPI.deleteUser(userId));
            await Promise.all(promises);
            setSelectedUsers([]);
            loadUsers();
            alert(`Đã xóa ${selectedUsers.length} tài khoản!`);
        } catch (error) {
            console.error('Error bulk deleting users:', error);
            alert('Có lỗi xảy ra khi xóa tài khoản');
        }
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVATED' && user.isActivated) ||
            (statusFilter === 'DEACTIVATED' && !user.isActivated);
        return matchesSearch && matchesRole && matchesStatus;
    });

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return 'Chưa đăng nhập';
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center">
                        <span className="mr-3 text-4xl">👥</span>
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Quản lý tài khoản</h1>
                            <p className="text-gray-200 text-lg">Quản lý tài khoản ADMIN và MANAGER trong hệ thống</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">❌</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={loadUsers}
                            className="bg-gradient-to-r from-[#001C44] to-[#002A66] hover:from-[#002A66] hover:to-[#001C44] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="mr-3 text-4xl">👥</span>
                            Quản lý tài khoản
                        </h1>
                        <p className="text-gray-200 text-lg">Quản lý tài khoản ADMIN và MANAGER trong hệ thống</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setShowCreateModal(true);
                        }}
                        className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        + Tạo tài khoản mới
                    </button>
                </div>
            </div>

            <div>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-[#001C44] mb-4">Bộ lọc</h3>
                    
                    {/* Search */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm theo username hoặc email..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Vai trò:</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setRoleFilter('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${roleFilter === 'ALL'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả ({users.length})
                            </button>
                            <button
                                onClick={() => setRoleFilter('ADMIN')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${roleFilter === 'ADMIN'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                ADMIN ({users.filter(u => u.role === Role.ADMIN).length})
                            </button>
                            <button
                                onClick={() => setRoleFilter('MANAGER')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${roleFilter === 'MANAGER'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                MANAGER ({users.filter(u => u.role === Role.MANAGER).length})
                            </button>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Trạng thái:</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'ALL'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setStatusFilter('ACTIVATED')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === 'ACTIVATED'
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                    }`}
                            >
                                <span>✓</span>
                                <span>Đã kích hoạt ({users.filter(u => u.isActivated).length})</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('DEACTIVATED')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === 'DEACTIVATED'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                    }`}
                            >
                                <span>✗</span>
                                <span>Chưa kích hoạt ({users.filter(u => !u.isActivated).length})</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUsers.length > 0 && (
                    <div className="bg-[#FFD66D] rounded-lg shadow-md p-4 mb-6 border-2 border-[#001C44]">
                        <div className="flex items-center justify-between">
                            <span className="text-[#001C44] font-semibold">
                                Đã chọn {selectedUsers.length} tài khoản
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkActivate}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                >
                                    Kích hoạt
                                </button>
                                <button
                                    onClick={handleBulkDeactivate}
                                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                                >
                                    Vô hiệu hóa
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                >
                                    Xóa
                                </button>
                                <button
                                    onClick={() => setSelectedUsers([])}
                                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                >
                                    Bỏ chọn
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#001C44]">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Vai trò
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Lần đăng nhập cuối
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="text-gray-400 text-5xl mb-4">👤</div>
                                            <p className="text-gray-600">Không tìm thấy tài khoản nào</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                    className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.role === Role.ADMIN
                                                        ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                                                        : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.isActivated
                                                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                                                }`}>
                                                    {user.isActivated ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{formatDate(user.lastLogin)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setShowCreateModal(true);
                                                        }}
                                                        className="text-[#001C44] hover:text-[#002A66] font-medium"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm({ show: true, userId: user.id, username: user.username })}
                                                        className="text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <UserFormModal
                    user={editingUser}
                    departments={departments}
                    onSubmit={editingUser 
                        ? (data) => handleUpdate(editingUser.id, data as UpdateUserRequest)
                        : (data) => handleCreate(data as CreateUserRequest)
                    }
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingUser(null);
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteConfirm.username}</strong>?
                            <br />
                            <span className="text-sm text-gray-500">(Xóa mềm: tài khoản sẽ không còn hiển thị trong danh sách)</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, userId: null, username: '' })}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => deleteConfirm.userId && handleDelete(deleteConfirm.userId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// User Form Modal Component
interface UserFormModalProps {
    user: UserResponse | null;
    departments: Department[];
    onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
    onClose: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, departments, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<CreateUserRequest | UpdateUserRequest>({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        role: (user?.role === Role.ADMIN || user?.role === Role.MANAGER) ? user.role as 'ADMIN' | 'MANAGER' : 'ADMIN',
        isActivated: user?.isActivated ?? true,
        departmentIds: user?.departmentIds || []
    });
    const [changePassword, setChangePassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            if (name === 'role' && value === 'ADMIN') {
                updated.departmentIds = [];
            }
            return updated;
        });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
        setFormData(prev => ({
            ...prev,
            departmentIds: options
        }));
        if (errors.departmentIds) {
            setErrors(prev => ({ ...prev, departmentIds: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username?.trim()) {
            newErrors.username = 'Username là bắt buộc';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!user && !formData.password) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.role) {
            newErrors.role = 'Vai trò là bắt buộc';
        }

        if (formData.role === 'MANAGER' && (!formData.departmentIds || formData.departmentIds.length === 0)) {
            newErrors.departmentIds = 'Vui lòng chọn ít nhất 1 khoa cho Manager';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const submitData = user
                ? { ...formData, password: changePassword ? formData.password : undefined }
                : formData;
            onSubmit(submitData as CreateUserRequest | UpdateUserRequest);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#001C44]">
                        {user ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username *
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username || ''}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                errors.username ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập username"
                        />
                        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập email"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {user && (
                        <div className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                id="changePassword"
                                checked={changePassword}
                                onChange={(e) => setChangePassword(e.target.checked)}
                                className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                            />
                            <label htmlFor="changePassword" className="ml-2 text-sm text-gray-700">
                                Đổi mật khẩu
                            </label>
                        </div>
                    )}

                    {(!user || changePassword) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu {user ? '' : '*'}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                    errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                                autoComplete="new-password"
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vai trò *
                        </label>
                        <select
                            name="role"
                            value={formData.role || 'ADMIN'}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                        </select>
                        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                    </div>

                    {formData.role === 'MANAGER' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phân công Khoa * (chọn nhiều)
                            </label>
                            <select
                                multiple
                                name="departmentIds"
                                value={formData.departmentIds?.map(String) || []}
                                onChange={handleDepartmentChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] min-h-[100px] ${
                                    errors.departmentIds ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            {errors.departmentIds && <p className="text-red-500 text-sm mt-1">{errors.departmentIds}</p>}
                            <p className="text-xs text-gray-500 mt-1">Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều khoa.</p>
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="isActivated"
                            checked={formData.isActivated ?? true}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                            Tài khoản đã được kích hoạt
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                        >
                            {user ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;

