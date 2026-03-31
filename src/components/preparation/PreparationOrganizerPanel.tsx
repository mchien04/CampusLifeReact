import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { preparationAPI, studentAPI } from '../../services';
import PreparationTaskDetailModal from './PreparationTaskDetailModal';
import {
    ActivityBudgetDto,
    MyPreparationTaskDto,
    PreparationDashboardDto,
    PreparationTaskStatus,
} from '../../types';

type TabKey = 'OVERVIEW' | 'MY_TASKS';

function parseOrganizerTab(value: string | null): TabKey {
    if (value === 'MY_TASKS') return 'MY_TASKS';
    return 'OVERVIEW';
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
    const n = Number(amount);
    if (Number.isFinite(n)) return currencyFormatter.format(n);
    return amount;
}

function taskStatusLabel(s: PreparationTaskStatus) {
    if (s === 'PENDING') return 'Chưa nhận';
    if (s === 'ACCEPTED') return 'Đang làm';
    if (s === 'COMPLETION_REQUESTED') return 'Chờ duyệt hoàn thành';
    return 'Hoàn thành';
}

function taskStatusPillClass(s: PreparationTaskStatus) {
    if (s === 'COMPLETED') return 'bg-green-50 text-green-700 border border-green-200';
    if (s === 'COMPLETION_REQUESTED') return 'bg-orange-50 text-orange-700 border border-orange-200';
    if (s === 'ACCEPTED') return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-gray-50 text-gray-700 border border-gray-200';
}

export const PreparationOrganizerPanel: React.FC<{ activityId: number }> = ({ activityId }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dashboard, setDashboard] = useState<PreparationDashboardDto | null>(null);
    const [loading, setLoading] = useState(true);
    const tab = parseOrganizerTab(searchParams.get('orgTab'));

    const [studentId, setStudentId] = useState<number | null>(null);
    const [budgetDetail, setBudgetDetail] = useState<ActivityBudgetDto | null>(null);
    const [loadingBudgetDetail, setLoadingBudgetDetail] = useState(false);
    const [myTasks, setMyTasks] = useState<MyPreparationTaskDto[]>([]);
    const [loadingMyTasks, setLoadingMyTasks] = useState(false);
    const [myTaskStatusFilter, setMyTaskStatusFilter] = useState<'ALL' | PreparationTaskStatus>('ALL');
    const [detailTaskId, setDetailTaskId] = useState<number | null>(null);

    const taskStats = useMemo(() => {
        const list = dashboard?.tasks ?? [];
        return {
            total: list.length,
            pending: list.filter((t) => t.status === 'PENDING').length,
            accepted: list.filter((t) => t.status === 'ACCEPTED').length,
            requested: list.filter((t) => t.status === 'COMPLETION_REQUESTED').length,
            completed: list.filter((t) => t.status === 'COMPLETED').length,
        };
    }, [dashboard?.tasks]);

    const budgetSummary = useMemo(() => {
        if (!budgetDetail) return null;
        const total = Number(budgetDetail.totalAmount);
        const used = (budgetDetail.categories ?? []).reduce((acc, c) => acc + (Number(c.usedAmount) || 0), 0);
        const remaining = (budgetDetail.categories ?? []).reduce((acc, c) => acc + (Number(c.remainingAmount) || 0), 0);
        const cashAvailable = (budgetDetail.categories ?? []).reduce((acc, c) => acc + (Number(c.cashAvailableAmount) || 0), 0);
        return {
            total: Number.isFinite(total) ? total : null,
            used,
            remaining,
            cashAvailable,
            categories: (budgetDetail.categories ?? []).length,
        };
    }, [budgetDetail]);

    const filteredMyTasks = useMemo(() => {
        return myTasks.filter((t) => myTaskStatusFilter === 'ALL' || t.status === myTaskStatusFilter);
    }, [myTaskStatusFilter, myTasks]);

    const setTab = useCallback(
        (nextTab: TabKey) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('orgTab', nextTab);
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            try {
                setLoading(true);
                const [dash, profile] = await Promise.all([
                    preparationAPI.getDashboard(activityId),
                    studentAPI.getMyProfile().catch(() => null),
                ]);
                if (!mounted) return;
                setDashboard(dash);
                setStudentId(profile?.id ?? null);
            } catch (e: any) {
                if (!mounted) return;
                setDashboard(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [activityId]);

    const loadBudgetDetail = useCallback(async () => {
        try {
            setLoadingBudgetDetail(true);
            const b = await preparationAPI.getActivityBudget(activityId);
            setBudgetDetail(b);
        } catch {
            setBudgetDetail(null);
        } finally {
            setLoadingBudgetDetail(false);
        }
    }, [activityId]);

    useEffect(() => {
        if (!dashboard?.hasPreparation) return;
        loadBudgetDetail();
    }, [dashboard?.hasPreparation, loadBudgetDetail]);

    const loadMyTasks = useCallback(async () => {
        try {
            setLoadingMyTasks(true);
            const list = await preparationAPI.getMyTasksByActivity(activityId);
            setMyTasks(list ?? []);
        } catch (e: any) {
            setMyTasks([]);
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tải danh sách nhiệm vụ của tôi');
        } finally {
            setLoadingMyTasks(false);
        }
    }, [activityId]);

    useEffect(() => {
        if (!dashboard?.hasPreparation) return;
        if (tab !== 'MY_TASKS') return;
        loadMyTasks();
    }, [dashboard?.hasPreparation, loadMyTasks, tab]);

    if (loading) {
        return (
            <div className="card">
                <div className="p-6 text-sm text-gray-500">Đang tải công tác chuẩn bị...</div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="card">
                <div className="p-6 text-sm text-gray-500">Không thể tải công tác chuẩn bị.</div>
            </div>
        );
    }

    if (!dashboard.hasPreparation) {
        return (
            <div className="card">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-[#001C44]">Chuẩn bị sự kiện</h3>
                    <p className="text-sm text-gray-600 mt-1">Bạn không thuộc BTC hoặc sự kiện chưa bật phần chuẩn bị.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-[#001C44]">Chuẩn bị sự kiện</h3>
                        <p className="text-sm text-gray-600 mt-1">Theo dõi nhiệm vụ và chi phí (dành cho BTC)</p>
                    </div>
                    <div />
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setTab('OVERVIEW')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'OVERVIEW'
                            ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        Tổng quan
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('MY_TASKS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'MY_TASKS'
                            ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        Nhiệm vụ của tôi
                    </button>
                </div>

                {tab === 'OVERVIEW' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                <div className="text-xs text-gray-500">Tổng nhiệm vụ</div>
                                <div className="text-2xl font-bold text-[#001C44] mt-1">{taskStats.total}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Chưa nhận: {taskStats.pending} · Đang làm: {taskStats.accepted}
                                </div>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                <div className="text-xs text-gray-500">Chờ duyệt</div>
                                <div className="text-2xl font-bold text-[#001C44] mt-1">{taskStats.requested}</div>
                                <div className="text-xs text-gray-500 mt-1">Yêu cầu hoàn thành</div>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                <div className="text-xs text-gray-500">Hoàn thành</div>
                                <div className="text-2xl font-bold text-[#001C44] mt-1">{taskStats.completed}</div>
                                <div className="text-xs text-gray-500 mt-1">Nhiệm vụ đã xong</div>
                            </div>
                            {budgetSummary && (
                                <div className="border border-gray-200 rounded-xl p-4 bg-white lg:col-span-1">
                                    <div className="text-xs text-gray-500 flex items-center justify-between">
                                        <span>Ngân sách</span>
                                        {loadingBudgetDetail && <span className="text-xs text-gray-400">Đang tải...</span>}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 mt-1">{formatMoney(String(budgetSummary.remaining))}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Còn lại · {budgetSummary.categories} ví · Tiền khả dụng {formatMoney(String(budgetSummary.cashAvailable))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {budgetDetail && budgetDetail.categories.length > 0 && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                                    <span>Chi tiết ví ngân sách</span>
                                    <span className="text-xs text-gray-500">{budgetDetail.categories.length} ví</span>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {budgetDetail.categories.slice(0, 4).map((c) => (
                                        <div key={c.id} className="p-4 bg-white">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Khả dụng: {formatMoney(c.cashAvailableAmount)} · Còn lại: {formatMoney(c.remainingAmount)}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <div className="text-sm font-semibold text-[#001C44]">{formatMoney(c.allocatedAmount)}</div>
                                                    <div className="text-xs text-gray-500">Tổng ví</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {budgetDetail.categories.length > 4 && (
                                    <div className="p-4 bg-white text-sm text-gray-500">Mở chi tiết task tài chính để xem luồng chi phí theo task.</div>
                                )}
                            </div>
                        )}

                        {dashboard.tasks.length === 0 ? (
                            <div className="text-sm text-gray-500">Chưa có nhiệm vụ chuẩn bị.</div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                                    <span>Danh sách nhiệm vụ</span>
                                    <span className="text-xs text-gray-500">{dashboard.tasks.length} nhiệm vụ</span>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {dashboard.tasks.slice(0, 8).map((t) => (
                                        <div key={t.id} className="p-4 bg-white">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${taskStatusPillClass(t.status)}`}>
                                                            {taskStatusLabel(t.status)}
                                                        </span>
                                                        {t.isFinancial && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                                                                Tài chính
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                        <span>{t.ownerName ? `Trưởng nhóm: ${t.ownerName}` : `Trưởng nhóm: #${t.ownerId}`}</span>
                                                        {t.deadline && <span>Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</span>}
                                                    </div>
                                                    {t.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{t.description}</p>}
                                                </div>
                                                {t.isFinancial && (
                                                    <div className="shrink-0 text-right">
                                                        <div className="text-xs text-gray-500">Cấp phát</div>
                                                        <div className="text-sm font-semibold text-[#001C44]">{formatMoney(t.allocatedAmount)}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {dashboard.tasks.length > 8 && (
                                    <div className="p-4 bg-white text-sm text-gray-500">
                                        Xem chi tiết và thao tác trong tab Nhiệm vụ của tôi.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'MY_TASKS' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <label htmlFor="prep-org-my-tasks-filter" className="text-sm font-medium text-gray-700">Trạng thái</label>
                                <select
                                    id="prep-org-my-tasks-filter"
                                    name="prepOrgMyTasksFilter"
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                    value={myTaskStatusFilter}
                                    onChange={(e) => setMyTaskStatusFilter(e.target.value as 'ALL' | PreparationTaskStatus)}
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value="PENDING">Chưa nhận</option>
                                    <option value="ACCEPTED">Đang làm</option>
                                    <option value="COMPLETION_REQUESTED">Chờ duyệt hoàn thành</option>
                                    <option value="COMPLETED">Hoàn thành</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => loadMyTasks()}
                                className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loadingMyTasks}
                            >
                                {loadingMyTasks ? 'Đang tải...' : 'Tải lại'}
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                                <span>Nhiệm vụ của tôi</span>
                                <span className="text-xs text-gray-500">{filteredMyTasks.length} nhiệm vụ</span>
                            </div>
                            {loadingMyTasks ? (
                                <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                            ) : filteredMyTasks.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">Không có nhiệm vụ phù hợp.</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredMyTasks.map((t) => {
                                        const roleClass =
                                            t.myRole === 'LEADER'
                                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                : 'bg-gray-50 text-gray-700 border border-gray-200';
                                        return (
                                            <div
                                                key={t.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setDetailTaskId(t.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') setDetailTaskId(t.id);
                                                }}
                                                className="p-4 bg-white hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-[#001C44]"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${taskStatusPillClass(
                                                                    t.status
                                                                )}`}
                                                            >
                                                                {taskStatusLabel(t.status)}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${roleClass}`}>
                                                                {t.myRole}
                                                            </span>
                                                            {t.isFinancial && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                                                                    Tài chính
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                            <span>
                                                                {t.ownerName ? `Trưởng nhóm: ${t.ownerName}` : `Trưởng nhóm: #${t.ownerId}`}
                                                            </span>
                                                            {t.deadline && <span>Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</span>}
                                                            {t.isFinancial && <span>Cấp phát: {formatMoney(t.allocatedAmount)}</span>}
                                                        </div>
                                                        {t.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{t.description}</p>}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDetailTaskId(t.id);
                                                            }}
                                                            className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-white"
                                                        >
                                                            Xem
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            <PreparationTaskDetailModal
                open={detailTaskId != null}
                taskId={detailTaskId}
                studentId={studentId}
                activityId={activityId}
                onClose={() => setDetailTaskId(null)}
                onTaskUpdated={(updated) => {
                    setDashboard((prev) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
                        };
                    });
                }}
            />
        </div>
    );
};
