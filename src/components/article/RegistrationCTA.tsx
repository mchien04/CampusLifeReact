import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { RegistrationCtaStatus } from '../../types/article';

interface RegistrationCTAProps {
    activityInfo?: {
        id: number;
        name: string;
        shareLink?: string | null;
    } | null;
    activityId?: number | null;
    shareLink?: string | null;
    registrationStatus?: RegistrationCtaStatus | null;
    slug: string;
    className?: string;
}

const STATUS_CONFIG: Record<
    RegistrationCtaStatus,
    { label: string; disabled: boolean; className: string }
> = {
    UPCOMING: {
        label: 'Sắp mở đăng ký',
        disabled: true,
        className: 'cta-upcoming',
    },
    OPEN: {
        label: 'Đăng ký ngay',
        disabled: false,
        className: 'cta-open',
    },
    WAITLIST: {
        label: 'Đăng ký chờ',
        disabled: false,
        className: 'cta-waitlist',
    },
    FULL: {
        label: 'Đã đầy chỗ',
        disabled: true,
        className: 'cta-full',
    },
    CLOSED: {
        label: 'Đã đóng đăng ký',
        disabled: true,
        className: 'cta-closed',
    },
};

const RegistrationCTA: React.FC<RegistrationCTAProps> = ({
    activityInfo,
    activityId,
    shareLink: propShareLink,
    registrationStatus,
    slug,
    className = '',
}) => {
    const navigate = useNavigate();

    // Determine effective values
    const effectiveActivityId = activityInfo?.id ?? activityId;
    const effectiveShareLink = activityInfo?.shareLink ?? propShareLink;

    // Case 1: No activity linked — don't show CTA
    if (!effectiveActivityId) {
        return null;
    }

    // Case 2: No registration status — don't show CTA
    if (!registrationStatus) {
        return null;
    }

    const config = STATUS_CONFIG[registrationStatus];
    if (!config) return null;

    const handleClick = () => {
        // Case 2: External share link takes priority
        if (effectiveShareLink && effectiveShareLink.trim() !== '') {
            window.open(effectiveShareLink, '_blank', 'noopener,noreferrer');
            return;
        }

        // Case 3: Internal registration
        if (effectiveActivityId) {
            navigate(`/student/events/${effectiveActivityId}`);
        }
    };

    return (
        <button
            type="button"
            className={`registration-cta-btn w-full justify-center py-3.5 text-center shadow-lg transition-all duration-350 ${config.className} ${className}`}
            disabled={config.disabled}
            onClick={handleClick}
            aria-label={config.label}
        >
            {registrationStatus === 'OPEN' && (
                <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
            )}
            {registrationStatus === 'WAITLIST' && (
                <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            )}
            <span className="tracking-wide">{config.label}</span>
        </button>
    );
};

export default RegistrationCTA;
