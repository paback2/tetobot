import { LlmSchemaComposer } from '@samchon/openapi/lib/composers/LlmSchemaComposer.mjs';

const _llmApplicationFinalize = (app, config) => {
    app.config = {
        ...LlmSchemaComposer.getConfig(),
        separate: config?.separate ?? null,
        validate: config?.validate ?? null,
    };
    if (app.config.separate !== null)
        for (const func of app.functions)
            func.separated = LlmSchemaComposer.separate({
                parameters: func.parameters,
                predicate: app.config.separate,
                equals: config?.equals ?? false,
            });
    if (app.config.validate !== null)
        for (const func of app.functions)
            if (typeof app.config.validate?.[func.name] === "function")
                func.validate = app.config.validate[func.name];
};

export { _llmApplicationFinalize };
//# sourceMappingURL=_llmApplicationFinalize.mjs.map
