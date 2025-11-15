export declare const frontendRequiredEnvInProd: readonly ["NEXT_PUBLIC_API_URL"];
export type FrontendRequired = (typeof frontendRequiredEnvInProd)[number];
export declare function validateFrontendEnvOnBoot(): void;
