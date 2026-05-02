export type ISODateTime = string;

export type RegistrationCtaStatus = 'UPCOMING' | 'OPEN' | 'WAITLIST' | 'FULL' | 'CLOSED';

export type SpringPage<T> = {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
};

export type ArticleImageResponse = {
    id: number;
    imageUrl: string;
    caption?: string | null;
    displayOrder: number;
    isCover: boolean;
    createdAt?: ISODateTime | null;
};

export type ArticleListResponse = {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    seoDescription?: string | null;
    registrationStatus?: string | null;
    registrationLink?: string | null;
    isPublished: boolean;
    isFeatured: boolean;
    isPinned: boolean;
    publishedAt?: ISODateTime | null;
    viewCount: number;
    wishlistCount: number;
    categoryName?: string | null;
    tags?: string[] | null;
    images?: ArticleImageResponse[] | null;
};

export type ArticleDetailResponse = {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    published: boolean;
    publishedAt?: ISODateTime | null;
    registrationStatus?: string | null;
    registrationLink?: string | null;
    viewCount: number;
    wishlistCount: number;
    isFeatured: boolean;
    isPinned: boolean;
    priority: number;
    createdAt?: ISODateTime | null;
    updatedAt?: ISODateTime | null;
    activityInfo?: {
        id: number;
        name: string;
        location?: string | null;
        startDate?: ISODateTime | null;
        endDate?: ISODateTime | null;
        registrationStartDate?: ISODateTime | null;
        registrationDeadline?: ISODateTime | null;
    } | null;
    category?: { id: number; name: string; slug?: string | null } | null;
    tags?: string[] | null;
    images?: ArticleImageResponse[] | null;
    coverImages?: ArticleImageResponse[] | null;
    isWishlisted: boolean;
};

export type ArticleWishlistItemResponse = {
    id: number;
    articleId: number;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    seoDescription?: string | null;
    isPublished: boolean;
    publishedAt?: ISODateTime | null;
    registrationStatus?: string | null;
    wishlistedAt?: ISODateTime | null;
};

export type EventArticleUpsertRequest = {
    activityId?: number;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    categoryId?: number | null;
    tagIds?: number[] | null;
    isFeatured?: boolean;
    isPinned?: boolean;
    priority?: number;
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
    publishedAt?: ISODateTime | null;
    viewCount: number;
    wishlistCount: number;
    featured?: boolean;
    pinned?: boolean;
    priority?: number;
    categoryId?: number | null;
    categoryName?: string | null;
    tagNames?: string[] | null;
    createdAt?: ISODateTime | null;
    updatedAt?: ISODateTime | null;
};

export type ArticleCategoryRequest = {
    name: string;
    description?: string | null;
    slug?: string | null;
    displayOrder: number;
    isActive: boolean;
};

export type ArticleCategoryResponse = {
    id: number;
    name: string;
    description?: string | null;
    slug?: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt?: ISODateTime | null;
};

export type ArticleTagRequest = {
    name: string;
    slug?: string | null;
    isActive: boolean;
};

export type ArticleTagResponse = {
    id: number;
    name: string;
    slug?: string | null;
    isActive: boolean;
    createdAt?: ISODateTime | null;
};

export type ArticleImageRequest = {
    imageUrl: string;
    caption?: string | null;
    displayOrder: number;
    isCover: boolean;
};

export type ArticleStatisticsResponse = {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
    totalWishlists: number;
    featuredArticles: number;
    pinnedArticles: number;
    topViewedArticles?: Record<string, unknown>[] | null;
    recentlyPublished?: Record<string, unknown>[] | null;
    articlesByCategory?: Record<string, number> | null;
    articlesByMonth?: Record<string, number> | null;
};

// Backwards-compatible aliases (to avoid touching many files at once)
export type EventArticleDetailResponse = ArticleDetailResponse;
export type ArticleMetrics = {
    id: number;
    title: string;
    slug: string;
    viewCount: number;
    wishlistCount: number;
    clicksToRegistration?: number;
    createdAt?: string;
};

export type ApiResponse<T> = {
    status: boolean;
    message: string;
    body: T | null;
};

export type WishlistToggleResponse = {
    isWishlisted: boolean;
    wishlistCount: number;
};

export type ArticleAnalytics = {
    viewCount: number;
    wishlistCount: number;
    clicksToRegistration: number;
};

export type DashboardAnalytics = {
    totalViews: number;
    totalWishlists: number;
    articlesPublished: number;
    topArticles: ArticleMetrics[];
    viewsTrend: Array<{
        date: string;
        views: number;
    }>;
};