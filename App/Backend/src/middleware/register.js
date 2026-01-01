require('./auth.js');

// POST to create user at endpoint /auth/register
app.post("/auth/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required"}); 
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters"});
    }

    try {
        const existing = await sql`
            SELECT id FROM users WHERE email = ${email}
        `;

        if (existing.length > 0) {
            return res.status(409).json({ error: "User already exists"});
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await sql`
            INSERT INTO users (email, password_hash) 
            VALUES (${email}, ${passwordHash}) 
            RETURNING id, email, created_at
        `;

        res.status(201).json({ 
            success: true,
            user: result[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed"});
    }
});