export type PreparationTaskStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED';

export type PreparationTaskDto = {
  id: number;
  activityId: number;
  ownerId: number;
  ownerName: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  budgetLimit: string | null;
  allocatedAmount: string;
  isFinancial: boolean;
  status: PreparationTaskStatus;
  assigneeId?: number;
  assigneeName?: string | null;
};

export type PreparationDashboardDto = {
  activityId: number;
  hasPreparation: boolean;
  tasks: PreparationTaskDto[];
  budget: null;
  financeMessage: string | null;
};

export type ExpenseStatus = 'PENDING_LEADER' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED';

export type ExpenseDto = {
  id: number;
  activityId: number | null;
  taskId: number | null;
  categoryId: number | null;
  categoryName: string | null;
  amount: string;
  description: string | null;
  evidenceUrl: string | null;
  status: ExpenseStatus;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
};

export type BudgetCategoryDto = {
  id: number;
  name: string;
  allocatedAmount: string;
  usedAmount: string;
  remainingAmount: string;
  usedPercent: number;
};

export type ActivityBudgetDto = {
  id: number;
  activityId: number;
  totalAmount: string;
  categories: BudgetCategoryDto[];
};

export type FundAdvanceStatus = 'HOLDING' | 'SETTLED';

export type FundAdvanceDto = {
  id: number;
  taskId: number;
  studentId: number;
  studentName: string | null;
  amount: string;
  remainingAmount: string;
  status: FundAdvanceStatus;
  createdAt: string;
};

export type TaskOverBudgetDto = {
  taskId: number;
  title: string;
  budgetLimit: string | null;
  allocatedAmount: string;
  approvedSpent: string;
};

export type FinancialReportDto = {
  activityId: number;
  totalBudget: string;
  categories: BudgetCategoryDto[];
  overBudgetTasks: TaskOverBudgetDto[];
};

export type OrganizerDto = {
  studentId: number;
  fullName: string;
};

export type UploadResultDto = { url: string };

export type ApproveExpenseRequest = { approved: boolean };

export type UpsertBudgetCategoryRequest = {
  name: string;
  allocatedAmount: string;
};

export type UpsertActivityBudgetRequest = {
  totalAmount: string;
  categories: UpsertBudgetCategoryRequest[];
};

export type AllocateTaskAmountRequest = {
  allocatedAmount: string;
};

export type CreateFundAdvanceRequest = {
  studentId: number;
  amount: string;
};

export type CreateExpenseRequest = {
  categoryId: number;
  amount: string;
  description?: string | null;
  evidenceUrl?: string | null;
};

export type ExpenseStatusFilter = 'ALL' | ExpenseStatus;

