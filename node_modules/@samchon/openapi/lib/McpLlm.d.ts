import { IMcpLlmApplication } from "./structures/IMcpLlmApplication";
import { IMcpTool } from "./structures/IMcpTool";
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
export declare namespace McpLlm {
    /** Properties for the LLM function calling application composer. */
    interface IApplicationProps {
        /**
         * List of tools.
         *
         * A list of tools defined in the MCP (Model Context Protocol) document.
         *
         * It is better to validate the tools using the
         * [`typia.assert<T>()`](https://typia.io/docs/validate/assert) function for
         * type safety.
         */
        tools: Array<IMcpTool>;
        /** Configuration for the LLM function calling schema conversion. */
        config?: Partial<IMcpLlmApplication.IConfig>;
    }
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
    const application: (props: IApplicationProps) => IMcpLlmApplication;
}
