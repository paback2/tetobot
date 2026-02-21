import { LlmSchemaComposer } from '@samchon/openapi/lib/composers/LlmSchemaComposer.mjs';
import { TransformerError } from '../../transformers/TransformerError.mjs';
import { AtomicPredicator } from '../helpers/AtomicPredicator.mjs';
import { JsonSchemasProgrammer } from '../json/JsonSchemasProgrammer.mjs';

var LlmSchemaProgrammer;
(function (LlmSchemaProgrammer) {
    LlmSchemaProgrammer.write = (props) => {
        const collection = JsonSchemasProgrammer.write({
            version: "3.1",
            metadatas: [props.metadata],
        });
        const $defs = {};
        const result = LlmSchemaComposer.schema({
            config: LlmSchemaComposer.getConfig(props.config),
            components: collection.components,
            schema: collection.schemas[0],
            $defs,
        });
        if (result.success === false)
            throw new TransformerError({
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
        const config = LlmSchemaComposer.getConfig(props.config);
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
            if (AtomicPredicator.native(native.name) === false &&
                native.name !== "Date" &&
                native.name !== "Blob" &&
                native.name !== "File")
                output.push(`LLM schema does not support ${native.name} type.`);
        return output;
    };
})(LlmSchemaProgrammer || (LlmSchemaProgrammer = {}));

export { LlmSchemaProgrammer };
//# sourceMappingURL=LlmSchemaProgrammer.mjs.map
