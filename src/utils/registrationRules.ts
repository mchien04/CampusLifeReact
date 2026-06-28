import { ActivityRegistrationResponse, RegistrationStatus } from '../types/registration';

/**
 * P7-5 (Q3): Tập hợp activityId mà sinh viên hiện tại đã từng huỷ (status === CANCELLED).
 * Dùng để ẩn nút đăng ký lại và hiện text "Bạn đã huỷ đăng ký sự kiện này".
 *
 * Safety net: BE chỉ chặn ở bước register, nhưng existsByActivityIdAndStudentId exclude CANCELLED
 * → /registration-status trả isRegistered=false → nút đăng ký vẫn hiện nếu không cache.
 *
 * @param registrations danh sách từ GET /api/registrations/my (đã fetch ở nhiều nơi, tái dùng).
 */
export const findCancelledActivityIds = (
    registrations: ActivityRegistrationResponse[] | null | undefined
): Set<number> => {
    const set = new Set<number>();
    if (!registrations || !Array.isArray(registrations)) return set;
    for (const reg of registrations) {
        if (reg?.status === RegistrationStatus.CANCELLED && reg.activityId != null) {
            set.add(reg.activityId);
        }
    }
    return set;
};

/**
 * Kiểm tra một activityId có nằm trong tập đã huỷ (re-register block).
 */
export const hasCancelledBefore = (
    activityId: number,
    registrations: ActivityRegistrationResponse[] | null | undefined
): boolean => {
    return findCancelledActivityIds(registrations).has(activityId);
};