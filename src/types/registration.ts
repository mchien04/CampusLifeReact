export enum RegistrationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

export enum ParticipationType {
    ATTENDANCE = 'ATTENDANCE',
    SUBMISSION = 'SUBMISSION',
    VOLUNTEER = 'VOLUNTEER',
    ORGANIZER = 'ORGANIZER',
    OTHER = 'OTHER'
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
}

export interface ActivityParticipationRequest {
    activityId: number;
    participationType: ParticipationType;
    pointsEarned?: number;
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
    pointsEarned?: number;
    date: string; // LocalDateTime in backend, so string
    notes?: string;
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
        default:
            return status;
    }
};

export const getParticipationTypeLabel = (type: ParticipationType): string => {
    switch (type) {
        case ParticipationType.ATTENDANCE:
            return 'Tham gia';
        case ParticipationType.SUBMISSION:
            return 'Nộp bài';
        case ParticipationType.VOLUNTEER:
            return 'Tình nguyện';
        case ParticipationType.ORGANIZER:
            return 'Tổ chức';
        case ParticipationType.OTHER:
            return 'Khác';
        default:
            return type;
    }
};
