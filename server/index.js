const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const authRoutes  = require("./routes/authRoutes");
const trendRoutes = require("./routes/trendRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Increase server timeout to 120s for AI endpoints
// Default is 5s in some environments — not enough for DeepSeek
app.use((req, res, next) => {
  res.setTimeout(120000); // 120 seconds
  next();
});

app.use("/api/auth",   authRoutes);
app.use("/api/trends", trendRoutes);

app.get("/", (req, res) => res.send("API running"));

const PORT   = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Also set server-level keep-alive timeout
server.keepAliveTimeout = 120000;
server.headersTimeout   = 121000;