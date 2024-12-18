const mongoose = require("mongoose");
const redis = require("redis");

// MongoDB connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/quiz-app", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URI,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect();

module.exports = { connectMongoDB, redisClient };
