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
  user: "t",
  host: "t",
  database: "t",
  password: "t",
  port: 5432,
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
app.get("/water", (req, res) => {
    res.json({
        count: waterLogs.length,
        data: waterLogs
    });
});

// POST method for endpoint /water
app.post("/water", async (req, res) => {
    const { amount } = req.body;

    if(!amount || amount <= 0)  {
        return res.status(400).json({ error: "Invalid water amount" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO water_logs (amount) VALUES ($1) RETURNING *",
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

// POST method for enpoint /weight
const weightLogs = [];

app.post("/weight", (req, res) => {
    const { amount } = req.body;

    if(!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid body weight"});
    }

    const entry = {
        amount,
        timestamp: new Date()
    };

    weightLogs.push(entry);

    res.status(201).json({
        success: true,
        weightEntry: entry
    });
});


// start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});