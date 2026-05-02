import DOMPurify from 'dompurify';

/**
 * Enhanced DOMPurify configuration to allow:
 * - YouTube embeds (iframe with YouTube domain)
 * - Figure/figcaption tags for image captions
 * - Standard rich text tags
 */
const enhancedConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr',
        'th', 'td', 'figure', 'figcaption', 'img', 'iframe',
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel', 'alt', 'title', 'src', 'width', 'height', 'frameborder',
        'allowfullscreen', 'allow', 'data-youtube-id', 'class', 'style',
    ],
    KEEP_CONTENT: true,
};

/**
 * YouTube iframe domain validator
 */
const isYouTubeSrc = (src: string): boolean => {
    try {
        const url = new URL(src);
        return (
            url.hostname === 'www.youtube.com' ||
            url.hostname === 'youtube.com' ||
            url.hostname === 'www.youtube-nocookie.com' ||
            url.hostname === 'youtube-nocookie.com'
        );
    } catch {
        return false;
    }
};

/**
 * Custom hook to validate iframe src
 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IFRAME') {
        const src = node.getAttribute('src');
        if (!src || !isYouTubeSrc(src)) {
            node.parentNode?.removeChild(node);
        }
    }
});

/**
 * Sanitize article content HTML
 * Allows: formatting, links, images with captions, YouTube embeds, tables, code blocks
 * Strips: scripts, event handlers, potentially malicious attributes
 */
export const sanitizeArticleContent = (html: string): string => {
    return DOMPurify.sanitize(html, enhancedConfig);
};

/**
 * Sanitize with stricter rules (for user-generated content in comments, etc.)
 */
export const sanitizeStrict = (html: string): string => {
    const strictConfig: DOMPurify.Config = {
        ...enhancedConfig,
        ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
    };
    return DOMPurify.sanitize(html, strictConfig);
};
