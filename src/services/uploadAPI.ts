import api from './api';
import { Response } from '../types/auth';

export const uploadAPI = {
    // Upload image file
    uploadImage: async (file: File): Promise<Response<string>> => {
        try {
            console.log('🔍 uploadAPI: Starting image upload...');
            console.log('🔍 uploadAPI: File info:', {
                name: file.name,
                size: file.size,
                type: file.type
            });

            const formData = new FormData();
            formData.append('file', file);

            console.log('🔍 uploadAPI: Calling backend upload endpoint...');
            const response = await api.post('/api/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('🔍 uploadAPI: Raw response:', response);
            console.log('🔍 uploadAPI: Response data:', response.data);

            // Backend trả về: {data: "url", message: "success", status: true}
            const uploadResponse: Response<string> = {
                status: response.data.status,
                message: response.data.message,
                data: response.data.data // Lấy URL từ response.data.data
            };

            console.log('🔍 uploadAPI: Processed response:', uploadResponse);
            return uploadResponse;
        } catch (error: any) {
            console.error('🔍 uploadAPI: Error uploading image:', error);
            console.error('🔍 uploadAPI: Error response:', error.response?.data);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh',
                data: undefined
            };
        }
    },

    // Delete image by URL
    deleteImage: async (fileUrl: string): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/upload/image?fileUrl=${encodeURIComponent(fileUrl)}`);
            return response.data;
        } catch (error: any) {
            console.error('Error deleting image:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa ảnh',
                data: undefined
            };
        }
    }
};
