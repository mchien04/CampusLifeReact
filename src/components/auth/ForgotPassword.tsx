import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { ForgotPasswordRequest } from '../../types';
import { EnvelopeSimple, WarningCircle, CheckCircle, ArrowRight, PaperPlaneRight } from '@phosphor-icons/react';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans selection:bg-primary-900 selection:text-white relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/50 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 sm:p-10">
                    <div className="text-center mb-10">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center bg-primary-900 rounded-2xl shadow-lg mb-6 transform transition-transform hover:scale-105">
                            <span className="text-[#FFD66D] text-2xl font-black tracking-tighter">CL</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Quên mật khẩu?
                        </h2>
                        <p className="mt-3 text-base text-gray-500 font-medium">
                            Đừng lo, hãy nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Success Message */}
                        {success && (
                            <div className="rounded-xl bg-green-50/80 backdrop-blur-sm border border-green-200/60 p-5 flex gap-3 shadow-sm">
                                <CheckCircle weight="fill" className="text-green-500 w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-sm font-medium text-green-800 leading-relaxed">
                                    Nếu tài khoản với email này tồn tại, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 p-4 flex gap-3 shadow-sm animate-shake">
                                <WarningCircle weight="fill" className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                Địa chỉ Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeSimple weight="bold" className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/80 hover:bg-white focus:bg-white shadow-sm font-medium"
                                    placeholder="sinhvien@student.hcmute.edu.vn"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                    <span>Đang gửi...</span>
                                </>
                            ) : (
                                <>
                                    <span>Gửi yêu cầu</span>
                                    <PaperPlaneRight weight="bold" className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors"
                            >
                                <ArrowRight weight="bold" className="w-3.5 h-3.5 rotate-180" />
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

