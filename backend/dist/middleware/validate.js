"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateParams = validateParams;
exports.validateQuery = validateQuery;
/**
 * Validates req.body against the provided Zod schema.
 * Returns 422 with field-level errors on failure.
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = formatZodErrors(result.error);
            res.status(422).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request body validation failed.',
                    fields: errors,
                },
            });
            return;
        }
        req.body = result.data;
        next();
    };
}
/**
 * Validates req.params against the provided Zod schema.
 */
function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const errors = formatZodErrors(result.error);
            res.status(422).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request params validation failed.',
                    fields: errors,
                },
            });
            return;
        }
        req.params = result.data;
        next();
    };
}
/**
 * Validates req.query against the provided Zod schema.
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const errors = formatZodErrors(result.error);
            res.status(422).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request query validation failed.',
                    fields: errors,
                },
            });
            return;
        }
        req.query = result.data;
        next();
    };
}
function formatZodErrors(error) {
    return error.flatten().fieldErrors;
}
//# sourceMappingURL=validate.js.map