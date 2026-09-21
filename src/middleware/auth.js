const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Authentication Middleware
 * Expects header format: Authorization: Bearer <token>
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    const secret = process.env.JWT_SECRET || 'default-devpulse-secret-key';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    // Find user by public string id or MongoDB _id
    let user;
    if (decoded.userId) {
      user = await User.findOne({ id: decoded.userId });
      if (!user) {
        user = await User.findById(decoded.userId);
      }
    } else if (decoded.id) {
      user = await User.findOne({ id: decoded.id });
    }

    if (!user) {
      throw new UnauthorizedError('User associated with token not found');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticateToken;
