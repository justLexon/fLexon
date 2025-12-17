// express server
const express = require("express");

// port 3000
const app = express();
const PORT = 3000;

// use json format
app.use(express.json());


// GET method for endpoint /health
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend running" });
});

// POST method for endpoint /water
const waterLogs = [];

app.post("/water", (req, res) => {
    const { amount } = req.body;

    if(!amount || amount <= 0)  {
        return res.status(400).json({ error: "Invalid water amount" });
    }

    const entry = {
        amount,
        timestamp: new Date()
    };

    waterLogs.push(entry);

    res.status(201).json({
        success: true,
        waterEntry: entry
    });
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