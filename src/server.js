require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` 🚀 DevPulse REST API Backend running on port ${PORT}`);
    console.log(` 🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` 🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down server gracefully...', err);
    server.close(() => {
      process.exit(1);
    });
  });
}

startServer();
