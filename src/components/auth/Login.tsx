import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequest } from '../../types';

const Login: React.FC = () => {
    const [formData, setFormData] = useState<LoginRequest>({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Xử lý thông báo từ URL parameters (khi redirect từ email verification hoặc reset password)
    useEffect(() => {
        const messageParam = searchParams.get('message');
        const errorParam = searchParams.get('error');
        const locationState = (window.history.state && window.history.state.usr) || {};

        // Ưu tiên message từ location state (khi navigate với state)
        if (locationState.message) {
            setSuccessMessage(locationState.message);
        } else if (messageParam) {
            setSuccessMessage(decodeURIComponent(messageParam));
            // Xóa message parameter khỏi URL để tránh hiển thị lại
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (errorParam) {
            setError(decodeURIComponent(errorParam));
            // Xóa error parameter khỏi URL để tránh hiển thị lại
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);

            // Handle different response formats
            let token = null;

            // Check if token is in response.body.token (actual API format)
            if ((response as any).body && (response as any).body.token) {
                token = (response as any).body.token;
            }
            // Check if token is in response.data.token (our expected format)
            else if (response.data && response.data.token) {
                token = response.data.token;
            }
            // Check if token is directly in response.data (alternative format)
            else if (response.data && typeof response.data === 'string') {
                token = response.data;
            }
            // Check if token is in response (direct format) - type assertion for flexibility
            else if ((response as any).token) {
                token = (response as any).token;
            }

            if (token) {
                login(token);
                setTimeout(() => {
                    try {
                        navigate('/dashboard', { replace: true });
                    } catch (error) {
                        window.location.href = '/dashboard';
                    }
                }, 100);


            } else {
                setError(response.message || 'Đăng nhập thất bại - không tìm thấy token');
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center bg-[#001C44] rounded-lg">
                            <span className="text-[#FFD66D] text-2xl font-bold">CL</span>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Đăng nhập vào Campus Life
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Hoặc{' '}
                            <Link
                                to="/register"
                                className="font-medium text-[#001C44] hover:text-[#002A66]"
                            >
                                tạo tài khoản mới
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên đăng nhập
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] sm:text-sm transition-colors"
                                    placeholder="Nhập tên đăng nhập"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="off"
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] sm:text-sm transition-colors"
                                    placeholder="Nhập mật khẩu"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="rounded-md bg-green-50 border border-green-200 p-4">
                                <div className="text-sm text-green-800">{successMessage}</div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 p-4">
                                <div className="text-sm text-red-800">{error}</div>
                            </div>
                        )}

                        <div className="flex items-center justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-[#001C44] hover:text-[#002A66]"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#001C44] hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang đăng nhập...
                                    </div>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
