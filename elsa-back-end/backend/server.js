require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { connectMongoDB, redisClient } = require("./config/db");
const apiRoutes = require("./routes/api");
const initializeSocketIO = require("./websocket/quizHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB
connectMongoDB();

// Reset Redis data on server start
async function resetRedis() {
  try {
    // Clear all data in Redis
    await redisClient.flushAll();
  } catch (error) {
    console.error("Error clearing Redis data:", error);
  }
}

// Initialize server
async function initializeServer() {
  await resetRedis();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api", apiRoutes);

  // Initialize Socket.IO handlers
  initializeSocketIO(io);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initializeServer();
