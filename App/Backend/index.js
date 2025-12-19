require('dotenv').config();

// env variables
// const DB_USER = process.env.DB_USER;
// const HOST = process.env.DB_HOST;
// const DATABASE = process.env.DB_DATABASE;
// const PASSWORD = process.env.DB_PASSWORD;
// const DBPORT = process.env.DB_PORT;

const sql = require("./db");
// express server
const express = require("express");
// postgres
// const { Pool } = require("pg");
// encryption
const bcrypt = require("bcrypt");
// authorization
const jwt = require("jsonwebtoken");

// port 3000
const app = express();
const PORT = process.env.PORT || 3000;

// use json format
app.use(express.json());

// // postgres connection
// const pool = new Pool({
// //   user: DB_USER,
// //   host: HOST,
// //   database: DATABASE,
// //   password: PASSWORD,
// //   port: DBPORT,
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });



// FUNCTIONS
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Missing authorization header"});
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Missing token"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.userId;

        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token"});
    }
}   


// temp
app.get("/db_test", async (req, res) => {
    try {
        const result = await sql`SELECT NOW()`;
        res.json({ success: true, time: result[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database connection failed"});
    }
});


// GET method for endpoint /health
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend running" });
});



// GET method for endpoint /water
app.get("/water", authMiddleware, async (req, res) => {
    try {
        const result = await sql`
            SELECT * FROM water_logs 
            WHERE user_id = ${req.userId}
            ORDER BY created_at DESC
        `;

        res.json({
            count: result.length,
            data: result
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch water logs"});
    }
});

// GET method for endpoint /weight
app.get("/weight", authMiddleware, async (req, res) => {
    try {
        const result = await sql`
            SELECT * FROM weight_logs 
            WHERE user_id = ${req.userId}
            ORDER BY created_at DESC
        `;

        res.json({
            count: result.length,
            data: result
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch weight logs"});
    }
});


// POST to add water intake at endpoint /water
app.post("/water", authMiddleware, async (req, res) => {
    const { amount } = req.body;

    if(!amount || amount <= 0 || amount > 400)  {
        return res.status(400).json({ error: "Invalid water amount" });
    }

    try {
        const result = await sql`
            INSERT INTO water_logs (amount, user_id) 
            VALUES (${amount}, ${req.userId})
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            data: result[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save water intake"});
    }
});

// POST to add weight entry at enpoint /weight
app.post("/weight", authMiddleware, async (req, res) => {
    const { amount } = req.body;

    if(!amount || amount <= 0 || amount >= 1000) {
        return res.status(400).json({ error: "Invalid body weight"});
    }

    try {
        const result = await sql`
            INSERT INTO weight_logs (amount, user_id) 
            VALUES (${amount}, ${req.userId}) 
            RETURNING *
        `;
        
        res.status(201).json({
            success: true,
            data: result[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save body weight"});
    }
});

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

// start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});