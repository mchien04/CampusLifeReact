import React, { useState, useRef } from 'react';
import { activityPhotoAPI } from '../../services/activityPhotoAPI';
import { getImageUrl } from '../../utils/imageUtils';

interface PhotoUploadFormProps {
    activityId: number;
    currentPhotoCount: number;
    onUploadSuccess: () => void;
    onCancel: () => void;
}

interface FileWithPreview {
    file: File;
    preview: string;
    caption: string;
}

const MAX_PHOTOS_PER_ACTIVITY = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PhotoUploadForm: React.FC<PhotoUploadFormProps> = ({
    activityId,
    currentPhotoCount,
    onUploadSuccess,
    onCancel
}) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            return 'Chỉ chấp nhận file ảnh';
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return `Kích thước file phải nhỏ hơn 5MB. File hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
        }

        return null;
    };

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        const newFiles: FileWithPreview[] = [];
        const remainingSlots = MAX_PHOTOS_PER_ACTIVITY - currentPhotoCount;

        Array.from(selectedFiles).forEach((file) => {
            if (newFiles.length >= remainingSlots) {
                setError(`Chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa (tối đa ${MAX_PHOTOS_PER_ACTIVITY} ảnh/sự kiện)`);
                return;
            }

            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }

            const preview = URL.createObjectURL(file);
            newFiles.push({
                file,
                preview,
                caption: ''
            });
        });

        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        const fileToRemove = files[index];
        URL.revokeObjectURL(fileToRemove.preview);
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateCaption = (index: number, caption: string) => {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, caption } : f));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError('Vui lòng chọn ít nhất một ảnh');
            return;
        }

        if (currentPhotoCount + files.length > MAX_PHOTOS_PER_ACTIVITY) {
            setError(`Tối đa ${MAX_PHOTOS_PER_ACTIVITY} ảnh/sự kiện. Hiện tại: ${currentPhotoCount}, Đang thêm: ${files.length}`);
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const fileList = files.map(f => f.file);
            const captions = files.map(f => f.caption.trim());

            const response = await activityPhotoAPI.uploadPhotos(activityId, fileList, captions);

            if (response.status) {
                // Clean up preview URLs
                files.forEach(f => URL.revokeObjectURL(f.preview));
                setFiles([]);
                onUploadSuccess();
            } else {
                setError(response.message || 'Tải lên thất bại');
            }
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi tải lên');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        // Clean up preview URLs
        files.forEach(f => URL.revokeObjectURL(f.preview));
        setFiles([]);
        setError(null);
        onCancel();
    };

    const remainingSlots = MAX_PHOTOS_PER_ACTIVITY - currentPhotoCount;

    return (
        <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thêm ảnh sự kiện</h3>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {remainingSlots <= 0 ? (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                    Đã đạt giới hạn tối đa {MAX_PHOTOS_PER_ACTIVITY} ảnh/sự kiện
                </div>
            ) : (
                <>
                    {/* Drag & Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                        />
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                            Kéo thả ảnh vào đây hoặc click để chọn
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Tối đa {remainingSlots} ảnh nữa (mỗi ảnh tối đa 5MB)
                        </p>
                    </div>

                    {/* File Previews */}
                    {files.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                Ảnh đã chọn ({files.length})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {files.map((fileWithPreview, index) => (
                                    <div key={index} className="relative">
                                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                                            <img
                                                src={fileWithPreview.preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                                title="Xóa"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <textarea
                                            value={fileWithPreview.caption}
                                            onChange={(e) => updateCaption(index, e.target.value)}
                                            placeholder="Mô tả ảnh (tùy chọn)"
                                            rows={2}
                                            className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
                <button
                    onClick={handleCancel}
                    disabled={uploading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                    Hủy
                </button>
                <button
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0 || remainingSlots <= 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {uploading ? 'Đang tải lên...' : 'Tải lên'}
                </button>
            </div>
        </div>
    );
};

export default PhotoUploadForm;

