import response from "../../configs/response.json" with { type: "json" };
import { removeUploadedFile } from "../utils/remove-image.utils.js";

export const validationMiddleware = (schema, property) => {
    return async (req, res, next) => {
        try {
            const requestData = req[property];
            const validatedData = await schema.validateAsync(requestData);

            if (property === "query" || property === "params") {
                try {
                    req[property] = validatedData;
                } catch (_) {
                    if (req[property] && typeof req[property] === "object") {
                        for (const key of Object.keys(req[property])) {
                            delete req[property][key];
                        }
                        Object.assign(req[property], validatedData);
                    }
                }
            } else {
                req[property] = validatedData;
            }

            next();
        } catch (error) {
            await removeUploadedFile(req);
            if (error.details) {
                return res.status(422).json({
                    status: 0,
                    message: response["101"],
                    error: `validationMiddleware ${error.details[0].message}`
                });
            }
            return res.status(422).json({
                status: 0,
                message: response["101"],
                error: `validationMiddleware ${error.message}`
            });
        }
    };
};
