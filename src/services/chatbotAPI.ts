import api from './api';

export type ChatbotPageContext = 'GLOBAL' | 'ACTIVITY_DETAIL' | 'ARTICLE_DETAIL';

export interface ChatbotRequest {
    conversationId: number | null;
    contextActivityId: number | null;
    contextArticleSlug: string | null;
    pageContext: ChatbotPageContext;
    message: string;
}

export interface ChatbotResolvedActivity {
    id: number;
    name: string;
}

export interface ChatbotActivityOption {
    id: number;
    name: string;
    startDate: string | null;
    location: string | null;
}

export interface ChatbotResponse {
    conversationId: number;
    answer: string;
    resolvedActivity: ChatbotResolvedActivity | null;
    needsClarification: boolean;
    activityOptions: ChatbotActivityOption[];
}

export const chatbotAPI = {
    sendMessage: async (data: ChatbotRequest): Promise<ChatbotResponse> => {
        const response = await api.post('/api/chatbot', data);
        return response.data;
    },
};

