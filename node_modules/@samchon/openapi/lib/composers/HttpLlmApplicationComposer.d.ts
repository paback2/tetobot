import { IHttpLlmApplication } from "../structures/IHttpLlmApplication";
import { IHttpMigrateApplication } from "../structures/IHttpMigrateApplication";
export declare namespace HttpLlmComposer {
    const application: (props: {
        migrate: IHttpMigrateApplication;
        config?: Partial<IHttpLlmApplication.IConfig>;
    }) => IHttpLlmApplication;
    const shorten: (app: IHttpLlmApplication, limit?: number) => void;
}
