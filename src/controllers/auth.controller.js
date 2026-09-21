const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
const { sendSuccess, sendCreated } = require('../utils/response');

function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'default-devpulse-secret-key';
  return jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const count = await User.countDocuments();
    const id = `user-${count + 1}-${Date.now()}`;
    const avatarInitials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'UR';

    const newUser = await User.create({
      id,
      name,
      email: email.toLowerCase(),
      avatarInitials,
      passwordHash,
    });

    const token = generateToken(newUser);
    const safeUser = newUser.toJSON();

    return sendCreated(res, {
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user);
    const safeUser = user.toJSON();

    return sendSuccess(res, {
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const safeUser = req.user.toJSON ? req.user.toJSON() : req.user;
    return sendSuccess(res, safeUser);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please drop the JWT token from client storage.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  logout,
};
