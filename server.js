const express = require("express");
const axios = require("axios");
const app = express();

const AISSTREAM_API_KEY = "your-aisstream-api-key"; // Replace with your actual API key

app.get("/api/ships", async (req, res) => {
  try {
    const response = await axios.get("https://api.aisstream.io/v1/live", {
      headers: {
        Authorization: `Bearer ${AISSTREAM_API_KEY}`,
      },
      params: {
        mmsi: req.query.mmsi, // Pass MMSI as query parameter
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching AIS data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
