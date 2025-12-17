require('dotenv').config();

// env variables
const USER = process.env.USER;
const HOST = process.env.HOST;
const DATABASE = process.env.DATABASE;
const PASSWORD = process.env.PASSWORD;
const DBPORT = process.env.DBPORT;

// express server
const express = require("express");
// progress
const { Pool } = require("pg");
// encryption
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// port 3000
const app = express();
const PORT = 3000;

// use json format
app.use(express.json());

// postgres connection
const pool = new Pool({
  user: USER,
  host: HOST,
  database: DATABASE,
  password: PASSWORD,
  port: DBPORT,
});

// temp
app.get("/db_test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ success: true, time: result.rows[0] });
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
app.get("/water", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM water_logs"
        );

        res.json({
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch water logs"});
    }
});

// GET method for endpoint /weight
app.get("/weight", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM weight_logs"
        );

        res.json({
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch weight logs"});
    }
});

// Secure later
// // GET method for endpoint /users
// app.get("/users", async (req, res) => {
//     try {
//         const result = await pool.query(
//             "SELECT * FROM users"
//         );

//         res.json({
//             count: result.rows.length,
//             data: result.rows
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Failed to fetch users"});
//     }
// });

// POST to add water intake at endpoint /water
app.post("/water", async (req, res) => {
    const { amount } = req.body;

    if(!amount || amount <= 0)  {
        return res.status(400).json({ error: "Invalid water amount" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO water_logs (amount) VALUES ($1)",
            [amount]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save water intake"});
    }
});

// POST to add weight entry at enpoint /weight
app.post("/weight", async (req, res) => {
    const { amount } = req.body;

    if(!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid body weight"});
    }

    try {
        const result = await pool.query(
            "INSERT INTO weight_logs (amount) VALUES ($1) RETURNING *",
            [amount]
        );
        
        res.status(201).json({
            success: true,
            data: result.rows[0]
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
        return res.status(400).json({ error: "Passwowrd must be at least 6 characters"});
    }

    try {
        const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "User already exists"});
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
            [email, passwordHash]
        );

        res.status(201).json({ 
            success: true,
            user: result.rows[0],
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
        const result = await pool.query(
            "SELECT id, email, password_hash FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials"});
        }

        const user = result.rows[0];

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