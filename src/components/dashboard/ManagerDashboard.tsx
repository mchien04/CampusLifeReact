import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ManagerDashboard: React.FC = () => {
    const { username, logout } = useAuth();

    const stats = [
        { name: 'Sự kiện đã tạo', value: '23', icon: '📅' },
        { name: 'Sinh viên tham gia', value: '456', icon: '👥' },
        { name: 'Điểm đã nhập', value: '89', icon: '📊' },
        { name: 'Tin nhắn chờ', value: '5', icon: '💬' },
    ];

    const quickActions = [
        { name: 'Tạo sự kiện mới', href: '/manager/events/create', icon: '➕' },
        { name: 'Quản lý sự kiện', href: '/manager/events', icon: '📅' },
        { name: 'Nhập điểm rèn luyện', href: '/manager/scores', icon: '📝' },
        { name: 'Duyệt bài thu hoạch', href: '/manager/submissions', icon: '✅' },
        { name: 'Tin nhắn từ sinh viên', href: '/manager/messages', icon: '💬' },
        { name: 'Báo cáo hoạt động', href: '/manager/reports', icon: '📈' },
    ];

    const upcomingEvents = [
        {
            name: 'Hội thảo Khởi nghiệp',
            date: '15/01/2024',
            participants: 45,
            status: 'Đang diễn ra'
        },
        {
            name: 'Tình nguyện mùa đông',
            date: '20/01/2024',
            participants: 32,
            status: 'Sắp diễn ra'
        },
        {
            name: 'Workshop công nghệ',
            date: '25/01/2024',
            participants: 28,
            status: 'Đang đăng ký'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quick Actions */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Thao tác nhanh
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {quickActions.map((action) => (
                                    <a
                                        key={action.name}
                                        href={action.href}
                                        className="relative group bg-white p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                                    >
                                        <div>
                                            <span className="text-xl mb-2 block">{action.icon}</span>
                                            <div className="text-sm font-medium text-gray-900">
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

                    {/* Upcoming Events */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Sự kiện sắp tới
                            </h3>
                            <div className="space-y-4">
                                {upcomingEvents.map((event, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                                                <p className="text-sm text-gray-500">📅 {event.date}</p>
                                                <p className="text-sm text-gray-500">👥 {event.participants} người tham gia</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'Đang diễn ra'
                                                ? 'bg-green-100 text-green-800'
                                                : event.status === 'Sắp diễn ra'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Hoạt động gần đây
                        </h3>
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {[
                                    { action: 'Tạo sự kiện "Workshop AI"', time: '1 giờ trước', type: 'create' },
                                    { action: 'Duyệt bài thu hoạch của Nguyễn Văn A', time: '3 giờ trước', type: 'approve' },
                                    { action: 'Nhập điểm rèn luyện cho lớp CNTT1', time: '5 giờ trước', type: 'score' },
                                    { action: 'Trả lời tin nhắn từ sinh viên', time: '1 ngày trước', type: 'message' },
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
                                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${item.type === 'create' ? 'bg-green-500' :
                                                        item.type === 'approve' ? 'bg-blue-500' :
                                                            item.type === 'score' ? 'bg-yellow-500' : 'bg-purple-500'
                                                        }`}>
                                                        <span className="text-white text-sm">
                                                            {item.type === 'create' ? '➕' :
                                                                item.type === 'approve' ? '✅' :
                                                                    item.type === 'score' ? '📊' : '💬'}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
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

export default ManagerDashboard;
