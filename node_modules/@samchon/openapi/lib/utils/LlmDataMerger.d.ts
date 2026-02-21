import { ILlmFunction } from "../structures/ILlmFunction";
/**
 * Data combiner for LLM function call.
 *
 * @author Samchon
 */
export declare namespace LlmDataMerger {
    /** Properties of {@link parameters} function. */
    interface IProps {
        /** Target function to call. */
        function: ILlmFunction;
        /** Arguments composed by LLM (Large Language Model). */
        llm: object | null;
        /** Arguments composed by human. */
        human: object | null;
    }
    /**
     * Combine LLM and human arguments into one.
     *
     * When you compose {@link IHttpLlmApplication} with
     * {@link IHttpLlmApplication.IConfig.separate} option, then the arguments of
     * the target function would be separated into two parts; LLM (Large Language
     * Model) and human.
     *
     * In that case, you can combine both LLM and human composed arguments into
     * one by utilizing this {@link LlmDataMerger.parameters} function, referencing
     * the target function metadata {@link ILlmFunction.separated}.
     *
     * @param props Properties to combine LLM and human arguments with metadata.
     * @returns Combined arguments
     */
    const parameters: (props: IProps) => object;
    /**
     * Combine two values into one.
     *
     * If both values are objects, then combines them in the properties level.
     *
     * Otherwise, returns the latter value if it's not null, otherwise the former
     * value
     *
     * - `return (y ?? x)`
     *
     * @param x Value X
     * @param y Value Y
     * @returns Combined value
     */
    const value: (x: unknown, y: unknown) => unknown;
}
