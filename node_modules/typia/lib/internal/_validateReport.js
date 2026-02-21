"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._validateReport = void 0;
const _validateReport = (array) => {
    const reportable = (path) => {
        if (array.length === 0)
            return true;
        const last = array[array.length - 1].path;
        return path.length > last.length || last.substring(0, path.length) !== path;
    };
    return (exceptable, error) => {
        var _a;
        if (exceptable && reportable(error.path)) {
            if (error.value === undefined)
                (_a = error.description) !== null && _a !== void 0 ? _a : (error.description = [
                    "The value at this path is `undefined`.",
                    "",
                    `Please fill the \`${error.expected}\` typed value next time.`,
                ].join("\n"));
            array.push(error);
        }
        return false;
    };
};
exports._validateReport = _validateReport;
//# sourceMappingURL=_validateReport.js.map