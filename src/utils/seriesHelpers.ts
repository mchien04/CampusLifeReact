import { SeriesResponse } from '../types/series';

export type SeriesStatusTone = 'draft' | 'active' | 'ended';

export function getSeriesStatus(series: SeriesResponse): {
    label: string;
    tone: SeriesStatusTone;
} {
    const isDraft = series.isDraft ?? series.draft ?? false;
    if (isDraft) return { label: 'Nháp', tone: 'draft' };
    if (series.ended) return { label: 'Đã kết thúc', tone: 'ended' };
    return { label: 'Đang diễn ra', tone: 'active' };
}

/**
 * Hiển thị: chưa kết thúc trước, mới nhất lên trên; đã kết thúc xuống dưới (cũng mới nhất trước).
 */
export function sortSeriesForDisplay(list: SeriesResponse[]): SeriesResponse[] {
    return [...list].sort((a, b) => {
        const aEnded = a.ended ? 1 : 0;
        const bEnded = b.ended ? 1 : 0;
        if (aEnded !== bEnded) return aEnded - bEnded;

        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;

        return (b.id ?? 0) - (a.id ?? 0);
    });
}

export function canStudentRegisterSeries(
    series: SeriesResponse,
    now = new Date()
): boolean {
    const isDraft = series.isDraft ?? series.draft ?? false;
    if (isDraft || series.ended) return false;
    if (series.registrationStartDate && now < new Date(series.registrationStartDate)) {
        return false;
    }
    if (series.registrationDeadline && now > new Date(series.registrationDeadline)) {
        return false;
    }
    return true;
}

/** Phòng thủ phía FE — BE getAllActivities đã lọc draft. */
export function visibleToStudent(activity: {
    isDraft?: boolean;
    draft?: boolean;
}): boolean {
    return !(activity.isDraft ?? activity.draft ?? false);
}

/**
 * Soft-check phạm vi quản lý của Manager.
 * Được phép thêm khoa ngoài scope, nhưng phải có ≥1 khoa trong scope.
 */
export function assertManagerOrganizers(
    organizerIds: number[],
    managerDepartmentIds: number[]
): string | null {
    if (organizerIds.length === 0) {
        return 'Chọn ít nhất một khoa tổ chức';
    }
    if (managerDepartmentIds.length === 0) {
        return null;
    }
    const hasOwn = organizerIds.some((id) => managerDepartmentIds.includes(id));
    if (!hasOwn) {
        return 'Phải có ít nhất một khoa thuộc phạm vi quản lý của bạn';
    }
    return null;
}

const SERIES_ERROR_MAP: Record<string, string> = {
    'At least one series organizer is required':
        'Chọn ít nhất một khoa tổ chức',
    'Organizer departments must be within manager scope':
        'Phải có ít nhất một khoa trong phạm vi quản lý của bạn',
    'Manager with multiple departments must specify organizerIds within scope':
        'Bạn quản lý nhiều khoa — hãy chọn khoa tổ chức',
    'Series has no organizers configured':
        'Chuỗi chưa có khoa tổ chức — cập nhật chuỗi trước',
};

export function mapSeriesError(message: string): string {
    return SERIES_ERROR_MAP[message] ?? message;
}

/** Strip organizerIds khỏi payload child — organ chỉ chỉnh ở series. */
export function stripChildOrganizerIds<T extends object>(payload: T): Omit<T, 'organizerIds'> {
    const { organizerIds: _ignored, ...safe } = payload as T & { organizerIds?: number[] };
    void _ignored;
    return safe;
}
