"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmSchemaComposer = void 0;
const LlmTypeChecker_1 = require("../utils/LlmTypeChecker");
const NamingConvention_1 = require("../utils/NamingConvention");
const OpenApiConstraintShifter_1 = require("../utils/OpenApiConstraintShifter");
const OpenApiTypeChecker_1 = require("../utils/OpenApiTypeChecker");
const OpenApiValidator_1 = require("../utils/OpenApiValidator");
const JsonDescriptionUtil_1 = require("../utils/internal/JsonDescriptionUtil");
const LlmDescriptionInverter_1 = require("./LlmDescriptionInverter");
const LlmParametersComposer_1 = require("./LlmParametersComposer");
var LlmSchemaComposer;
(function (LlmSchemaComposer) {
    /* -----------------------------------------------------------
      CONVERTERS
    ----------------------------------------------------------- */
    LlmSchemaComposer.parameters = (props) => {
        const config = LlmSchemaComposer.getConfig(props.config);
        const entity = LlmParametersComposer_1.LlmParametersFinder.parameters(Object.assign(Object.assign({}, props), { method: "LlmSchemaComposer.parameters" }));
        if (entity.success === false)
            return entity;
        const $defs = {};
        const result = transform(Object.assign(Object.assign({}, props), { config,
            $defs, schema: entity.value }));
        if (result.success === false)
            return result;
        return {
            success: true,
            value: Object.assign(Object.assign({}, result.value), { additionalProperties: false, $defs, description: OpenApiTypeChecker_1.OpenApiTypeChecker.isReference(props.schema)
                    ? JsonDescriptionUtil_1.JsonDescriptionUtil.cascade({
                        prefix: "#/components/schemas/",
                        components: props.components,
                        schema: Object.assign(Object.assign({}, props.schema), { description: result.value.description }),
                        escape: true,
                    })
                    : result.value.description }),
        };
    };
    LlmSchemaComposer.schema = (props) => transform({
        config: LlmSchemaComposer.getConfig(props.config),
        components: props.components,
        $defs: props.$defs,
        schema: props.schema,
        accessor: props.accessor,
        refAccessor: props.refAccessor,
    });
    const transform = (props) => {
        var _a, _b;
        // PREPARE ASSETS
        const union = [];
        const attribute = Object.assign({ title: props.schema.title, description: props.schema.description, deprecated: props.schema.deprecated, readOnly: props.schema.readOnly, writeOnly: props.schema.writeOnly, example: props.schema.example, examples: props.schema.examples }, Object.fromEntries(Object.entries(props.schema).filter(([key, value]) => key.startsWith("x-") && value !== undefined)));
        // VALIDADTE SCHEMA
        const reasons = [];
        OpenApiTypeChecker_1.OpenApiTypeChecker.visit({
            closure: (next, accessor) => {
                var _a;
                if (props.config.strict === true) {
                    // STRICT MODE VALIDATION
                    reasons.push(...validateStrict(next, accessor));
                }
                if (OpenApiTypeChecker_1.OpenApiTypeChecker.isTuple(next))
                    reasons.push({
                        accessor,
                        schema: next,
                        message: `LLM does not allow tuple type.`,
                    });
                else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isReference(next)) {
                    // UNABLE TO FIND MATCHED REFERENCE
                    const key = next.$ref.split("#/components/schemas/")[1];
                    if (((_a = props.components.schemas) === null || _a === void 0 ? void 0 : _a[key]) === undefined)
                        reasons.push({
                            schema: next,
                            accessor: accessor,
                            message: `unable to find reference type ${JSON.stringify(key)}.`,
                        });
                }
            },
            components: props.components,
            schema: props.schema,
            accessor: props.accessor,
            refAccessor: props.refAccessor,
        });
        if (reasons.length > 0)
            return {
                success: false,
                error: {
                    method: "LlmSchemaComposer.schema",
                    message: "Failed to compose LLM schema",
                    reasons,
                },
            };
        const visitConstant = (input) => {
            const insert = (value) => {
                var _a;
                const matched = union.find((u) => (u === null || u === void 0 ? void 0 : u.type) === typeof value);
                if (matched !== undefined) {
                    (_a = matched.enum) !== null && _a !== void 0 ? _a : (matched.enum = []);
                    matched.enum.push(value);
                }
                else
                    union.push({
                        type: typeof value,
                        enum: [value],
                    });
            };
            if (OpenApiTypeChecker_1.OpenApiTypeChecker.isConstant(input))
                insert(input.const);
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isOneOf(input))
                input.oneOf.forEach(visitConstant);
        };
        const visit = (input, accessor) => {
            var _a, _b, _c, _d;
            if (OpenApiTypeChecker_1.OpenApiTypeChecker.isOneOf(input)) {
                // UNION TYPE
                input.oneOf.forEach((s, i) => visit(s, `${accessor}.oneOf[${i}]`));
            }
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isReference(input)) {
                // REFERENCE TYPE
                const key = input.$ref.split("#/components/schemas/")[1];
                const target = (_a = props.components.schemas) === null || _a === void 0 ? void 0 : _a[key];
                if (target === undefined)
                    return;
                else if (
                // KEEP THE REFERENCE TYPE
                props.config.reference === true ||
                    OpenApiTypeChecker_1.OpenApiTypeChecker.isRecursiveReference({
                        components: props.components,
                        schema: input,
                    })) {
                    const out = () => {
                        union.push(Object.assign(Object.assign({}, input), { $ref: `#/$defs/${key}` }));
                    };
                    if (props.$defs[key] !== undefined)
                        return out();
                    props.$defs[key] = {};
                    const converted = transform({
                        config: props.config,
                        components: props.components,
                        $defs: props.$defs,
                        schema: target,
                        refAccessor: props.refAccessor,
                        accessor: `${(_b = props.refAccessor) !== null && _b !== void 0 ? _b : "$def"}[${JSON.stringify(key)}]`,
                    });
                    if (converted.success === false)
                        return; // UNREACHABLE
                    props.$defs[key] = converted.value;
                    return out();
                }
                else {
                    // DISCARD THE REFERENCE TYPE
                    const length = union.length;
                    visit(target, accessor);
                    visitConstant(target);
                    if (length === union.length - 1)
                        union[union.length - 1] = Object.assign(Object.assign({}, union[union.length - 1]), { description: JsonDescriptionUtil_1.JsonDescriptionUtil.cascade({
                                prefix: "#/components/schemas/",
                                components: props.components,
                                schema: input,
                                escape: true,
                            }) });
                    else
                        attribute.description = JsonDescriptionUtil_1.JsonDescriptionUtil.cascade({
                            prefix: "#/components/schemas/",
                            components: props.components,
                            schema: input,
                            escape: true,
                        });
                }
            }
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isObject(input)) {
                // OBJECT TYPE
                const properties = Object.fromEntries(Object.entries((_c = input.properties) !== null && _c !== void 0 ? _c : {})
                    .map(([key, value]) => {
                    var _a;
                    const converted = transform({
                        config: props.config,
                        components: props.components,
                        $defs: props.$defs,
                        schema: value,
                        refAccessor: props.refAccessor,
                        accessor: `${(_a = props.accessor) !== null && _a !== void 0 ? _a : "$input.schema"}.properties[${JSON.stringify(key)}]`,
                    });
                    if (converted.success === false) {
                        reasons.push(...converted.error.reasons);
                        return [key, null];
                    }
                    return [key, converted.value];
                })
                    .filter(([, value]) => value !== null));
                if (Object.values(properties).some((v) => v === null))
                    return;
                const additionalProperties = (() => {
                    if (typeof input.additionalProperties === "object" &&
                        input.additionalProperties !== null) {
                        const converted = transform({
                            config: props.config,
                            components: props.components,
                            $defs: props.$defs,
                            schema: input.additionalProperties,
                            refAccessor: props.refAccessor,
                            accessor: `${accessor}.additionalProperties`,
                        });
                        if (converted.success === false) {
                            reasons.push(...converted.error.reasons);
                            return null;
                        }
                        return converted.value;
                    }
                    return props.config.strict === true
                        ? false
                        : input.additionalProperties;
                })();
                if (additionalProperties === null)
                    return;
                union.push(Object.assign(Object.assign({}, input), { properties,
                    additionalProperties, required: (_d = input.required) !== null && _d !== void 0 ? _d : [], description: props.config.strict === true
                        ? JsonDescriptionUtil_1.JsonDescriptionUtil.take(input)
                        : input.description }));
            }
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isArray(input)) {
                // ARRAY TYPE
                const items = transform({
                    config: props.config,
                    components: props.components,
                    $defs: props.$defs,
                    schema: input.items,
                    refAccessor: props.refAccessor,
                    accessor: `${accessor}.items`,
                });
                if (items.success === false) {
                    reasons.push(...items.error.reasons);
                    return;
                }
                union.push(props.config.strict === true
                    ? OpenApiConstraintShifter_1.OpenApiConstraintShifter.shiftArray(Object.assign(Object.assign({}, input), { items: items.value }))
                    : Object.assign(Object.assign({}, input), { items: items.value }));
            }
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isString(input))
                union.push(props.config.strict === true
                    ? OpenApiConstraintShifter_1.OpenApiConstraintShifter.shiftString(Object.assign({}, input))
                    : input);
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isNumber(input) ||
                OpenApiTypeChecker_1.OpenApiTypeChecker.isInteger(input))
                union.push(props.config.strict === true
                    ? OpenApiConstraintShifter_1.OpenApiConstraintShifter.shiftNumeric(Object.assign({}, input))
                    : input);
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isTuple(input))
                return; // UNREACHABLE
            else if (OpenApiTypeChecker_1.OpenApiTypeChecker.isConstant(input) === false)
                union.push(Object.assign({}, input));
        };
        visitConstant(props.schema);
        visit(props.schema, (_a = props.accessor) !== null && _a !== void 0 ? _a : "$input.schema");
        if (reasons.length > 0)
            return {
                success: false,
                error: {
                    method: "LlmSchemaComposer.schema",
                    message: "Failed to compose LLM schema",
                    reasons,
                },
            };
        else if (union.length === 0)
            return {
                // unknown type
                success: true,
                value: Object.assign(Object.assign({}, attribute), { type: undefined }),
            };
        else if (union.length === 1)
            return {
                // single type
                success: true,
                value: Object.assign(Object.assign(Object.assign({}, attribute), union[0]), { description: props.config.strict === true && LlmTypeChecker_1.LlmTypeChecker.isReference(union[0])
                        ? undefined
                        : ((_b = union[0].description) !== null && _b !== void 0 ? _b : attribute.description) }),
            };
        return {
            success: true,
            value: Object.assign(Object.assign({}, attribute), { anyOf: union.map((u) => (Object.assign(Object.assign({}, u), { description: props.config.strict === true && LlmTypeChecker_1.LlmTypeChecker.isReference(u)
                        ? undefined
                        : u.description }))), "x-discriminator": OpenApiTypeChecker_1.OpenApiTypeChecker.isOneOf(props.schema) &&
                    props.schema.discriminator !== undefined &&
                    props.schema.oneOf.length === union.length &&
                    union.every((e) => LlmTypeChecker_1.LlmTypeChecker.isReference(e) || LlmTypeChecker_1.LlmTypeChecker.isNull(e))
                    ? {
                        propertyName: props.schema.discriminator.propertyName,
                        mapping: props.schema.discriminator.mapping !== undefined
                            ? Object.fromEntries(Object.entries(props.schema.discriminator.mapping).map(([key, value]) => [
                                key,
                                `#/$defs/${value.split("/").at(-1)}`,
                            ]))
                            : undefined,
                    }
                    : undefined }),
        };
    };
    /* -----------------------------------------------------------
      SEPARATORS
    ----------------------------------------------------------- */
    LlmSchemaComposer.separate = (props) => {
        var _a, _b;
        const convention = (_a = props.convention) !== null && _a !== void 0 ? _a : ((key, type) => `${key}.${NamingConvention_1.NamingConvention.capitalize(type)}`);
        const [llm, human] = separateObject({
            predicate: props.predicate,
            convention,
            $defs: props.parameters.$defs,
            schema: props.parameters,
        });
        if (llm === null || human === null)
            return {
                llm: (_b = llm) !== null && _b !== void 0 ? _b : {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                    $defs: {},
                },
                human: human,
            };
        const output = {
            llm: Object.assign(Object.assign({}, llm), { $defs: Object.fromEntries(Object.entries(props.parameters.$defs).filter(([key]) => key.endsWith(".Llm"))), additionalProperties: false }),
            human: Object.assign(Object.assign({}, human), { $defs: Object.fromEntries(Object.entries(props.parameters.$defs).filter(([key]) => key.endsWith(".Human"))), additionalProperties: false }),
        };
        for (const key of Object.keys(props.parameters.$defs))
            if (key.endsWith(".Llm") === false && key.endsWith(".Human") === false)
                delete props.parameters.$defs[key];
        if (Object.keys(output.llm.properties).length !== 0) {
            const components = {};
            output.validate = OpenApiValidator_1.OpenApiValidator.create({
                components,
                schema: LlmSchemaComposer.invert({
                    components,
                    schema: output.llm,
                    $defs: output.llm.$defs,
                }),
                required: true,
                equals: props.equals,
            });
        }
        return output;
    };
    const separateStation = (props) => {
        if (props.predicate(props.schema) === true)
            return [null, props.schema];
        else if (LlmTypeChecker_1.LlmTypeChecker.isUnknown(props.schema) ||
            LlmTypeChecker_1.LlmTypeChecker.isAnyOf(props.schema))
            return [props.schema, null];
        else if (LlmTypeChecker_1.LlmTypeChecker.isObject(props.schema))
            return separateObject({
                predicate: props.predicate,
                convention: props.convention,
                $defs: props.$defs,
                schema: props.schema,
            });
        else if (LlmTypeChecker_1.LlmTypeChecker.isArray(props.schema))
            return separateArray({
                predicate: props.predicate,
                convention: props.convention,
                $defs: props.$defs,
                schema: props.schema,
            });
        else if (LlmTypeChecker_1.LlmTypeChecker.isReference(props.schema))
            return separateReference({
                predicate: props.predicate,
                convention: props.convention,
                $defs: props.$defs,
                schema: props.schema,
            });
        return [props.schema, null];
    };
    const separateArray = (props) => {
        const [x, y] = separateStation({
            predicate: props.predicate,
            convention: props.convention,
            $defs: props.$defs,
            schema: props.schema.items,
        });
        return [
            x !== null
                ? Object.assign(Object.assign({}, props.schema), { items: x }) : null,
            y !== null
                ? Object.assign(Object.assign({}, props.schema), { items: y }) : null,
        ];
    };
    const separateObject = (props) => {
        var _a, _b;
        // EMPTY OBJECT
        if (Object.keys((_a = props.schema.properties) !== null && _a !== void 0 ? _a : {}).length === 0 &&
            !!props.schema.additionalProperties === false)
            return [props.schema, null];
        const llm = Object.assign(Object.assign({}, props.schema), { properties: {}, additionalProperties: props.schema.additionalProperties });
        const human = Object.assign(Object.assign({}, props.schema), { properties: {} });
        for (const [key, value] of Object.entries((_b = props.schema.properties) !== null && _b !== void 0 ? _b : {})) {
            const [x, y] = separateStation({
                predicate: props.predicate,
                convention: props.convention,
                $defs: props.$defs,
                schema: value,
            });
            if (x !== null)
                llm.properties[key] = x;
            if (y !== null)
                human.properties[key] = y;
        }
        if (typeof props.schema.additionalProperties === "object" &&
            props.schema.additionalProperties !== null) {
            const [dx, dy] = separateStation({
                predicate: props.predicate,
                convention: props.convention,
                $defs: props.$defs,
                schema: props.schema.additionalProperties,
            });
            llm.additionalProperties = dx !== null && dx !== void 0 ? dx : false;
            human.additionalProperties = dy !== null && dy !== void 0 ? dy : false;
        }
        return [
            !!Object.keys(llm.properties).length || !!llm.additionalProperties
                ? shrinkRequired(llm)
                : null,
            !!Object.keys(human.properties).length || human.additionalProperties
                ? shrinkRequired(human)
                : null,
        ];
    };
    const separateReference = (props) => {
        var _a, _b, _c, _d, _e;
        const key = props.schema.$ref.split("#/$defs/")[1];
        const humanKey = props.convention(key, "human");
        const llmKey = props.convention(key, "llm");
        // FIND EXISTING
        if (((_a = props.$defs) === null || _a === void 0 ? void 0 : _a[humanKey]) || ((_b = props.$defs) === null || _b === void 0 ? void 0 : _b[llmKey]))
            return [
                ((_c = props.$defs) === null || _c === void 0 ? void 0 : _c[llmKey])
                    ? Object.assign(Object.assign({}, props.schema), { $ref: `#/$defs/${llmKey}` }) : null,
                ((_d = props.$defs) === null || _d === void 0 ? void 0 : _d[humanKey])
                    ? Object.assign(Object.assign({}, props.schema), { $ref: `#/$defs/${humanKey}` }) : null,
            ];
        // PRE-ASSIGNMENT
        props.$defs[llmKey] = {};
        props.$defs[humanKey] = {};
        // DO COMPOSE
        const schema = (_e = props.$defs) === null || _e === void 0 ? void 0 : _e[key];
        const [llm, human] = separateStation({
            predicate: props.predicate,
            convention: props.convention,
            $defs: props.$defs,
            schema,
        });
        if (llm !== null)
            Object.assign(props.$defs[llmKey], llm);
        if (human !== null)
            Object.assign(props.$defs[humanKey], human);
        // ONLY ONE
        if (llm === null || human === null) {
            delete props.$defs[llmKey];
            delete props.$defs[humanKey];
            return llm === null ? [null, props.schema] : [props.schema, null];
        }
        // BOTH OF THEM
        return [
            llm !== null
                ? Object.assign(Object.assign({}, props.schema), { $ref: `#/$defs/${llmKey}` }) : null,
            human !== null
                ? Object.assign(Object.assign({}, props.schema), { $ref: `#/$defs/${humanKey}` }) : null,
        ];
    };
    const shrinkRequired = (s) => {
        s.required = s.required.filter((key) => { var _a; return ((_a = s.properties) === null || _a === void 0 ? void 0 : _a[key]) !== undefined; });
        return s;
    };
    /* -----------------------------------------------------------
      INVERTERS
    ----------------------------------------------------------- */
    LlmSchemaComposer.invert = (props) => {
        const union = [];
        const attribute = Object.assign({ title: props.schema.title, description: props.schema.description, deprecated: props.schema.deprecated, readOnly: props.schema.readOnly, writeOnly: props.schema.writeOnly, example: props.schema.example, examples: props.schema.examples }, Object.fromEntries(Object.entries(props.schema).filter(([key, value]) => key.startsWith("x-") && value !== undefined)));
        const next = (schema) => LlmSchemaComposer.invert({
            components: props.components,
            $defs: props.$defs,
            schema,
        });
        const visit = (schema) => {
            var _a, _b, _c, _d, _e, _f;
            var _g;
            if (LlmTypeChecker_1.LlmTypeChecker.isArray(schema))
                union.push(Object.assign(Object.assign(Object.assign({}, schema), LlmDescriptionInverter_1.LlmDescriptionInverter.array(schema.description)), { items: next(schema.items) }));
            else if (LlmTypeChecker_1.LlmTypeChecker.isObject(schema))
                union.push(Object.assign(Object.assign({}, schema), { properties: Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [
                        key,
                        next(value),
                    ])), additionalProperties: typeof schema.additionalProperties === "object" &&
                        schema.additionalProperties !== null
                        ? next(schema.additionalProperties)
                        : schema.additionalProperties }));
            else if (LlmTypeChecker_1.LlmTypeChecker.isAnyOf(schema))
                schema.anyOf.forEach(visit);
            else if (LlmTypeChecker_1.LlmTypeChecker.isReference(schema)) {
                const key = schema.$ref.split("#/$defs/")[1];
                if (((_a = props.components.schemas) === null || _a === void 0 ? void 0 : _a[key]) === undefined) {
                    (_b = (_g = props.components).schemas) !== null && _b !== void 0 ? _b : (_g.schemas = {});
                    props.components.schemas[key] = {};
                    props.components.schemas[key] = next((_c = props.$defs[key]) !== null && _c !== void 0 ? _c : {});
                }
                union.push(Object.assign(Object.assign({}, schema), { $ref: `#/components/schemas/${key}` }));
            }
            else if (LlmTypeChecker_1.LlmTypeChecker.isBoolean(schema))
                if (!!((_d = schema.enum) === null || _d === void 0 ? void 0 : _d.length))
                    schema.enum.forEach((v) => union.push({
                        const: v,
                    }));
                else
                    union.push(schema);
            else if (LlmTypeChecker_1.LlmTypeChecker.isInteger(schema) ||
                LlmTypeChecker_1.LlmTypeChecker.isNumber(schema))
                if (!!((_e = schema.enum) === null || _e === void 0 ? void 0 : _e.length))
                    schema.enum.forEach((v) => union.push({
                        const: v,
                    }));
                else
                    union.push(Object.assign(Object.assign(Object.assign({}, schema), LlmDescriptionInverter_1.LlmDescriptionInverter.numeric(schema.description)), { enum: undefined }));
            else if (LlmTypeChecker_1.LlmTypeChecker.isString(schema))
                if (!!((_f = schema.enum) === null || _f === void 0 ? void 0 : _f.length))
                    schema.enum.forEach((v) => union.push({
                        const: v,
                    }));
                else
                    union.push(Object.assign(Object.assign(Object.assign({}, schema), LlmDescriptionInverter_1.LlmDescriptionInverter.string(schema.description)), { enum: undefined }));
            else
                union.push(Object.assign({}, schema));
        };
        visit(props.schema);
        return Object.assign(Object.assign({}, attribute), (union.length === 0
            ? { type: undefined }
            : union.length === 1
                ? Object.assign({}, union[0]) : {
                oneOf: union.map((u) => (Object.assign(Object.assign({}, u), { nullable: undefined }))),
                discriminator: LlmTypeChecker_1.LlmTypeChecker.isAnyOf(props.schema) &&
                    props.schema["x-discriminator"] !== undefined
                    ? {
                        propertyName: props.schema["x-discriminator"].propertyName,
                        mapping: props.schema["x-discriminator"].mapping !== undefined
                            ? Object.fromEntries(Object.entries(props.schema["x-discriminator"].mapping).map(([key, value]) => [
                                key,
                                `#/components/schemas/${value.split("/").at(-1)}`,
                            ]))
                            : undefined,
                    }
                    : undefined,
            }));
    };
    LlmSchemaComposer.getConfig = (config) => {
        var _a, _b;
        return ({
            reference: (_a = config === null || config === void 0 ? void 0 : config.reference) !== null && _a !== void 0 ? _a : true,
            strict: (_b = config === null || config === void 0 ? void 0 : config.strict) !== null && _b !== void 0 ? _b : false,
        });
    };
})(LlmSchemaComposer || (exports.LlmSchemaComposer = LlmSchemaComposer = {}));
const validateStrict = (schema, accessor) => {
    var _a, _b;
    const reasons = [];
    if (OpenApiTypeChecker_1.OpenApiTypeChecker.isObject(schema)) {
        if (!!schema.additionalProperties)
            reasons.push({
                schema: schema,
                accessor: `${accessor}.additionalProperties`,
                message: "LLM does not allow additionalProperties in strict mode, the dynamic key typed object.",
            });
        for (const key of Object.keys((_a = schema.properties) !== null && _a !== void 0 ? _a : {}))
            if (((_b = schema.required) === null || _b === void 0 ? void 0 : _b.includes(key)) === false)
                reasons.push({
                    schema: schema,
                    accessor: `${accessor}.properties.${key}`,
                    message: "LLM does not allow optional properties in strict mode.",
                });
    }
    return reasons;
};
