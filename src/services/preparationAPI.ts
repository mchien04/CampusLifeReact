import api from './api';
import {
  BudgetDto,
  ExpenseDto,
  ExpenseStatusFilter,
  OrganizerDto,
  PreparationDashboardDto,
  PreparationTaskDto,
  PreparationTaskStatus,
  UploadResultDto,
} from '../types/preparation';

function unwrapBody<T>(data: any): T {
  return (data?.body ?? data?.data ?? data) as T;
}

export const preparationAPI = {
  togglePreparation: async (activityId: number, enabled: boolean): Promise<void> => {
    await api.put(`/api/preparation/activities/${activityId}/toggle?enabled=${enabled}`);
  },

  getDashboard: async (activityId: number): Promise<PreparationDashboardDto> => {
    const response = await api.get(`/api/preparation/activities/${activityId}/dashboard`);
    return unwrapBody<PreparationDashboardDto>(response.data);
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
    payload: { assigneeId: number; title: string; description?: string; deadline?: string | null }
  ): Promise<PreparationTaskDto> => {
    const response = await api.post(`/api/preparation/activities/${activityId}/tasks`, {
      assigneeId: payload.assigneeId,
      title: payload.title,
      description: payload.description ?? null,
      deadline: payload.deadline ?? null,
    });
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  updateTaskStatus: async (taskId: number, status: PreparationTaskStatus): Promise<PreparationTaskDto> => {
    const response = await api.put(`/api/preparation/tasks/${taskId}/status`, { status });
    return unwrapBody<PreparationTaskDto>(response.data);
  },

  upsertBudget: async (
    activityId: number,
    payload: { totalAmount: string; description?: string }
  ): Promise<BudgetDto> => {
    const response = await api.put(`/api/preparation/activities/${activityId}/budget`, {
      totalAmount: payload.totalAmount,
      description: payload.description ?? null,
    });
    return unwrapBody<BudgetDto>(response.data);
  },

  uploadEvidence: async (activityId: number, file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await api.post(`/api/preparation/activities/${activityId}/expenses/evidence`, fd);
    const body = unwrapBody<UploadResultDto>(response.data);
    return body.url;
  },

  createExpense: async (
    activityId: number,
    payload: { amount: string; description?: string; evidenceUrl?: string }
  ): Promise<ExpenseDto> => {
    const response = await api.post(`/api/preparation/activities/${activityId}/expenses`, {
      amount: payload.amount,
      description: payload.description ?? null,
      evidenceUrl: payload.evidenceUrl ?? null,
    });
    return unwrapBody<ExpenseDto>(response.data);
  },

  listExpenses: async (activityId: number, status: ExpenseStatusFilter): Promise<ExpenseDto[]> => {
    const response = await api.get(`/api/preparation/activities/${activityId}/expenses?status=${status}`);
    return unwrapBody<ExpenseDto[]>(response.data) ?? [];
  },

  setExpenseApproval: async (expenseId: number, approved: boolean): Promise<ExpenseDto> => {
    const response = await api.put(`/api/preparation/expenses/${expenseId}/approval`, { approved });
    return unwrapBody<ExpenseDto>(response.data);
  },
};

