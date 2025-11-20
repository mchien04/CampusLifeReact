import api from './api';
import { ActivityPhotoResponse } from '../types/activity';
import { Response } from '../types/auth';

export const activityPhotoAPI = {
    // Upload photos for an activity
    uploadPhotos: async (
        activityId: number,
        files: File[],
        captions?: string[]
    ): Promise<Response<ActivityPhotoResponse[]>> => {
        try {
            const formData = new FormData();

            // Append files
            files.forEach((file) => {
                formData.append('files', file);
            });

            // Append captions if provided
            if (captions) {
                captions.forEach((caption) => {
                    formData.append('captions', caption || '');
                });
            }

            const response = await api.post(`/api/activities/${activityId}/photos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || response.data
            };
        } catch (error: any) {
            console.error('Error uploading photos:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to upload photos',
                data: undefined
            };
        }
    },

    // Get all photos for an activity
    getActivityPhotos: async (activityId: number): Promise<Response<ActivityPhotoResponse[]>> => {
        try {
            const response = await api.get(`/api/activities/${activityId}/photos`);
            console.log('getActivityPhotos response:', response.data);

            // Handle different response formats
            let photosData = null;
            if (response.data.body) {
                photosData = response.data.body;
            } else if (response.data.data) {
                photosData = response.data.data;
            } else if (Array.isArray(response.data)) {
                photosData = response.data;
            } else if (response.data.status && response.data.body) {
                photosData = response.data.body;
            } else if (response.data.status && response.data.data) {
                photosData = response.data.data;
            }

            return {
                status: response.data.status !== false,
                message: response.data.message || 'Photos retrieved successfully',
                data: photosData || []
            };
        } catch (error: any) {
            console.error('Error fetching photos:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch photos',
                data: undefined
            };
        }
    },

    // Delete a photo
    deletePhoto: async (activityId: number, photoId: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/activities/${activityId}/photos/${photoId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error deleting photo:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to delete photo',
                data: undefined
            };
        }
    },

    // Update photo display order
    updatePhotoOrder: async (
        activityId: number,
        photoId: number,
        order: number
    ): Promise<Response<ActivityPhotoResponse>> => {
        try {
            const response = await api.put(`/api/activities/${activityId}/photos/${photoId}/order`, null, {
                params: { order }
            });
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || response.data
            };
        } catch (error: any) {
            console.error('Error updating photo order:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to update photo order',
                data: undefined
            };
        }
    }
};

