"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeGuardError = void 0;
/**
 * Custom error class thrown when runtime assertion fails in `typia.assert<T>()`
 * function.
 *
 * This error is thrown by the `typia.assert<T>()` function when the input value
 * doesn't match the expected type.
 *
 * The error provides detailed information about the first assertion failure
 * encountered, including the access path where the error occurred, the expected
 * type, and the actual value.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   ```typescript
 *   interface IMember {
 *     name: string;
 *     age: number & ExclusiveMinimum<19>;
 *   }
 *
 *   try {
 *     typia.assert<IMember>({ name: "John", age: 18 });
 *   } catch (error) {
 *     if (error instanceof TypeGuardError) {
 *       console.log(error.method);   // "typia.assert"
 *       console.log(error.path);     // "input.age"
 *       console.log(error.expected); // "number & ExclusiveMinimum<19>"
 *       console.log(error.value);    // 18
 *     }
 *   }
 *   ```;
 *
 * @template T - The expected type (generic for type safety)
 */
class TypeGuardError extends Error {
    /**
     * Creates a new TypeGuardError instance.
     *
     * @example
     *   ```typescript
     *   const error = new TypeGuardError({
     *     method: "typia.assert",
     *     path: "input.age",
     *     expected: "number & ExclusiveMinimum<19>",
     *     value: 18
     *   });
     *   ```;
     *
     * @param props - Object containing the properties needed to create the error
     */
    constructor(props) {
        var _a;
        // MESSAGE CONSTRUCTION
        // Use custom message if provided, otherwise generate default format
        super(props.message ||
            `Error on ${props.method}(): invalid type${props.path ? ` on ${props.path}` : ""}, expect to be ${props.expected}`);
        // INHERITANCE POLYFILL
        // Set up prototype for compatibility across different JavaScript environments
        const proto = new.target.prototype;
        if (Object.setPrototypeOf)
            Object.setPrototypeOf(this, proto);
        else
            this.__proto__ = proto;
        // ASSIGN MEMBERS
        this.method = props.method;
        this.path = props.path;
        this.expected = props.expected;
        this.value = props.value;
        if (props.description || props.value === undefined)
            this.description =
                (_a = props.description) !== null && _a !== void 0 ? _a : [
                    "The value at this path is `undefined`.",
                    "",
                    `Please fill the \`${props.expected}\` typed value next time.`,
                ].join("\n");
    }
}
exports.TypeGuardError = TypeGuardError;
//# sourceMappingURL=TypeGuardError.js.map