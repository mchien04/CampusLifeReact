import React from 'react';
import type { ArticleType } from '../../types/article';

interface ArticleTypeBadgeProps {
    type: ArticleType;
    className?: string;
}

const TYPE_CONFIG: Record<ArticleType, { label: string; className: string }> = {
    ANNOUNCEMENT: { label: 'Thông báo', className: 'badge--announcement' },
    RECAP: { label: 'Tổng kết', className: 'badge--recap' },
    BEHIND_SCENE: { label: 'Hậu trường', className: 'badge--behind-scene' },
    RESULT: { label: 'Kết quả', className: 'badge--result' },
    UPDATE: { label: 'Cập nhật', className: 'badge--update' },
};

const ArticleTypeBadge: React.FC<ArticleTypeBadgeProps> = ({ type, className = '' }) => {
    const config = TYPE_CONFIG[type];
    if (!config) return null;

    return (
        <span className={`article-type-badge ${config.className} ${className}`}>
            {config.label}
        </span>
    );
};

export default ArticleTypeBadge;
