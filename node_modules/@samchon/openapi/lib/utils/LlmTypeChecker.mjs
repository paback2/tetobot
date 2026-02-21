import { MapUtil } from "./MapUtil.mjs";

import { OpenApiTypeCheckerBase } from "./internal/OpenApiTypeCheckerBase.mjs";

var LlmTypeChecker;

(function(LlmTypeChecker) {
    LlmTypeChecker.isNull = schema => schema.type === "null";
    LlmTypeChecker.isUnknown = schema => schema.type === undefined && !LlmTypeChecker.isAnyOf(schema) && !LlmTypeChecker.isReference(schema);
    LlmTypeChecker.isBoolean = schema => schema.type === "boolean";
    LlmTypeChecker.isInteger = schema => schema.type === "integer";
    LlmTypeChecker.isNumber = schema => schema.type === "number";
    LlmTypeChecker.isString = schema => schema.type === "string";
    LlmTypeChecker.isArray = schema => schema.type === "array" && schema.items !== undefined;
    LlmTypeChecker.isObject = schema => schema.type === "object";
    LlmTypeChecker.isReference = schema => schema.$ref !== undefined;
    LlmTypeChecker.isAnyOf = schema => schema.anyOf !== undefined;
    LlmTypeChecker.visit = props => {
        const already = new Set;
        const refAccessor = props.refAccessor ?? "$input.$defs";
        const next = (schema, accessor) => {
            props.closure(schema, accessor);
            if (LlmTypeChecker.isReference(schema)) {
                const key = schema.$ref.split("#/$defs/").pop();
                if (already.has(key) === true) return;
                already.add(key);
                const found = props.$defs?.[key];
                if (found !== undefined) next(found, `${refAccessor}[${key}]`);
            } else if (LlmTypeChecker.isAnyOf(schema)) schema.anyOf.forEach((s, i) => next(s, `${accessor}.anyOf[${i}]`)); else if (LlmTypeChecker.isObject(schema)) {
                for (const [key, value] of Object.entries(schema.properties)) next(value, `${accessor}.properties[${JSON.stringify(key)}]`);
                if (typeof schema.additionalProperties === "object" && schema.additionalProperties !== null) next(schema.additionalProperties, `${accessor}.additionalProperties`);
            } else if (LlmTypeChecker.isArray(schema)) next(schema.items, `${accessor}.items`);
        };
        next(props.schema, props.accessor ?? "$input.schemas");
    };
    LlmTypeChecker.covers = props => coverStation({
        $defs: props.$defs,
        x: props.x,
        y: props.y,
        visited: new Map
    });
    const coverStation = p => {
        const cache = p.visited.get(p.x)?.get(p.y);
        if (cache !== undefined) return cache;
        const nested = MapUtil.take(p.visited)(p.x)(() => new Map);
        nested.set(p.y, true);
        const result = coverSchema(p);
        nested.set(p.y, result);
        return result;
    };
    const coverSchema = p => {
        if (p.x === p.y) return true; else if (LlmTypeChecker.isReference(p.x) && LlmTypeChecker.isReference(p.y) && p.x.$ref === p.y.$ref) return true;
        const alpha = flatSchema(p.$defs, p.x);
        const beta = flatSchema(p.$defs, p.y);
        if (alpha.some(x => LlmTypeChecker.isUnknown(x))) return true; else if (beta.some(x => LlmTypeChecker.isUnknown(x))) return false;
        return beta.every(b => alpha.some(a => coverEscapedSchema({
            $defs: p.$defs,
            visited: p.visited,
            x: a,
            y: b
        })));
    };
    const coverEscapedSchema = p => {
        if (p.x === p.y) return true; else if (LlmTypeChecker.isUnknown(p.x)) return true; else if (LlmTypeChecker.isUnknown(p.y)) return false; else if (LlmTypeChecker.isNull(p.x)) return LlmTypeChecker.isNull(p.y); else if (LlmTypeChecker.isBoolean(p.x)) return LlmTypeChecker.isBoolean(p.y) && coverBoolean(p.x, p.y); else if (LlmTypeChecker.isInteger(p.x)) return LlmTypeChecker.isInteger(p.y) && coverInteger(p.x, p.y); else if (LlmTypeChecker.isNumber(p.x)) return LlmTypeChecker.isNumber(p.y) && coverNumber(p.x, p.y); else if (LlmTypeChecker.isString(p.x)) return LlmTypeChecker.isString(p.y) && coverString(p.x, p.y); else if (LlmTypeChecker.isArray(p.x)) return LlmTypeChecker.isArray(p.y) && coverArray({
            $defs: p.$defs,
            visited: p.visited,
            x: p.x,
            y: p.y
        }); else if (LlmTypeChecker.isObject(p.x)) return LlmTypeChecker.isObject(p.y) && coverObject({
            $defs: p.$defs,
            visited: p.visited,
            x: p.x,
            y: p.y
        }); else if (LlmTypeChecker.isReference(p.x)) return LlmTypeChecker.isReference(p.y) && p.x.$ref === p.y.$ref;
        return false;
    };
    const coverArray = p => {
        if (!(p.x.minItems === undefined || p.y.minItems !== undefined && p.x.minItems <= p.y.minItems)) return false; else if (!(p.x.maxItems === undefined || p.y.maxItems !== undefined && p.x.maxItems >= p.y.maxItems)) return false;
        return coverStation({
            $defs: p.$defs,
            visited: p.visited,
            x: p.x.items,
            y: p.y.items
        });
    };
    const coverObject = p => {
        if (!p.x.additionalProperties && !!p.y.additionalProperties) return false; else if (!!p.x.additionalProperties && !!p.y.additionalProperties && (typeof p.x.additionalProperties === "object" && p.y.additionalProperties === true || typeof p.x.additionalProperties === "object" && typeof p.y.additionalProperties === "object" && !coverStation({
            $defs: p.$defs,
            visited: p.visited,
            x: p.x.additionalProperties,
            y: p.y.additionalProperties
        }))) return false;
        return Object.entries(p.y.properties ?? {}).every(([key, b]) => {
            const a = p.x.properties?.[key];
            if (a === undefined) return false; else if ((p.x.required?.includes(key) ?? false) === true && (p.y.required?.includes(key) ?? false) === false) return false;
            return coverStation({
                $defs: p.$defs,
                visited: p.visited,
                x: a,
                y: b
            });
        });
    };
    const coverBoolean = (x, y) => {
        if (!!x.enum?.length) return !!y.enum?.length && y.enum.every(v => x.enum.includes(v));
        return true;
    };
    const coverInteger = (x, y) => {
        if (!!x.enum?.length) return !!y.enum?.length && y.enum.every(v => x.enum.includes(v));
        return OpenApiTypeCheckerBase.coverInteger(x, y);
    };
    const coverNumber = (x, y) => {
        if (!!x.enum?.length) return !!y.enum?.length && y.enum.every(v => x.enum.includes(v));
        return OpenApiTypeCheckerBase.coverNumber(x, y);
    };
    const coverString = (x, y) => {
        if (!!x.enum?.length) return !!y.enum?.length && y.enum.every(v => x.enum.includes(v));
        return OpenApiTypeCheckerBase.coverString(x, y);
    };
    const flatSchema = ($defs, schema) => {
        schema = escapeReference($defs, schema);
        if (LlmTypeChecker.isAnyOf(schema)) return schema.anyOf.map(v => flatSchema($defs, v)).flat();
        return [ schema ];
    };
    const escapeReference = ($defs, schema) => LlmTypeChecker.isReference(schema) ? escapeReference($defs, $defs[schema.$ref.replace("#/$defs/", "")]) : schema;
})(LlmTypeChecker || (LlmTypeChecker = {}));

export { LlmTypeChecker };
//# sourceMappingURL=LlmTypeChecker.mjs.map
