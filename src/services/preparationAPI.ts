import api from './api';
import {
  ActivityBudgetDto,
  AllocateTaskAmountRequest,
  ApproveExpenseRequest,
  CreateExpenseRequest,
  CreateFundAdvanceRequest,
  ExpenseDto,
  ExpenseStatusFilter,
  FinancialReportDto,
  FundAdvanceDto,
  OrganizerDto,
  PreparationDashboardDto,
  PreparationTaskDto,
  PreparationTaskStatus,
  UpsertActivityBudgetRequest,
  UploadResultDto,
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
      budgetLimit?: string | null;
    }
  ): Promise<PreparationTaskDto> => {
    const response = await api.post(`/api/preparation/activities/${activityId}/tasks`, {
      ownerId: payload.ownerId ?? payload.assigneeId,
      title: payload.title,
      description: payload.description ?? null,
      deadline: payload.deadline ?? null,
      isFinancial: payload.isFinancial ?? false,
      budgetLimit: payload.budgetLimit ?? null,
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
    const body: AllocateTaskAmountRequest = { allocatedAmount };
    const response = await api.put(`/api/preparation/tasks/${taskId}/allocation`, body);
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  addTaskMember: async (taskId: number, studentId: number): Promise<void> => {
    await api.post(`/api/preparation/tasks/${taskId}/members/${studentId}`);
  },

  createFundAdvance: async (taskId: number, payload: CreateFundAdvanceRequest): Promise<FundAdvanceDto> => {
    const response = await api.post(`/api/preparation/tasks/${taskId}/fund-advances`, payload);
    return unwrapBody<FundAdvanceDto>(response.data);
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
};
