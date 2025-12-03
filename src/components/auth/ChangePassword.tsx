import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { ChangePasswordRequest } from '../../types/auth';
import LoadingSpinner from '../common/LoadingSpinner';

const ChangePassword: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ChangePasswordRequest>({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordRequest, string>>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof ChangePasswordRequest, string>> = {};

        if (!formData.oldPassword.trim()) {
            newErrors.oldPassword = 'Mật khẩu cũ không được để trống';
        }

        if (!formData.newPassword.trim()) {
            newErrors.newPassword = 'Mật khẩu mới không được để trống';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (formData.oldPassword === formData.newPassword && formData.newPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu cũ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await authAPI.changePassword(formData);
            
            if (response.status) {
                setSuccess(true);
                // Reset form
                setFormData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                // Redirect after 2 seconds
                setTimeout(() => {
                    navigate(-1); // Go back to previous page
                }, 2000);
            } else {
                setErrors({ oldPassword: response.message || 'Đổi mật khẩu thất bại' });
            }
        } catch (error: any) {
            console.error('Change password error:', error);
            const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
            setErrors({ oldPassword: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof ChangePasswordRequest]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-[#001C44]">
                        Đổi mật khẩu
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Vui lòng nhập mật khẩu cũ và mật khẩu mới
                    </p>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Đổi mật khẩu thành công! Đang chuyển hướng...</span>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        {/* Old Password */}
                        <div>
                            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu cũ
                            </label>
                            <input
                                id="oldPassword"
                                name="oldPassword"
                                type="password"
                                required
                                value={formData.oldPassword}
                                onChange={handleChange}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.oldPassword ? 'border-red-300' : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#001C44] focus:border-[#001C44] focus:z-10 sm:text-sm`}
                                placeholder="Nhập mật khẩu cũ"
                            />
                            {errors.oldPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>
                            )}
                        </div>

                        {/* New Password */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu mới
                            </label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                required
                                value={formData.newPassword}
                                onChange={handleChange}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#001C44] focus:border-[#001C44] focus:z-10 sm:text-sm`}
                                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            />
                            {errors.newPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#001C44] focus:border-[#001C44] focus:z-10 sm:text-sm`}
                                placeholder="Nhập lại mật khẩu mới"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44]"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#001C44] rounded-lg hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    <span className="ml-2">Đang xử lý...</span>
                                </>
                            ) : (
                                'Đổi mật khẩu'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;

