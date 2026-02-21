import ts from 'typescript';
import { LiteralFactory } from '../../../factories/LiteralFactory.mjs';
import { MetadataCollection } from '../../../factories/MetadataCollection.mjs';
import { MetadataFactory } from '../../../factories/MetadataFactory.mjs';
import { LlmMetadataFactory } from '../../../programmers/llm/LlmMetadataFactory.mjs';
import { LlmParametersProgrammer } from '../../../programmers/llm/LlmParametersProgrammer.mjs';
import { TransformerError } from '../../TransformerError.mjs';

var LlmParametersTransformer;
(function (LlmParametersTransformer) {
    LlmParametersTransformer.transform = (props) => {
        // GET GENERIC ARGUMENT
        if (!props.expression.typeArguments?.length)
            throw new TransformerError({
                code: "typia.llm.parameters",
                message: "no generic argument.",
            });
        const top = props.expression.typeArguments[0];
        if (ts.isTypeNode(top) === false)
            return props.expression;
        // GET TYPE
        const config = LlmMetadataFactory.getConfig({
            context: props.context,
            method: "parameters",
            node: props.expression.typeArguments[1],
        });
        const type = props.context.checker.getTypeFromTypeNode(top);
        // VALIDATE TYPE
        const analyze = (validate) => {
            const result = MetadataFactory.analyze({
                checker: props.context.checker,
                transformer: props.context.transformer,
                options: {
                    absorb: validate,
                    escape: true,
                    constant: true,
                    validate: validate === true
                        ? (metadata, explore) => LlmParametersProgrammer.validate({
                            config,
                            metadata,
                            explore,
                        })
                        : undefined,
                },
                collection: new MetadataCollection({
                    replace: MetadataCollection.replace,
                }),
                type,
            });
            if (result.success === false)
                throw TransformerError.from({
                    code: "typia.llm.parameters",
                    errors: result.errors,
                });
            return result.data;
        };
        analyze(true);
        // GENERATE LLM SCHEMA
        const out = LlmParametersProgrammer.write({
            metadata: analyze(false),
            config,
        });
        return ts.factory.createAsExpression(LiteralFactory.write(out), props.context.importer.type({
            file: "@samchon/openapi",
            name: ts.factory.createQualifiedName(ts.factory.createIdentifier("ILlmSchema"), ts.factory.createIdentifier("IParameters")),
        }));
    };
})(LlmParametersTransformer || (LlmParametersTransformer = {}));

export { LlmParametersTransformer };
//# sourceMappingURL=LlmParametersTransformer.mjs.map
