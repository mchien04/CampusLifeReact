import React from 'react';

interface StructureModalProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'md' | 'lg' | 'xl';
    /** Align modal near top for tall content (tables). */
    align?: 'center' | 'start';
}

const SIZE_CLASS = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
} as const;

export const StructureModal: React.FC<StructureModalProps> = ({
    title,
    subtitle,
    onClose,
    children,
    footer,
    size = 'md',
    align = 'center',
}) => {
    return (
        <div
            className={`fixed inset-0 z-50 flex overflow-y-auto bg-primary-900/40 backdrop-blur-[2px] p-4 ${
                align === 'start' ? 'items-start justify-center' : 'items-center justify-center'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="structure-modal-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`relative w-full ${SIZE_CLASS[size]} ${
                    align === 'start' ? 'my-8' : ''
                } rounded-2xl border border-gray-100 bg-white shadow-premium-hover animate-[fadeIn_160ms_ease-out]`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h3
                            id="structure-modal-title"
                            className="text-lg font-semibold tracking-tight text-primary-900 text-balance"
                        >
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-primary-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                        aria-label="Đóng"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="px-5 py-5 sm:px-6">{children}</div>

                {footer && (
                    <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};

export const modalFieldClass = (hasError?: boolean) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900/15 focus:border-primary-900 ${
        hasError ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400' : 'border-gray-200'
    }`;

export const modalLabelClass =
    'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400';

export const modalCancelBtnClass =
    'rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900';

export const modalPrimaryBtnClass =
    'rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 disabled:cursor-not-allowed disabled:opacity-50';
