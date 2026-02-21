import { ILlmApplication } from "@samchon/openapi";
export declare const _llmApplicationFinalize: (app: ILlmApplication, config?: Partial<Pick<ILlmApplication.IConfig, "separate" | "validate"> & {
    equals?: boolean;
}>) => void;
