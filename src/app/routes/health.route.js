import { configuration } from "../../configs/configuration.config.js";
import { HealthController } from "../controllers/index.js";

const healthRoute = function (app, express) {
    const router = express.Router();

    router.get("/health", HealthController.healthCheck);
    app.use(configuration.baseUrl, router);
};

export default healthRoute;