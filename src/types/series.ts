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

