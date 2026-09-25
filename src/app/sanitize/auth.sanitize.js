import joi from "joi";
import { decode } from "html-entities";
import { undefinedAndNullCheck } from "../utils/helper.utils.js";

// ─── SANITIZE MIDDLEWARES (LOOP-BASED) ────────────────────────────────────────

export const registerSanitize = (req, res, next) => {
    const fieldsToSanitize = ["userName", "email", "password"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const loginSanitize = (req, res, next) => {
    if (req.body.identifier && !req.body.email) {
        req.body.email = req.body.identifier;
    }
    const fieldsToSanitize = ["email", "identifier", "password"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const refreshTokenSanitize = (req, res, next) => {
    const fieldsToSanitize = ["refreshToken"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

// ─── JOI VALIDATION SCHEMAS ──────────────────────────────────────────────────

export const authValidationSchema = {
    registerSchema: joi.object({
        userName: joi.string().trim().max(100).required().messages({
            "string.empty": "User name is required.",
            "any.required": "User name is required.",
            "string.max": "User name must be at most 100 characters."
        }),
        email: joi.string().trim().email().required().messages({
            "string.empty": "Email is required.",
            "any.required": "Email is required.",
            "string.email": "Email must be a valid email address."
        }),
        password: joi.string().trim().min(6).max(50).required().messages({
            "string.empty": "Password is required.",
            "any.required": "Password is required.",
            "string.min": "Password must be at least 6 characters.",
            "string.max": "Password must be at most 50 characters."
        })
    }),

    loginSchema: joi.object({
        email: joi.string().trim().email().optional().messages({
            "string.email": "Email must be a valid email address."
        }),
        identifier: joi.string().trim().email().optional().messages({
            "string.email": "Email must be a valid email address."
        }),
        password: joi.string().trim().required().messages({
            "string.empty": "Password is required.",
            "any.required": "Password is required."
        })
    }).or("email", "identifier"),

    refreshTokenSchema: joi.object({
        refreshToken: joi.string().trim().required().messages({
            "string.empty": "Refresh token is required.",
            "any.required": "Refresh token is required."
        })
    })
};
