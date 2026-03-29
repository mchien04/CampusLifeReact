/**
 * Preparation Module Constants
 * Status labels, badge classes, colors, and validation constraints
 */

import type {
  PreparationTaskStatus,
  PreparationTaskMemberRole,
  ExpenseStatus,
  FundAdvanceStatus,
  AllocationAdjustmentStatus,
  WorkloadWarningType,
} from '../types/preparation';

/* ====================================================================
  THEME COLORS
  ==================================================================== */

export const PREPARATION_COLORS = {
  primary: '#001C44',
  primaryHover: '#002A66',
  accent: '#FFD66D',
  accentHover: '#FFC947',
  statusPending: '#FCD34D',
  statusApproved: '#86EFAC',
  statusRejected: '#FCA5A5',
  statusInProgress: '#93C5FD',
  statusWarning: '#FB923C',
} as const;

/* ====================================================================
  TASK STATUS LABELS & BADGES
  ==================================================================== */

export const TASK_STATUS_LABELS: Record<PreparationTaskStatus, string> = {
  PENDING: 'Chưa nhận',
  ACCEPTED: 'Đang làm',
  COMPLETION_REQUESTED: 'Chờ phê duyệt',
  COMPLETED: 'Hoàn thành',
};

export const TASK_STATUS_BADGE_CLASS: Record<PreparationTaskStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border border-gray-300',
  ACCEPTED: 'bg-blue-100 text-blue-700 border border-blue-300',
  COMPLETION_REQUESTED: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  COMPLETED: 'bg-green-100 text-green-700 border border-green-300',
};

/* ====================================================================
  EXPENSE STATUS LABELS & BADGES
  ==================================================================== */

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING_LEADER: 'Chờ leader duyệt',
  PENDING_ADMIN: 'Chờ admin duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

export const EXPENSE_STATUS_BADGE_CLASS: Record<ExpenseStatus, string> = {
  PENDING_LEADER: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  PENDING_ADMIN: 'bg-blue-100 text-blue-700 border border-blue-300',
  APPROVED: 'bg-green-100 text-green-700 border border-green-300',
  REJECTED: 'bg-red-100 text-red-700 border border-red-300',
};

/* ====================================================================
  FUND ADVANCE STATUS LABELS & BADGES
  ==================================================================== */

export const FUND_ADVANCE_STATUS_LABELS: Record<FundAdvanceStatus, string> = {
  REQUESTED: 'Chờ duyệt',
  HOLDING: 'Đang nợ',
  SETTLED: 'Đã quyết toán',
  REJECTED: 'Từ chối',
};

export const FUND_ADVANCE_STATUS_BADGE_CLASS: Record<FundAdvanceStatus, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  HOLDING: 'bg-orange-100 text-orange-700 border border-orange-300',
  SETTLED: 'bg-green-100 text-green-700 border border-green-300',
  REJECTED: 'bg-red-100 text-red-700 border border-red-300',
};

/* ====================================================================
  ALLOCATION ADJUSTMENT STATUS LABELS & BADGES
  ==================================================================== */

export const ALLOCATION_STATUS_LABELS: Record<AllocationAdjustmentStatus, string> = {
  PENDING: 'Chờ xử lý',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Từ chối',
};

export const ALLOCATION_STATUS_BADGE_CLASS: Record<AllocationAdjustmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  APPROVED: 'bg-green-100 text-green-700 border border-green-300',
  REJECTED: 'bg-red-100 text-red-700 border border-red-300',
};

/* ====================================================================
  WORKLOAD WARNING LABELS & BADGES
  ==================================================================== */

export const WORKLOAD_WARNING_LABELS: Record<WorkloadWarningType, string> = {
  OVERLOADED: 'Quá tải',
  UNASSIGNED: 'Chưa giao task',
};

export const WORKLOAD_WARNING_BADGE_CLASS: Record<WorkloadWarningType, string> = {
  OVERLOADED: 'bg-red-100 text-red-700 border border-red-300',
  UNASSIGNED: 'bg-gray-100 text-gray-700 border border-gray-300',
};

/* ====================================================================
  MEMBER ROLE LABELS & BADGES
  ==================================================================== */

export const MEMBER_ROLE_LABELS: Record<PreparationTaskMemberRole, string> = {
  LEADER: 'Trưởng nhóm',
  MEMBER: 'Thành viên',
};

export const MEMBER_ROLE_BADGE_CLASS: Record<PreparationTaskMemberRole, string> = {
  LEADER: 'bg-purple-100 text-purple-700 border border-purple-300',
  MEMBER: 'bg-gray-100 text-gray-700 border border-gray-300',
};

/* ====================================================================
  VALIDATION CONSTRAINTS
  ==================================================================== */

export const PREPARATION_CONSTRAINTS = {
  // Task workload thresholds
  WORKLOAD_OVERLOADED_THRESHOLD: 3, // Tasks per person for warning

  // Budget warning thresholds
  BUDGET_WARNING_THRESHOLD: 0.8, // 80% - warning
  BUDGET_CRITICAL_THRESHOLD: 0.9, // 90% - critical

  // Amount validation
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 9999999999,

  // Form constraints
  DESCRIPTION_MAX_LENGTH: 500,
  CATEGORY_NAME_MAX_LENGTH: 100,
} as const;

/* ====================================================================
  EXPENSE STATUS COLORS (for charts/progress bars)
  ==================================================================== */

export const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
  PENDING_LEADER: PREPARATION_COLORS.statusPending,
  PENDING_ADMIN: PREPARATION_COLORS.statusInProgress,
  APPROVED: PREPARATION_COLORS.statusApproved,
  REJECTED: PREPARATION_COLORS.statusRejected,
};

/* ====================================================================
  FUND ADVANCE STATUS COLORS
  ==================================================================== */

export const FUND_ADVANCE_STATUS_COLORS: Record<FundAdvanceStatus, string> = {
  REQUESTED: PREPARATION_COLORS.statusPending,
  HOLDING: PREPARATION_COLORS.statusWarning,
  SETTLED: PREPARATION_COLORS.statusApproved,
  REJECTED: PREPARATION_COLORS.statusRejected,
};

/* ====================================================================
  BUDGET PROGRESS COLORS
  ==================================================================== */

export const BUDGET_PROGRESS_COLORS = {
  safe: '#10B981', // < 80%
  warning: '#F59E0B', // 80-90%
  critical: '#EF4444', // >= 90%
} as const;
