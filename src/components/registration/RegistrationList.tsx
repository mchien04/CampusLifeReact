import React, { useState } from 'react';
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
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.indexOf(id) !== -1
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === registrations.length) {
            setSelectedIds([]); // bỏ chọn tất cả
        } else {
            setSelectedIds(registrations.map(r => r.id)); // chọn tất cả
        }
    };

    const handleBulkUpdate = (status: string) => {
        if (onUpdateStatus) {
            selectedIds.forEach(id => onUpdateStatus(id, status));
            setSelectedIds([]); // clear sau khi xử lý
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            {registrations.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">Chưa có đăng ký nào</p>
                </div>
            ) : (
                <>
                    {/* Checkbox chọn tất cả */}
                    {isAdmin && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedIds.length === registrations.length}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                                Chọn tất cả ({registrations.length})
                            </span>
                        </div>
                    )}

                    {/* Danh sách sinh viên */}
                    {registrations.map((registration) => (
                        <div
                            key={registration.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-4"
                        >
                            {isAdmin && registration.status === 'PENDING' && (
                                <input
                                    type="checkbox"
                                    checked={selectedIds.indexOf(registration.id) !== -1}
                                    onChange={() => toggleSelect(registration.id)}
                                    className="h-4 w-4 text-blue-600"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {registration.studentName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Mã SV: {registration.studentCode}
                                </p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                                    {getRegistrationStatusLabel(registration.status)}
                                </span>
                            </div>

                            {/* Individual Actions */}
                            {isAdmin && registration.status === 'PENDING' && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onUpdateStatus && onUpdateStatus(registration.id, 'APPROVED')}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                    >
                                        ✅ Duyệt
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus && onUpdateStatus(registration.id, 'REJECTED')}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                    >
                                        ❌ Từ chối
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Nút xử lý nhiều */}
                    {isAdmin && selectedIds.length > 0 && (
                        <div className="mt-4 flex space-x-2">
                            <button
                                onClick={() => handleBulkUpdate('APPROVED')}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                ✅ Duyệt {selectedIds.length}
                            </button>
                            <button
                                onClick={() => handleBulkUpdate('REJECTED')}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                ❌ Từ chối {selectedIds.length}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RegistrationList;
