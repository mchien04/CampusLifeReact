import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import PublicLayout from './PublicLayout';
import StudentLayout from './StudentLayout';
import { ChatbotPageContext } from '../../services/chatbotAPI';

type ArticleLayoutProps = {
    children: React.ReactNode;
    chatbotEnabled?: boolean;
    chatbotPageContext?: ChatbotPageContext;
    chatbotContextActivityId?: number | null;
    chatbotContextArticleSlug?: string | null;
};

const ArticleLayout: React.FC<ArticleLayoutProps> = ({
    children,
    chatbotEnabled = false,
    chatbotPageContext = 'GLOBAL',
    chatbotContextActivityId = null,
    chatbotContextArticleSlug = null,
}) => {
    const { isAuthenticated, userRole } = useAuth();

    if (isAuthenticated && userRole === Role.STUDENT) {
        return (
            <StudentLayout
                chatbotPageContext={chatbotPageContext}
                chatbotContextActivityId={chatbotContextActivityId}
                chatbotContextArticleSlug={chatbotContextArticleSlug}
            >
                {children}
            </StudentLayout>
        );
    }

    return (
        <PublicLayout
            chatbotEnabled={chatbotEnabled}
            chatbotPageContext={chatbotPageContext}
            chatbotContextActivityId={chatbotContextActivityId}
            chatbotContextArticleSlug={chatbotContextArticleSlug}
        >
            {children}
        </PublicLayout>
    );
};

export default ArticleLayout;
