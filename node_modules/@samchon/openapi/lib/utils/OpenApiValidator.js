"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApiValidator = void 0;
const OpenApiStationValidator_1 = require("./internal/OpenApiStationValidator");
var OpenApiValidator;
(function (OpenApiValidator) {
    OpenApiValidator.create = (prop) => (value) => OpenApiValidator.validate(Object.assign(Object.assign({}, prop), { value }));
    OpenApiValidator.validate = (props) => {
        var _a;
        const errors = [];
        OpenApiStationValidator_1.OpenApiStationValidator.validate(Object.assign(Object.assign({}, props), { path: "$input", exceptionable: true, report: createReporter(errors), equals: (_a = props.equals) !== null && _a !== void 0 ? _a : false }));
        return errors.length === 0
            ? {
                success: true,
                data: props.value,
            }
            : {
                success: false,
                data: props.value,
                errors,
            };
    };
    const createReporter = (array) => {
        const reportable = (path) => {
            if (array.length === 0)
                return true;
            const last = array[array.length - 1].path;
            return (path.length > last.length || last.substring(0, path.length) !== path);
        };
        return (error) => {
            var _a;
            if (error.exceptionable && reportable(error.path)) {
                const info = {
                    path: error.path,
                    expected: error.expected,
                    value: error.value,
                    description: error.description,
                };
                if (error.value === undefined)
                    (_a = info.description) !== null && _a !== void 0 ? _a : (info.description = [
                        "The value at this path is `undefined`.",
                        "",
                        `Please fill the \`${error.expected}\` typed value next time.`,
                    ].join("\n"));
                array.push(info);
            }
            return false;
        };
    };
})(OpenApiValidator || (exports.OpenApiValidator = OpenApiValidator = {}));
