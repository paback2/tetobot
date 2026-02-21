"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmSchemaTransformer = void 0;
const typescript_1 = __importDefault(require("typescript"));
const IdentifierFactory_1 = require("../../../factories/IdentifierFactory");
const LiteralFactory_1 = require("../../../factories/LiteralFactory");
const MetadataCollection_1 = require("../../../factories/MetadataCollection");
const MetadataFactory_1 = require("../../../factories/MetadataFactory");
const LlmMetadataFactory_1 = require("../../../programmers/llm/LlmMetadataFactory");
const LlmSchemaProgrammer_1 = require("../../../programmers/llm/LlmSchemaProgrammer");
const TransformerError_1 = require("../../TransformerError");
var LlmSchemaTransformer;
(function (LlmSchemaTransformer) {
    LlmSchemaTransformer.transform = (props) => {
        var _a, _b;
        // GET GENERIC ARGUMENT
        if (!((_a = props.expression.typeArguments) === null || _a === void 0 ? void 0 : _a.length))
            throw new TransformerError_1.TransformerError({
                code: "typia.llm.schema",
                message: "no generic argument.",
            });
        const top = props.expression.typeArguments[0];
        if (typescript_1.default.isTypeNode(top) === false)
            return props.expression;
        // GET TYPE
        const config = LlmMetadataFactory_1.LlmMetadataFactory.getConfig({
            context: props.context,
            method: "schema",
            node: props.expression.typeArguments[1],
        });
        const type = props.context.checker.getTypeFromTypeNode(top);
        // VALIDATE TYPE
        const analyze = (validate) => {
            const result = MetadataFactory_1.MetadataFactory.analyze({
                checker: props.context.checker,
                transformer: props.context.transformer,
                options: {
                    absorb: validate,
                    constant: true,
                    escape: true,
                    validate: validate === true
                        ? (metadata) => LlmSchemaProgrammer_1.LlmSchemaProgrammer.validate({
                            config,
                            metadata,
                        })
                        : undefined,
                },
                collection: new MetadataCollection_1.MetadataCollection({
                    replace: MetadataCollection_1.MetadataCollection.replace,
                }),
                type,
            });
            if (result.success === false)
                throw TransformerError_1.TransformerError.from({
                    code: "typia.llm.schema",
                    errors: result.errors,
                });
            return result.data;
        };
        analyze(true);
        // GENERATE LLM SCHEMA
        const out = LlmSchemaProgrammer_1.LlmSchemaProgrammer.write({
            metadata: analyze(false),
            config,
        });
        const schemaTypeNode = props.context.importer.type({
            file: "@samchon/openapi",
            name: "ILlmSchema",
        });
        const literal = typescript_1.default.factory.createAsExpression(LiteralFactory_1.LiteralFactory.write(out.schema), schemaTypeNode);
        if (Object.keys(out.$defs).length === 0)
            return literal;
        return typescript_1.default.factory.createCallExpression(typescript_1.default.factory.createArrowFunction(undefined, undefined, [
            IdentifierFactory_1.IdentifierFactory.parameter("$defs", typescript_1.default.factory.createTypeReferenceNode("Record", [
                typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword),
                schemaTypeNode,
            ]), undefined),
        ], undefined, undefined, typescript_1.default.factory.createBlock([
            typescript_1.default.factory.createExpressionStatement(typescript_1.default.factory.createCallExpression(typescript_1.default.factory.createIdentifier("Object.assign"), undefined, [
                typescript_1.default.factory.createIdentifier("$defs"),
                typescript_1.default.factory.createAsExpression(LiteralFactory_1.LiteralFactory.write(out.$defs), typescript_1.default.factory.createTypeReferenceNode("Record", [
                    typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword),
                    schemaTypeNode,
                ])),
            ])),
            typescript_1.default.factory.createReturnStatement(literal),
        ], true)), undefined, ((_b = props.expression.arguments) === null || _b === void 0 ? void 0 : _b[0]) !== undefined
            ? [props.expression.arguments[0]]
            : []);
    };
})(LlmSchemaTransformer || (exports.LlmSchemaTransformer = LlmSchemaTransformer = {}));
//# sourceMappingURL=LlmSchemaTransformer.js.map