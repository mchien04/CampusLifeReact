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
                toast.success('Tạo chuỗi sự kiện thành công');
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
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                    }}
                />
                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                        Quản lý chuỗi sự kiện
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                        Tạo chuỗi sự kiện mới
                    </h1>
                    <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed">
                        Thiết lập thông tin chuỗi, mốc điểm thưởng và mẫu cấu hình điểm cho các sự kiện con.
                    </p>
                </div>
            </header>

            <SeriesForm
                onSubmit={handleSubmit}
                loading={loading}
                title="Tạo chuỗi sự kiện mới"
                onCancel={handleCancel}
                embedded
            />
        </div>
    );
};

export default CreateSeries;

