const express = require("express");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;
const AIS_API_KEY = process.env.AISSTREAM_API_KEY;

if (!AIS_API_KEY) {
  console.error("AISSTREAM_API_KEY is not set in environment variables.");
  process.exit(1);
}

app.use(express.json());

// WebSocket connection to AISstream
let aisSocket;
let clients = [];

// Function to connect to AISstream WebSocket
function connectToAISstream() {
  aisSocket = new WebSocket("wss://stream.aisstream.io/v0/stream");

  aisSocket.on("open", () => {
    console.log("Connected to AISstream WebSocket.");

    // Subscription message
    const subscriptionMessage = {
      Apikey: AIS_API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]], // Global bounding box
      FiltersShipMMSI: [], // Optional: Add specific MMSI filters
      FilterMessageTypes: ["PositionReport"], // Optional
    };

    aisSocket.send(JSON.stringify(subscriptionMessage));
  });

  aisSocket.on("message", (data) => {
    const aisMessage = JSON.parse(data);
    console.log("Received data from AISstream:", aisMessage);

    // Broadcast the AISstream data to all connected clients
    clients.forEach((client) => {
      client.send(JSON.stringify(aisMessage));
    });
  });

  aisSocket.on("close", () => {
    console.log("AISstream WebSocket connection closed. Reconnecting in 5 seconds...");
    setTimeout(connectToAISstream, 5000);
  });

  aisSocket.on("error", (error) => {
    console.error("AISstream WebSocket error:", error);
    aisSocket.close();
  });
}

// Start AISstream WebSocket connection
connectToAISstream();

// Endpoint for root route
app.get("/", (req, res) => {
  res.send("AISstream Proxy Server is running!");
});

// WebSocket server to communicate with frontend clients
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New frontend WebSocket client connected.");
  clients.push(ws);

  ws.on("close", () => {
    console.log("Frontend WebSocket client disconnected.");
    clients = clients.filter((client) => client !== ws);
  });

  ws.on("error", (error) => {
    console.error("Frontend WebSocket error:", error);
  });
});
