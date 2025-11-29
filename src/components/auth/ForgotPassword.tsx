import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { ForgotPasswordRequest } from '../../types';

const ForgotPassword: React.FC = () => {
    const [formData, setFormData] = useState<ForgotPasswordRequest>({
        email: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (error) setError('');
        if (success) setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await authAPI.forgotPassword(formData);
            
            if (response.status) {
                setSuccess(true);
            } else {
                setError(response.message || 'Có lỗi xảy ra khi gửi yêu cầu');
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
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
                            Quên mật khẩu
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Nhập email của bạn để nhận link đặt lại mật khẩu
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] sm:text-sm transition-colors"
                                placeholder="Nhập địa chỉ email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="rounded-md bg-green-50 border border-green-200 p-4">
                                <div className="text-sm text-green-800">
                                    Nếu tài khoản với email này tồn tại, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. 
                                    Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
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
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#001C44] hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang gửi...
                                    </div>
                                ) : (
                                    'Gửi yêu cầu'
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

export default ForgotPassword;

