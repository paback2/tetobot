"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmApplicationTransformer = void 0;
const typescript_1 = __importDefault(require("typescript"));
const ExpressionFactory_1 = require("../../../factories/ExpressionFactory");
const LiteralFactory_1 = require("../../../factories/LiteralFactory");
const MetadataCollection_1 = require("../../../factories/MetadataCollection");
const MetadataFactory_1 = require("../../../factories/MetadataFactory");
const StatementFactory_1 = require("../../../factories/StatementFactory");
const LlmApplicationProgrammer_1 = require("../../../programmers/llm/LlmApplicationProgrammer");
const LlmMetadataFactory_1 = require("../../../programmers/llm/LlmMetadataFactory");
const TransformerError_1 = require("../../TransformerError");
var LlmApplicationTransformer;
(function (LlmApplicationTransformer) {
    LlmApplicationTransformer.transform = (props) => {
        var _a, _b;
        const dec = LlmApplicationTransformer.decompose("application", props);
        if (dec === null)
            return props.expression;
        const literal = typescript_1.default.factory.createAsExpression(LiteralFactory_1.LiteralFactory.write(dec.application), props.context.importer.type({
            file: "@samchon/openapi",
            name: "ILlmApplication",
            arguments: [dec.node],
        }));
        if (((_a = props.expression.arguments) === null || _a === void 0 ? void 0 : _a[0]) === undefined)
            return literal;
        return ExpressionFactory_1.ExpressionFactory.selfCall(typescript_1.default.factory.createBlock([
            StatementFactory_1.StatementFactory.constant({
                name: "application",
                value: literal,
            }),
            typescript_1.default.factory.createExpressionStatement(LlmApplicationTransformer.finalize({
                context: props.context,
                value: typescript_1.default.factory.createIdentifier("application"),
                argument: props.expression.arguments[0],
                equals: (_b = dec.config) === null || _b === void 0 ? void 0 : _b.equals,
            })),
            typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createIdentifier("application")),
        ], true));
    };
    /** @internal */
    LlmApplicationTransformer.decompose = (method, props) => {
        var _a;
        // GET GENERIC ARGUMENT
        if (!((_a = props.expression.typeArguments) === null || _a === void 0 ? void 0 : _a.length))
            throw new TransformerError_1.TransformerError({
                code: `typia.llm.${method}`,
                message: "no generic argument.",
            });
        const top = props.expression.typeArguments[0];
        if (typescript_1.default.isTypeNode(top) === false)
            return null;
        // GET TYPE
        const config = LlmMetadataFactory_1.LlmMetadataFactory.getConfig({
            context: props.context,
            method,
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
                    escape: true,
                    constant: true,
                    functional: true,
                    validate: validate === true
                        ? (metadata, explore) => LlmApplicationProgrammer_1.LlmApplicationProgrammer.validate({
                            config,
                            metadata,
                            explore,
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
                    code: `typia.llm.${method}`,
                    errors: result.errors,
                });
            return result.data;
        };
        analyze(true);
        // GENERATE LLM APPLICATION
        return {
            application: LlmApplicationProgrammer_1.LlmApplicationProgrammer.write({
                context: props.context,
                modulo: props.modulo,
                metadata: analyze(false),
                config,
                name: top.getFullText().trim(),
            }),
            node: top,
            type,
            config,
        };
    };
    LlmApplicationTransformer.finalize = (props) => {
        const satisfiesTypeNode = typescript_1.default.factory.createTypeReferenceNode(typescript_1.default.factory.createIdentifier("Partial"), [
            typescript_1.default.factory.createTypeReferenceNode(typescript_1.default.factory.createIdentifier("Pick"), [
                typescript_1.default.factory.createImportTypeNode(typescript_1.default.factory.createLiteralTypeNode(typescript_1.default.factory.createStringLiteral("@samchon/openapi")), undefined, typescript_1.default.factory.createQualifiedName(typescript_1.default.factory.createIdentifier("ILlmApplication"), typescript_1.default.factory.createIdentifier("IConfig")), undefined, false),
                typescript_1.default.factory.createUnionTypeNode([
                    typescript_1.default.factory.createLiteralTypeNode(typescript_1.default.factory.createStringLiteral("separate")),
                    typescript_1.default.factory.createLiteralTypeNode(typescript_1.default.factory.createStringLiteral("validate")),
                ]),
            ]),
        ]);
        return typescript_1.default.factory.createCallExpression(props.context.importer.internal("llmApplicationFinalize"), undefined, [
            props.value,
            typescript_1.default.factory.createObjectLiteralExpression([
                typescript_1.default.factory.createSpreadAssignment(typescript_1.default.factory.createSatisfiesExpression(props.argument, satisfiesTypeNode)),
                typescript_1.default.factory.createPropertyAssignment("equals", props.equals === true
                    ? typescript_1.default.factory.createTrue()
                    : typescript_1.default.factory.createFalse()),
            ], true),
        ]);
    };
})(LlmApplicationTransformer || (exports.LlmApplicationTransformer = LlmApplicationTransformer = {}));
//# sourceMappingURL=LlmApplicationTransformer.js.map