import { OpenApi } from "../OpenApi";
import { ILlmFunction } from "../structures/ILlmFunction";
import { ILlmSchema } from "../structures/ILlmSchema";
import { IOpenApiSchemaError } from "../structures/IOpenApiSchemaError";
import { IResult } from "../structures/IResult";
export declare namespace LlmSchemaComposer {
    const parameters: (props: {
        config?: Partial<ILlmSchema.IConfig>;
        components: OpenApi.IComponents;
        schema: OpenApi.IJsonSchema.IObject | OpenApi.IJsonSchema.IReference;
        accessor?: string;
        refAccessor?: string;
    }) => IResult<ILlmSchema.IParameters, IOpenApiSchemaError>;
    const schema: (props: {
        config?: Partial<ILlmSchema.IConfig>;
        components: OpenApi.IComponents;
        $defs: Record<string, ILlmSchema>;
        schema: OpenApi.IJsonSchema;
        accessor?: string;
        refAccessor?: string;
    }) => IResult<ILlmSchema, IOpenApiSchemaError>;
    const separate: (props: {
        parameters: ILlmSchema.IParameters;
        predicate: (schema: ILlmSchema) => boolean;
        convention?: (key: string, type: "llm" | "human") => string;
        equals?: boolean;
    }) => ILlmFunction.ISeparated;
    const invert: (props: {
        components: OpenApi.IComponents;
        schema: ILlmSchema;
        $defs: Record<string, ILlmSchema>;
    }) => OpenApi.IJsonSchema;
    const getConfig: (config?: Partial<ILlmSchema.IConfig> | undefined) => ILlmSchema.IConfig;
}
