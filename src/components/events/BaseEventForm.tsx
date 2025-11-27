import React, { useState, useEffect } from 'react';
import { CreateActivityRequest, ActivityType, ScoreType } from '../../types/activity';
import { uploadAPI } from '../../services/uploadAPI';
import { getImageUrl } from '../../utils/imageUtils';
import OrganizerSelector from './OrganizerSelector';

export type FormMode = 'normal' | 'minigame' | 'series';

interface BaseEventFormProps {
    mode: FormMode;
    onSubmit: (data: CreateActivityRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateActivityRequest>;
    title?: string;
    onCancel?: () => void;
    renderFields?: (props: RenderFieldsProps) => React.ReactNode;
}

export interface RenderFieldsProps {
    formData: CreateActivityRequest;
    errors: Record<string, string>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleOrganizerChange: (ids: number[]) => void;
    unlimitedTickets: boolean;
    handleUnlimitedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    originalBannerUrl: string;
    mode: FormMode;
}

const BaseEventForm: React.FC<BaseEventFormProps> = ({
    mode,
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo sự kiện mới",
    onCancel,
    renderFields
}) => {
    const [formData, setFormData] = useState<CreateActivityRequest>(() => {
        const defaultData: CreateActivityRequest = {
            name: '',
            type: mode === 'minigame' ? ActivityType.MINIGAME : ActivityType.SUKIEN,
            scoreType: ScoreType.REN_LUYEN,
            description: '',
            startDate: '',
            endDate: '',
            requiresSubmission: false,
            maxPoints: mode === 'minigame' || mode === 'series' ? undefined : '0',
            penaltyPointsIncomplete: mode === 'minigame' ? undefined : '0',
            registrationStartDate: mode === 'series' ? undefined : '',
            registrationDeadline: mode === 'series' ? undefined : '',
            shareLink: '',
            isImportant: false,
            isDraft: true,
            bannerUrl: '',
            location: '',
            ticketQuantity: mode === 'series' ? undefined : 0,
            benefits: '',
            requirements: '',
            contactInfo: '',
            requiresApproval: mode === 'series' ? undefined : true,
            mandatoryForFacultyStudents: false,
            organizerIds: [],
        };

        return {
            ...defaultData,
            ...Object.fromEntries(
                Object.entries(initialData).map(([key, value]) => [
                    key,
                    value !== undefined ? value : defaultData[key as keyof CreateActivityRequest]
                ])
            )
        };
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [originalBannerUrl, setOriginalBannerUrl] = useState<string>('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [unlimitedTickets, setUnlimitedTickets] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleUnlimitedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setUnlimitedTickets(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, ticketQuantity: undefined }));
        } else {
            setFormData(prev => ({ ...prev, ticketQuantity: 0 }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên sự kiện là bắt buộc';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Địa điểm là bắt buộc';
        }

        // Only validate maxPoints for normal mode and if requiresSubmission
        if (mode === 'normal' && formData.requiresSubmission && (!formData.maxPoints || parseFloat(formData.maxPoints) <= 0)) {
            newErrors.maxPoints = 'Điểm tối đa phải lớn hơn 0 khi yêu cầu nộp bài';
        }

        // Only validate organizerIds for normal and minigame modes
        if (mode !== 'series' && (!formData.organizerIds || formData.organizerIds.length === 0)) {
            newErrors.organizerIds = 'Phải chọn ít nhất một đơn vị tổ chức';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            setFormData(prev => ({
                ...prev,
                ...Object.fromEntries(
                    Object.entries(initialData).map(([key, value]) => [
                        key,
                        value !== undefined ? value : prev[key as keyof CreateActivityRequest]
                    ])
                )
            }));
            if (initialData.bannerUrl) {
                setOriginalBannerUrl(initialData.bannerUrl);
                setFormData(prev => ({
                    ...prev,
                    bannerUrl: ''
                }));
            }
            if (initialData.ticketQuantity === undefined || initialData.ticketQuantity === null) {
                setUnlimitedTickets(true);
            } else {
                setUnlimitedTickets(false);
            }
            setIsInitialLoad(false);
        } else {
            setIsInitialLoad(false);
        }
    }, [initialData]);


    useEffect(() => {
        if (isInitialLoad) return;
        if (formData.isImportant || formData.mandatoryForFacultyStudents) {
            setUnlimitedTickets(true);
            setFormData(prev => ({
                ...prev,
                ticketQuantity: undefined
            }));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad]);

    useEffect(() => {
        if (isInitialLoad) return;
        if (formData.isImportant || formData.mandatoryForFacultyStudents) {
            setFormData(prev => ({
                ...prev,
                requiresApproval: false
            }));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad]);

    const handleOrganizerChange = (ids: number[]) => {
        setFormData(prev => ({
            ...prev,
            organizerIds: ids
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                setIsUploading(true);

                if (formData.bannerFile) {
                    const uploadResponse = await uploadAPI.uploadImage(formData.bannerFile);

                    if (uploadResponse.status && uploadResponse.data) {
                        const updatedFormData = {
                            ...formData,
                            bannerUrl: uploadResponse.data.bannerUrl,
                            bannerFile: undefined
                        };
                        onSubmit(updatedFormData);
                    } else {
                        setErrors(prev => ({
                            ...prev,
                            banner: uploadResponse.message || 'Upload ảnh thất bại'
                        }));
                        setIsUploading(false);
                        return;
                    }
                } else {
                    const submitData = {
                        ...formData,
                        bannerUrl: formData.bannerUrl || (originalBannerUrl && formData.bannerUrl === '' ? originalBannerUrl : undefined)
                    };
                    onSubmit(submitData);
                }
            } catch (error) {
                setErrors(prev => ({
                    ...prev,
                    banner: 'Có lỗi xảy ra khi xử lý form'
                }));
            } finally {
                setIsUploading(false);
            }
        }
    };

    const renderFieldsProps: RenderFieldsProps = {
        formData,
        errors,
        handleChange,
        handleOrganizerChange,
        unlimitedTickets,
        handleUnlimitedChange,
        originalBannerUrl,
        mode
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-[#001C44]">{title}</h2>
                    <p className="text-gray-600 mt-1">Điền thông tin chi tiết về sự kiện</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {renderFields ? renderFields(renderFieldsProps) : null}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                            >
                                Hủy
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || isUploading}
                            className="px-6 py-2 bg-[#001C44] text-white rounded-md hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Đang upload ảnh...' : loading ? 'Đang tạo...' : 'Tạo sự kiện'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BaseEventForm;

