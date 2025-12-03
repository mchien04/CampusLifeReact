import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeriesForm } from '../../components/series';
import { CreateSeriesRequest, UpdateSeriesRequest, SeriesResponse } from '../../types/series';
import { seriesAPI } from '../../services/seriesAPI';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';

const EditSeries: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [series, setSeries] = useState<SeriesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadSeries();
        }
    }, [id]);

    const loadSeries = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await seriesAPI.getSeriesById(parseInt(id));
            if (response.status && response.data) {
                setSeries(response.data);
            } else {
                setError(response.message || 'Không thể tải thông tin chuỗi sự kiện');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải thông tin chuỗi sự kiện');
            console.error('Error loading series:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: CreateSeriesRequest) => {
        if (!id) return;

        setSaving(true);
        try {
            // Convert CreateSeriesRequest to UpdateSeriesRequest (all fields optional)
            const updateData: UpdateSeriesRequest = {
                name: data.name,
                description: data.description,
                milestonePoints: data.milestonePoints,
                scoreType: data.scoreType,
                mainActivityId: data.mainActivityId,
                registrationStartDate: data.registrationStartDate,
                registrationDeadline: data.registrationDeadline,
                requiresApproval: data.requiresApproval,
                ticketQuantity: data.ticketQuantity
            };
            const response = await seriesAPI.updateSeries(parseInt(id), updateData);
            if (response.status && response.data) {
                toast.success('Cập nhật chuỗi sự kiện thành công!');
                navigate(`/manager/series/${id}`);
            } else {
                toast.error(response.message || 'Cập nhật thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
            console.error('Error updating series:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/manager/series/${id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !series) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error || 'Không tìm thấy chuỗi sự kiện'}</p>
                    <button
                        onClick={() => navigate('/manager/series')}
                        className="btn-primary px-6 py-3 rounded-lg font-medium"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <SeriesForm
                onSubmit={handleSubmit}
                loading={saving}
                initialData={{
                    name: series.name,
                    description: series.description,
                    milestonePoints: series.milestonePoints,
                    scoreType: series.scoreType,
                    registrationStartDate: series.registrationStartDate || undefined,
                    registrationDeadline: series.registrationDeadline || undefined,
                    requiresApproval: series.requiresApproval,
                    ticketQuantity: series.ticketQuantity || undefined
                }}
                title="Chỉnh sửa chuỗi sự kiện"
                onCancel={handleCancel}
            />
        </div>
    );
};

export default EditSeries;

