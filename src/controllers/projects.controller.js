const mongoose = require('mongoose');
const store = require('../data/store');
const User = require('../models/User');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

async function checkProjectOwnerPermission(projectDoc, user, actionMessage) {
  if (!projectDoc || !projectDoc.ownerId || !user) {
    return;
  }

  const ownerIdRaw = projectDoc.ownerId;
  const ownerIdStr = ownerIdRaw.toString();
  const userIdStr = user._id ? user._id.toString() : '';
  const userPublicIdStr = user.id ? user.id.toString() : '';

  if (ownerIdStr === userIdStr || ownerIdStr === userPublicIdStr) {
    return;
  }

  try {
    let ownerUser = null;
    if (mongoose.isValidObjectId(ownerIdRaw)) {
      ownerUser = await User.findById(ownerIdRaw);
    }
    if (!ownerUser) {
      ownerUser = await User.findOne({ id: ownerIdStr });
    }

    if (ownerUser) {
      if (
        ownerUser._id.toString() === userIdStr ||
        ownerUser.id === userPublicIdStr ||
        (ownerUser.email && user.email && ownerUser.email.toLowerCase() === user.email.toLowerCase())
      ) {
        return;
      }
    }
  } catch (err) {
    // Ignore DB lookup error and proceed to throw ForbiddenError
  }

  throw new ForbiddenError(actionMessage);
}

async function getAllProjects(req, res, next) {
  try {
    const { status, sort } = req.query;
    const projects = await store.findAllProjects({ status, sort });
    return sendSuccess(res, projects, 200, { total: projects.length });
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;
    const project = await store.findProjectById(id);

    if (!project) {
      throw new NotFoundError(`Project with ID '${id}' not found`);
    }

    return sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const ownerId = req.user ? req.user._id : undefined;
    const newProject = await store.createProject({
      ...req.body,
      ownerId,
    });
    return sendCreated(res, newProject);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const projectDoc = await store.findProjectDocById(id);

    if (!projectDoc) {
      throw new NotFoundError(`Project with ID '${id}' not found`);
    }

    await checkProjectOwnerPermission(
      projectDoc,
      req.user,
      'You do not have permission to modify this project'
    );

    const updatedProject = await store.updateProject(id, req.body);
    return sendSuccess(res, updatedProject);
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const projectDoc = await store.findProjectDocById(id);

    if (!projectDoc) {
      throw new NotFoundError(`Project with ID '${id}' not found`);
    }

    await checkProjectOwnerPermission(
      projectDoc,
      req.user,
      'You do not have permission to delete this project'
    );

    const deleted = await store.deleteProject(id);
    if (!deleted) {
      throw new NotFoundError(`Project with ID '${id}' could not be deleted`);
    }

    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
