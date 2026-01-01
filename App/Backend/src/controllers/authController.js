const auth = require("../middleware/authMiddleware");
const authService = require("../services/authService");


exports.register = async (req, res) => {
    try{
        const user = await authService.register(
        req.body.email,
        req.body.password
    );

    res.status(201).json({ success: true, user });
    } catch (err) {
        if (err === "User already exists") {
            return res.status(409).json({ error: err.message });
        }

        if (
            err === "Email and password required" ||
            err === "Password must be at least 6 characters"
        ) {
            return res.status(400).json({ error: err.message });
        }

        console.error(err);
        res.status(500).json({ error: "Registration failed" })
    };
};


exports.login = async (req, res) => {
    const result = await authService.login(
        req.body.email,
        req.body.password
    );

    res.json(result);
};


exports.me = async (req, res) => {
    const user = await authService.getUserById(req,userId);
    res.json(user);
};


exports.logout = async (req, res) => {

    res.json({ success: true });
};