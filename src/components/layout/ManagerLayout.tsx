import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { NotificationDropdown } from '../notification/NotificationDropdown';
import Submenu from './Submenu';

interface ManagerLayoutProps {
    children: React.ReactNode;
}

const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children }) => {
    const { username, logout, userRole } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(href);
    };

    const getPageTitle = () => {
        // Try to get title from current path
        const path = location.pathname;
        if (path.includes('/manager/events') || path.includes('/manager/events/create') || path.includes('/manager/events/')) {
            if (path.includes('/create')) return 'Tạo sự kiện';
            if (path.includes('/edit')) return 'Chỉnh sửa sự kiện';
            if (path.match(/\/manager\/events\/\d+/)) return 'Chi tiết sự kiện';
            return 'Quản lý sự kiện';
        }
        if (path.includes('/manager/series')) {
            if (path.includes('/create')) return 'Tạo chuỗi sự kiện';
            if (path.includes('/edit')) return 'Chỉnh sửa chuỗi sự kiện';
            if (path.match(/\/manager\/series\/\d+/)) return 'Chi tiết chuỗi sự kiện';
            return 'Chuỗi sự kiện';
        }
        if (path.includes('/manager/minigames')) {
            if (path.includes('/create')) return 'Tạo Mini Game';
            return 'Mini Game';
        }
        if (path.includes('/manager/registrations')) return 'Quản lý đăng ký';
        if (path.includes('/manager/scores')) return 'Quản lý điểm số';
        if (path.includes('/admin/classes')) return 'Quản lý lớp học';
        if (path.includes('/admin/departments')) return 'Quản lý phòng ban';
        if (path.includes('/admin/students')) return 'Quản lý sinh viên';
        if (path.includes('/admin/reports')) return 'Báo cáo thống kê';
        if (path.includes('/admin/academic-years')) return 'Quản lý năm học';
        if (path.includes('/admin/semesters')) return 'Quản lý học kỳ';
        return 'Dashboard';
    };

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
            name: 'Quản lý sự kiện',
            href: '/manager/events',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
    ];

    const specialActivitiesSubmenu = {
        title: 'Hoạt động đặc biệt',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
        ),
        items: [
            {
                name: 'Chuỗi sự kiện',
                href: '/manager/series',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                ),
            },
            {
                name: 'Mini Game',
                href: '/manager/minigames',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                ),
            },
        ],
    };

    const adminOnlyItems = [
        {
            name: 'Quản lý lớp học',
            href: '/admin/classes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
        {
            name: 'Quản lý phòng ban',
            href: '/admin/departments',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
        {
            name: 'Quản lý sinh viên',
            href: '/admin/students',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'Báo cáo thống kê',
            href: '/admin/reports',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
    ];

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

                            {/* Special Activities Submenu */}
                            <Submenu
                                title={specialActivitiesSubmenu.title}
                                icon={specialActivitiesSubmenu.icon}
                                items={specialActivitiesSubmenu.items}
                                sidebarOpen={sidebarOpen}
                            />

                            {/* Common Manager Items */}
                            <li>
                                <Link
                                    to="/manager/registrations"
                                    className={`sidebar-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive('/manager/registrations')
                                            ? 'bg-[#FFD66D] bg-opacity-20 text-[#FFD66D] border-l-4 border-[#FFD66D]'
                                            : 'text-gray-300 hover:bg-[#002A66] hover:text-white border-l-4 border-transparent'
                                    }`}
                                >
                                    <span className={`${sidebarOpen ? 'mr-3' : 'mx-auto'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </span>
                                    {sidebarOpen && <span>Quản lý đăng ký</span>}
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/manager/scores"
                                    className={`sidebar-link flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive('/manager/scores')
                                            ? 'bg-[#FFD66D] bg-opacity-20 text-[#FFD66D] border-l-4 border-[#FFD66D]'
                                            : 'text-gray-300 hover:bg-[#002A66] hover:text-white border-l-4 border-transparent'
                                    }`}
                                >
                                    <span className={`${sidebarOpen ? 'mr-3' : 'mx-auto'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </span>
                                    {sidebarOpen && <span>Quản lý điểm số</span>}
                                </Link>
                            </li>

                            {/* Admin Only Items */}
                            {userRole === Role.ADMIN && adminOnlyItems.map((item) => {
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
                                    <p className="text-xs text-gray-400 truncate">
                                        {userRole === Role.ADMIN ? 'Quản trị viên' : 'Quản lý'}
                                    </p>
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
                                    {getPageTitle()}
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

export default ManagerLayout;

