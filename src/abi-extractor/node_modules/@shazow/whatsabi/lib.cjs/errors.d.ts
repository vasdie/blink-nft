export declare class WhatsABIError extends Error {
    name: string;
    context?: Record<string, any>;
    constructor(message: string, args?: {
        context?: Record<string, any>;
        cause?: Error;
    });
}
export declare class AutoloadError extends WhatsABIError {
    name: string;
}
export declare class LoaderError extends WhatsABIError {
    name: string;
}
export declare class ProviderError extends WhatsABIError {
    name: string;
}
