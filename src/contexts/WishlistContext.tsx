import React, { createContext, useContext, useEffect, useState } from 'react';
import { articleAPI } from '../services/articleAPI';

interface WishlistContextType {
    wishlistedIds: Set<number>;
    toggleWishlist: (articleId: number) => Promise<void>;
    isWishlisted: (articleId: number) => boolean;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistedIds, setWishlistedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);

    // Initialize wishlist on mount (if user is authenticated)
    useEffect(() => {
        const initializeWishlist = async () => {
            try {
                setLoading(true);
                const response = await articleAPI.getWishlistedArticles();
                if (response.status && response.body && Array.isArray(response.body)) {
                    const ids = new Set(response.body.map((article) => article.id));
                    setWishlistedIds(ids);
                }
            } catch (error) {
                // User might not be authenticated, that's okay
                console.debug('Could not load wishlist, likely not authenticated');
            } finally {
                setLoading(false);
            }
        };

        initializeWishlist();
    }, []);

    const toggleWishlist = async (articleId: number) => {
        try {
            const response = await articleAPI.toggleWishlist(articleId);
            if (response.status && response.body) {
                // Update local state
                if (response.body.isWishlisted) {
                    setWishlistedIds((prev) => new Set([...Array.from(prev), articleId]));
                } else {
                    setWishlistedIds((prev) => {
                        const next = new Set(prev);
                        next.delete(articleId);
                        return next;
                    });
                }
            }
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
            throw error;
        }
    };

    const isWishlisted = (articleId: number): boolean => {
        return wishlistedIds.has(articleId);
    };

    return (
        <WishlistContext.Provider value={{ wishlistedIds, toggleWishlist, isWishlisted, loading }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within WishlistProvider');
    }
    return context;
};
