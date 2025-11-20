import React, { useState } from 'react';
import { ActivityPhotoResponse } from '../../types/activity';
import { getImageUrl } from '../../utils/imageUtils';

interface PhotoGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    photos: ActivityPhotoResponse[];
    onDelete?: (photoId: number) => void;
    onReorder?: (photoId: number, newOrder: number) => void;
    canManage: boolean;
    initialPhotoIndex?: number;
}

const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
    isOpen,
    onClose,
    photos,
    onDelete,
    onReorder,
    canManage,
    initialPhotoIndex = 0
}) => {
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [showLightbox, setShowLightbox] = useState(false);

    const sortedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);

    // Update selected index when initialPhotoIndex changes
    React.useEffect(() => {
        if (isOpen && initialPhotoIndex !== undefined) {
            setSelectedPhotoIndex(initialPhotoIndex);
            setShowLightbox(true);
        }
    }, [isOpen, initialPhotoIndex]);

    if (!isOpen) return null;

    const handlePhotoClick = (index: number) => {
        setSelectedPhotoIndex(index);
        setShowLightbox(true);
    };

    const handlePrevPhoto = () => {
        if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
            setSelectedPhotoIndex(selectedPhotoIndex - 1);
        }
    };

    const handleNextPhoto = () => {
        if (selectedPhotoIndex !== null && selectedPhotoIndex < sortedPhotos.length - 1) {
            setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
    };

    const handleDelete = async (photoId: number) => {
        if (!onDelete) return;
        if (window.confirm('Bạn có chắc muốn xóa ảnh này?')) {
            await onDelete(photoId);
        }
    };

    const handleReorder = async (photoId: number, direction: 'up' | 'down') => {
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

    return (
        <>
            {/* Main Modal */}
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Hình ảnh sự kiện ({sortedPhotos.length} ảnh)
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {sortedPhotos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Chưa có ảnh nào được tải lên</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sortedPhotos.map((photo, index) => {
                                const imageUrl = getImageUrl(photo.imageUrl);
                                return (
                                    <div key={photo.id} className="relative group">
                                        <div
                                            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                                            onClick={() => handlePhotoClick(index)}
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReorder(photo.id, 'up');
                                                                }}
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReorder(photo.id, 'down');
                                                                }}
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(photo.id);
                                                        }}
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
                    )}
                </div>
            </div>

            {/* Lightbox */}
            {showLightbox && selectedPhotoIndex !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <button
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    {selectedPhotoIndex > 0 && (
                        <button
                            onClick={handlePrevPhoto}
                            className="absolute left-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    
                    {selectedPhotoIndex < sortedPhotos.length - 1 && (
                        <button
                            onClick={handleNextPhoto}
                            className="absolute right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    <div className="max-w-4xl max-h-[90vh] mx-4">
                        {(() => {
                            const photo = sortedPhotos[selectedPhotoIndex];
                            const imageUrl = getImageUrl(photo.imageUrl);
                            return (
                                <div className="text-center">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={photo.caption || `Ảnh ${selectedPhotoIndex + 1}`}
                                            className="max-w-full max-h-[90vh] object-contain"
                                        />
                                    ) : (
                                        <div className="text-white">Không thể tải ảnh</div>
                                    )}
                                    {photo.caption && (
                                        <p className="mt-4 text-white text-lg">{photo.caption}</p>
                                    )}
                                    <p className="mt-2 text-gray-400 text-sm">
                                        {selectedPhotoIndex + 1} / {sortedPhotos.length}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </>
    );
};

export default PhotoGalleryModal;

