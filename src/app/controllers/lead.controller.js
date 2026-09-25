import { prisma } from "../models/index.js";
import response from "../../configs/response.json" with { type: "json" };

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Helper: calculate start and end of any specific date string "YYYY-MM-DD" aligned to IST (UTC+5:30)
const getIstDayRange = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return { startOfDay: null, endOfDay: null };
    const cleanDateStr = dateStr.split("T")[0];
    const parts = cleanDateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return { startOfDay: null, endOfDay: null };

    const [y, m, d] = parts;
    const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS);
    const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS);
    return { startOfDay, endOfDay };
};

// Helper: calculate start and end of "Today" aligned to IST (UTC+5:30)
const getIstTodayRange = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    const istDateStr = formatter.format(now);
    const { startOfDay, endOfDay } = getIstDayRange(istDateStr);
    return { startOfToday: startOfDay, endOfToday: endOfDay };
};

// Helper: parse follow-up date to midday UTC to avoid any 5:30 hr timezone shifts
const parseFollowUpDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal === "string") {
        const dateStr = dateVal.split("T")[0];
        const parts = dateStr.split("-").map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
            const [y, m, d] = parts;
            return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
    }
    return null;
};

// ─── CREATE LEAD ─────────────────────────────────────────────────────────────
export const createLead = async (req, res) => {
    try {
        const { name, email, phone, source, notes, stage, followUpDate } = req.body;
        const userId = req.user.userId;

        const lead = await prisma.lead.create({
            data: {
                name,
                email: email.toLowerCase(),
                phone,
                source,
                notes: notes || null,
                stage: stage ? stage.toUpperCase() : "NEW",
                followUpDate: parseFollowUpDate(followUpDate),
                userId
            }
        });

        return res.status(200).json({
            status: 1,
            message: response["300"] || "Lead created successfully.",
            data: lead
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── GET ALL LEADS (WITH SEARCH, STAGE & FOLLOW-UP DATE FILTERS) ─────────────
export const getLeads = async (req, res) => {
    try {
        const payload = req.method === "POST" ? (req.body || {}) : { ...(req.query || {}), ...(req.body || {}) };
        const search = payload.search;
        const stage = payload.stage;
        const followUpDate = payload.followupdate || payload.followUpdate || payload.followUpDate;
        const page = payload.noOf !== undefined ? payload.noOf : (payload.page !== undefined ? payload.page : 1);
        const limit = payload.limit !== undefined ? payload.limit : 20;

        const where = {};

        // Search in name, email, phone, or source
        if (search && String(search).trim() !== "") {
            const query = String(search).trim();
            where.OR = [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
                { source: { contains: query, mode: "insensitive" } }
            ];
        }

        // Filter by stage
        if (stage && String(stage).trim() !== "") {
            where.stage = String(stage).trim().toUpperCase();
        }

        // Filter by follow-up date
        if (followUpDate && String(followUpDate).trim() !== "") {
            const { startOfToday, endOfToday } = getIstTodayRange();

            if (followUpDate.toLowerCase() === "today") {
                where.followUpDate = {
                    gte: startOfToday,
                    lte: endOfToday
                };
            } else if (followUpDate.toLowerCase() === "overdue") {
                where.followUpDate = {
                    lt: startOfToday
                };
                where.stage = where.stage || { notIn: ["WON", "LOST"] };
            } else if (followUpDate.toLowerCase() === "upcoming") {
                where.followUpDate = {
                    gt: endOfToday
                };
            } else {
                const { startOfDay, endOfDay } = getIstDayRange(String(followUpDate));
                if (startOfDay && endOfDay) {
                    where.followUpDate = {
                        gte: startOfDay,
                        lte: endOfDay
                    };
                }
            }
        }

        const pageNumber = Math.max(1, parseInt(page, 10));
        const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
        const skip = (pageNumber - 1) * pageSize;

        const [totalCount, leads] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            email: true
                        }
                    }
                }
            })
        ]);

        return res.status(200).json({
            status: 1,
            message: response["303"] || "Leads fetched successfully.",
            data: {
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                currentPage: pageNumber,
                pageSize,
                leads
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

// ─── GET SINGLE LEAD BY ID ───────────────────────────────────────────────────
export const getLeadById = async (req, res) => {
    try {
        const id = req.params?.leadId || req.params?.id || req.body?.leadId;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: response["306"] || "Lead ID is required."
            });
        }

        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        email: true
                    }
                }
            }
        });

        if (!lead) {
            return res.status(404).json({
                status: 0,
                message: response["305"] || "Lead not found."
            });
        }

        return res.status(200).json({
            status: 1,
            message: response["302"] || "Lead fetched successfully.",
            data: lead
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── UPDATE LEAD ─────────────────────────────────────────────────────────────
export const updateLead = async (req, res) => {
    try {
        const id = req.body?.leadId || req.params?.leadId || req.params?.id;
        const { name, email, phone, source, notes, stage, followUpDate } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: response["306"] || "Lead ID is required."
            });
        }

        const existingLead = await prisma.lead.findUnique({ where: { id } });
        if (!existingLead) {
            return res.status(404).json({
                status: 0,
                message: response["305"] || "Lead not found."
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email.toLowerCase();
        if (phone !== undefined) updateData.phone = phone;
        if (source !== undefined) updateData.source = source;
        if (notes !== undefined) updateData.notes = notes;
        if (stage !== undefined) updateData.stage = stage.toUpperCase();
        if (followUpDate !== undefined) {
            updateData.followUpDate = parseFollowUpDate(followUpDate);
        }

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: updateData
        });

        return res.status(200).json({
            status: 1,
            message: response["301"] || "Lead updated successfully.",
            data: updatedLead
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── UPDATE LEAD STAGE ONLY (FOR QUICK STATUS / KANBAN DROPDOWN) ─────────────
export const updateLeadStage = async (req, res) => {
    try {
        const id = req.body?.leadId || req.params?.leadId || req.params?.id;
        const { stage } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: response["306"] || "Lead ID is required."
            });
        }

        const existingLead = await prisma.lead.findUnique({ where: { id } });
        if (!existingLead) {
            return res.status(404).json({
                status: 0,
                message: response["305"] || "Lead not found."
            });
        }

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: { stage: stage.toUpperCase() }
        });

        return res.status(200).json({
            status: 1,
            message: response["307"] || "Lead stage updated successfully.",
            data: updatedLead
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── DELETE LEAD ─────────────────────────────────────────────────────────────
export const deleteLead = async (req, res) => {
    try {
        const id = req.params?.leadId || req.params?.id || req.body?.leadId;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: response["306"] || "Lead ID is required."
            });
        }

        const existingLead = await prisma.lead.findUnique({ where: { id } });
        if (!existingLead) {
            return res.status(404).json({
                status: 0,
                message: response["305"] || "Lead not found."
            });
        }

        await prisma.lead.delete({ where: { id } });

        return res.status(200).json({
            status: 1,
            message: response["304"] || "Lead deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"] || "Something went wrong.",
            error: error.message
        });
    }
};

// ─── DASHBOARD STATS (STAGE COUNTS & FOLLOW-UP METRICS) ──────────────────────
export const getDashboardStats = async (req, res) => {
    try {
        const { startOfToday, endOfToday } = getIstTodayRange();

        // Group counts by stage
        const stageCountsRaw = await prisma.lead.groupBy({
            by: ["stage"],
            _count: {
                id: true
            }
        });

        const stageCounts = {
            NEW: 0,
            CONTACTED: 0,
            QUALIFIED: 0,
            WON: 0,
            LOST: 0
        };

        let totalLeads = 0;
        stageCountsRaw.forEach((item) => {
            stageCounts[item.stage] = item._count.id;
            totalLeads += item._count.id;
        });

        const [todayFollowUps, overdueFollowUps, upcomingFollowUps] = await Promise.all([
            prisma.lead.count({
                where: {
                    followUpDate: {
                        gte: startOfToday,
                        lte: endOfToday
                    }
                }
            }),
            prisma.lead.count({
                where: {
                    followUpDate: {
                        lt: startOfToday
                    },
                    stage: {
                        notIn: ["WON", "LOST"]
                    }
                }
            }),
            prisma.lead.count({
                where: {
                    followUpDate: {
                        gt: endOfToday
                    }
                }
            })
        ]);

        return res.status(200).json({
            status: 1,
            message: response["308"] || "Dashboard statistics fetched successfully.",
            data: {
                totalLeads,
                stageCounts,
                followUpMetrics: {
                    today: todayFollowUps,
                    overdue: overdueFollowUps,
                    upcoming: upcomingFollowUps
                }
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
