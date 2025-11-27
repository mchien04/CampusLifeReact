import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
    const { username } = useAuth();

    const stats = [
        { name: 'Tổng sinh viên', value: '1,234', icon: '👥', color: 'bg-blue-500' },
        { name: 'Sự kiện hoạt động', value: '56', icon: '📅', color: 'bg-green-500' },
        { name: 'Năm học hiện tại', value: '2024-2025', icon: '📚', color: 'bg-yellow-500' },
        { name: 'Phòng ban', value: '12', icon: '🏢', color: 'bg-purple-500' },
    ];

    const quickActions = [
        { name: 'Quản lý sự kiện', href: '/manager/events', icon: '📅', description: 'Tạo và quản lý các sự kiện hoạt động' },
        { name: 'Chuỗi sự kiện', href: '/manager/series', icon: '📋', description: 'Tạo và quản lý chuỗi sự kiện' },
        { name: 'Mini Game', href: '/manager/minigames', icon: '🎮', description: 'Tạo và quản lý quiz minigame' },
        { name: 'Quản lý lớp học', href: '/admin/classes', icon: '🏫', description: 'Quản lý lớp học và sinh viên' },
        { name: 'Quản lý năm học', href: '/admin/academic-years', icon: '📚', description: 'Quản lý năm học và học kỳ' },
        { name: 'Quản lý phòng ban', href: '/admin/departments', icon: '🏢', description: 'Quản lý khoa và phòng ban' },
        { name: 'Quản lý sinh viên', href: '/admin/students', icon: '🎓', description: 'Quản lý thông tin sinh viên' },
        { name: 'Báo cáo thống kê', href: '/admin/reports', icon: '📈', description: 'Xem báo cáo và thống kê hệ thống' },
    ];

    return (
        <div>
            <div className="max-w-7xl mx-auto">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                                        <span className="text-2xl text-white">{stat.icon}</span>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {stat.name}
                                            </dt>
                                            <dd className="text-2xl font-bold text-gray-900">
                                                {stat.value}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Niên khóa
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            Quản lý
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                            Thao tác nhanh
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.name}
                                    to={action.href}
                                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                                >
                                    <div>
                                        <div className="flex items-center mb-3">
                                            <span className="text-3xl mr-3">{action.icon}</span>
                                            <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {action.name}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                                            {action.description}
                                        </p>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>


                {/* Recent Activity */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                            Hoạt động gần đây
                        </h3>
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {[
                                    { action: 'Tạo sự kiện mới', user: 'Manager A', time: '2 giờ trước', icon: '📅', color: 'bg-green-500' },
                                    { action: 'Cập nhật tiêu chí đánh giá', user: 'Admin', time: '4 giờ trước', icon: '📊', color: 'bg-purple-500' },
                                    { action: 'Tạo học kỳ mới', user: 'Admin', time: '6 giờ trước', icon: '📚', color: 'bg-yellow-500' },
                                    { action: 'Thêm phòng ban mới', user: 'Admin', time: '1 ngày trước', icon: '🏢', color: 'bg-blue-500' },
                                ].map((item, index) => (
                                    <li key={index}>
                                        <div className="relative pb-8">
                                            {index !== 3 && (
                                                <span
                                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className={`h-8 w-8 rounded-full ${item.color} flex items-center justify-center ring-8 ring-white`}>
                                                        <span className="text-white text-sm">{item.icon}</span>
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

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Thống kê nhanh
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Sự kiện đang diễn ra</span>
                                    <span className="text-lg font-semibold text-green-600">12</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Học kỳ đang mở</span>
                                    <span className="text-lg font-semibold text-yellow-600">2</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Sinh viên tham gia</span>
                                    <span className="text-lg font-semibold text-blue-600">1,234</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Hệ thống
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Trạng thái hệ thống</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Hoạt động bình thường
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Phiên bản</span>
                                    <span className="text-sm font-medium text-gray-900">v2.1.0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Cập nhật cuối</span>
                                    <span className="text-sm text-gray-500">2 ngày trước</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;