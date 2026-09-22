const mongoose = require('mongoose');
const store = require('../data/store');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { sendSuccess, sendCreated } = require('../utils/response');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

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

async function suggestTasks(req, res, next) {
  try {
    const { projectId } = req.body;
    const project = await store.findProjectDocById(projectId);

    if (!project) {
      throw new NotFoundError(`Project with ID '${projectId}' not found`);
    }

    await checkProjectOwnerPermission(
      project,
      req.user,
      'You do not have permission to request suggestions for this project'
    );

    const suggestions = await aiService.suggestTasksForProject(project.name, project.description);
    return sendSuccess(res, suggestions);
  } catch (err) {
    next(err);
  }
}

async function acceptTasks(req, res, next) {
  try {
    const { projectId, tasks } = req.body;
    const project = await store.findProjectDocById(projectId);

    if (!project) {
      throw new NotFoundError(`Project with ID '${projectId}' not found`);
    }

    await checkProjectOwnerPermission(
      project,
      req.user,
      'You do not have permission to accept suggestions for this project'
    );

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new BadRequestError('At least one task must be provided');
    }

    const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const createdTasks = [];

    for (const taskItem of tasks) {
      const created = await store.createTask({
        projectId: project.id,
        title: taskItem.title,
        priority: taskItem.priority || 'medium',
        description: taskItem.rationale || taskItem.description || '',
        status: 'todo',
        dueDate: taskItem.dueDate || defaultDueDate,
      });
      createdTasks.push(created);
    }

    return sendCreated(res, createdTasks);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  suggestTasks,
  acceptTasks,
};
