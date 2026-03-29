import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { preparationAPI, studentAPI } from '../../services';
import ExpenseFormModal from './ExpenseFormModal';
import {
    BudgetCategoryDto,
    ExpenseDto,
    ExpenseStatus,
    ExpenseStatusFilter,
    FinancialReportDto,
    PreparationDashboardDto,
    PreparationTaskDto,
    PreparationTaskStatus,
} from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

type TabKey = 'TASKS' | 'FINANCE' | 'MY_EXPENSES' | 'LEADER_REVIEW';

function parseOrganizerTab(value: string | null): TabKey {
    if (value === 'FINANCE') return 'FINANCE';
    if (value === 'MY_EXPENSES') return 'MY_EXPENSES';
    if (value === 'LEADER_REVIEW') return 'LEADER_REVIEW';
    return 'TASKS';
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

    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [expenseFilter, setExpenseFilter] = useState<ExpenseStatusFilter>('ALL');

    const [report, setReport] = useState<FinancialReportDto | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const [onlyMine, setOnlyMine] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

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

    useEffect(() => {
        if (!dashboard?.hasPreparation) return;
        loadReport();
    }, [dashboard?.hasPreparation, loadReport]);

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

    useEffect(() => {
        if (!dashboard?.hasPreparation) return;
        if (tab !== 'FINANCE' && tab !== 'MY_EXPENSES' && tab !== 'LEADER_REVIEW') return;
        loadExpenses(expenseFilter);
    }, [dashboard?.hasPreparation, expenseFilter, loadExpenses, tab]);

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

    const requestTaskComplete = async (task: PreparationTaskDto) => {
        try {
            const updated = await preparationAPI.requestTaskComplete(task.id);
            setDashboard((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tasks: prev.tasks.map((t) => (t.id === task.id ? updated : t)),
                };
            });
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

    if (loading) return null;
    if (!dashboard || !dashboard.hasPreparation) return null;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-[#001C44]">Chuẩn bị sự kiện</h3>
                        <p className="text-sm text-gray-600 mt-1">Theo dõi nhiệm vụ và chi phí (dành cho BTC)</p>
                    </div>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-700">
                        Vai trò: {isLeaderOfAnyFinancialTask ? 'LEADER' : 'MEMBER'}
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
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
                        onClick={() => setTab('FINANCE')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'FINANCE'
                            ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        Tài chính
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('MY_EXPENSES')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'MY_EXPENSES'
                            ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        Chi phí của tôi
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('LEADER_REVIEW')}
                        disabled={!isLeaderOfAnyFinancialTask}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'LEADER_REVIEW'
                            ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Leader review
                    </button>
                </div>

                {tab === 'TASKS' && (
                    <div className="space-y-3">
                        {dashboard.tasks.length === 0 ? (
                            <div className="text-sm text-gray-500">Chưa có nhiệm vụ chuẩn bị.</div>
                        ) : (
                            dashboard.tasks.map((t) => {
                                const mine =
                                    studentId != null &&
                                    (typeof t.assigneeId !== 'number' || t.assigneeId === studentId);
                                return (
                                    <div key={t.id} className="border border-gray-200 rounded-xl p-4">
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
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    <span>
                                                        {t.ownerName ? `Leader: ${t.ownerName}` : `Leader: #${t.ownerId}`}
                                                    </span>
                                                    {t.deadline && (
                                                        <span className="ml-3">Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</span>
                                                    )}
                                                </div>
                                                {t.description && <p className="text-sm text-gray-600 mt-2">{t.description}</p>}
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                                                {t.status === 'PENDING' && mine && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateTaskStatus(t, 'ACCEPTED')}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                    >
                                                        Nhận</button>
                                                )}
                                                {t.status === 'ACCEPTED' && mine && isLeaderOfAnyFinancialTask && (
                                                    <button
                                                        type="button"
                                                        onClick={() => requestTaskComplete(t)}
                                                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                                    >
                                                        Yêu cầu hoàn thành</button>
                                                )}
                                                {t.status === 'ACCEPTED' && mine && !isLeaderOfAnyFinancialTask && (
                                                    <select
                                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                                        value={t.status}
                                                        onChange={(e) => updateTaskStatus(t, e.target.value as PreparationTaskStatus)}
                                                    >
                                                        <option value="ACCEPTED">ACCEPTED</option>
                                                    </select>
                                                )}
                                                {t.status === 'COMPLETION_REQUESTED' && !mine && (
                                                    <span className="px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg">
                                                        Chờ duyệt hoàn thành
                                                    </span>
                                                )}
                                                {t.status === 'COMPLETED' && (
                                                    <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg">
                                                        Hoàn thành
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {!mine && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                Bạn chỉ có thể cập nhật nhiệm vụ được giao cho mình.
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
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
                                        <span>{selectedTask.ownerName ? `Leader: ${selectedTask.ownerName}` : `Leader: #${selectedTask.ownerId}`}</span>
                                        <span className="ml-3">Allocated: {formatMoney(selectedTask.allocatedAmount)}</span>
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
                                    onClick={() => setShowAddExpense(true)}
                                    className="btn-yellow px-6 py-2 rounded-lg text-sm font-medium mt-4"
                                    disabled={!selectedTaskId || !selectedCategoryId}
                                >
                                    + Tạo chi phí
                                </button>
                            </div>
                        </div>

                        <div className="border border-[#001C44] border-opacity-15 rounded-xl p-4 bg-[#001C44] bg-opacity-5 text-xs text-gray-700">
                            Leader có thêm quyền duyệt cấp 1 ở tab Leader review. Member chỉ tạo và theo dõi chi phí.
                        </div>
                    </div>
                )}

                {tab === 'LEADER_REVIEW' && (
                    <div className="space-y-5">
                        {!isLeaderOfAnyFinancialTask ? (
                            <div className="text-sm text-gray-500">Bạn không có quyền Leader ở task tài chính nào.</div>
                        ) : !isLeaderOfSelectedTask ? (
                            <div className="text-sm text-gray-500">Hãy chọn task mà bạn là leader ở tab Tài chính để duyệt cấp 1.</div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Duyệt cấp 1 (Leader)</div>
                                <div className="p-4 bg-white text-sm text-gray-600">
                                    Chỉ hiển thị các khoản chi đang chờ leader duyệt thuộc task đã chọn.
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
                                    <option value="PENDING_LEADER">PENDING_LEADER</option>
                                    <option value="PENDING_ADMIN">PENDING_ADMIN</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
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

            {showAddExpense && (
                <ExpenseFormModal
                    open={showAddExpense}
                    financialTasks={financialTasks}
                    categories={categories}
                    initialTaskId={selectedTaskId}
                    initialCategoryId={selectedCategoryId}
                    submitting={submitting}
                    onClose={() => setShowAddExpense(false)}
                    onSubmit={submitExpense}
                />
            )}

            {imageModalUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={() => setImageModalUrl(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                    >
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
};

