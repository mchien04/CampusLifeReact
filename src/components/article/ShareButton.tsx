import React, { useState } from 'react';
import { articleAPI } from '../../services/articleAPI';

interface ShareButtonProps {
    slug: string;
    title: string;
    className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ slug, title, className = '' }) => {
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const articleUrl = `${window.location.origin}/articles/${encodeURIComponent(slug)}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(articleUrl);
            setCopied(true);
            void articleAPI.trackShare(slug);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = articleUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            void articleAPI.trackShare(slug);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    url: articleUrl,
                });
                void articleAPI.trackShare(slug);
            } catch {
                // User cancelled share
            }
        } else {
            setShowMenu(!showMenu);
        }
    };

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
            '_blank',
            'noopener,noreferrer,width=600,height=400'
        );
        void articleAPI.trackShare(slug);
        setShowMenu(false);
    };

    const shareToTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`,
            '_blank',
            'noopener,noreferrer,width=600,height=400'
        );
        void articleAPI.trackShare(slug);
        setShowMenu(false);
    };

    return (
        <div className={`share-button ${className}`}>
            <button
                type="button"
                className="share-button__trigger"
                onClick={handleShareNative}
                aria-label="Chia sẻ bài viết"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Chia sẻ</span>
            </button>

            <button
                type="button"
                className="share-button__copy"
                onClick={handleCopyLink}
                title="Sao chép liên kết"
                aria-label="Sao chép liên kết"
            >
                {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                )}
            </button>

            {/* Dropdown share menu (for browsers without native share) */}
            {showMenu && (
                <div className="share-button__menu">
                    <button type="button" onClick={shareToFacebook} className="share-button__menu-item">
                        Facebook
                    </button>
                    <button type="button" onClick={shareToTwitter} className="share-button__menu-item">
                        Twitter/X
                    </button>
                    <button type="button" onClick={handleCopyLink} className="share-button__menu-item">
                        {copied ? 'Đã sao chép!' : 'Sao chép liên kết'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShareButton;
