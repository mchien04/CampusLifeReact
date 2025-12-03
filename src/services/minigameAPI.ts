import api from './api';
import { Response } from '../types/auth';
import {
    MiniGame,
    CreateMiniGameRequest,
    UpdateMiniGameRequest,
    StartAttemptResponse,
    SubmitAttemptRequest,
    SubmitAttemptResponse,
    MiniGameAttempt,
    QuestionsResponse,
    AttemptDetailResponse,
    QuizQuestionsEditResponse
} from '../types/minigame';

export const minigameAPI = {
    // Create minigame with quiz
    createMiniGame: async (data: CreateMiniGameRequest): Promise<Response<MiniGame>> => {
        try {
            const response = await api.post('/api/minigames', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating minigame:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo minigame',
                data: undefined
            };
        }
    },

    // Check if activity has quiz
    checkActivityHasQuiz: async (activityId: number): Promise<Response<{
        hasQuiz: boolean;
        miniGameId?: number;
        miniGameTitle?: string;
        isActive?: boolean;
        quizId?: number;
        questionCount?: number;
        message: string;
    }>> => {
        try {
            const response = await api.get(`/api/minigames/activity/${activityId}/check`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error checking activity quiz:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra quiz',
                data: undefined
            };
        }
    },

    // Get minigame by activity ID
    getMiniGameByActivity: async (activityId: number): Promise<Response<MiniGame>> => {
        try {
            console.log('minigameAPI.getMiniGameByActivity: Calling GET /api/minigames/activity/' + activityId);
            const response = await api.get(`/api/minigames/activity/${activityId}`);
            console.log('minigameAPI.getMiniGameByActivity: Raw response:', response.data);

            const result = {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };

            console.log('minigameAPI.getMiniGameByActivity: Processed response:', result);
            console.log('minigameAPI.getMiniGameByActivity: Minigame data:', result.data);

            return result;
        } catch (error: any) {
            console.error('minigameAPI.getMiniGameByActivity: Error', error);
            console.error('minigameAPI.getMiniGameByActivity: Error response:', error.response?.data);
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Không tìm thấy minigame cho activity này',
                    data: undefined
                };
            }
            throw error;
        }
    },

    // Start attempt (Student)
    startAttempt: async (miniGameId: number): Promise<Response<StartAttemptResponse>> => {
        try {
            console.log('minigameAPI.startAttempt: Calling POST /api/minigames/' + miniGameId + '/start');
            const response = await api.post(`/api/minigames/${miniGameId}/start`);
            console.log('minigameAPI.startAttempt: Response received', response.data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('minigameAPI.startAttempt: Error', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu làm quiz',
                data: undefined
            };
        }
    },

    // Submit attempt (Student)
    submitAttempt: async (
        attemptId: number,
        data: SubmitAttemptRequest
    ): Promise<Response<SubmitAttemptResponse>> => {
        try {
            console.log('minigameAPI.submitAttempt: Calling POST /api/minigames/attempts/' + attemptId + '/submit');
            console.log('minigameAPI.submitAttempt: Request data:', data);
            const response = await api.post(`/api/minigames/attempts/${attemptId}/submit`, data);
            console.log('minigameAPI.submitAttempt: Response received', response.data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('minigameAPI.submitAttempt: Error', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi nộp bài quiz',
                data: undefined
            };
        }
    },

    // Get my attempts (Student)
    getMyAttempts: async (miniGameId: number): Promise<Response<MiniGameAttempt[]>> => {
        try {
            const response = await api.get(`/api/minigames/${miniGameId}/attempts/my`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching attempts:', error);
            return {
                status: false,
                message: 'Không thể tải lịch sử attempts',
                data: []
            };
        }
    },

    // Get all minigames (Admin/Manager)
    getAllMiniGames: async (): Promise<Response<MiniGame[]>> => {
        try {
            const response = await api.get('/api/minigames');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching minigames:', error);
            return {
                status: false,
                message: 'Không thể tải danh sách minigame',
                data: []
            };
        }
    },

    // Update minigame
    updateMiniGame: async (id: number, data: UpdateMiniGameRequest): Promise<Response<MiniGame>> => {
        try {
            const response = await api.put(`/api/minigames/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating minigame:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật minigame',
                data: undefined
            };
        }
    },

    // Delete minigame
    deleteMiniGame: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/minigames/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error deleting minigame:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa minigame',
                data: undefined
            };
        }
    },

    // Get questions for quiz (without correct answers)
    getQuestions: async (miniGameId: number): Promise<Response<QuestionsResponse>> => {
        try {
            console.log('minigameAPI.getQuestions: Calling GET /api/minigames/' + miniGameId + '/questions');
            const response = await api.get(`/api/minigames/${miniGameId}/questions`);
            console.log('minigameAPI.getQuestions: Response received', response.data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('minigameAPI.getQuestions: Error', error);
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Không tìm thấy câu hỏi cho minigame này',
                    data: undefined
                };
            }
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tải câu hỏi',
                data: undefined
            };
        }
    },

    // Get attempt detail (with correct answers)
    getAttemptDetail: async (attemptId: number): Promise<Response<AttemptDetailResponse>> => {
        try {
            const response = await api.get(`/api/minigames/attempts/${attemptId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching attempt detail:', error);
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Không tìm thấy attempt này',
                    data: undefined
                };
            }
            if (error.response?.status === 403) {
                return {
                    status: false,
                    message: 'Bạn không có quyền xem attempt này',
                    data: undefined
                };
            }
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tải chi tiết attempt',
                data: undefined
            };
        }
    },

    // Get questions for edit (with correct answers for admin/manager)
    getQuestionsForEdit: async (miniGameId: number): Promise<Response<QuizQuestionsEditResponse>> => {
        try {
            const response = await api.get(`/api/minigames/${miniGameId}/questions/edit`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching questions for edit:', error);
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Không tìm thấy minigame này',
                    data: undefined
                };
            }
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tải câu hỏi để chỉnh sửa',
                data: undefined
            };
        }
    }
};

