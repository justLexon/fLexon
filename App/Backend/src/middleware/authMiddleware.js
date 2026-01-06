// authorization
const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(401).json({ error: "Missing token"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next(); // Pass to controller
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token"});
    }
};