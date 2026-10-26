export type IErrorMessage = {
    path: string;
    message: string;
};

export type IErrorResponse = {
    message: string;
    status: number;
    code: string;
    path: string;
    requestId: string;
    errors?: IErrorMessage[];
};
