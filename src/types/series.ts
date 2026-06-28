import { ScoreType } from './activity';
import { ActivityResponse } from './activity';
import { SeriesPresetCode, SeriesPresetConfig } from './presets';

export interface StudentSeriesProgress {
    id?: number;
    studentId?: number;
    seriesId?: number;
    seriesName?: string;
    completedActivityIds?: string | number[]; // JSON array: [1,3,5] or array
    completedCount: number;
    totalActivities?: number;
    pointsEarned: string; // BigDecimal as string
    lastUpdated?: string;
    currentMilestone?: number;
    nextMilestoneCount?: number;
    nextMilestonePoints?: string;
    milestonePoints?: Record<number, number>;
    scoreType?: ScoreType;
    minimumRequirementEnabled?: boolean;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | null;
    minimumRequirementMet?: boolean;
    remainingToAvoidPenalty?: number;
}

/** P5: exact keys returned by GET /api/series/{id}/progress/my (Map<string,any>). */
export interface SeriesStudentProgressMap {
    studentId: number;
    seriesId: number;
    seriesName: string;
    completedCount: number;
    totalActivities: number;
    completedActivityIds: number[];
    pointsEarned: number | string;
    lastUpdated?: string | null;
    currentMilestone?: string | null;
    nextMilestoneCount?: number | null;
    nextMilestonePoints?: number | null;
    milestonePoints?: Record<string, number> | null;
    scoreType: ScoreType;
    minimumRequirementEnabled: boolean;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | null;
    minimumRequirementMet: boolean;
    remainingToAvoidPenalty: number;
}

export interface CreateSeriesRequest {
    name: string;
    description?: string;
    milestonePoints: Record<number, number>;
    scoreType: ScoreType;
    mainActivityId?: number;
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval?: boolean;
    ticketQuantity?: number;
    minimumRequirementEnabled?: boolean | null;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | null;
    targetSemesterId?: number | null;
    audience?: string | null;
    departmentIds?: number[] | null;
    isImportant?: boolean | null;
    mandatoryForFacultyStudents?: boolean | null;
    isDraft?: boolean | null;
    presetCode?: SeriesPresetCode | null;
    presetConfig?: SeriesPresetConfig | null;
}

export interface UpdateSeriesRequest {
    name?: string;
    description?: string;
    milestonePoints?: Record<number, number>;
    scoreType?: ScoreType;
    mainActivityId?: number | null;
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval?: boolean;
    ticketQuantity?: number;
    minimumRequirementEnabled?: boolean | null;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | null;
    targetSemesterId?: number | null;
    audience?: string | null;
    departmentIds?: number[] | null;
    isImportant?: boolean | null;
    mandatoryForFacultyStudents?: boolean | null;
    isDraft?: boolean | null;
    presetCode?: SeriesPresetCode | null;
    presetConfig?: SeriesPresetConfig | null;
}

export interface AddActivityToSeriesRequest {
    activityId: number;
    order: number;
}

export interface SeriesResponse {
    id: number;
    name: string;
    description?: string;
    milestonePoints: Record<number, number>;
    scoreType: ScoreType;
    mainActivityId?: number;
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval: boolean;
    ticketQuantity?: number;
    minimumRequirementEnabled?: boolean;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | null;
    targetSemesterId?: number | null;
    audience?: string | null;
    targetDepartmentIds?: number[] | null;
    isImportant: boolean;
    mandatoryForFacultyStudents: boolean;
    isDraft: boolean;
    presetCode?: string | null;
    presetConfig?: import('./presets').SeriesPresetConfig | null;
    createdAt: string;
    activities?: ActivityResponse[];
    totalActivities?: number;
    deleted?: boolean;
}

export interface SeriesRegistrationResponse {
    status: boolean;
    message: string;
    data: any[]; // Array of ActivityRegistrationResponse
}

// Student registration status for a series
export interface SeriesRegistrationStatus {
    seriesId: number;
    studentId: number;
    isRegistered: boolean;
}

/** P7: helper types thuần FE (BE không thêm field vào SeriesRegistrationStatus — Q5). */
export interface SeriesSlotInfo {
    ticketQuantity: number | null;
    approvedCount: number;
    remainingSlots: number | null; // null = unlimited
    isFull: boolean; // false nếu unlimited
}

// Parse and format helper functions removed as milestonePoints is now Record<number, number> directly.

// Series Overview Response (Admin/Manager)
export interface MilestoneProgressItem {
    milestoneKey: string; // "3", "4", "5"
    milestoneCount: number; // Số activity cần để đạt milestone này
    milestonePoints: number; // Điểm thưởng
    studentCount: number; // Số SV đã đạt milestone này
    percentage: number; // % so với tổng số SV đã đăng ký
}

export interface ActivityStatItem {
    activityId: number;
    activityName: string;
    order?: number; // Thứ tự trong series
    registrationCount: number; // Số đăng ký
    participationCount: number; // Số tham gia (COMPLETED)
    participationRate: number; // Tỷ lệ tham gia (0.0 - 1.0)
}

export interface SeriesOverviewResponse {
    seriesId: number;
    seriesName: string;
    description?: string;
    scoreType: ScoreType;
    milestonePoints: Record<number, number>;
    milestonePointsMap: Record<string, number>; // Parsed milestone points
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval: boolean;
    ticketQuantity?: number;
    minimumRequirementEnabled?: boolean;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | null;
    targetSemesterId?: number | null;
    createdAt: string;
    
    // Statistics
    totalActivities: number;
    totalRegisteredStudents: number;
    totalCompletedStudents: number; // Hoàn thành tất cả activities
    completionRate: number; // completedStudents / registeredStudents (0.0 - 1.0)
    totalMilestonePointsAwarded: string; // BigDecimal as string
    
    // Progress distribution by milestone
    milestoneProgress: MilestoneProgressItem[];
    
    // Activity statistics
    activityStats: ActivityStatItem[];
}

// Series Progress List Response (Admin/Manager)
export interface SeriesProgressItemResponse {
    studentId: number;
    studentCode: string;
    studentName: string;
    className?: string; // optional, từ student.studentClass
    departmentName?: string; // optional, từ student.department
    completedCount: number;
    totalActivities: number;
    pointsEarned: string; // BigDecimal as string
    currentMilestone?: string | null; // optional, key của milestone hiện tại (ví dụ: "3")
    completedActivityIds: number[];
    lastUpdated: string;
    isRegistered: boolean; // có đăng ký series chưa
}

export interface SeriesProgressListResponse {
    seriesId: number;
    seriesName: string;
    totalActivities: number;
    totalRegistered: number; // tổng số SV đã đăng ký
    progressList: SeriesProgressItemResponse[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
}
