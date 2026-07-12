import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequest } from '../../types';
import { EnvelopeSimple, LockKey, WarningCircle, CheckCircle, ArrowRight } from '@phosphor-icons/react';

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

    // Xử lý thông báo từ URL parameters
    useEffect(() => {
        const messageParam = searchParams.get('message');
        const errorParam = searchParams.get('error');
        const locationState = (window.history.state && window.history.state.usr) || {};

        if (locationState.message) {
            setSuccessMessage(locationState.message);
        } else if (messageParam) {
            setSuccessMessage(decodeURIComponent(messageParam));
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (errorParam) {
            setError(decodeURIComponent(errorParam));
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);
            let token = null;

            if ((response as any).body && (response as any).body.token) {
                token = (response as any).body.token;
            } else if (response.data && response.data.token) {
                token = response.data.token;
            } else if (response.data && typeof response.data === 'string') {
                token = response.data;
            } else if ((response as any).token) {
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
        <div className="min-h-screen flex bg-gray-50 font-sans selection:bg-primary-900 selection:text-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/50 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>

            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-32 z-10 w-full lg:w-[500px] xl:w-[600px] max-w-full mx-auto lg:mx-0 bg-white/60 backdrop-blur-3xl border-r border-white/50 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)]">
                <div className="mx-auto w-full max-w-sm lg:w-[400px]">
                    <div className="text-center lg:text-left mb-10">
                        <div className="inline-flex items-center justify-center h-16 w-16 bg-primary-900 rounded-2xl shadow-lg mb-8 transform transition-transform hover:scale-105">
                            <span className="text-[#FFD66D] text-2xl font-black tracking-tighter">CL</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Chào mừng trở lại
                        </h2>
                        <p className="mt-3 text-base text-gray-500 font-medium">
                            Đăng nhập để quản lý và tham gia các hoạt động tại Campus Life.
                        </p>
                    </div>

                    <div className="mt-8">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Success Message */}
                            {successMessage && (
                                <div className="rounded-xl bg-green-50/80 backdrop-blur-sm border border-green-200/60 p-4 flex gap-3 shadow-sm">
                                    <CheckCircle weight="fill" className="text-green-500 w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 p-4 flex gap-3 shadow-sm animate-shake">
                                    <WarningCircle weight="fill" className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                                        Tên đăng nhập
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <EnvelopeSimple weight="bold" className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            autoComplete="username"
                                            className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/80 hover:bg-white focus:bg-white shadow-sm font-medium"
                                            placeholder="Nhập tên đăng nhập"
                                            value={formData.username}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <LockKey weight="bold" className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/80 hover:bg-white focus:bg-white shadow-sm font-medium"
                                            placeholder="Nhập mật khẩu"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer transition-colors"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 font-medium cursor-pointer">
                                        Ghi nhớ đăng nhập
                                    </label>
                                </div>
                                
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                        <span>Đang đăng nhập...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Đăng nhập</span>
                                        <ArrowRight weight="bold" className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                        
                        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5">
                                <ArrowRight weight="bold" className="w-3.5 h-3.5 rotate-180" />
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Right side image area - Only visible on large screens */}
            <div className="hidden lg:block relative w-0 flex-1 bg-primary-900 overflow-hidden">
                <img 
                    src="/images/ute.jpg" 
                    alt="Campus" 
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 h-full w-full bg-primary-900/30 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/30 to-transparent"></div>
                
                <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-24 xl:px-32 text-white z-10">
                    <h1 className="text-4xl xl:text-5xl font-black tracking-tight mb-6 leading-tight">
                        Trải nghiệm <br/> <span className="text-[#FFD66D]">Cuộc sống Sinh viên</span> <br/> một cách trọn vẹn
                    </h1>
                    <p className="text-lg text-primary-100 max-w-xl font-medium leading-relaxed">
                        Nền tảng quản lý và tham gia các hoạt động, sự kiện dành riêng cho sinh viên Đại học.
                    </p>
        
                </div>
            </div>
        </div>
    );
};

export default Login;

