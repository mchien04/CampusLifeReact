/**
 * Utility functions for handling image URLs
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

/**
 * Convert relative image path to full backend URL
 * @param imagePath - Relative path like "/uploads/filename.jpg"
 * @returns Full URL like "http://localhost:8080/uploads/filename.jpg"
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;

    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // If relative path, prepend backend URL
    if (imagePath.startsWith('/')) {
        return `${BACKEND_URL}${imagePath}`;
    }

    // If no leading slash, add it
    return `${BACKEND_URL}/${imagePath}`;
};

/**
 * Check if image URL is valid
 * @param imageUrl - Image URL to validate
 * @returns true if valid, false otherwise
 */
export const isValidImageUrl = (imageUrl: string | null | undefined): boolean => {
    if (!imageUrl) return false;

    const url = getImageUrl(imageUrl);
    if (!url) return false;

    // Basic URL validation
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};
