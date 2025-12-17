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

// GET method for endpoint /users
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM users"
        );

        res.json({
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch users"});
    }
});

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
            "INSERT INTO weight_logs (amount) VALUES ($1)",
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


// POST to create user at endpoint /users
app.post("/users", async (req, res) => {
    const {userEmail, userPassword} = req.body;

    const hashed = "TEMP_HAS";

    const result = await pool.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id,, email",
        [userEmail, hashed]
    );

    res.json(result.rows[0]);
})


// start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});