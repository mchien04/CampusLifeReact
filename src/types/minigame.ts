export enum MiniGameType {
    QUIZ = 'QUIZ'
}

export enum AttemptStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    PASSED = 'PASSED',
    FAILED = 'FAILED'
}

export interface MiniGameQuizOption {
    id: number;
    text: string;
    isCorrect: boolean;
    displayOrder?: number;
}

export interface MiniGameQuizQuestion {
    id: number;
    questionText: string;
    options: MiniGameQuizOption[];
    displayOrder: number;
}

export interface MiniGameQuiz {
    id: number;
    miniGame: MiniGame;
    questions: MiniGameQuizQuestion[];
}

export interface MiniGame {
    id: number;
    title: string;
    description?: string;
    questionCount: number;
    timeLimit?: number; // in seconds
    isActive: boolean;
    type: MiniGameType;
    activityId: number;
    requiredCorrectAnswers?: number;
    rewardPoints?: string; // BigDecimal as string
    maxAttempts?: number | null; // null = không giới hạn
    // Note: quiz is no longer included in MiniGameResponse from backend
    // Use getQuestions API to fetch questions separately
}

// Matches MiniGameAttemptResponse from backend
export interface MiniGameAttempt {
    id: number;
    status: string; // Changed from AttemptStatus enum to string to match backend
    correctCount: number;
    totalQuestions: number;
    pointsEarned?: string; // BigDecimal as string
    startedAt: string;
    submittedAt?: string;
}

export interface MiniGameAnswer {
    id: number;
    questionId: number;
    selectedOptionId: number;
    isCorrect: boolean;
}

export interface CreateMiniGameRequest {
    activityId: number;
    title: string;
    description?: string;
    questionCount: number;
    timeLimit?: number;
    requiredCorrectAnswers?: number;
    rewardPoints?: string;
    maxAttempts?: number | null; // null = không giới hạn
    questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
    questionText: string;
    imageUrl?: string | null;
    options: CreateOptionRequest[];
}

export interface CreateOptionRequest {
    text: string;
    isCorrect: boolean;
}

// UpdateMiniGameRequest - matches backend DTO
export interface UpdateMiniGameRequest {
    title?: string;
    description?: string;
    questionCount?: number;
    timeLimit?: number;
    requiredCorrectAnswers?: number;
    rewardPoints?: string;
    maxAttempts?: number | null; // null = không giới hạn
    questions?: CreateQuestionRequest[];
}

export interface StartAttemptResponse {
    id: number;
    miniGameId: number;
    studentId: number;
    status: string; // Changed to string to match backend
    startedAt: string;
    timeLimit?: number;
    // Legacy field for backward compatibility
    attemptId?: number;
}

export interface SubmitAttemptRequest {
    answers: Record<string, number>; // questionId (string) -> optionId (number)
}

export interface SubmitAttemptResponse {
    id: number;
    status: string; // Changed to string to match backend
    correctCount: number;
    totalQuestions: number;
    requiredCorrectAnswers?: number; // Shown when FAILED
    pointsEarned?: string;
    participation?: {
        id: number;
        pointsEarned: string;
        isCompleted: boolean;
        participationType: string;
    }; // Present when PASSED
    // Legacy field for backward compatibility
    attemptId?: number;
    passed?: boolean; // Can be derived from status === 'PASSED'
}

// Types for Questions API (without correct answers)
export interface OptionWithoutAnswer {
    id: number;
    text: string;
}

export interface QuestionWithoutAnswer {
    id: number;
    questionText: string;
    imageUrl?: string | null;
    displayOrder: number;
    options: OptionWithoutAnswer[];
}

export interface QuestionsResponse {
    miniGameId: number;
    title: string;
    description?: string;
    questionCount: number;
    timeLimit?: number;
    questions: QuestionWithoutAnswer[];
}

// Types for Attempt Detail API (with correct answers)
export interface OptionWithAnswer {
    id: number;
    text: string;
    isCorrect: boolean;
    isSelected: boolean;
}

export interface QuestionWithAnswer {
    id: number;
    questionText: string;
    imageUrl?: string | null;
    displayOrder: number;
    options: OptionWithAnswer[];
    correctOptionId: number;
    selectedOptionId?: number;
    isCorrect: boolean;
}

// AttemptDetailResponse - matches backend DTO exactly
export interface AttemptDetailResponse {
    id: number;
    status: string;
    correctCount: number;
    totalQuestions: number;
    pointsEarned?: string;
    startedAt: string;
    submittedAt?: string;
    requiredCorrectAnswers?: number;
    questions: QuestionWithAnswer[];
}

// Types for Edit Questions API (with correct answers for admin/manager)
export interface QuizOptionEditResponse {
    id: number;
    text: string;
    isCorrect: boolean;
}

export interface QuizQuestionEditResponse {
    id: number;
    questionText: string;
    imageUrl?: string | null;
    displayOrder: number;
    options: QuizOptionEditResponse[];
}

export interface QuizQuestionsEditResponse {
    miniGameId: number;
    title: string;
    description?: string;
    questionCount: number;
    timeLimit?: number;
    requiredCorrectAnswers?: number;
    rewardPoints?: string;
    maxAttempts?: number | null;
    questions: QuizQuestionEditResponse[];
}

