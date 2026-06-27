import { useState, useCallback, useRef } from 'react';
import { eventAPI } from '../services/eventAPI';
import { seriesAPI } from '../services/seriesAPI';
import { 
    ActivityPresetPreviewRequest, 
    ActivityPresetPreviewResponse,
    SeriesPresetPreviewRequest,
    SeriesPresetPreviewResponse
} from '../types/presets';

export interface UsePresetPreviewReturn<T> {
    previewResponse: T | null;
    loading: boolean;
    error: string | null;
    executePreview: (request: unknown) => Promise<void>;
}

export const useActivityPresetPreview = (): UsePresetPreviewReturn<ActivityPresetPreviewResponse> => {
    const [previewResponse, setPreviewResponse] = useState<ActivityPresetPreviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const executePreview = useCallback(async (request: unknown) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await eventAPI.previewActivityPreset(request as ActivityPresetPreviewRequest);
                if (res.status && res.data) {
                    setPreviewResponse(res.data);
                } else {
                    setError(res.message || 'Không thể xem trước cấu hình');
                    setPreviewResponse(null);
                }
            } catch (err) {
                setError('Lỗi kết nối khi xem trước cấu hình');
                setPreviewResponse(null);
            } finally {
                setLoading(false);
            }
        }, 300); // debounce 300ms
    }, []);

    return { previewResponse, loading, error, executePreview };
};

export const useSeriesPresetPreview = (): UsePresetPreviewReturn<SeriesPresetPreviewResponse> => {
    const [previewResponse, setPreviewResponse] = useState<SeriesPresetPreviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const executePreview = useCallback(async (request: unknown) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await seriesAPI.previewSeriesPreset(request as SeriesPresetPreviewRequest);
                if (res.status && res.data) {
                    setPreviewResponse(res.data);
                } else {
                    setError(res.message || 'Không thể xem trước cấu hình chuỗi');
                    setPreviewResponse(null);
                }
            } catch (err) {
                setError('Lỗi kết nối khi xem trước cấu hình chuỗi');
                setPreviewResponse(null);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    return { previewResponse, loading, error, executePreview };
};
