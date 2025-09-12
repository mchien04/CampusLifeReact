import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const VerifyAccount: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const token = searchParams.get('token');

    useEffect(() => {
        const verifyAccount = async () => {
            if (!token) {
                setError('Token xác thực không hợp lệ');
                setLoading(false);
                return;
            }

            try {
                const response = await authAPI.verifyAccount(token);
                if (response.status) {
                    setSuccess(true);
                    // Redirect to login page with success message after 3 seconds
                    setTimeout(() => {
                        navigate('/login?message=' + encodeURIComponent('Tài khoản đã được kích hoạt thành công! Vui lòng đăng nhập.'));
                    }, 3000);
                } else {
                    setError(response.message || 'Xác thực tài khoản thất bại');
                }
            } catch (error: any) {
                setError(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực tài khoản');
            } finally {
                setLoading(false);
            }
        };

        verifyAccount();
    }, [token, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <h2 className="text-2xl font-bold text-gray-900">Đang xác thực tài khoản...</h2>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center bg-green-100 rounded-full">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Xác thực thành công!
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Tài khoản của bạn đã được kích hoạt thành công.
                            <br />
                            Bây giờ bạn có thể đăng nhập vào hệ thống.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/login"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center bg-red-100 rounded-full">
                        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Xác thực thất bại
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {error}
                    </p>
                    <div className="mt-6 space-y-3">
                        <Link
                            to="/login"
                            className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Về trang đăng nhập
                        </Link>
                        <Link
                            to="/register"
                            className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Đăng ký lại
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyAccount;
