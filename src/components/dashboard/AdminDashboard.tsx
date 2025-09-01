import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
    const { username, logout } = useAuth();

    const stats = [
        { name: 'Tổng sinh viên', value: '1,234', icon: '👥' },
        { name: 'Sự kiện hoạt động', value: '56', icon: '📅' },
        { name: 'Phòng ban', value: '12', icon: '🏢' },
        { name: 'Tiêu chí đánh giá', value: '25', icon: '📊' },
    ];

    const quickActions = [
        { name: 'Quản lý người dùng', href: '/admin/users', icon: '👤' },
        { name: 'Quản lý sinh viên', href: '/admin/students', icon: '🎓' },
        { name: 'Quản lý phòng ban', href: '/admin/departments', icon: '🏢' },
        { name: 'Quản lý tiêu chí', href: '/admin/criteria', icon: '📋' },
        { name: 'Quản lý học kỳ', href: '/admin/semesters', icon: '📚' },
        { name: 'Báo cáo thống kê', href: '/admin/reports', icon: '📈' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600">Chào mừng, {username}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">{stat.icon}</span>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {stat.name}
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stat.value}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Thao tác nhanh
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {quickActions.map((action) => (
                                <a
                                    key={action.name}
                                    href={action.href}
                                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                                >
                                    <div>
                                        <span className="text-2xl mb-3 block">{action.icon}</span>
                                        <div className="text-lg font-medium text-gray-900">
                                            {action.name}
                                        </div>
                                    </div>
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Hoạt động gần đây
                        </h3>
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {[
                                    { action: 'Tạo sự kiện mới', user: 'Manager A', time: '2 giờ trước' },
                                    { action: 'Cập nhật điểm rèn luyện', user: 'Manager B', time: '4 giờ trước' },
                                    { action: 'Thêm sinh viên mới', user: 'Admin', time: '6 giờ trước' },
                                ].map((item, index) => (
                                    <li key={index}>
                                        <div className="relative pb-8">
                                            {index !== 2 && (
                                                <span
                                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                                                        <span className="text-white text-sm">📝</span>
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium text-gray-900">{item.user}</span>{' '}
                                                            {item.action}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                        {item.time}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
