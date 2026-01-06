const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "https://flexon.vercel.app", // production frontend
];

module.exports = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});
