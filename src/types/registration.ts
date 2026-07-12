import { ActivityResponse, ScoreType, ScoreRuleTrigger } from './activity';
import { Student } from './student';
import { User } from './auth';

/**
 * Một khoản điểm được backend (scoring engine mới) áp dụng cho sinh viên.
 * FE phải render từng `displayText` thay vì gộp thành một tổng cross-type.
 * VD: "+5 điểm rèn luyện", "+1 buổi chuyên đề".
 */
export interface AppliedScoreAward {
    ruleId?: number | null;
    scoreType: ScoreType;
    scoreTypeLabel: string;
    points: number | string; // BigDecimal
    displayUnit: string;
    displayText: string; // e.g., "+5 điểm rèn luyện"
    triggerType?: ScoreRuleTrigger | null;
    scoreEntryId?: number | null;
}

/**
 * P7-1: Response từ GET /api/activities/{activityId}/registration-status.
 * BE trả Map (không có DTO cố định) → các field là best-effort, parse dùng optional/fallback.
 */
export interface ActivityRegistrationStatusResponse {
    isRegistered?: boolean;
    status?: RegistrationStatus | null;
    canCancel?: boolean;
    /** Các key khác của Map (tuỳ chọn). */
    [key: string]: unknown;
}

export enum RegistrationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    ATTENDED = 'ATTENDED',
    WAITLIST = 'WAITLIST'
}

// New ActivityRegistration interface matching backend
export interface ActivityRegistration {
    id: number;
    activity: ActivityResponse;
    student: Student;
    registrationDate: string;
    status: RegistrationStatus;
    participationType: 'INDIVIDUAL' | 'GROUP';
    groupName?: string;
    notes?: string;
    approvedBy?: User;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

export enum ParticipationType {
    REGISTERED = 'REGISTERED',
    CHECKED_IN = 'CHECKED_IN',
    CHECKED_OUT = 'CHECKED_OUT',
    ATTENDED = 'ATTENDED',
    COMPLETED = 'COMPLETED'
}

export enum EventTimeStatus {
    UPCOMING = 'UPCOMING',
    ONGOING = 'ONGOING',
    PAST = 'PAST'
}

export type ActivityTypeCalendar =
    | 'SUKIEN'
    | 'MINIGAME'
    | 'CONG_TAC_XA_HOI'
    | 'CHUYEN_DE_DOANH_NGHIEP';

export interface CalendarMarkedDate {
    date: string; // YYYY-MM-DD
    eventCount: number;
}

export interface PersonalCalendarEventItem {
    registrationId: number;
    activityId: number;
    title: string;
    startTime: string;
    endTime: string | null;
    location?: string;
    status: RegistrationStatus;
    eventTimeStatus: EventTimeStatus;
    activityType?: ActivityTypeCalendar | null;
    bannerUrl?: string | null;
    shareLink?: string | null;
    ticketCode?: string | null;
    seriesId?: number | null;
    important: boolean;
}

export interface PersonalCalendarResponse {
    from: string | null;
    to: string | null;
    markedDates: CalendarMarkedDate[];
    events: PersonalCalendarEventItem[];
}

export interface ActivityRegistrationRequest {
    activityId: number;
    feedback?: string;
}

export interface ActivityRegistrationResponse {
    id: number;
    activityId: number;
    activityName: string;
    activityDescription?: string;
    activityStartDate: string; // LocalDate in backend, so string YYYY-MM-DD
    activityEndDate: string; // LocalDate in backend, so string YYYY-MM-DD
    activityLocation?: string;
    studentId: number;
    studentName: string;
    studentCode: string;
    status: RegistrationStatus;
    feedback?: string;
    registeredDate: string; // LocalDateTime in backend, so string
    createdAt: string; // LocalDateTime in backend, so string
    ticketCode?: string;
}

export interface ActivityParticipationRequest {
    ticketCode?: string;
    studentId?: number;
    participationType?: ParticipationType | null;
    pointsEarned?: number | null;
    notes?: string;
}

export interface ActivityParticipationResponse {
    id: number;
    activityId: number;
    activityName: string;
    studentId: number;
    studentName: string;
    studentCode: string;
    participationType: ParticipationType;
    /** @deprecated Tương thích ngược — tổng điểm cộng gộp. Ưu tiên hiển thị `scoreAwards`. */
    pointsEarned?: number | string | null;
    /** Danh sách điểm chi tiết theo từng loại điểm (scoring engine mới). */
    scoreAwards?: AppliedScoreAward[];
    date: string; // LocalDateTime in backend, so string
    isCompleted?: boolean | null;
    notes?: string;
}

export interface TicketCodeValidateResponse {
    ticketCode: string;
    studentId: number;
    studentName: string;
    studentCode: string;
    activityId: number;
    activityName: string;
    currentStatus: ParticipationType;
    canCheckIn: boolean;
    canCheckOut: boolean;
    checkInOpenAt?: string | null;
    checkInClosedAt?: string | null;
}

// Helper function to get Vietnamese labels
export const getRegistrationStatusLabel = (status: RegistrationStatus): string => {
    switch (status) {
        case RegistrationStatus.PENDING:
            return 'Chờ duyệt';
        case RegistrationStatus.APPROVED:
            return 'Đã duyệt';
        case RegistrationStatus.REJECTED:
            return 'Từ chối';
        case RegistrationStatus.CANCELLED:
            return 'Đã hủy';
        case RegistrationStatus.ATTENDED:
            return 'Đã tham dự';
        case RegistrationStatus.WAITLIST:
            return 'Danh sách chờ';
        default:
            return status;
    }
};

export const getParticipationTypeLabel = (type: ParticipationType): string => {
    switch (type) {
        case ParticipationType.REGISTERED:
            return 'Đã đăng ký';
        case ParticipationType.CHECKED_IN:
            return 'Đã check-in';
        case ParticipationType.CHECKED_OUT:
            return 'Đã check-out';
        case ParticipationType.ATTENDED:
            return 'Đã tham gia';
        case ParticipationType.COMPLETED:
            return 'Đã hoàn thành';
        default:
            return type;
    }
};
