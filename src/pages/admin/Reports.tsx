import React from 'react';
import { Link } from 'react-router-dom';

const Reports: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Báo cáo thống kê</h1>
                            <p className="text-gray-600 mt-1">Xem báo cáo và thống kê hệ thống</p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Quay lại Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📈</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Trang đang phát triển</h3>
                    <p className="text-gray-600">Chức năng báo cáo thống kê sẽ được phát triển trong tương lai.</p>
                </div>
            </div>
        </div>
    );
};

export default Reports;
