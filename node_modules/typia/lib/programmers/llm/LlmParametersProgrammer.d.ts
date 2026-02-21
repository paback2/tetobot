import { ILlmSchema } from "@samchon/openapi";
import { MetadataFactory } from "../../factories/MetadataFactory";
import { Metadata } from "../../schemas/metadata/Metadata";
export declare namespace LlmParametersProgrammer {
    const write: (props: {
        metadata: Metadata;
        config?: Partial<ILlmSchema.IConfig>;
    }) => ILlmSchema.IParameters;
    const validate: (props: {
        config?: Partial<ILlmSchema.IConfig>;
        metadata: Metadata;
        explore: MetadataFactory.IExplore;
    }) => string[];
}
