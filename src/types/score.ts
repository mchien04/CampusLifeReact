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


