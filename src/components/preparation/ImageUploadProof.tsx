import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { preparationAPI } from '../../services';

interface ImageUploadProofProps {
  taskId: number;
  uploadedUrls: string[];
  setUploadedUrls: (urls: string[] | ((prev: string[]) => string[])) => void;
  maxFiles?: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export default function ImageUploadProof({
  taskId,
  uploadedUrls,
  setUploadedUrls,
  maxFiles = 10,
}: ImageUploadProofProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedUrls.length + files.length > maxFiles) {
      toast.error(`Chỉ được upload tối đa ${maxFiles} ảnh.`);
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`File ${file.name} không đúng định dạng jpeg/png.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} vượt quá dung lượng 10MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      const newUrls: string[] = [];
      for (const file of validFiles) {
        const url = await preparationAPI.uploadTaskProof(taskId, file);
        newUrls.push(url);
      }
      setUploadedUrls((prev) => [...prev, ...newUrls]);
      toast.success('Upload ảnh thành công.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Upload ảnh thất bại.');
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label
          className={`px-4 py-2 text-sm font-medium border rounded-lg cursor-pointer transition-colors ${
            uploading || uploadedUrls.length >= maxFiles
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-[#001C44] border-[#001C44] hover:bg-gray-50'
          }`}
        >
          {uploading ? 'Đang upload...' : '+ Chọn ảnh minh chứng'}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading || uploadedUrls.length >= maxFiles}
          />
        </label>
        <span className="text-xs text-gray-500">
          (Tối đa {maxFiles} ảnh, JPEG/PNG, &le;10MB)
        </span>
      </div>

      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {uploadedUrls.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={url}
                alt={`Proof ${idx + 1}`}
                className="w-full h-24 object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa ảnh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
