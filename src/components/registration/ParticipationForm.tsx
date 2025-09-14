import React, { useState } from 'react';
import { ActivityParticipationRequest, ParticipationType, getParticipationTypeLabel } from '../../types/registration';

interface ParticipationFormProps {
    activityId: number;
    activityName: string;
    onSubmit: (data: ActivityParticipationRequest) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ParticipationForm: React.FC<ParticipationFormProps> = ({
    activityId,
    activityName,
    onSubmit,
    onCancel,
    isLoading = false
}) => {
    const [formData, setFormData] = useState<ActivityParticipationRequest>({
        activityId,
        participationType: ParticipationType.ATTENDANCE,
        pointsEarned: 0,
        notes: ''
    });

    const participationTypes = Object.values(ParticipationType);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'pointsEarned' ? parseFloat(value) || 0 : value
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Ghi nhận tham gia
                        </h3>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Sự kiện:</span> {activityName}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="participationType" className="block text-sm font-medium text-gray-700 mb-2">
                                Loại tham gia
                            </label>
                            <select
                                id="participationType"
                                name="participationType"
                                value={formData.participationType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                {participationTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {getParticipationTypeLabel(type)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="pointsEarned" className="block text-sm font-medium text-gray-700 mb-2">
                                Điểm đạt được
                            </label>
                            <input
                                type="number"
                                id="pointsEarned"
                                name="pointsEarned"
                                value={formData.pointsEarned}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập điểm đạt được"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập ghi chú về sự tham gia..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Đang ghi nhận...' : 'Ghi nhận'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ParticipationForm;
