import joi from "joi";
import { decode } from "html-entities";
import { undefinedAndNullCheck } from "../utils/helper.utils.js";

const stageEnum = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

// ─── SANITIZE MIDDLEWARES (LOOP-BASED) ────────────────────────────────────────

export const addLeadSanitize = (req, res, next) => {
    const fieldsToSanitize = ["name", "email", "phone", "source", "notes", "stage", "followUpDate"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const updateLeadSanitize = (req, res, next) => {
    const fieldsToSanitize = ["leadId", "name", "email", "phone", "source", "notes", "stage", "followUpDate"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    if (req.params?.leadId && undefinedAndNullCheck(req.params.leadId)) {
        req.params.leadId = decode(req.sanitize(req.params.leadId + ""));
    }
    next();
};

export const statusLeadSanitize = (req, res, next) => {
    const fieldsToSanitize = ["leadId", "stage"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    if (req.params?.leadId && undefinedAndNullCheck(req.params.leadId)) {
        req.params.leadId = decode(req.sanitize(req.params.leadId + ""));
    }
    next();
};

export const selectByLeadIdSanitize = (req, res, next) => {
    if (req.params?.leadId && undefinedAndNullCheck(req.params.leadId)) {
        req.params.leadId = decode(req.sanitize(req.params.leadId + ""));
    }
    next();
};

export const selectAllLeadsSanitize = (req, res, next) => {
    const queryFields = ["search", "stage", "followUpDate", "page", "limit"];
    for (const field of queryFields) {
        if (undefinedAndNullCheck(req.query[field])) {
            req.query[field] = decode(req.sanitize(req.query[field] + ""));
        }
    }
    next();
};

export const listLeadSanitize = (req, res, next) => {
    const target = req.body || {};
    const fields = ["search", "stage", "followupdate", "followUpdate", "followUpDate", "noOf", "limit", "page"];
    for (const field of fields) {
        if (undefinedAndNullCheck(target[field])) {
            target[field] = decode(req.sanitize(target[field] + ""));
        }
    }
    next();
};

// ─── JOI VALIDATION SCHEMAS ──────────────────────────────────────────────────

export const leadValidationSchema = {
    createLeadSchema: joi.object({
        name: joi.string().trim().max(100).required().messages({
            "string.empty": "Lead name is required.",
            "any.required": "Lead name is required.",
            "string.max": "Lead name must be at most 100 characters."
        }),
        email: joi.string().trim().email().required().messages({
            "string.empty": "Email is required.",
            "any.required": "Email is required.",
            "string.email": "Please provide a valid email address."
        }),
        phone: joi.string().trim().min(7).max(20).required().messages({
            "string.empty": "Phone number is required.",
            "any.required": "Phone number is required.",
            "string.min": "Phone number must be at least 7 characters.",
            "string.max": "Phone number must be at most 20 characters."
        }),
        source: joi.string().trim().max(100).required().messages({
            "string.empty": "Lead source is required.",
            "any.required": "Lead source is required.",
            "string.max": "Source must be at most 100 characters."
        }),
        notes: joi.string().trim().max(2000).allow("", null).optional().messages({
            "string.max": "Notes must be at most 2000 characters."
        }),
        stage: joi.string().trim().uppercase().valid(...stageEnum).default("NEW").messages({
            "any.only": "Stage must be one of: New, Contacted, Qualified, Won, Lost."
        }),
        followUpDate: joi.date().iso().allow(null, "").optional().messages({
            "date.format": "Follow-up date must be a valid ISO date."
        })
    }),

    updateLeadSchema: joi.object({
        leadId: joi.string().trim().uuid().optional().messages({
            "string.guid": "Lead ID must be a valid UUID."
        }),
        name: joi.string().trim().max(100).optional().messages({
            "string.max": "Lead name must be at most 100 characters."
        }),
        email: joi.string().trim().email().optional().messages({
            "string.email": "Please provide a valid email address."
        }),
        phone: joi.string().trim().min(7).max(20).optional().messages({
            "string.min": "Phone number must be at least 7 characters.",
            "string.max": "Phone number must be at most 20 characters."
        }),
        source: joi.string().trim().max(100).optional().messages({
            "string.max": "Source must be at most 100 characters."
        }),
        notes: joi.string().trim().max(2000).allow("", null).optional().messages({
            "string.max": "Notes must be at most 2000 characters."
        }),
        stage: joi.string().trim().uppercase().valid(...stageEnum).optional().messages({
            "any.only": "Stage must be one of: New, Contacted, Qualified, Won, Lost."
        }),
        followUpDate: joi.date().iso().allow(null, "").optional().messages({
            "date.format": "Follow-up date must be a valid ISO date."
        })
    }),

    updateStageSchema: joi.object({
        leadId: joi.string().trim().uuid().optional().messages({
            "string.guid": "Lead ID must be a valid UUID."
        }),
        stage: joi.string().trim().uppercase().valid(...stageEnum).required().messages({
            "any.required": "Stage is required.",
            "any.only": "Stage must be one of: New, Contacted, Qualified, Won, Lost."
        })
    }),

    leadIdParamSchema: joi.object({
        leadId: joi.string().trim().uuid().required().messages({
            "string.empty": "Lead ID is required.",
            "any.required": "Lead ID is required.",
            "string.guid": "Lead ID must be a valid UUID."
        })
    }),

    leadQuerySchema: joi.object({
        search: joi.string().trim().allow("").optional(),
        stage: joi.string().trim().uppercase().valid(...stageEnum, "").optional(),
        followUpDate: joi.string().trim().allow("").optional(),
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(20)
    }),

    leadListSchema: joi.object({
        noOf: joi.number().integer().min(1).default(1),
        page: joi.number().integer().min(1).optional(),
        limit: joi.number().integer().min(1).max(100).default(20),
        stage: joi.string().trim().uppercase().valid(...stageEnum, "").allow("", null).optional(),
        followupdate: joi.string().trim().allow("", null).optional(),
        followUpdate: joi.string().trim().allow("", null).optional(),
        followUpDate: joi.string().trim().allow("", null).optional(),
        search: joi.string().trim().allow("", null).optional()
    }).unknown(true)
};
