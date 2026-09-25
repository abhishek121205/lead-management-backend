import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../models/index.js";
import response from "../../configs/response.json" with { type: "json" };
import { generateAccessToken, generateRefreshToken } from "../utils/token.utils.js";

// ─── REGISTER (ADMIN USER) ───────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(409).json({
                status: 0,
                message: response["250"] || "Email already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                userName,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: "ADMIN"
            }
        });

        const tokenPayload = { userId: newUser.id, role: newUser.role };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        await prisma.user.update({
            where: { id: newUser.id },
            data: { refreshToken }
        });

        return res.status(200).json({
            status: 1,
            message: response["200"] || "User registered successfully.",
            data: {
                userId: newUser.id,
                userName: newUser.userName,
                email: newUser.email,
                role: newUser.role,
                user_type: newUser.role,
                accessToken,
                access_token: accessToken,
                refreshToken,
                refresh_token: refreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email: rawEmail, identifier, password } = req.body;
        const email = (rawEmail || identifier || "").toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({
                status: 0,
                message: response["221"] || "Invalid email or password."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: 0,
                message: response["221"] || "Invalid email or password."
            });
        }

        const tokenPayload = { userId: user.id, role: user.role };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        return res.status(200).json({
            status: 1,
            message: response["220"] || "Login successful.",
            data: {
                userId: user.id,
                userName: user.userName,
                email: user.email,
                role: user.role,
                user_type: user.role,
                accessToken,
                access_token: accessToken,
                refreshToken,
                refresh_token: refreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({
                status: 0,
                message: "Refresh token is required."
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({
                status: 0,
                message: response["225"] || "Invalid or expired refresh token."
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user || !user.refreshToken) {
            return res.status(401).json({
                status: 0,
                message: response["225"] || "Invalid or expired refresh token."
            });
        }

        const tokenPayload = { userId: user.id, role: user.role };
        const newAccessToken = generateAccessToken(tokenPayload);

        // Maintain the active 7-day refresh token to eliminate multi-tab/concurrent request race conditions
        const activeRefreshToken = user.refreshToken || token;

        return res.status(200).json({
            status: 1,
            message: response["223"] || "Token refreshed successfully.",
            data: {
                accessToken: newAccessToken,
                access_token: newAccessToken,
                refreshToken: activeRefreshToken,
                refresh_token: activeRefreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { refreshToken: null }
            });
        }

        return res.status(200).json({
            status: 1,
            message: response["224"] || "Logged out successfully."
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── GET CURRENT USER PROFILE ────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                userName: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                status: 0,
                message: response["204"] || "User not found."
            });
        }

        return res.status(200).json({
            status: 1,
            message: response["202"] || "User profile fetched successfully.",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};
