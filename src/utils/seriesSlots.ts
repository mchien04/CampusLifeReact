import { ActivityRegistrationResponse, RegistrationStatus } from '../types/registration';
import { SeriesSlotInfo } from '../types/series';

/**
 * P7-7 / P7-9 (Q4): FE client-side compute số slot còn lại của series.
 * BE không có field APPROVED-only trực tiếp → FE đếm distinct APPROVED student từ
 * GET /api/registrations/series/{seriesId}.
 *
 * @param ticketQuantity capacity từ SeriesResponse (null/undefined = unlimited).
 * @param registrations danh sách đăng ký của series (tất cả activity con × SV).
 */
export const computeSeriesSlots = (
    ticketQuantity: number | null | undefined,
    registrations: ActivityRegistrationResponse[] | null | undefined
): SeriesSlotInfo => {
    const capacity = ticketQuantity ?? null;

    // Đếm distinct studentId có status APPROVED (tránh trùng do nhiều activity con).
    const approvedStudentIds = new Set<number>();
    if (registrations && Array.isArray(registrations)) {
        for (const reg of registrations) {
            if (reg?.status === RegistrationStatus.APPROVED && reg.studentId != null) {
                approvedStudentIds.add(reg.studentId);
            }
        }
    }
    const approvedCount = approvedStudentIds.size;

    if (capacity === null) {
        return {
            ticketQuantity: null,
            approvedCount,
            remainingSlots: null,
            isFull: false
        };
    }

    const remainingSlots = Math.max(0, capacity - approvedCount);
    return {
        ticketQuantity: capacity,
        approvedCount,
        remainingSlots,
        isFull: approvedCount >= capacity
    };
};