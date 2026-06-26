import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ActivityRegistrationResponse, getRegistrationStatusLabel } from '../../types/registration';

interface RegistrationListProps {
    registrations: ActivityRegistrationResponse[];
    onCancelRegistration?: (activityId: number) => void;
    onUpdateStatus?: (registrationId: number, status: string) => Promise<boolean | void> | boolean | void;
    onBulkUpdateStatus?: (
        registrationIds: number[],
        status: string
    ) => Promise<{ successCount: number; failedCount: number } | void> | { successCount: number; failedCount: number } | void;
    showActions?: boolean;
    isAdmin?: boolean;
}

const RegistrationList: React.FC<RegistrationListProps> = ({
    registrations,
    onCancelRegistration,
    onUpdateStatus,
    onBulkUpdateStatus,
    showActions = true,
    isAdmin = false
}) => {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    useEffect(() => {
        setSelectedIds([]);
    }, [registrations]);

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.indexOf(id) !== -1 ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const selectableIds = registrations
            .filter((r) => r.status !== 'ATTENDED')
            .map((r) => r.id);

        if (selectedIds.length === selectableIds.length && selectedIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(selectableIds);
        }
    };

    const handleBulkUpdate = async (status: string) => {
        if (selectedIds.length === 0) return;

        setIsBulkUpdating(true);

        try {
            if (onBulkUpdateStatus) {
                const result = await onBulkUpdateStatus(selectedIds, status);
                const successCount = result?.successCount ?? selectedIds.length;
                const failedCount = result?.failedCount ?? 0;

                if (failedCount > 0) {
                    toast.warn(`Da xu ly ${successCount}/${selectedIds.length} dang ky. ${failedCount} muc that bai.`);
                } else {
                    toast.success(`Da xu ly ${successCount} dang ky.`);
                }
            } else if (onUpdateStatus) {
                const results = await Promise.all(
                    selectedIds.map(async (id) => {
                        const result = await onUpdateStatus(id, status);
                        return result !== false;
                    })
                );
                const successCount = results.filter(Boolean).length;
                const failedCount = results.length - successCount;

                if (failedCount > 0) {
                    toast.warn(`Da xu ly ${successCount}/${results.length} dang ky. ${failedCount} muc that bai.`);
                } else {
                    toast.success(`Da xu ly ${successCount} dang ky.`);
                }
            }

            setSelectedIds([]);
        } finally {
            setIsBulkUpdating(false);
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
                    <p className="text-gray-500 text-lg">Chua co dang ky nao</p>
                </div>
            ) : (
                <>
                    {isAdmin && registrations.some((r) => r.status !== 'ATTENDED') && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#FFD66D] to-[#FFC947] p-4 rounded-lg border-2 border-[#FFD66D] shadow-sm">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === registrations.filter((r) => r.status !== 'ATTENDED').length && selectedIds.length > 0}
                                    onChange={toggleSelectAll}
                                    className="h-5 w-5 text-[#001C44] rounded focus:ring-2 focus:ring-[#001C44] cursor-pointer"
                                />
                                <span className="text-sm font-bold text-[#001C44]">
                                    Chon tat ca ({registrations.filter((r) => r.status !== 'ATTENDED').length} dang ky co the thao tac)
                                </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs font-semibold text-[#001C44]">
                                <span>PENDING: {registrations.filter((r) => r.status === 'PENDING').length}</span>
                                <span>APPROVED: {registrations.filter((r) => r.status === 'APPROVED').length}</span>
                                <span>REJECTED: {registrations.filter((r) => r.status === 'REJECTED').length}</span>
                                <span>CANCELLED: {registrations.filter((r) => r.status === 'CANCELLED').length}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {registrations.map((registration) => {
                            const attended = isAttended(registration.status);
                            const canAction = isAdmin && !attended;
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
                                                <span className="text-xl">?</span>
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
                                            Ma SV: <span className="font-semibold">{registration.studentCode}</span>
                                        </p>
                                        {registration.ticketCode && (
                                            <p className={`text-xs mt-1 ${attended ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Ma ve: <span className="font-mono font-semibold">{registration.ticketCode}</span>
                                            </p>
                                        )}
                                    </div>

                                    {attended ? (
                                        <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg border border-gray-200">
                                            Da hoan thanh
                                        </div>
                                    ) : canAction && (canApprove || canReject) ? (
                                        <div className="flex space-x-2">
                                            {canApprove && (
                                                <button
                                                    onClick={() => onUpdateStatus && onUpdateStatus(registration.id, 'APPROVED')}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm hover:shadow"
                                                >
                                                    Duyet
                                                </button>
                                            )}
                                            {canReject && (
                                                <button
                                                    onClick={() => onUpdateStatus && onUpdateStatus(registration.id, 'REJECTED')}
                                                    className="px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-100 border border-rose-200 transition-all shadow-sm hover:shadow"
                                                >
                                                    {registration.status === 'APPROVED' ? 'Huy duyet' : 'Tu choi'}
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    {isAdmin && selectedIds.length > 0 && (
                        <div className="mt-6 p-5 bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl flex items-center justify-between shadow-lg">
                            <div className="flex items-center space-x-4">
                                <span className="text-white font-bold text-lg">
                                    Da chon {selectedIds.length} dang ky
                                </span>
                                <div className="flex items-center space-x-2 text-sm text-gray-200">
                                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded">
                                        PENDING: {selectedIds.filter((id) => registrations.find((r) => r.id === id)?.status === 'PENDING').length}
                                    </span>
                                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded">
                                        APPROVED: {selectedIds.filter((id) => registrations.find((r) => r.id === id)?.status === 'APPROVED').length}
                                    </span>
                                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded">
                                        REJECTED: {selectedIds.filter((id) => registrations.find((r) => r.id === id)?.status === 'REJECTED').length}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => void handleBulkUpdate('APPROVED')}
                                    disabled={isBulkUpdating}
                                    className="px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 font-medium transition-all shadow-sm hover:shadow transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isBulkUpdating ? 'Dang xu ly...' : `Duyet ${selectedIds.length}`}
                                </button>
                                <button
                                    onClick={() => void handleBulkUpdate('REJECTED')}
                                    disabled={isBulkUpdating}
                                    className="px-6 py-2.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 font-medium transition-all shadow-sm hover:shadow transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isBulkUpdating ? 'Dang xu ly...' : `Tu choi ${selectedIds.length}`}
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    disabled={isBulkUpdating}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 border border-gray-300 font-medium transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Huy chon
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
