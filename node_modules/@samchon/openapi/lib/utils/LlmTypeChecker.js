"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmTypeChecker = void 0;
const MapUtil_1 = require("./MapUtil");
const OpenApiTypeCheckerBase_1 = require("./internal/OpenApiTypeCheckerBase");
/**
 * Type checker for LLM function calling schema.
 *
 * `LlmTypeChecker` is a type checker of {@link ILlmSchema}, the type schema for
 * LLM (Large Language Model) function calling.
 *
 * This checker provides type guard functions for validating schema types, and
 * operators for traversing and comparing schemas.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
var LlmTypeChecker;
(function (LlmTypeChecker) {
    /* -----------------------------------------------------------
      TYPE CHECKERS
    ----------------------------------------------------------- */
    /**
     * Test whether the schema is a null type.
     *
     * @param schema Target schema
     * @returns Whether null type or not
     */
    LlmTypeChecker.isNull = (schema) => schema.type === "null";
    /**
     * Test whether the schema is an unknown type.
     *
     * @param schema Target schema
     * @returns Whether unknown type or not
     */
    LlmTypeChecker.isUnknown = (schema) => schema.type === undefined &&
        !LlmTypeChecker.isAnyOf(schema) &&
        !LlmTypeChecker.isReference(schema);
    /**
     * Test whether the schema is a boolean type.
     *
     * @param schema Target schema
     * @returns Whether boolean type or not
     */
    LlmTypeChecker.isBoolean = (schema) => schema.type === "boolean";
    /**
     * Test whether the schema is an integer type.
     *
     * @param schema Target schema
     * @returns Whether integer type or not
     */
    LlmTypeChecker.isInteger = (schema) => schema.type === "integer";
    /**
     * Test whether the schema is a number type.
     *
     * @param schema Target schema
     * @returns Whether number type or not
     */
    LlmTypeChecker.isNumber = (schema) => schema.type === "number";
    /**
     * Test whether the schema is a string type.
     *
     * @param schema Target schema
     * @returns Whether string type or not
     */
    LlmTypeChecker.isString = (schema) => schema.type === "string";
    /**
     * Test whether the schema is an array type.
     *
     * @param schema Target schema
     * @returns Whether array type or not
     */
    LlmTypeChecker.isArray = (schema) => schema.type === "array" &&
        schema.items !== undefined;
    /**
     * Test whether the schema is an object type.
     *
     * @param schema Target schema
     * @returns Whether object type or not
     */
    LlmTypeChecker.isObject = (schema) => schema.type === "object";
    /**
     * Test whether the schema is a reference type.
     *
     * @param schema Target schema
     * @returns Whether reference type or not
     */
    LlmTypeChecker.isReference = (schema) => schema.$ref !== undefined;
    /**
     * Test whether the schema is a union type.
     *
     * @param schema Target schema
     * @returns Whether union type or not
     */
    LlmTypeChecker.isAnyOf = (schema) => schema.anyOf !== undefined;
    /* -----------------------------------------------------------
      OPERATORS
    ----------------------------------------------------------- */
    /**
     * Visit every nested schemas.
     *
     * Visit every nested schemas of the target, and apply the `props.closure`
     * function.
     *
     * Here is the list of occurring nested visitings:
     *
     * - {@link ILlmSchema.IAnyOf.anyOf}
     * - {@link ILlmSchema.IReference}
     * - {@link ILlmSchema.IObject.properties}
     * - {@link ILlmSchema.IArray.items}
     *
     * @param props Properties for visiting
     */
    LlmTypeChecker.visit = (props) => {
        var _a, _b;
        const already = new Set();
        const refAccessor = (_a = props.refAccessor) !== null && _a !== void 0 ? _a : "$input.$defs";
        const next = (schema, accessor) => {
            var _a;
            props.closure(schema, accessor);
            if (LlmTypeChecker.isReference(schema)) {
                const key = schema.$ref.split("#/$defs/").pop();
                if (already.has(key) === true)
                    return;
                already.add(key);
                const found = (_a = props.$defs) === null || _a === void 0 ? void 0 : _a[key];
                if (found !== undefined)
                    next(found, `${refAccessor}[${key}]`);
            }
            else if (LlmTypeChecker.isAnyOf(schema))
                schema.anyOf.forEach((s, i) => next(s, `${accessor}.anyOf[${i}]`));
            else if (LlmTypeChecker.isObject(schema)) {
                for (const [key, value] of Object.entries(schema.properties))
                    next(value, `${accessor}.properties[${JSON.stringify(key)}]`);
                if (typeof schema.additionalProperties === "object" &&
                    schema.additionalProperties !== null)
                    next(schema.additionalProperties, `${accessor}.additionalProperties`);
            }
            else if (LlmTypeChecker.isArray(schema))
                next(schema.items, `${accessor}.items`);
        };
        next(props.schema, (_b = props.accessor) !== null && _b !== void 0 ? _b : "$input.schemas");
    };
    /**
     * Test whether the `x` schema covers the `y` schema.
     *
     * @param props Properties for testing
     * @returns Whether the `x` schema covers the `y` schema
     */
    LlmTypeChecker.covers = (props) => coverStation({
        $defs: props.$defs,
        x: props.x,
        y: props.y,
        visited: new Map(),
    });
    const coverStation = (p) => {
        var _a;
        const cache = (_a = p.visited.get(p.x)) === null || _a === void 0 ? void 0 : _a.get(p.y);
        if (cache !== undefined)
            return cache;
        // FOR RECURSIVE CASE
        const nested = MapUtil_1.MapUtil.take(p.visited)(p.x)(() => new Map());
        nested.set(p.y, true);
        // COMPUTE IT
        const result = coverSchema(p);
        nested.set(p.y, result);
        return result;
    };
    const coverSchema = (p) => {
        // CHECK EQUALITY
        if (p.x === p.y)
            return true;
        else if (LlmTypeChecker.isReference(p.x) && LlmTypeChecker.isReference(p.y) && p.x.$ref === p.y.$ref)
            return true;
        // COMPARE WITH FLATTENING
        const alpha = flatSchema(p.$defs, p.x);
        const beta = flatSchema(p.$defs, p.y);
        if (alpha.some((x) => LlmTypeChecker.isUnknown(x)))
            return true;
        else if (beta.some((x) => LlmTypeChecker.isUnknown(x)))
            return false;
        return beta.every((b) => alpha.some((a) => coverEscapedSchema({
            $defs: p.$defs,
            visited: p.visited,
            x: a,
            y: b,
        })));
    };
    const coverEscapedSchema = (p) => {
        // CHECK EQUALITY
        if (p.x === p.y)
            return true;
        else if (LlmTypeChecker.isUnknown(p.x))
            return true;
        else if (LlmTypeChecker.isUnknown(p.y))
            return false;
        else if (LlmTypeChecker.isNull(p.x))
            return LlmTypeChecker.isNull(p.y);
        // ATOMIC CASE
        else if (LlmTypeChecker.isBoolean(p.x))
            return LlmTypeChecker.isBoolean(p.y) && coverBoolean(p.x, p.y);
        else if (LlmTypeChecker.isInteger(p.x))
            return LlmTypeChecker.isInteger(p.y) && coverInteger(p.x, p.y);
        else if (LlmTypeChecker.isNumber(p.x))
            return LlmTypeChecker.isNumber(p.y) && coverNumber(p.x, p.y);
        else if (LlmTypeChecker.isString(p.x))
            return LlmTypeChecker.isString(p.y) && coverString(p.x, p.y);
        // INSTANCE CASE
        else if (LlmTypeChecker.isArray(p.x))
            return (LlmTypeChecker.isArray(p.y) &&
                coverArray({
                    $defs: p.$defs,
                    visited: p.visited,
                    x: p.x,
                    y: p.y,
                }));
        else if (LlmTypeChecker.isObject(p.x))
            return (LlmTypeChecker.isObject(p.y) &&
                coverObject({
                    $defs: p.$defs,
                    visited: p.visited,
                    x: p.x,
                    y: p.y,
                }));
        else if (LlmTypeChecker.isReference(p.x))
            return LlmTypeChecker.isReference(p.y) && p.x.$ref === p.y.$ref;
        return false;
    };
    const coverArray = (p) => {
        if (!(p.x.minItems === undefined ||
            (p.y.minItems !== undefined && p.x.minItems <= p.y.minItems)))
            return false;
        else if (!(p.x.maxItems === undefined ||
            (p.y.maxItems !== undefined && p.x.maxItems >= p.y.maxItems)))
            return false;
        return coverStation({
            $defs: p.$defs,
            visited: p.visited,
            x: p.x.items,
            y: p.y.items,
        });
    };
    const coverObject = (p) => {
        var _a;
        if (!p.x.additionalProperties && !!p.y.additionalProperties)
            return false;
        else if (!!p.x.additionalProperties &&
            !!p.y.additionalProperties &&
            ((typeof p.x.additionalProperties === "object" &&
                p.y.additionalProperties === true) ||
                (typeof p.x.additionalProperties === "object" &&
                    typeof p.y.additionalProperties === "object" &&
                    !coverStation({
                        $defs: p.$defs,
                        visited: p.visited,
                        x: p.x.additionalProperties,
                        y: p.y.additionalProperties,
                    }))))
            return false;
        return Object.entries((_a = p.y.properties) !== null && _a !== void 0 ? _a : {}).every(([key, b]) => {
            var _a, _b, _c, _d, _e;
            const a = (_a = p.x.properties) === null || _a === void 0 ? void 0 : _a[key];
            if (a === undefined)
                return false;
            else if (((_c = (_b = p.x.required) === null || _b === void 0 ? void 0 : _b.includes(key)) !== null && _c !== void 0 ? _c : false) === true &&
                ((_e = (_d = p.y.required) === null || _d === void 0 ? void 0 : _d.includes(key)) !== null && _e !== void 0 ? _e : false) === false)
                return false;
            return coverStation({
                $defs: p.$defs,
                visited: p.visited,
                x: a,
                y: b,
            });
        });
    };
    const coverBoolean = (x, y) => {
        var _a, _b;
        if (!!((_a = x.enum) === null || _a === void 0 ? void 0 : _a.length))
            return !!((_b = y.enum) === null || _b === void 0 ? void 0 : _b.length) && y.enum.every((v) => x.enum.includes(v));
        return true;
    };
    const coverInteger = (x, y) => {
        var _a, _b;
        if (!!((_a = x.enum) === null || _a === void 0 ? void 0 : _a.length))
            return !!((_b = y.enum) === null || _b === void 0 ? void 0 : _b.length) && y.enum.every((v) => x.enum.includes(v));
        return OpenApiTypeCheckerBase_1.OpenApiTypeCheckerBase.coverInteger(x, y);
    };
    const coverNumber = (x, y) => {
        var _a, _b;
        if (!!((_a = x.enum) === null || _a === void 0 ? void 0 : _a.length))
            return !!((_b = y.enum) === null || _b === void 0 ? void 0 : _b.length) && y.enum.every((v) => x.enum.includes(v));
        return OpenApiTypeCheckerBase_1.OpenApiTypeCheckerBase.coverNumber(x, y);
    };
    const coverString = (x, y) => {
        var _a, _b;
        if (!!((_a = x.enum) === null || _a === void 0 ? void 0 : _a.length))
            return !!((_b = y.enum) === null || _b === void 0 ? void 0 : _b.length) && y.enum.every((v) => x.enum.includes(v));
        return OpenApiTypeCheckerBase_1.OpenApiTypeCheckerBase.coverString(x, y);
    };
    const flatSchema = ($defs, schema) => {
        schema = escapeReference($defs, schema);
        if (LlmTypeChecker.isAnyOf(schema))
            return schema.anyOf.map((v) => flatSchema($defs, v)).flat();
        return [schema];
    };
    const escapeReference = ($defs, schema) => LlmTypeChecker.isReference(schema)
        ? escapeReference($defs, $defs[schema.$ref.replace("#/$defs/", "")])
        : schema;
})(LlmTypeChecker || (exports.LlmTypeChecker = LlmTypeChecker = {}));
