const express  = require("express");
const cors     = require("cors");
require("dotenv").config();


const authRoutes     = require("./routes/authRoutes");
const trendRoutes    = require("./routes/trendRoutes");
const researchRoutes = require("./routes/researchRoutes");
const { startCronJob } = require("./cronJob");

const app = express();


app.use(cors());
app.use(express.json());

// Increase timeout for AI endpoints
app.use((req, res, next) => {
  res.setTimeout(120000);
  next();
});

app.use("/api/auth",     authRoutes);
app.use("/api/trends",   trendRoutes);
app.use("/api/research", researchRoutes);

app.get("/", (req, res) => res.send("API running"));

const PORT   = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start daily midnight cron job
  startCronJob();
});

server.keepAliveTimeout = 120000;
server.headersTimeout   = 121000;
