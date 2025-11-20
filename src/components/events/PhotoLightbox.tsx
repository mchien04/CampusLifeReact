import React, { useState, useEffect } from 'react';
import { ActivityPhotoResponse } from '../../types/activity';
import { getImageUrl } from '../../utils/imageUtils';

interface PhotoLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    photos: ActivityPhotoResponse[];
    initialIndex: number;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
    isOpen,
    onClose,
    photos,
    initialIndex
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            } else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex, photos.length, onClose]);

    if (!isOpen || photos.length === 0) return null;

    const sortedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentPhoto = sortedPhotos[currentIndex];

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < sortedPhotos.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const imageUrl = getImageUrl(currentPhoto.imageUrl);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            {currentIndex > 0 && (
                <button
                    onClick={handlePrev}
                    className="absolute left-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}
            
            {currentIndex < sortedPhotos.length - 1 && (
                <button
                    onClick={handleNext}
                    className="absolute right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            <div className="max-w-4xl max-h-[90vh] mx-4">
                <div className="text-center">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={currentPhoto.caption || `Ảnh ${currentIndex + 1}`}
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    ) : (
                        <div className="text-white">Không thể tải ảnh</div>
                    )}
                    {currentPhoto.caption && (
                        <p className="mt-4 text-white text-lg">{currentPhoto.caption}</p>
                    )}
                    <p className="mt-2 text-gray-400 text-sm">
                        {currentIndex + 1} / {sortedPhotos.length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PhotoLightbox;

