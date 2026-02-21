import { HttpMigration } from "./HttpMigration.mjs";

import { HttpLlmComposer } from "./composers/HttpLlmApplicationComposer.mjs";

import { HttpLlmFunctionFetcher } from "./http/HttpLlmFunctionFetcher.mjs";

import { LlmDataMerger } from "./utils/LlmDataMerger.mjs";

var HttpLlm;

(function(HttpLlm) {
    HttpLlm.application = props => {
        const migrate = HttpMigration.application(props.document);
        return HttpLlmComposer.application({
            migrate,
            config: {
                reference: props.config?.reference ?? true,
                strict: props.config?.strict ?? false,
                separate: props.config?.separate ?? null,
                maxLength: props.config?.maxLength ?? 64,
                equals: props.config?.equals ?? false
            }
        });
    };
    HttpLlm.execute = props => HttpLlmFunctionFetcher.execute(props);
    HttpLlm.propagate = props => HttpLlmFunctionFetcher.propagate(props);
    HttpLlm.mergeParameters = props => LlmDataMerger.parameters(props);
    HttpLlm.mergeValue = (x, y) => LlmDataMerger.value(x, y);
})(HttpLlm || (HttpLlm = {}));

export { HttpLlm };
//# sourceMappingURL=HttpLlm.mjs.map
