import React, { useState, useEffect } from 'react';
import { UserResponse, CreateUserRequest, UpdateUserRequest, Role } from '../../types/auth';
import { Department } from '../../types/admin';
import { userAPI, departmentAPI } from '../../services/adminAPI';
import { 
    MagnifyingGlass, 
    PencilSimple, 
    Trash, 
    Plus, 
    CheckCircle, 
    XCircle, 
    UserFocus,
    ShieldCheck,
    X
} from '@phosphor-icons/react';

interface UserManagementProps {
    isNested?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ isNested = false }) => {
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
                {!isNested && (
                    <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center">
                            <span className="mr-3 text-4xl">👥</span>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Quản lý tài khoản</h1>
                                <p className="text-gray-200 text-lg">Quản lý tài khoản ADMIN và MANAGER trong hệ thống</p>
                            </div>
                        </div>
                    </div>
                )}
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
            {!isNested && (
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
            )}

            {/* Action button when nested */}
            {isNested && (
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setShowCreateModal(true);
                        }}
                        className="px-6 py-2.5 bg-[#001C44] text-white rounded-xl hover:bg-[#002A66] font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 active:scale-95"
                    >
                        <Plus weight="bold" className="w-5 h-5" />
                        Tạo tài khoản mới
                    </button>
                </div>
            )}

            <div>
                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                        {/* Search */}
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlass className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Theo username hoặc email..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò</label>
                            <div className="flex bg-gray-100/80 p-1 rounded-xl">
                                {['ALL', 'ADMIN', 'MANAGER'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setRoleFilter(role as any)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                            roleFilter === role
                                                ? 'bg-white text-[#001C44] shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                        }`}
                                    >
                                        {role === 'ALL' ? 'Tất cả' : role}
                                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                            {role === 'ALL' 
                                                ? users.length 
                                                : users.filter(u => u.role === role).length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                            <div className="flex bg-gray-100/80 p-1 rounded-xl">
                                {[
                                    { id: 'ALL', label: 'Tất cả', icon: null },
                                    { id: 'ACTIVATED', label: 'Hoạt động', icon: <CheckCircle className="w-4 h-4 text-green-500" weight="fill" /> },
                                    { id: 'DEACTIVATED', label: 'Đã khóa', icon: <XCircle className="w-4 h-4 text-red-500" weight="fill" /> }
                                ].map((status) => (
                                    <button
                                        key={status.id}
                                        onClick={() => setStatusFilter(status.id as any)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                            statusFilter === status.id
                                                ? 'bg-white text-[#001C44] shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                        }`}
                                    >
                                        {status.icon}
                                        {status.label}
                                        <span className="ml-1 text-xs text-gray-400">
                                            ({status.id === 'ALL' 
                                                ? users.length 
                                                : users.filter(u => status.id === 'ACTIVATED' ? u.isActivated : !u.isActivated).length})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUsers.length > 0 && (
                    <div className="bg-[#001C44] rounded-2xl shadow-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {selectedUsers.length}
                            </div>
                            <span className="text-white/90 font-medium text-sm">
                                tài khoản đang được chọn
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleBulkActivate}
                                className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 active:scale-95 transition-all duration-200 flex items-center gap-2"
                            >
                                <CheckCircle weight="bold" /> Kích hoạt
                            </button>
                            <button
                                onClick={handleBulkDeactivate}
                                className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 active:scale-95 transition-all duration-200 flex items-center gap-2"
                            >
                                <XCircle weight="bold" /> Khóa
                            </button>
                            <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-500/20 text-red-100 rounded-xl text-sm font-medium hover:bg-red-500/40 active:scale-95 transition-all duration-200 flex items-center gap-2 border border-red-500/30"
                            >
                                <Trash weight="bold" /> Xóa
                            </button>
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="px-4 py-2 text-white/60 hover:text-white text-sm font-medium transition-colors"
                            >
                                Bỏ chọn
                            </button>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44] transition-colors"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Vai trò
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Lần đăng nhập cuối
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-12 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <UserFocus className="w-10 h-10 text-gray-400" weight="light" />
                                                </div>
                                                <p className="text-gray-500 font-medium text-lg">Không tìm thấy tài khoản nào</p>
                                                <p className="text-gray-400 text-sm mt-1">Vui lòng điều chỉnh bộ lọc hoặc thêm tài khoản mới.</p>
                                            </div>
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
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setShowCreateModal(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-[#001C44] hover:bg-gray-100 rounded-lg transition-all"
                                                        title="Sửa"
                                                    >
                                                        <PencilSimple weight="bold" className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm({ show: true, userId: user.id, username: user.username })}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash weight="bold" className="w-4 h-4" />
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
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <Trash weight="bold" className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa tài khoản</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa tài khoản <strong className="text-gray-900">{deleteConfirm.username}</strong>?
                            <br />
                            <span className="text-sm text-gray-500 mt-2 block">Lưu ý: Đây là thao tác xóa mềm, tài khoản sẽ bị vô hiệu hóa và không còn hiển thị trong danh sách nhưng dữ liệu lịch sử vẫn được giữ lại.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, userId: null, username: '' })}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => deleteConfirm.userId && handleDelete(deleteConfirm.userId)}
                                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 active:scale-95 transition-all duration-200"
                            >
                                Xóa tài khoản
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-200 p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-[#001C44]">
                            {user ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {user ? 'Cập nhật thông tin và phân quyền' : 'Điền thông tin bên dưới để cấp tài khoản'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
                        <X weight="bold" className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
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
                            className="w-4 h-4 rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                            Tài khoản đã được kích hoạt
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-[#001C44] text-white font-medium rounded-xl hover:bg-[#002A66] active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <CheckCircle weight="bold" />
                            {user ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;

