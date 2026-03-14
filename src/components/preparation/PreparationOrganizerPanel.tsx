import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { preparationAPI, studentAPI } from '../../services';
import {
    ExpenseApprovalState,
    ExpenseDto,
    ExpenseStatusFilter,
    mapApproval,
    PreparationDashboardDto,
    PreparationTaskDto,
    PreparationTaskStatus,
} from '../../types';
import { getImageUrl } from '../../utils/imageUtils';
import { compressImage } from '../../utils/compressImage';

type TabKey = 'TASKS' | 'FINANCE';

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

function taskStatusLabel(s: PreparationTaskStatus) {
    if (s === 'PENDING') return 'Chưa nhận';
    if (s === 'ACCEPTED') return 'Đang làm';
    return 'Hoàn thành';
}

function taskStatusPillClass(s: PreparationTaskStatus) {
    if (s === 'COMPLETED') return 'bg-green-50 text-green-700 border border-green-200';
    if (s === 'ACCEPTED') return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-gray-50 text-gray-700 border border-gray-200';
}

export const PreparationOrganizerPanel: React.FC<{ activityId: number }> = ({ activityId }) => {
    const [dashboard, setDashboard] = useState<PreparationDashboardDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>('TASKS');

    const [studentId, setStudentId] = useState<number | null>(null);

    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [expenseFilter, setExpenseFilter] = useState<ExpenseStatusFilter>('ALL');

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

    const hasBudget = Boolean(dashboard?.budget);

    const budgetSummary = useMemo(() => {
        if (!dashboard?.budget) return null;
        return {
            total: dashboard.budget.totalAmount,
            spent: dashboard.budget.spentAmount,
            remaining: dashboard.budget.remainingAmount,
        };
    }, [dashboard]);

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
        if (!dashboard?.budget) return;
        loadExpenses(expenseFilter);
    }, [dashboard?.budget?.id, expenseFilter, loadExpenses, dashboard?.budget]);

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

    const onPickEvidence = async (file: File) => {
        try {
            const compressed = await compressImage(file);
            setEvidenceFile(compressed);
            const url = URL.createObjectURL(compressed);
            setEvidencePreview(url);
        } catch (e: any) {
            toast.error(e?.message || 'Không thể xử lý ảnh');
        }
    };

    const clearEvidence = () => {
        if (evidencePreview) URL.revokeObjectURL(evidencePreview);
        setEvidencePreview(null);
        setEvidenceFile(null);
    };

    const submitExpense = async () => {
        if (!dashboard?.budget) return;
        if (!amount.trim()) {
            toast.warning('Vui lòng nhập số tiền');
            return;
        }

        try {
            setSubmitting(true);
            let evidenceUrl: string | undefined;
            if (evidenceFile) {
                evidenceUrl = await preparationAPI.uploadEvidence(activityId, evidenceFile);
            }
            await preparationAPI.createExpense(activityId, {
                amount: amount.trim(),
                description: description.trim() || undefined,
                evidenceUrl,
            });
            toast.success('Đã gửi chi phí (chờ duyệt)');
            setShowAddExpense(false);
            setAmount('');
            setDescription('');
            clearEvidence();
            await loadExpenses(expenseFilter);
            const dash = await preparationAPI.getDashboard(activityId);
            setDashboard(dash);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không thể tạo chi phí');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!hasBudget && tab === 'FINANCE') setTab('TASKS');
    }, [hasBudget, tab]);

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
                    {hasBudget && (
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
                    )}
                </div>

                {tab === 'TASKS' && (
                    <div className="space-y-3">
                        {dashboard.tasks.length === 0 ? (
                            <div className="text-sm text-gray-500">Chưa có nhiệm vụ chuẩn bị.</div>
                        ) : (
                            dashboard.tasks.map((t) => {
                                const mine = studentId != null && t.assigneeId === studentId;
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
                                                    <span>{t.assigneeName ? `Phụ trách: ${t.assigneeName}` : `Phụ trách: #${t.assigneeId}`}</span>
                                                    {t.deadline && (
                                                        <span className="ml-3">Hạn: {new Date(t.deadline).toLocaleString('vi-VN')}</span>
                                                    )}
                                                </div>
                                                {t.description && <p className="text-sm text-gray-600 mt-2">{t.description}</p>}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <select
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                                    value={t.status}
                                                    disabled={!mine}
                                                    onChange={(e) => updateTaskStatus(t, e.target.value as PreparationTaskStatus)}
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="ACCEPTED">ACCEPTED</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                </select>
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

                {tab === 'FINANCE' && dashboard.budget && budgetSummary && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                <div className="text-xs text-gray-500">Tổng ngân sách</div>
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

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
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
                            <button
                                type="button"
                                onClick={() => setShowAddExpense(true)}
                                className="btn-yellow px-6 py-2 rounded-lg text-sm font-medium"
                            >
                                + Thêm chi phí
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Danh sách chi phí</div>
                            {loadingExpenses ? (
                                <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                            ) : expenses.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">Chưa có khoản chi nào.</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {expenses.map((ex) => {
                                        const state = mapApproval(ex.approved);
                                        const imgUrl = getImageUrl(ex.evidenceUrl);
                                        return (
                                            <div key={ex.id} className="p-4 bg-white">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="text-sm font-semibold text-gray-900">{formatMoney(ex.amount)}</div>
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                                                                    state
                                                                )}`}
                                                            >
                                                                {state}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            <span>{ex.reportedByName ? `Báo cáo: ${ex.reportedByName}` : `Báo cáo: #${ex.reportedById}`}</span>
                                                            <span className="ml-3">{new Date(ex.createdAt).toLocaleString('vi-VN')}</span>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Thêm chi phí</h3>
                                    <p className="text-xs text-gray-200 mt-0.5">Gửi chi phí để quản trị duyệt</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddExpense(false);
                                        clearEvidence();
                                    }}
                                    className="text-white hover:text-[#FFD66D] transition-colors"
                                >
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Số tiền</label>
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Ví dụ: 120000"
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Mô tả chi phí (tùy chọn)"
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Chụp ảnh hóa đơn</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) onPickEvidence(f);
                                    }}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                />
                                {evidencePreview && (
                                    <div className="mt-3 flex items-start gap-3">
                                        <img
                                            src={evidencePreview}
                                            alt="preview"
                                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={clearEvidence}
                                            className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Xóa ảnh
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddExpense(false);
                                        clearEvidence();
                                    }}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={submitExpense}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    {submitting ? 'Đang gửi...' : 'Gửi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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

