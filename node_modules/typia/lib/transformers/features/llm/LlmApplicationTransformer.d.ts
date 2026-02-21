import ts from "typescript";
import { ITransformProps } from "../../ITransformProps";
import { ITypiaContext } from "../../ITypiaContext";
export declare namespace LlmApplicationTransformer {
    const transform: (props: ITransformProps) => ts.Expression;
    const finalize: (props: {
        context: ITypiaContext;
        value: ts.Expression;
        argument: ts.Expression;
        equals?: boolean;
    }) => ts.CallExpression;
}
