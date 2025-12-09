// Dashboard Statistics Types
export interface TopActivity {
    activityId: number;
    activityName: string;
    registrationCount: number;
    participationCount: number;
}

export interface TopStudent {
    studentId: number;
    studentName: string;
    studentCode: string;
    participationCount: number;
}

export interface DashboardStatisticsResponse {
    totalActivities: number;
    totalStudents: number;
    totalSeries: number;
    totalMiniGames: number;
    monthlyRegistrations: number;
    monthlyParticipations: number;
    averageParticipationRate: number;
    topActivities: TopActivity[];
    topStudents: TopStudent[];
}

// Activity Statistics Types
export interface ActivityStatisticsResponse {
    totalActivities: number;
    countByType: Record<string, number>;
    countByStatus: Record<string, number>;
    topActivitiesByRegistrations: TopActivity[];
    participationRates: Array<{
        activityId: number;
        activityName: string;
        registrationCount: number;
        participationCount: number;
        participationRate: number;
    }>;
    countByDepartment: Record<string, number>;
    activitiesInSeries: number;
    standaloneActivities: number;
}

// Student Statistics Types
export interface TopParticipant {
    studentId: number;
    studentName: string;
    studentCode: string;
    participationCount: number;
}

export interface InactiveStudent {
    studentId: number;
    studentName: string;
    studentCode: string;
    departmentName?: string;
}

export interface LowParticipationRateStudent {
    studentId: number;
    studentName: string;
    studentCode: string;
    registrationCount: number;
    participationCount: number;
    participationRate: number;
}

export interface StudentStatisticsResponse {
    totalStudents: number;
    countByDepartment: Record<string, number>;
    countByClass: Record<string, number>;
    topParticipants: TopParticipant[];
    inactiveStudents: InactiveStudent[];
    lowParticipationRateStudents: LowParticipationRateStudent[];
}

// Score Statistics Types
export interface ScoreStatisticsByType {
    scoreType: string;
    averageScore: number;
    maxScore: number;
    minScore: number;
    totalStudents: number;
}

export interface TopStudentByScore {
    studentId: number;
    studentName: string;
    studentCode: string;
    scoreType: string;
    score: number;
    semesterId?: number;
    semesterName?: string;
}

export interface ScoreStatisticsResponse {
    statisticsByType: Record<string, ScoreStatisticsByType>;
    topStudents: TopStudentByScore[];
    averageByDepartment: Record<string, number>;
    averageByClass: Record<string, number>;
    averageBySemester: Record<string, number>;
    scoreDistribution: Record<string, number>;
}

// Series Statistics Types
export interface SeriesDetail {
    seriesId: number;
    seriesName: string;
    totalActivities: number;
    registeredStudents: number;
    completedStudents: number;
    completionRate: number;
}

export interface PopularSeries {
    seriesId: number;
    seriesName: string;
    studentCount: number;
    totalActivities: number;
}

export interface SeriesStatisticsResponse {
    totalSeries: number;
    seriesDetails: SeriesDetail[];
    studentsPerSeries: Record<string, number>;
    milestonePointsAwarded: Record<string, number>;
    popularSeries: PopularSeries[];
}

// Minigame Statistics Types
export interface MinigameDetail {
    miniGameId: number;
    title: string;
    totalAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    passRate: number;
    averageScore: number;
}

export interface PopularMinigame {
    miniGameId: number;
    title: string;
    attemptCount: number;
    uniqueStudentCount: number;
}

export interface MinigameStatisticsResponse {
    totalMiniGames: number;
    totalAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    passRate: number;
    miniGameDetails: Record<string, MinigameDetail>;
    popularMiniGames: PopularMinigame[];
    averageScoreByMiniGame: Record<string, number>;
    averageCorrectAnswersByMiniGame: Record<string, number>;
}


