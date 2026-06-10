import React, { useState } from 'react';

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
      <div className="text-sm font-semibold text-gray-700">Ảnh minh chứng hoàn thành</div>
      <div className="flex flex-wrap gap-3">
        {proofUrls.map((url, index) => (
          <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
            <img
              src={url}
              alt={`Minh chứng ${index + 1}`}
              className="w-24 h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(url)}
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Phóng to minh chứng"
            className="max-w-full max-h-full object-contain rounded"
          />
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
