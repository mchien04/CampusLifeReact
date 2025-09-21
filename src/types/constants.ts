export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    STUDENT: 'STUDENT',
} as const;

export const ACTIVITY_TYPES = {
    ACADEMIC: 'ACADEMIC',
    CULTURAL: 'CULTURAL',
    SPORTS: 'SPORTS',
    SOCIAL: 'SOCIAL',
    OTHER: 'OTHER',
} as const;

export const REGISTRATION_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
} as const;

export const TASK_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    OVERDUE: 'OVERDUE',
} as const;

export const NOTIFICATION_TYPES = {
    SYSTEM: 'SYSTEM',
    ACTIVITY: 'ACTIVITY',
    TASK: 'TASK',
    ANNOUNCEMENT: 'ANNOUNCEMENT',
    REMINDER: 'REMINDER',
} as const;

export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
} as const;
