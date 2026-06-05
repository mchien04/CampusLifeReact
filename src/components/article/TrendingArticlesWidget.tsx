import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleListResponse } from '../../types/article';
import ArticleTypeBadge from './ArticleTypeBadge';

interface TrendingArticlesWidgetProps {
    days?: number;
    limit?: number;
    className?: string;
}

const TrendingArticlesWidget: React.FC<TrendingArticlesWidgetProps> = ({
    days = 7,
    limit = 5,
    className = '',
}) => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<ArticleListResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                setLoading(true);
                const response = await articleAPI.getTrendingArticles({ days, limit });
                if (response.status && response.body) {
                    setArticles(response.body);
                }
            } catch (error) {
                console.error('Failed to fetch trending articles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
    }, [days, limit]);

    if (loading) {
        return (
            <div className={`trending-widget ${className}`}>
                <h3 className="trending-widget__title">Xu hướng tuần qua</h3>
                <div className="trending-widget__list">
                    {Array.from({ length: limit }).map((_, idx) => (
                        <div key={idx} className="trending-widget__skeleton-item">
                            <div className="trending-widget__skeleton-rank" />
                            <div className="trending-widget__skeleton-content">
                                <div className="trending-widget__skeleton-line w-3/4" />
                                <div className="trending-widget__skeleton-line w-1/2 mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (articles.length === 0) {
        return null;
    }

    return (
        <div className={`trending-widget ${className}`}>
            <h3 className="trending-widget__title">Xu hướng tuần qua</h3>
            <div className="trending-widget__list">
                {articles.map((article, index) => {
                    const rankStr = String(index + 1).padStart(2, '0');
                    return (
                        <div
                            key={article.id}
                            className="trending-widget__item"
                            onClick={() => navigate(`/articles/${article.slug}`)}
                        >
                            <div className={`trending-widget__rank trending-widget__rank--${index + 1}`}>
                                {rankStr}
                            </div>
                            <div className="trending-widget__info">
                                <div className="trending-widget__meta">
                                    <ArticleTypeBadge type={article.articleType} className="trending-widget__type" />
                                    {article.publishedAt && (
                                        <span className="trending-widget__date">
                                            {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    )}
                                </div>
                                <h4 className="trending-widget__item-title" title={article.title}>
                                    {article.title}
                                </h4>
                                <div className="trending-widget__metrics">
                                    <span>👁️ {article.viewCount?.toLocaleString('vi-VN') || 0} lượt xem</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrendingArticlesWidget;
