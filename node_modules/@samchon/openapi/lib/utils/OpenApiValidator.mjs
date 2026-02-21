import { OpenApiStationValidator } from "./internal/OpenApiStationValidator.mjs";

var OpenApiValidator;

(function(OpenApiValidator) {
    OpenApiValidator.create = prop => value => OpenApiValidator.validate({
        ...prop,
        value
    });
    OpenApiValidator.validate = props => {
        const errors = [];
        OpenApiStationValidator.validate({
            ...props,
            path: "$input",
            exceptionable: true,
            report: createReporter(errors),
            equals: props.equals ?? false
        });
        return errors.length === 0 ? {
            success: true,
            data: props.value
        } : {
            success: false,
            data: props.value,
            errors
        };
    };
    const createReporter = array => {
        const reportable = path => {
            if (array.length === 0) return true;
            const last = array[array.length - 1].path;
            return path.length > last.length || last.substring(0, path.length) !== path;
        };
        return error => {
            if (error.exceptionable && reportable(error.path)) {
                const info = {
                    path: error.path,
                    expected: error.expected,
                    value: error.value,
                    description: error.description
                };
                if (error.value === undefined) info.description ?? (info.description = [ "The value at this path is `undefined`.", "", `Please fill the \`${error.expected}\` typed value next time.` ].join("\n"));
                array.push(info);
            }
            return false;
        };
    };
})(OpenApiValidator || (OpenApiValidator = {}));

export { OpenApiValidator };
//# sourceMappingURL=OpenApiValidator.mjs.map
