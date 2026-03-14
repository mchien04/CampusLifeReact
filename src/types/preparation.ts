export type PreparationTaskStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED';

export type PreparationTaskDto = {
  id: number;
  activityId: number;
  assigneeId: number;
  assigneeName: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  status: PreparationTaskStatus;
};

export type BudgetDto = {
  id: number;
  activityId: number | null;
  totalAmount: string;
  spentAmount: string;
  remainingAmount: string;
  description: string | null;
};

export type PreparationDashboardDto = {
  activityId: number;
  hasPreparation: boolean;
  tasks: PreparationTaskDto[];
  budget: BudgetDto | null;
  financeMessage: string | null;
};

export type ExpenseDto = {
  id: number;
  activityId: number;
  budgetId: number;
  amount: string;
  description: string | null;
  evidenceUrl: string | null;
  reportedById: number;
  reportedByName: string | null;
  approved: boolean | null;
  createdAt: string;
};

export type OrganizerDto = {
  studentId: number;
  fullName: string;
};

export type UploadResultDto = { url: string };

export type ExpenseApprovalState = 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED';

export function mapApproval(approved: boolean | null | undefined): ExpenseApprovalState {
  if (approved === true) return 'APPROVED';
  if (approved === false) return 'REJECTED';
  return 'WAITING_APPROVAL';
}

export type ExpenseStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

