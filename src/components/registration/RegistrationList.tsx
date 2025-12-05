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
        // Chọn tất cả các registration có thể thao tác (không phải ATTENDED)
        const selectableIds = registrations
            .filter(r => r.status !== 'ATTENDED')
            .map(r => r.id);
        
        if (selectedIds.length === selectableIds.length && selectedIds.length > 0) {
            setSelectedIds([]); // bỏ chọn tất cả
        } else {
            setSelectedIds(selectableIds); // chọn tất cả có thể chọn
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
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'APPROVED': return 'bg-green-100 text-green-800 border-green-300';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'ATTENDED': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const isAttended = (status: string) => status === 'ATTENDED';

    return (
        <div className="space-y-4">
            {registrations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">Chưa có đăng ký nào</p>
                </div>
            ) : (
                <>
                    {/* Checkbox chọn tất cả - hiển thị nếu có registration có thể thao tác */}
                    {isAdmin && registrations.some(r => r.status !== 'ATTENDED') && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#FFD66D] to-[#FFC947] p-4 rounded-lg border-2 border-[#FFD66D] shadow-sm">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === registrations.filter(r => r.status !== 'ATTENDED').length && selectedIds.length > 0}
                                    onChange={toggleSelectAll}
                                    className="h-5 w-5 text-[#001C44] rounded focus:ring-2 focus:ring-[#001C44] cursor-pointer"
                                />
                                <span className="text-sm font-bold text-[#001C44]">
                                    Chọn tất cả ({registrations.filter(r => r.status !== 'ATTENDED').length} đăng ký có thể thao tác)
                                </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs font-semibold text-[#001C44]">
                                <span>PENDING: {registrations.filter(r => r.status === 'PENDING').length}</span>
                                <span>APPROVED: {registrations.filter(r => r.status === 'APPROVED').length}</span>
                                <span>REJECTED: {registrations.filter(r => r.status === 'REJECTED').length}</span>
                                <span>CANCELLED: {registrations.filter(r => r.status === 'CANCELLED').length}</span>
                            </div>
                        </div>
                    )}

                    {/* Danh sách sinh viên */}
                    <div className="space-y-3">
                        {registrations.map((registration) => {
                            const attended = isAttended(registration.status);
                            // Có thể thao tác nếu không phải ATTENDED
                            const canAction = isAdmin && !attended;
                            // Có thể chọn checkbox nếu là PENDING
                            const canSelect = isAdmin && registration.status === 'PENDING';
                            
                            // Xác định actions có sẵn dựa trên status
                            const canApprove = canAction && (registration.status === 'PENDING' || registration.status === 'REJECTED' || registration.status === 'CANCELLED');
                            const canReject = canAction && (registration.status === 'PENDING' || registration.status === 'APPROVED');
                            
                            return (
                                <div
                                    key={registration.id}
                                    className={`bg-white border-2 rounded-xl p-5 flex items-center space-x-4 transition-all ${
                                        attended 
                                            ? 'border-gray-300 bg-gray-50 opacity-75' 
                                            : 'border-gray-200 hover:border-[#001C44] hover:shadow-md'
                                    }`}
                                >
                                    {isAdmin && !attended && (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.indexOf(registration.id) !== -1}
                                            onChange={() => toggleSelect(registration.id)}
                                            className="h-5 w-5 text-[#001C44] rounded focus:ring-2 focus:ring-[#001C44] cursor-pointer"
                                        />
                                    )}
                                    {attended && (
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-xl">✓</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`text-lg font-bold ${attended ? 'text-gray-600' : 'text-[#001C44]'}`}>
                                                {registration.studentName}
                                            </h3>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(registration.status)}`}>
                                                {getRegistrationStatusLabel(registration.status)}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${attended ? 'text-gray-500' : 'text-gray-600'}`}>
                                            Mã SV: <span className="font-semibold">{registration.studentCode}</span>
                                        </p>
                                        {registration.ticketCode && (
                                            <p className={`text-xs mt-1 ${attended ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Mã vé: <span className="font-mono font-semibold">{registration.ticketCode}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Individual Actions - Hiển thị dựa trên status */}
                                    {attended ? (
                                        <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg border border-gray-200">
                                            Đã hoàn thành
                                        </div>
                                    ) : canAction && (canApprove || canReject) ? (
                                        <div className="flex space-x-2">
                                            {canApprove && (
                                                <button
                                                    onClick={() => onUpdateStatus && onUpdateStatus(registration.id, 'APPROVED')}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm hover:shadow"
                                                >
                                                    ✅ Duyệt
                                                </button>
                                            )}
                                            {canReject && (
                                                <button
                                                    onClick={() => onUpdateStatus && onUpdateStatus(registration.id, 'REJECTED')}
                                                    className="px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-100 border border-rose-200 transition-all shadow-sm hover:shadow"
                                                >
                                                    ❌ {registration.status === 'APPROVED' ? 'Hủy duyệt' : 'Từ chối'}
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    {/* Nút xử lý nhiều - hiển thị nếu có selection */}
                    {isAdmin && selectedIds.length > 0 && (
                        <div className="mt-6 p-5 bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-between shadow-lg">
                            <div className="flex items-center space-x-4">
                                <span className="text-white font-bold text-lg">
                                    Đã chọn {selectedIds.length} đăng ký
                                </span>
                                <div className="flex items-center space-x-2 text-sm text-gray-200">
                                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded">
                                        PENDING: {selectedIds.filter(id => registrations.find(r => r.id === id)?.status === 'PENDING').length}
                                    </span>
                                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded">
                                        APPROVED: {selectedIds.filter(id => registrations.find(r => r.id === id)?.status === 'APPROVED').length}
                                    </span>
                                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded">
                                        REJECTED: {selectedIds.filter(id => registrations.find(r => r.id === id)?.status === 'REJECTED').length}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleBulkUpdate('APPROVED')}
                                    className="px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 font-medium transition-all shadow-sm hover:shadow transform hover:scale-[1.02]"
                                >
                                    ✅ Duyệt {selectedIds.length}
                                </button>
                                <button
                                    onClick={() => handleBulkUpdate('REJECTED')}
                                    className="px-6 py-2.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 font-medium transition-all shadow-sm hover:shadow transform hover:scale-[1.02]"
                                >
                                    ❌ Từ chối {selectedIds.length}
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 border border-gray-300 font-medium transition-all shadow-sm hover:shadow"
                                >
                                    Hủy chọn
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RegistrationList;
