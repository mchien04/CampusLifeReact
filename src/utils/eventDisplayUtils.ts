import { ActivityResponse, ActivityType, ScoreType } from '../types/activity';

export const formatEventDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

export const getActivityTypeLabel = (type: ActivityType | null): string => {
    if (!type) return 'N/A';
    const labels: Record<ActivityType, string> = {
        [ActivityType.SUKIEN]: 'Sự kiện',
        [ActivityType.MINIGAME]: 'Mini Game',
        [ActivityType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
        [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'Chuyên đề doanh nghiệp',
    };
    return labels[type] || type;
};

export const getActivityScoreTypeLabel = (scoreType: ScoreType | null | undefined): string => {
    if (!scoreType) return 'N/A';
    const labels: Record<ScoreType, string> = {
        [ScoreType.REN_LUYEN]: 'Rèn luyện',
        [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
        [ScoreType.CHUYEN_DE]: 'Chuyên đề',
    };
    return labels[scoreType] || scoreType;
};

export const getEventScoreSummary = (event: ActivityResponse): string => {
    if (event.seriesId) return 'Chuỗi sự kiện';
    if (event.scoreRules && event.scoreRules.length > 0) {
        return Array.from(new Set(event.scoreRules.map(r => r.scoreType)))
            .map(type => getActivityScoreTypeLabel(type))
            .join(', ');
    }
    return 'Không cộng điểm';
};

export const isEventDraft = (event: ActivityResponse): boolean => {
    const draftValue = event.draft !== undefined ? event.draft : event.isDraft;
    return draftValue === true || (draftValue !== undefined && draftValue !== null && Boolean(draftValue));
};

export type EventTimeStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';

export const getEventTimeStatus = (event: ActivityResponse): EventTimeStatus => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    if (now > endDate) return 'ENDED';
    if (now >= startDate && now <= endDate) return 'ONGOING';
    return 'UPCOMING';
};

/** Sự kiện đã kết thúc: mới nhất trước (endDate giảm dần). */
export const sortEventsByEndDateDesc = <T extends { endDate: string }>(events: T[]): T[] =>
    [...events].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

/** Sự kiện sắp diễn ra: gần nhất trước (startDate tăng dần). */
export const sortEventsByStartDateAsc = <T extends { startDate: string }>(events: T[]): T[] =>
    [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

export const EVENT_TIME_STATUS_META: Record<EventTimeStatus, { label: string; className: string }> = {
    UPCOMING: { label: 'Sắp diễn ra', className: 'bg-sky-50 text-sky-800 border-sky-200' },
    ONGOING: { label: 'Đang diễn ra', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    ENDED: { label: 'Đã kết thúc', className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

export const ACTIVITY_TYPE_BADGE: Record<ActivityType, string> = {
    [ActivityType.SUKIEN]: 'bg-primary-900/5 text-primary-900 border-primary-900/10',
    [ActivityType.MINIGAME]: 'bg-violet-50 text-violet-800 border-violet-200',
    [ActivityType.CONG_TAC_XA_HOI]: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    [ActivityType.CHUYEN_DE_DOANH_NGHIEP]: 'bg-amber-50 text-amber-900 border-amber-200',
};
