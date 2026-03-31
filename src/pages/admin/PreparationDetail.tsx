
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventAPI, preparationAPI, studentAPI } from '../../services';
import LeaderExpenseReviewCard from '../../components/preparation/LeaderExpenseReviewCard';
import AdminExpenseReviewCard from '../../components/preparation/AdminExpenseReviewCard';
import TaskMemberManager from '../../components/preparation/TaskMemberManager';
import BudgetSetupPanel from '../../components/preparation/BudgetSetupPanel';
import FinanceReports from '../../components/preparation/FinanceReports';
import {
    ActivityBudgetDto,
    ActivityResponse,
    AllocationAdjustmentDecisionSourceRequest,
    AllocationAdjustmentRequestDto,
    AllocationAdjustmentSourcePlanItemDto,
    BulkAddOrganizersResultDto,
    CashFlowReportDto,
    ExpenseDto,
    ExpenseStatus,
    ExpenseStatusFilter,
    FinanceOverviewReportDto,
    FundAdvanceDebtDto,
    FundAdvanceDto,
    FundAdvanceStatus,
    FundAdvanceSourceSuggestionDto,
    OrganizerDto,
    PreparationDashboardDto,
    PreparationTaskDto,
    PreparationTaskMemberDto,
    PreparationTaskStatus,
    TaskAllocationSourceDto,
    WorkloadWarningDto,
} from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
    const n = Number(amount);
    if (Number.isFinite(n)) return currencyFormatter.format(n);
    return amount;
}

function normalizeAmountInput(amount: string | number): string {
    if (typeof amount === 'number') return String(amount);
    return amount;
}

function parseAmountToNumber(amount: string | number): number {
    if (typeof amount === 'number') return Number.isFinite(amount) ? amount : 0;
    const normalized = String(amount).replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function statusBadgeClass(status: ExpenseStatus) {
    if (status === 'APPROVED') return 'bg-green-50 text-green-700 border border-green-200';
    if (status === 'REJECTED') return 'bg-red-50 text-red-700 border border-red-200';
    if (status === 'PENDING_ADMIN') return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
}

function expenseStatusLabel(status: ExpenseStatus) {
    if (status === 'PENDING_LEADER') return 'Chờ trưởng nhóm duyệt';
    if (status === 'PENDING_ADMIN') return 'Chờ quản trị duyệt';
    if (status === 'APPROVED') return 'Đã duyệt';
    return 'Từ chối';
}

function fundAdvanceStatusLabel(status: FundAdvanceStatus) {
    if (status === 'REQUESTED') return 'Chờ duyệt';
    if (status === 'HOLDING') return 'Đang giữ tiền';
    if (status === 'SETTLED') return 'Đã tất toán';
    return 'Từ chối';
}

function fundAdvanceStatusBadgeClass(status: FundAdvanceStatus) {
    if (status === 'REQUESTED') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    if (status === 'HOLDING') return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (status === 'SETTLED') return 'bg-green-50 text-green-700 border border-green-200';
    return 'bg-red-50 text-red-700 border border-red-200';
}

function taskStatusLabel(status: PreparationTaskStatus) {
    if (status === 'PENDING') return 'PENDING';
    if (status === 'ACCEPTED') return 'ACCEPTED';
    if (status === 'COMPLETION_REQUESTED') return 'COMPLETION_REQUESTED';
    return 'COMPLETED';
}

function taskStatusBadgeClass(status: PreparationTaskStatus) {
    if (status === 'COMPLETED') return 'bg-green-50 text-green-700 border border-green-200';
    if (status === 'COMPLETION_REQUESTED') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    if (status === 'ACCEPTED') return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-gray-50 text-gray-700 border border-gray-200';
}

type ManagerTabKey = 'overview' | 'task-center' | 'exports';
type PreparationExportType = 'financial' | 'operational' | 'audit';
type PreparationExportFormat = 'xlsx' | 'pdf';

const managerTabs: Array<{ key: ManagerTabKey; label: string }> = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'task-center', label: 'Trung tâm nhiệm vụ' },
    { key: 'exports', label: 'Xuất báo cáo' },
];

function parseManagerTab(value: string | null): ManagerTabKey {
    if (value === 'task-center') return 'task-center';
    if (value === 'exports') return 'exports';
    if (value === 'tasks') return 'task-center';
    if (value === 'allocations') return 'task-center';
    if (value === 'fund-advances') return 'task-center';
    if (value === 'expenses') return 'task-center';
    return 'overview';
}

export default function PreparationDetail() {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const id = Number(activityId);
    const managerTab = parseManagerTab(searchParams.get('tab'));
    const setManagerTab = useCallback(
        (nextTab: ManagerTabKey) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('tab', nextTab);
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    const [activity, setActivity] = useState<ActivityResponse | null>(null);
    const [dashboard, setDashboard] = useState<PreparationDashboardDto | null>(null);
    const [organizers, setOrganizers] = useState<OrganizerDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [expenseFilter, setExpenseFilter] = useState<ExpenseStatusFilter>('ALL');

    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

    const [showAddOrganizer, setShowAddOrganizer] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [addingOrganizer, setAddingOrganizer] = useState(false);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskAssigneeId, setTaskAssigneeId] = useState<number | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskDeadline, setTaskDeadline] = useState<string>('');
    const [taskIsFinancial, setTaskIsFinancial] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [taskDetail, setTaskDetail] = useState<PreparationTaskDto | null>(null);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
    const [taskDetailMembers, setTaskDetailMembers] = useState<PreparationTaskMemberDto[]>([]);
    const [loadingTaskMembers, setLoadingTaskMembers] = useState(false);
    const [showTaskAdvanceHistory, setShowTaskAdvanceHistory] = useState(false);
    const [taskAdvanceHistory, setTaskAdvanceHistory] = useState<FundAdvanceDto[]>([]);
    const [loadingTaskAdvanceHistory, setLoadingTaskAdvanceHistory] = useState(false);
    const [showTaskAllocationSources, setShowTaskAllocationSources] = useState(false);
    const [taskAllocationSources, setTaskAllocationSources] = useState<TaskAllocationSourceDto[]>([]);
    const [loadingTaskAllocationSources, setLoadingTaskAllocationSources] = useState(false);
    const [decidingTaskCompletionId, setDecidingTaskCompletionId] = useState<number | null>(null);

    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [allocTaskId, setAllocTaskId] = useState<number | null>(null);
    const [allocCategoryId, setAllocCategoryId] = useState<number | null>(null);
    const [allocAmount, setAllocAmount] = useState('');
    const [savingAllocation, setSavingAllocation] = useState(false);

    const [activityBudget, setActivityBudget] = useState<ActivityBudgetDto | null>(null);
    const [adjustmentRequests, setAdjustmentRequests] = useState<AllocationAdjustmentRequestDto[]>([]);
    const [adjustmentFilter, setAdjustmentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [loadingAdjustments, setLoadingAdjustments] = useState(false);
    const [decisionSourcesByRequest, setDecisionSourcesByRequest] = useState<Record<number, AllocationAdjustmentDecisionSourceRequest[]>>({});
    const [sourcePlanLoadedByRequest, setSourcePlanLoadedByRequest] = useState<Record<number, boolean>>({});
    const [sourcePlanLoadingByRequest, setSourcePlanLoadingByRequest] = useState<Record<number, boolean>>({});
    const [sourcePlanErrorByRequest, setSourcePlanErrorByRequest] = useState<Record<number, string | null>>({});

    const [fundAdvances, setFundAdvances] = useState<FundAdvanceDto[]>([]);
    const [loadingFundAdvances, setLoadingFundAdvances] = useState(false);
    const [fundAdvanceDebts, setFundAdvanceDebts] = useState<FundAdvanceDebtDto[]>([]);
    const [loadingDebts, setLoadingDebts] = useState(false);
    const [financeOverview, setFinanceOverview] = useState<FinanceOverviewReportDto | null>(null);
    const [cashFlowReport, setCashFlowReport] = useState<CashFlowReportDto | null>(null);
    const [loadingReports, setLoadingReports] = useState(false);
    const [workloadWarnings, setWorkloadWarnings] = useState<WorkloadWarningDto[]>([]);
    const [loadingWorkload, setLoadingWorkload] = useState(false);
    const [exportingByKey, setExportingByKey] = useState<Record<string, boolean>>({});
    const [lastFailedExport, setLastFailedExport] = useState<{
        reportType: PreparationExportType;
        format: PreparationExportFormat;
    } | null>(null);

    const hasPreparation = Boolean(dashboard?.hasPreparation);
    const financialTasks = useMemo(() => {
        return (dashboard?.tasks ?? []).filter((t) => t.isFinancial);
    }, [dashboard?.tasks]);

    const budgetCategories = useMemo(() => {
        return activityBudget?.categories ?? [];
    }, [activityBudget]);

    const taskForMembers = useMemo(() => {
        if (!selectedTaskId) return null;
        return taskDetail ?? dashboard?.tasks?.find((t) => t.id === selectedTaskId) ?? null;
    }, [dashboard?.tasks, selectedTaskId, taskDetail]);

    const pendingLeaderExpenses = useMemo(() => {
        return expenses.filter((ex) => ex.status === 'PENDING_LEADER');
    }, [expenses]);

    const debtByStudentId = useMemo(() => {
        const map: Record<number, number> = {};
        (fundAdvanceDebts ?? []).forEach((d) => {
            map[d.studentId] = parseAmountToNumber(d.holdingAmount);
        });
        return map;
    }, [fundAdvanceDebts]);

    const showTaskTable = managerTab === 'task-center';
    const showTaskMemberAndWorkload = managerTab === 'task-center';
    const showAllocationSection = managerTab === 'task-center';
    const showFundSection = managerTab === 'task-center';
    const showExportSection = managerTab === 'exports';

    const getExportKey = (reportType: PreparationExportType, format: PreparationExportFormat) => `${reportType}:${format}`;

    const toSafeFileNameSegment = (value: string) =>
        value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_]/g, '')
            .replace(/-+/g, '-');

    const getExportDefaultFileName = (reportType: PreparationExportType, format: PreparationExportFormat) => {
        const date = new Date().toISOString().slice(0, 10);
        const activitySegment = toSafeFileNameSegment(activity?.name || '') || `activity-${id}`;
        return `preparation-${reportType}-${activitySegment}-${date}.${format}`;
    };

    const parseFileNameFromContentDisposition = (contentDisposition?: string): string | null => {
        if (!contentDisposition) return null;

        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
            try {
                return decodeURIComponent(utf8Match[1]);
            } catch {
                return utf8Match[1];
            }
        }

        const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (basicMatch?.[1]) return basicMatch[1];
        return null;
    };

    useEffect(() => {
        if (!dashboard?.tasks?.length) {
            setSelectedTaskId(null);
            setTaskDetail(null);
            setTaskDetailMembers([]);
            return;
        }
        if (!selectedTaskId) {
            return;
        }
        const existed = dashboard.tasks.some((t) => t.id === selectedTaskId);
        if (!existed) {
            setSelectedTaskId(null);
            setTaskDetail(null);
            setTaskDetailMembers([]);
        }
    }, [dashboard?.tasks, selectedTaskId]);

    const loadCore = useCallback(async () => {
        try {
            setLoading(true);
            setLoadingWorkload(true);
            const [actRes, dash, orgs, warnings, budget] = await Promise.all([
                eventAPI.getEvent(id),
                preparationAPI.getDashboard(id).catch(() => null),
                preparationAPI.listOrganizers(id).catch(() => [] as OrganizerDto[]),
                preparationAPI.getWorkloadWarnings(id).catch(() => [] as WorkloadWarningDto[]),
                preparationAPI.getActivityBudget(id).catch(() => null),
            ]);
            setActivity(actRes.status ? actRes.data ?? null : null);
            setDashboard(dash);
            setOrganizers(orgs);
            setWorkloadWarnings(warnings);
            setActivityBudget(budget);
        } catch (e: any) {
            toast.error(e?.message || 'Không thể tải dữ liệu Preparation');
        } finally {
            setLoading(false);
            setLoadingWorkload(false);
        }
    }, [id]);

    const loadAdjustmentRequests = useCallback(async () => {
        try {
            setLoadingAdjustments(true);
            const status = adjustmentFilter === 'ALL' ? undefined : adjustmentFilter;
            const list = await preparationAPI.listAllocationAdjustmentRequests(id, status);
            setAdjustmentRequests(list ?? []);
        } catch (e: any) {
            setAdjustmentRequests([]);
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tải adjustment requests');
        } finally {
            setLoadingAdjustments(false);
        }
    }, [adjustmentFilter, id]);

    const loadExpenses = useCallback(
        async (status: ExpenseStatusFilter) => {
            try {
                setLoadingExpenses(true);
                const list = await preparationAPI.listExpenses(id, status);
                setExpenses(list);
            } catch (e: any) {
                setExpenses([]);
                toast.error(e?.response?.data?.message || e?.message || 'Không thể tải chi phí');
            } finally {
                setLoadingExpenses(false);
            }
        },
        [id]
    );

    const loadReports = useCallback(async () => {
        try {
            setLoadingReports(true);
            const [finance, cashFlow] = await Promise.all([
                preparationAPI.getFinanceOverviewReport(id).catch(() => null),
                preparationAPI.getCashFlowReport(id).catch(() => null),
            ]);
            setFinanceOverview(finance);
            setCashFlowReport(cashFlow);
        } catch {
            setFinanceOverview(null);
            setCashFlowReport(null);
        } finally {
            setLoadingReports(false);
        }
    }, [id]);

    useEffect(() => {
        if (!Number.isFinite(id) || id <= 0) return;
        loadCore();
    }, [id, loadCore]);

    useEffect(() => {
        if (!hasPreparation) return;
        loadExpenses(expenseFilter);
    }, [expenseFilter, hasPreparation, loadExpenses]);

    useEffect(() => {
        if (!hasPreparation) return;
        loadAdjustmentRequests();
    }, [hasPreparation, loadAdjustmentRequests]);

    useEffect(() => {
        if (!hasPreparation) return;
        loadReports();
    }, [hasPreparation, loadReports]);

    const loadFundAdvanceData = useCallback(async () => {
        try {
            setLoadingFundAdvances(true);
            setLoadingDebts(true);

            const tasks = financialTasks;
            const perTask = await Promise.all(
                tasks.map((t) => preparationAPI.listFundAdvancesByTask(t.id).catch(() => [] as FundAdvanceDto[]))
            );
            const merged = perTask.flat();
            setFundAdvances(merged);

            const debts = await preparationAPI.getFundAdvanceDebts(id).catch(() => [] as FundAdvanceDebtDto[]);
            setFundAdvanceDebts(debts);
        } catch {
            setFundAdvances([]);
            setFundAdvanceDebts([]);
        } finally {
            setLoadingFundAdvances(false);
            setLoadingDebts(false);
        }
    }, [financialTasks, id]);

    useEffect(() => {
        if (!hasPreparation) return;
        loadFundAdvanceData();
    }, [hasPreparation, loadFundAdvanceData]);

    const togglePreparation = async (enabled: boolean) => {
        try {
            await preparationAPI.togglePreparation(id, enabled);
            toast.success(enabled ? 'Đã bật Preparation' : 'Đã tắt Preparation');
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái Preparation');
        }
    };

    const searchStudents = useCallback(async () => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            setSearching(true);
            const res = await studentAPI.searchStudents(searchQuery.trim());
            if (res.status && res.data) {
                setSearchResults(res.data.content || []);
            } else {
                setSearchResults([]);
            }
        } catch (e: any) {
            setSearchResults([]);
            toast.error(e?.message || 'Không thể tìm sinh viên');
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const t = setTimeout(searchStudents, 300);
        return () => clearTimeout(t);
    }, [searchStudents]);

    const addOrganizer = async () => {
        if (selectedStudentIds.length === 0) return;
        try {
            setAddingOrganizer(true);
            const result: BulkAddOrganizersResultDto = await preparationAPI.addOrganizersBulk(id, {
                studentIds: selectedStudentIds,
            });
            const addedCount = result?.added?.length ?? 0;
            const skippedCount = result?.skippedStudentIds?.length ?? 0;

            if (addedCount > 0 && skippedCount > 0) {
                toast.success(`Đã thêm ${addedCount} organizer, bỏ qua ${skippedCount} người đã tồn tại.`);
            } else if (addedCount > 0) {
                toast.success(`Đã thêm ${addedCount} organizer.`);
            } else {
                toast.info('Không có organizer mới được thêm.');
            }

            setShowAddOrganizer(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedStudentIds([]);
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể thêm organizer');
        } finally {
            setAddingOrganizer(false);
        }
    };

    const toggleOrganizerCandidate = (studentId: number) => {
        setSelectedStudentIds((prev) => {
            if (prev.includes(studentId)) {
                return prev.filter((id) => id !== studentId);
            }
            return [...prev, studentId];
        });
    };

    const closeAddOrganizerModal = () => {
        setShowAddOrganizer(false);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedStudentIds([]);
    };

    const removeOrganizer = async (studentId: number) => {
        if (!window.confirm('Xóa organizer này khỏi activity?')) return;
        try {
            await preparationAPI.removeOrganizer(id, studentId);
            toast.success('Đã xóa organizer');
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể xóa organizer');
        }
    };

    const openTaskModal = () => {
        setTaskAssigneeId(null);
        setTaskTitle('');
        setTaskDesc('');
        setTaskDeadline('');
        setTaskIsFinancial(false);
        setShowTaskModal(true);
    };

    const createTask = async () => {
        if (!taskAssigneeId) {
            toast.warning('Vui lòng chọn leader');
            return;
        }
        if (!taskTitle.trim()) {
            toast.warning('Vui lòng nhập tiêu đề');
            return;
        }

        try {
            setCreatingTask(true);
            const deadline = taskDeadline ? new Date(taskDeadline).toISOString() : null;
            await preparationAPI.assignTask(id, {
                ownerId: taskAssigneeId,
                title: taskTitle.trim(),
                description: taskDesc.trim() || undefined,
                deadline,
                isFinancial: taskIsFinancial,
            });
            toast.success('Đã tạo nhiệm vụ');
            setShowTaskModal(false);
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tạo nhiệm vụ');
        } finally {
            setCreatingTask(false);
        }
    };

    const openTaskDetail = async (taskId: number) => {
        try {
            setSelectedTaskId(taskId);
            setShowTaskAdvanceHistory(false);
            setShowTaskAllocationSources(false);
            setLoadingTaskDetail(true);
            setLoadingTaskMembers(true);
            setLoadingTaskAdvanceHistory(true);
            setLoadingTaskAllocationSources(true);
            const [detail, members, advances, allocationSources] = await Promise.all([
                preparationAPI.getTaskDetail(taskId),
                preparationAPI.getTaskMembers(taskId),
                preparationAPI.listFundAdvancesByTask(taskId).catch(() => [] as FundAdvanceDto[]),
                preparationAPI.getTaskAllocationSources(taskId).catch(() => [] as TaskAllocationSourceDto[]),
            ]);
            setTaskDetail(detail);
            setTaskDetailMembers(members ?? []);
            setTaskAdvanceHistory(advances ?? []);
            setTaskAllocationSources(allocationSources ?? []);
        } catch (e: any) {
            setTaskDetail(null);
            setTaskDetailMembers([]);
            setTaskAdvanceHistory([]);
            setTaskAllocationSources([]);
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tải chi tiết task');
        } finally {
            setLoadingTaskDetail(false);
            setLoadingTaskMembers(false);
            setLoadingTaskAdvanceHistory(false);
            setLoadingTaskAllocationSources(false);
        }
    };

    const refreshTaskMembers = async () => {
        if (!selectedTaskId) return;
        try {
            setLoadingTaskMembers(true);
            const members = await preparationAPI.getTaskMembers(selectedTaskId);
            setTaskDetailMembers(members ?? []);
        } catch {
            setTaskDetailMembers([]);
        } finally {
            setLoadingTaskMembers(false);
        }
    };

    const approveExpense = async (expenseId: number, approved: boolean) => {
        try {
            await preparationAPI.adminDecision(expenseId, approved);
            toast.success(approved ? 'Đã duyệt cấp quản trị' : 'Đã từ chối cấp quản trị');
            await loadCore();
            await loadExpenses(expenseFilter);
            await loadReports();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái chi phí');
        }
    };

    const approveLeaderExpense = async (expenseId: number, approved: boolean) => {
        try {
            await preparationAPI.leaderDecision(expenseId, approved);
            toast.success(approved ? 'Đã duyệt cấp trưởng nhóm' : 'Đã từ chối cấp trưởng nhóm');
            await loadExpenses(expenseFilter);
            await loadReports();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể duyệt cấp trưởng nhóm');
        }
    };

    const decideTaskCompletion = async (taskId: number, approved: boolean) => {
        try {
            setDecidingTaskCompletionId(taskId);
            await preparationAPI.completeTaskDecision(taskId, approved);
            toast.success(approved ? 'Đã xác nhận hoàn thành nhiệm vụ' : 'Đã từ chối hoàn thành nhiệm vụ');
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể xử lý yêu cầu hoàn thành nhiệm vụ');
        } finally {
            setDecidingTaskCompletionId(null);
        }
    };

    const openAllocateModal = (task: PreparationTaskDto) => {
        setAllocTaskId(task.id);
        setAllocCategoryId(budgetCategories[0]?.id ?? null);
        setAllocAmount(task.allocatedAmount ?? '');
        setShowAllocateModal(true);
    };

    const saveAllocation = async () => {
        if (!allocTaskId) return;
        if (!allocCategoryId) {
            toast.warning('Vui lòng chọn ví nguồn (category)');
            return;
        }
        if (!allocAmount.trim()) {
            toast.warning('Vui lòng nhập số tiền phân bổ');
            return;
        }
        try {
            setSavingAllocation(true);
            await preparationAPI.allocateTaskFromCategory(allocTaskId, allocCategoryId, allocAmount.trim());
            toast.success('Đã cập nhật cấp phát cho task');
            setShowAllocateModal(false);
            await loadCore();
            await loadReports();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật cấp phát');
        } finally {
            setSavingAllocation(false);
        }
    };

    const loadSourcePlanForRequest = async (requestId: number) => {
        try {
            setSourcePlanLoadingByRequest((prev) => ({ ...prev, [requestId]: true }));
            setSourcePlanErrorByRequest((prev) => ({ ...prev, [requestId]: null }));

            const sourcePlan = await preparationAPI.getAllocationAdjustmentSourcePlan(requestId);
            const normalized: AllocationAdjustmentDecisionSourceRequest[] = (sourcePlan ?? []).map(
                (item: AllocationAdjustmentSourcePlanItemDto) => ({
                    categoryId: item.categoryId,
                    amount: normalizeAmountInput(item.amount),
                })
            );

            setDecisionSourcesByRequest((prev) => ({ ...prev, [requestId]: normalized }));
            setSourcePlanLoadedByRequest((prev) => ({ ...prev, [requestId]: true }));
        } catch (e: any) {
            const message = e?.response?.data?.message || e?.message || 'Không thể lấy source-plan';
            setSourcePlanLoadedByRequest((prev) => ({ ...prev, [requestId]: false }));
            setSourcePlanErrorByRequest((prev) => ({ ...prev, [requestId]: message }));
            toast.error(message);
        } finally {
            setSourcePlanLoadingByRequest((prev) => ({ ...prev, [requestId]: false }));
        }
    };

    const updateDecisionSource = (
        requestId: number,
        index: number,
        patch: Partial<AllocationAdjustmentDecisionSourceRequest>
    ) => {
        setDecisionSourcesByRequest((prev) => {
            const list = prev[requestId] ?? [];
            if (!list[index]) return prev;
            const next = [...list];
            next[index] = { ...next[index], ...patch };
            return { ...prev, [requestId]: next };
        });
    };

    const addDecisionSource = (requestId: number) => {
        setDecisionSourcesByRequest((prev) => {
            const list = prev[requestId] ?? [];
            return {
                ...prev,
                [requestId]: [...list, { categoryId: budgetCategories[0]?.id ?? 0, amount: '' }],
            };
        });
    };

    const removeDecisionSource = (requestId: number, index: number) => {
        setDecisionSourcesByRequest((prev) => {
            const list = prev[requestId] ?? [];
            if (!list[index]) return prev;
            const next = list.filter((_, i) => i !== index);
            return { ...prev, [requestId]: next };
        });
    };

    const getApproveBlockReason = (requestId: number, requestAmount: string): string | null => {
        if (sourcePlanLoadingByRequest[requestId]) return 'Đang lấy source-plan...';
        if (!sourcePlanLoadedByRequest[requestId]) return 'Cần lấy source-plan trước khi duyệt.';
        if (sourcePlanErrorByRequest[requestId]) return sourcePlanErrorByRequest[requestId] || 'Source-plan không hợp lệ.';
        const sources = decisionSourcesByRequest[requestId] ?? [];
        if (sources.length === 0) return 'Source-plan rỗng. Không thể duyệt.';
        if (!sources.every((s) => s.categoryId > 0 && Number(s.amount) > 0)) {
            return 'Mỗi nguồn cần có ví và số tiền > 0.';
        }

        const requested = parseAmountToNumber(requestAmount);
        const allocated = sources.reduce((sum, s) => sum + parseAmountToNumber(s.amount), 0);
        if (Math.abs(allocated - requested) > 0.0001) {
            return 'Tổng nguồn phải bằng số tiền request.';
        }

        return null;
    };

    const canApproveAdjustment = (requestId: number) => {
        const request = adjustmentRequests.find((item) => item.id === requestId);
        if (!request) return false;
        return getApproveBlockReason(requestId, request.amount) === null;
    };

    const clearDecisionStateForRequest = (requestId: number) => {
        setDecisionSourcesByRequest((prev) => {
            const next = { ...prev };
            delete next[requestId];
            return next;
        });
        setSourcePlanLoadedByRequest((prev) => {
            const next = { ...prev };
            delete next[requestId];
            return next;
        });
        setSourcePlanLoadingByRequest((prev) => {
            const next = { ...prev };
            delete next[requestId];
            return next;
        });
        setSourcePlanErrorByRequest((prev) => {
            const next = { ...prev };
            delete next[requestId];
            return next;
        });
    };

    const decideAdjustmentRequest = async (requestId: number, approved: boolean) => {
        try {
            if (approved) {
                if (!sourcePlanLoadedByRequest[requestId]) {
                    toast.warning('Vui lòng lấy source-plan trước khi duyệt.');
                    return;
                }
                const request = adjustmentRequests.find((item) => item.id === requestId);
                const blockReason = request ? getApproveBlockReason(requestId, request.amount) : 'Không tìm thấy request.';
                if (blockReason) {
                    toast.warning(blockReason);
                    return;
                }

                const normalizedSources = (decisionSourcesByRequest[requestId] ?? []).map((s) => ({
                    categoryId: s.categoryId,
                    amount: String(s.amount).trim(),
                }));

                await preparationAPI.adminDecideAllocationAdjustment(requestId, {
                    approved: true,
                    categoryId: normalizedSources.length === 1 ? normalizedSources[0].categoryId : undefined,
                    sources: normalizedSources,
                });
            } else {
                await preparationAPI.adminDecideAllocationAdjustment(requestId, { approved: false });
            }
            toast.success(approved ? 'Đã duyệt adjustment request' : 'Đã từ chối adjustment request');
            clearDecisionStateForRequest(requestId);
            await loadAdjustmentRequests();
            await loadCore();
            await loadReports();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể xử lý adjustment request');
        }
    };

    if (!Number.isFinite(id) || id <= 0) {
        return (
            <div className="space-y-4">
                <div className="card">
                    <div className="p-6">
                        <div className="text-sm text-gray-600">ActivityId không hợp lệ.</div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44]"></div>
            </div>
        );
    }

    const decideFundAdvance = async (
        fundAdvanceId: number,
        approved: boolean,
        studentId?: number,
        studentName?: string | null
    ) => {
        if (approved && studentId) {
            const holding = debtByStudentId[studentId] ?? 0;
            if (holding > 0) {
                const ok = window.confirm(
                    `${studentName || `#${studentId}`} đang giữ ${formatMoney(String(holding))}. Bạn vẫn muốn duyệt yêu cầu này?`
                );
                if (!ok) return;
            }
        }
        try {
            await preparationAPI.adminDecideFundAdvance(fundAdvanceId, approved);
            toast.success(approved ? 'Đã duyệt yêu cầu tạm ứng' : 'Đã từ chối yêu cầu tạm ứng');
            await loadFundAdvanceData();
            await loadReports();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể xử lý yêu cầu tạm ứng');
        }
    };

    const returnFundAdvance = async (fundAdvanceId: number) => {
        try {
            await preparationAPI.returnFundAdvance(fundAdvanceId);
            toast.success('Đã hoàn ứng và chuyển SETTLED');
            await loadFundAdvanceData();
            await loadReports();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể hoàn ứng');
        }
    };

    const downloadPreparationExport = async (reportType: PreparationExportType, format: PreparationExportFormat) => {
        const key = getExportKey(reportType, format);
        try {
            setExportingByKey((prev) => ({ ...prev, [key]: true }));

            let payload: { blob: Blob; contentDisposition?: string };
            if (reportType === 'financial') {
                payload = await preparationAPI.downloadFinancialExport(id, format);
            } else if (reportType === 'operational') {
                payload = await preparationAPI.downloadOperationalExport(id, format);
            } else {
                payload = await preparationAPI.downloadAuditExport(id, format);
            }

            const fileName =
                parseFileNameFromContentDisposition(payload.contentDisposition) ||
                getExportDefaultFileName(reportType, format);

            const url = window.URL.createObjectURL(payload.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setLastFailedExport(null);

            toast.success(`Đã bắt đầu tải ${fileName}`);
        } catch (e: any) {
            setLastFailedExport({ reportType, format });
            toast.error(e?.response?.data?.message || e?.message || 'Không thể xuất báo cáo');
        } finally {
            setExportingByKey((prev) => ({ ...prev, [key]: false }));
        }
    };

    const reviewPreparationExportPdf = async (reportType: PreparationExportType) => {
        const key = getExportKey(reportType, 'pdf');
        try {
            setExportingByKey((prev) => ({ ...prev, [key]: true }));

            let payload: { blob: Blob; contentDisposition?: string };
            if (reportType === 'financial') {
                payload = await preparationAPI.downloadFinancialExport(id, 'pdf');
            } else if (reportType === 'operational') {
                payload = await preparationAPI.downloadOperationalExport(id, 'pdf');
            } else {
                payload = await preparationAPI.downloadAuditExport(id, 'pdf');
            }

            const previewUrl = window.URL.createObjectURL(payload.blob);
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => window.URL.revokeObjectURL(previewUrl), 60000);
            setLastFailedExport(null);
            toast.success('Đã mở review PDF ở tab mới');
        } catch (e: any) {
            setLastFailedExport({ reportType, format: 'pdf' });
            toast.error(e?.response?.data?.message || e?.message || 'Không thể review PDF báo cáo');
        } finally {
            setExportingByKey((prev) => ({ ...prev, [key]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44] flex items-center">
                        <span className="mr-3 text-4xl">🧩</span>
                        Chi tiết chuẩn bị
                    </h1>
                    <p className="mt-2 text-gray-600">{activity ? activity.name : `Activity #${id}`}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/manager/preparation')}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Quay lại
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePreparation(!hasPreparation)}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${hasPreparation
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                    >
                        {hasPreparation ? 'Chuẩn bị: Bật' : 'Chuẩn bị: Tắt'}
                    </button>
                </div>
            </div>

            {!hasPreparation ? (
                <div className="card">
                    <div className="p-6">
                        <div className="text-sm text-gray-600">Chức năng chuẩn bị đang tắt cho hoạt động này.</div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="card">
                        <div className="p-4 sm:p-6">
                            <div className="overflow-x-auto">
                                <div className="inline-flex items-center gap-2 min-w-max">
                                    {managerTabs.map((t) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => setManagerTab(t.key)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${managerTab === t.key
                                                ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {managerTab === 'overview' && (
                        <div className="space-y-6">
                            <FinanceReports 
                                loading={loadingReports}
                                financeOverview={financeOverview}
                                cashFlowReport={cashFlowReport}
                            />
                            
                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-6">
                                <div className="card">
                                    <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-[#001C44]">Organizer</h2>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddOrganizer(true)}
                                            className="btn-yellow px-5 py-2 rounded-lg text-sm font-medium"
                                        >
                                            + Thêm organizer
                                        </button>
                                    </div>
                                    {organizers.length === 0 ? (
                                        <div className="text-sm text-gray-500">Chưa có organizer.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {organizers.map((o) => (
                                                <div key={o.studentId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                                                    <div className="text-sm font-medium text-gray-900">{o.fullName}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOrganizer(o.studentId)}
                                                        className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <BudgetSetupPanel
                                activityId={id}
                                financeMessage={dashboard?.financeMessage}      
                                onBudgetSaved={loadCore}
                            />
                        </div>
                        </div>
                    )}

                    {showExportSection && (
                        <div className="card">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-[#001C44]">Xuất báo cáo</h2>
                                    <div className="flex items-center gap-2">
                                        {lastFailedExport && (
                                            <button
                                                type="button"
                                                onClick={() => downloadPreparationExport(lastFailedExport.reportType, lastFailedExport.format)}
                                                disabled={Boolean(exportingByKey[getExportKey(lastFailedExport.reportType, lastFailedExport.format)])}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Thử lại lần tải gần nhất
                                            </button>
                                        )}
                                        <span className="text-xs text-gray-500">Có thể review PDF trước khi tải</span>
                                    </div>
                                </div>

                                {[
                                    {
                                        key: 'financial' as PreparationExportType,
                                        title: 'Financial',
                                        subtitle: 'Budget vs Actual + Cash Flow + Debts',
                                    },
                                    {
                                        key: 'operational' as PreparationExportType,
                                        title: 'Operational',
                                        subtitle: 'Tasks + Workload + Evidence',
                                    },
                                    {
                                        key: 'audit' as PreparationExportType,
                                        title: 'Audit',
                                        subtitle: 'Audit logs + Reserve transfers',
                                    },
                                ].map((item) => {
                                    const xlsxKey = getExportKey(item.key, 'xlsx');
                                    const pdfKey = getExportKey(item.key, 'pdf');
                                    return (
                                        <div
                                            key={item.key}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 rounded-lg p-3"
                                        >
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                                                <div className="text-xs text-gray-500">{item.subtitle}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => reviewPreparationExportPdf(item.key)}
                                                    disabled={Boolean(exportingByKey[pdfKey])}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exportingByKey[pdfKey] ? 'Đang mở review...' : 'Review PDF'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => downloadPreparationExport(item.key, 'xlsx')}
                                                    disabled={Boolean(exportingByKey[xlsxKey])}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exportingByKey[xlsxKey] ? 'Đang xuất XLSX...' : 'Tải XLSX'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => downloadPreparationExport(item.key, 'pdf')}
                                                    disabled={Boolean(exportingByKey[pdfKey])}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exportingByKey[pdfKey] ? 'Đang xuất PDF...' : 'Tải PDF'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {showTaskTable && (
                        <div className="card">
                        <div className="p-6">
                            {showTaskTable && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                    <h2 className="text-lg font-semibold text-[#001C44]">
                                        Task Center
                                    </h2>
                                    <button type="button" onClick={openTaskModal} className="btn-yellow px-5 py-2 rounded-lg text-sm font-medium">
                                        + Tạo nhiệm vụ
                                    </button>
                                </div>
                            )}

                            {showTaskTable && (dashboard?.tasks?.length ? (
                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài chính</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã cấp phát</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {dashboard.tasks.map((t: PreparationTaskDto) => (
                                                <tr key={t.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                                                        {t.description && <div className="text-xs text-gray-500 mt-1">{t.description}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{t.ownerName || `#${t.ownerId}`}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{t.isFinancial ? 'Yes' : 'No'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{formatMoney(t.allocatedAmount)}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${taskStatusBadgeClass(t.status)}`}>
                                                            {taskStatusLabel(t.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {t.deadline ? new Date(t.deadline).toLocaleString('vi-VN') : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {t.status === 'COMPLETION_REQUESTED' && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => decideTaskCompletion(t.id, false)}
                                                                        disabled={decidingTaskCompletionId === t.id}
                                                                        className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Từ chối
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => decideTaskCompletion(t.id, true)}
                                                                        disabled={decidingTaskCompletionId === t.id}
                                                                        className="px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Xác nhận
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => openTaskDetail(t.id)}
                                                                className="px-3 py-1.5 text-sm font-medium border border-[#001C44] text-[#001C44] rounded-lg hover:bg-[#001C44] hover:text-white"
                                                            >
                                                                Xem chi tiết
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">Chưa có nhiệm vụ.</div>
                            ))}

                            {showAllocationSection && (
                                <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Yêu Cầu Bổ Sung Cấp Phát</div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Filter</label>
                                        <select
                                            value={adjustmentFilter}
                                            onChange={(e) => setAdjustmentFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                        >
                                            <option value="ALL">Tất cả</option>
                                            <option value="PENDING">Chờ xử lý</option>
                                            <option value="APPROVED">Đã duyệt</option>
                                            <option value="REJECTED">Từ chối</option>
                                        </select>
                                    </div>

                                    {loadingAdjustments ? (
                                        <div className="text-sm text-gray-500">Đang tải requests...</div>
                                    ) : adjustmentRequests.length === 0 ? (
                                        <div className="text-sm text-gray-500">Chưa có adjustment request.</div>
                                    ) : (
                                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhiệm Vụ</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Tiền</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý Do / Mô Tả</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người Yêu Cầu</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguồn Duyệt</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {adjustmentRequests.map((r) => {
                                                        const taskTitle = financialTasks.find((t) => t.id === r.taskId)?.title || `#${r.taskId}`;
                                                        return (
                                                        <tr key={r.id}>
                                                            <td className="px-4 py-3 text-sm text-gray-700">{taskTitle}</td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(r.amount)}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate" title={r.description || ''}>{r.description || '-'}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">{r.requestedByName || `#${r.requestedById}`}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">{r.status}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {r.status === 'PENDING' ? (
                                                                    <div className="space-y-2 min-w-[340px]">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => loadSourcePlanForRequest(r.id)}
                                                                                disabled={sourcePlanLoadingByRequest[r.id]}
                                                                                className="px-3 py-1.5 text-xs font-semibold border border-[#001C44] text-[#001C44] rounded-lg hover:bg-[#001C44] hover:text-white disabled:opacity-50"
                                                                            >
                                                                                {sourcePlanLoadingByRequest[r.id] ? 'Đang lấy plan...' : (sourcePlanLoadedByRequest[r.id] ? 'Lấy lại source-plan' : 'Lấy source-plan')}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => addDecisionSource(r.id)}
                                                                                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                                                            >
                                                                                + Nguồn
                                                                            </button>
                                                                        </div>

                                                                        {sourcePlanErrorByRequest[r.id] && (
                                                                            <div className="text-xs text-red-600">{sourcePlanErrorByRequest[r.id]}</div>
                                                                        )}

                                                                        {(decisionSourcesByRequest[r.id] ?? []).length === 0 ? (
                                                                            <div className="text-xs text-gray-500">Chưa có nguồn. Vui lòng lấy source-plan trước khi duyệt.</div>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                {(decisionSourcesByRequest[r.id] ?? []).map((source, sourceIndex) => (
                                                                                    <div key={`${r.id}-${sourceIndex}`} className="grid grid-cols-12 gap-2">
                                                                                        <div className="col-span-6">
                                                                                            <select
                                                                                                value={source.categoryId || ''}
                                                                                                onChange={(e) => {
                                                                                                    const v = Number(e.target.value);
                                                                                                    updateDecisionSource(r.id, sourceIndex, {
                                                                                                        categoryId: Number.isFinite(v) && v > 0 ? v : 0,
                                                                                                    });
                                                                                                }}
                                                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#001C44]"
                                                                                            >
                                                                                                <option value="">Chọn ví</option>
                                                                                                {budgetCategories.map((c) => (
                                                                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="col-span-4">
                                                                                            <input
                                                                                                type="text"
                                                                                                value={source.amount}
                                                                                                onChange={(e) => updateDecisionSource(r.id, sourceIndex, { amount: e.target.value })}
                                                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#001C44]"
                                                                                                placeholder="Số tiền"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="col-span-2 flex justify-end">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => removeDecisionSource(r.id, sourceIndex)}
                                                                                                className="px-2 py-1 text-xs font-semibold text-red-700 border border-red-200 rounded hover:bg-red-50"
                                                                                            >
                                                                                                Xóa
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {(() => {
                                                                            const sources = decisionSourcesByRequest[r.id] ?? [];
                                                                            const total = sources.reduce((sum, s) => sum + parseAmountToNumber(s.amount), 0);
                                                                            const requested = parseAmountToNumber(r.amount);
                                                                            const matched = Math.abs(total - requested) <= 0.0001;
                                                                            return (
                                                                                <div className={`rounded-lg border px-2.5 py-2 text-xs ${matched ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                                                                    <div className="font-semibold">Tổng nguồn: {formatMoney(String(total))}</div>
                                                                                    <div>Yêu cầu: {formatMoney(r.amount)} {matched ? '• Khớp' : '• Chưa khớp'}</div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {r.status === 'PENDING' ? (
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => decideAdjustmentRequest(r.id, true)}
                                                                                disabled={!canApproveAdjustment(r.id)}
                                                                                className="px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            >
                                                                                Duyệt
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => decideAdjustmentRequest(r.id, false)}
                                                                                className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
                                                                            >
                                                                                Từ chối
                                                                            </button>
                                                                        </div>
                                                                        {!canApproveAdjustment(r.id) && (
                                                                            <div className="text-[11px] text-gray-500 text-right max-w-[220px]">
                                                                                {getApproveBlockReason(r.id, r.amount)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">-</span>
                                                                )}
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

                            {showFundSection && (
                                <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Yêu Cầu Tạm Ứng</div>
                                <div className="p-4 space-y-4">
                                    {loadingFundAdvances ? (
                                        <div className="text-sm text-gray-500">Đang tải yêu cầu tạm ứng...</div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700 mb-2">Chờ duyệt (REQUESTED)</div>
                                                {fundAdvances.filter((f) => f.status === 'REQUESTED').length === 0 ? (
                                                    <div className="text-sm text-gray-500">Không có yêu cầu REQUESTED.</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {fundAdvances
                                                            .filter((f) => f.status === 'REQUESTED')
                                                            .map((f) => (
                                                                <div key={f.id} className="expense-item pending-leader">
                                                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                                                        <div>
                                                                            <div className="text-sm font-semibold text-gray-900">{f.studentName || `#${f.studentId}`} • {formatMoney(f.amount)}</div>
                                                                            <div className="text-xs text-gray-500 mt-1">Task #{f.taskId} • Ví: {f.categoryName} • Người tạo: {f.requestedByName || `#${f.requestedById}`}</div>
                                                                            <div className="text-xs text-gray-500 mt-1">Tạo lúc: {new Date(f.createdAt).toLocaleString('vi-VN')}</div>
                                                                            {(debtByStudentId[f.studentId] ?? 0) > 0 && (
                                                                                <div className="text-xs text-amber-700 mt-1">
                                                                                    Cảnh báo: đang có khoản HOLDING {formatMoney(String(debtByStudentId[f.studentId]))}.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => decideFundAdvance(f.id, true, f.studentId, f.studentName)}
                                                                                className="px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100"
                                                                            >
                                                                                Duyệt
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => decideFundAdvance(f.id, false, f.studentId, f.studentName)}
                                                                                className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
                                                                            >
                                                                                Từ chối
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-gray-200">
                                                <div className="text-sm font-semibold text-gray-700 mb-2">Đang giữ tiền (HOLDING, có thể hoàn ứng)</div>
                                                {fundAdvances.filter((f) => f.status === 'HOLDING').length === 0 ? (
                                                    <div className="text-sm text-gray-500">Không có khoản HOLDING.</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {fundAdvances
                                                            .filter((f) => f.status === 'HOLDING')
                                                            .map((f) => (
                                                                <div key={f.id} className="expense-item pending-admin">
                                                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                                                        <div>
                                                                            <div className="text-sm font-semibold text-gray-900">{f.studentName || `#${f.studentId}`} • Còn giữ: {formatMoney(f.remainingAmount)}</div>
                                                                            <div className="text-xs text-gray-500 mt-1">Task #{f.taskId} • Ví: {f.categoryName} • Duyệt lúc: {f.decidedAt ? new Date(f.decidedAt).toLocaleString('vi-VN') : '-'}</div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => returnFundAdvance(f.id)}
                                                                            className="px-3 py-1.5 text-sm font-medium bg-[#001C44] bg-opacity-10 text-[#001C44] rounded-lg border border-[#001C44] border-opacity-20 hover:bg-opacity-20"
                                                                            title="Xác nhận thành viên đã nộp lại tiền dư để tất toán khoản tạm ứng."
                                                                        >
                                                                            Hoàn ứng
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            )}

                            {showFundSection && (
                                <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Báo Cáo Tiền Ngoài Ví (Nợ Tạm Ứng)</div>
                                <div className="p-4">
                                    {loadingDebts ? (
                                        <div className="text-sm text-gray-500">Đang tải báo cáo nợ tạm ứng...</div>
                                    ) : fundAdvanceDebts.length === 0 ? (
                                        <div className="text-sm text-gray-500">Không có nợ tạm ứng trong activity.</div>
                                    ) : (
                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đang giữ</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {[...fundAdvanceDebts]
                                                        .sort((a, b) => parseAmountToNumber(b.holdingAmount) - parseAmountToNumber(a.holdingAmount))
                                                        .map((d) => (
                                                        <tr key={d.studentId}>
                                                            <td className="px-4 py-3 text-sm text-gray-700">{d.studentName || `#${d.studentId}`}</td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-[#001C44]">{formatMoney(d.holdingAmount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}

                            {showFundSection && (
                                <div className="mt-5">
                                    <AdminExpenseReviewCard
                                        expenses={expenses}
                                        loading={loadingExpenses}
                                        statusFilter={expenseFilter}
                                        onStatusFilterChange={(status) => {
                                            setExpenseFilter(status);
                                            loadExpenses(status);
                                        }}
                                        onDecision={approveExpense}
                                        onViewEvidence={(url) => setImageModalUrl(url)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </>
            )}

            {selectedTaskId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 z-10 rounded-t-2xl border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#FFD66D] border border-white/20 mb-2">
                                        Trung tâm nhiệm vụ
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Chi tiết nhiệm vụ</h3>
                                    <p className="text-xs text-gray-200 mt-0.5">Nhiệm vụ #{selectedTaskId} • Theo dõi thông tin và quản lý thành viên</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTaskId(null);
                                        setTaskDetail(null);
                                        setTaskDetailMembers([]);
                                        setShowTaskAdvanceHistory(false);
                                        setShowTaskAllocationSources(false);
                                        setTaskAdvanceHistory([]);
                                        setTaskAllocationSources([]);
                                    }}
                                    className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:text-[#FFD66D] hover:bg-white/20 transition-colors"
                                >
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {loadingTaskDetail ? (
                                <div className="text-sm text-gray-500">Đang tải chi tiết nhiệm vụ...</div>
                            ) : !taskForMembers ? (
                                <div className="text-sm text-gray-500">Không có dữ liệu nhiệm vụ.</div>
                            ) : (
                                <>
                                    <div className="card overflow-hidden">
                                        <div className="bg-gradient-to-r from-[#001C44]/5 to-[#FFD66D]/20 px-5 py-3 border-b border-gray-200">
                                            <div className="text-lg font-semibold text-[#001C44]">Thông tin nhiệm vụ</div>
                                        </div>
                                        <div className="p-5 space-y-3 bg-white">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700">Tiêu đề</div>
                                                <div className="text-sm text-gray-900 mt-1">{taskForMembers.title}</div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/70">
                                                    <div className="text-sm font-semibold text-gray-700">Trưởng nhóm</div>
                                                    <div className="text-sm text-gray-900 mt-1">{taskForMembers.ownerName || `#${taskForMembers.ownerId}`}</div>
                                                </div>
                                                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/70">
                                                    <div className="text-sm font-semibold text-gray-700">Trạng thái</div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${taskStatusBadgeClass(taskForMembers.status)}`}>
                                                        {taskStatusLabel(taskForMembers.status)}
                                                    </span>
                                                </div>
                                                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/70">
                                                    <div className="text-sm font-semibold text-gray-700">Đã cấp phát</div>
                                                    <div className="text-sm text-gray-900 mt-1">{formatMoney(taskForMembers.allocatedAmount)}</div>
                                                    {taskForMembers.isFinancial && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTaskAllocationSources(true)}
                                                            className="mt-2 px-2.5 py-1 text-xs font-medium border border-[#001C44] text-[#001C44] rounded-lg hover:bg-[#001C44] hover:text-white"
                                                        >
                                                            Xem nguồn
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/70">
                                                    <div className="text-sm font-semibold text-gray-700">Deadline</div>
                                                    <div className="text-sm text-gray-900 mt-1">{taskForMembers.deadline ? new Date(taskForMembers.deadline).toLocaleString('vi-VN') : '-'}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700">Mô tả</div>
                                                <div className="text-sm text-gray-900 mt-1">{taskForMembers.description || '-'}</div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                                {taskForMembers.isFinancial && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openAllocateModal(taskForMembers)}
                                                        className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                                                    >
                                                        Phân bổ
                                                    </button>
                                                )}
                                                {taskForMembers.isFinancial && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTaskAdvanceHistory((prev) => !prev)}
                                                        className="px-3 py-1.5 text-sm font-medium border border-[#001C44] text-[#001C44] rounded-lg hover:bg-[#001C44] hover:text-white"
                                                    >
                                                        {showTaskAdvanceHistory ? 'Ẩn lịch sử tạm ứng' : 'Xem lịch sử tạm ứng'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {taskForMembers.isFinancial && showTaskAllocationSources && (
                                        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                                            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-5 py-3 flex items-center justify-between">
                                                    <div className="text-sm font-semibold text-white">Nguồn cấp phát theo ví</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTaskAllocationSources(false)}
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10"
                                                    >
                                                        <span className="sr-only">Đóng</span>
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex justify-end mb-3">
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!taskForMembers?.id) return;
                                                                try {
                                                                    setLoadingTaskAllocationSources(true);
                                                                    const list = await preparationAPI.getTaskAllocationSources(taskForMembers.id);
                                                                    setTaskAllocationSources(list ?? []);
                                                                } catch {
                                                                    setTaskAllocationSources([]);
                                                                } finally {
                                                                    setLoadingTaskAllocationSources(false);
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
                                                        >
                                                            Tải lại
                                                        </button>
                                                    </div>
                                                    {loadingTaskAllocationSources ? (
                                                        <div className="text-sm text-gray-500">Đang tải nguồn cấp phát...</div>
                                                    ) : taskAllocationSources.length === 0 ? (
                                                        <div className="text-sm text-gray-500">Chưa có dữ liệu allocation theo ví cho nhiệm vụ này.</div>
                                                    ) : (
                                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ví</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã cấp phát</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đang tạm ứng</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã chi duyệt</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Còn lại</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {taskAllocationSources.map((item) => (
                                                                        <tr key={item.categoryId}>
                                                                            <td className="px-4 py-3 text-sm text-gray-700">{item.categoryName}</td>
                                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(item.allocatedAmount)}</td>
                                                                            <td className="px-4 py-3 text-sm text-gray-700">{formatMoney(item.holdingAdvanceAmount)}</td>
                                                                            <td className="px-4 py-3 text-sm text-gray-700">{formatMoney(item.approvedSpentAmount)}</td>
                                                                            <td className="px-4 py-3 text-sm font-semibold text-[#001C44]">{formatMoney(item.allocationRemainingAmount)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {taskForMembers.isFinancial && showTaskAdvanceHistory && (
                                        <div className="card overflow-hidden">
                                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                                                <div className="text-sm font-semibold text-gray-700">Lịch sử tạm ứng của nhiệm vụ</div>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!taskForMembers?.id) return;
                                                        try {
                                                            setLoadingTaskAdvanceHistory(true);
                                                            const list = await preparationAPI.listFundAdvancesByTask(taskForMembers.id);
                                                            setTaskAdvanceHistory(list ?? []);
                                                        } catch {
                                                            setTaskAdvanceHistory([]);
                                                        } finally {
                                                            setLoadingTaskAdvanceHistory(false);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
                                                >
                                                    Tải lại
                                                </button>
                                            </div>
                                            <div className="p-4">
                                                {loadingTaskAdvanceHistory ? (
                                                    <div className="text-sm text-gray-500">Đang tải lịch sử tạm ứng...</div>
                                                ) : taskAdvanceHistory.length === 0 ? (
                                                    <div className="text-sm text-gray-500">Chưa có giao dịch tạm ứng cho nhiệm vụ này.</div>
                                                ) : (
                                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                                                                {taskAdvanceHistory.map((item) => (
                                                                    <tr key={item.id}>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">{item.studentName || `#${item.studentId}`}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">{item.categoryName || '-'}</td>
                                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(item.amount)}</td>
                                                                        <td className="px-4 py-3 text-sm font-semibold text-[#001C44]">{formatMoney(item.remainingAmount)}</td>
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${fundAdvanceStatusBadgeClass(item.status)}`}>
                                                                                {fundAdvanceStatusLabel(item.status)}
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
                                        </div>
                                    )}

                                    <TaskMemberManager
                                        task={taskForMembers}
                                        organizers={organizers}
                                        workloadWarnings={workloadWarnings}
                                        onChanged={async () => {
                                            await loadCore();
                                            await refreshTaskMembers();
                                            if (selectedTaskId) {
                                                await openTaskDetail(selectedTaskId);
                                            }
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddOrganizer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Thêm organizer</h3>
                                    <p className="text-xs text-gray-200 mt-0.5">Tìm sinh viên và thêm vào BTC</p>
                                </div>
                                <button type="button" onClick={closeAddOrganizerModal} className="text-white hover:text-[#FFD66D] transition-colors">
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="prep-organizer-search" className="block text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</label>
                                <input
                                    id="prep-organizer-search"
                                    name="prepOrganizerSearch"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Nhập tên hoặc mã sinh viên..."
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                                <p className="mt-1 text-xs text-gray-500">Nhập ít nhất 2 ký tự để tìm kiếm</p>
                                {selectedStudentIds.length > 0 && (
                                    <p className="mt-1 text-xs text-[#001C44] font-medium">Đã chọn {selectedStudentIds.length} người để thêm.</p>
                                )}
                            </div>

                            {searching ? (
                                <div className="text-center py-6">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001C44] mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-600">Đang tìm kiếm...</p>
                                </div>
                            ) : searchResults.length === 0 && searchQuery.trim().length >= 2 ? (
                                <div className="text-center py-8 text-gray-500">Không tìm thấy sinh viên.</div>
                            ) : (
                                searchResults.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg divide-y divide-gray-200">
                                        {searchResults.map((s: any) => {
                                            const isSelected = selectedStudentIds.includes(s.id);
                                            return (
                                            <div
                                                key={s.id}
                                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${isSelected ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] bg-opacity-10 border-l-4 border-[#001C44]' : ''
                                                    }`}
                                                onClick={() => toggleOrganizerCandidate(s.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900">{s.fullName}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">{s.studentCode} • {s.email}</div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="text-[#001C44] bg-[#FFD66D] rounded-full p-1">
                                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                )
                            )}

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeAddOrganizerModal}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={selectedStudentIds.length === 0 || addingOrganizer}
                                    onClick={addOrganizer}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    {addingOrganizer ? 'Đang thêm...' : `Thêm (${selectedStudentIds.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Tạo nhiệm vụ</h3>
                                </div>
                                <button type="button" onClick={() => setShowTaskModal(false)} className="text-white hover:text-[#FFD66D] transition-colors">
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="prep-task-leader" className="block text-sm font-semibold text-gray-700 mb-2">Leader</label>
                                <select
                                    id="prep-task-leader"
                                    name="prepTaskLeader"
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                    value={taskAssigneeId ?? ''}
                                    onChange={(e) => setTaskAssigneeId(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Chọn organizer</option>
                                    {organizers.map((o) => (
                                        <option key={o.studentId} value={o.studentId}>
                                            {o.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={taskIsFinancial}
                                        onChange={(e) => setTaskIsFinancial(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    Task tài chính
                                </label>
                                <div className="text-xs text-gray-500 mt-1">Bật để cho phép member tạo chi phí theo task này.</div>
                            </div>
                            <div>
                                <label htmlFor="prep-task-title" className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                                <input
                                    id="prep-task-title"
                                    name="prepTaskTitle"
                                    type="text"
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <label htmlFor="prep-task-desc" className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                                <textarea
                                    id="prep-task-desc"
                                    name="prepTaskDesc"
                                    value={taskDesc}
                                    onChange={(e) => setTaskDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <label htmlFor="prep-task-deadline" className="block text-sm font-semibold text-gray-700 mb-2">Deadline</label>
                                <input
                                    id="prep-task-deadline"
                                    name="prepTaskDeadline"
                                    type="datetime-local"
                                    value={taskDeadline}
                                    onChange={(e) => setTaskDeadline(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={creatingTask}
                                    onClick={createTask}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    {creatingTask ? 'Đang tạo...' : 'Tạo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAllocateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Phân bổ cho nhiệm vụ</h3>
                                    <p className="text-xs text-gray-200 mt-0.5">Cấp phát ngân sách cho task tài chính</p>
                                </div>
                                <button type="button" onClick={() => setShowAllocateModal(false)} className="text-white hover:text-[#FFD66D] transition-colors">
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="prep-allocate-category" className="block text-sm font-semibold text-gray-700 mb-2">Ví nguồn</label>
                                <select
                                    id="prep-allocate-category"
                                    name="prepAllocateCategory"
                                    value={allocCategoryId ?? ''}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setAllocCategoryId(Number.isFinite(v) && v > 0 ? v : null);
                                    }}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                >
                                    <option value="">Chọn ví nguồn...</option>
                                    {budgetCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({formatMoney(c.availableToAllocateAmount)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="prep-allocate-amount" className="block text-sm font-semibold text-gray-700 mb-2">Số tiền phân bổ</label>
                                <input
                                    id="prep-allocate-amount"
                                    name="prepAllocateAmount"
                                    type="text"
                                    value={allocAmount}
                                    onChange={(e) => setAllocAmount(e.target.value)}
                                    placeholder="Ví dụ: 3000000"
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAllocateModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={savingAllocation}
                                    onClick={saveAllocation}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingAllocation ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {imageModalUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                    <button type="button" onClick={() => setImageModalUrl(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="max-w-4xl max-h-[90vh] mx-4">
                        <img src={imageModalUrl} alt="evidence" className="max-w-full max-h-[90vh] object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
}


