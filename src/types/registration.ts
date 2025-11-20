import { Activity } from './activity';
import { Student } from './student';
import { User } from './auth';

export enum RegistrationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    ATTENDED = 'ATTENDED'
}

// New ActivityRegistration interface matching backend
export interface ActivityRegistration {
    id: number;
    activity: Activity;
    student: Student;
    registrationDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
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

export interface TicketCodeValidateResponse {
    ticketCode: string;
    studentId: number;
    studentName: string;
    studentCode: string;
    activityId: number;
    activityName: string;
    currentStatus: RegistrationStatus;
    canCheckIn: boolean;
    canCheckOut: boolean;
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
