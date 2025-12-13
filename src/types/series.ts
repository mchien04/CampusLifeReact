import { ScoreType } from './activity';
import { ActivityResponse } from './activity';

export interface ActivitySeries {
    id: number;
    name: string;
    description?: string;
    milestonePoints: string; // JSON string: {"3": 5, "4": 7, "5": 10}
    scoreType: ScoreType;
    mainActivityId?: number;
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval: boolean;
    ticketQuantity?: number;
    createdAt: string;
    activities?: ActivityResponse[];
}

export interface StudentSeriesProgress {
    id?: number;
    studentId?: number;
    seriesId?: number;
    completedActivityIds?: string | number[]; // JSON array: [1,3,5] or array
    completedCount: number;
    totalActivities?: number;
    pointsEarned: string; // BigDecimal as string
    lastUpdated?: string;
    // New fields from API response
    currentMilestone?: number; // Mốc hiện tại đã đạt
    nextMilestoneCount?: number; // Số sự kiện cần để đạt mốc tiếp theo
    nextMilestonePoints?: string; // Điểm sẽ nhận khi đạt mốc tiếp theo
    milestonePoints?: string | Record<number, number>; // Map các mốc điểm (JSON string or object)
    scoreType?: ScoreType; // Loại điểm (REN_LUYEN, etc.)
}

export interface CreateSeriesRequest {
    name: string;
    description?: string;
    milestonePoints: string; // JSON string
    scoreType: ScoreType;
    mainActivityId?: number;
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval?: boolean;
    ticketQuantity?: number;
}

export interface UpdateSeriesRequest {
    name?: string;
    description?: string;
    milestonePoints?: string; // JSON string
    scoreType?: ScoreType;
    mainActivityId?: number | null;
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval?: boolean;
    ticketQuantity?: number;
}

export interface CreateActivityInSeriesRequest {
    name: string; // bắt buộc
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    order?: number;
    shareLink?: string;
    bannerUrl?: string;
    benefits?: string;
    requirements?: string;
    contactInfo?: string;
    organizerIds?: number[]; // Danh sách ID các khoa/ban tổ chức
    type?: "MINIGAME"; // Optional, chỉ set khi tạo minigame
}

export interface AddActivityToSeriesRequest {
    activityId: number;
    order: number;
}

export interface SeriesResponse {
    id: number;
    name: string;
    description?: string;
    milestonePoints: string;
    scoreType: ScoreType;
    mainActivityId?: number;
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval: boolean;
    ticketQuantity?: number;
    createdAt: string;
    activities?: ActivityResponse[];
    totalActivities?: number;
    deleted?: boolean; // Soft delete flag (from backend: "deleted")
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

// Helper to parse milestone points
export const parseMilestonePoints = (milestonePoints: string): Record<number, number> => {
    try {
        return JSON.parse(milestonePoints);
    } catch {
        return {};
    }
};

// Helper to format milestone points
export const formatMilestonePoints = (points: Record<number, number>): string => {
    return JSON.stringify(points);
};

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
    milestonePoints: string; // JSON string
    milestonePointsMap: Record<string, number>; // Parsed milestone points
    registrationStartDate?: string;
    registrationDeadline?: string;
    requiresApproval: boolean;
    ticketQuantity?: number;
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

