import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface UserProfileMenuProps {
    sidebarOpen: boolean;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ sidebarOpen }) => {
    const { username, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Get email from token if available
    const getEmailFromToken = (): string | null => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
                const decoded = JSON.parse(jsonPayload);
                return decoded.email || null;
            }
        } catch (error) {
            console.error('Error decoding token for email:', error);
        }
        return null;
    };

    const email = getEmailFromToken();

    const getRoleLabel = (role: Role | null): string => {
        switch (role) {
            case Role.ADMIN:
                return 'Quản trị viên';
            case Role.MANAGER:
                return 'Quản lý';
            case Role.STUDENT:
                return 'Sinh viên';
            default:
                return '';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleChangePassword = () => {
        setIsOpen(false);
        navigate('/change-password');
    };

    const handleLogout = () => {
        setIsOpen(false);
        logout();
        navigate('/login');
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center p-2 rounded-lg hover:bg-[#002A66] transition-colors focus:outline-none"
            >
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#FFD66D] flex items-center justify-center">
                        <span className="text-[#001C44] font-semibold text-sm">
                            {username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>
                {sidebarOpen && (
                    <div className="ml-3 flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white truncate">{username}</p>
                        <p className="text-xs text-gray-400 truncate">
                            {getRoleLabel(userRole)}
                        </p>
                    </div>
                )}
                {sidebarOpen && (
                    <svg
                        className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-[#FFD66D] flex items-center justify-center flex-shrink-0">
                                <span className="text-[#001C44] font-semibold text-lg">
                                    {username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
                                {email && (
                                    <p className="text-xs text-gray-500 truncate">{email}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{getRoleLabel(userRole)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2">
                        <button
                            onClick={handleChangePassword}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span>Đổi mật khẩu</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                        >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileMenu;

