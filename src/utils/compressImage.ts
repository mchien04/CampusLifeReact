export async function compressImage(file: File, opts?: { maxWidth?: number; quality?: number }) {
  const maxWidth = opts?.maxWidth ?? 1280;
  const quality = opts?.quality ?? 0.75;

  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / imageBitmap.width);
  const targetW = Math.round(imageBitmap.width * scale);
  const targetH = Math.round(imageBitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Failed to compress image'))), 'image/jpeg', quality);
  });

  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

