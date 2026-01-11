const authService = require("../services/authService");

exports.register = async (req, res) => {
    try{
        const user = await authService.register(
            req.body.email,
            req.body.password
        );

        res.status(201).json({ success: true, user });
    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "User already exists" });
        }

        if (err.message === "User already exists") {
            return res.status(409).json({ error: "User already exists" });
        }

        if (
            err.message === "Email and password required" ||
            err.message === "Password must be at least 6 characters"
        ) {
            return res.status(400).json({ error: err.message });
        }

        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
};


exports.login = async (req, res) => {
    try {
        const { token, user } = await authService.login(
            req.body.email,
            req.body.password
        );

        res.cookie("access_token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ success: true, token, user });
    } catch (err) {
        if (err.message === "Invalid credentials") {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
};


exports.logout = async (req, res) => {
    res.clearCookie("access_token");
    res.json({ success: true });
};


exports.me = async (req, res) => {
    const user = await authService.getUserById(req.userId);
    res.json(user);
};