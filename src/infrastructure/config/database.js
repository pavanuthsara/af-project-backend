const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
      };

      this.connection = await mongoose.connect(process.env.MONGO_URI);

      console.log(`MongoDB connected: ${this.connection.connection.host}`);

      // Handle connection events
      mongoose.connection.on("connected", () => {
        console.log("Mongoose connected to MongoDB Atlas");
      });

      mongoose.connection.on("error", (err) => {
        console.error("Mongoose connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("Mongoose disconnected from MongoDB Atlas");
      });

      return this.connection;
    } catch (error) {
      console.error("Error connecting to MongoDB:", error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  }

  async getConnection() {
    return this.connection;
  }
}

module.exports = new Database();
