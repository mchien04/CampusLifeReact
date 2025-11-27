import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeriesForm } from '../../components/series';
import { CreateSeriesRequest } from '../../types/series';
import { seriesAPI } from '../../services/seriesAPI';
import { toast } from 'react-toastify';

const CreateSeries: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: CreateSeriesRequest) => {
        setLoading(true);
        try {
            const response = await seriesAPI.createSeries(data);
            if (response.status && response.data) {
                toast.success('Tạo chuỗi sự kiện thành công!');
                navigate(`/manager/series/${response.data.id}`);
            } else {
                toast.error(response.message || 'Tạo chuỗi sự kiện thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo chuỗi sự kiện');
            console.error('Error creating series:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/manager/series');
    };

    return (
        <div>
            <SeriesForm
                onSubmit={handleSubmit}
                loading={loading}
                title="Tạo chuỗi sự kiện mới"
                onCancel={handleCancel}
            />
        </div>
    );
};

export default CreateSeries;

