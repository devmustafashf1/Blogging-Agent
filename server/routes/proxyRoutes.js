const express = require("express");
const axios   = require("axios");
const router  = express.Router();

// POST /api/proxy/custom
// Body: { targetUrl, token?, method?, body? }
// Forwards the request server-side (bypasses browser CORS)
router.post("/custom", async (req, res) => {
  const { targetUrl, token, method = "POST", body } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ success: false, message: "targetUrl is required" });
  }

  // Only allow http/https targets
  if (!/^https?:\/\//.test(targetUrl)) {
    return res.status(400).json({ success: false, message: "Invalid targetUrl scheme" });
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await axios({
      method,
      url: targetUrl,
      headers,
      data: body || undefined,
      timeout: 15000,
      validateStatus: () => true, // pass all status codes through
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(502).json({ success: false, message: err.message });
  }
});

module.exports = router;
