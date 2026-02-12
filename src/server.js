const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const database = require("./infrastructure/config/database");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req, res) => {
  const dbHealth = await database.healthCheck();
  const connectionState = database.getConnectionState();

  res.status(dbHealth.healthy ? 200 : 503).json({
    status: dbHealth.healthy ? "healthy" : "unhealthy",
    database: {
      state: connectionState,
      healthy: dbHealth.healthy,
      timestamp: dbHealth.timestamp,
    },
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await database.connect();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
