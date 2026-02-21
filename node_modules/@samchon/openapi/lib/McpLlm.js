"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpLlm = void 0;
const LlmSchemaComposer_1 = require("./composers/LlmSchemaComposer");
const OpenApiV3_1Emender_1 = require("./converters/OpenApiV3_1Emender");
const OpenApiTypeChecker_1 = require("./utils/OpenApiTypeChecker");
const OpenApiValidator_1 = require("./utils/OpenApiValidator");
/**
 * Application of LLM function calling from MCP document.
 *
 * `McpLlm` is a module for composing LLM (Large Language Model) function
 * calling application from MCP (Model Context Protocol) document.
 *
 * The reasons why `@samchon/openapi` recommends to use the function calling
 * feature instead of directly using the
 * [`mcp_servers`](https://openai.github.io/openai-agents-python/mcp/#using-mcp-servers)
 * property of LLM API are:
 *
 * - Model Specification: {@link ILlmSchema}
 * - Validation Feedback: {@link IMcpLlmFunction.validate}
 * - Selector agent for reducing context: [Agentica > Orchestration
 *   Strategy](https://wrtnlabs.io/agentica/docs/concepts/function-calling/#orchestration-strategy)
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
var McpLlm;
(function (McpLlm) {
    /**
     * Convert MCP document to LLM function calling application.
     *
     * Converts MCP (Model Context Protocol) to LLM (Large Language Model)
     * function calling application.
     *
     * The reasons why `@samchon/openapi` recommends using the function calling
     * feature instead of directly using the
     * [`mcp_servers`](https://openai.github.io/openai-agents-python/mcp/#using-mcp-servers)
     * property of LLM API are:
     *
     * - **Model Specification**: {@link ILlmSchema}
     * - **Validation Feedback**: {@link IMcpLlmFunction.validate}
     * - **Selector agent for reducing context**: [Agentica > Orchestration
     *   Strategy](https://wrtnlabs.io/agentica/docs/concepts/function-calling/#orchestration-strategy)
     *
     * @param props Properties for composition
     * @returns LLM function calling application
     */
    McpLlm.application = (props) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const config = {
            reference: (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.reference) !== null && _b !== void 0 ? _b : true,
            strict: (_d = (_c = props.config) === null || _c === void 0 ? void 0 : _c.strict) !== null && _d !== void 0 ? _d : false,
            maxLength: (_f = (_e = props.config) === null || _e === void 0 ? void 0 : _e.maxLength) !== null && _f !== void 0 ? _f : 64,
            equals: (_h = (_g = props.config) === null || _g === void 0 ? void 0 : _g.equals) !== null && _h !== void 0 ? _h : false,
        };
        const functions = [];
        const errors = [];
        props.tools.forEach((tool, i) => {
            // CONVERT TO EMENDED OPENAPI V3.1 SPECIFICATION
            const components = OpenApiV3_1Emender_1.OpenApiV3_1Emender.convertComponents({
                schemas: tool.inputSchema.$defs,
            });
            const schema = OpenApiV3_1Emender_1.OpenApiV3_1Emender.convertSchema({
                schemas: tool.inputSchema.$defs,
            })(tool.inputSchema);
            if (components.schemas) {
                const visited = new Set();
                OpenApiTypeChecker_1.OpenApiTypeChecker.visit({
                    closure: (schema) => {
                        if (typeof schema.$ref === "string")
                            visited.add(schema.$ref.split("/").pop());
                    },
                    components,
                    schema,
                });
                components.schemas = Object.fromEntries(Object.entries(components.schemas).filter(([key]) => visited.has(key)));
            }
            // CONVERT TO LLM PARAMETERS
            const parameters = LlmSchemaComposer_1.LlmSchemaComposer.parameters({
                config,
                components,
                schema: schema,
                accessor: `$input.tools[${i}].inputSchema`,
            });
            if (parameters.success)
                functions.push({
                    name: tool.name,
                    parameters: parameters.value,
                    description: tool.description,
                    validate: OpenApiValidator_1.OpenApiValidator.create({
                        components,
                        schema,
                        required: true,
                        equals: config.equals,
                    }),
                });
            else
                errors.push({
                    name: tool.name,
                    parameters: tool.inputSchema,
                    description: tool.description,
                    messages: parameters.error.reasons.map((r) => {
                        const accessor = `$input.tools[${i}].inputSchema`;
                        return `${accessor}: ${r.message}`;
                    }),
                });
        });
        return {
            functions,
            config,
            errors,
        };
    };
})(McpLlm || (exports.McpLlm = McpLlm = {}));
