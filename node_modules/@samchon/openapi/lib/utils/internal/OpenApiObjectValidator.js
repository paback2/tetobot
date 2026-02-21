"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApiObjectValidator = void 0;
const NamingConvention_1 = require("../NamingConvention");
const OpenApiStationValidator_1 = require("./OpenApiStationValidator");
var OpenApiObjectValidator;
(function (OpenApiObjectValidator) {
    OpenApiObjectValidator.validate = (ctx) => {
        var _a, _b;
        if (typeof ctx.value !== "object" || ctx.value === null)
            return ctx.report(ctx);
        return [
            ...Object.entries((_a = ctx.schema.properties) !== null && _a !== void 0 ? _a : {}).map(([key, value]) => {
                var _a, _b;
                return OpenApiStationValidator_1.OpenApiStationValidator.validate(Object.assign(Object.assign({}, ctx), { schema: value, value: ctx.value[key], path: ctx.path +
                        (NamingConvention_1.NamingConvention.variable(key)
                            ? `.${key}`
                            : `[${JSON.stringify(key)}]`), required: (_b = (_a = ctx.schema.required) === null || _a === void 0 ? void 0 : _a.includes(key)) !== null && _b !== void 0 ? _b : false }));
            }),
            ...(typeof ctx.schema.additionalProperties === "object" &&
                ctx.schema.additionalProperties !== null
                ? Object.entries(ctx.value)
                    .filter(([key]) => {
                    var _a;
                    return Object.keys((_a = ctx.schema.properties) !== null && _a !== void 0 ? _a : {}).includes(key) ===
                        false;
                })
                    .map(([key, value]) => OpenApiStationValidator_1.OpenApiStationValidator.validate(Object.assign(Object.assign({}, ctx), { schema: ctx.schema.additionalProperties, value, path: ctx.path +
                        (NamingConvention_1.NamingConvention.variable(key)
                            ? `.${key}`
                            : `[${JSON.stringify(key)}]`), required: true })))
                : []),
            ...(ctx.equals === true &&
                ((_b = ctx.schema.additionalProperties) !== null && _b !== void 0 ? _b : false) === false
                ? [validateEquals(ctx)]
                : []),
        ].every((v) => v);
    };
    const validateEquals = (ctx) => {
        var _a;
        const regular = new Set(Object.keys((_a = ctx.schema.properties) !== null && _a !== void 0 ? _a : {}));
        return Object.entries(ctx.value)
            .map(([key, value]) => {
            if (regular.has(key) === true)
                return true;
            return ctx.report(Object.assign(Object.assign({}, ctx), { path: ctx.path +
                    (NamingConvention_1.NamingConvention.variable(key)
                        ? `.${key}`
                        : `[${JSON.stringify(key)}]`), value, expected: "undefined", description: [
                    `The property \`${key}\` is not defined in the object type.`,
                    "",
                    "Please remove the property next time.",
                ].join("\n") }));
        })
            .every((v) => v);
    };
})(OpenApiObjectValidator || (exports.OpenApiObjectValidator = OpenApiObjectValidator = {}));
