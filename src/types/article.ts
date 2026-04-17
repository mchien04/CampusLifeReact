export type RegistrationCtaStatus = 'UPCOMING' | 'OPEN' | 'FULL' | 'CLOSED';

export type EventArticleDetailResponse = {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    published: boolean;
    publishedAt?: string | null;
    registrationStatus: RegistrationCtaStatus;
    registrationLink: string;
};

export type EventArticleUpsertRequest = {
    activityId?: number;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
};

export type EventArticleAdminResponse = {
    id: number;
    activityId: number;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    published: boolean;
    publishedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type ApiResponse<T> = {
    status: boolean;
    message: string;
    body: T | null;
};