import api from './api';
import {
  ActivityBudgetDto,
  AllocateTaskAmountRequestV1,
  AllocationAdjustmentRequestDto,
  AllocationAdjustmentSourcePlanItemDto,
  AdminDecisionAllocationAdjustmentRequest,
  AdminDecideFundAdvanceRequest,
  ApproveExpenseRequest,
  AdminDecideExpenseRequest,
  CashFlowReportDto,
  CreateAllocationAdjustmentRequest,
  CreateExpenseRequest,
  CreateFundAdvanceRequest,
  CreateFundAdvanceRequestV1,
  ExpenseCategorySuggestionDto,
  ExpenseDto,
  ExpenseStatusFilter,
  FinancialReportDto,
  FinanceOverviewReportDto,
  FundAdvanceDebtDto,
  FundAdvanceDto,
  FundAdvanceSourceSuggestionDto,
  MyPreparationTaskDto,
  OrganizerDto,
  PreparationDashboardDto,
  PreparationTaskDto,
  PreparationTaskMemberDto,
  PreparationTaskStatus,
  TaskAllocationSourceDto,
  UpsertActivityBudgetRequest,
  UploadResultDto,
  WorkloadWarningDto,
} from '../types/preparation';

function unwrapBody<T>(data: any): T {
  return (data?.body ?? data?.data ?? data) as T;
}

export const preparationAPI = {
  getMyActivityIds: async (): Promise<number[]> => {
    const response = await api.get('/api/preparation/my/activity-ids');
    return unwrapBody<number[]>(response.data) ?? [];
  },

  togglePreparation: async (activityId: number, enabled: boolean): Promise<void> => {
    await api.put(`/api/preparation/activities/${activityId}/toggle?enabled=${enabled}`);
  },

  getDashboard: async (activityId: number): Promise<PreparationDashboardDto> => {
    const response = await api.get(`/api/preparation/activities/${activityId}/dashboard`);
    return unwrapBody<PreparationDashboardDto>(response.data);
  },

  getFinancialReport: async (activityId: number): Promise<FinancialReportDto> => {
    const response = await api.get(`/api/preparation/activities/${activityId}/financial-report`);
    return unwrapBody<FinancialReportDto>(response.data);
  },

  listOrganizers: async (activityId: number): Promise<OrganizerDto[]> => {
    const response = await api.get(`/api/preparation/activities/${activityId}/organizers`);
    return unwrapBody<OrganizerDto[]>(response.data) ?? [];
  },

  addOrganizer: async (activityId: number, studentId: number): Promise<void> => {
    await api.post(`/api/preparation/activities/${activityId}/organizers/${studentId}`);
  },

  removeOrganizer: async (activityId: number, studentId: number): Promise<void> => {
    await api.delete(`/api/preparation/activities/${activityId}/organizers/${studentId}`);
  },

  assignTask: async (
    activityId: number,
    payload: {
      ownerId?: number;
      assigneeId?: number;
      title: string;
      description?: string;
      deadline?: string | null;
      isFinancial?: boolean;
    }
  ): Promise<PreparationTaskDto> => {
    const response = await api.post(`/api/preparation/activities/${activityId}/tasks`, {
      ownerId: payload.ownerId ?? payload.assigneeId,
      title: payload.title,
      description: payload.description ?? null,
      deadline: payload.deadline ?? null,
      isFinancial: payload.isFinancial ?? false,
    });
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  updateTaskStatus: async (taskId: number, status: PreparationTaskStatus): Promise<PreparationTaskDto> => {
    const response = await api.put(`/api/preparation/tasks/${taskId}/status`, { status });
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  upsertActivityBudget: async (activityId: number, payload: UpsertActivityBudgetRequest): Promise<ActivityBudgetDto> => {
    try {
      const response = await api.put(`/api/preparation/activities/${activityId}/budget`, {
        totalAmount: payload.totalAmount,
        categories: payload.categories,
      });
      return unwrapBody<ActivityBudgetDto>(response.data);
    } catch (e: any) {
      if (e?.response?.status === 400) {
        console.error('upsertActivityBudget 400 body:', e?.response?.data);
      }
      throw e;
    }
  },

  allocateTaskAmount: async (taskId: number, allocatedAmount: string): Promise<PreparationTaskDto> => {
    const body: AllocateTaskAmountRequestV1 = { allocatedAmount };
    const response = await api.put(`/api/preparation/tasks/${taskId}/allocation`, body);
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  addTaskMember: async (taskId: number, studentId: number): Promise<void> => {
    await api.post(`/api/preparation/tasks/${taskId}/members/${studentId}`);
  },

  /**
   * Create fund advance (Phases 1-4, admin only, without category selection)
   * @deprecated Use requestFundAdvance in Phase 5+
   */
  createFundAdvance: async (taskId: number, payload: CreateFundAdvanceRequestV1): Promise<FundAdvanceDto> => {
    const response = await api.post(`/api/preparation/tasks/${taskId}/fund-advances`, payload);
    return unwrapBody<FundAdvanceDto>(response.data);
  },

  listFundAdvancesByTask: async (taskId: number): Promise<FundAdvanceDto[]> => {
    const response = await api.get(`/api/preparation/tasks/${taskId}/fund-advances`);
    return unwrapBody<FundAdvanceDto[]>(response.data) ?? [];
  },

  uploadEvidence: async (taskId: number, file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await api.post(`/api/preparation/tasks/${taskId}/expenses/evidence`, fd);
    const body = unwrapBody<UploadResultDto>(response.data);
    return body.url;
  },

  createExpense: async (taskId: number, payload: CreateExpenseRequest): Promise<ExpenseDto> => {
    const response = await api.post(`/api/preparation/tasks/${taskId}/expenses`, {
      categoryId: payload.categoryId,
      amount: payload.amount,
      description: payload.description ?? null,
      evidenceUrl: payload.evidenceUrl ?? null,
    });
    return unwrapBody<ExpenseDto>(response.data);
  },

  listExpenses: async (activityId: number, status: ExpenseStatusFilter): Promise<ExpenseDto[]> => {
    const url =
      status === 'ALL'
        ? `/api/preparation/activities/${activityId}/expenses`
        : `/api/preparation/activities/${activityId}/expenses?status=${status}`;
    const response = await api.get(url);
    return unwrapBody<ExpenseDto[]>(response.data) ?? [];
  },

  leaderDecision: async (expenseId: number, approved: boolean): Promise<ExpenseDto> => {
    const body: ApproveExpenseRequest = { approved };
    const response = await api.put(`/api/preparation/expenses/${expenseId}/leader-decision`, body);
    return unwrapBody<ExpenseDto>(response.data);
  },

  adminDecision: async (expenseId: number, approved: boolean): Promise<ExpenseDto> => {
    const body: ApproveExpenseRequest = { approved };
    const response = await api.put(`/api/preparation/expenses/${expenseId}/admin-decision`, body);
    return unwrapBody<ExpenseDto>(response.data);
  },

  /* ====================================================================
    PHASE 2: BUDGET CATEGORIES
    ==================================================================== */

  getActivityBudget: async (activityId: number): Promise<ActivityBudgetDto> => {
    const response = await api.get(`/api/preparation/activities/${activityId}/budget`);
    return unwrapBody<ActivityBudgetDto>(response.data);
  },

  /* ====================================================================
    PHASE 3: TASK MEMBER ROLES + WORKFLOW + WORKLOAD
    ==================================================================== */

  getTaskMembers: async (taskId: number): Promise<PreparationTaskMemberDto[]> => {
    const response = await api.get(`/api/preparation/tasks/${taskId}/members`);
    return unwrapBody<PreparationTaskMemberDto[]>(response.data) ?? [];
  },

  getTaskDetail: async (taskId: number): Promise<PreparationTaskDto> => {
    const response = await api.get(`/api/preparation/detail/${taskId}`);
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  getMyTasksByActivity: async (activityId: number): Promise<MyPreparationTaskDto[]> => {
    const response = await api.get(`/api/preparation/my/activities/tasks?activityId=${activityId}`);
    return unwrapBody<MyPreparationTaskDto[]>(response.data) ?? [];
  },

  getTaskAllocationSources: async (taskId: number): Promise<TaskAllocationSourceDto[]> => {
    const response = await api.get(`/api/preparation/tasks/${taskId}/allocation-sources`);
    return unwrapBody<TaskAllocationSourceDto[]>(response.data) ?? [];
  },

  getExpenseCategorySuggestions: async (
    taskId: number,
    amount?: string
  ): Promise<ExpenseCategorySuggestionDto[]> => {
    const url = amount
      ? `/api/preparation/tasks/${taskId}/expense-category-suggestions?amount=${encodeURIComponent(amount)}`
      : `/api/preparation/tasks/${taskId}/expense-category-suggestions`;
    const response = await api.get(url);
    return unwrapBody<ExpenseCategorySuggestionDto[]>(response.data) ?? [];
  },

  getMyFundAdvances: async (activityId: number, taskId?: number): Promise<FundAdvanceDto[]> => {
    const url = taskId
      ? `/api/preparation/my/fund-advances?activityId=${activityId}&taskId=${taskId}`
      : `/api/preparation/my/fund-advances?activityId=${activityId}`;
    const response = await api.get(url);
    return unwrapBody<FundAdvanceDto[]>(response.data) ?? [];
  },

  deleteTaskMember: async (taskId: number, studentId: number): Promise<void> => {
    await api.delete(`/api/preparation/tasks/${taskId}/members/${studentId}`);
  },

  assignTaskLeader: async (taskId: number, studentId: number): Promise<void> => {
    // TODO: Phase 3 - POST /api/preparation/tasks/{taskId}/leaders/{studentId}
    await api.post(`/api/preparation/tasks/${taskId}/leaders/${studentId}`);
  },

  removeTaskLeader: async (taskId: number, studentId: number): Promise<void> => {
    // TODO: Phase 3 - DELETE /api/preparation/tasks/{taskId}/leaders/{studentId}
    await api.delete(`/api/preparation/tasks/${taskId}/leaders/${studentId}`);
  },

  acceptTask: async (taskId: number): Promise<PreparationTaskDto> => {
    // TODO: Phase 3 - PUT /api/preparation/tasks/{taskId}/accept
    const response = await api.put(`/api/preparation/tasks/${taskId}/accept`);
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  requestTaskComplete: async (taskId: number): Promise<PreparationTaskDto> => {
    // TODO: Phase 3 - PUT /api/preparation/tasks/{taskId}/request-complete
    const response = await api.put(`/api/preparation/tasks/${taskId}/request-complete`);
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  completeTaskDecision: async (taskId: number, approved: boolean): Promise<PreparationTaskDto> => {
    // TODO: Phase 3 - PUT /api/preparation/tasks/{taskId}/complete-decision
    const response = await api.put(`/api/preparation/tasks/${taskId}/complete-decision`, { approved });
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  getWorkloadWarnings: async (activityId: number): Promise<WorkloadWarningDto[]> => {
    // TODO: Phase 3 - GET /api/preparation/activities/{activityId}/workload-warnings
    const response = await api.get(`/api/preparation/activities/${activityId}/workload-warnings`);
    return unwrapBody<WorkloadWarningDto[]>(response.data) ?? [];
  },

  /* ====================================================================
    PHASE 4: ALLOCATE THEO VÍ + BỔ SUNG NGÂN SÁCH
    ==================================================================== */

  allocateTaskFromCategory: async (
    taskId: number,
    categoryId: number,
    allocatedAmount: string
  ): Promise<PreparationTaskDto> => {
    // TODO: Phase 4 - PUT /api/preparation/tasks/{taskId}/allocation
    const body = { categoryId, allocatedAmount };
    const response = await api.put(`/api/preparation/tasks/${taskId}/allocation`, body);
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  createAllocationAdjustmentRequest: async (
    taskId: number,
    payload: CreateAllocationAdjustmentRequest
  ): Promise<AllocationAdjustmentRequestDto> => {
    // TODO: Phase 4 - POST /api/preparation/tasks/{taskId}/allocation-adjustments
    const response = await api.post(`/api/preparation/tasks/${taskId}/allocation-adjustments`, payload);
    return unwrapBody<AllocationAdjustmentRequestDto>(response.data);
  },

  listAllocationAdjustmentRequests: async (
    activityId: number,
    status?: string
  ): Promise<AllocationAdjustmentRequestDto[]> => {
    // TODO: Phase 4 - GET /api/preparation/activities/{activityId}/allocation-adjustments?status={status}
    const url = status
      ? `/api/preparation/activities/${activityId}/allocation-adjustments?status=${status}`
      : `/api/preparation/activities/${activityId}/allocation-adjustments`;
    const response = await api.get(url);
    return unwrapBody<AllocationAdjustmentRequestDto[]>(response.data) ?? [];
  },

  adminDecideAllocationAdjustment: async (
    requestId: number,
    payload: AdminDecisionAllocationAdjustmentRequest
  ): Promise<AllocationAdjustmentRequestDto> => {
    // TODO: Phase 4 - PUT /api/preparation/allocation-adjustments/{requestId}/admin-decision
    const response = await api.put(`/api/preparation/allocation-adjustments/${requestId}/admin-decision`, payload);
    return unwrapBody<AllocationAdjustmentRequestDto>(response.data);
  },

  getAllocationAdjustmentSourcePlan: async (requestId: number): Promise<AllocationAdjustmentSourcePlanItemDto[]> => {
    const response = await api.get(`/api/preparation/allocation-adjustments/${requestId}/source-plan`);
    return unwrapBody<AllocationAdjustmentSourcePlanItemDto[]>(response.data) ?? [];
  },

  /* ====================================================================
    PHASE 5: FUND ADVANCE 2-STEP + SETTLE DEBTS
    ==================================================================== */

  requestFundAdvance: async (taskId: number, payload: CreateFundAdvanceRequest): Promise<FundAdvanceDto> => {
    // TODO: Phase 5 - POST /api/preparation/tasks/{taskId}/fund-advances (leader request)
    const response = await api.post(`/api/preparation/tasks/${taskId}/fund-advances`, payload);
    return unwrapBody<FundAdvanceDto>(response.data);
  },

  adminDecideFundAdvance: async (fundAdvanceId: number, approved: boolean): Promise<FundAdvanceDto> => {
    // TODO: Phase 5 - PUT /api/preparation/fund-advances/{fundAdvanceId}/admin-decision
    const body: AdminDecideFundAdvanceRequest = { approved };
    const response = await api.put(`/api/preparation/fund-advances/${fundAdvanceId}/admin-decision`, body);
    return unwrapBody<FundAdvanceDto>(response.data);
  },

  returnFundAdvance: async (fundAdvanceId: number): Promise<FundAdvanceDto> => {
    // TODO: Phase 5 - PUT /api/preparation/fund-advances/{fundAdvanceId}/return
    const response = await api.put(`/api/preparation/fund-advances/${fundAdvanceId}/return`);
    return unwrapBody<FundAdvanceDto>(response.data);
  },

  getFundAdvanceSourceSuggestions: async (
    taskId: number,
    amount?: string
  ): Promise<FundAdvanceSourceSuggestionDto[]> => {
    // TODO: Phase 5 - GET /api/preparation/tasks/{taskId}/fund-advance-source-suggestions?amount={amount}
    const url = amount
      ? `/api/preparation/tasks/${taskId}/fund-advance-source-suggestions?amount=${amount}`
      : `/api/preparation/tasks/${taskId}/fund-advance-source-suggestions`;
    const response = await api.get(url);
    return unwrapBody<FundAdvanceSourceSuggestionDto[]>(response.data) ?? [];
  },

  getFundAdvanceDebts: async (activityId: number, studentId?: number): Promise<FundAdvanceDebtDto[]> => {
    // TODO: Phase 5 - GET /api/preparation/activities/{activityId}/fund-advance-debts?studentId={studentId}
    const url = studentId
      ? `/api/preparation/activities/${activityId}/fund-advance-debts?studentId=${studentId}`
      : `/api/preparation/activities/${activityId}/fund-advance-debts`;
    const response = await api.get(url);
    return unwrapBody<FundAdvanceDebtDto[]>(response.data) ?? [];
  },

  /* ====================================================================
    PHASE 6: REPORTS + NOTIFICATIONS
    ==================================================================== */

  getFinanceOverviewReport: async (activityId: number): Promise<FinanceOverviewReportDto> => {
    // TODO: Phase 6 - GET /api/preparation/activities/{activityId}/reports/finance-overview
    const response = await api.get(`/api/preparation/activities/${activityId}/reports/finance-overview`);
    return unwrapBody<FinanceOverviewReportDto>(response.data);
  },

  getCashFlowReport: async (activityId: number): Promise<CashFlowReportDto> => {
    // TODO: Phase 6 - GET /api/preparation/activities/{activityId}/reports/cash-flow
    const response = await api.get(`/api/preparation/activities/${activityId}/reports/cash-flow`);
    return unwrapBody<CashFlowReportDto>(response.data);
  },
};
