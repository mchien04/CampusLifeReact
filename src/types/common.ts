export interface ApiResponse<T> {
    status: boolean;
    message: string;
    body: T | null;
}
