import { LlmSchemaComposer } from "./composers/LlmSchemaComposer.mjs";

import { OpenApiV3_1Emender } from "./converters/OpenApiV3_1Emender.mjs";

import { OpenApiTypeChecker } from "./utils/OpenApiTypeChecker.mjs";

import { OpenApiValidator } from "./utils/OpenApiValidator.mjs";

var McpLlm;

(function(McpLlm) {
    McpLlm.application = props => {
        const config = {
            reference: props.config?.reference ?? true,
            strict: props.config?.strict ?? false,
            maxLength: props.config?.maxLength ?? 64,
            equals: props.config?.equals ?? false
        };
        const functions = [];
        const errors = [];
        props.tools.forEach((tool, i) => {
            const components = OpenApiV3_1Emender.convertComponents({
                schemas: tool.inputSchema.$defs
            });
            const schema = OpenApiV3_1Emender.convertSchema({
                schemas: tool.inputSchema.$defs
            })(tool.inputSchema);
            if (components.schemas) {
                const visited = new Set;
                OpenApiTypeChecker.visit({
                    closure: schema => {
                        if (typeof schema.$ref === "string") visited.add(schema.$ref.split("/").pop());
                    },
                    components,
                    schema
                });
                components.schemas = Object.fromEntries(Object.entries(components.schemas).filter(([key]) => visited.has(key)));
            }
            const parameters = LlmSchemaComposer.parameters({
                config,
                components,
                schema,
                accessor: `$input.tools[${i}].inputSchema`
            });
            if (parameters.success) functions.push({
                name: tool.name,
                parameters: parameters.value,
                description: tool.description,
                validate: OpenApiValidator.create({
                    components,
                    schema,
                    required: true,
                    equals: config.equals
                })
            }); else errors.push({
                name: tool.name,
                parameters: tool.inputSchema,
                description: tool.description,
                messages: parameters.error.reasons.map(r => {
                    const accessor = `$input.tools[${i}].inputSchema`;
                    return `${accessor}: ${r.message}`;
                })
            });
        });
        return {
            functions,
            config,
            errors
        };
    };
})(McpLlm || (McpLlm = {}));

export { McpLlm };
//# sourceMappingURL=McpLlm.mjs.map
