import React from 'react';
import { ActivityRegistrationResponse, getRegistrationStatusLabel } from '../../types/registration';

interface RegistrationListProps {
    registrations: ActivityRegistrationResponse[];
    onCancelRegistration?: (activityId: number) => void;
    onUpdateStatus?: (registrationId: number, status: string) => void;
    showActions?: boolean;
    isAdmin?: boolean;
}

const RegistrationList: React.FC<RegistrationListProps> = ({
    registrations,
    onCancelRegistration,
    onUpdateStatus,
    showActions = true,
    isAdmin = false
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const canCancel = (status: string) => {
        return status === 'PENDING' || status === 'APPROVED';
    };

    return (
        <div className="space-y-4">
            {registrations.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <p className="text-gray-500">Chưa có đăng ký nào</p>
                </div>
            ) : (
                registrations.map((registration) => (
                    <div key={registration.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {registration.activityName}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    {registration.activityDescription}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>📅 {registration.activityStartDate} - {registration.activityEndDate}</span>
                                    {registration.activityLocation && (
                                        <span>📍 {registration.activityLocation}</span>
                                    )}
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                                {getRegistrationStatusLabel(registration.status)}
                            </span>
                        </div>

                        {registration.feedback && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Lời nhắn:</span> {registration.feedback}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Đăng ký lúc: {new Date(registration.registeredDate).toLocaleString('vi-VN')}</span>
                            {isAdmin && (
                                <span>SV: {registration.studentName} ({registration.studentCode})</span>
                            )}
                        </div>

                        {showActions && (
                            <div className="mt-4 flex justify-end space-x-2">
                                {!isAdmin && canCancel(registration.status) && onCancelRegistration && (
                                    <button
                                        onClick={() => onCancelRegistration(registration.activityId)}
                                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                    >
                                        Hủy đăng ký
                                    </button>
                                )}
                                {isAdmin && onUpdateStatus && registration.status === 'PENDING' && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onUpdateStatus(registration.id, 'APPROVED')}
                                            className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            onClick={() => onUpdateStatus(registration.id, 'REJECTED')}
                                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default RegistrationList;
