import React, { useState } from 'react';
import { CreateMiniGameRequest, UpdateMiniGameRequest, CreateQuestionRequest, CreateOptionRequest } from '../../types/minigame';
import { ActivityResponse } from '../../types/activity';

interface QuizFormProps {
    activity: ActivityResponse;
    onSubmit: (data: CreateMiniGameRequest | UpdateMiniGameRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateMiniGameRequest | UpdateMiniGameRequest>;
    title?: string;
    onCancel?: () => void;
}

const QuizForm: React.FC<QuizFormProps> = ({
    activity,
    onSubmit,
    loading = false,
    initialData = {},
    title = 'Tạo Quiz',
    onCancel
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
            questions: []
        };

        return {
            ...defaultData,
            ...initialData,
            activityId: activity.id
        };
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
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
                                Thời gian giới hạn (giây)
                            </label>
                            <input
                                type="number"
                                id="timeLimit"
                                name="timeLimit"
                                min="0"
                                value={formData.timeLimit || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                placeholder="Không giới hạn"
                            />
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
                    </div>

                    {/* Questions */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Câu hỏi ({formData.questions.length})
                            </h3>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                + Thêm câu hỏi
                            </button>
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
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                                errors[`question_${qIndex}`] ? 'border-red-500' : 'border-gray-300'
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
                                                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                                        errors[`question_${qIndex}_option_${oIndex}`]
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

