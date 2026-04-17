import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import ArticleDetail from './ArticleDetail';
import { articleAPI } from '../services/articleAPI';

const mockUseParams = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock('../services/articleAPI', () => ({
    articleAPI: {
        getArticleBySlug: jest.fn(),
    },
}));

const mockedArticleAPI = articleAPI as jest.Mocked<typeof articleAPI>;

const renderArticlePage = () => {
    return render(
        <HelmetProvider>
            <ArticleDetail />
        </HelmetProvider>
    );
};

describe('ArticleDetail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseParams.mockReturnValue({ slug: 'workshop-react-2026' });
    });

    it('renders article content and OPEN CTA label', async () => {
        mockedArticleAPI.getArticleBySlug.mockResolvedValue({
            status: true,
            message: 'ok',
            body: {
                id: 1,
                title: 'Workshop React 2026',
                slug: 'workshop-react-2026',
                thumbnailUrl: null,
                content: '<h2>Noi dung</h2><p>Hello</p>',
                seoTitle: 'SEO title',
                seoDescription: 'SEO desc',
                published: true,
                publishedAt: '2026-04-17T10:30:00',
                registrationStatus: 'OPEN',
                registrationLink: '/activities/123',
            },
        });

        renderArticlePage();

        expect(await screen.findByText('Workshop React 2026')).toBeInTheDocument();
        const ctaButton = screen.getByRole('button', { name: 'Đăng ký ngay' });
        expect(ctaButton).toBeEnabled();
    });

    it('renders not found view on 404', async () => {
        mockedArticleAPI.getArticleBySlug.mockRejectedValue({
            response: {
                status: 404,
            },
        });

        mockUseParams.mockReturnValue({ slug: 'not-found-slug' });
        renderArticlePage();

        expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
        const homeButton = screen.getByRole('button', { name: 'Về trang chủ' });
        fireEvent.click(homeButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});