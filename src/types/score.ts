export type ScoreSourceType = 'MANUAL' | 'ACTIVITY_CHECKIN' | 'ACTIVITY_SUBMISSION' | 'SERIES_MILESTONE' | 'MINIGAME' | 'CHUYEN_DE_COUNT';

export type ScoreEntrySourceType =
    | "ACTIVITY_PARTICIPATION"
    | "ACTIVITY_REGISTRATION"
    | "TASK_SUBMISSION"
    | "TASK_ASSIGNMENT"
    | "MINIGAME_ATTEMPT"
    | "SERIES_PROGRESS"
    | "SERIES_MINIMUM_REQUIREMENT"
    | "MANUAL_ADJUSTMENT"
    | "RECALCULATION";
export type ScoreType = 'REN_LUYEN' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE';

/** Params for GET /api/scores/export — omit scoreType to export all 3 types + total. */
export interface ExportSemesterScoresParams {
    semesterId: number;
    departmentId?: number;
    classId?: number;
    scoreType?: ScoreType;
}

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
    score: number;
    notes?: string;
    /** @deprecated legacy — prefer notes */
    sourceType?: ScoreSourceType;
    activityId?: number;
    taskId?: number;
    submissionId?: number;
    /** @deprecated legacy — prefer notes */
    sourceNote?: string;
    criterionId?: number;
}

export interface ScoreTypeSummary {
    scoreType: ScoreType;
    /** Điểm học kỳ hiện tại */
    total: number;
    /** Tổng tích lũy suốt các kỳ — chỉ CTXH & Chuyên đề */
    cumulativeTotal?: number | null;
    items: ScoreItem[];
}

export interface ScoreViewResponse {
    studentId: number;
    semesterId: number;
    summaries: ScoreTypeSummary[];
}

export interface ScoreTotalResponse {
    studentId: number;
    semesterId: number;
    grandTotal: number;
    totalsByType: Partial<Record<ScoreType, number>>;
    cumulativeTotals: Partial<Record<ScoreType, number>>;
    scoreCount: number;
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
    score: number;
    scoreTypeLabel: string;
}

export interface StudentRankingResponseData {
    semesterId: number;
    semesterName: string;
    scoreType: string | null;
    departmentId: number | null;
    classId: number | null;
    sortOrder: "ASC" | "DESC";
    totalStudents: number;
    rankings: StudentRankingResponse[];
}

export interface StudentRankResponse {
    rank: number;
    studentId: number;
    studentCode: string;
    studentName: string;
    departmentName: string;
    className: string;
    score: string;
}

export type ScoreHistorySourceType = 'ACTIVITY' | 'MINIGAME' | 'MILESTONE' | 'RECALCULATED';

export interface ActivityParticipationDetailResponse {
    activityId: number | null;
    activityName: string | null;
    participationType: string;
    pointsEarned: number;
    participationDate?: string;
    completionDate?: string | null;
    /** @deprecated */
    id?: number;
    activityType?: string | null;
    seriesId?: number | null;
    seriesName?: string | null;
    date?: string;
    isCompleted?: boolean;
    sourceType?: 'ACTIVITY' | 'MINIGAME';
}

export interface ScoreHistoryDetailResponse {
    id: number;
    oldScore: number;
    newScore: number;
    changeDate: string;
    reason: string;
    activityId: number | null;
    activityName: string | null;
    seriesId: number | null;
    seriesName: string | null;
    sourceType: ScoreEntrySourceType | string;
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
    currentScore: number;
    scoreHistories: ScoreHistoryDetailResponse[];
    activityParticipations: ActivityParticipationDetailResponse[];
    totalRecords: number;
    page: number;
    size: number;
    totalPages: number;
}

export const SCORE_TYPE_ORDER: ScoreType[] = ['REN_LUYEN', 'CONG_TAC_XA_HOI', 'CHUYEN_DE'];

export const SCORE_TYPE_META: Record<ScoreType, { label: string; shortLabel: string; cumulative: boolean; accent: string }> = {
    REN_LUYEN: {
        label: 'Điểm rèn luyện',
        shortLabel: 'Rèn luyện',
        cumulative: false,
        accent: 'from-primary-900 to-primary-800',
    },
    CONG_TAC_XA_HOI: {
        label: 'Công tác xã hội',
        shortLabel: 'CTXH',
        cumulative: true,
        accent: 'from-emerald-800 to-teal-900',
    },
    CHUYEN_DE: {
        label: 'Chuyên đề doanh nghiệp',
        shortLabel: 'Chuyên đề',
        cumulative: true,
        accent: 'from-indigo-900 to-primary-900',
    },
};

export const isCumulativeScoreType = (type: ScoreType): boolean =>
    SCORE_TYPE_META[type]?.cumulative ?? false;

export const getScoreTypeLabel = (type: ScoreType | null | undefined): string => {
    if (!type) return 'Tổng điểm';
    return SCORE_TYPE_META[type]?.label ?? type;
};

export const getScoreItemLabel = (item: ScoreItem): string => {
    if (item.notes?.trim()) return item.notes.trim();
    if (item.sourceNote?.trim()) return item.sourceNote.trim();
    if (item.sourceType) return getSourceTypeLabel(item.sourceType);
    return 'Khoản điểm';
};

export const getSourceTypeLabel = (sourceType: string): string => {
    switch (sourceType) {
        case 'ACTIVITY_PARTICIPATION':
        case 'ACTIVITY':
            return 'Tham gia sự kiện';
        case 'TASK_SUBMISSION':
        case 'ACTIVITY_SUBMISSION':
            return 'Nộp bài tập';
        case 'MINIGAME_ATTEMPT':
        case 'MINIGAME':
            return 'Minigame Quiz';
        case 'SERIES_PROGRESS':
        case 'MILESTONE':
            return 'Milestone (Chuỗi sự kiện)';
        case 'MANUAL_ADJUSTMENT':
        case 'MANUAL':
            return 'Điều chỉnh thủ công';
        case 'RECALCULATION':
        case 'RECALCULATED':
            return 'Tính lại điểm';
        default:
            return sourceType;
    }
};

export const getSourceTypeColor = (sourceType: string): string => {
    switch (sourceType) {
        case 'MINIGAME_ATTEMPT':
        case 'MINIGAME':
            return 'bg-amber-50 text-amber-800 border-amber-200';
        case 'SERIES_PROGRESS':
        case 'MILESTONE':
            return 'bg-violet-50 text-violet-800 border-violet-200';
        case 'RECALCULATION':
        case 'RECALCULATED':
            return 'bg-gray-50 text-gray-700 border-gray-200';
        case 'ACTIVITY_PARTICIPATION':
        case 'ACTIVITY':
            return 'bg-sky-50 text-sky-800 border-sky-200';
        case 'TASK_SUBMISSION':
        case 'ACTIVITY_SUBMISSION':
            return 'bg-emerald-50 text-emerald-800 border-emerald-200';
        case 'MANUAL_ADJUSTMENT':
        case 'MANUAL':
            return 'bg-orange-50 text-orange-800 border-orange-200';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

export const formatScore = (score: string | number | null | undefined): string => {
    if (score === null || score === undefined) return '—';
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
    } catch {
        return dateTime;
    }
};

export type ScoreAppealStatus =
    | 'PENDING'
    | 'IN_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'CLOSED';

export interface ManualScoreRequest {
    studentId: number;
    /** Học kỳ tích điểm — bắt buộc */
    semesterId: number;
    scoreType: ScoreType;
    /** Có thể âm (phạt) hoặc dương (cộng). */
    points: number | string;
    reason: string;
    activityId?: number | null;
}

/** Bulk: cùng học kỳ + loại điểm + lý do chung cho nhiều SV */
export interface BulkManualScoreRequest {
    semesterId: number;
    scoreType: ScoreType;
    reason: string;
    activityId?: number | null;
    entries: Array<{
        studentId: number;
        points: number | string;
        reason?: string | null;
    }>;
}

export interface BulkManualScoreItemResult {
    studentId: number;
    success: boolean;
    data?: ManualScoreResponse | null;
    error?: string | null;
}

export interface BulkManualScoreResponse {
    semesterId: number;
    scoreType: ScoreType;
    total: number;
    successCount: number;
    failureCount: number;
    results: BulkManualScoreItemResult[];
}

export interface ManualScoreReverseRequest {
    reason: string;
}

export interface ManualScoreResponse {
    adjustmentId: number;
    scoreEntryId: number;
    studentId: number;
    semesterId: number;
    scoreType: ScoreType;
    points: number | string;
    reason: string;
    activityId?: number | null;
    createdByUserId?: number | null;
    createdAt?: string | null;
}

export interface CreateScoreAppealRequest {
    semesterId: number;
    scoreType: ScoreType;
    relatedScoreEntryId?: number | null;
    title: string;
    reason: string;
    requestedPoints?: number | string | null;
    /** URL ảnh minh chứng từ POST /api/scores/appeals/evidence (max 5) */
    evidenceUrls?: string[] | null;
}

export interface ScoreAppealEvidenceUploadResponse {
    urls: string[];
}

export interface ScoreAppealDecisionPreviewResponse {
    appealId: number;
    studentId: number;
    studentCode?: string | null;
    studentFullName?: string | null;
    semesterId: number;
    scoreType: ScoreType;
    decision: 'APPROVED' | 'REJECTED';
    currentScore: number | string;
    adjustedPoints?: number | string | null;
    projectedScore: number | string;
    willCreateLedgerEntry: boolean;
    relatedScoreEntryId?: number | null;
    relatedEntryPoints?: number | string | null;
    note: string;
}

export interface ScoreAppealMessageRequest {
    content: string;
}

export interface ScoreAppealDecisionRequest {
    decision: 'APPROVED' | 'REJECTED';
    decisionNotes?: string | null;
    adjustedPoints?: number | string | null;
    scoreType?: ScoreType | null;
    semesterId?: number | null;
}

export interface ScoreAppealMessageResponse {
    id: number;
    senderId: number;
    senderUsername: string;
    content: string;
    createdAt?: string | null;
}

export interface ScoreAppealResponse {
    id: number;
    studentId: number;
    studentCode?: string | null;
    studentFullName?: string | null;
    semesterId: number;
    scoreType: ScoreType;
    relatedScoreEntryId?: number | null;
    title: string;
    reason: string;
    /** URL ảnh minh chứng */
    evidenceUrls?: string[] | null;
    requestedPoints?: number | string | null;
    status: ScoreAppealStatus;
    decisionNotes?: string | null;
    decidedAt?: string | null;
    decidedById?: number | null;
    decidedByUsername?: string | null;
    resultingScoreEntryId?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    messages: ScoreAppealMessageResponse[];
}

export interface ScoreAppealPageBody {
    content: ScoreAppealResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export const SCORE_APPEAL_STATUS_META: Record<
    ScoreAppealStatus,
    { label: string; className: string }
> = {
    PENDING: {
        label: 'Chờ xử lý',
        className: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    IN_REVIEW: {
        label: 'Đang xem xét',
        className: 'bg-sky-50 text-sky-900 border-sky-200',
    },
    APPROVED: {
        label: 'Đã chấp nhận',
        className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    REJECTED: {
        label: 'Từ chối',
        className: 'bg-red-50 text-red-800 border-red-200',
    },
    CLOSED: {
        label: 'Đã đóng',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
    },
};

export const getScoreAppealStatusLabel = (status: ScoreAppealStatus | string): string =>
    SCORE_APPEAL_STATUS_META[status as ScoreAppealStatus]?.label ?? status;

export const getScoreAppealStatusClass = (status: ScoreAppealStatus | string): string =>
    SCORE_APPEAL_STATUS_META[status as ScoreAppealStatus]?.className
    ?? 'bg-gray-50 text-gray-700 border-gray-200';

export type RecalculationJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "TIMEOUT";

export interface RecalculationJobResponse {
    id: number;
    semesterId: number;
    status: RecalculationJobStatus;
    totalStudents: number;
    processedStudents: number;
    errorCount: number;
    progressPercent: number;
    startedAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
    errorDetails?: string | null;
}

export interface ScoreBreakdownItem {
    sourceType: string;
    totalPoints: number | string;
    entryCount: number;
    percentage?: number;
}

export interface ScoreBreakdownResponse {
    semesterId: number;
    semesterName?: string;
    studentId?: number | null;
    breakdowns: ScoreBreakdownItem[];
    /** @deprecated */
    scoreType?: string | null;
    /** @deprecated */
    totalScore?: number | string;
    /** @deprecated */
    breakdown?: ScoreBreakdownItem[];
}
