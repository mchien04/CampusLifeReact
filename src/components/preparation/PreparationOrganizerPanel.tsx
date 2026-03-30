import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { preparationAPI, studentAPI } from '../../services';
import PreparationTaskDetailModal from './PreparationTaskDetailModal';
import {
    ActivityBudgetDto,
    BudgetCategoryDto,
    ExpenseDto,
    ExpenseStatus,
    ExpenseStatusFilter,
    FinancialReportDto,
    FundAdvanceDto,
    FundAdvanceSourceSuggestionDto,
    MyPreparationTaskDto,
    PreparationDashboardDto,
    PreparationTaskMemberDto,
    PreparationTaskDto,
    PreparationTaskStatus,
} from '../../types';
import { getImageUrl } from '../../utils/imageUtils';
import { getFundAdvanceStatusBadgeClass, getFundAdvanceStatusLabel } from '../../utils/preparationUtils';

type TabKey = 'OVERVIEW' | 'TASKS' | 'MY_TASKS' | 'FINANCE' | 'MY_EXPENSES' | 'LEADER_REVIEW' | 'FUND_ADVANCE';

function parseOrganizerTab(value: string | null): TabKey {
    if (value === 'TASKS') return 'TASKS';
    if (value === 'MY_TASKS') return 'MY_TASKS';
    return 'OVERVIEW';
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
    const n = Number(amount);
    if (Number.isFinite(n)) return currencyFormatter.format(n);
    return amount;
}

function statusBadgeClass(status: ExpenseStatus) {
    if (status === 'APPROVED') return 'bg-green-50 text-green-700 border border-green-200';
    if (status === 'REJECTED') return 'bg-red-50 text-red-700 border border-red-200';
    if (status === 'PENDING_ADMIN') return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
}

function expenseStatusLabel(status: ExpenseStatus) {
    if (status === 'PENDING_LEADER') return 'Chờ leader duyệt';
    if (status === 'PENDING_ADMIN') return 'Chờ admin duyệt';
    if (status === 'APPROVED') return 'Đã duyệt';
    return 'Từ chối';
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

    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [expenseFilter, setExpenseFilter] = useState<ExpenseStatusFilter>('ALL');

    const [report, setReport] = useState<FinancialReportDto | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const [onlyMine, setOnlyMine] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [detailTaskId, setDetailTaskId] = useState<number | null>(null);
    const [expenseDraftTaskId, setExpenseDraftTaskId] = useState<number | null>(null);
    const [expenseDraftCategoryId, setExpenseDraftCategoryId] = useState<number | null>(null);

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [faTaskId, setFaTaskId] = useState<number | null>(null);
    const [faMembers, setFaMembers] = useState<PreparationTaskMemberDto[]>([]);
    const [faStudentId, setFaStudentId] = useState<number | null>(null);
    const [faAmount, setFaAmount] = useState('');
    const [faCategoryId, setFaCategoryId] = useState<number | null>(null);
    const [faSuggestions, setFaSuggestions] = useState<FundAdvanceSourceSuggestionDto[]>([]);
    const [faDebtWarning, setFaDebtWarning] = useState<string | null>(null);
    const [loadingFaMembers, setLoadingFaMembers] = useState(false);
    const [loadingFaSuggestions, setLoadingFaSuggestions] = useState(false);
    const [submittingFaRequest, setSubmittingFaRequest] = useState(false);
    const [fundAdvances, setFundAdvances] = useState<FundAdvanceDto[]>([]);
    const [loadingFundAdvances, setLoadingFundAdvances] = useState(false);
    const [fundAdvanceFilter, setFundAdvanceFilter] = useState<'ALL' | 'REQUESTED' | 'HOLDING' | 'SETTLED' | 'REJECTED'>('ALL');

    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

    const [showAllocationRequestModal, setShowAllocationRequestModal] = useState(false);
    const [allocationRequestTaskId, setAllocationRequestTaskId] = useState<number | null>(null);

    const financialTasks = useMemo(() => {
        return (dashboard?.tasks ?? []).filter((t) => Boolean(t.isFinancial));
    }, [dashboard?.tasks]);

    const selectedTask = useMemo(() => {
        if (!selectedTaskId) return null;
        return (dashboard?.tasks ?? []).find((t) => t.id === selectedTaskId) ?? null;
    }, [dashboard?.tasks, selectedTaskId]);

    const categories = useMemo<BudgetCategoryDto[]>(() => {
        return report?.categories ?? [];
    }, [report]);

    const isLeaderOfSelectedTask = useMemo(() => {
        if (!selectedTask || !studentId) return false;
        return selectedTask.ownerId === studentId;
    }, [selectedTask, studentId]);

    const isLeaderOfAnyFinancialTask = useMemo(() => {
        if (!studentId) return false;
        return financialTasks.some((t) => t.ownerId === studentId);
    }, [financialTasks, studentId]);

    const isLeaderOfAnyTask = useMemo(() => {
        if (!studentId) return false;
        return (dashboard?.tasks ?? []).some((t) => t.ownerId === studentId);
    }, [dashboard?.tasks, studentId]);

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

    useEffect(() => {
        if (!dashboard?.hasPreparation) return;
        if (selectedTaskId) return;
        const first = (dashboard.tasks ?? []).find((t) => t.isFinancial);
        if (first) setSelectedTaskId(first.id);
    }, [dashboard?.hasPreparation, dashboard?.tasks, selectedTaskId]);

    useEffect(() => {
        if (!financialTasks.length) {
            setFaTaskId(null);
            return;
        }
        if (faTaskId && financialTasks.some((t) => t.id === faTaskId)) return;
        setFaTaskId(financialTasks[0].id);
    }, [faTaskId, financialTasks]);

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

    const loadReport = useCallback(async () => {
        try {
            setLoadingReport(true);
            const rep = await preparationAPI.getFinancialReport(activityId);
            setReport(rep);
        } catch {
            setReport(null);
        } finally {
            setLoadingReport(false);
        }
    }, [activityId]);

    const loadExpenses = useCallback(
        async (status: ExpenseStatusFilter) => {
            try {
                setLoadingExpenses(true);
                const list = await preparationAPI.listExpenses(activityId, status);
                setExpenses(list);
            } catch (e: any) {
                setExpenses([]);
                toast.error(e?.response?.data?.message || e?.message || 'Không thể tải danh sách chi phí');
            } finally {
                setLoadingExpenses(false);
            }
        },
        [activityId]
    );


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

    const updateTaskStatus = async (task: PreparationTaskDto, next: PreparationTaskStatus) => {
        try {
            const updated = await preparationAPI.updateTaskStatus(task.id, next);
            setDashboard((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tasks: prev.tasks.map((t) => (t.id === task.id ? updated : t)),
                };
            });
            toast.success('Cập nhật trạng thái nhiệm vụ thành công');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái nhiệm vụ');
        }
    };

    const acceptTask = async (taskId: number) => {
        try {
            const updated = await preparationAPI.acceptTask(taskId);
            setDashboard((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tasks: prev.tasks.map((t) => (t.id === taskId ? updated : t)),
                };
            });
            setMyTasks((prev) =>
                prev.map((t) =>
                    t.id === updated.id
                        ? {
                            ...t,
                            title: updated.title,
                            description: updated.description,
                            deadline: updated.deadline,
                            ownerId: updated.ownerId,
                            ownerName: updated.ownerName,
                            allocatedAmount: updated.allocatedAmount,
                            isFinancial: updated.isFinancial,
                            status: updated.status,
                        }
                        : t
                )
            );
            toast.success('Đã nhận nhiệm vụ');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể nhận nhiệm vụ');
        }
    };

    const requestTaskComplete = async (taskId: number) => {
        try {
            const updated = await preparationAPI.requestTaskComplete(taskId);
            setDashboard((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tasks: prev.tasks.map((t) => (t.id === taskId ? updated : t)),
                };
            });
            setMyTasks((prev) =>
                prev.map((t) =>
                    t.id === updated.id
                        ? {
                            ...t,
                            title: updated.title,
                            description: updated.description,
                            deadline: updated.deadline,
                            ownerId: updated.ownerId,
                            ownerName: updated.ownerName,
                            allocatedAmount: updated.allocatedAmount,
                            isFinancial: updated.isFinancial,
                            status: updated.status,
                        }
                        : t
                )
            );
            toast.success('Đã gửi yêu cầu hoàn thành nhiệm vụ');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể gửi yêu cầu hoàn thành');
        }
    };

    const submitExpense = async (payload: {
        taskId: number;
        categoryId: number;
        amount: string;
        description: string | null;
        evidenceFile: File | null;
    }) => {
        try {
            setSubmitting(true);
            let evidenceUrl: string | undefined;
            if (payload.evidenceFile) {
                evidenceUrl = await preparationAPI.uploadEvidence(payload.taskId, payload.evidenceFile);
            }
            await preparationAPI.createExpense(payload.taskId, {
                categoryId: payload.categoryId,
                amount: payload.amount,
                description: payload.description,
                evidenceUrl,
            });
            toast.success('Đã gửi chi phí (chờ leader duyệt)');
            setShowAddExpense(false);
            await loadExpenses(expenseFilter);
            await loadReport();
        } catch (e: any) {
            const status = e?.response?.status;
            if (status === 409) {
                const data = e?.response?.data;
                const message = data?.message || data?.body?.message || 'Chi phí vượt quá cấp phát của task';
                toast.warning(message);
                return;
            }
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tạo chi phí');
        } finally {
            setSubmitting(false);
        }
    };

    const decideLeader = async (expenseId: number, approved: boolean) => {
        try {
            await preparationAPI.leaderDecision(expenseId, approved);
            toast.success(approved ? 'Đã duyệt cấp leader' : 'Đã từ chối');
            await loadExpenses(expenseFilter);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể xử lý duyệt');
        }
    };

    const loadFundAdvances = useCallback(async (taskId: number) => {
        try {
            setLoadingFundAdvances(true);
            const list = await preparationAPI.listFundAdvancesByTask(taskId);
            setFundAdvances(list ?? []);
        } catch (e: any) {
            setFundAdvances([]);
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tải lịch sử tạm ứng');
        } finally {
            setLoadingFundAdvances(false);
        }
    }, []);

    useEffect(() => {
        if (!faTaskId || tab !== 'FUND_ADVANCE') return;
        loadFundAdvances(faTaskId);
    }, [faTaskId, loadFundAdvances, tab]);

    useEffect(() => {
        if (!faTaskId || tab !== 'FUND_ADVANCE') {
            setFaMembers([]);
            return;
        }
        let mounted = true;
        const run = async () => {
            try {
                setLoadingFaMembers(true);
                const list = await preparationAPI.getTaskMembers(faTaskId);
                if (!mounted) return;
                setFaMembers(list ?? []);
            } catch {
                if (!mounted) return;
                setFaMembers([]);
            } finally {
                if (mounted) setLoadingFaMembers(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [faTaskId, tab]);

    useEffect(() => {
        if (!faTaskId || tab !== 'FUND_ADVANCE') {
            setFaSuggestions([]);
            setFaCategoryId(null);
            return;
        }
        if (!faAmount.trim()) {
            setFaSuggestions([]);
            setFaCategoryId(null);
            return;
        }
        let mounted = true;
        const run = async () => {
            try {
                setLoadingFaSuggestions(true);
                const list = await preparationAPI.getFundAdvanceSourceSuggestions(faTaskId, faAmount.trim());
                if (!mounted) return;
                setFaSuggestions(list ?? []);
                if (!list.some((item) => item.categoryId === faCategoryId)) {
                    setFaCategoryId(list[0]?.categoryId ?? null);
                }
            } catch {
                if (!mounted) return;
                setFaSuggestions([]);
                setFaCategoryId(null);
            } finally {
                if (mounted) setLoadingFaSuggestions(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [faAmount, faCategoryId, faTaskId, tab]);

    useEffect(() => {
        if (!faStudentId || tab !== 'FUND_ADVANCE') {
            setFaDebtWarning(null);
            return;
        }
        let mounted = true;
        const run = async () => {
            try {
                const debts = await preparationAPI.getFundAdvanceDebts(activityId, faStudentId);
                if (!mounted) return;
                const debt = debts.find((d) => Number(d.holdingAmount) > 0);
                if (!debt) {
                    setFaDebtWarning(null);
                    return;
                }
                setFaDebtWarning(`Thành viên này đang giữ ${formatMoney(debt.holdingAmount)} từ kỳ trước. Cần dứt điểm trước khi tạo yêu cầu mới.`);
            } catch {
                if (!mounted) return;
                setFaDebtWarning(null);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [activityId, faStudentId, tab]);

    const submitFundAdvanceRequest = async () => {
        if (!faTaskId) {
            toast.warning('Vui lòng chọn task tài chính');
            return;
        }
        if (!faStudentId) {
            toast.warning('Vui lòng chọn thành viên nhận tạm ứng');
            return;
        }
        if (!faAmount.trim() || Number(faAmount) <= 0) {
            toast.warning('Vui lòng nhập số tiền hợp lệ');
            return;
        }
        if (!faCategoryId) {
            toast.warning('Vui lòng chọn ví nguồn phù hợp');
            return;
        }
        if (faDebtWarning) {
            toast.warning('Thành viên chưa dứt điểm kỳ trước, chưa thể tạo yêu cầu mới');
            return;
        }

        try {
            setSubmittingFaRequest(true);
            await preparationAPI.requestFundAdvance(faTaskId, {
                studentId: faStudentId,
                categoryId: faCategoryId,
                amount: faAmount.trim(),
            });
            toast.success('Đã tạo yêu cầu tạm ứng, chờ admin duyệt');
            setFaAmount('');
            setFaCategoryId(null);
            await loadFundAdvances(faTaskId);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tạo yêu cầu tạm ứng');
        } finally {
            setSubmittingFaRequest(false);
        }
    };

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
                        onClick={() => setTab('TASKS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'TASKS'
                            ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        Nhiệm vụ
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
                            <div className="space-y-3">
                                {dashboard.tasks.slice(0, 5).map((t) => {
                                    return (
                                        <div
                                            key={t.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setDetailTaskId(t.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') setDetailTaskId(t.id);
                                            }}
                                            className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 hover:shadow-sm transition-all outline-none focus:ring-2 focus:ring-[#001C44]"
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
                                                        className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                                                    >
                                                        Xem
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {dashboard.tasks.length > 5 && <div className="text-sm text-gray-500">Xem thêm ở tab Nhiệm vụ.</div>}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'TASKS' && (
                    <div className="space-y-3">
                        {dashboard.tasks.length === 0 ? (
                            <div className="text-sm text-gray-500">Chưa có nhiệm vụ chuẩn bị.</div>
                        ) : (
                            dashboard.tasks.map((t) => (
                                <div
                                    key={t.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setDetailTaskId(t.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') setDetailTaskId(t.id);
                                    }}
                                    className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 hover:shadow-sm transition-all outline-none focus:ring-2 focus:ring-[#001C44]"
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
                                                {t.isFinancial && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                                                        Tài chính
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                <span>{t.ownerName ? `Trưởng nhóm: ${t.ownerName}` : `Trưởng nhóm: #${t.ownerId}`}</span>
                                                {t.deadline && <span>Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</span>}
                                                {t.isFinancial && <span>Cấp phát: {formatMoney(t.allocatedAmount)}</span>}
                                            </div>
                                            {t.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{t.description}</p>}
                                        </div>
                                        <div className="shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetailTaskId(t.id);
                                                }}
                                                className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                                            >
                                                Xem
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
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
                                        const canRequestComplete =
                                            studentId != null && t.status === 'ACCEPTED' && (t.myRole === 'LEADER' || t.ownerId === studentId);
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

                {tab === 'FINANCE' && (
                    <div className="space-y-5">
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                                <span>Ngân sách theo hạng mục</span>
                                {loadingReport && <span className="text-xs text-gray-500">Đang tải...</span>}
                            </div>
                            {!report ? (
                                <div className="p-4 text-sm text-gray-500">{dashboard.financeMessage || 'Chưa khởi tạo ngân sách.'}</div>
                            ) : report.categories.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">Chưa có hạng mục ngân sách.</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {report.categories.map((c) => (
                                        <div key={c.id} className="p-4 bg-white">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Đã dùng: {formatMoney(c.usedAmount)} / {formatMoney(c.allocatedAmount)}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <div className="text-sm font-semibold text-[#001C44]">{formatMoney(c.remainingAmount)}</div>
                                                    <div className="text-xs text-gray-500">Còn lại</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                <div className="text-xs text-gray-500">Task tài chính</div>
                                <select
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                    value={selectedTaskId ?? ''}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setSelectedTaskId(Number.isFinite(v) && v > 0 ? v : null);
                                    }}
                                >
                                    <option value="">Chọn task...</option>
                                    {financialTasks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.title}
                                        </option>
                                    ))}
                                </select>
                                {selectedTask && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        <span>{selectedTask.ownerName ? `Trưởng nhóm: ${selectedTask.ownerName}` : `Trưởng nhóm: #${selectedTask.ownerId}`}</span>
                                        <span className="ml-3">Đã cấp phát: {formatMoney(selectedTask.allocatedAmount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                <div className="text-xs text-gray-500">Hạng mục</div>
                                <select
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                    value={selectedCategoryId ?? ''}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setSelectedCategoryId(Number.isFinite(v) && v > 0 ? v : null);
                                    }}
                                    disabled={!categories.length}
                                >
                                    <option value="">Chọn hạng mục...</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {!categories.length && (
                                    <div className="text-xs text-gray-500 mt-2">Chưa có hạng mục ngân sách.</div>
                                )}
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col justify-between">
                                <div>
                                    <div className="text-xs text-gray-500">Hiển thị</div>
                                    <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={onlyMine}
                                            onChange={(e) => setOnlyMine(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        Chỉ chi phí của tôi
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setExpenseDraftTaskId(selectedTaskId);
                                        setExpenseDraftCategoryId(selectedCategoryId);
                                        setShowAddExpense(true);
                                    }}
                                    className="btn-yellow px-6 py-2 rounded-lg text-sm font-medium mt-4"
                                    disabled={!selectedTaskId || !selectedCategoryId}
                                >
                                    + Tạo chi phí
                                </button>
                            </div>
                        </div>

                        <div className="border border-[#001C44] border-opacity-15 rounded-xl p-4 bg-[#001C44] bg-opacity-5 text-xs text-gray-700">
                            Trưởng nhóm có thêm quyền duyệt cấp 1 ở tab Duyệt cấp 1. Thành viên chỉ tạo và theo dõi chi phí.
                        </div>
                    </div>
                )}

                {tab === 'LEADER_REVIEW' && (
                    <div className="space-y-5">
                        {!isLeaderOfAnyFinancialTask ? (
                            <div className="text-sm text-gray-500">Bạn không có quyền trưởng nhóm ở nhiệm vụ tài chính nào.</div>
                        ) : !isLeaderOfSelectedTask ? (
                            <div className="text-sm text-gray-500">Hãy chọn nhiệm vụ mà bạn là trưởng nhóm ở tab Tài chính để duyệt cấp 1.</div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Duyệt cấp 1 (Trưởng nhóm)</div>
                                <div className="p-4 bg-white text-sm text-gray-600">
                                    Chỉ hiển thị các khoản chi đang chờ trưởng nhóm duyệt thuộc nhiệm vụ đã chọn.
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {expenses
                                        .filter((ex) => ex.status === 'PENDING_LEADER')
                                        .filter((ex) => ex.taskId != null && selectedTaskId != null && ex.taskId === selectedTaskId)
                                        .map((ex) => {
                                            const imgUrl = getImageUrl(ex.evidenceUrl);
                                            return (
                                                <div key={ex.id} className="p-4 bg-white">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <div className="text-sm font-semibold text-gray-900">{formatMoney(ex.amount)}</div>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                                                                        ex.status
                                                                    )}`}
                                                                >
                                                                    {expenseStatusLabel(ex.status)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <span>
                                                                    {ex.createdByName ? `Người gửi: ${ex.createdByName}` : `Người gửi: #${ex.createdById ?? ''}`}
                                                                </span>
                                                                <span className="ml-3">{new Date(ex.createdAt).toLocaleString('vi-VN')}</span>
                                                                {ex.categoryName && <span className="ml-3">Hạng mục: {ex.categoryName}</span>}
                                                            </div>
                                                            {ex.description && <div className="text-sm text-gray-600 mt-2">{ex.description}</div>}
                                                        </div>
                                                        <div className="shrink-0 flex items-center gap-2">
                                                            {imgUrl && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImageModalUrl(imgUrl)}
                                                                    className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                                                                >
                                                                    Minh chứng
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => decideLeader(ex.id, true)}
                                                                className="px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg"
                                                            >
                                                                Duyệt
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => decideLeader(ex.id, false)}
                                                                className="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg"
                                                            >
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {expenses.filter((ex) => ex.status === 'PENDING_LEADER' && ex.taskId === selectedTaskId).length === 0 && (
                                        <div className="p-4 text-sm text-gray-500">Không có khoản chi nào chờ duyệt.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'FUND_ADVANCE' && (
                    <div className="space-y-5">
                        {!isLeaderOfAnyFinancialTask ? (
                            <div className="text-sm text-gray-500">Bạn không có quyền Leader ở task tài chính nào.</div>
                        ) : (
                            <>
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Tạo yêu cầu tạm ứng</div>
                                    <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Task tài chính</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                                value={faTaskId ?? ''}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    setFaTaskId(Number.isFinite(v) && v > 0 ? v : null);
                                                    setFaStudentId(null);
                                                    setFaAmount('');
                                                    setFaCategoryId(null);
                                                }}
                                            >
                                                <option value="">Chọn task...</option>
                                                {financialTasks.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Thành viên nhận ứng</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                                value={faStudentId ?? ''}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    setFaStudentId(Number.isFinite(v) && v > 0 ? v : null);
                                                }}
                                                disabled={!faTaskId || loadingFaMembers}
                                            >
                                                <option value="">{loadingFaMembers ? 'Đang tải member...' : 'Chọn thành viên...'}</option>
                                                {faMembers.map((m) => (
                                                    <option key={m.studentId} value={m.studentId}>
                                                        {m.studentName || `#${m.studentId}`} ({m.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Số tiền cần ứng</label>
                                            <input
                                                type="text"
                                                value={faAmount}
                                                onChange={(e) => setFaAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="Ví dụ: 500000"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                            />
                                            {faAmount && <div className="text-xs text-gray-500 mt-1">{formatMoney(faAmount)}</div>}
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={submitFundAdvanceRequest}
                                                disabled={submittingFaRequest || !faTaskId || !faStudentId || !faCategoryId || !faAmount || Boolean(faDebtWarning)}
                                                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {submittingFaRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="px-4 pb-4">
                                        <div className="text-sm font-semibold text-gray-700 mb-2">Ví nguồn gợi ý</div>
                                        {loadingFaSuggestions ? (
                                            <div className="text-sm text-gray-500">Đang lấy gợi ý nguồn ví...</div>
                                        ) : faAmount && faSuggestions.length === 0 ? (
                                            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                Không có ví nào đủ điều kiện với số tiền này. Hãy giảm số tiền hoặc kiểm tra allocation.
                                            </div>
                                        ) : faSuggestions.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {faSuggestions.map((s) => {
                                                    const active = faCategoryId === s.categoryId;
                                                    return (
                                                        <button
                                                            key={s.categoryId}
                                                            type="button"
                                                            onClick={() => setFaCategoryId(s.categoryId)}
                                                            className={`text-left border rounded-lg p-3 ${active
                                                                ? 'border-[#001C44] bg-[#001C44] bg-opacity-5'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                }`}
                                                        >
                                                            <div className="text-sm font-semibold text-gray-900">{s.categoryName}</div>
                                                            <div className="text-xs text-gray-600 mt-2">Allocation còn: {formatMoney(s.allocationRemainingAmount)}</div>
                                                            <div className="text-xs text-gray-600">Tiền mặt khả dụng: {formatMoney(s.cashAvailableAmount)}</div>
                                                            <div className="text-xs font-semibold text-[#001C44] mt-1">Ứng tối đa: {formatMoney(s.maxAdvanceAmount)}</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500">Nhập số tiền để lấy gợi ý ví nguồn.</div>
                                        )}

                                        {faDebtWarning && (
                                            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                                {faDebtWarning}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between gap-3">
                                        <span>Lịch sử tạm ứng theo task</span>
                                        <div className="flex items-center gap-2">
                                            <label htmlFor="org-fund-advance-filter" className="text-xs font-medium text-gray-600">Trạng thái</label>
                                            <select
                                                id="org-fund-advance-filter"
                                                value={fundAdvanceFilter}
                                                onChange={(e) => setFundAdvanceFilter(e.target.value as 'ALL' | 'REQUESTED' | 'HOLDING' | 'SETTLED' | 'REJECTED')}
                                                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                            >
                                                <option value="ALL">Tất cả</option>
                                                <option value="REQUESTED">Chờ duyệt</option>
                                                <option value="HOLDING">Đang giữ tiền</option>
                                                <option value="SETTLED">Đã tất toán</option>
                                                <option value="REJECTED">Từ chối</option>
                                            </select>
                                        </div>
                                    </div>

                                    {loadingFundAdvances ? (
                                        <div className="p-4 text-sm text-gray-500">Đang tải lịch sử tạm ứng...</div>
                                    ) : fundAdvances.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">Chưa có yêu cầu tạm ứng nào cho task này.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành viên</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ví nguồn</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Còn giữ</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {fundAdvances
                                                        .filter((item) => fundAdvanceFilter === 'ALL' || item.status === fundAdvanceFilter)
                                                        .map((item) => (
                                                            <tr key={item.id}>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{item.studentName || `#${item.studentId}`}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{item.categoryName}</td>
                                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(item.amount)}</td>
                                                                <td className="px-4 py-3 text-sm text-[#001C44] font-semibold">{formatMoney(item.remainingAmount)}</td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFundAdvanceStatusBadgeClass(item.status)}`}>
                                                                        {getFundAdvanceStatusLabel(item.status)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                                    <div>Tạo: {new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                                                                    {item.decidedAt && <div>Duyệt: {new Date(item.decidedAt).toLocaleString('vi-VN')}</div>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {(tab === 'MY_EXPENSES' || tab === 'LEADER_REVIEW') && (
                    <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <label htmlFor="prep-org-expense-filter" className="text-sm font-medium text-gray-700">Trạng thái</label>
                                <select
                                    id="prep-org-expense-filter"
                                    name="prepOrgExpenseFilter"
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                    value={expenseFilter}
                                    onChange={(e) => setExpenseFilter(e.target.value as ExpenseStatusFilter)}
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value="PENDING_LEADER">Chờ leader duyệt</option>
                                    <option value="PENDING_ADMIN">Chờ admin duyệt</option>
                                    <option value="APPROVED">Đã duyệt</option>
                                    <option value="REJECTED">Từ chối</option>
                                </select>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Danh sách chi phí</div>
                            {loadingExpenses ? (
                                <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                            ) : expenses.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">Chưa có khoản chi nào.</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {expenses
                                        .filter((ex) => {
                                            if (tab === 'MY_EXPENSES') {
                                                if (!studentId) return true;
                                                return ex.createdById === studentId;
                                            }
                                            if (!onlyMine) return true;
                                            if (!studentId) return true;
                                            return ex.createdById === studentId;
                                        })
                                        .map((ex) => {
                                            const imgUrl = getImageUrl(ex.evidenceUrl);
                                            return (
                                                <div key={ex.id} className="p-4 bg-white">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <div className="text-sm font-semibold text-gray-900">{formatMoney(ex.amount)}</div>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                                                                        ex.status
                                                                    )}`}
                                                                >
                                                                    {expenseStatusLabel(ex.status)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <span>
                                                                    {ex.createdByName ? `Người gửi: ${ex.createdByName}` : `Người gửi: #${ex.createdById ?? ''}`}
                                                                </span>
                                                                <span className="ml-3">{new Date(ex.createdAt).toLocaleString('vi-VN')}</span>
                                                                {ex.categoryName && <span className="ml-3">Hạng mục: {ex.categoryName}</span>}
                                                            </div>
                                                            {ex.description && <div className="text-sm text-gray-600 mt-2">{ex.description}</div>}
                                                        </div>
                                                        <div className="shrink-0">
                                                            {imgUrl ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImageModalUrl(imgUrl)}
                                                                    className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                                                                >
                                                                    Minh chứng
                                                                </button>
                                                            ) : (
                                                                <div className="text-xs text-gray-400 mt-1">Không có minh chứng</div>
                                                            )}
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
