import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { articleAPI } from '../../../services/articleAPI';

interface SetPrimaryButtonProps {
    articleId: number;
    isPrimary: boolean;
    onSuccess?: () => void;
    className?: string;
}

const SetPrimaryButton: React.FC<SetPrimaryButtonProps> = ({
    articleId,
    isPrimary,
    onSuccess,
    className = '',
}) => {
    const [loading, setLoading] = useState(false);

    const handleSetPrimary = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isPrimary) {
            toast.info('Bài viết này đã là bài viết chính đại diện.');
            return;
        }

        if (!window.confirm('Đặt bài viết này làm bài viết đại diện chính cho sự kiện liên kết? Các bài viết đại diện chính khác cho sự kiện này sẽ bị gỡ bỏ.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await articleAPI.setPrimaryArticle(articleId);
            if (response.status) {
                toast.success('Đã đặt làm bài viết chính đại diện thành công');
                if (onSuccess) onSuccess();
            } else {
                toast.error(response.message || 'Đặt bài viết chính đại diện thất bại');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleSetPrimary}
            disabled={loading || isPrimary}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all border ${
                isPrimary
                    ? 'bg-amber-50 text-amber-700 border-amber-250 cursor-default'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50'
            } ${className}`}
            title={isPrimary ? 'Bài viết chính đại diện' : 'Đặt làm bài viết chính đại diện'}
        >
            <span className="text-base">{isPrimary ? '★' : '☆'}</span>
            <span>{isPrimary ? 'Đại diện chính' : 'Đặt đại diện'}</span>
        </button>
    );
};

export default SetPrimaryButton;
