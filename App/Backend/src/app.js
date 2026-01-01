require('dotenv').config();

const express = require("express");
const app = express();

const authRoutes = require("./routes/authRoutes/auth");
const waterRoutes = require("./routes/waterRoutes/water");
const weightRoutes = require("./routes/weightRoutes/weight");


app.use(express.json());

app.use("/auth", authRoutes);
app.use("/water", waterRoutes);
app.use("/weight", weightRoutes);

module.exports = app;