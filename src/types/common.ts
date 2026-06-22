export interface ApiResponse<T> {
    status: boolean;
    message: string;
    body: T | null;
}

export interface UploadImageApiResponse {
    status: boolean;
    message: string;
    data: string;
}
