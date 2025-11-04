import api from './api';
import { Response } from '../types/auth';

export const ratingAPI = {
  // Lấy thống kê
  getStats: async (activityId: number): Promise<Response<any>> => {
    try {
      const res = await api.get(`/api/ratings/stats/${activityId}`);
      console.log('API rating stats response:', res.data);

      return res.data;
    } catch (err: any) {
      console.error('ratingAPI.getStats error:', err);
      return { status: false, message: 'Không thể tải thống kê', data: null };
    }
  },

  // Gửi đánh giá (nếu sau này cần)
  createRating: async (req: {
    activityId: number;
    studentId: number;
    rating: number;
    comment?: string;
  }): Promise<Response<any>> => {
    try {
      const res = await api.post(`/api/rattings/create`, null, {
        params: req,
      });
      return res.data;
    } catch (err: any) {
      console.error('ratingAPI.createRating error:', err);
      return { status: false, message: 'Không thể gửi đánh giá', data: null };
    }
  },
};
