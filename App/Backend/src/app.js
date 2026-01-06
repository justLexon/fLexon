require('dotenv').config();
const corsConfig = require("./config/cors");

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes/auth");
const waterRoutes = require("./routes/waterRoutes/water");
const weightRoutes = require("./routes/weightRoutes/weight");


app.use(express.json());
app.use(corsConfig);
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/water", waterRoutes);
app.use("/weight", weightRoutes);

module.exports = app;