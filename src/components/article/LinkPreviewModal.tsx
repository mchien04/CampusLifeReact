import React, { useState, useEffect } from 'react';

interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
}

interface LinkPreviewModalProps {
    link: LinkPreview;
    isOpen: boolean;
    onClose: () => void;
}

const LinkPreviewModal: React.FC<LinkPreviewModalProps> = ({ link, isOpen, onClose }) => {
    if (!isOpen) return null;

    const getDomain = (url: string) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h3 className="font-bold text-[#001C44]">Xem liên kết</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {link.image && (
                            <img
                                src={link.image}
                                alt={link.title}
                                className="w-full h-40 object-cover rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}

                        {link.title && (
                            <h4 className="font-semibold text-[#001C44] line-clamp-2">
                                {link.title}
                            </h4>
                        )}

                        {link.description && (
                            <p className="text-sm text-gray-600 line-clamp-3">
                                {link.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">{getDomain(link.url)}</span>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Mở liên kết
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LinkPreviewModal;
