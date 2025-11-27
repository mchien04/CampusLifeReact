import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from '../notification/NotificationDropdown';

interface StudentLayoutProps {
    children: React.ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
    const { username, logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Sự kiện',
            href: '/student/events',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            name: 'Chuỗi sự kiện',
            href: '/student/series',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            name: 'Mini Game',
            href: '/student/minigames',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
        },
        {
            name: 'Lịch sử tham gia',
            href: '/student/participation-history',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            name: 'Nhiệm vụ',
            href: '/student/tasks',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
        {
            name: 'Điểm số',
            href: '/student/scores',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            name: 'Hồ sơ',
            href: '/student/profile',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`bg-[#001C44] text-white transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'w-64' : 'w-20'
                } fixed h-screen z-30`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Brand */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-[#002A66]">
                        {sidebarOpen ? (
                            <h1 className="text-xl font-bold text-[#FFD66D]">CampusLife</h1>
                        ) : (
                            <h1 className="text-xl font-bold text-[#FFD66D]">CL</h1>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-white hover:text-[#FFD66D] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {sidebarOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-2">
                            {menuItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            to={item.href}
                                            className={`sidebar-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                active
                                                    ? 'bg-[#FFD66D] bg-opacity-20 text-[#FFD66D] border-l-4 border-[#FFD66D]'
                                                    : 'text-gray-300 hover:bg-[#002A66] hover:text-white border-l-4 border-transparent'
                                            }`}
                                        >
                                            <span className={`${sidebarOpen ? 'mr-3' : 'mx-auto'}`}>{item.icon}</span>
                                            {sidebarOpen && <span>{item.name}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User Info */}
                    <div className="border-t border-[#002A66] p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-[#FFD66D] flex items-center justify-center">
                                    <span className="text-[#001C44] font-semibold text-sm">
                                        {username?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            {sidebarOpen && (
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{username}</p>
                                    <p className="text-xs text-gray-400 truncate">Sinh viên</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-[#001C44]">
                                    {menuItems.find(item => isActive(item.href))?.name || 'Dashboard'}
                                </h2>
                            </div>
                            <div className="flex items-center space-x-4">
                                <NotificationDropdown />
                                <button
                                    onClick={logout}
                                    className="flex items-center space-x-2 px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Đăng xuất</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-auto">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <p>&copy; 2024 CampusLife. All rights reserved.</p>
                            <p className="text-[#001C44] font-medium">Hệ thống quản lý hoạt động sinh viên</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default StudentLayout;

