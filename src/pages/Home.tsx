import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-[#001C44] to-[#002A66] shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md border border-white/30">
                                <span className="text-white font-bold text-xl">CL</span>
                            </div>
                            <h1 className="ml-3 text-2xl font-bold text-white">Campus Life</h1>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                to="/login"
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-lg text-sm font-medium transition-all border border-white/30 shadow-md hover:shadow-lg"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Text Content */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl" style={{ lineHeight: '1.1' }}>
                            <span className="block mb-2">Quản lý</span>
                            <span className="block bg-gradient-to-r from-[#001C44] to-[#002A66] bg-clip-text text-transparent" style={{ lineHeight: '1.3', paddingBottom: '0.75rem', display: 'block' }}>Đời sống sinh viên</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto lg:mx-0 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl">
                            Hệ thống quản lý sự kiện và đánh giá điểm rèn luyện sinh viên toàn diện,
                            giúp kết nối và phát triển cộng đồng sinh viên.
                        </p>
                        <div className="mt-5 max-w-md mx-auto lg:mx-0 sm:flex sm:justify-center lg:justify-start md:mt-8">
                            <div className="rounded-md shadow-lg">
                                <Link
                                    to="/login"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-[#001C44] to-[#002A66] hover:from-[#002A66] hover:to-[#003A88] md:py-4 md:text-lg md:px-10 transition-all shadow-md hover:shadow-xl"
                                >
                                    Đăng nhập
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right: Image */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="w-full max-w-3xl">
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                                <img
                                    src="/images/campus-life.jpg"
                                    alt="Campus Life"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-20">
                    <h2 className="text-3xl font-bold text-right text-gray-900 mb-12 pr-12">
                        Tính năng nổi bật
                    </h2>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Row 1: 3 cards */}
                        {/* Feature 1 - Quản lý sự kiện */}
                        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mb-4 shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quản lý sự kiện</h3>
                            <p className="text-gray-600">
                                Tạo, quản lý và tham gia các sự kiện, hoạt động sinh viên một cách dễ dàng và hiệu quả.
                            </p>
                        </div>

                        {/* Feature 2 - Điểm rèn luyện */}
                        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mb-4 shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Điểm rèn luyện</h3>
                            <p className="text-gray-600">
                                Theo dõi và đánh giá điểm rèn luyện sinh viên.
                            </p>
                        </div>

                        {/* Feature 3 - Phân quyền người dùng */}
                        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mb-4 shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phân quyền người dùng</h3>
                            <p className="text-gray-600">
                                Hệ thống phân quyền rõ ràng cho Admin, Manager và Student với các chức năng phù hợp.
                            </p>
                        </div>

                        {/* Row 2: 2 cards (card cuối span 2 cột) */}
                        {/* Feature 4 - Báo cáo thống kê */}
                        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mb-4 shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Báo cáo thống kê</h3>
                            <p className="text-gray-600">
                                Xuất báo cáo Excel, thống kê chi tiết về hoạt động và kết quả rèn luyện sinh viên.
                            </p>
                        </div>

                        {/* Feature 5 - Giao diện thân thiện (span 2 columns) */}
                        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100 sm:col-span-2 lg:col-span-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mb-4 shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </main>

            {/* Footer */}
            <footer className="bg-gray-800">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex justify-center items-center mb-4">
                            <div className="h-8 w-8 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center shadow-md">
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
