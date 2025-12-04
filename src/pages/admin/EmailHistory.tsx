import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { emailAPI } from '../../services/emailAPI';
import {
    EmailHistoryResponse,
    EmailStatus,
    getRecipientTypeLabel,
    getEmailStatusLabel,
    getEmailStatusColor
} from '../../types/email';

const EmailHistory: React.FC = () => {
    const navigate = useNavigate();
    const [emails, setEmails] = useState<EmailHistoryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [statusFilter, setStatusFilter] = useState<EmailStatus | 'ALL'>('ALL');
    const [resendingId, setResendingId] = useState<number | null>(null);

    useEffect(() => {
        loadEmailHistory();
    }, [page, statusFilter]);

    const loadEmailHistory = async () => {
        setLoading(true);
        try {
            const response = await emailAPI.getEmailHistory(page, 20);
            
            if (response.status && response.body) {
                let filteredEmails = response.body.content || [];
                
                // Filter by status if needed
                if (statusFilter !== 'ALL') {
                    filteredEmails = filteredEmails.filter(email => email.status === statusFilter);
                }
                
                setEmails(filteredEmails);
                setTotalPages(response.body.totalPages || 0);
                setTotalElements(response.body.totalElements || 0);
            } else {
                toast.error(response.message || 'Không thể tải lịch sử email');
            }
        } catch (error) {
            console.error('Error loading email history:', error);
            toast.error('Có lỗi xảy ra khi tải lịch sử email');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (emailId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn gửi lại email này?')) {
            return;
        }

        setResendingId(emailId);
        try {
            const response = await emailAPI.resendEmail(emailId);
            
            if (response.status) {
                toast.success('Gửi lại email thành công!');
                loadEmailHistory();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi gửi lại email');
            }
        } catch (error: any) {
            console.error('Error resending email:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi gửi lại email');
        } finally {
            setResendingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && emails.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#001C44]">Lịch sử Email</h1>
                    <p className="text-gray-600 mt-1">Xem lịch sử các email đã gửi</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        to="/manager/emails/send"
                        className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                    >
                        Gửi Email
                    </Link>
                    <Link
                        to="/manager/emails/notifications/send"
                        className="px-4 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFE082] transition-colors"
                    >
                        Gửi Thông báo
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === 'ALL'
                                ? 'bg-[#001C44] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Tất cả
                    </button>
                    {Object.values(EmailStatus).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                statusFilter === status
                                    ? 'bg-[#001C44] text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {getEmailStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-[#001C44] to-[#002A66]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Người gửi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Người nhận
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Tiêu đề
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Loại
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Thời gian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {emails.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        Không có email nào
                                    </td>
                                </tr>
                            ) : (
                                emails.map((email) => (
                                    <tr key={email.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {email.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {email.senderName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div>
                                                <div>{email.recipientEmail}</div>
                                                {email.recipientCount > 1 && (
                                                    <div className="text-xs text-gray-500">
                                                        ({email.recipientCount} người nhận)
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                            {email.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getRecipientTypeLabel(email.recipientType)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEmailStatusColor(email.status)}`}>
                                                {getEmailStatusLabel(email.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(email.sentAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Link
                                                to={`/manager/emails/history/${email.id}`}
                                                className="text-[#001C44] hover:text-[#002A66]"
                                            >
                                                Xem
                                            </Link>
                                            {email.status === EmailStatus.FAILED && (
                                                <button
                                                    onClick={() => handleResend(email.id)}
                                                    disabled={resendingId === email.id}
                                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                                >
                                                    {resendingId === email.id ? 'Đang gửi...' : 'Gửi lại'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Trang {page + 1} / {totalPages} ({totalElements} email)
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailHistory;

