export const ACTION_URL_OPTIONS: Array<{
    value: string;
    label: string;
    requiresId?: boolean;
    isExternal?: boolean;
    idLabel?: string;
    placeholder?: string;
}> = [
        { value: '', label: 'Không chọn hành động' },
        { value: '/manager/dashboard', label: 'Dashboard quản lý' },
        { value: '/activities', label: 'Danh sách sự kiện' },
        { value: '/series', label: 'Danh sách chuỗi sự kiện' },
        { value: '/notifications', label: 'Trung tâm thông báo' },
        { value: '/activities/:id', label: 'Chi tiết sự kiện', requiresId: true, idLabel: 'Activity ID', placeholder: 'VD: 10' },
        { value: '/series/:id', label: 'Chi tiết chuỗi sự kiện', requiresId: true, idLabel: 'Series ID', placeholder: 'VD: 5' },
        { value: 'EXTERNAL', label: 'Link ngoài (External URL)', isExternal: true }
    ];

export const buildActionUrlFromOptions = (optionValue: string, param: string, external?: string) => {
    // Nếu là external URL
    if (optionValue === 'EXTERNAL' && external) {
        return external.trim();
    }
    const option = ACTION_URL_OPTIONS.find(o => o.value === optionValue);
    if (!option) return '';
    if (option.requiresId) {
        if (!param?.trim()) return '';
        return option.value.replace(':id', param.trim());
    }
    return option.value;
};

export const buildActionUrl = (metadata: Record<string, any> | undefined, role: string = 'STUDENT'): string | null => {
    if (!metadata) return null;

    if (metadata.articleId) {
        return role === 'STUDENT' ? `/articles` : `/manager/articles`;
    }

    const prefix = role === 'STUDENT' ? '/student' : '/manager';

    if (metadata.activityId) {
        return `${prefix}/events/${metadata.activityId}`;
    }

    if (metadata.seriesId) {
        return `${prefix}/series/${metadata.seriesId}`;
    }

    return null;
};
