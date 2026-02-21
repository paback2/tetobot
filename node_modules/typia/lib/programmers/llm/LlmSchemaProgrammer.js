"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmSchemaProgrammer = void 0;
const LlmSchemaComposer_1 = require("@samchon/openapi/lib/composers/LlmSchemaComposer");
const TransformerError_1 = require("../../transformers/TransformerError");
const AtomicPredicator_1 = require("../helpers/AtomicPredicator");
const json_schema_bigint_1 = require("../internal/json_schema_bigint");
const json_schema_boolean_1 = require("../internal/json_schema_boolean");
const json_schema_native_1 = require("../internal/json_schema_native");
const json_schema_number_1 = require("../internal/json_schema_number");
const json_schema_string_1 = require("../internal/json_schema_string");
const JsonSchemasProgrammer_1 = require("../json/JsonSchemasProgrammer");
var LlmSchemaProgrammer;
(function (LlmSchemaProgrammer) {
    LlmSchemaProgrammer.write = (props) => {
        const collection = JsonSchemasProgrammer_1.JsonSchemasProgrammer.write({
            version: "3.1",
            metadatas: [props.metadata],
        });
        const $defs = {};
        const result = LlmSchemaComposer_1.LlmSchemaComposer.schema({
            config: LlmSchemaComposer_1.LlmSchemaComposer.getConfig(props.config),
            components: collection.components,
            schema: collection.schemas[0],
            $defs,
        });
        if (result.success === false)
            throw new TransformerError_1.TransformerError({
                code: "typia.llm.schema",
                message: "failed to convert JSON schema to LLM schema.\n\n" +
                    result.error.reasons
                        .map((r) => `  - ${r.accessor}: ${r.message}`)
                        .join("\n"),
            });
        return {
            $defs,
            schema: result.value,
        };
    };
    LlmSchemaProgrammer.validate = (props) => {
        const output = [];
        // no additionalProperties in OpenAI strict mode
        const config = LlmSchemaComposer_1.LlmSchemaComposer.getConfig(props.config);
        if (config.strict === true &&
            props.metadata.objects.some((o) => o.type.properties.some((p) => p.key.isSoleLiteral() === false && p.value.size() !== 0)))
            output.push(`Strict mode does not allow dynamic property in object.`);
        // OpenAI strict mode even does not support the optional property
        if (config.strict === true &&
            props.metadata.objects.some((o) => o.type.properties.some((p) => p.value.isRequired() === false)))
            output.push(`Strict mode does not support optional property in object.`);
        // just JSON rule
        if (props.metadata.atomics.some((a) => a.type === "bigint") ||
            props.metadata.constants.some((c) => c.type === "bigint"))
            output.push("LLM schema does not support bigint type.");
        if (props.metadata.tuples.length !== 0)
            output.push("LLM schema does not support tuple type.");
        if (props.metadata.arrays.some((a) => a.type.value.isRequired() === false))
            output.push("LLM schema does not support undefined type in array.");
        if (props.metadata.maps.length)
            output.push("LLM schema does not support Map type.");
        if (props.metadata.sets.length)
            output.push("LLM schema does not support Set type.");
        for (const native of props.metadata.natives)
            if (AtomicPredicator_1.AtomicPredicator.native(native.name) === false &&
                native.name !== "Date" &&
                native.name !== "Blob" &&
                native.name !== "File")
                output.push(`LLM schema does not support ${native.name} type.`);
        return output;
    };
})(LlmSchemaProgrammer || (exports.LlmSchemaProgrammer = LlmSchemaProgrammer = {}));
const size = (metadata) => (metadata.escaped ? size(metadata.escaped.returns) : 0) +
    metadata.aliases.length +
    metadata.objects.length +
    metadata.arrays.length +
    metadata.tuples.length +
    (metadata.maps.length ? 1 : 0) +
    (metadata.sets.length ? 1 : 0) +
    metadata.atomics
        .map((a) => a.type === "boolean"
        ? (0, json_schema_boolean_1.json_schema_boolean)(a).length
        : a.type === "bigint"
            ? (0, json_schema_bigint_1.json_schema_bigint)(a).length
            : a.type === "number"
                ? (0, json_schema_number_1.json_schema_number)(a).length
                : (0, json_schema_string_1.json_schema_string)(a).length)
        .reduce((a, b) => a + b, 0) +
    metadata.constants.filter((c) => metadata.atomics.some((a) => a.type === c.type) === false).length +
    metadata.templates.length +
    metadata.natives
        .filter((n) => metadata.atomics.some((a) => a.type === n.name) === false &&
        metadata.constants.some((c) => c.type === n.name) === false)
        .map((n) => (0, json_schema_native_1.json_schema_native)({
        components: {},
        native: n,
    }).length)
        .reduce((a, b) => a + b, 0);
//# sourceMappingURL=LlmSchemaProgrammer.js.map