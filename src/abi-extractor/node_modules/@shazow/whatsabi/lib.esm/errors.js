export class WhatsABIError extends Error {
    name = 'WhatsABIError';
    // Some variables included from the context scope of the error, for debugging
    context;
    constructor(message, args = {}) {
        super(message, { cause: args.cause });
        this.context = args.context;
    }
}
export class AutoloadError extends WhatsABIError {
    name = 'AutoloadError';
}
export class LoaderError extends WhatsABIError {
    name = 'LoaderError';
}
export class ProviderError extends WhatsABIError {
    name = 'ProviderError';
}
//# sourceMappingURL=errors.js.map