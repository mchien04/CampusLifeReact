import React, { useState } from 'react';
import { Camera, X, SpinnerGap } from '@phosphor-icons/react';
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
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const disabled = uploading || uploadedUrls.length >= maxFiles;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all cursor-pointer focus-within:ring-2 focus-within:ring-primary-900/30 ${
            disabled
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-primary-900 border-primary-900/30 hover:bg-primary-50 active:scale-[0.98]'
          }`}
        >
          {uploading ? (
            <SpinnerGap size={18} className="animate-spin" />
          ) : (
            <Camera size={18} weight="duotone" />
          )}
          {uploading ? 'Đang upload...' : 'Chọn ảnh minh chứng'}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
        <span className="text-xs text-gray-500">
          Tối đa {maxFiles} ảnh · JPEG/PNG · ≤10MB
        </span>
      </div>

      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {uploadedUrls.map((url, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 ring-1 ring-gray-100">
              <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-24 object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-700 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-400/50"
                title="Xóa ảnh"
                aria-label="Xóa ảnh"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
