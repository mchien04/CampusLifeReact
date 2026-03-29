/**
 * Preparation Module Utilities
 * Formatting, validation, calculation, and status mapping helpers
 */

import type {
  PreparationTaskStatus,
  PreparationTaskMemberRole,
  ExpenseStatus,
  FundAdvanceStatus,
  AllocationAdjustmentStatus,
  WorkloadWarningType,
  BudgetCategoryDto,
} from '../types/preparation';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_BADGE_CLASS,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_BADGE_CLASS,
  FUND_ADVANCE_STATUS_LABELS,
  FUND_ADVANCE_STATUS_BADGE_CLASS,
  ALLOCATION_STATUS_LABELS,
  ALLOCATION_STATUS_BADGE_CLASS,
  WORKLOAD_WARNING_LABELS,
  WORKLOAD_WARNING_BADGE_CLASS,
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_BADGE_CLASS,
  EXPENSE_STATUS_COLORS,
  FUND_ADVANCE_STATUS_COLORS,
  BUDGET_PROGRESS_COLORS,
  PREPARATION_CONSTRAINTS,
} from '../constants/preparation';

/* ====================================================================
  FORMATTING HELPERS
  ==================================================================== */

/**
 * Format amount as Vietnamese currency (VND)
 * @example formatCurrency("1500000") → "1.500.000 ₫"
 */
export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(numAmount)) return '0 ₫';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numAmount);
}

/**
 * Format amount as number with thousand separators (no currency)
 * @example formatAmount("1500000") → "1.500.000"
 */
export function formatAmount(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(numAmount)) return '0';

  return new Intl.NumberFormat('vi-VN').format(numAmount);
}

/**
 * Format ISO date to Vietnamese format
 * @example formatDate("2026-03-30T10:00:00") → "30/03/2026"
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

/**
 * Format ISO datetime to Vietnamese format with time
 * @example formatDateTime("2026-03-30T14:30:00") → "30/03/2026 14:30"
 */
export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Sum multiple amounts and return as string
 * @example sumAmounts(["100000", "200000"]) → "300000"
 */
export function sumAmounts(amounts: (string | number)[]): string {
  const sum = amounts.reduce((acc: number, amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return acc + (Number.isFinite(num) ? num : 0);
  }, 0);
  return sum.toFixed(0);
}

/**
 * Subtract two amounts
 * @example subtractAmounts("1000000", "300000") → "700000"
 */
export function subtractAmounts(a: string | number, b: string | number): string {
  const numA = typeof a === 'string' ? parseFloat(a) : a;
  const numB = typeof b === 'string' ? parseFloat(b) : b;
  const result = (Number.isFinite(numA) ? numA : 0) - (Number.isFinite(numB) ? numB : 0);
  return Math.max(0, result).toFixed(0);
}

/**
 * Parse amount string to number, return null if invalid
 */
export function parseAmount(amount: string | null | undefined): number | null {
  if (!amount) return null;
  const num = parseFloat(amount);
  return Number.isFinite(num) ? num : null;
}

/**
 * Convert number to amount string (no decimals for VND)
 */
export function amountToString(num: number, decimals: number = 0): string {
  return num.toFixed(decimals);
}

/* ====================================================================
  PERCENTAGE & CALCULATION HELPERS
  ==================================================================== */

/**
 * Calculate percentage (0-100)
 * @example calculatePercentage("500000", "1000000") → 50
 */
export function calculatePercentage(used: string | number, total: string | number): number {
  const numUsed = typeof used === 'string' ? parseFloat(used) : used;
  const numTotal = typeof total === 'string' ? parseFloat(total) : total;

  if (!Number.isFinite(numUsed) || !Number.isFinite(numTotal) || numTotal === 0) return 0;
  return Math.round((numUsed / numTotal) * 100);
}

/**
 * Calculate remaining budget
 */
export function calculateRemainingBudget(allocated: string | number, spent: string | number): string {
  const numAllocated = typeof allocated === 'string' ? parseFloat(allocated) : allocated;
  const numSpent = typeof spent === 'string' ? parseFloat(spent) : spent;

  if (!Number.isFinite(numAllocated) || !Number.isFinite(numSpent)) return '0';
  return Math.max(0, numAllocated - numSpent).toFixed(0);
}

/**
 * Calculate budget utilization percentage
 */
export function calculateBudgetUtilization(spent: string | number, allocated: string | number): number {
  return calculatePercentage(spent, allocated);
}

/**
 * Check if expense can be created (committed + amount <= allocated)
 */
export function canExpenseBeCreated(
  committed: string | number,
  newAmount: string | number,
  allocated: string | number
): boolean {
  const numCommitted = typeof committed === 'string' ? parseFloat(committed) : committed;
  const numNewAmount = typeof newAmount === 'string' ? parseFloat(newAmount) : newAmount;
  const numAllocated = typeof allocated === 'string' ? parseFloat(allocated) : allocated;

  if (!Number.isFinite(numCommitted) || !Number.isFinite(numNewAmount) || !Number.isFinite(numAllocated)) {
    return false;
  }

  return numCommitted + numNewAmount <= numAllocated;
}

/**
 * Check if user can be removed as leader (validation for financial tasks)
 */
export function canUserBeRemovedAsLeader(currentLeaderCount: number, taskIsFinancial: boolean): boolean {
  // Financial tasks must have at least 1 leader
  if (taskIsFinancial && currentLeaderCount <= 1) return false;
  return true;
}

/* ====================================================================
  TASK STATUS HELPERS
  ==================================================================== */

export function getTaskStatusLabel(status: PreparationTaskStatus): string {
  return TASK_STATUS_LABELS[status] || status;
}

export function getTaskStatusBadgeClass(status: PreparationTaskStatus): string {
  return TASK_STATUS_BADGE_CLASS[status] || '';
}

/* ====================================================================
  EXPENSE STATUS HELPERS
  ==================================================================== */

export function getExpenseStatusLabel(status: ExpenseStatus): string {
  return EXPENSE_STATUS_LABELS[status] || status;
}

export function getExpenseStatusBadgeClass(status: ExpenseStatus): string {
  return EXPENSE_STATUS_BADGE_CLASS[status] || '';
}

export function getExpenseStatusColor(status: ExpenseStatus): string {
  return EXPENSE_STATUS_COLORS[status] || '#6B7280';
}

/* ====================================================================
  FUND ADVANCE STATUS HELPERS
  ==================================================================== */

export function getFundAdvanceStatusLabel(status: FundAdvanceStatus): string {
  return FUND_ADVANCE_STATUS_LABELS[status] || status;
}

export function getFundAdvanceStatusBadgeClass(status: FundAdvanceStatus): string {
  return FUND_ADVANCE_STATUS_BADGE_CLASS[status] || '';
}

export function getFundAdvanceStatusColor(status: FundAdvanceStatus): string {
  return FUND_ADVANCE_STATUS_COLORS[status] || '#6B7280';
}

/* ====================================================================
  ALLOCATION STATUS HELPERS
  ==================================================================== */

export function getAllocationStatusLabel(status: AllocationAdjustmentStatus): string {
  return ALLOCATION_STATUS_LABELS[status] || status;
}

export function getAllocationStatusBadgeClass(status: AllocationAdjustmentStatus): string {
  return ALLOCATION_STATUS_BADGE_CLASS[status] || '';
}

/* ====================================================================
  WORKLOAD WARNING HELPERS
  ==================================================================== */

export function getWorkloadWarningLabel(type: WorkloadWarningType): string {
  return WORKLOAD_WARNING_LABELS[type] || type;
}

export function getWorkloadWarningBadgeClass(type: WorkloadWarningType): string {
  return WORKLOAD_WARNING_BADGE_CLASS[type] || '';
}

/* ====================================================================
  MEMBER ROLE HELPERS
  ==================================================================== */

export function getMemberRoleLabel(role: PreparationTaskMemberRole): string {
  return MEMBER_ROLE_LABELS[role] || role;
}

export function getMemberRoleBadgeClass(role: PreparationTaskMemberRole): string {
  return MEMBER_ROLE_BADGE_CLASS[role] || '';
}

/* ====================================================================
  BUDGET PROGRESS COLOR HELPERS
  ==================================================================== */

/**
 * Get progress bar color based on usage percentage
 */
export function getProgressBarColor(percentage: number): string {
  if (percentage < PREPARATION_CONSTRAINTS.BUDGET_WARNING_THRESHOLD * 100) {
    return BUDGET_PROGRESS_COLORS.safe;
  }
  if (percentage < PREPARATION_CONSTRAINTS.BUDGET_CRITICAL_THRESHOLD * 100) {
    return BUDGET_PROGRESS_COLORS.warning;
  }
  return BUDGET_PROGRESS_COLORS.critical;
}

/**
 * Get status text based on percentage
 */
export function getBudgetStatusText(percentage: number): string {
  if (percentage < 80) return 'An toàn';
  if (percentage < 90) return 'Cảnh báo';
  return 'Crítico';
}

/* ====================================================================
  VALIDATION HELPERS
  ==================================================================== */

export interface AmountValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate amount (must be > 0 and valid number)
 */
export function validateAmount(amount: string | null | undefined): AmountValidationResult {
  if (!amount || amount.trim() === '') {
    return { valid: false, error: 'Số tiền không được để trống' };
  }

  const num = parseFloat(amount);
  if (!Number.isFinite(num)) {
    return { valid: false, error: 'Số tiền phải là số hợp lệ' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Số tiền phải lớn hơn 0' };
  }

  if (num > PREPARATION_CONSTRAINTS.MAX_AMOUNT) {
    return { valid: false, error: 'Số tiền vượt quá giới hạn' };
  }

  return { valid: true };
}

/**
 * Validate budget allocation (sum of categories <= total budget)
 */
export function validateBudgetAllocation(
  categories: BudgetCategoryDto[],
  totalBudget: string
): AmountValidationResult {
  const numTotal = parseFloat(totalBudget);
  if (!Number.isFinite(numTotal) || numTotal < 0) {
    return { valid: false, error: 'Tổng ngân sách không hợp lệ' };
  }

  const sumAllocated = categories.reduce((sum, cat) => {
    const num = parseFloat(cat.allocatedAmount);
    return sum + (Number.isFinite(num) ? num : 0);
  }, 0);

  if (sumAllocated > numTotal) {
    return { valid: false, error: 'Tổng hạng mục vượt quá tổng ngân sách' };
  }

  return { valid: true };
}

/* ====================================================================
  SORTING HELPERS
  ==================================================================== */

/**
 * Sort tasks by deadline (nearest first)
 */
export function sortTasksByDeadline<T extends { deadline: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

/**
 * Sort items by date, newest first
 */
export function sortByDateDesc<T extends { createdAt?: string; decidedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDate = new Date((a.decidedAt || a.createdAt || '').toString());
    const bDate = new Date((b.decidedAt || b.createdAt || '').toString());
    return bDate.getTime() - aDate.getTime();
  });
}

/**
 * Sort by allocation usage percentage (highest first)
 */
export function sortByAllocationPercentageDesc<T extends { usedPercent?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.usedPercent || 0) - (a.usedPercent || 0));
}

/* ====================================================================
  EXPORT ALL
  ==================================================================== */

export const preparationUtils = {
  // Formatting
  formatCurrency,
  formatAmount,
  formatDate,
  formatDateTime,
  sumAmounts,
  subtractAmounts,
  parseAmount,
  amountToString,

  // Calculations
  calculatePercentage,
  calculateRemainingBudget,
  calculateBudgetUtilization,
  canExpenseBeCreated,
  canUserBeRemovedAsLeader,

  // Task status
  getTaskStatusLabel,
  getTaskStatusBadgeClass,

  // Expense status
  getExpenseStatusLabel,
  getExpenseStatusBadgeClass,
  getExpenseStatusColor,

  // Fund advance status
  getFundAdvanceStatusLabel,
  getFundAdvanceStatusBadgeClass,
  getFundAdvanceStatusColor,

  // Allocation status
  getAllocationStatusLabel,
  getAllocationStatusBadgeClass,

  // Workload
  getWorkloadWarningLabel,
  getWorkloadWarningBadgeClass,

  // Member role
  getMemberRoleLabel,
  getMemberRoleBadgeClass,

  // Budget progress
  getProgressBarColor,
  getBudgetStatusText,

  // Validation
  validateAmount,
  validateBudgetAllocation,

  // Sorting
  sortTasksByDeadline,
  sortByDateDesc,
  sortByAllocationPercentageDesc,
};
