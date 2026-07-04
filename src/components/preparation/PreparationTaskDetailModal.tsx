import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { preparationAPI, registrationAPI } from '../../services';
import AllocationAdjustmentRequestModal from './AllocationAdjustmentRequestModal';
import QRCodeScanner from '../qr/QRCodeScanner';
import { compressImage } from '../../utils/compressImage';
import { getImageUrl } from '../../utils/imageUtils';
import ImageUploadProof from './ImageUploadProof';
import TaskProofGallery from './TaskProofGallery';
import {
  ActivityBudgetDto,
  ExpenseCategorySuggestionDto,
  ExpenseDto,
  ExpenseStatus,
  ExpenseStatusFilter,
  FundAdvanceDebtDto,
  FundAdvanceDto,
  FundAdvanceSourceSuggestionDto,
  PreparationTaskDto,
  PreparationTaskMemberDto,
  PreparationTaskMemberRole,
  TaskAllocationSourceDto,
  TicketCodeValidateResponse,
  getParticipationTypeLabel,
} from '../../types';
import {
  formatCurrency,
  formatDateTime,
  getExpenseStatusBadgeClass,
  getExpenseStatusLabel,
  getFundAdvanceStatusBadgeClass,
  getFundAdvanceStatusLabel,
  getMemberRoleBadgeClass,
  getMemberRoleLabel,
  getTaskStatusBadgeClass,
  getTaskStatusLabel,
} from '../../utils/preparationUtils';

type PreparationTaskDetailModalProps = {
  open: boolean;
  taskId: number | null;
  activityId: number;
  studentId: number | null;
  onClose: () => void;
  onTaskUpdated: (task: PreparationTaskDto) => void;
};

type ModalTab = 'DETAIL' | 'EXPENSES' | 'LEADER' | 'ADVANCE';

export default function PreparationTaskDetailModal({
  open,
  taskId,
  activityId,
  studentId,
  onClose,
  onTaskUpdated,
}: PreparationTaskDetailModalProps) {
  const [tab, setTab] = useState<ModalTab>('DETAIL');
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<PreparationTaskDto | null>(null);
  const [members, setMembers] = useState<PreparationTaskMemberDto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [loadingSources, setLoadingSources] = useState(false);
  const [sources, setSources] = useState<TaskAllocationSourceDto[] | null>(null);
  const [activityBudget, setActivityBudget] = useState<ActivityBudgetDto | null>(null);
  const [loadingActivityBudget, setLoadingActivityBudget] = useState(false);

  const [expenseFilter, setExpenseFilter] = useState<ExpenseStatusFilter>('ALL');
  const [onlyMine, setOnlyMine] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseSuggestions, setExpenseSuggestions] = useState<ExpenseCategorySuggestionDto[]>([]);
  const [loadingExpenseSuggestions, setLoadingExpenseSuggestions] = useState(false);
  const [expenseSuggestionFetchSuccess, setExpenseSuggestionFetchSuccess] = useState<boolean | null>(null);

  const [expenseCategoryId, setExpenseCategoryId] = useState<number | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const [showAllocationRequestModal, setShowAllocationRequestModal] = useState(false);

  const [fundAdvances, setFundAdvances] = useState<FundAdvanceDto[]>([]);
  const [loadingFundAdvances, setLoadingFundAdvances] = useState(false);
  const [myFundAdvances, setMyFundAdvances] = useState<FundAdvanceDto[]>([]);
  const [loadingMyFundAdvances, setLoadingMyFundAdvances] = useState(false);
  const [showMyAdvanceHistory, setShowMyAdvanceHistory] = useState(false);
  const [fundAdvanceFilter, setFundAdvanceFilter] = useState<'ALL' | 'REQUESTED' | 'HOLDING' | 'SETTLED' | 'REJECTED'>('ALL');
  const [faStudentId, setFaStudentId] = useState<number | null>(null);
  const [faAmount, setFaAmount] = useState('');
  const [faCategoryId, setFaCategoryId] = useState<number | null>(null);
  const [faSuggestions, setFaSuggestions] = useState<FundAdvanceSourceSuggestionDto[]>([]);
  const [faDebtWarning, setFaDebtWarning] = useState<string | null>(null);
  const [loadingFaSuggestions, setLoadingFaSuggestions] = useState(false);
  const [loadingFaDebt, setLoadingFaDebt] = useState(false);
  const [submittingFaRequest, setSubmittingFaRequest] = useState(false);

  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  // QR Check-in scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [isValidatingTicket, setIsValidatingTicket] = useState(false);
  const [validatedTicketInfo, setValidatedTicketInfo] = useState<TicketCodeValidateResponse | null>(null);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  useEffect(() => {
    if (!open || !taskId) return;
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const [t, m] = await Promise.all([preparationAPI.getTaskDetail(taskId), preparationAPI.getTaskMembers(taskId)]);
        if (!mounted) return;
        setTask(t);
        setMembers(m ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setTask(null);
        setMembers([]);
        toast.error(e?.response?.data?.message || e?.message || 'Không thể tải chi tiết nhiệm vụ');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [open, taskId]);

  useEffect(() => {
    if (!open) return;
    setTab('DETAIL');
    setSources(null);
    setActivityBudget(null);
    setExpenseFilter('ALL');
    setOnlyMine(true);
    setExpenses([]);
    setExpenseSuggestions([]);
    setExpenseCategoryId(null);
    setExpenseAmount('');
    setExpenseDescription('');
    setEvidenceFile(null);
    if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    setEvidencePreview(null);
    setFundAdvances([]);
    setMyFundAdvances([]);
    setShowMyAdvanceHistory(false);
    setFundAdvanceFilter('ALL');
    setFaStudentId(null);
    setFaAmount('');
    setFaCategoryId(null);
    setFaSuggestions([]);
    setFaDebtWarning(null);
    setImageModalUrl(null);
    setShowAllocationRequestModal(false);
    setProofUrls([]);
  }, [open]);

  const myRole = useMemo<PreparationTaskMemberRole | null>(() => {
    if (!studentId) return null;
    return members.find((m) => m.studentId === studentId)?.role ?? null;
  }, [members, studentId]);

  const isLeaderOrOwner = useMemo(() => {
    if (!task || !studentId) return false;
    return task.ownerId === studentId || myRole === 'LEADER';
  }, [myRole, studentId, task]);

  const canAccept = useMemo(() => {
    if (!task || !studentId) return false;
    if (task.status !== 'PENDING') return false;
    if (typeof task.assigneeId === 'number' && task.assigneeId !== studentId) return false;
    return true;
  }, [studentId, task]);

  const canAddExpense = useMemo(() => {
    if (!task || !studentId) return false;
    if (!task.isFinancial) return false;
    if (task.status === 'PENDING') return false;
    if (task.ownerId === studentId) return true;
    return myRole != null;
  }, [myRole, studentId, task]);

  const canViewAdvanceTab = useMemo(() => {
    if (!task || !studentId) return false;
    if (!task.isFinancial) return false;
    if (task.ownerId === studentId) return true;
    return myRole != null;
  }, [myRole, studentId, task]);

  const myHoldingAdvanceAmount = useMemo(() => {
    return (myFundAdvances ?? [])
      .filter((item) => item.status === 'HOLDING')
      .reduce((sum, item) => sum + (Number(item.remainingAmount) || 0), 0);
  }, [myFundAdvances]);

  const accept = async () => {
    if (!taskId) return;
    try {
      setSubmitting(true);
      const updated = await preparationAPI.acceptTask(taskId);
      setTask(updated);
      onTaskUpdated(updated);
      toast.success('Đã nhận nhiệm vụ');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể nhận nhiệm vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const requestComplete = async () => {
    if (!taskId) return;
    if (proofUrls.length === 0) {
      toast.warning('Vui lòng tải lên ít nhất 1 ảnh minh chứng');
      return;
    }
    try {
      setSubmitting(true);
      const updated = await preparationAPI.requestTaskComplete(taskId, { proofUrls });
      setTask(updated);
      onTaskUpdated(updated);
      toast.success('Đã gửi yêu cầu hoàn thành');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể gửi yêu cầu hoàn thành');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateTicket = async (code: string) => {
    if (!code.trim()) return;
    try {
      setIsValidatingTicket(true);
      const res = await registrationAPI.validateTicketCode(code.trim());
      if (res.status && res.body) {
        setValidatedTicketInfo(res.body);
        setShowScanner(false);
      } else {
        toast.error(res.message || 'Mã vé không hợp lệ hoặc không được phép quét');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Lỗi khi kiểm tra mã vé');
    } finally {
      setIsValidatingTicket(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!validatedTicketInfo) return;
    try {
      setSubmittingCheckIn(true);
      const res = await registrationAPI.checkIn({
        ticketCode: validatedTicketInfo.ticketCode,
        studentId: validatedTicketInfo.studentId,
      });
      if (res.status) {
        toast.success(res.message || 'Điểm danh thành công!');
        setValidatedTicketInfo(null);
        setTicketCode('');
      } else {
        toast.error(res.message || 'Điểm danh thất bại');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Lỗi khi điểm danh');
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const loadSources = async () => {
    if (!taskId) return;
    try {
      setLoadingSources(true);
      const list = await preparationAPI.getTaskAllocationSources(taskId);
      setSources(list ?? []);
    } catch (e: any) {
      setSources([]);
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tải nguồn cấp phát');
    } finally {
      setLoadingSources(false);
    }
  };

  const loadActivityBudget = async () => {
    try {
      setLoadingActivityBudget(true);
      const b = await preparationAPI.getActivityBudget(activityId);
      setActivityBudget(b);
    } catch {
      setActivityBudget(null);
    } finally {
      setLoadingActivityBudget(false);
    }
  };

  useEffect(() => {
    if (!open || !taskId) return;
    if (!task?.isFinancial) return;
    if (!isLeaderOrOwner) return;
    if (sources != null) return;
    loadSources().catch(() => null);
  }, [isLeaderOrOwner, open, task?.isFinancial, sources, taskId]);

  useEffect(() => {
    if (!open) return;
    if (!task?.isFinancial) return;
    if (tab !== 'EXPENSES' && tab !== 'LEADER' && tab !== 'ADVANCE') return;
    if (activityBudget != null) return;
    loadActivityBudget().catch(() => null);
  }, [activityBudget, open, tab, task?.isFinancial]);

  useEffect(() => {
    if (!open) return;
    if (!task?.isFinancial) return;
    if (expenseCategoryId != null) return;
    const sourceOptions = isLeaderOrOwner ? (sources ?? []) : [];
    const firstSource = sourceOptions.find((s) => Number(s.allocationRemainingAmount) > 0) ?? sourceOptions[0];
    if (firstSource) {
      setExpenseCategoryId(firstSource.categoryId);
      return;
    }
    const firstBudget = activityBudget?.categories?.[0];
    if (firstBudget) setExpenseCategoryId(firstBudget.id);
  }, [activityBudget?.categories, expenseCategoryId, isLeaderOrOwner, open, sources, task?.isFinancial]);

  const categoryOptions = useMemo(() => {
    if (!task?.isFinancial) return [];
    const hasAmountInput = expenseAmount.trim().length > 0;
    if (hasAmountInput && expenseSuggestionFetchSuccess === true) {
      return expenseSuggestions.map((s) => ({
        id: s.categoryId,
        label: `${s.categoryName} (tối đa ${formatCurrency(s.maxExpenseAmount)})`,
      }));
    }
    if (isLeaderOrOwner) {
      const list = sources ?? [];
      if (list.length > 0) {
        return list.map((s) => ({ id: s.categoryId, label: s.categoryName }));
      }
    }
    return (activityBudget?.categories ?? []).map((c) => ({ id: c.id, label: c.name }));
  }, [activityBudget?.categories, expenseAmount, expenseSuggestionFetchSuccess, expenseSuggestions, isLeaderOrOwner, sources, task?.isFinancial]);

  const loadExpenses = async (status: ExpenseStatusFilter) => {
    if (!open || !taskId) return;
    try {
      setLoadingExpenses(true);
      const list = await preparationAPI.listExpenses(activityId, status);
      const filtered = (list ?? []).filter((ex) => ex.taskId != null && ex.taskId === taskId);
      setExpenses(filtered);
    } catch (e: any) {
      setExpenses([]);
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tải danh sách chi phí');
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (!open || !taskId) return;
    if (tab !== 'EXPENSES' && tab !== 'LEADER') return;
    loadExpenses(expenseFilter).catch(() => null);
  }, [expenseFilter, open, tab, taskId]);

  useEffect(() => {
    if (!open || !taskId) return;
    if (tab !== 'EXPENSES') return;
    if (!task?.isFinancial) return;
    if (!expenseAmount.trim()) {
      setExpenseSuggestions([]);
      setExpenseSuggestionFetchSuccess(null);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        setLoadingExpenseSuggestions(true);
        const list = await preparationAPI.getExpenseCategorySuggestions(taskId, expenseAmount.trim());
        if (!mounted) return;

        const normalized = list ?? [];
        setExpenseSuggestions(normalized);
        setExpenseSuggestionFetchSuccess(true);

        if (normalized.length === 0) return;
        if (normalized.length === 1) {
          setExpenseCategoryId(normalized[0].categoryId);
          return;
        }

        const existing = expenseCategoryId != null && normalized.some((item) => item.categoryId === expenseCategoryId);
        if (!existing) {
          const defaultSuggestion = [...normalized].sort(
            (a, b) => (Number(b.maxExpenseAmount) || 0) - (Number(a.maxExpenseAmount) || 0)
          )[0];
          setExpenseCategoryId(defaultSuggestion?.categoryId ?? null);
        }
      } catch {
        if (!mounted) return;
        setExpenseSuggestions([]);
        setExpenseSuggestionFetchSuccess(false);
      } finally {
        if (mounted) setLoadingExpenseSuggestions(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [expenseAmount, expenseCategoryId, open, tab, task?.isFinancial, taskId]);

  const pickEvidence = async (file: File) => {
    const compressed = await compressImage(file);
    if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    setEvidenceFile(compressed);
    setEvidencePreview(URL.createObjectURL(compressed));
  };

  const clearEvidence = () => {
    if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    setEvidencePreview(null);
    setEvidenceFile(null);
  };

  const submitExpense = async () => {
    if (!taskId) return;
    if (!expenseCategoryId) {
      toast.warning('Vui lòng chọn hạng mục');
      return;
    }
    if (!expenseAmount.trim() || Number(expenseAmount) <= 0) {
      toast.warning('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (expenseSuggestionFetchSuccess === true && expenseSuggestions.length === 0) {
      toast.warning('Bạn chưa có tạm ứng HOLDING khả dụng cho ví này. Vui lòng xin tạm ứng trước khi tạo chi phí.');
      return;
    }
    if (
      expenseSuggestions.length > 0 &&
      expenseSuggestions.every((item) => (Number(item.maxExpenseAmount) || 0) <= 0)
    ) {
      toast.warning('Các ví gợi ý hiện không còn hạn mức khả dụng cho khoản chi này.');
      return;
    }

    try {
      setSubmittingExpense(true);
      let evidenceUrl: string | undefined;
      if (evidenceFile) {
        evidenceUrl = await preparationAPI.uploadEvidence(taskId, evidenceFile);
      }
      await preparationAPI.createExpense(taskId, {
        categoryId: expenseCategoryId,
        amount: expenseAmount.trim(),
        description: expenseDescription.trim() || null,
        evidenceUrl,
      });
      toast.success('Đã gửi chi phí (chờ leader duyệt)');
      setExpenseAmount('');
      setExpenseDescription('');
      clearEvidence();
      await loadExpenses(expenseFilter);
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
      setSubmittingExpense(false);
    }
  };

  const decideLeader = async (expenseId: number, approved: boolean) => {
    try {
      await preparationAPI.leaderDecision(expenseId, approved);
      toast.success(approved ? 'Đã duyệt cấp 1' : 'Đã từ chối');
      await loadExpenses(expenseFilter);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể xử lý duyệt');
    }
  };

  const loadFundAdvances = async () => {
    if (!taskId) return;
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
  };

  useEffect(() => {
    if (!open || !taskId) return;
    if (tab !== 'ADVANCE') return;
    if (!isLeaderOrOwner) return;
    loadFundAdvances().catch(() => null);
  }, [isLeaderOrOwner, open, tab, taskId]);

  useEffect(() => {
    if (!open || !taskId || !studentId) {
      setMyFundAdvances([]);
      return;
    }
    if (tab !== 'ADVANCE' && tab !== 'EXPENSES') return;

    let mounted = true;
    const run = async () => {
      try {
        setLoadingMyFundAdvances(true);
        const list = await preparationAPI.getMyFundAdvances(activityId, taskId);
        if (!mounted) return;
        setMyFundAdvances(list ?? []);
      } catch {
        if (!mounted) return;
        setMyFundAdvances([]);
      } finally {
        if (mounted) setLoadingMyFundAdvances(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [activityId, open, studentId, tab, taskId]);

  useEffect(() => {
    if (!open || !taskId) return;
    if (tab !== 'ADVANCE') return;
    if (!faAmount.trim()) {
      setFaSuggestions([]);
      setFaCategoryId(null);
      return;
    }
    let mounted = true;
    const run = async () => {
      try {
        setLoadingFaSuggestions(true);
        const list = await preparationAPI.getFundAdvanceSourceSuggestions(taskId, faAmount.trim());
        if (!mounted) return;
        setFaSuggestions(list ?? []);
        if (!list.some((x) => x.categoryId === faCategoryId)) {
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
  }, [faAmount, faCategoryId, open, tab, taskId]);

  useEffect(() => {
    if (!open) return;
    if (tab !== 'ADVANCE') return;
    if (!faStudentId) {
      setFaDebtWarning(null);
      return;
    }
    let mounted = true;
    const run = async () => {
      try {
        setLoadingFaDebt(true);
        const debts: FundAdvanceDebtDto[] = await preparationAPI.getFundAdvanceDebts(activityId, faStudentId);
        if (!mounted) return;
        const debt = (debts ?? []).find((d) => Number(d.holdingAmount) > 0);
        if (!debt) {
          setFaDebtWarning(null);
          return;
        }
        setFaDebtWarning(`Thành viên này đang giữ ${formatCurrency(debt.holdingAmount)} từ kỳ trước. Cần dứt điểm trước khi tạo yêu cầu mới.`);
      } catch {
        if (!mounted) return;
        setFaDebtWarning(null);
      } finally {
        if (mounted) setLoadingFaDebt(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [activityId, faStudentId, open, tab]);

  const submitFundAdvanceRequest = async () => {
    if (!taskId) return;
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
      await preparationAPI.requestFundAdvance(taskId, {
        studentId: faStudentId,
        categoryId: faCategoryId,
        amount: faAmount.trim(),
      });
      toast.success('Đã tạo yêu cầu tạm ứng, chờ admin duyệt');
      setFaAmount('');
      setFaCategoryId(null);
      setFaSuggestions([]);
      await loadFundAdvances();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tạo yêu cầu tạm ứng');
    } finally {
      setSubmittingFaRequest(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">Chi tiết nhiệm vụ</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {!!task && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getTaskStatusBadgeClass(task.status)}`}>
                    {getTaskStatusLabel(task.status)}
                  </span>
                )}
                {myRole && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getMemberRoleBadgeClass(myRole)}`}>
                    {getMemberRoleLabel(myRole)}
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-white hover:text-[#FFD66D] transition-colors">
              <span className="sr-only">Đóng</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="text-sm text-gray-500">Đang tải...</div>
          ) : !task ? (
            <div className="text-sm text-gray-500">Không tìm thấy nhiệm vụ.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab('DETAIL')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tab === 'DETAIL' ? 'bg-[#001C44] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                  Chi tiết
                </button>
                {task.isFinancial && (
                  <button
                    type="button"
                    onClick={() => setTab('EXPENSES')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tab === 'EXPENSES' ? 'bg-[#001C44] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Chi phí
                  </button>
                )}
                {task.isFinancial && isLeaderOrOwner && (
                  <>
                    {isLeaderOrOwner && (
                      <button
                        type="button"
                        onClick={() => setTab('LEADER')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tab === 'LEADER' ? 'bg-[#001C44] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        Duyệt chi phí
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTab('ADVANCE')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tab === 'ADVANCE' ? 'bg-[#001C44] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      Tạm ứng
                    </button>
                  </>
                )}
              </div>

              {tab === 'DETAIL' && (
                <div className="space-y-5">
                  <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-bold text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>{task.ownerName ? `Trưởng nhóm: ${task.ownerName}` : `Trưởng nhóm: #${task.ownerId}`}</span>
                          {task.deadline && <span>Hạn: {formatDateTime(task.deadline)}</span>}
                          {task.isFinancial && <span>Cấp phát: {formatCurrency(task.allocatedAmount)}</span>}
                        </div>
                        {task.description && <div className="text-sm text-gray-600 mt-2 whitespace-pre-line">{task.description}</div>}
                        {task.completionProofUrls && task.completionProofUrls.length > 0 && (
                          <div className="mt-4">
                            <TaskProofGallery proofUrls={task.completionProofUrls} />
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center gap-2">
                        {task.status === 'PENDING' && (
                          <button
                            type="button"
                            disabled={!canAccept || submitting}
                            onClick={accept}
                            className="px-4 py-2 bg-[#001C44] text-white rounded-lg text-sm font-semibold hover:bg-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Nhận nhiệm vụ
                          </button>
                        )}
                      </div>
                    </div>
                    {task.status === 'ACCEPTED' && isLeaderOrOwner && (
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Minh chứng hoàn thành</h4>
                            <ImageUploadProof
                              taskId={task.id}
                              uploadedUrls={proofUrls}
                              setUploadedUrls={setProofUrls}
                            />
                          </div>
                          <div className="shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={requestComplete}
                              className="w-full sm:w-auto px-4 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg text-sm font-semibold hover:bg-[#FFC947] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Yêu cầu hoàn thành
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                      <span>Thành viên trong task</span>
                      <span className="text-xs text-gray-500">{members.length} người</span>
                    </div>
                    {members.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">Chưa có thành viên.</div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {members.map((m) => (
                          <div key={m.studentId} className="p-4 bg-white flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{m.studentName || `#${m.studentId}`}</div>
                              <div className="text-xs text-gray-500 mt-0.5">ID: {m.studentId}</div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getMemberRoleBadgeClass(m.role)}`}>
                              {getMemberRoleLabel(m.role)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {task.isFinancial && isLeaderOrOwner && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                        <span>Nguồn cấp phát</span>
                        <button
                          type="button"
                          onClick={() => loadSources()}
                          className="text-xs font-semibold text-[#001C44] hover:underline disabled:opacity-50"
                          disabled={loadingSources}
                        >
                          {loadingSources ? 'Đang tải...' : 'Tải lại'}
                        </button>
                      </div>
                      {sources == null ? (
                        <div className="p-4 text-sm text-gray-500">Đang tải nguồn cấp phát...</div>
                      ) : sources.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">Chưa có dữ liệu nguồn cấp phát.</div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {sources.map((s) => (
                            <div key={s.categoryId} className="p-4 bg-white">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">{s.categoryName}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Đã cấp phát: {formatCurrency(s.allocatedAmount)} · Đang tạm ứng: {formatCurrency(s.holdingAdvanceAmount)}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-sm font-semibold text-[#001C44]">{formatCurrency(s.allocationRemainingAmount)}</div>
                                  <div className="text-xs text-gray-500">Còn lại</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">Đã chi (duyệt): {formatCurrency(s.approvedSpentAmount)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {task.isCheckinScanner && task.status === 'ACCEPTED' && (myRole !== null || task.ownerId === studentId) && (
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 bg-blue-50/30">
                      <h4 className="text-base font-bold text-[#001C44] mb-3 flex items-center gap-2">
                        <span>📷</span> Nhiệm vụ quét QR điểm danh
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Bạn được phân công làm người quét QR check-in cho sự kiện này. Quét QR code trên vé của sinh viên khác để xác nhận tham gia.
                      </p>

                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nhập mã vé thủ công..."
                            value={ticketCode}
                            onChange={(e) => setTicketCode(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] text-sm bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleValidateTicket(ticketCode)}
                            disabled={isValidatingTicket || !ticketCode.trim()}
                            className="px-4 py-2 bg-[#001C44] text-white rounded-lg text-sm font-semibold hover:bg-[#002A66] disabled:opacity-50"
                          >
                            {isValidatingTicket ? 'Đang kiểm tra...' : 'Kiểm tra'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowScanner(!showScanner)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700"
                          >
                            {showScanner ? 'Đóng Camera' : 'Mở Camera'}
                          </button>
                        </div>

                        {showScanner && (
                          <div className="border border-gray-200 rounded-xl overflow-hidden bg-black max-w-sm mx-auto p-4">
                            <QRCodeScanner
                              onScan={handleValidateTicket}
                              onError={(error) => console.error('QR Scanner error:', error)}
                              onClose={() => setShowScanner(false)}
                            />
                          </div>
                        )}

                        {validatedTicketInfo && (
                          <div className="border border-green-200 rounded-xl p-4 bg-green-50/50 space-y-3">
                            <div className="text-sm font-semibold text-green-950">Thông tin vé đã quét:</div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                              <div>Sinh viên:</div>
                              <div className="font-semibold">{validatedTicketInfo.studentName}</div>
                              <div>MSSV:</div>
                              <div className="font-semibold">{validatedTicketInfo.studentCode}</div>
                              <div className="text-xs text-gray-500">Trạng thái</div>
                              <div className="font-semibold">{getParticipationTypeLabel(validatedTicketInfo.currentStatus as any)}</div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={handleConfirmCheckIn}
                                disabled={submittingCheckIn || (!validatedTicketInfo.canCheckIn && !validatedTicketInfo.canCheckOut)}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submittingCheckIn ? 'Đang xử lý...' : validatedTicketInfo.canCheckOut ? 'Xác nhận Check-out' : 'Xác nhận Check-in'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setValidatedTicketInfo(null);
                                  setTicketCode('');
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'EXPENSES' && task.isFinancial && (
                <div className="space-y-5">
                  {canViewAdvanceTab && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-[#001C44]/5 to-[#FFD66D]/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Tạm ứng tôi đang giữ</div>
                          <div className="text-xs text-gray-600 mt-1">Tổng theo trạng thái HOLDING trong activity/task hiện tại.</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#001C44]">{formatCurrency(String(myHoldingAdvanceAmount))}</div>
                          <div className="text-xs text-gray-500">
                            {loadingMyFundAdvances ? 'Đang tải...' : `${myFundAdvances.length} khoản trong danh sách của tôi`}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowMyAdvanceHistory((prev) => !prev)}
                            className="mt-1 px-2.5 py-1 text-[11px] font-semibold border border-gray-300 rounded-lg hover:bg-white"
                          >
                            {showMyAdvanceHistory ? 'Ẩn lịch sử của tôi' : 'Xem lịch sử của tôi'}
                          </button>
                        </div>
                      </div>

                      {showMyAdvanceHistory && (
                        <div className="mt-3 border border-gray-200 rounded-lg overflow-x-auto bg-white">
                          {loadingMyFundAdvances ? (
                            <div className="p-3 text-xs text-gray-500">Đang tải lịch sử tạm ứng của tôi...</div>
                          ) : myFundAdvances.length === 0 ? (
                            <div className="p-3 text-xs text-gray-500">Bạn chưa có lịch sử tạm ứng trong task này.</div>
                          ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ví nguồn</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Số tiền</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Còn giữ</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {myFundAdvances.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-3 py-2 text-xs text-gray-700">{item.categoryName}</td>
                                    <td className="px-3 py-2 text-xs font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                                    <td className="px-3 py-2 text-xs font-semibold text-[#001C44]">{formatCurrency(item.remainingAmount)}</td>
                                    <td className="px-3 py-2 text-xs">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getFundAdvanceStatusBadgeClass(item.status)}`}>
                                        {getFundAdvanceStatusLabel(item.status)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900">Tạo chi phí</div>
                      {isLeaderOrOwner && (
                        <button
                          type="button"
                          onClick={() => setShowAllocationRequestModal(true)}
                          className="px-4 py-2 bg-[#001C44] text-white rounded-lg text-sm font-semibold hover:bg-[#002A66]"
                        >
                          Bổ sung cấp phát
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-xs text-gray-500">Nhiệm vụ</div>
                        <div className="mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50">{task.title}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Hạng mục</div>
                        <select
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                          value={expenseCategoryId ?? ''}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setExpenseCategoryId(Number.isFinite(v) && v > 0 ? v : null);
                          }}
                          disabled={!task.isFinancial || (categoryOptions.length === 0 && !loadingActivityBudget)}
                        >
                          <option value="">Chọn hạng mục...</option>
                          {categoryOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        {loadingExpenseSuggestions ? (
                          <div className="text-xs text-gray-500 mt-1">Đang lấy gợi ý ví chi tiêu...</div>
                        ) : expenseAmount.trim() && expenseSuggestionFetchSuccess === true && expenseSuggestions.length === 0 ? (
                          <div className="text-xs text-amber-700 mt-1">Không có ví phù hợp cho khoản chi này do bạn chưa có tạm ứng HOLDING khả dụng. Hãy xin tạm ứng trước.</div>
                        ) : expenseSuggestions.length === 1 ? (
                          <div className="text-xs text-green-700 mt-1">Hệ thống đã tự chọn ví vì nhiệm vụ chỉ còn 1 nguồn phù hợp.</div>
                        ) : expenseSuggestions.length > 1 ? (
                          <div className="text-xs text-gray-500 mt-1">Đã gợi ý ví theo hạn mức; mặc định là ví có khả dụng cao nhất.</div>
                        ) : (
                          loadingActivityBudget && <div className="text-xs text-gray-500 mt-1">Đang tải danh sách hạng mục...</div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Số tiền</div>
                        <input
                          type="text"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="Ví dụ: 120000"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Minh chứng</div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) pickEvidence(f).catch(() => null);
                          }}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-gray-500">Nội dung</div>
                      <textarea
                        rows={3}
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        placeholder="Mô tả chi phí (tùy chọn)"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                      />
                    </div>
                    {evidencePreview && (
                      <div className="mt-3 flex items-start gap-3">
                        <img src={evidencePreview} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={clearEvidence} className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">
                          Xóa ảnh
                        </button>
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={submitExpense}
                        disabled={!canAddExpense || submittingExpense}
                        className="px-5 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg text-sm font-semibold hover:bg-[#FFC947] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingExpense ? 'Đang gửi...' : 'Gửi chi phí'}
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-700">Danh sách chi phí</div>
                        <select
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
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" className="h-4 w-4" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
                          Chi phí của tôi
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadExpenses(expenseFilter)}
                        className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        disabled={loadingExpenses}
                      >
                        {loadingExpenses ? 'Đang tải...' : 'Tải lại'}
                      </button>
                    </div>
                    {loadingExpenses ? (
                      <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                    ) : expenses.filter((ex) => !onlyMine || !studentId || ex.createdById === studentId).length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">Chưa có khoản chi nào.</div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {expenses
                          .filter((ex) => !onlyMine || !studentId || ex.createdById === studentId)
                          .map((ex) => {
                            const imgUrl = getImageUrl(ex.evidenceUrl);
                            return (
                              <div key={ex.id} className="p-4 bg-white">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(ex.amount)}</div>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getExpenseStatusBadgeClass(ex.status as ExpenseStatus)}`}>
                                        {getExpenseStatusLabel(ex.status as ExpenseStatus)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      <span>{ex.createdByName ? `Người gửi: ${ex.createdByName}` : `Người gửi: #${ex.createdById ?? ''}`}</span>
                                      <span className="ml-3">{new Date(ex.createdAt).toLocaleString('vi-VN')}</span>
                                      {ex.categoryName && <span className="ml-3">Hạng mục: {ex.categoryName}</span>}
                                    </div>
                                    {ex.description && <div className="text-sm text-gray-600 mt-2">{ex.description}</div>}
                                  </div>
                                  <div className="shrink-0">
                                    {imgUrl ? (
                                      <button type="button" onClick={() => setImageModalUrl(imgUrl)} className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">
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

              {tab === 'LEADER' && task.isFinancial && isLeaderOrOwner && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                    <span>Duyệt chi phí</span>
                    <button
                      type="button"
                      onClick={() => loadExpenses(expenseFilter)}
                      className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      disabled={loadingExpenses}
                    >
                      {loadingExpenses ? 'Đang tải...' : 'Tải lại'}
                    </button>
                  </div>
                  {loadingExpenses ? (
                    <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                  ) : expenses.filter((ex) => ex.status === 'PENDING_LEADER').length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">Không có khoản chi chờ duyệt.</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {expenses
                        .filter((ex) => ex.status === 'PENDING_LEADER')
                        .map((ex) => {
                          const imgUrl = getImageUrl(ex.evidenceUrl);
                          return (
                            <div key={ex.id} className="p-4 bg-white">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(ex.amount)}</div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getExpenseStatusBadgeClass(ex.status as ExpenseStatus)}`}>
                                      {getExpenseStatusLabel(ex.status as ExpenseStatus)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <span>{ex.createdByName ? `Người gửi: ${ex.createdByName}` : `Người gửi: #${ex.createdById ?? ''}`}</span>
                                    {ex.categoryName && <span className="ml-3">Hạng mục: {ex.categoryName}</span>}
                                  </div>
                                  {ex.description && <div className="text-sm text-gray-600 mt-2">{ex.description}</div>}
                                </div>
                                <div className="shrink-0 flex flex-wrap items-center gap-2">
                                  {imgUrl && (
                                    <button type="button" onClick={() => setImageModalUrl(imgUrl)} className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">
                                      Minh chứng
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => decideLeader(ex.id, true)}
                                    className="px-3 py-2 bg-[#001C44] text-white rounded-lg text-sm font-semibold hover:bg-[#002A66]"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => decideLeader(ex.id, false)}
                                    className="px-3 py-2 bg-white text-[#001C44] border border-[#001C44] rounded-lg text-sm font-semibold hover:bg-gray-50"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'ADVANCE' && task.isFinancial && isLeaderOrOwner && (
                <div className="space-y-5">
                  {isLeaderOrOwner && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-white">
                      <div className="text-sm font-semibold text-gray-900">Tạo yêu cầu tạm ứng</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div>
                          <div className="text-xs text-gray-500">Thành viên</div>
                          <select
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                            value={faStudentId ?? ''}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setFaStudentId(Number.isFinite(v) && v > 0 ? v : null);
                            }}
                          >
                            <option value="">Chọn thành viên...</option>
                            {members.map((m) => (
                              <option key={m.studentId} value={m.studentId}>
                                {m.studentName || `#${m.studentId}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Số tiền</div>
                          <input
                            type="text"
                            value={faAmount}
                            onChange={(e) => setFaAmount(e.target.value)}
                            placeholder="Ví dụ: 500000"
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span>Ví nguồn gợi ý</span>
                            {loadingFaSuggestions && <span className="text-xs text-gray-400">Đang tải...</span>}
                          </div>
                          <select
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                            value={faCategoryId ?? ''}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setFaCategoryId(Number.isFinite(v) && v > 0 ? v : null);
                            }}
                            disabled={!faSuggestions.length}
                          >
                            <option value="">Chọn ví nguồn...</option>
                            {faSuggestions.map((s) => (
                              <option key={s.categoryId} value={s.categoryId}>
                                {s.categoryName} (tối đa {formatCurrency(s.maxAdvanceAmount)})
                              </option>
                            ))}
                          </select>
                          {!faAmount.trim() && <div className="text-xs text-gray-500 mt-1">Nhập số tiền để xem gợi ý ví nguồn.</div>}
                        </div>
                      </div>

                      {(loadingFaDebt || faDebtWarning) && (
                        <div className={`mt-3 p-3 rounded-lg text-sm ${faDebtWarning ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'text-gray-500'}`}>
                          {loadingFaDebt ? 'Đang kiểm tra công nợ...' : faDebtWarning}
                        </div>
                      )}

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={submitFundAdvanceRequest}
                          disabled={submittingFaRequest}
                          className="px-5 py-2 bg-[#001C44] text-white rounded-lg text-sm font-semibold hover:bg-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingFaRequest ? 'Đang gửi...' : 'Tạo yêu cầu'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-700">Lịch sử tạm ứng</div>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                        value={fundAdvanceFilter}
                        onChange={(e) => setFundAdvanceFilter(e.target.value as any)}
                      >
                        <option value="ALL">Tất cả</option>
                        <option value="REQUESTED">Chờ duyệt</option>
                        <option value="HOLDING">Đang giữ tiền</option>
                        <option value="SETTLED">Đã tất toán</option>
                        <option value="REJECTED">Từ chối</option>
                      </select>
                    </div>
                    {loadingFundAdvances ? (
                      <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                    ) : fundAdvances.filter((x) => fundAdvanceFilter === 'ALL' || x.status === fundAdvanceFilter).length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">Chưa có yêu cầu tạm ứng.</div>
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
                              .filter((x) => fundAdvanceFilter === 'ALL' || x.status === fundAdvanceFilter)
                              .map((x) => (
                                <tr key={x.id}>
                                  <td className="px-4 py-3 text-sm text-gray-700">{x.studentName || `#${x.studentId}`}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{x.categoryName}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(x.amount)}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-[#001C44]">{formatCurrency(x.remainingAmount)}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getFundAdvanceStatusBadgeClass(x.status)}`}>
                                      {getFundAdvanceStatusLabel(x.status)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-500">
                                    <div>Tạo: {new Date(x.createdAt).toLocaleString('vi-VN')}</div>
                                    {x.decidedAt && <div>Duyệt: {new Date(x.decidedAt).toLocaleString('vi-VN')}</div>}
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

              {showAllocationRequestModal && (
                <AllocationAdjustmentRequestModal
                  task={task}
                  isOpen={showAllocationRequestModal}
                  onClose={() => setShowAllocationRequestModal(false)}
                  onSuccess={async () => {
                    await loadSources();
                  }}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
