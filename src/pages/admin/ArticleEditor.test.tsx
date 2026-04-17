import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArticleEditor from './ArticleEditor';
import { articleAPI } from '../../services/articleAPI';

const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
    useParams: () => mockUseParams(),
    Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}), { virtual: true });

jest.mock('../../services/articleAPI', () => ({
    articleAPI: {
        getArticleByActivityId: jest.fn(),
        createArticle: jest.fn(),
        updateArticle: jest.fn(),
        publishArticle: jest.fn(),
        unpublishArticle: jest.fn(),
    },
}));

const mockedArticleAPI = articleAPI as jest.Mocked<typeof articleAPI>;

const renderEditorPage = () => {
    return render(
        <ArticleEditor />
    );
};

describe('ArticleEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseParams.mockReturnValue({ id: '123' });
    });

    it('creates a new article in empty state', async () => {
        mockedArticleAPI.getArticleByActivityId.mockRejectedValue({ response: { status: 404 } });
        mockedArticleAPI.createArticle.mockResolvedValue({
            status: true,
            message: 'created',
            body: {
                id: 10,
                activityId: 123,
                title: 'Workshop React 2026',
                slug: 'workshop-react-2026',
                thumbnailUrl: null,
                content: '<p>content</p>',
                seoTitle: null,
                seoDescription: null,
                published: false,
                publishedAt: null,
                createdAt: null,
                updatedAt: null,
            },
        });

        renderEditorPage();

        expect(await screen.findByText('Admin Article Editor')).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText('Workshop React 2026'), { target: { value: 'Workshop React 2026' } });
        fireEvent.change(screen.getByPlaceholderText('workshop-react-2026'), { target: { value: 'workshop-react-2026' } });
        fireEvent.change(screen.getByPlaceholderText('<h1>...</h1>'), { target: { value: '<p>content</p>' } });

        fireEvent.click(screen.getByRole('button', { name: 'Save new article' }));

        await waitFor(() => {
            expect(mockedArticleAPI.createArticle).toHaveBeenCalledWith(expect.objectContaining({
                activityId: 123,
                title: 'Workshop React 2026',
                slug: 'workshop-react-2026',
                content: '<p>content</p>',
            }));
        });
    });

    it('publishes existing article', async () => {
        mockedArticleAPI.getArticleByActivityId.mockResolvedValue({
            status: true,
            message: 'ok',
            body: {
                id: 20,
                activityId: 123,
                title: 'Existing Article',
                slug: 'existing-article',
                thumbnailUrl: null,
                content: '<p>existing</p>',
                seoTitle: null,
                seoDescription: null,
                published: false,
                publishedAt: null,
                createdAt: null,
                updatedAt: null,
            },
        });
        mockedArticleAPI.publishArticle.mockResolvedValue({
            status: true,
            message: 'published',
            body: {
                id: 20,
                activityId: 123,
                title: 'Existing Article',
                slug: 'existing-article',
                thumbnailUrl: null,
                content: '<p>existing</p>',
                seoTitle: null,
                seoDescription: null,
                published: true,
                publishedAt: '2026-04-17T12:00:00',
                createdAt: null,
                updatedAt: null,
            },
        });

        renderEditorPage();

        expect(await screen.findByRole('button', { name: 'Publish' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

        await waitFor(() => {
            expect(mockedArticleAPI.publishArticle).toHaveBeenCalledWith(20);
        });
    });
});