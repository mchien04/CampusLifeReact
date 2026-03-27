import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventAPI, preparationAPI } from '../../services';
import { ActivityResponse } from '../../types';

type ActivityStats = {
    enabled: boolean;
    pendingTasks: number;
    waitingExpenses: number;
    remainingAmount: string | null;
};

export default function PreparationManagement() {
    const navigate = useNavigate();
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    const [statsByActivityId, setStatsByActivityId] = useState<Record<number, ActivityStats>>({});
    const [showEnabledOnly, setShowEnabledOnly] = useState(true);

    const visibleActivities = useMemo(() => {
        if (!showEnabledOnly) return activities;
        if (loadingStats && Object.keys(statsByActivityId).length === 0) return activities;
        return activities.filter((a) => Boolean(statsByActivityId[a.id]?.enabled));
    }, [activities, loadingStats, showEnabledOnly, statsByActivityId]);

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            const res = await eventAPI.getEvents();
            if (!res.status || !res.data) {
                setActivities([]);
                toast.error(res.message || 'Không thể tải danh sách hoạt động');
                return;
            }
            setActivities(res.data);
        } catch (e: any) {
            setActivities([]);
            toast.error(e?.message || 'Không thể tải danh sách hoạt động');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async (activityIds: number[]) => {
        try {
            setLoadingStats(true);
            const entries = await Promise.all(
                activityIds.map(async (activityId) => {
                    try {
                        const dash = await preparationAPI.getDashboard(activityId);
                        if (!dash?.hasPreparation) {
                            return [
                                activityId,
                                { enabled: false, pendingTasks: 0, waitingExpenses: 0, remainingAmount: null },
                            ] as const;
                        }

                        const pendingTasks = (dash.tasks || []).filter((t) => t.status === 'PENDING').length;
                        const waiting = await preparationAPI.listExpenses(activityId, 'PENDING_ADMIN');
                        const waitingExpenses = waiting.length;
                        const report = await preparationAPI.getFinancialReport(activityId).catch(() => null);
                        const remainingAmount = report
                            ? String(report.categories.reduce((acc, c) => acc + (Number(c.remainingAmount) || 0), 0))
                            : null;
                        return [activityId, { enabled: true, pendingTasks, waitingExpenses, remainingAmount }] as const;
                    } catch {
                        return [
                            activityId,
                            { enabled: false, pendingTasks: 0, waitingExpenses: 0, remainingAmount: null },
                        ] as const;
                    }
                })
            );

            setStatsByActivityId((prev) => {
                const next = { ...prev };
                for (const [id, s] of entries) next[id] = s;
                return next;
            });
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    useEffect(() => {
        if (activities.length === 0) {
            setStatsByActivityId({});
            return;
        }
        fetchStats(activities.map((a) => a.id));
    }, [activities, fetchStats]);

    const toggle = async (activity: ActivityResponse, enabled: boolean) => {
        try {
            await preparationAPI.togglePreparation(activity.id, enabled);
            toast.success(enabled ? 'Đã bật Preparation' : 'Đã tắt Preparation');
            setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, hasPreparation: enabled } : a)));
            await fetchStats([activity.id]);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái Preparation');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44] flex items-center">
                        <span className="mr-3 text-4xl">🧰</span>
                        Preparation Management
                    </h1>
                    <p className="mt-2 text-gray-600">Quản lý chuẩn bị sự kiện: nhiệm vụ, ngân sách và chi phí</p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Chỉ hiển thị đang bật</label>
                    <input
                        type="checkbox"
                        checked={showEnabledOnly}
                        onChange={(e) => setShowEnabledOnly(e.target.checked)}
                        className="h-4 w-4"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44]"></div>
                </div>
            ) : (
                <div className="card">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[#001C44]">Danh sách hoạt động</h2>
                            {loadingStats && <span className="text-xs text-gray-500">Đang tải thống kê...</span>}
                        </div>

                        {visibleActivities.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">Không có hoạt động nào.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Hoạt động
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Task PENDING
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Expense chờ duyệt
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Remaining
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Preparation
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {visibleActivities.map((a) => {
                                            const s = statsByActivityId[a.id];
                                            const enabled = Boolean(s?.enabled);
                                            return (
                                                <tr
                                                    key={a.id}
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => navigate(`/manager/preparation/${a.id}`)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(a.startDate).toLocaleString('vi-VN')} – {new Date(a.endDate).toLocaleString('vi-VN')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {enabled ? s?.pendingTasks ?? '-' : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {enabled ? s?.waitingExpenses ?? '-' : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {enabled ? s?.remainingAmount ?? '-' : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggle(a, !enabled)}
                                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${enabled
                                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {enabled ? 'Đang bật' : 'Đang tắt'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

