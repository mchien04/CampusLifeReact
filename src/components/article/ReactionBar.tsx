import React, { useCallback, useEffect, useState } from 'react';
import { articleAPI } from '../../services/articleAPI';
import type { ReactionSummary, ReactionType } from '../../types/article';

interface ReactionBarProps {
    slug: string;
    initialMyReaction?: ReactionType | null;
    isAuthenticated: boolean;
    className?: string;
}

const REACTION_EMOJI: Record<ReactionType, { emoji: string; label: string }> = {
    LIKE: { emoji: '👍', label: 'Thích' },
    LOVE: { emoji: '❤️', label: 'Yêu thích' },
    CLAP: { emoji: '👏', label: 'Tuyệt vời' },
    FIRE: { emoji: '🔥', label: 'Hot' },
    SUPPORT: { emoji: '💪', label: 'Ủng hộ' },
};

const REACTION_TYPES: ReactionType[] = ['LIKE', 'LOVE', 'CLAP', 'FIRE', 'SUPPORT'];

const ReactionBar: React.FC<ReactionBarProps> = ({
    slug,
    initialMyReaction = null,
    isAuthenticated,
    className = '',
}) => {
    const [summary, setSummary] = useState<ReactionSummary>({
        LIKE: 0,
        LOVE: 0,
        CLAP: 0,
        FIRE: 0,
        SUPPORT: 0,
    });
    const [myReaction, setMyReaction] = useState<ReactionType | null>(initialMyReaction);
    const [loading, setLoading] = useState(true);
    const [actionPending, setActionPending] = useState(false);

    useEffect(() => {
        setMyReaction(initialMyReaction);
    }, [initialMyReaction]);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await articleAPI.getReactionSummary(slug);
            if (res.status && res.body) {
                setSummary(res.body);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        void fetchSummary();
    }, [fetchSummary]);

    const handleReaction = async (type: ReactionType) => {
        if (!isAuthenticated) {
            // Could show toast/notification
            return;
        }
        if (actionPending) return;

        setActionPending(true);

        try {
            if (myReaction === type) {
                // Remove reaction (optimistic)
                setMyReaction(null);
                setSummary((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
                await articleAPI.removeReaction(slug);
            } else if (myReaction) {
                // Switch reaction (optimistic)
                const oldType = myReaction;
                setMyReaction(type);
                setSummary((prev) => ({
                    ...prev,
                    [oldType]: Math.max(0, prev[oldType] - 1),
                    [type]: prev[type] + 1,
                }));
                await articleAPI.addReaction(slug, type);
            } else {
                // Add new reaction (optimistic)
                setMyReaction(type);
                setSummary((prev) => ({ ...prev, [type]: prev[type] + 1 }));
                await articleAPI.addReaction(slug, type);
            }
        } catch {
            // Rollback — refetch on error
            void fetchSummary();
        } finally {
            setActionPending(false);
        }
    };

    const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);

    if (loading) {
        return (
            <div className={`reaction-bar ${className}`}>
                <div className="reaction-bar__skeleton">
                    {REACTION_TYPES.map((type) => (
                        <div key={type} className="reaction-bar__skeleton-btn" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`reaction-bar ${className}`}>
            <div className="reaction-bar__buttons">
                {REACTION_TYPES.map((type) => {
                    const { emoji, label } = REACTION_EMOJI[type];
                    const count = summary[type];
                    const isActive = myReaction === type;

                    return (
                        <button
                            key={type}
                            type="button"
                            className={`reaction-bar__btn ${isActive ? 'reaction-bar__btn--active' : ''}`}
                            onClick={() => void handleReaction(type)}
                            disabled={actionPending}
                            title={!isAuthenticated ? 'Đăng nhập để tương tác' : label}
                            aria-label={`${label} (${count})`}
                            aria-pressed={isActive}
                        >
                            <span className="reaction-bar__emoji">{emoji}</span>
                            {count > 0 && <span className="reaction-bar__count">{count}</span>}
                        </button>
                    );
                })}
            </div>
            {totalReactions > 0 && (
                <span className="reaction-bar__total">
                    {totalReactions} lượt tương tác
                </span>
            )}
        </div>
    );
};

export default ReactionBar;
