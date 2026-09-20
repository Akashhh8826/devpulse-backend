const mongoose = require('mongoose');

/**
 * Connect to MongoDB database via Mongoose using MONGODB_URI
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devpulse';

  try {
    const conn = await mongoose.connect(uri);
    console.log(` 🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ FATAL: MongoDB Connection Failed! ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
