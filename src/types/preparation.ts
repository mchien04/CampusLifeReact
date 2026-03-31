/* ====================================================================
  ENUMS & STATUS TYPES
  ==================================================================== */

export type PreparationTaskStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETION_REQUESTED' | 'COMPLETED';

export type PreparationTaskMemberRole = 'LEADER' | 'MEMBER';

export type ExpenseStatus = 'PENDING_LEADER' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED';

export type FundAdvanceStatus = 'REQUESTED' | 'HOLDING' | 'SETTLED' | 'REJECTED';

export type AllocationAdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type WorkloadWarningType = 'OVERLOADED' | 'UNASSIGNED';

export type ExpenseStatusFilter = 'ALL' | ExpenseStatus;

/* ====================================================================
  DTO TYPES - Tasks & Workflow
  ==================================================================== */

export type PreparationTaskDto = {
  id: number;
  activityId: number;
  ownerId: number;
  ownerName: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  allocatedAmount: string;
  isFinancial: boolean;
  status: PreparationTaskStatus;
  assigneeId?: number;
  assigneeName?: string | null;
};

export type MyPreparationTaskDto = {
  id: number;
  activityId: number;
  ownerId: number;
  ownerName: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  allocatedAmount: string;
  isFinancial: boolean;
  status: PreparationTaskStatus;
  myRole: PreparationTaskMemberRole;
};

export type PreparationTaskMemberDto = {
  studentId: number;
  studentName: string | null;
  role: PreparationTaskMemberRole;
};

export type PreparationDashboardDto = {
  activityId: number;
  hasPreparation: boolean;
  tasks: PreparationTaskDto[];
  budget: ActivityBudgetDto | null;
  financeMessage: string | null;
};

/* ====================================================================
  DTO TYPES - Organizer & Member Management
  ==================================================================== */

export type OrganizerDto = {
  studentId: number;
  fullName: string;
};

export type BulkAddOrganizersRequest = {
  studentIds: number[];
};

export type BulkAddOrganizersResultDto = {
  added: OrganizerDto[];
  skippedStudentIds: number[];
};

/* ====================================================================
  DTO TYPES - Budget & Categories
  ==================================================================== */

export type BudgetCategoryDto = {
  id: number;
  name: string;
  allocatedAmount: string;
  allocatedToTasksAmount: string;
  availableToAllocateAmount: string;
  cashOutsideAmount: string;
  cashAvailableAmount: string;
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

/* ====================================================================
  DTO TYPES - Expense
  ==================================================================== */

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

export type TaskAllocationSourceDto = {
  categoryId: number;
  categoryName: string;
  allocatedAmount: string;
  holdingAdvanceAmount: string;
  approvedSpentAmount: string;
  allocationRemainingAmount: string;
};

export type ExpenseCategorySuggestionDto = {
  categoryId: number;
  categoryName: string;
  allocationRemainingAmount: string;
  walletRemainingAmount: string;
  myFundAdvanceRemainingAmount: string;
  maxExpenseAmount: string;
};

/* ====================================================================
  DTO TYPES - Fund Advance & Allocation
  ==================================================================== */

export type FundAdvanceDto = {
  id: number;
  taskId: number;
  categoryId: number;
  categoryName: string;
  studentId: number;
  studentName: string | null;
  requestedById: number;
  requestedByName: string | null;
  amount: string;
  remainingAmount: string;
  status: FundAdvanceStatus;
  createdAt: string;
  decidedAt: string | null;
};

export type FundAdvanceSourceSuggestionDto = {
  categoryId: number;
  categoryName: string;
  allocationRemainingAmount: string;
  cashAvailableAmount: string;
  maxAdvanceAmount: string;
};

export type FundAdvanceDebtDto = {
  studentId: number;
  studentName: string | null;
  holdingAmount: string;
};

export type AllocationAdjustmentRequestDto = {
  id: number;
  activityId: number;
  taskId: number;
  amount: string;
  description: string | null;
  status: AllocationAdjustmentStatus;
  requestedById: number;
  requestedByName: string | null;
  decidedAt: string | null;
  decidedById: number | null;
  createdAt: string;
};

export type AllocationAdjustmentDecisionSourceRequest = {
  categoryId: number;
  amount: string;
};

export type AllocationAdjustmentSourcePlanItemDto = {
  categoryId: number;
  categoryName: string;
  amount: string | number;
};

/* ====================================================================
  DTO TYPES - Reports & Warnings
  ==================================================================== */

export type TaskOverBudgetDto = {
  taskId: number;
  title: string;
  allocatedAmount: string;
  approvedSpent: string;
};

/**
 * Old financial report (used by existing components)
 * @deprecated Use FinanceOverviewReportDto in Phase 6
 */
export type FinancialReportDto = {
  activityId: number;
  totalBudget: string;
  categories: BudgetCategoryDto[];
  overBudgetTasks: TaskOverBudgetDto[];
};

export type TaskSpendStatusDto = {
  taskId: number;
  taskTitle?: string;
  title?: string;
  allocatedAmount: string;
  committedAmount: string;
  approvedSpent: string;
  usedPercent: number;
};

export type InvoiceStatusSummaryDto = {
  status: ExpenseStatus;
  count: number;
  totalAmount: string;
};

export type FinanceOverviewReportDto = {
  activityId: number;
  totalBudget: string;
  totalAllocatedToTasks: string;
  totalApprovedSpent: string;
  varianceAllocatedVsApproved: string;
  wallets: BudgetCategoryDto[];
  tasks: TaskSpendStatusDto[];
};

export type CashFlowReportDto = {
  activityId: number;
  totalBudget: string;
  approvedSpent: string;
  cashOutsideWallet: string;
  cashInsideWallet: string;
  advanceDebts: FundAdvanceDebtDto[];
  invoiceStatusSummary: InvoiceStatusSummaryDto[];
};

export type WorkloadWarningDto = {
  studentId: number;
  studentName: string | null;
  taskCount: number;
  type: WorkloadWarningType;
};

/* ====================================================================
  REQUEST/RESPONSE TYPES - Misc
  ==================================================================== */

export type UploadResultDto = { url: string };

/* ====================================================================
  REQUEST TYPES - Expense
  ==================================================================== */

export type CreateExpenseRequest = {
  categoryId: number;
  amount: string;
  description?: string | null;
  evidenceUrl?: string | null;
};

export type ApproveExpenseRequest = { approved: boolean };

export type AdminDecideExpenseRequest = { approved: boolean };

/* ====================================================================
  REQUEST TYPES - Budget & Allocation
  ==================================================================== */

export type UpsertBudgetCategoryRequest = {
  name: string;
  allocatedAmount: string;
};

export type UpsertActivityBudgetRequest = {
  totalAmount: string;
  categories: UpsertBudgetCategoryRequest[];
};

/**
 * Allocate task amount - Phase 3 (without category selection)
 * @deprecated Use AllocateTaskAmountRequest in Phase 4+ with categoryId
 */
export type AllocateTaskAmountRequestV1 = {
  allocatedAmount: string;
};

/**
 * Allocate task amount - Phase 4+ (with category/source selection)
 */
export type AllocateTaskAmountRequest = {
  categoryId: number;
  allocatedAmount: string;
};

export type CreateAllocationAdjustmentRequest = {
  amount: string;
  description: string;
};

export type AdminDecisionAllocationAdjustmentRequest = {
  approved: boolean;
  categoryId?: number | null;
  sources?: AllocationAdjustmentDecisionSourceRequest[];
};

/* ====================================================================
  REQUEST TYPES - Fund Advance
  ==================================================================== */

/**
 * Old fund advance request (Phases 1-4, admin only)
 * @deprecated Use CreateFundAdvanceRequest in Phase 5 with categoryId
 */
export type CreateFundAdvanceRequestV1 = {
  studentId: number;
  amount: string;
};

/**
 * New fund advance request (Phase 5+, with category/source selection)
 */
export type CreateFundAdvanceRequest = {
  studentId: number;
  categoryId: number;
  amount: string;
};

export type ApproveFundAdvanceRequest = { approved: boolean };

export type AdminDecideFundAdvanceRequest = { approved: boolean };
