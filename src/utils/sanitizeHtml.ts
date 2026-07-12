import DOMPurify from 'dompurify';

/**
 * CSS properties allowed on article HTML (TipTap textStyle, alignment, figures).
 * Blocks expression()/url(javascript:) and other dangerous values.
 */
const SAFE_STYLE_PROPS = new Set([
    'font-size',
    'font-family',
    'font-weight',
    'font-style',
    'color',
    'background-color',
    'background',
    'text-align',
    'text-decoration',
    'text-decoration-line',
    'line-height',
    'letter-spacing',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'width',
    'max-width',
    'min-width',
    'height',
    'max-height',
    'border',
    'border-radius',
    'border-collapse',
    'display',
    'float',
    'vertical-align',
    'white-space',
    'object-fit',
]);

const DANGEROUS_STYLE_VALUE = /expression\s*\(|javascript:|url\s*\(\s*['"]?\s*javascript|@import|-moz-binding/i;

export const sanitizeInlineStyle = (style: string): string => {
    return style
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((decl) => {
            const colon = decl.indexOf(':');
            if (colon <= 0) return null;
            const prop = decl.slice(0, colon).trim().toLowerCase();
            const value = decl.slice(colon + 1).trim();
            if (!SAFE_STYLE_PROPS.has(prop)) return null;
            if (!value || DANGEROUS_STYLE_VALUE.test(value)) return null;
            return `${prop}: ${value}`;
        })
        .filter(Boolean)
        .join('; ');
};

/**
 * Enhanced DOMPurify configuration — preserve TipTap marks (span + style)
 * and rich media used in article content.
 */
const enhancedConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'sub', 'sup', 'mark',
        'span', 'div', 'a',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
        'figure', 'figcaption', 'img', 'iframe',
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel', 'alt', 'title', 'src', 'width', 'height',
        'frameborder', 'allowfullscreen', 'allow', 'data-youtube-id',
        'class', 'style', 'colspan', 'rowspan', 'align',
    ],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
};

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

let hooksRegistered = false;

const registerHooks = () => {
    if (hooksRegistered || typeof window === 'undefined') return;
    hooksRegistered = true;

    DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
        if (data.attrName === 'style') {
            data.attrValue = sanitizeInlineStyle(data.attrValue || '');
            if (!data.attrValue) {
                data.keepAttr = false;
            }
        }
    });

    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'IFRAME') {
            const src = node.getAttribute('src');
            if (!src || !isYouTubeSrc(src)) {
                node.parentNode?.removeChild(node);
            }
        }
        if (node.tagName === 'A') {
            node.setAttribute('rel', 'noopener noreferrer');
            if (!node.getAttribute('target')) {
                node.setAttribute('target', '_blank');
            }
        }
    });
};

/**
 * Sanitize article content HTML.
 * Keeps font-size / color / alignment from TipTap textStyle spans.
 */
export const sanitizeArticleContent = (html: string): string => {
    registerHooks();
    return DOMPurify.sanitize(html, enhancedConfig);
};

export const sanitizeStrict = (html: string): string => {
    registerHooks();
    const strictConfig: DOMPurify.Config = {
        ...enhancedConfig,
        ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
    };
    return DOMPurify.sanitize(html, strictConfig);
};
