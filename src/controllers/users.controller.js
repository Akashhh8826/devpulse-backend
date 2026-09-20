const store = require('../data/store');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

async function getAllUsers(req, res, next) {
  try {
    const users = await store.findAllUsers();
    return sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

async function getUserProfile(req, res, next) {
  try {
    // Default to first user if no ID specified, or retrieve by param id
    const userId = req.params.id || 'user-1';
    const user = await store.findUserById(userId);

    if (!user) {
      throw new NotFoundError(`User with ID '${userId}' not found`);
    }

    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const newUser = await store.createUser(req.body);
    return sendCreated(res, newUser);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = req.params.id || 'user-1';
    const updatedUser = await store.updateUser(userId, req.body);

    if (!updatedUser) {
      throw new NotFoundError(`User with ID '${userId}' not found`);
    }

    return sendSuccess(res, updatedUser);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await store.deleteUser(id);

    if (!deleted) {
      throw new NotFoundError(`User with ID '${id}' not found`);
    }

    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getUserProfile,
  createUser,
  updateUser,
  deleteUser,
};
