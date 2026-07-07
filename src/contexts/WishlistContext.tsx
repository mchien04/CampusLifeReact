import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { articleAPI } from '../services/articleAPI';
import { Role } from '../types';

interface WishlistContextType {
    wishlistedSlugs: Set<string>;
    toggleWishlist: (slug: string) => Promise<void>;
    isWishlisted: (slug: string) => boolean;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, userRole } = useAuth();
    const [wishlistedSlugs, setWishlistedSlugs] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const initializeWishlist = async () => {
            if (!isAuthenticated || userRole !== Role.STUDENT) {
                setWishlistedSlugs(new Set());
                return;
            }

            try {
                setLoading(true);
                const response = await articleAPI.getWishlistedArticles({ page: 0, size: 200 });
                const items = response.body?.content ?? [];
                if (response.status && Array.isArray(items)) {
                    setWishlistedSlugs(new Set(items.map((item) => item.slug)));
                }
            } finally {
                setLoading(false);
            }
        };

        initializeWishlist();
    }, [isAuthenticated]);

    const toggleWishlist = async (slug: string) => {
        try {
            const currentlyWishlisted = wishlistedSlugs.has(slug);
            const response = currentlyWishlisted
                ? await articleAPI.removeFromWishlist(slug)
                : await articleAPI.addToWishlist(slug);

            if (!response.status) {
                throw new Error(response.message || 'Không thể cập nhật wishlist');
            }

            setWishlistedSlugs((prev) => {
                const next = new Set(prev);
                if (currentlyWishlisted) {
                    next.delete(slug);
                } else {
                    next.add(slug);
                }
                return next;
            });
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
            toast.error('Vui lòng đăng nhập để sử dụng wishlist');
            throw error;
        }
    };

    const isWishlisted = (slug: string): boolean => {
        return wishlistedSlugs.has(slug);
    };

    return (
        <WishlistContext.Provider value={{ wishlistedSlugs, toggleWishlist, isWishlisted, loading }}>
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
