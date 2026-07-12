import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ListChecks,
  Hourglass,
  CheckCircle,
  Wallet,
  CurrencyCircleDollar,
  ArrowClockwise,
  Eye,
  SpinnerGap,
  FolderOpen,
  Funnel,
} from '@phosphor-icons/react';
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
  if (s === 'COMPLETED') return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80';
  if (s === 'COMPLETION_REQUESTED') return 'bg-amber-50 text-amber-800 ring-amber-200/80';
  if (s === 'ACCEPTED') return 'bg-blue-50 text-blue-800 ring-blue-200/80';
  return 'bg-gray-50 text-gray-700 ring-gray-200';
}

const OrganizerPanelSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-premium p-6 animate-pulse space-y-4">
    <div className="h-8 w-48 rounded-lg bg-gray-200/80" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-gray-100/80" />
      ))}
    </div>
    <div className="h-64 rounded-xl bg-gray-100/80" />
  </div>
);

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

  const tabBtn = (active: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
      active ? 'bg-primary-900 text-white shadow-sm' : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
    }`;

  if (loading) {
    return <OrganizerPanelSkeleton />;
  }

  if (!dashboard) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-premium">
        <p className="text-sm text-gray-500">Không thể tải công tác chuẩn bị.</p>
      </div>
    );
  }

  if (!dashboard.hasPreparation) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-premium">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-900">
          <FolderOpen size={28} weight="duotone" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-primary-900">Chuẩn bị sự kiện</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Bạn không thuộc ban tổ chức hoặc sự kiện chưa bật phần chuẩn bị.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-premium">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Ban tổ chức</p>
            <h3 className="text-lg font-semibold tracking-tight text-primary-900 mt-0.5">Chuẩn bị sự kiện</h3>
            <p className="text-sm text-gray-500 mt-1">Theo dõi nhiệm vụ và chi phí</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setTab('OVERVIEW')} className={tabBtn(tab === 'OVERVIEW')}>
              Tổng quan
            </button>
            <button type="button" onClick={() => setTab('MY_TASKS')} className={tabBtn(tab === 'MY_TASKS')}>
              Nhiệm vụ của tôi
            </button>
          </div>
        </div>

        {tab === 'OVERVIEW' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 ring-1 ring-gray-100">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <ListChecks size={14} weight="duotone" />
                  Tổng nhiệm vụ
                </div>
                <div className="text-2xl font-bold text-primary-900 mt-2 tabular-nums">{taskStats.total}</div>
                <div className="text-xs text-gray-500 mt-1 tabular-nums">
                  Chưa nhận: {taskStats.pending} · Đang làm: {taskStats.accepted}
                </div>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 ring-1 ring-amber-100">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  <Hourglass size={14} weight="duotone" />
                  Chờ duyệt
                </div>
                <div className="text-2xl font-bold text-primary-900 mt-2 tabular-nums">{taskStats.requested}</div>
                <div className="text-xs text-gray-500 mt-1">Yêu cầu hoàn thành</div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 ring-1 ring-emerald-100">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  <CheckCircle size={14} weight="duotone" />
                  Hoàn thành
                </div>
                <div className="text-2xl font-bold text-primary-900 mt-2 tabular-nums">{taskStats.completed}</div>
                <div className="text-xs text-gray-500 mt-1">Nhiệm vụ đã xong</div>
              </div>
              {budgetSummary && (
                <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 ring-1 ring-primary-100 col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet size={14} weight="duotone" />
                      Ngân sách
                    </span>
                    {loadingBudgetDetail && <SpinnerGap size={14} className="animate-spin text-primary-900/40" />}
                  </div>
                  <div className="text-sm font-bold text-primary-900 mt-2 tabular-nums">
                    {formatMoney(String(budgetSummary.remaining))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Còn lại · {budgetSummary.categories} ví · Khả dụng {formatMoney(String(budgetSummary.cashAvailable))}
                  </div>
                </div>
              )}
            </div>

            {budgetDetail && budgetDetail.categories.length > 0 && (
              <div className="rounded-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100">
                <div className="bg-gray-50/80 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <CurrencyCircleDollar size={16} weight="duotone" className="text-primary-900" />
                    Chi tiết ví ngân sách
                  </span>
                  <span className="text-xs font-medium text-gray-400 tabular-nums">{budgetDetail.categories.length} ví</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {budgetDetail.categories.slice(0, 4).map((c) => (
                    <div key={c.id} className="p-4 bg-white hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                          <div className="text-xs text-gray-500 mt-1 tabular-nums">
                            Khả dụng: {formatMoney(c.cashAvailableAmount)} · Còn lại: {formatMoney(c.remainingAmount)}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold text-primary-900 tabular-nums">{formatMoney(c.allocatedAmount)}</div>
                          <div className="text-xs text-gray-500">Tổng ví</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {budgetDetail.categories.length > 4 && (
                  <div className="p-4 bg-gray-50/50 text-sm text-gray-500">
                    Mở chi tiết nhiệm vụ tài chính để xem luồng chi phí theo nhiệm vụ.
                  </div>
                )}
              </div>
            )}

            {dashboard.tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center text-sm text-gray-500">
                Chưa có nhiệm vụ chuẩn bị.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100">
                <div className="bg-gray-50/80 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                  <span>Danh sách nhiệm vụ</span>
                  <span className="text-xs font-medium text-gray-400 tabular-nums">{dashboard.tasks.length} nhiệm vụ</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {dashboard.tasks.slice(0, 8).map((t) => (
                    <div key={t.id} className="p-4 bg-white hover:bg-primary-50/20 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                            <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${taskStatusPillClass(t.status)}`}>
                              {taskStatusLabel(t.status)}
                            </span>
                            {t.isFinancial && (
                              <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-accent/20 text-primary-900 ring-1 ring-accent/40">
                                Tài chính
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                            <span>{t.ownerName ? `Trưởng nhóm: ${t.ownerName}` : `Trưởng nhóm: #${t.ownerId}`}</span>
                            {t.deadline && <span>Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</span>}
                          </div>
                          {t.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{t.description}</p>}
                        </div>
                        {t.isFinancial && (
                          <div className="shrink-0 text-right">
                            <div className="text-xs text-gray-500">Cấp phát</div>
                            <div className="text-sm font-semibold text-primary-900 tabular-nums">{formatMoney(t.allocatedAmount)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {dashboard.tasks.length > 8 && (
                  <div className="p-4 bg-gray-50/50 text-sm text-gray-500">
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
                <Funnel size={16} className="text-gray-400" />
                <label htmlFor="prep-org-my-tasks-filter" className="text-sm font-medium text-gray-700">
                  Trạng thái
                </label>
                <select
                  id="prep-org-my-tasks-filter"
                  name="prepOrgMyTasksFilter"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
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
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                disabled={loadingMyTasks}
              >
                <ArrowClockwise size={16} className={loadingMyTasks ? 'animate-spin' : ''} />
                {loadingMyTasks ? 'Đang tải...' : 'Tải lại'}
              </button>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100">
              <div className="bg-gray-50/80 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Nhiệm vụ của tôi</span>
                <span className="text-xs font-medium text-gray-400 tabular-nums">{filteredMyTasks.length} nhiệm vụ</span>
              </div>
              {loadingMyTasks ? (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
                  <SpinnerGap size={20} className="animate-spin text-primary-900/40" />
                  Đang tải...
                </div>
              ) : filteredMyTasks.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">Không có nhiệm vụ phù hợp.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMyTasks.map((t) => {
                    const roleClass =
                      t.myRole === 'LEADER'
                        ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
                        : 'bg-gray-50 text-gray-700 ring-gray-200';
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setDetailTaskId(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setDetailTaskId(t.id);
                        }}
                        className="p-4 bg-white hover:bg-primary-50/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-900/20 cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${taskStatusPillClass(t.status)}`}>
                                {taskStatusLabel(t.status)}
                              </span>
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${roleClass}`}>
                                {t.myRole === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
                              </span>
                              {t.isFinancial && (
                                <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-accent/20 text-primary-900 ring-1 ring-accent/40">
                                  Tài chính
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                              <span>
                                {t.ownerName ? `Trưởng nhóm: ${t.ownerName}` : `Trưởng nhóm: #${t.ownerId}`}
                              </span>
                              {t.deadline && <span>Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</span>}
                              {t.isFinancial && <span className="tabular-nums">Cấp phát: {formatMoney(t.allocatedAmount)}</span>}
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
                              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-primary-900 ring-1 ring-primary-100 bg-primary-50 hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                            >
                              <Eye size={16} weight="duotone" />
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
