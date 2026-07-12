import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StandardActivityForm from '../components/events/StandardActivityForm';
import { StandardActivityCreateRequest } from '../types/activity';
import { standardActivityAPI } from '../services/standardActivityAPI';

const CreateEvent: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (data: StandardActivityCreateRequest) => {
        setLoading(true);
        setError('');

        try {
            const response = await standardActivityAPI.createStandardActivity(data);

            if (response.status) {
                toast.success('Tạo sự kiện thành công');
                navigate('/manager/events');
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tạo sự kiện');
            }
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi tạo sự kiện');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="mx-auto max-w-7xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm font-semibold text-rose-800">Không tạo được sự kiện</p>
                    <p className="mt-1 text-sm text-rose-700">{error}</p>
                </div>
            )}

            <StandardActivityForm
                onSubmit={handleSubmit}
                loading={loading}
                title="Tạo sự kiện thường"
                onCancel={() => navigate('/manager/events')}
            />
        </div>
    );
};

export default CreateEvent;
