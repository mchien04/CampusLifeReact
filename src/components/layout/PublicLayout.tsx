import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import { ChatbotPageContext } from '../../services/chatbotAPI';

type PublicLayoutProps = {
    children: React.ReactNode;
    chatbotEnabled?: boolean;
    chatbotPageContext?: ChatbotPageContext;
    chatbotContextActivityId?: number | null;
    chatbotContextArticleSlug?: string | null;
};

const PublicLayout: React.FC<PublicLayoutProps> = ({
    children,
    chatbotEnabled = false,
    chatbotPageContext = 'GLOBAL',
    chatbotContextActivityId = null,
    chatbotContextArticleSlug = null,
}) => {
    const navigate = useNavigate();
    const { isAuthenticated, username, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#001C44] text-white flex items-center justify-center font-bold">
                                CL
                            </div>
                            <div className="font-bold text-[#001C44]">CampusLife</div>
                        </Link>

                        <nav className="flex items-center gap-2 sm:gap-3">
                            <Link
                                to="/articles"
                                className="px-3 py-2 rounded-lg text-sm font-semibold text-[#001C44] hover:bg-gray-100"
                            >
                                Bài viết
                            </Link>

                            {isAuthenticated ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/dashboard')}
                                        className="px-3 py-2 rounded-lg text-sm font-semibold text-[#001C44] hover:bg-gray-100"
                                    >
                                        Dashboard
                                    </button>
                                    <div className="hidden sm:block text-sm text-gray-600">
                                        {username}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logout();
                                            navigate('/login');
                                        }}
                                        className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#001C44] text-white hover:bg-[#002A66]"
                                    >
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-3 py-2 rounded-lg text-sm font-semibold text-[#001C44] hover:bg-gray-100"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#001C44] text-white hover:bg-[#002A66]"
                                    >
                                        Đăng ký
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-600 flex items-center justify-between">
                    <div>&copy; 2024 CampusLife</div>
                    <div className="text-[#001C44] font-medium">Hệ thống quản lý hoạt động sinh viên</div>
                </div>
            </footer>

            {chatbotEnabled && (
                <ChatbotWidget
                    pageContext={chatbotPageContext}
                    contextActivityId={chatbotContextActivityId}
                    contextArticleSlug={chatbotContextArticleSlug}
                />
            )}
        </div>
    );
};

export default PublicLayout;
