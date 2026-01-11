const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token =
        req.cookies?.access_token ||
        (authHeader && authHeader.split(" ")[1]);

    if (!token) {
        return res.status(401).json({ error: "Missing token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
