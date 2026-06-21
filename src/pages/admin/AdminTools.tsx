import React, { useState } from 'react';
import { systemAPI } from '../../services/adminAPI';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../../components/common';

const AdminTools: React.FC = () => {
    const [loadingOverdue, setLoadingOverdue] = useState(false);
    const [loadingCleanup, setLoadingCleanup] = useState(false);

    const handleTriggerOverdue = async () => {
        setLoadingOverdue(true);
        try {
            const res = await systemAPI.triggerCheckOverdue();
            if (res.status) {
                toast.success(res.message || 'Đã kích hoạt kiểm tra nhiệm vụ quá hạn thành công!');
            } else {
                toast.error(res.message || 'Kích hoạt kiểm tra thất bại.');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gọi API.');
        } finally {
            setLoadingOverdue(false);
        }
    };

    const handleCleanupOrphan = async () => {
        if (!window.confirm("Hành động này sẽ dọn dẹp các dữ liệu rác trong hệ thống. Bạn có chắc chắn muốn tiếp tục?")) {
            return;
        }

        setLoadingCleanup(true);
        try {
            const res = await systemAPI.cleanupOrphanData();
            if (res.status) {
                toast.success(res.message || 'Dọn dẹp dữ liệu thành công!');
            } else {
                toast.error(res.message || 'Dọn dẹp thất bại.');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gọi API.');
        } finally {
            setLoadingCleanup(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#001C44]">Công cụ hệ thống (Admin Tools)</h1>
                    <p className="text-gray-600 mt-1">Các tác vụ dọn dẹp và bảo trì hệ thống.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trigger Check Overdue */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Kiểm tra Tasks quá hạn</h3>
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                            Thực hiện quét toàn bộ nhiệm vụ của sinh viên. Nếu đã quá hạn nhưng chưa nộp bài, hệ thống sẽ tự động cập nhật trạng thái thành OVERDUE và áp dụng xử phạt.
                        </p>
                        <button
                            onClick={handleTriggerOverdue}
                            disabled={loadingOverdue}
                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {loadingOverdue ? <LoadingSpinner size="small" /> : 'Chạy ngay'}
                        </button>
                    </div>

                    {/* Cleanup Orphan Data */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Dọn dẹp dữ liệu rác</h3>
                            <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                            Dọn dẹp các tệp tin mồ côi, bản nháp không hợp lệ, hoặc dữ liệu rác phát sinh trong quá trình vận hành để giải phóng dung lượng.
                        </p>
                        <button
                            onClick={handleCleanupOrphan}
                            disabled={loadingCleanup}
                            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            {loadingCleanup ? <LoadingSpinner size="small" /> : 'Chạy dọn dẹp'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTools;
