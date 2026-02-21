import { ILlmSchema } from "@samchon/openapi";
import { Metadata } from "../../schemas/metadata/Metadata";
export declare namespace LlmSchemaProgrammer {
    interface IOutput {
        schema: ILlmSchema;
        $defs: Record<string, ILlmSchema>;
    }
    const write: (props: {
        metadata: Metadata;
        config?: Partial<ILlmSchema.IConfig>;
    }) => IOutput;
    const validate: (props: {
        config?: Partial<ILlmSchema.IConfig>;
        metadata: Metadata;
    }) => string[];
}
