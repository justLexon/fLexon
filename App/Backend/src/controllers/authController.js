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


exports.login = async (email, password) => {
  const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  if (!user || !checkPassword(password, user.password)) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id }, 
    process.env.JWT_SECRET, 
    { expiresIn: "7d" }
  );

  return { token, user };
};



exports.logout = async (req, res) => {
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: false, // localhost, true for prod
        sameSite: "none", // must match the cookie settings when set
        path: "/",       // VERY IMPORTANT
    });
    res.json({ success: true });
};


exports.me = async (req, res) => {
    const user = await authService.getUserById(req.userId);
    res.json(user);
};