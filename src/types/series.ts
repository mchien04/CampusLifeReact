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
    id: number;
    studentId: number;
    seriesId: number;
    completedActivityIds: string; // JSON array: [1,3,5]
    completedCount: number;
    pointsEarned: string; // BigDecimal as string
    lastUpdated: string;
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

export interface CreateActivityInSeriesRequest {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    location: string;
    order: number;
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
}

export interface SeriesRegistrationResponse {
    status: boolean;
    message: string;
    data: any[]; // Array of ActivityRegistrationResponse
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

