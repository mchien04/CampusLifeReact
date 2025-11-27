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
    quiz?: MiniGameQuiz;
}

export interface MiniGameAttempt {
    id: number;
    miniGameId: number;
    studentId: number;
    correctCount: number;
    status: AttemptStatus;
    startedAt: string;
    submittedAt?: string;
    answers?: MiniGameAnswer[];
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
    questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
    questionText: string;
    options: CreateOptionRequest[];
}

export interface CreateOptionRequest {
    text: string;
    isCorrect: boolean;
}

export interface StartAttemptResponse {
    attemptId: number;
    startedAt: string;
    timeLimit?: number;
}

export interface SubmitAttemptRequest {
    answers: Record<number, number>; // questionId -> optionId
}

export interface SubmitAttemptResponse {
    attemptId: number;
    correctCount: number;
    totalQuestions: number;
    status: AttemptStatus;
    pointsEarned?: string;
    passed: boolean;
}

