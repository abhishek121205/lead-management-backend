import { AuthController } from "../controllers/index.js";
import { configuration } from "../../configs/configuration.config.js";
import { middleware } from "../middlewares/index.js";
import {
    registerSanitize,
    loginSanitize,
    refreshTokenSanitize,
    authValidationSchema
} from "../sanitize/index.js";

const authRoute = function (app, express) {
    const router = express.Router();
    const routerPath = "/User/";

    router.post(
        routerPath + "Register",
        [
            registerSanitize,
            middleware.validationMiddleware(authValidationSchema.registerSchema, "body")
        ],
        AuthController.register
    );

    router.post(
        routerPath + "Login",
        [
            loginSanitize,
            middleware.validationMiddleware(authValidationSchema.loginSchema, "body")
        ],
        AuthController.login
    );

    router.post(
        routerPath + "RefreshToken",
        [
            refreshTokenSanitize,
            middleware.validationMiddleware(authValidationSchema.refreshTokenSchema, "body")
        ],
        AuthController.refreshToken
    );

    router.post(
        routerPath + "Logout",
        [
            middleware.isAuthorized
        ],
        AuthController.logout
    );

    router.get(
        routerPath + "Profile",
        [
            middleware.isAuthorized
        ],
        AuthController.getProfile
    );

    app.use(configuration.baseUrl, router);
};

export default authRoute;
