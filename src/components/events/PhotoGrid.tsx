import React, { useState } from 'react';
import { ActivityPhotoResponse } from '../../types/activity';
import { getImageUrl } from '../../utils/imageUtils';
import PhotoLightbox from './PhotoLightbox';

interface PhotoGridProps {
    photos: ActivityPhotoResponse[];
    onDelete?: (photoId: number) => void;
    onReorder?: (photoId: number, newOrder: number) => void;
    canManage: boolean;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
    photos,
    onDelete,
    onReorder,
    canManage
}) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const sortedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);

    const handleDelete = async (e: React.MouseEvent, photoId: number) => {
        e.stopPropagation();
        if (!onDelete) return;
        if (window.confirm('Bạn có chắc muốn xóa ảnh này?')) {
            await onDelete(photoId);
        }
    };

    const handleReorder = async (e: React.MouseEvent, photoId: number, direction: 'up' | 'down') => {
        e.stopPropagation();
        if (!onReorder) return;
        const photo = sortedPhotos.find(p => p.id === photoId);
        if (!photo) return;
        
        const currentIndex = sortedPhotos.findIndex(p => p.id === photoId);
        if (direction === 'up' && currentIndex > 0) {
            const targetPhoto = sortedPhotos[currentIndex - 1];
            await onReorder(photoId, targetPhoto.displayOrder);
        } else if (direction === 'down' && currentIndex < sortedPhotos.length - 1) {
            const targetPhoto = sortedPhotos[currentIndex + 1];
            await onReorder(photoId, targetPhoto.displayOrder);
        }
    };

    if (sortedPhotos.length === 0) {
        return null;
    }

    return (
        <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedPhotos.map((photo, index) => {
                const imageUrl = getImageUrl(photo.imageUrl);
                return (
                    <div key={photo.id} className="relative group">
                        <div
                            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                            onClick={() => {
                                setSelectedIndex(index);
                                setLightboxOpen(true);
                            }}
                        >
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={photo.caption || `Ảnh ${index + 1}`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {photo.caption && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{photo.caption}</p>
                        )}
                        {canManage && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onReorder && (
                                    <>
                                        {index > 0 && (
                                            <button
                                                onClick={(e) => handleReorder(e, photo.id, 'up')}
                                                className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                                                title="Lên"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                        )}
                                        {index < sortedPhotos.length - 1 && (
                                            <button
                                                onClick={(e) => handleReorder(e, photo.id, 'down')}
                                                className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                                                title="Xuống"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        )}
                                    </>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={(e) => handleDelete(e, photo.id)}
                                        className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                                        title="Xóa"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        <PhotoLightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            photos={photos}
            initialIndex={selectedIndex}
        />
    </>
    );
};

export default PhotoGrid;

