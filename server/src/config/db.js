import mongoose from "mongoose";

/**
 * Connects to MongoDB using the URI stored in environment variables.
 * Exported as a standalone function so server.js controls when it runs.
 * Exits the process on failure — a crashed DB connection is unrecoverable at startup.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
