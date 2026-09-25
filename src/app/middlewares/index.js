import { isAuthorized, isAdminAuthorized } from "./authorization.middleware.js";
import { validationMiddleware } from "./validation.middleware.js";

export const middleware = {
    isAuthorized,
    isAdminAuthorized,
    validationMiddleware
};
