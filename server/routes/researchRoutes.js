const express  = require("express");
const router   = express.Router();
const { streamResearch, proxyImage } = require("../controllers/researchController");

// GET /api/research/stream?topic=...&geo=US
router.get("/stream", streamResearch);

// GET /api/research/image?url=...  (proxy to bypass hotlink protection)
router.get("/image", proxyImage);

module.exports = router;
