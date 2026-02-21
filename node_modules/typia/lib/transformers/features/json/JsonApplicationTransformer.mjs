import ts from 'typescript';
import { LiteralFactory } from '../../../factories/LiteralFactory.mjs';
import { MetadataCollection } from '../../../factories/MetadataCollection.mjs';
import { MetadataFactory } from '../../../factories/MetadataFactory.mjs';
import { JsonApplicationProgrammer } from '../../../programmers/json/JsonApplicationProgrammer.mjs';
import { TransformerError } from '../../TransformerError.mjs';

var JsonApplicationTransformer;
(function (JsonApplicationTransformer) {
    JsonApplicationTransformer.transform = (props) => {
        // GET GENERIC ARGUMENT
        if (!props.expression.typeArguments?.length)
            throw new TransformerError({
                code: "typia.json.application",
                message: "no generic argument.",
            });
        const top = props.expression.typeArguments[0];
        if (ts.isTypeNode(top) === false)
            return props.expression;
        const version = get_parameter({
            checker: props.context.checker,
            name: "Version",
            is: (str) => str === "3.0" || str === "3.1",
            cast: (str) => str,
            default: () => "3.1",
        })(props.expression.typeArguments[1]);
        // GET TYPE
        const type = props.context.checker.getTypeFromTypeNode(top);
        const collection = new MetadataCollection({
            replace: MetadataCollection.replace,
        });
        const result = MetadataFactory.analyze({
            checker: props.context.checker,
            transformer: props.context.transformer,
            options: {
                escape: true,
                constant: true,
                absorb: false,
                functional: true,
                validate: JsonApplicationProgrammer.validate,
            },
            collection,
            type,
        });
        if (result.success === false)
            throw TransformerError.from({
                code: "typia.json.application",
                errors: result.errors,
            });
        // GENERATE LLM APPLICATION
        const app = JsonApplicationProgrammer.write({
            version,
            metadata: result.data,
        });
        const literal = LiteralFactory.write(app);
        return literal;
    };
    const get_parameter = (props) => (node) => {
        if (!node)
            return props.default();
        // CHECK LITERAL TYPE
        const type = props.checker.getTypeFromTypeNode(node);
        if (!type.isLiteral() &&
            (type.getFlags() & ts.TypeFlags.BooleanLiteral) === 0)
            throw new TransformerError({
                code: "typia.json.application",
                message: `generic argument "${props.name}" must be constant.`,
            });
        // GET VALUE AND VALIDATE IT
        const value = type.isLiteral()
            ? type.value
            : props.checker.typeToString(type);
        if (typeof value !== "string" || props.is(value) === false)
            throw new TransformerError({
                code: "typia.json.application",
                message: `invalid value on generic argument "${props.name}".`,
            });
        return props.cast(value);
    };
})(JsonApplicationTransformer || (JsonApplicationTransformer = {}));

export { JsonApplicationTransformer };
//# sourceMappingURL=JsonApplicationTransformer.mjs.map
