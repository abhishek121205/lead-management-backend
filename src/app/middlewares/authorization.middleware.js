import jwt from "jsonwebtoken";

export function isAuthorized(req, res, next) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: 0,
            message: "Authorization token missing"
        });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            const isExpired = err.name === "TokenExpiredError";
            return res.status(401).json({
                status: 0,
                message: isExpired ? "Token expired" : "Invalid token",
                error: err.name
            });
        }
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        next();
    });
}

export function isAdminAuthorized(req, res, next) {
    return isAuthorized(req, res, () => {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                status: 0,
                message: "Admin access required"
            });
        }
        next();
    });
}