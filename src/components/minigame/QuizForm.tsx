import React, { useState, useEffect, useRef } from 'react';
import { CreateMiniGameRequest, UpdateMiniGameRequest, CreateQuestionRequest, CreateOptionRequest } from '../../types/minigame';
import { ActivityResponse } from '../../types/activity';
import { uploadAPI } from '../../services/uploadAPI';
import { getImageUrl } from '../../utils/imageUtils';

interface QuizFormProps {
    activity: ActivityResponse;
    onSubmit: (data: CreateMiniGameRequest | UpdateMiniGameRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateMiniGameRequest | UpdateMiniGameRequest>;
    title?: string;
    onCancel?: () => void;
    isInSeries?: boolean;
}

const QuizForm: React.FC<QuizFormProps> = ({
    activity,
    onSubmit,
    loading = false,
    initialData = {},
    title = 'Tạo Quiz',
    onCancel,
    isInSeries = false
}) => {
    const [formData, setFormData] = useState<CreateMiniGameRequest>(() => {
        const defaultData: CreateMiniGameRequest = {
            activityId: activity.id,
            title: activity.name || '',
            description: '',
            questionCount: 0,
            timeLimit: undefined,
            requiredCorrectAnswers: undefined,
            rewardPoints: undefined,
            maxAttempts: null,
            questions: []
        };

        const merged = {
            ...defaultData,
            ...initialData,
            activityId: activity.id
        };

        // Ensure maxAttempts is properly set (can be null, undefined, or number)
        if (initialData && 'maxAttempts' in initialData) {
            merged.maxAttempts = initialData.maxAttempts ?? null;
        }

        return merged;
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
    const [uploadingImages, setUploadingImages] = useState<Record<number, boolean>>({});
    // Lưu preview URLs (object URLs) cho file mới chọn
    const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({});
    const previewUrlsRef = useRef<Record<number, string>>({});
    const [unlimitedAttempts, setUnlimitedAttempts] = useState<boolean>(() => {
        // Initialize based on initialData or default to true (unlimited)
        return initialData?.maxAttempts === null || initialData?.maxAttempts === undefined;
    });

    // Convert seconds to MM:SS format
    const secondsToTimeString = (seconds?: number): string => {
        if (!seconds || seconds === 0) return '';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Convert MM:SS format to seconds
    const timeStringToSeconds = (timeString: string): number | undefined => {
        if (!timeString || timeString.trim() === '') return undefined;
        const parts = timeString.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return minutes * 60 + seconds;
        }
        return undefined;
    };

    // Initialize timeLimit display value
    const [timeLimitDisplay, setTimeLimitDisplay] = useState<string>(() => {
        const timeLimit = initialData?.timeLimit;
        if (timeLimit) {
            return secondsToTimeString(timeLimit);
        }
        return '';
    });

    // Update timeLimitDisplay when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData?.timeLimit !== undefined) {
            setTimeLimitDisplay(secondsToTimeString(initialData.timeLimit));
        }
    }, [initialData?.timeLimit]);

    // Sync formData when initialData changes (for edit mode when data loads asynchronously)
    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            console.log('QuizForm - Syncing formData with initialData:', {
                'initialData.maxAttempts': initialData.maxAttempts,
                'initialData keys': Object.keys(initialData)
            });

            setFormData(prev => {
                const updated = {
                    ...prev,
                    ...initialData,
                    activityId: activity.id // Always keep activityId from activity prop
                };
                // Ensure maxAttempts is properly set (can be null, undefined, or number)
                if ('maxAttempts' in initialData) {
                    updated.maxAttempts = initialData.maxAttempts !== undefined ? initialData.maxAttempts : null;
                }

                console.log('QuizForm - Updated formData:', {
                    'updated.maxAttempts': updated.maxAttempts,
                    'type': typeof updated.maxAttempts
                });

                return updated;
            });

            // Update unlimitedAttempts toggle based on maxAttempts
            if ('maxAttempts' in initialData) {
                setUnlimitedAttempts(initialData.maxAttempts === null || initialData.maxAttempts === undefined);
            }

            // Also update timeLimitDisplay
            if (initialData.timeLimit !== undefined) {
                setTimeLimitDisplay(secondsToTimeString(initialData.timeLimit));
            }
        }
    }, [initialData, activity.id]);

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            // Cleanup all created object URLs when component unmounts
            Object.values(previewUrlsRef.current).forEach(url => {
                URL.revokeObjectURL(url);
            });
            previewUrlsRef.current = {};
        };
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? (name === 'maxAttempts' ? parseInt(value) : parseFloat(value)) : (name === 'maxAttempts' ? null : undefined)) : value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const addQuestion = () => {
        const newQuestion: CreateQuestionRequest = {
            questionText: '',
            imageUrl: null,
            options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ]
        };

        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion],
            questionCount: prev.questions.length + 1
        }));

        setCurrentQuestionIndex(formData.questions.length);
    };

    const handleImageUpload = async (questionIndex: number, file: File) => {
        console.log('🔍 QuizForm: handleImageUpload called', { questionIndex, fileName: file.name, fileSize: file.size });
        setUploadingImages(prev => ({ ...prev, [questionIndex]: true }));
        try {
            console.log('🔍 QuizForm: Calling uploadAPI.uploadImage...');
            const uploadResponse = await uploadAPI.uploadImage(file);
            console.log('🔍 QuizForm: uploadResponse received', uploadResponse);

            if (uploadResponse.status && uploadResponse.data) {
                console.log('🔍 QuizForm: Upload successful, imageUrl:', uploadResponse.data.bannerUrl);
                const question = formData.questions[questionIndex];
                updateQuestion(questionIndex, {
                    ...question,
                    imageUrl: uploadResponse.data.bannerUrl
                });
                // Giữ preview cho đến khi ảnh từ server load thành công
                // Preview sẽ được xóa trong onLoad handler của img tag
            } else {
                console.error('🔍 QuizForm: Upload failed', uploadResponse.message);
                // Remove preview on error
                if (previewUrlsRef.current[questionIndex]) {
                    URL.revokeObjectURL(previewUrlsRef.current[questionIndex]);
                    delete previewUrlsRef.current[questionIndex];
                }
                setImagePreviews(prev => {
                    const newPreviews = { ...prev };
                    delete newPreviews[questionIndex];
                    return newPreviews;
                });
                setErrors(prev => ({
                    ...prev,
                    [`question_${questionIndex}_image`]: uploadResponse.message || 'Upload ảnh thất bại'
                }));
            }
        } catch (error: any) {
            console.error('🔍 QuizForm: Upload error caught', error);
            console.error('🔍 QuizForm: Error response', error.response?.data);
            // Remove preview on error
            if (previewUrlsRef.current[questionIndex]) {
                URL.revokeObjectURL(previewUrlsRef.current[questionIndex]);
                delete previewUrlsRef.current[questionIndex];
            }
            setImagePreviews(prev => {
                const newPreviews = { ...prev };
                delete newPreviews[questionIndex];
                return newPreviews;
            });
            setErrors(prev => ({
                ...prev,
                [`question_${questionIndex}_image`]: error.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh'
            }));
        } finally {
            setUploadingImages(prev => ({ ...prev, [questionIndex]: false }));
        }
    };

    const handleRemoveImage = (questionIndex: number) => {
        const question = formData.questions[questionIndex];
        updateQuestion(questionIndex, {
            ...question,
            imageUrl: null
        });
        // Xóa preview
        setImagePreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[questionIndex];
            return newPreviews;
        });
        // Cleanup object URLs
        if (previewUrlsRef.current[questionIndex]) {
            URL.revokeObjectURL(previewUrlsRef.current[questionIndex]);
            delete previewUrlsRef.current[questionIndex];
        }
    };

    const updateQuestion = (index: number, question: CreateQuestionRequest) => {
        const newQuestions = [...formData.questions];
        newQuestions[index] = question;
        setFormData(prev => ({
            ...prev,
            questions: newQuestions,
            questionCount: newQuestions.length
        }));
    };

    const removeQuestion = (index: number) => {
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            questions: newQuestions,
            questionCount: newQuestions.length
        }));
        if (currentQuestionIndex === index) {
            setCurrentQuestionIndex(null);
        } else if (currentQuestionIndex !== null && currentQuestionIndex > index) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const updateOption = (
        questionIndex: number,
        optionIndex: number,
        option: CreateOptionRequest
    ) => {
        const question = formData.questions[questionIndex];
        const newOptions = [...question.options];
        newOptions[optionIndex] = option;
        updateQuestion(questionIndex, {
            ...question,
            options: newOptions
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tiêu đề là bắt buộc';
        }

        if (formData.questions.length === 0) {
            newErrors.questions = 'Vui lòng thêm ít nhất một câu hỏi';
        }

        formData.questions.forEach((question, qIndex) => {
            if (!question.questionText.trim()) {
                newErrors[`question_${qIndex}`] = 'Nội dung câu hỏi không được để trống';
            }

            const correctCount = question.options.filter(opt => opt.isCorrect).length;
            if (correctCount === 0) {
                newErrors[`question_${qIndex}_correct`] = 'Mỗi câu hỏi phải có ít nhất một đáp án đúng';
            }

            question.options.forEach((option, oIndex) => {
                if (!option.text.trim()) {
                    newErrors[`question_${qIndex}_option_${oIndex}`] = 'Nội dung lựa chọn không được để trống';
                }
            });
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Ensure activityId is always included
            const dataWithActivityId = {
                ...formData,
                activityId: activity.id
            };
            onSubmit(dataWithActivityId as CreateMiniGameRequest | UpdateMiniGameRequest);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="text-gray-600 mt-1">Tạo quiz cho activity: {activity.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu đề Quiz *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.title ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                            />
                        </div>

                        <div>
                            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-2">
                                Thời gian giới hạn (phút:giây)
                            </label>
                            <input
                                type="text"
                                id="timeLimit"
                                name="timeLimit"
                                value={timeLimitDisplay}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow only digits and colon
                                    const cleaned = value.replace(/[^\d:]/g, '');

                                    // Format as MM:SS
                                    let formatted = cleaned;
                                    if (cleaned.length > 0 && !cleaned.includes(':')) {
                                        // Auto-format: if user types "5", show "00:05", if "65", show "01:05"
                                        if (cleaned.length <= 2) {
                                            const num = parseInt(cleaned) || 0;
                                            const mins = Math.floor(num / 60);
                                            const secs = num % 60;
                                            formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                                        } else {
                                            // More than 2 digits, treat as MMSS
                                            const num = parseInt(cleaned) || 0;
                                            const mins = Math.floor(num / 100);
                                            const secs = num % 100;
                                            formatted = `${Math.min(mins, 59).toString().padStart(2, '0')}:${Math.min(secs, 59).toString().padStart(2, '0')}`;
                                        }
                                    } else if (cleaned.includes(':')) {
                                        // Already has colon, validate format
                                        const parts = cleaned.split(':');
                                        if (parts.length === 2) {
                                            const mins = Math.min(parseInt(parts[0]) || 0, 59);
                                            const secs = Math.min(parseInt(parts[1]) || 0, 59);
                                            formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                                        }
                                    }

                                    setTimeLimitDisplay(formatted);

                                    // Convert to seconds and update formData
                                    const seconds = timeStringToSeconds(formatted);
                                    setFormData(prev => ({
                                        ...prev,
                                        timeLimit: seconds
                                    }));
                                }}
                                onBlur={(e) => {
                                    // Ensure format is correct on blur
                                    const seconds = timeStringToSeconds(e.target.value);
                                    if (seconds !== undefined) {
                                        const minutes = Math.floor(seconds / 60);
                                        const secs = seconds % 60;
                                        setTimeLimitDisplay(`${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
                                    } else if (e.target.value.trim() === '') {
                                        setTimeLimitDisplay('');
                                        setFormData(prev => ({
                                            ...prev,
                                            timeLimit: undefined
                                        }));
                                    }
                                }}
                                placeholder="00:00 hoặc để trống"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nhập theo định dạng phút:giây (ví dụ: 05:30 = 5 phút 30 giây). Để trống nếu không giới hạn.
                            </p>
                            {formData.timeLimit && (
                                <p className="text-xs text-blue-600 mt-1">
                                    Tương đương: {formData.timeLimit} giây ({Math.floor(formData.timeLimit / 60)} phút {formData.timeLimit % 60} giây)
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="requiredCorrectAnswers" className="block text-sm font-medium text-gray-700 mb-2">
                                Số câu đúng tối thiểu
                            </label>
                            <input
                                type="number"
                                id="requiredCorrectAnswers"
                                name="requiredCorrectAnswers"
                                min="1"
                                value={formData.requiredCorrectAnswers || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                            />
                        </div>

                        {/* Reward Points - Only show if not in series */}
                        {!isInSeries && (
                            <div>
                                <label htmlFor="rewardPoints" className="block text-sm font-medium text-gray-700 mb-2">
                                    Điểm thưởng
                                </label>
                                <input
                                    type="number"
                                    id="rewardPoints"
                                    name="rewardPoints"
                                    min="0"
                                    step="0.1"
                                    value={formData.rewardPoints || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                            </div>
                        )}

                        {/* Info notice for series activities */}
                        {isInSeries && (
                            <div className="md:col-span-2 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-[#FFD66D] p-4 rounded-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-[#FFD66D]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-[#001C44] font-medium">
                                            <strong>Lưu ý:</strong> Quiz trong series sẽ tính điểm từ milestone của series.
                                            Không cần nhập điểm thưởng riêng.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700">
                                    Số lần làm tối đa
                                </label>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Không giới hạn</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newValue = !unlimitedAttempts;
                                            setUnlimitedAttempts(newValue);
                                            if (newValue) {
                                                setFormData(prev => ({ ...prev, maxAttempts: null }));
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:ring-offset-2 ${unlimitedAttempts ? 'bg-[#001C44]' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${unlimitedAttempts ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <input
                                type="number"
                                id="maxAttempts"
                                name="maxAttempts"
                                min="1"
                                value={formData.maxAttempts !== undefined && formData.maxAttempts !== null ? String(formData.maxAttempts) : ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        maxAttempts: value ? parseInt(value) : null
                                    }));
                                }}
                                disabled={unlimitedAttempts}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${unlimitedAttempts ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                    }`}
                                placeholder={unlimitedAttempts ? "Không giới hạn" : "Nhập số lần làm tối đa"}
                            />
                            {unlimitedAttempts && (
                                <p className="text-xs text-gray-500 mt-1">Sinh viên có thể làm quiz không giới hạn số lần</p>
                            )}
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Câu hỏi ({formData.questions.length})
                            </h3>
                        </div>

                        {errors.questions && (
                            <p className="text-red-500 text-sm mb-4">{errors.questions}</p>
                        )}

                        <div className="space-y-4">
                            {formData.questions.map((question, qIndex) => (
                                <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-gray-900">
                                            Câu hỏi {qIndex + 1}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Xóa
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nội dung câu hỏi *
                                        </label>
                                        <textarea
                                            value={question.questionText}
                                            onChange={(e) =>
                                                updateQuestion(qIndex, {
                                                    ...question,
                                                    questionText: e.target.value
                                                })
                                            }
                                            rows={2}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors[`question_${qIndex}`] ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Nhập nội dung câu hỏi..."
                                        />
                                        {errors[`question_${qIndex}`] && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors[`question_${qIndex}`]}
                                            </p>
                                        )}
                                        {errors[`question_${qIndex}_correct`] && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors[`question_${qIndex}_correct`]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Image Upload for Question */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ảnh minh họa (tùy chọn)
                                        </label>
                                        {question.imageUrl || imagePreviews[qIndex] ? (
                                            <div className="space-y-2">
                                                <div className="relative inline-block">
                                                    <img
                                                        src={imagePreviews[qIndex] || (question.imageUrl ? getImageUrl(question.imageUrl) : '') || ''}
                                                        alt="Question illustration"
                                                        className="max-w-full h-auto max-h-48 rounded-lg border border-gray-300"
                                                        onLoad={() => {
                                                            // Once server image loads successfully, clean up preview
                                                            if (imagePreviews[qIndex] && question.imageUrl) {
                                                                if (previewUrlsRef.current[qIndex]) {
                                                                    URL.revokeObjectURL(previewUrlsRef.current[qIndex]);
                                                                    delete previewUrlsRef.current[qIndex];
                                                                }
                                                                setImagePreviews(prev => {
                                                                    const newPreviews = { ...prev };
                                                                    delete newPreviews[qIndex];
                                                                    return newPreviews;
                                                                });
                                                            }
                                                        }}
                                                        onError={(e) => {
                                                            // If server image fails to load, keep preview
                                                            const img = e.target as HTMLImageElement;
                                                            if (imagePreviews[qIndex]) {
                                                                img.src = imagePreviews[qIndex];
                                                            } else {
                                                                img.style.display = 'none';
                                                            }
                                                        }}
                                                    />
                                                    {uploadingImages[qIndex] && (
                                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                                            <div className="text-white text-sm font-medium">Đang upload...</div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(qIndex)}
                                                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Xóa ảnh
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            // Validate file size (5MB)
                                                            if (file.size > 5 * 1024 * 1024) {
                                                                setErrors(prev => ({
                                                                    ...prev,
                                                                    [`question_${qIndex}_image`]: 'File quá lớn. Kích thước tối đa là 5MB'
                                                                }));
                                                                e.target.value = '';
                                                                return;
                                                            }

                                                            // Validate file type
                                                            if (!file.type.startsWith('image/')) {
                                                                setErrors(prev => ({
                                                                    ...prev,
                                                                    [`question_${qIndex}_image`]: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)'
                                                                }));
                                                                e.target.value = '';
                                                                return;
                                                            }

                                                            // Clear previous errors
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors[`question_${qIndex}_image`];
                                                                return newErrors;
                                                            });

                                                            // Tạo preview URL ngay lập tức
                                                            const previewUrl = URL.createObjectURL(file);
                                                            previewUrlsRef.current[qIndex] = previewUrl;
                                                            setImagePreviews(prev => ({ ...prev, [qIndex]: previewUrl }));
                                                            console.log('🔍 QuizForm: Preview created', { qIndex, previewUrl });

                                                            // Start upload
                                                            handleImageUpload(qIndex, file);
                                                        }
                                                        // Reset input to allow selecting the same file again
                                                        e.target.value = '';
                                                    }}
                                                    disabled={uploadingImages[qIndex]}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#001C44] file:text-white hover:file:bg-[#002A66] disabled:opacity-50"
                                                />
                                                {errors[`question_${qIndex}_image`] && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {errors[`question_${qIndex}_image`]}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Các lựa chọn *
                                        </label>
                                        {question.options.map((option, oIndex) => (
                                            <div key={oIndex} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={option.isCorrect}
                                                    onChange={(e) =>
                                                        updateOption(qIndex, oIndex, {
                                                            ...option,
                                                            isCorrect: e.target.checked
                                                        })
                                                    }
                                                    className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                />
                                                <input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) =>
                                                        updateOption(qIndex, oIndex, {
                                                            ...option,
                                                            text: e.target.value
                                                        })
                                                    }
                                                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors[`question_${qIndex}_option_${oIndex}`]
                                                        ? 'border-red-500'
                                                        : 'border-gray-300'
                                                        }`}
                                                    placeholder={`Lựa chọn ${oIndex + 1}`}
                                                />
                                                {option.isCorrect && (
                                                    <span className="text-green-600 text-sm font-medium">✓ Đúng</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Question Button at the end */}
                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="btn-primary px-6 py-3 rounded-lg text-sm font-medium"
                            >
                                + Thêm câu hỏi
                            </button>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-[#001C44] text-white rounded-md hover:bg-[#002A66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang xử lý...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuizForm;

