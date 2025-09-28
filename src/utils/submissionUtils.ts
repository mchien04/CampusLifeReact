import { SubmissionStatus } from '../types/submission';

export const getSubmissionStatusColor = (status?: SubmissionStatus): string => {
    switch (status) {
        case SubmissionStatus.GRADED:
            return 'bg-green-100 text-green-800';
        case SubmissionStatus.SUBMITTED:
            return 'bg-blue-100 text-blue-800';
        case SubmissionStatus.LATE:
            return 'bg-red-100 text-red-800';
        case SubmissionStatus.RETURNED:
            return 'bg-yellow-100 text-yellow-800';
        case SubmissionStatus.MISSING:
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getSubmissionStatusLabel = (status?: SubmissionStatus): string => {
    switch (status) {
        case SubmissionStatus.GRADED:
            return 'Đã chấm điểm';
        case SubmissionStatus.SUBMITTED:
            return 'Đã nộp';
        case SubmissionStatus.LATE:
            return 'Nộp muộn';
        case SubmissionStatus.RETURNED:
            return 'Trả lại';
        case SubmissionStatus.MISSING:
            return 'Chưa nộp';
        default:
            return 'Chưa nộp';
    }
};
