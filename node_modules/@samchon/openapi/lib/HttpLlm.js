"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpLlm = void 0;
const HttpMigration_1 = require("./HttpMigration");
const HttpLlmApplicationComposer_1 = require("./composers/HttpLlmApplicationComposer");
const HttpLlmFunctionFetcher_1 = require("./http/HttpLlmFunctionFetcher");
const LlmDataMerger_1 = require("./utils/LlmDataMerger");
/**
 * LLM function calling application composer from OpenAPI document.
 *
 * `HttpLlm` is a module for composing LLM (Large Language Model) function
 * calling application from the {@link OpenApi.IDocument OpenAPI document}, and
 * also for LLM function call execution and parameter merging.
 *
 * At first, you can construct the LLM function calling application by the
 * {@link HttpLlm.application HttpLlm.application()} function. And then the LLM
 * has selected a {@link IHttpLlmFunction function} to call and composes its
 * arguments, you can execute the function by
 * {@link HttpLlm.execute HttpLlm.execute()} or
 * {@link HttpLlm.propagate HttpLlm.propagate()}.
 *
 * By the way, if you have configured the
 * {@link IHttpLlmApplication.IConfig.separate} option to separate the parameters
 * into human and LLM sides, you can merge these human and LLM sides' parameters
 * into one through {@link HttpLlm.mergeParameters HttpLlm.mergeParameters()}
 * before the actual LLM function call execution.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
var HttpLlm;
(function (HttpLlm) {
    /**
     * Convert OpenAPI document to LLM function calling application.
     *
     * Converts {@link OpenApi.IDocument OpenAPI document} or
     * {@link IHttpMigrateApplication migrated application} to the
     * {@link IHttpLlmApplication LLM function calling application}. Every
     * {@link OpenApi.IOperation API operations} in the OpenAPI document are
     * converted to the {@link IHttpLlmFunction LLM function} type, and they would
     * be used for the LLM function calling.
     *
     * If you have configured the {@link IHttpLlmApplication.IConfig.separate}
     * option, every parameters in the {@link IHttpLlmFunction} would be separated
     * into both human and LLM sides. In that case, you can merge these human and
     * LLM sides' parameters into one through {@link HttpLlm.mergeParameters}
     * before the actual LLM function call execution.
     *
     * @param props Properties for composition
     * @returns LLM function calling application
     */
    HttpLlm.application = (props) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        // MIGRATE
        const migrate = HttpMigration_1.HttpMigration.application(props.document);
        return HttpLlmApplicationComposer_1.HttpLlmComposer.application({
            migrate,
            config: {
                reference: (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.reference) !== null && _b !== void 0 ? _b : true,
                strict: (_d = (_c = props.config) === null || _c === void 0 ? void 0 : _c.strict) !== null && _d !== void 0 ? _d : false,
                separate: (_f = (_e = props.config) === null || _e === void 0 ? void 0 : _e.separate) !== null && _f !== void 0 ? _f : null,
                maxLength: (_h = (_g = props.config) === null || _g === void 0 ? void 0 : _g.maxLength) !== null && _h !== void 0 ? _h : 64,
                equals: (_k = (_j = props.config) === null || _j === void 0 ? void 0 : _j.equals) !== null && _k !== void 0 ? _k : false,
            },
        });
    };
    /**
     * Execute the LLM function call.
     *
     * `HttmLlm.execute()` is a function executing the target
     * {@link OpenApi.IOperation API endpoint} with with the connection information
     * and arguments composed by Large Language Model like OpenAI (+human
     * sometimes).
     *
     * By the way, if you've configured the
     * {@link IHttpLlmApplication.IConfig.separate}, so that the parameters are
     * separated to human and LLM sides, you have to merge these human and LLM
     * sides' parameters into one through {@link HttpLlm.mergeParameters}
     * function.
     *
     * For reference, if the target API endpoint responds none 200/201 status,
     * this would be considered as an error and the {@link HttpError} would be
     * thrown. Otherwise you don't want such rule, you can use the
     * {@link HttpLlm.propagate} function instead.
     *
     * @param props Properties for the LLM function call
     * @returns Return value (response body) from the API endpoint
     * @throws HttpError when the API endpoint responds none 200/201 status
     */
    HttpLlm.execute = (props) => HttpLlmFunctionFetcher_1.HttpLlmFunctionFetcher.execute(props);
    /**
     * Propagate the LLM function call.
     *
     * `HttmLlm.propagate()` is a function propagating the target
     * {@link OpenApi.IOperation API endpoint} with with the connection information
     * and arguments composed by Large Language Model like OpenAI (+human
     * sometimes).
     *
     * By the way, if you've configured the
     * {@link IHttpLlmApplication.IConfig.separate}, so that the parameters are
     * separated to human and LLM sides, you have to merge these humand and LLM
     * sides' parameters into one through {@link HttpLlm.mergeParameters}
     * function.
     *
     * For reference, the propagation means always returning the response from the
     * API endpoint, even if the status is not 200/201. This is useful when you
     * want to handle the response by yourself.
     *
     * @param props Properties for the LLM function call
     * @returns Response from the API endpoint
     * @throws Error only when the connection is failed
     */
    HttpLlm.propagate = (props) => HttpLlmFunctionFetcher_1.HttpLlmFunctionFetcher.propagate(props);
    /**
     * Merge the parameters.
     *
     * If you've configured the {@link IHttpLlmApplication.IConfig.separate}
     * option, so that the parameters are separated to human and LLM sides, you
     * can merge these humand and LLM sides' parameters into one through this
     * `HttpLlm.mergeParameters()` function before the actual LLM function call
     * execution.
     *
     * On contrary, if you've not configured the
     * {@link IHttpLlmApplication.IConfig.separate} option, this function would
     * throw an error.
     *
     * @param props Properties for the parameters' merging
     * @returns Merged parameter values
     */
    HttpLlm.mergeParameters = (props) => LlmDataMerger_1.LlmDataMerger.parameters(props);
    /**
     * Merge two values.
     *
     * If both values are objects, then combines them in the properties level.
     *
     * Otherwise, returns the latter value if it's not null, otherwise the former
     * value.
     *
     * - `return (y ?? x)`
     *
     * @param x Value X to merge
     * @param y Value Y to merge
     * @returns Merged value
     */
    HttpLlm.mergeValue = (x, y) => LlmDataMerger_1.LlmDataMerger.value(x, y);
})(HttpLlm || (exports.HttpLlm = HttpLlm = {}));
