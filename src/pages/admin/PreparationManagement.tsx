import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Toolbox,
    ListChecks,
    Receipt,
    CurrencyCircleDollar,
    FolderOpen,
    CalendarBlank,
    ArrowClockwise,
    Eye,
    ToggleLeft,
    ToggleRight,
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { eventAPI, preparationAPI } from '../../services';
import { ActivityResponse } from '../../types';

type ActivityStats = {
    enabled: boolean;
    pendingTasks: number;
    waitingExpenses: number;
    remainingAmount: string | null;
};

const formatEventDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const PreparationManagementSkeleton: React.FC = () => (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-gray-200/80" />
        <div className="h-12 rounded-2xl bg-gray-200/80" />
        <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
            <div className="h-12 bg-gray-100/80" />
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 border-t border-gray-100 px-6 py-5">
                    <div className="h-10 w-10 rounded-xl bg-gray-200/80 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 rounded bg-gray-200/80" />
                        <div className="h-3 w-72 rounded bg-gray-100/80" />
                    </div>
                    <div className="h-8 w-24 rounded-lg bg-gray-100/80" />
                </div>
            ))}
        </div>
    </div>
);

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

    const enabledCount = useMemo(
        () => activities.filter((a) => Boolean(statsByActivityId[a.id]?.enabled)).length,
        [activities, statsByActivityId]
    );

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
        if (activityIds.length === 0) return;
        try {
            setLoadingStats(true);
            const summaries = await preparationAPI.getSummary(activityIds);
            setStatsByActivityId((prev) => {
                const next = { ...prev };
                summaries.forEach((s) => {
                    next[s.activityId] = {
                        enabled: s.enabled,
                        pendingTasks: s.pendingTasks,
                        waitingExpenses: s.waitingExpenses,
                        remainingAmount: s.remainingAmount,
                    };
                });
                return next;
            });
        } catch (error) {
            console.error('Failed to fetch preparation summary', error);
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

    if (loading) {
        return <PreparationManagementSkeleton />;
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-12">
            <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                    }}
                />
                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                        Quản lý chuẩn bị
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                        Công tác chuẩn bị sự kiện
                    </h1>
                    <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed">
                        Quản lý nhiệm vụ, ngân sách và chi phí cho từng hoạt động trong hệ thống.
                    </p>
                    {activities.length > 0 && (
                        <p className="mt-4 text-xs font-medium text-primary-100/70 tabular-nums">
                            {activities.length} hoạt động · {enabledCount} đang bật chuẩn bị
                        </p>
                    )}
                </div>
            </header>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-premium">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm font-medium text-gray-700">Bộ lọc hiển thị</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setShowEnabledOnly(false)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
                                !showEnabledOnly
                                    ? 'bg-primary-900 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            Tất cả hoạt động
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEnabledOnly(true)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
                                showEnabledOnly
                                    ? 'bg-primary-900 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            Chỉ đang bật
                        </button>
                    </div>
                </div>
                {loadingStats && (
                    <p className="mt-3 text-xs text-gray-500">Đang tải thống kê…</p>
                )}
            </div>

            {visibleActivities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-premium">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-900">
                        <FolderOpen size={28} weight="duotone" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-primary-900">
                        {showEnabledOnly ? 'Chưa có hoạt động nào bật chuẩn bị' : 'Không có hoạt động nào'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                        {showEnabledOnly
                            ? 'Bật chuẩn bị cho hoạt động để quản lý nhiệm vụ, ngân sách và chi phí.'
                            : 'Hiện chưa có hoạt động nào trong hệ thống.'}
                    </p>
                    {showEnabledOnly && activities.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowEnabledOnly(false)}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                        >
                            <ArrowClockwise size={18} weight="bold" />
                            Xem tất cả hoạt động
                        </button>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                    <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_90px_110px_130px_auto] gap-4 border-b border-gray-100 bg-gray-50/80 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        <span>Hoạt động</span>
                        <span className="text-right tabular-nums">Nhiệm vụ</span>
                        <span className="text-right tabular-nums">Chi phí</span>
                        <span className="text-right tabular-nums">Còn lại</span>
                        <span className="text-right">Chuẩn bị</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {visibleActivities.map((a) => {
                            const s = statsByActivityId[a.id];
                            const enabled = Boolean(s?.enabled);

                            return (
                                <div
                                    key={a.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => navigate(`/manager/preparation/${a.id}`)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigate(`/manager/preparation/${a.id}`);
                                        }
                                    }}
                                    className="group cursor-pointer px-4 py-4 sm:px-6 transition-colors hover:bg-primary-50/30 lg:grid lg:grid-cols-[minmax(0,1fr)_90px_110px_130px_auto] lg:items-center lg:gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-900/20"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-900 text-white">
                                            <Toolbox size={20} weight="duotone" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-primary-900 line-clamp-1 group-hover:underline">
                                                {a.name}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                                                <CalendarBlank size={14} className="shrink-0 text-gray-400" />
                                                <span className="tabular-nums">
                                                    {formatEventDate(a.startDate)} – {formatEventDate(a.endDate)}
                                                </span>
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 lg:hidden">
                                                <span
                                                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${
                                                        enabled
                                                            ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                                                            : 'bg-gray-50 text-gray-600 ring-gray-200'
                                                    }`}
                                                >
                                                    {enabled ? 'Đang bật' : 'Đang tắt'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3 lg:mt-0 lg:justify-end">
                                        <span className="lg:hidden inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                                            <ListChecks size={14} />
                                            Nhiệm vụ chờ
                                        </span>
                                        <span className="text-sm font-semibold text-primary-900 tabular-nums">
                                            {enabled ? s?.pendingTasks ?? '–' : '–'}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:justify-end">
                                        <span className="lg:hidden inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                                            <Receipt size={14} />
                                            Chi phí chờ
                                        </span>
                                        <span className="text-sm font-semibold text-primary-900 tabular-nums">
                                            {enabled ? s?.waitingExpenses ?? '–' : '–'}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:justify-end">
                                        <span className="lg:hidden inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                                            <CurrencyCircleDollar size={14} />
                                            Còn lại
                                        </span>
                                        <span className="text-sm font-medium text-gray-700 tabular-nums truncate max-w-[130px]">
                                            {enabled ? s?.remainingAmount ?? '–' : '–'}
                                        </span>
                                    </div>

                                    <div
                                        className="mt-4 flex items-center gap-2 lg:mt-0 lg:justify-end"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/manager/preparation/${a.id}`)}
                                            title="Xem chi tiết"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-primary-900 transition-all hover:border-primary-900 hover:bg-primary-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggle(a, !enabled)}
                                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20 ${
                                                enabled
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {enabled ? (
                                                <ToggleRight size={18} weight="duotone" />
                                            ) : (
                                                <ToggleLeft size={18} weight="duotone" />
                                            )}
                                            {enabled ? 'Đang bật' : 'Đang tắt'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-3 text-xs text-gray-500 tabular-nums">
                        {visibleActivities.length} hoạt động
                        {showEnabledOnly ? ' (đang bật)' : ''}
                    </div>
                </div>
            )}
        </div>
    );
}
