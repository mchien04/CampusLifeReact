import React, { useState } from 'react';
import { Images, X } from '@phosphor-icons/react';

interface TaskProofGalleryProps {
  proofUrls?: string[];
}

export default function TaskProofGallery({ proofUrls }: TaskProofGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!proofUrls || proofUrls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Images size={18} weight="duotone" className="text-primary-900" />
        Ảnh minh chứng hoàn thành
        <span className="text-xs font-medium text-gray-400 tabular-nums">({proofUrls.length})</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {proofUrls.map((url, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSelectedImage(url)}
            className="group relative rounded-xl overflow-hidden border border-gray-200 ring-1 ring-gray-100 transition-all hover:border-primary-900/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
          >
            <img
              src={url}
              alt={`Minh chứng ${index + 1}`}
              className="w-24 h-24 object-cover transition-transform group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <img
            src={selectedImage}
            alt="Phóng to minh chứng"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            onClick={() => setSelectedImage(null)}
            aria-label="Đóng"
          >
            <X size={22} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}
