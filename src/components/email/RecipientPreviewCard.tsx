import React, { useState } from 'react';
import { RecipientType, getRecipientTypeLabel } from '../../types/email';
import { StudentResponse } from '../../types/student';

interface RecipientPreviewCardProps {
    recipientType: RecipientType;
    totalCount: number;
    previewList?: Array<{
        id: number;
        name: string;
        code?: string;
        email?: string;
    }>;
    onViewFull?: () => void;
    isLoading?: boolean;
}

const RecipientPreviewCard: React.FC<RecipientPreviewCardProps> = ({
    recipientType,
    totalCount,
    previewList = [],
    onViewFull,
    isLoading = false
}) => {
    const getBadgeColor = () => {
        switch (recipientType) {
            case RecipientType.INDIVIDUAL:
                return 'bg-blue-100 text-blue-800';
            case RecipientType.BULK:
                return 'bg-purple-100 text-purple-800';
            case RecipientType.CUSTOM_LIST:
                return 'bg-green-100 text-green-800';
            case RecipientType.ACTIVITY_REGISTRATIONS:
                return 'bg-orange-100 text-orange-800';
            case RecipientType.SERIES_REGISTRATIONS:
                return 'bg-pink-100 text-pink-800';
            case RecipientType.ALL_STUDENTS:
                return 'bg-indigo-100 text-indigo-800';
            case RecipientType.BY_CLASS:
                return 'bg-cyan-100 text-cyan-800';
            case RecipientType.BY_DEPARTMENT:
                return 'bg-teal-100 text-teal-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                        Không có người nhận nào được tìm thấy cho loại này.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor()}`}>
                        {getRecipientTypeLabel(recipientType)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                        {totalCount.toLocaleString('vi-VN')} người nhận
                    </span>
                </div>
                {onViewFull && previewList.length > 0 && (
                    <button
                        type="button"
                        onClick={onViewFull}
                        className="text-sm text-[#001C44] hover:text-[#002A66] font-medium"
                    >
                        Xem tất cả →
                    </button>
                )}
            </div>

            {previewList.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {previewList.slice(0, 10).map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {item.name}
                                    </span>
                                    {item.code && (
                                        <span className="text-xs text-gray-500">({item.code})</span>
                                    )}
                                </div>
                                {item.email && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.email}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {previewList.length > 10 && (
                        <div className="text-center pt-2">
                            <span className="text-xs text-gray-500">
                                và {previewList.length - 10} người khác...
                            </span>
                        </div>
                    )}
                </div>
            )}

            {previewList.length === 0 && totalCount > 0 && (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                        Đang tải danh sách người nhận...
                    </p>
                </div>
            )}
        </div>
    );
};

export default RecipientPreviewCard;

