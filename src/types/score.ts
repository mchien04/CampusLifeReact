export type ScoreSourceType = 'MANUAL' | 'ACTIVITY_CHECKIN' | 'ACTIVITY_SUBMISSION' | 'SERIES_MILESTONE' | 'MINIGAME' | 'CHUYEN_DE_COUNT';
export type ScoreType = 'REN_LUYEN' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE';

export interface TrainingCalculateItem {
    criterionId: number;
    criterionName: string;
    score: number;
}

export interface TrainingCalculateResponse {
    total: number;
    items: TrainingCalculateItem[];
}

export interface ScoreItem {
    score: string; // BigDecimal as string
    sourceType: ScoreSourceType;
    activityId?: number;
    taskId?: number;
    submissionId?: number;
    sourceNote?: string;
    criterionId?: number;
}

export interface ScoreTypeSummary {
    scoreType: ScoreType;
    total: string; // BigDecimal as string
    items: ScoreItem[];
}

export interface ScoreViewResponse {
    studentId: number;
    semesterId: number;
    summaries: ScoreTypeSummary[];
}

export interface StudentRankingResponse {
    rank: number;
    studentId: number;
    studentCode: string;
    studentName: string;
    departmentId: number | null;
    departmentName: string | null;
    classId: number | null;
    className: string | null;
    semesterId: number;
    semesterName: string;
    scoreType: ScoreType | null;
    score: number; // BigDecimal as number
    scoreTypeLabel: string;
}

export interface StudentRankingResponseData {
    semesterId: number;
    semesterName: string;
    scoreType: string | null; // "REN_LUYEN" | "CONG_TAC_XA_HOI" | "CHUYEN_DE" | "KHAC" | "TOTAL"
    departmentId: number | null;
    classId: number | null;
    sortOrder: "ASC" | "DESC";
    totalStudents: number;
    rankings: StudentRankingResponse[];
}

// Score History Types
export type ScoreHistorySourceType = 'ACTIVITY' | 'MINIGAME' | 'MILESTONE' | 'RECALCULATED';

export interface ActivityParticipationDetailResponse {
    id: number;
    activityId: number | null;
    activityName: string | null;
    activityType: string | null; // ActivityType
    seriesId: number | null;
    seriesName: string | null;
    pointsEarned: string; // BigDecimal as string
    participationType: string; // ParticipationType
    date: string; // LocalDateTime as string
    isCompleted: boolean;
    sourceType: 'ACTIVITY' | 'MINIGAME';
}

export interface ScoreHistoryDetailResponse {
    id: number;
    oldScore: string; // BigDecimal as string
    newScore: string; // BigDecimal as string
    changeDate: string; // LocalDateTime as string
    reason: string;
    activityId: number | null;
    activityName: string | null;
    seriesId: number | null;
    seriesName: string | null;
    sourceType: ScoreHistorySourceType;
    changedByUsername: string | null;
    changedByFullName: string | null;
}

export interface ScoreHistoryViewResponse {
    studentId: number;
    studentCode: string;
    studentName: string;
    semesterId: number;
    semesterName: string;
    scoreType: ScoreType | null;
    currentScore: string; // BigDecimal as string
    scoreHistories: ScoreHistoryDetailResponse[];
    activityParticipations: ActivityParticipationDetailResponse[];
    totalRecords: number;
    page: number;
    size: number;
    totalPages: number;
}

// Helper functions
export const getSourceTypeLabel = (sourceType: string): string => {
    switch (sourceType) {
        case 'MINIGAME':
            return 'Minigame Quiz';
        case 'MILESTONE':
            return 'Milestone (Chuỗi sự kiện)';
        case 'RECALCULATED':
            return 'Tính lại điểm';
        case 'ACTIVITY':
            return 'Hoạt động';
        default:
            return sourceType;
    }
};

export const getSourceTypeColor = (sourceType: string): string => {
    switch (sourceType) {
        case 'MINIGAME':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'MILESTONE':
            return 'bg-purple-100 text-purple-800 border-purple-300';
        case 'RECALCULATED':
            return 'bg-gray-100 text-gray-800 border-gray-300';
        case 'ACTIVITY':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

export const formatScore = (score: string | number): string => {
    const num = typeof score === 'string' ? parseFloat(score) : score;
    return isNaN(num) ? '0.00' : num.toFixed(2);
};

export const formatDateTime = (dateTime: string): string => {
    try {
        const date = new Date(dateTime);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        return dateTime;
    }
};


