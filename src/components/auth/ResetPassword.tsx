import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { ResetPasswordRequest } from '../../types';

const ResetPassword: React.FC = () => {
    const [formData, setFormData] = useState<ResetPasswordRequest>({
        token: '',
        newPassword: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenFromUrl, setTokenFromUrl] = useState<string | null>(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Lấy token từ URL parameter
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setTokenFromUrl(token);
            setFormData(prev => ({ ...prev, token }));
        } else {
            setError('Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'newPassword') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }
        // Clear error when user starts typing
        if (error) setError('');
        if (success) setSuccess(false);
    };

    const validatePassword = (): boolean => {
        if (formData.newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        if (formData.newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        if (!validatePassword()) {
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.resetPassword(formData);
            
            if (response.status) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', { 
                        state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' }
                    });
                }, 3000);
            } else {
                setError(response.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!tokenFromUrl) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 flex items-center justify-center bg-[#001C44] rounded-lg">
                                <span className="text-[#FFD66D] text-2xl font-bold">CL</span>
                            </div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                                Token không hợp lệ
                            </h2>
                        </div>
                        <div className="rounded-md bg-red-50 border border-red-200 p-4">
                            <div className="text-sm text-red-800">{error}</div>
                        </div>
                        <div className="text-center">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-[#001C44] hover:text-[#002A66]"
                            >
                                Yêu cầu đặt lại mật khẩu mới
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center bg-[#001C44] rounded-lg">
                            <span className="text-[#FFD66D] text-2xl font-bold">CL</span>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Đặt lại mật khẩu
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Nhập mật khẩu mới của bạn
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu mới
                                </label>
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] sm:text-sm transition-colors"
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] sm:text-sm transition-colors"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="rounded-md bg-green-50 border border-green-200 p-4">
                                <div className="text-sm text-green-800">
                                    Đặt lại mật khẩu thành công! Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 p-4">
                                <div className="text-sm text-red-800">{error}</div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#001C44] hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    'Đặt lại mật khẩu'
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-sm font-medium text-[#001C44] hover:text-[#002A66]"
                            >
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

