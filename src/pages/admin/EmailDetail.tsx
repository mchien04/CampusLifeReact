import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { emailAPI } from '../../services/emailAPI';
import {
    EmailHistoryResponse,
    EmailStatus,
    getRecipientTypeLabel,
    getEmailStatusLabel,
    getEmailStatusColor,
    getNotificationTypeLabel
} from '../../types/email';

const EmailDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [email, setEmail] = useState<EmailHistoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(false);
    const [downloadingAttachment, setDownloadingAttachment] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            loadEmailDetail(parseInt(id, 10));
        }
    }, [id]);

    const loadEmailDetail = async (emailId: number) => {
        setLoading(true);
        try {
            const response = await emailAPI.getEmailDetail(emailId);
            
            if (response.status && response.body) {
                setEmail(response.body);
            } else {
                toast.error(response.message || 'Không thể tải chi tiết email');
                navigate('/manager/emails/history');
            }
        } catch (error) {
            console.error('Error loading email detail:', error);
            toast.error('Có lỗi xảy ra khi tải chi tiết email');
            navigate('/manager/emails/history');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email || !window.confirm('Bạn có chắc chắn muốn gửi lại email này?')) {
            return;
        }

        setResending(true);
        try {
            const response = await emailAPI.resendEmail(email.id);
            
            if (response.status && response.body) {
                toast.success('Gửi lại email thành công!');
                setEmail(response.body);
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi gửi lại email');
            }
        } catch (error: any) {
            console.error('Error resending email:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi gửi lại email');
        } finally {
            setResending(false);
        }
    };

    const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
        setDownloadingAttachment(attachmentId);
        try {
            await emailAPI.downloadAttachment(attachmentId, fileName);
            toast.success('Tải file thành công!');
        } catch (error: any) {
            console.error('Error downloading attachment:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi tải file');
        } finally {
            setDownloadingAttachment(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (!email) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#001C44] mb-2">Không tìm thấy email</h2>
                    <p className="text-gray-600 mb-6">Email không tồn tại hoặc đã bị xóa</p>
                    <Link
                        to="/manager/emails/history"
                        className="px-6 py-3 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors inline-block"
                    >
                        Quay lại lịch sử
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <Link
                    to="/manager/emails/history"
                    className="text-[#001C44] hover:text-[#002A66] mb-4 inline-block"
                >
                    ← Quay lại lịch sử
                </Link>
                <h1 className="text-2xl font-bold text-[#001C44] mt-2">Chi tiết Email</h1>
            </div>

            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#001C44] to-[#002A66]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">{email.subject}</h2>
                            <p className="text-sm text-gray-200 mt-1">
                                Gửi lúc: {formatDate(email.sentAt)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEmailStatusColor(email.status)}`}>
                                {getEmailStatusLabel(email.status)}
                            </span>
                            {email.status === EmailStatus.FAILED && (
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {resending ? 'Đang gửi...' : 'Gửi lại'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người gửi</label>
                            <p className="text-gray-900">{email.senderName} (ID: {email.senderId})</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người nhận</label>
                            <p className="text-gray-900">{email.recipientEmail}</p>
                            {email.recipientId && (
                                <p className="text-sm text-gray-500">ID: {email.recipientId}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại người nhận</label>
                            <p className="text-gray-900">{getRecipientTypeLabel(email.recipientType)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng người nhận</label>
                            <p className="text-gray-900">{email.recipientCount}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Định dạng</label>
                            <p className="text-gray-900">{email.isHtml ? 'HTML' : 'Text'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thông báo</label>
                            <p className="text-gray-900">
                                {email.notificationCreated ? (
                                    <span className="text-green-600">✓ Đã tạo</span>
                                ) : (
                                    <span className="text-gray-500">Không tạo</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {email.errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-red-800 mb-1">Lỗi:</h3>
                            <p className="text-sm text-red-700">{email.errorMessage}</p>
                        </div>
                    )}

                    {/* Email Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung email</label>
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                            {email.isHtml ? (
                                <div
                                    dangerouslySetInnerHTML={{ __html: email.content }}
                                    className="prose max-w-none"
                                />
                            ) : (
                                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                                    {email.content}
                                </pre>
                            )}
                        </div>
                    </div>

                    {/* Attachments */}
                    {email.attachments && email.attachments.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File đính kèm ({email.attachments.length})
                            </label>
                            <div className="space-y-2">
                                {email.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="text-2xl">📎</div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(attachment.fileSize)} • {attachment.contentType}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                                            disabled={downloadingAttachment === attachment.id}
                                            className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors disabled:opacity-50 text-sm"
                                        >
                                            {downloadingAttachment === attachment.id ? 'Đang tải...' : 'Tải xuống'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailDetail;

