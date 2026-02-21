import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import ts from "typescript";
import { MetadataFactory } from "../../factories/MetadataFactory";
import { Metadata } from "../../schemas/metadata/Metadata";
import { ITypiaContext } from "../../transformers/ITypiaContext";
export declare namespace LlmApplicationProgrammer {
    const validate: (props: {
        config?: Partial<ILlmSchema.IConfig>;
        metadata: Metadata;
        explore: MetadataFactory.IExplore;
    }) => string[];
    const write: (props: {
        context: ITypiaContext;
        modulo: ts.LeftHandSideExpression;
        metadata: Metadata;
        config?: Partial<ILlmSchema.IConfig & {
            equals: boolean;
        }>;
        name?: string;
    }) => ILlmApplication;
}
