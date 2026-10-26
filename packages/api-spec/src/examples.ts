import generated from './examples.generated.json';

export interface CapturedResponse {
    status: number;
    contentType: string | null;
    body: unknown;
}

export interface CapturedExamples {
    success?: CapturedResponse;
    failure?: CapturedResponse;
}

export interface CapturedExampleFile {
    /** API base URL the examples were captured against; clients may substitute their own. */
    baseUrl: string;
    endpoints: Record<string, CapturedExamples>;
}

const file = generated as unknown as Partial<CapturedExampleFile>;

/** Real responses captured from the running API by `pnpm spec:examples`. */
export const capturedExamples: CapturedExampleFile = {
    baseUrl: file.baseUrl ?? 'http://localhost:4000',
    endpoints: file.endpoints ?? {},
};

export const getExamples = (endpointId: string): CapturedExamples | undefined => capturedExamples.endpoints[endpointId];
