require('./auth.js');

// Post for /auth/login
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return res.status(400).json({ error: "Email and password required"});
    }

    try { 
        const result = await sql`
            SELECT id, email, password_hash 
            FROM users 
            WHERE email = ${email}
        `;

        if (result.length === 0) {
            return res.status(401).json({ error: "Invalid credentials"});
        }

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials"});
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json ({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed"});
    }
});