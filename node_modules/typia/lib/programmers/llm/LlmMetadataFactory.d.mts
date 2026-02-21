import { ILlmSchema } from "@samchon/openapi";
import ts from "typescript";
import { ITypiaContext } from "../../transformers/ITypiaContext";
export declare namespace LlmMetadataFactory {
    const getConfig: (props: {
        context: ITypiaContext;
        method: string;
        node: ts.TypeNode | undefined;
    }) => Partial<ILlmSchema.IConfig & {
        equals: boolean;
    }> | undefined;
}
