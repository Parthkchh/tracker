const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000; // Render will set this environment variable

// Route for fetching AISstream ship data
app.get("/api/ships", async (req, res) => {
  const { mmsi } = req.query;

  if (!mmsi) {
    return res.status(400).json({ error: "MMSI is required as a query parameter." });
  }

  try {
    const response = await axios.get("https://api.aisstream.io/v1/positions", {
      headers: {
        Authorization: `Bearer ${process.env.AISSTREAM_API_KEY}`, // Use the environment variable for the API key
      },
      params: { mmsi },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch data from AISstream." });
  }
});

// Root route for testing the server
app.get("/", (req, res) => {
  res.send("AISstream Proxy Server is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
