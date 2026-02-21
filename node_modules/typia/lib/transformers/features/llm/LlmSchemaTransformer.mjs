import ts from 'typescript';
import { IdentifierFactory } from '../../../factories/IdentifierFactory.mjs';
import { LiteralFactory } from '../../../factories/LiteralFactory.mjs';
import { MetadataCollection } from '../../../factories/MetadataCollection.mjs';
import { MetadataFactory } from '../../../factories/MetadataFactory.mjs';
import { LlmMetadataFactory } from '../../../programmers/llm/LlmMetadataFactory.mjs';
import { LlmSchemaProgrammer } from '../../../programmers/llm/LlmSchemaProgrammer.mjs';
import { TransformerError } from '../../TransformerError.mjs';

var LlmSchemaTransformer;
(function (LlmSchemaTransformer) {
    LlmSchemaTransformer.transform = (props) => {
        // GET GENERIC ARGUMENT
        if (!props.expression.typeArguments?.length)
            throw new TransformerError({
                code: "typia.llm.schema",
                message: "no generic argument.",
            });
        const top = props.expression.typeArguments[0];
        if (ts.isTypeNode(top) === false)
            return props.expression;
        // GET TYPE
        const config = LlmMetadataFactory.getConfig({
            context: props.context,
            method: "schema",
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
                    constant: true,
                    escape: true,
                    validate: validate === true
                        ? (metadata) => LlmSchemaProgrammer.validate({
                            config,
                            metadata,
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
                    code: "typia.llm.schema",
                    errors: result.errors,
                });
            return result.data;
        };
        analyze(true);
        // GENERATE LLM SCHEMA
        const out = LlmSchemaProgrammer.write({
            metadata: analyze(false),
            config,
        });
        const schemaTypeNode = props.context.importer.type({
            file: "@samchon/openapi",
            name: "ILlmSchema",
        });
        const literal = ts.factory.createAsExpression(LiteralFactory.write(out.schema), schemaTypeNode);
        if (Object.keys(out.$defs).length === 0)
            return literal;
        return ts.factory.createCallExpression(ts.factory.createArrowFunction(undefined, undefined, [
            IdentifierFactory.parameter("$defs", ts.factory.createTypeReferenceNode("Record", [
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                schemaTypeNode,
            ]), undefined),
        ], undefined, undefined, ts.factory.createBlock([
            ts.factory.createExpressionStatement(ts.factory.createCallExpression(ts.factory.createIdentifier("Object.assign"), undefined, [
                ts.factory.createIdentifier("$defs"),
                ts.factory.createAsExpression(LiteralFactory.write(out.$defs), ts.factory.createTypeReferenceNode("Record", [
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                    schemaTypeNode,
                ])),
            ])),
            ts.factory.createReturnStatement(literal),
        ], true)), undefined, props.expression.arguments?.[0] !== undefined
            ? [props.expression.arguments[0]]
            : []);
    };
})(LlmSchemaTransformer || (LlmSchemaTransformer = {}));

export { LlmSchemaTransformer };
//# sourceMappingURL=LlmSchemaTransformer.mjs.map
