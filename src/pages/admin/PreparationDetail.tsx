
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventAPI, preparationAPI, studentAPI } from '../../services';
import {
    ActivityResponse,
    ExpenseApprovalState,
    ExpenseDto,
    ExpenseStatusFilter,
    OrganizerDto,
    PreparationDashboardDto,
    PreparationTaskDto,
    mapApproval,
} from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
    const n = Number(amount);
    if (Number.isFinite(n)) return currencyFormatter.format(n);
    return amount;
}

function statusBadgeClass(state: ExpenseApprovalState) {
    if (state === 'APPROVED') return 'bg-green-50 text-green-700 border border-green-200';
    if (state === 'REJECTED') return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
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
    const [budgetDesc, setBudgetDesc] = useState('');
    const [savingBudget, setSavingBudget] = useState(false);

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
    const [creatingTask, setCreatingTask] = useState(false);

    const hasPreparation = Boolean(dashboard?.hasPreparation);

    const budgetSummary = useMemo(() => {
        if (!dashboard?.budget) return null;
        return {
            total: dashboard.budget.totalAmount,
            spent: dashboard.budget.spentAmount,
            remaining: dashboard.budget.remainingAmount,
        };
    }, [dashboard]);

    const loadCore = useCallback(async () => {
        try {
            setLoading(true);
            const [actRes, dash, orgs] = await Promise.all([
                eventAPI.getEvent(id),
                preparationAPI.getDashboard(id).catch(() => null),
                preparationAPI.listOrganizers(id).catch(() => [] as OrganizerDto[]),
            ]);
            setActivity(actRes.status ? actRes.data ?? null : null);
            setDashboard(dash);
            setOrganizers(orgs);
        } catch (e: any) {
            toast.error(e?.message || 'Không thể tải dữ liệu Preparation');
        } finally {
            setLoading(false);
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
        const total = dashboard?.budget?.totalAmount ?? '';
        const desc = dashboard?.budget?.description ?? '';
        setBudgetTotal(total);
        setBudgetDesc(desc);
        setShowBudgetModal(true);
    };

    const saveBudget = async () => {
        try {
            if (!budgetTotal.trim()) {
                toast.warning('Vui lòng nhập tổng ngân sách');
                return;
            }
            setSavingBudget(true);
            await preparationAPI.upsertBudget(id, { totalAmount: budgetTotal.trim(), description: budgetDesc.trim() || undefined });
            toast.success('Đã cập nhật ngân sách');
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
        setShowTaskModal(true);
    };

    const createTask = async () => {
        if (!taskAssigneeId) {
            toast.warning('Vui lòng chọn người phụ trách');
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
                assigneeId: taskAssigneeId,
                title: taskTitle.trim(),
                description: taskDesc.trim() || undefined,
                deadline,
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
            await preparationAPI.setExpenseApproval(expenseId, approved);
            toast.success(approved ? 'Đã duyệt chi phí' : 'Đã từ chối chi phí');
            await loadCore();
            await loadExpenses(expenseFilter);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái chi phí');
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

                                {dashboard?.budget && budgetSummary ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                            <div className="text-xs text-gray-500">Tổng</div>
                                            <div className="text-lg font-bold text-[#001C44] mt-1">{formatMoney(budgetSummary.total)}</div>
                                        </div>
                                        <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                            <div className="text-xs text-gray-500">Đã chi (APPROVED)</div>
                                            <div className="text-lg font-bold text-[#001C44] mt-1">{formatMoney(budgetSummary.spent)}</div>
                                        </div>
                                        <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                            <div className="text-xs text-gray-500">Còn lại</div>
                                            <div className="text-lg font-bold text-[#001C44] mt-1">{formatMoney(budgetSummary.remaining)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">{dashboard?.financeMessage || 'Chưa có ngân sách.'}</div>
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
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {dashboard.tasks.map((t: PreparationTaskDto) => (
                                                <tr key={t.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                                                        {t.description && <div className="text-xs text-gray-500 mt-1">{t.description}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{t.assigneeName || `#${t.assigneeId}`}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{t.status}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {t.deadline ? new Date(t.deadline).toLocaleString('vi-VN') : '-'}
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
                                    <label className="text-sm font-medium text-gray-700">Filter</label>
                                    <select
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                        value={expenseFilter}
                                        onChange={(e) => setExpenseFilter(e.target.value as ExpenseStatusFilter)}
                                    >
                                        <option value="ALL">ALL</option>
                                        <option value="PENDING">PENDING</option>
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
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ReportedBy</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CreatedAt</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {expenses.map((ex) => {
                                                const state = mapApproval(ex.approved);
                                                const imgUrl = getImageUrl(ex.evidenceUrl);
                                                return (
                                                    <tr key={ex.id}>
                                                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatMoney(ex.amount)}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{ex.description || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{ex.reportedByName || `#${ex.reportedById}`}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(ex.createdAt).toLocaleString('vi-VN')}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(state)}`}>
                                                                {state}
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
                                                            {state === 'WAITING_APPROVAL' ? (
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tổng ngân sách</label>
                                <input
                                    type="text"
                                    value={budgetTotal}
                                    onChange={(e) => setBudgetTotal(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                                <textarea
                                    value={budgetDesc}
                                    onChange={(e) => setBudgetDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</label>
                                <input
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Assignee</label>
                                <select
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
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                                <input
                                    type="text"
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                                <textarea
                                    value={taskDesc}
                                    onChange={(e) => setTaskDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline</label>
                                <input
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

