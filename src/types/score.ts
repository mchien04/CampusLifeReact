export type ScoreSourceType = 'MANUAL' | 'ACTIVITY_CHECKIN' | 'ACTIVITY_SUBMISSION';
export type ScoreType = 'REN_LUYEN' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE' | 'KHAC';

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


