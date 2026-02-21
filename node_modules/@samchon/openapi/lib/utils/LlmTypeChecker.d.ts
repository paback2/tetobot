import { ILlmSchema } from "../structures/ILlmSchema";
/**
 * Type checker for LLM function calling schema.
 *
 * `LlmTypeChecker` is a type checker of {@link ILlmSchema}, the type schema for
 * LLM (Large Language Model) function calling.
 *
 * This checker provides type guard functions for validating schema types, and
 * operators for traversing and comparing schemas.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export declare namespace LlmTypeChecker {
    /**
     * Test whether the schema is a null type.
     *
     * @param schema Target schema
     * @returns Whether null type or not
     */
    const isNull: (schema: ILlmSchema) => schema is ILlmSchema.INull;
    /**
     * Test whether the schema is an unknown type.
     *
     * @param schema Target schema
     * @returns Whether unknown type or not
     */
    const isUnknown: (schema: ILlmSchema) => schema is ILlmSchema.IUnknown;
    /**
     * Test whether the schema is a boolean type.
     *
     * @param schema Target schema
     * @returns Whether boolean type or not
     */
    const isBoolean: (schema: ILlmSchema) => schema is ILlmSchema.IBoolean;
    /**
     * Test whether the schema is an integer type.
     *
     * @param schema Target schema
     * @returns Whether integer type or not
     */
    const isInteger: (schema: ILlmSchema) => schema is ILlmSchema.IInteger;
    /**
     * Test whether the schema is a number type.
     *
     * @param schema Target schema
     * @returns Whether number type or not
     */
    const isNumber: (schema: ILlmSchema) => schema is ILlmSchema.INumber;
    /**
     * Test whether the schema is a string type.
     *
     * @param schema Target schema
     * @returns Whether string type or not
     */
    const isString: (schema: ILlmSchema) => schema is ILlmSchema.IString;
    /**
     * Test whether the schema is an array type.
     *
     * @param schema Target schema
     * @returns Whether array type or not
     */
    const isArray: (schema: ILlmSchema) => schema is ILlmSchema.IArray;
    /**
     * Test whether the schema is an object type.
     *
     * @param schema Target schema
     * @returns Whether object type or not
     */
    const isObject: (schema: ILlmSchema) => schema is ILlmSchema.IObject;
    /**
     * Test whether the schema is a reference type.
     *
     * @param schema Target schema
     * @returns Whether reference type or not
     */
    const isReference: (schema: ILlmSchema) => schema is ILlmSchema.IReference;
    /**
     * Test whether the schema is a union type.
     *
     * @param schema Target schema
     * @returns Whether union type or not
     */
    const isAnyOf: (schema: ILlmSchema) => schema is ILlmSchema.IAnyOf;
    /**
     * Visit every nested schemas.
     *
     * Visit every nested schemas of the target, and apply the `props.closure`
     * function.
     *
     * Here is the list of occurring nested visitings:
     *
     * - {@link ILlmSchema.IAnyOf.anyOf}
     * - {@link ILlmSchema.IReference}
     * - {@link ILlmSchema.IObject.properties}
     * - {@link ILlmSchema.IArray.items}
     *
     * @param props Properties for visiting
     */
    const visit: (props: {
        closure: (schema: ILlmSchema, accessor: string) => void;
        $defs?: Record<string, ILlmSchema> | undefined;
        schema: ILlmSchema;
        accessor?: string;
        refAccessor?: string;
    }) => void;
    /**
     * Test whether the `x` schema covers the `y` schema.
     *
     * @param props Properties for testing
     * @returns Whether the `x` schema covers the `y` schema
     */
    const covers: (props: {
        $defs?: Record<string, ILlmSchema> | undefined;
        x: ILlmSchema;
        y: ILlmSchema;
    }) => boolean;
}
