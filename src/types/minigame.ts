export enum MiniGameType {
    QUIZ = "QUIZ",
    CROSSWORD = "CROSSWORD",
}

export interface MiniGameConfig {
    type: MiniGameType;
    title?: string;
    description?: string;
    questionCount: number;
    timeLimit: number; // giây
    rewardPoints: number;
    isActive?: boolean;
    requiredCorrectAnswers?:number;
    questions?: MiniGameQuizQuestion[];
}

export interface MiniGameQuizQuestion {
    questionText: string;
    options: MiniGameQuizOption[];
}

export interface MiniGameQuizOption {
    text: string;
    correct: boolean;
}
