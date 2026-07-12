import type { AxiosResponse } from 'axios';

function filenameFromContentDisposition(
  header: string | undefined,
  fallback: string
): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(header);
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

/** If BE returns JSON error while FE still receives a blob (HTTP 200). */
export async function downloadBlobResponse(
  response: AxiosResponse<Blob>,
  fallbackFilename: string
): Promise<void> {
  const contentType = response.headers['content-type'] ?? '';
  if (contentType.includes('application/json')) {
    const text = await response.data.text();
    const err = JSON.parse(text) as { message?: string };
    throw new Error(err.message ?? 'Export failed');
  }

  const filename = filenameFromContentDisposition(
    response.headers['content-disposition'],
    fallbackFilename
  );

  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Parse message from axios errors when responseType was 'blob'. */
export async function getBlobErrorMessage(
  error: unknown,
  fallback = 'Có lỗi xảy ra khi xuất Excel'
): Promise<string> {
  const err = error as {
    message?: string;
    response?: { data?: Blob | { message?: string } };
  };

  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as { message?: string };
      return parsed.message ?? fallback;
    } catch {
      return fallback;
    }
  }

  if (data && typeof data === 'object' && 'message' in data && data.message) {
    return String(data.message);
  }

  return err?.message || fallback;
}
