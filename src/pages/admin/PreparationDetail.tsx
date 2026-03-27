
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventAPI, preparationAPI, studentAPI } from '../../services';
import {
    ActivityResponse,
    ExpenseDto,
    ExpenseStatus,
    ExpenseStatusFilter,
    FinancialReportDto,
    OrganizerDto,
    PreparationDashboardDto,
    PreparationTaskDto,
} from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

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

export default function PreparationDetail() {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();
    const id = Number(activityId);

    const [activity, setActivity] = useState<ActivityResponse | null>(null);
    const [dashboard, setDashboard] = useState<PreparationDashboardDto | null>(null);
    const [organizers, setOrganizers] = useState<OrganizerDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [expenseFilter, setExpenseFilter] = useState<ExpenseStatusFilter>('ALL');

    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetTotal, setBudgetTotal] = useState('');
    const [budgetCategories, setBudgetCategories] = useState<Array<{ name: string; allocatedAmount: string }>>([]);
    const [savingBudget, setSavingBudget] = useState(false);

    const [report, setReport] = useState<FinancialReportDto | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const [showAddOrganizer, setShowAddOrganizer] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [addingOrganizer, setAddingOrganizer] = useState(false);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskAssigneeId, setTaskAssigneeId] = useState<number | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskDeadline, setTaskDeadline] = useState<string>('');
    const [taskIsFinancial, setTaskIsFinancial] = useState(false);
    const [taskBudgetLimit, setTaskBudgetLimit] = useState('');
    const [creatingTask, setCreatingTask] = useState(false);

    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [allocTaskId, setAllocTaskId] = useState<number | null>(null);
    const [allocAmount, setAllocAmount] = useState('');
    const [savingAllocation, setSavingAllocation] = useState(false);

    const [showFundAdvanceModal, setShowFundAdvanceModal] = useState(false);
    const [faTaskId, setFaTaskId] = useState<number | null>(null);
    const [faAmount, setFaAmount] = useState('');
    const [faSearchQuery, setFaSearchQuery] = useState('');
    const [faSearching, setFaSearching] = useState(false);
    const [faResults, setFaResults] = useState<any[]>([]);
    const [faStudentId, setFaStudentId] = useState<number | null>(null);
    const [creatingFundAdvance, setCreatingFundAdvance] = useState(false);

    const hasPreparation = Boolean(dashboard?.hasPreparation);

    const loadCore = useCallback(async () => {
        try {
            setLoading(true);
            setLoadingReport(true);
            const [actRes, dash, orgs, rep] = await Promise.all([
                eventAPI.getEvent(id),
                preparationAPI.getDashboard(id).catch(() => null),
                preparationAPI.listOrganizers(id).catch(() => [] as OrganizerDto[]),
                preparationAPI.getFinancialReport(id).catch(() => null),
            ]);
            setActivity(actRes.status ? actRes.data ?? null : null);
            setDashboard(dash);
            setOrganizers(orgs);
            setReport(rep);
        } catch (e: any) {
            toast.error(e?.message || 'Không thể tải dữ liệu Preparation');
        } finally {
            setLoading(false);
            setLoadingReport(false);
        }
    }, [id]);

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

    useEffect(() => {
        if (!Number.isFinite(id) || id <= 0) return;
        loadCore();
    }, [id, loadCore]);

    useEffect(() => {
        if (!hasPreparation) return;
        loadExpenses(expenseFilter);
    }, [expenseFilter, hasPreparation, loadExpenses]);

    const togglePreparation = async (enabled: boolean) => {
        try {
            await preparationAPI.togglePreparation(id, enabled);
            toast.success(enabled ? 'Đã bật Preparation' : 'Đã tắt Preparation');
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái Preparation');
        }
    };

    const openBudgetModal = () => {
        setBudgetTotal(report?.totalBudget == null ? '' : String(report.totalBudget));
        setBudgetCategories(
            (report?.categories ?? []).map((c) => ({
                name: c?.name == null ? '' : String(c.name),
                allocatedAmount: c?.allocatedAmount == null ? '' : String(c.allocatedAmount),
            }))
        );
        setShowBudgetModal(true);
    };

    const saveBudget = async () => {
        try {
            const totalAmount = String(budgetTotal ?? '').trim();
            if (!totalAmount) {
                toast.warning('Vui lòng nhập tổng ngân sách');
                return;
            }
            setSavingBudget(true);
            await preparationAPI.upsertActivityBudget(id, {
                totalAmount,
                categories: budgetCategories
                    .map((c) => ({
                        name: String(c?.name ?? '').trim(),
                        allocatedAmount: String(c?.allocatedAmount ?? '').trim(),
                    }))
                    .filter((c) => c.name && c.allocatedAmount),
            });
            toast.success('Đã cập nhật ngân sách & hạng mục');
            setShowBudgetModal(false);
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật ngân sách');
        } finally {
            setSavingBudget(false);
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
        if (!selectedStudentId) return;
        try {
            setAddingOrganizer(true);
            await preparationAPI.addOrganizer(id, selectedStudentId);
            toast.success('Đã thêm organizer');
            setShowAddOrganizer(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedStudentId(null);
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể thêm organizer');
        } finally {
            setAddingOrganizer(false);
        }
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
        setTaskBudgetLimit('');
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
                budgetLimit: taskBudgetLimit.trim() ? taskBudgetLimit.trim() : null,
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

    const approveExpense = async (expenseId: number, approved: boolean) => {
        try {
            await preparationAPI.adminDecision(expenseId, approved);
            toast.success(approved ? 'Đã duyệt cấp admin' : 'Đã từ chối');
            await loadCore();
            await loadExpenses(expenseFilter);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái chi phí');
        }
    };

    const openAllocateModal = (task: PreparationTaskDto) => {
        setAllocTaskId(task.id);
        setAllocAmount(task.allocatedAmount ?? '');
        setShowAllocateModal(true);
    };

    const saveAllocation = async () => {
        if (!allocTaskId) return;
        if (!allocAmount.trim()) {
            toast.warning('Vui lòng nhập allocatedAmount');
            return;
        }
        try {
            setSavingAllocation(true);
            await preparationAPI.allocateTaskAmount(allocTaskId, allocAmount.trim());
            toast.success('Đã cập nhật cấp phát cho task');
            setShowAllocateModal(false);
            await loadCore();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật cấp phát');
        } finally {
            setSavingAllocation(false);
        }
    };

    const searchStudentsForFundAdvance = useCallback(async () => {
        if (faSearchQuery.trim().length < 2) {
            setFaResults([]);
            return;
        }
        try {
            setFaSearching(true);
            const res = await studentAPI.searchStudents(faSearchQuery.trim());
            if (res.status && res.data) {
                setFaResults(res.data.content || []);
            } else {
                setFaResults([]);
            }
        } catch {
            setFaResults([]);
        } finally {
            setFaSearching(false);
        }
    }, [faSearchQuery]);

    useEffect(() => {
        const t = setTimeout(searchStudentsForFundAdvance, 300);
        return () => clearTimeout(t);
    }, [searchStudentsForFundAdvance]);

    const openFundAdvanceModal = (task: PreparationTaskDto) => {
        setShowFundAdvanceModal(true);
        setFaTaskId(task.id);
        setFaAmount('');
        setFaSearchQuery('');
        setFaResults([]);
        setFaStudentId(null);
    };

    const createFundAdvance = async () => {
        if (!faTaskId) return;
        if (!faStudentId) {
            toast.warning('Vui lòng chọn member');
            return;
        }
        if (!faAmount.trim()) {
            toast.warning('Vui lòng nhập số tiền tạm ứng');
            return;
        }
        try {
            setCreatingFundAdvance(true);
            await preparationAPI.createFundAdvance(faTaskId, { studentId: faStudentId, amount: faAmount.trim() });
            toast.success('Đã tạo tạm ứng');
            setShowFundAdvanceModal(false);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tạo tạm ứng');
        } finally {
            setCreatingFundAdvance(false);
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44] flex items-center">
                        <span className="mr-3 text-4xl">🧩</span>
                        Preparation Detail
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
                        {hasPreparation ? 'Preparation: Bật' : 'Preparation: Tắt'}
                    </button>
                </div>
            </div>

            {!hasPreparation ? (
                <div className="card">
                    <div className="p-6">
                        <div className="text-sm text-gray-600">Preparation đang tắt cho activity này.</div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                        <div className="card">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-[#001C44]">Ngân sách</h2>
                                    <button
                                        type="button"
                                        onClick={openBudgetModal}
                                        className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                                    >
                                        Cập nhật
                                    </button>
                                </div>

                                {loadingReport ? (
                                    <div className="text-sm text-gray-500">Đang tải báo cáo tài chính...</div>
                                ) : !report ? (
                                    <div className="text-sm text-gray-500">{dashboard?.financeMessage || 'Chưa có ngân sách.'}</div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                            <div className="text-xs text-gray-500">Tổng ngân sách</div>
                                            <div className="text-lg font-bold text-[#001C44] mt-1">{formatMoney(report.totalBudget)}</div>
                                        </div>
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Hạng mục</div>
                                            {report.categories.length === 0 ? (
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
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <h2 className="text-lg font-semibold text-[#001C44]">Task</h2>
                                <button type="button" onClick={openTaskModal} className="btn-yellow px-5 py-2 rounded-lg text-sm font-medium">
                                    + Giao việc
                                </button>
                            </div>

                            {dashboard?.tasks?.length ? (
                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài chính</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BudgetLimit</th>
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
                                                    <td className="px-4 py-3 text-sm text-gray-700">{t.budgetLimit ? formatMoney(t.budgetLimit) : '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{t.status}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {t.deadline ? new Date(t.deadline).toLocaleString('vi-VN') : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {t.isFinancial ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openAllocateModal(t)}
                                                                    className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                                                                >
                                                                    Allocate
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openFundAdvanceModal(t)}
                                                                    className="px-3 py-1.5 text-sm font-medium bg-[#001C44] bg-opacity-10 text-[#001C44] rounded-lg border border-[#001C44] border-opacity-20 hover:bg-opacity-20"
                                                                >
                                                                    Tạm ứng
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">Chưa có nhiệm vụ.</div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <h2 className="text-lg font-semibold text-[#001C44]">Chi phí</h2>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="prep-expense-filter" className="text-sm font-medium text-gray-700">Filter</label>
                                    <select
                                        id="prep-expense-filter"
                                        name="prepExpenseFilter"
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                        value={expenseFilter}
                                        onChange={(e) => setExpenseFilter(e.target.value as ExpenseStatusFilter)}
                                    >
                                        <option value="ALL">ALL</option>
                                        <option value="PENDING_LEADER">PENDING_LEADER</option>
                                        <option value="PENDING_ADMIN">PENDING_ADMIN</option>
                                        <option value="APPROVED">APPROVED</option>
                                        <option value="REJECTED">REJECTED</option>
                                    </select>
                                </div>
                            </div>

                            {loadingExpenses ? (
                                <div className="text-sm text-gray-500">Đang tải...</div>
                            ) : expenses.length === 0 ? (
                                <div className="text-sm text-gray-500">Chưa có chi phí.</div>
                            ) : (
                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CreatedBy</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CreatedAt</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {expenses.map((ex) => {
                                                const imgUrl = getImageUrl(ex.evidenceUrl);
                                                return (
                                                    <tr key={ex.id}>
                                                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatMoney(ex.amount)}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{ex.description || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{ex.categoryName || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{ex.createdByName || `#${ex.createdById ?? ''}`}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(ex.createdAt).toLocaleString('vi-VN')}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(ex.status)}`}>
                                                                {expenseStatusLabel(ex.status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {imgUrl ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImageModalUrl(imgUrl)}
                                                                    className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                                                                >
                                                                    Xem
                                                                </button>
                                                            ) : (
                                                                <span className="text-sm text-gray-500">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {ex.status === 'PENDING_ADMIN' ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => approveExpense(ex.id, true)}
                                                                        className="px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100"
                                                                    >
                                                                        Duyệt
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => approveExpense(ex.id, false)}
                                                                        className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
                                                                    >
                                                                        Từ chối
                                                                    </button>
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
                </>
            )}

            {showBudgetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Cập nhật ngân sách</h3>
                                </div>
                                <button type="button" onClick={() => setShowBudgetModal(false)} className="text-white hover:text-[#FFD66D] transition-colors">
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="prep-budget-total" className="block text-sm font-semibold text-gray-700 mb-2">Tổng ngân sách</label>
                                <input
                                    id="prep-budget-total"
                                    name="prepBudgetTotal"
                                    type="text"
                                    value={budgetTotal}
                                    onChange={(e) => setBudgetTotal(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="block text-sm font-semibold text-gray-700">Hạng mục</div>
                                    <button
                                        type="button"
                                        onClick={() => setBudgetCategories((prev) => [...prev, { name: '', allocatedAmount: '' }])}
                                        className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        + Thêm hạng mục
                                    </button>
                                </div>
                                {budgetCategories.length === 0 ? (
                                    <div className="text-sm text-gray-500">Chưa có hạng mục.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {budgetCategories.map((c, idx) => (
                                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-7 gap-2 border border-gray-200 rounded-lg p-3">
                                                <div className="sm:col-span-4">
                                                    <input
                                                        id={`prep-budget-cat-name-${idx}`}
                                                        name={`prepBudgetCatName_${idx}`}
                                                        type="text"
                                                        value={c.name}
                                                        onChange={(e) =>
                                                            setBudgetCategories((prev) =>
                                                                prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                                                            )
                                                        }
                                                        placeholder="Tên hạng mục (Marketing, Hậu cần...)"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <input
                                                        id={`prep-budget-cat-amount-${idx}`}
                                                        name={`prepBudgetCatAmount_${idx}`}
                                                        type="text"
                                                        value={c.allocatedAmount}
                                                        onChange={(e) =>
                                                            setBudgetCategories((prev) =>
                                                                prev.map((x, i) => (i === idx ? { ...x, allocatedAmount: e.target.value } : x))
                                                            )
                                                        }
                                                        placeholder="Allocated"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                                    />
                                                </div>
                                                <div className="sm:col-span-1 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBudgetCategories((prev) => prev.filter((_, i) => i !== idx))}
                                                        className="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowBudgetModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={savingBudget}
                                    onClick={saveBudget}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    {savingBudget ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
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
                                <button type="button" onClick={() => setShowAddOrganizer(false)} className="text-white hover:text-[#FFD66D] transition-colors">
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
                                        {searchResults.map((s: any) => (
                                            <div
                                                key={s.id}
                                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${selectedStudentId === s.id ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] bg-opacity-10 border-l-4 border-[#001C44]' : ''
                                                    }`}
                                                onClick={() => setSelectedStudentId(s.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900">{s.fullName}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">{s.studentCode} • {s.email}</div>
                                                    </div>
                                                    {selectedStudentId === s.id && (
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
                                        ))}
                                    </div>
                                )
                            )}

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddOrganizer(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={!selectedStudentId || addingOrganizer}
                                    onClick={addOrganizer}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    {addingOrganizer ? 'Đang thêm...' : 'Thêm'}
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
                                    <h3 className="text-lg font-bold text-white">Giao việc</h3>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    <label htmlFor="prep-task-budgetLimit" className="block text-sm font-semibold text-gray-700 mb-2">BudgetLimit (tùy chọn)</label>
                                    <input
                                        id="prep-task-budgetLimit"
                                        name="prepTaskBudgetLimit"
                                        type="text"
                                        value={taskBudgetLimit}
                                        onChange={(e) => setTaskBudgetLimit(e.target.value)}
                                        placeholder="Ví dụ: 2000000"
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                    />
                                </div>
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
                                    <h3 className="text-lg font-bold text-white">Allocate cho task</h3>
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
                                <label htmlFor="prep-allocate-amount" className="block text-sm font-semibold text-gray-700 mb-2">AllocatedAmount</label>
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

            {showFundAdvanceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Tạo tạm ứng (FundAdvance)</h3>
                                    <p className="text-xs text-gray-200 mt-0.5">Tạo tạm ứng cho member theo task</p>
                                </div>
                                <button type="button" onClick={() => setShowFundAdvanceModal(false)} className="text-white hover:text-[#FFD66D] transition-colors">
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="prep-fa-search" className="block text-sm font-semibold text-gray-700 mb-2">Tìm member</label>
                                <input
                                    id="prep-fa-search"
                                    name="prepFundAdvanceSearch"
                                    type="text"
                                    value={faSearchQuery}
                                    onChange={(e) => setFaSearchQuery(e.target.value)}
                                    placeholder="Nhập tên hoặc mã sinh viên..."
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                                <p className="mt-1 text-xs text-gray-500">Nhập ít nhất 2 ký tự để tìm kiếm</p>
                            </div>

                            {faSearching ? (
                                <div className="text-center py-6">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001C44] mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-600">Đang tìm kiếm...</p>
                                </div>
                            ) : faResults.length === 0 && faSearchQuery.trim().length >= 2 ? (
                                <div className="text-center py-6 text-gray-500">Không tìm thấy sinh viên.</div>
                            ) : (
                                faResults.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg divide-y divide-gray-200">
                                        {faResults.map((s: any) => (
                                            <div
                                                key={s.id}
                                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${faStudentId === s.id ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] bg-opacity-10 border-l-4 border-[#001C44]' : ''}`}
                                                onClick={() => setFaStudentId(s.id)}
                                            >
                                                <div className="text-sm font-semibold text-gray-900">{s.fullName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{s.studentCode} • {s.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            <div>
                                <label htmlFor="prep-fa-amount" className="block text-sm font-semibold text-gray-700 mb-2">Số tiền tạm ứng</label>
                                <input
                                    id="prep-fa-amount"
                                    name="prepFundAdvanceAmount"
                                    type="text"
                                    value={faAmount}
                                    onChange={(e) => setFaAmount(e.target.value)}
                                    placeholder="Ví dụ: 500000"
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowFundAdvanceModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={!faStudentId || creatingFundAdvance}
                                    onClick={createFundAdvance}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creatingFundAdvance ? 'Đang tạo...' : 'Tạo'}
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

