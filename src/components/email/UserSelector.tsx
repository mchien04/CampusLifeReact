import React, { useEffect, useMemo, useState } from 'react';
import { UserResponse } from '../../types/auth';

export interface UserItem extends Partial<UserResponse> {
    id: number;
    fullName?: string;
    studentCode?: string;
}

interface UserSelectorProps {
    users: UserItem[];
    selectedIds: Set<number>;
    onToggle: (userId: number) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    searchKeyword: string;
    onSearchChange: (keyword: string) => void;
    onSearch: () => void;
    onLoadMore?: () => void;
    isLoading?: boolean;
    hasMore?: boolean;
    maxSelectable?: number;
    showCount?: boolean;
    roleFilter?: string;
    onRoleFilterChange?: (role: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({
    users,
    selectedIds,
    onToggle,
    onSelectAll,
    onDeselectAll,
    searchKeyword,
    onSearchChange,
    onSearch,
    onLoadMore,
    isLoading = false,
    hasMore = false,
    maxSelectable,
    showCount = true,
    roleFilter,
    onRoleFilterChange
}) => {
    const [debouncedKeyword, setDebouncedKeyword] = useState(searchKeyword);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(searchKeyword), 300);
        return () => clearTimeout(timer);
    }, [searchKeyword]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    const getInitials = (name?: string, fallback?: string) => {
        const target = name?.trim() || fallback || '';
        if (!target) return 'U';
        const parts = target.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return target.substring(0, 2).toUpperCase();
    };

    const filteredUsers = useMemo(() => {
        if (!debouncedKeyword) return users;
        const keyword = debouncedKeyword.toLowerCase();
        return users.filter((u) =>
            (u.fullName || '').toLowerCase().includes(keyword) ||
            (u.username || '').toLowerCase().includes(keyword) ||
            (u.email || '').toLowerCase().includes(keyword) ||
            (u.studentCode || '').toLowerCase().includes(keyword)
        );
    }, [users, debouncedKeyword]);

    const renderRoleBadge = (role?: string) => {
        if (!role) return null;
        const colorMap: Record<string, string> = {
            ADMIN: 'bg-red-100 text-red-700',
            MANAGER: 'bg-blue-100 text-blue-700',
            STUDENT: 'bg-green-100 text-green-700'
        };
        return (
            <span className={`px-2 py-0.5 text-[11px] rounded-full ${colorMap[role] || 'bg-gray-100 text-gray-700'}`}>
                {role}
            </span>
        );
    };

    return (
        <div className="space-y-3">
            {/* Search Bar & Role Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, username, mã hoặc email..."
                        value={searchKeyword}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                    />
                    {searchKeyword && (
                        <button
                            type="button"
                            onClick={() => {
                                onSearchChange('');
                                onSearch();
                            }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                {onRoleFilterChange && (
                    <select
                        value={roleFilter || 'ALL'}
                        onChange={(e) => onRoleFilterChange(e.target.value)}
                        className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent bg-white w-full sm:w-40"
                    >
                        <option value="ALL">Tất cả vai trò</option>
                        <option value="STUDENT">Sinh viên</option>
                        <option value="MANAGER">Quản lý</option>
                        <option value="ADMIN">Quản trị</option>
                    </select>
                )}
                <button
                    type="button"
                    onClick={onSearch}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    Tìm
                </button>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onSelectAll}
                        disabled={isLoading || filteredUsers.length === 0}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        Chọn tất cả
                    </button>
                    <button
                        type="button"
                        onClick={onDeselectAll}
                        disabled={isLoading || selectedIds.size === 0}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        Bỏ chọn tất cả
                    </button>
                </div>
                {showCount && (
                    <div className="text-sm text-gray-600">
                        <span className="font-medium text-[#001C44]">{selectedIds.size}</span>
                        {' / '}
                        <span>{filteredUsers.length}</span>
                        {maxSelectable && (
                            <span className="text-gray-500"> (tối đa {maxSelectable})</span>
                        )}
                    </div>
                )}
            </div>

            {/* User List */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {isLoading && users.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#001C44]"></div>
                        <p className="mt-2 text-sm text-gray-500">Đang tải danh sách...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Không tìm thấy người dùng nào</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {filteredUsers.map((user) => {
                            const isSelected = selectedIds.has(user.id);
                            const isDisabled = maxSelectable && !isSelected && selectedIds.size >= maxSelectable;
                            const displayName = user.fullName || user.username || user.email || `User #${user.id}`;
                            const secondary = [
                                user.username && `@${user.username}`,
                                user.email,
                                user.studentCode
                            ].filter(Boolean).join(' • ');

                            return (
                                <div
                                    key={user.id}
                                    onClick={() => !isDisabled && onToggle(user.id)}
                                    className={`
                                        p-3 border-b border-gray-100 cursor-pointer transition-all
                                        ${isSelected ? 'bg-[#001C44] bg-opacity-10' : 'hover:bg-gray-50'}
                                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <div className="flex items-center space-x-3">
                                        {/* Avatar */}
                                        <div className={`
                                            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                                            ${isSelected ? 'bg-[#001C44] text-white' : 'bg-gray-200 text-gray-700'}
                                        `}>
                                            {getInitials(user.fullName, user.username || user.email)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {displayName}
                                                </span>
                                                {renderRoleBadge(user.role)}
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-[#001C44]" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            {secondary && (
                                                <div className="flex items-center space-x-2 mt-0.5 text-xs text-gray-600 truncate">
                                                    <span>{secondary}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Checkbox */}
                                        <div className="flex-shrink-0">
                                            <div className={`
                                                w-5 h-5 rounded border-2 flex items-center justify-center
                                                ${isSelected 
                                                    ? 'bg-[#001C44] border-[#001C44]' 
                                                    : 'border-gray-300'
                                                }
                                            `}>
                                                {isSelected && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Load More Button */}
                {hasMore && onLoadMore && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <button
                            type="button"
                            onClick={onLoadMore}
                            disabled={isLoading}
                            className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Đang tải...' : 'Tải thêm'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSelector;

