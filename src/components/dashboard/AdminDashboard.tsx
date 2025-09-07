import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
    const { username, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const adminFeatures = [
        {
            title: 'Quản lý Khoa/Phòng ban',
            description: 'Quản lý thông tin các khoa và phòng ban trong trường',
            icon: '🏢',
            link: '/admin/departments',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            title: 'Quản lý Niên khóa',
            description: 'Quản lý các năm học và thời gian hoạt động',
            icon: '📅',
            link: '/admin/academic-years',
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            title: 'Quản lý Học kỳ',
            description: 'Quản lý các học kỳ và trạng thái mở/đóng',
            icon: '📚',
            link: '/admin/academic-years',
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        {
            title: 'Quản lý Nhóm tiêu chí',
            description: 'Quản lý các nhóm tiêu chí đánh giá điểm rèn luyện',
            icon: '📋',
            link: '/admin/criteria-groups',
            color: 'bg-orange-500 hover:bg-orange-600'
        },
        {
            title: 'Quản lý Tiêu chí',
            description: 'Quản lý chi tiết các tiêu chí đánh giá',
            icon: '✅',
            link: '/admin/criteria-groups',
            color: 'bg-red-500 hover:bg-red-600'
        },
        {
            title: 'Quản lý Sự kiện',
            description: 'Quản lý các sự kiện và hoạt động',
            icon: '🎉',
            link: '/manager/events',
            color: 'bg-indigo-500 hover:bg-indigo-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Chào mừng, {username}! Quản lý hệ thống Campus Life
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/dashboard"
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                                ← Quay lại Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                        <span className="text-white text-sm">🏢</span>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Khoa/Phòng ban
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            Quản lý
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                        <span className="text-white text-sm">📅</span>
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
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                        <span className="text-white text-sm">📚</span>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Học kỳ
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            Quản lý
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                                        <span className="text-white text-sm">📋</span>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Tiêu chí
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            Quản lý
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminFeatures.map((feature, index) => (
                        <Link
                            key={index}
                            to={feature.link}
                            className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 text-3xl bg-gray-50 text-gray-600 group-hover:bg-gray-100">
                                    {feature.icon}
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    {feature.description}
                                </p>
                            </div>
                            <span
                                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                                aria-hidden="true"
                            >
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Hoạt động gần đây
                            </h3>
                            <div className="text-sm text-gray-500">
                                <p>Chưa có hoạt động nào gần đây.</p>
                                <p className="mt-2">Bắt đầu quản lý hệ thống bằng cách chọn một chức năng ở trên.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;