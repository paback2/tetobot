"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._llmApplicationFinalize = void 0;
const LlmSchemaComposer_1 = require("@samchon/openapi/lib/composers/LlmSchemaComposer");
const _llmApplicationFinalize = (app, config) => {
    var _a, _b, _c, _d;
    app.config = Object.assign(Object.assign({}, LlmSchemaComposer_1.LlmSchemaComposer.getConfig()), { separate: (_a = config === null || config === void 0 ? void 0 : config.separate) !== null && _a !== void 0 ? _a : null, validate: (_b = config === null || config === void 0 ? void 0 : config.validate) !== null && _b !== void 0 ? _b : null });
    if (app.config.separate !== null)
        for (const func of app.functions)
            func.separated = LlmSchemaComposer_1.LlmSchemaComposer.separate({
                parameters: func.parameters,
                predicate: app.config.separate,
                equals: (_c = config === null || config === void 0 ? void 0 : config.equals) !== null && _c !== void 0 ? _c : false,
            });
    if (app.config.validate !== null)
        for (const func of app.functions)
            if (typeof ((_d = app.config.validate) === null || _d === void 0 ? void 0 : _d[func.name]) === "function")
                func.validate = app.config.validate[func.name];
};
exports._llmApplicationFinalize = _llmApplicationFinalize;
//# sourceMappingURL=_llmApplicationFinalize.js.map