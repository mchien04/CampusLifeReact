import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import PublicLayout from './PublicLayout';
import StudentLayout from './StudentLayout';

type ArticleLayoutProps = {
    children: React.ReactNode;
};

const ArticleLayout: React.FC<ArticleLayoutProps> = ({ children }) => {
    const { isAuthenticated, userRole } = useAuth();

    if (isAuthenticated && userRole === Role.STUDENT) {
        return <StudentLayout>{children}</StudentLayout>;
    }

    return <PublicLayout>{children}</PublicLayout>;
};

export default ArticleLayout;

