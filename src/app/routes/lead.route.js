import { LeadController } from "../controllers/index.js";
import { configuration } from "../../configs/configuration.config.js";
import { middleware } from "../middlewares/index.js";
import {
    addLeadSanitize,
    updateLeadSanitize,
    statusLeadSanitize,
    selectByLeadIdSanitize,
    selectAllLeadsSanitize,
    listLeadSanitize,
    leadValidationSchema
} from "../sanitize/index.js";

const leadRoute = function (app, express) {
    const router = express.Router();
    const routerPath = "/Lead/";

    router.post(
        routerPath + "List",
        [
            middleware.isAuthorized,
            listLeadSanitize,
            middleware.validationMiddleware(leadValidationSchema.leadListSchema, "body")
        ],
        LeadController.getLeads
    );

    router.post(
        routerPath + "Add",
        [
            middleware.isAuthorized,
            addLeadSanitize,
            middleware.validationMiddleware(leadValidationSchema.createLeadSchema, "body")
        ],
        LeadController.createLead
    );

    router.put(
        routerPath + "Update",
        [
            middleware.isAuthorized,
            updateLeadSanitize,
            middleware.validationMiddleware(leadValidationSchema.updateLeadSchema, "body")
        ],
        LeadController.updateLead
    );

    router.put(
        routerPath + "Status",
        [
            middleware.isAuthorized,
            statusLeadSanitize,
            middleware.validationMiddleware(leadValidationSchema.updateStageSchema, "body")
        ],
        LeadController.updateLeadStage
    );

    router.get(
        routerPath + "SelectById/:leadId",
        [
            middleware.isAuthorized,
            selectByLeadIdSanitize,
            middleware.validationMiddleware(leadValidationSchema.leadIdParamSchema, "params")
        ],
        LeadController.getLeadById
    );

    router.get(
        routerPath + "SelectAll",
        [
            middleware.isAuthorized,
            selectAllLeadsSanitize,
            middleware.validationMiddleware(leadValidationSchema.leadQuerySchema, "query")
        ],
        LeadController.getLeads
    );

    router.get(
        routerPath + "DashboardStats",
        [
            middleware.isAuthorized
        ],
        LeadController.getDashboardStats
    );

    router.delete(
        routerPath + "Delete/:leadId",
        [
            middleware.isAdminAuthorized,
            selectByLeadIdSanitize,
            middleware.validationMiddleware(leadValidationSchema.leadIdParamSchema, "params")
        ],
        LeadController.deleteLead
    );

    app.use(configuration.baseUrl, router);
};

export default leadRoute;
