const _validateReport = (array) => {
    const reportable = (path) => {
        if (array.length === 0)
            return true;
        const last = array[array.length - 1].path;
        return path.length > last.length || last.substring(0, path.length) !== path;
    };
    return (exceptable, error) => {
        if (exceptable && reportable(error.path)) {
            if (error.value === undefined)
                error.description ??= [
                    "The value at this path is `undefined`.",
                    "",
                    `Please fill the \`${error.expected}\` typed value next time.`,
                ].join("\n");
            array.push(error);
        }
        return false;
    };
};

export { _validateReport };
//# sourceMappingURL=_validateReport.mjs.map
