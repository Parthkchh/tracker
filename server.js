const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const AIS_API_KEY = process.env.AISSTREAM_API_KEY;

if (!AIS_API_KEY) {
  console.error('AISSTREAM_API_KEY is not set in environment variables.');
  process.exit(1);
}

app.use(express.json());

let aisSocket;
let clients = [];

// Function to connect to AISstream
function connectToAISstream() {
  aisSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

  aisSocket.on('open', () => {
    console.log('Connected to AISstream.');

    // Subscribe to AIS data with a bounding box covering the entire globe
    const subscriptionMessage = {
      APIKey: AIS_API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
    };

    aisSocket.send(JSON.stringify(subscriptionMessage));
  });

  aisSocket.on('message', (data) => {
    const message = JSON.parse(data);
    // Broadcast the AIS data to all connected clients
    clients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  });

  aisSocket.on('close', () => {
    console.log('AISstream connection closed. Reconnecting in 5 seconds...');
    setTimeout(connectToAISstream, 5000);
  });

  aisSocket.on('error', (error) => {
    console.error('AISstream connection error:', error);
    aisSocket.close();
  });
}

// Start the connection to AISstream
connectToAISstream();

// Endpoint to serve the frontend (e.g., your map application)
app.use(express.static('public'));

// WebSocket server to communicate with frontend clients
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New client connected.');
  clients.push(ws);

  ws.on('close', () => {
    console.log('Client disconnected.');
    clients = clients.filter((client) => client !== ws);
  });

  ws.on('error', (error) => {
    console.error('Client connection error:', error);
  });
});
