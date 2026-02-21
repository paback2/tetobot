"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpLlmComposer = void 0;
const OpenApiValidator_1 = require("../utils/OpenApiValidator");
const LlmSchemaComposer_1 = require("./LlmSchemaComposer");
var HttpLlmComposer;
(function (HttpLlmComposer) {
    HttpLlmComposer.application = (props) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        // COMPOSE FUNCTIONS
        const config = {
            separate: (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.separate) !== null && _b !== void 0 ? _b : null,
            maxLength: (_d = (_c = props.config) === null || _c === void 0 ? void 0 : _c.maxLength) !== null && _d !== void 0 ? _d : 64,
            equals: (_f = (_e = props.config) === null || _e === void 0 ? void 0 : _e.equals) !== null && _f !== void 0 ? _f : false,
            reference: (_h = (_g = props.config) === null || _g === void 0 ? void 0 : _g.reference) !== null && _h !== void 0 ? _h : true,
            strict: (_k = (_j = props.config) === null || _j === void 0 ? void 0 : _j.strict) !== null && _k !== void 0 ? _k : false,
        };
        const errors = props.migrate.errors
            .filter((e) => e.operation()["x-samchon-human"] !== true)
            .map((e) => ({
            method: e.method,
            path: e.path,
            messages: e.messages,
            operation: () => e.operation(),
            route: () => undefined,
        }));
        const functions = props.migrate.routes
            .filter((e) => e.operation()["x-samchon-human"] !== true)
            .map((route, i) => {
            var _a, _b;
            if (route.method === "head") {
                errors.push({
                    method: route.method,
                    path: route.path,
                    messages: ["HEAD method is not supported in the LLM application."],
                    operation: () => route.operation(),
                    route: () => route,
                });
                return null;
            }
            else if (((_a = route.body) === null || _a === void 0 ? void 0 : _a.type) === "multipart/form-data" ||
                ((_b = route.success) === null || _b === void 0 ? void 0 : _b.type) === "multipart/form-data") {
                errors.push({
                    method: route.method,
                    path: route.path,
                    messages: [
                        `The "multipart/form-data" content type is not supported in the LLM application.`,
                    ],
                    operation: () => route.operation(),
                    route: () => route,
                });
                return null;
            }
            const localErrors = [];
            const func = composeFunction({
                components: props.migrate.document().components,
                config,
                route,
                errors: localErrors,
                index: i,
            });
            if (func === null)
                errors.push({
                    method: route.method,
                    path: route.path,
                    messages: localErrors,
                    operation: () => route.operation(),
                    route: () => route,
                });
            return func;
        })
            .filter((v) => v !== null);
        const app = {
            config,
            functions,
            errors,
        };
        HttpLlmComposer.shorten(app, (_m = (_l = props.config) === null || _l === void 0 ? void 0 : _l.maxLength) !== null && _m !== void 0 ? _m : 64);
        return app;
    };
    const composeFunction = (props) => {
        var _a, _b, _c, _d, _e, _f, _g;
        // METADATA
        const endpoint = `$input.paths[${JSON.stringify(props.route.path)}][${JSON.stringify(props.route.method)}]`;
        const operation = props.route.operation();
        const description = (() => {
            var _a, _b, _c, _d, _e, _f;
            if (!((_a = operation.summary) === null || _a === void 0 ? void 0 : _a.length) || !((_b = operation.description) === null || _b === void 0 ? void 0 : _b.length))
                return [
                    operation.summary || operation.description,
                    (_f = (_d = (_c = operation.summary) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : (_e = operation.description) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0,
                ];
            const summary = operation.summary.endsWith(".")
                ? operation.summary.slice(0, -1)
                : operation.summary;
            const final = operation.description.startsWith(summary)
                ? operation.description
                : summary + ".\n\n" + operation.description;
            return [final, final.length];
        })();
        if (description[1] > 1024) {
            props.errors.push(`The description of the function is too long (must be equal or less than 1,024 characters, but ${description[1].toLocaleString()} length).`);
        }
        // FUNCTION NAME
        const name = emend(props.route.accessor.join("_"));
        const isNameVariable = /^[a-zA-Z0-9_-]+$/.test(name);
        const isNameStartsWithNumber = /^[0-9]/.test((_a = name[0]) !== null && _a !== void 0 ? _a : "");
        if (isNameVariable === false)
            props.errors.push(`Elements of path (separated by '/') must be composed with alphabets, numbers, underscores, and hyphens`);
        //----
        // CONSTRUCT SCHEMAS
        //----
        // PARAMETERS
        const parameters = {
            type: "object",
            properties: Object.fromEntries([
                ...props.route.parameters.map((s) => {
                    var _a;
                    return [
                        s.key,
                        Object.assign(Object.assign({}, s.schema), { description: (_a = s.parameter().description) !== null && _a !== void 0 ? _a : s.schema.description }),
                    ];
                }),
                ...(props.route.query
                    ? [
                        [
                            props.route.query.key,
                            Object.assign(Object.assign({}, props.route.query.schema), { title: (_b = props.route.query.title()) !== null && _b !== void 0 ? _b : props.route.query.schema.title, description: (_c = props.route.query.description()) !== null && _c !== void 0 ? _c : props.route.query.schema.description }),
                        ],
                    ]
                    : []),
                ...(props.route.body
                    ? [
                        [
                            props.route.body.key,
                            Object.assign(Object.assign({}, props.route.body.schema), { description: (_d = props.route.body.description()) !== null && _d !== void 0 ? _d : props.route.body.schema.description }),
                        ],
                    ]
                    : []),
            ]),
        };
        parameters.required = Object.keys((_e = parameters.properties) !== null && _e !== void 0 ? _e : {});
        const llmParameters = LlmSchemaComposer_1.LlmSchemaComposer.parameters({
            config: props.config,
            components: props.components,
            schema: parameters,
            accessor: `${endpoint}.parameters`,
        });
        // RETURN VALUE
        const output = props
            .route.success
            ? LlmSchemaComposer_1.LlmSchemaComposer.schema({
                config: props.config,
                components: props.components,
                schema: props.route.success.schema,
                accessor: `${endpoint}.responses[${JSON.stringify(props.route.success.status)}][${JSON.stringify(props.route.success.type)}].schema`,
                $defs: llmParameters.success ? llmParameters.value.$defs : {},
            })
            : undefined;
        //----
        // CONVERSION
        //----
        if ((output === null || output === void 0 ? void 0 : output.success) === false ||
            llmParameters.success === false ||
            isNameVariable === false ||
            isNameStartsWithNumber === true ||
            description[1] > 1024) {
            if ((output === null || output === void 0 ? void 0 : output.success) === false)
                props.errors.push(...output.error.reasons.map((r) => `${r.accessor}: ${r.message}`));
            if (llmParameters.success === false)
                props.errors.push(...llmParameters.error.reasons.map((r) => {
                    var _a, _b;
                    const accessor = r.accessor.replace(`parameters.properties["body"]`, `requestBody.content[${JSON.stringify((_b = (_a = props.route.body) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : "application/json")}].schema`);
                    return `${accessor}: ${r.message}`;
                }));
            return null;
        }
        return {
            method: props.route.method,
            path: props.route.path,
            name,
            parameters: llmParameters.value,
            separated: props.config.separate
                ? LlmSchemaComposer_1.LlmSchemaComposer.separate({
                    predicate: props.config.separate,
                    parameters: llmParameters.value,
                    equals: (_f = props.config.equals) !== null && _f !== void 0 ? _f : false,
                })
                : undefined,
            output: output === null || output === void 0 ? void 0 : output.value,
            description: description[0],
            deprecated: operation.deprecated,
            tags: operation.tags,
            validate: OpenApiValidator_1.OpenApiValidator.create({
                components: props.components,
                schema: parameters,
                required: true,
                equals: (_g = props.config.equals) !== null && _g !== void 0 ? _g : false,
            }),
            route: () => props.route,
            operation: () => props.route.operation(),
        };
    };
    HttpLlmComposer.shorten = (app, limit = 64) => {
        const dictionary = new Set();
        const longFunctions = [];
        for (const func of app.functions) {
            dictionary.add(func.name);
            if (func.name.length > limit) {
                longFunctions.push(func);
            }
        }
        if (longFunctions.length === 0)
            return;
        let index = 0;
        for (const func of longFunctions) {
            let success = false;
            let rename = (str) => {
                dictionary.delete(func.name);
                dictionary.add(str);
                func.name = str;
                success = true;
            };
            for (let i = 1; i < func.route().accessor.length; ++i) {
                const shortName = func.route().accessor.slice(i).join("_");
                if (shortName.length > limit - 8)
                    continue;
                else if (dictionary.has(shortName) === false)
                    rename(shortName);
                else {
                    const newName = `_${index}_${shortName}`;
                    if (dictionary.has(newName) === true)
                        continue;
                    rename(newName);
                    ++index;
                }
                break;
            }
            if (success === false)
                rename(randomFormatUuid());
        }
    };
})(HttpLlmComposer || (exports.HttpLlmComposer = HttpLlmComposer = {}));
const randomFormatUuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
});
const emend = (str) => {
    for (const ch of FORBIDDEN)
        str = str.split(ch).join("_");
    return str;
};
const FORBIDDEN = ["$", "%", "."];
