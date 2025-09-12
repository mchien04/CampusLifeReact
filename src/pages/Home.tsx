import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">CL</span>
                            </div>
                            <h1 className="ml-3 text-2xl font-bold text-gray-900">Campus Life</h1>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                to="/login"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                to="/register"
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Đăng ký
                            </Link>

                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
                <div className="text-center">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">Quản lý</span>
                        <span className="block text-primary-600">Đời sống sinh viên</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Hệ thống quản lý sự kiện và đánh giá điểm rèn luyện sinh viên toàn diện,
                        giúp kết nối và phát triển cộng đồng sinh viên.
                    </p>
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div className="rounded-md shadow">
                            <Link
                                to="/register"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                            >
                                Bắt đầu ngay
                            </Link>
                        </div>
                        <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-20">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Feature 1 */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quản lý sự kiện</h3>
                            <p className="text-gray-600">
                                Tạo, quản lý và tham gia các sự kiện, hoạt động sinh viên một cách dễ dàng và hiệu quả.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Điểm rèn luyện</h3>
                            <p className="text-gray-600">
                                Theo dõi và đánh giá điểm rèn luyện sinh viên theo các tiêu chí chuẩn của Bộ Giáo dục.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phân quyền người dùng</h3>
                            <p className="text-gray-600">
                                Hệ thống phân quyền rõ ràng cho Admin, Manager và Student với các chức năng phù hợp.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hỗ trợ chat</h3>
                            <p className="text-gray-600">
                                Tính năng chat trực tiếp giữa sinh viên và quản lý để giải đáp thắc mắc nhanh chóng.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Báo cáo thống kê</h3>
                            <p className="text-gray-600">
                                Xuất báo cáo Excel, thống kê chi tiết về hoạt động và kết quả rèn luyện sinh viên.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Giao diện thân thiện</h3>
                            <p className="text-gray-600">
                                Thiết kế hiện đại, responsive, dễ sử dụng trên mọi thiết bị từ desktop đến mobile.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-20 bg-primary-600 rounded-2xl p-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Sẵn sàng bắt đầu?
                    </h2>
                    <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                        Tham gia Campus Life ngay hôm nay để trải nghiệm hệ thống quản lý đời sống sinh viên hiện đại nhất.
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
                    >
                        Đăng ký miễn phí
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex justify-center items-center mb-4">
                            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">CL</span>
                            </div>
                            <span className="ml-2 text-xl font-bold text-white">Campus Life</span>
                        </div>
                        <p className="text-gray-400">
                            © 2024 Campus Life. Hệ thống quản lý đời sống sinh viên.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
