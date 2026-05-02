import { createEvent } from 'ics';
import type { EventArticleDetailResponse } from '../types/article';

/**
 * Generate an ICS calendar file from an article
 * Strips HTML tags from content for description
 */
export const generateCalendarFile = (
    article: EventArticleDetailResponse,
    options?: {
        eventTitle?: string;
        eventDate?: string;
        eventTime?: string;
    }
): { blob: Blob; filename: string } => {
    const title = options?.eventTitle || article.title;
    const description = stripHtml(article.content).slice(0, 500);
    const url = `${window.location.origin}/articles/${article.slug}`;

    // Parse date - if eventDate provided, use it, otherwise use publishedAt
    let eventDate = options?.eventDate;
    if (!eventDate && article.publishedAt) {
        eventDate = new Date(article.publishedAt).toISOString().split('T')[0];
    }

    // Default to today if no date available
    const dateObj = eventDate ? new Date(eventDate) : new Date();
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    // Parse time - use eventTime if provided, otherwise 09:00
    const timeStr = options?.eventTime || '09:00';
    const [hours, minutes] = timeStr.split(':').map(Number);

    const { error, value } = createEvent({
        title,
        description: `${description}\n\nXem thêm: ${url}`,
        start: [year, month, day, hours || 9, minutes || 0],
        duration: { hours: 1, minutes: 0 },
        calName: 'CampusLife Events',
    });

    if (error) {
        throw new Error(`Failed to generate calendar file: ${error}`);
    }

    if (!value) {
        throw new Error('Failed to generate calendar file: no output');
    }

    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    const filename = `${article.slug}.ics`;

    return { blob, filename };
};

/**
 * Download an ICS file (trigger browser download)
 */
export const downloadCalendarFile = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Strip HTML tags from text
 */
const stripHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
};
