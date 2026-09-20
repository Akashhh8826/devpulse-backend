const mongoose = require('mongoose');

/**
 * Connect to MongoDB database via Mongoose
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devpulse';

  try {
    const conn = await mongoose.connect(uri, {
      // Modern mongoose default options
    });
    console.log(` 🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ FATAL: MongoDB Connection Failed! Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
