const store = require('../data/store');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

async function getAllTasks(req, res, next) {
  try {
    const { projectId, status, priority, sort, view, populate } = req.query;
    const tasks = await store.findAllTasks({ projectId, status, priority, sort, populate });

    if (view === 'kanban') {
      const kanbanBoard = {
        todo: tasks.filter((t) => t.status === 'todo'),
        in_progress: tasks.filter((t) => t.status === 'in_progress'),
        done: tasks.filter((t) => t.status === 'done'),
      };
      return sendSuccess(res, kanbanBoard, 200, { total: tasks.length });
    }

    return sendSuccess(res, tasks, 200, { total: tasks.length });
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;
    const { populate } = req.query;
    const task = await store.findTaskById(id, { populate });

    if (!task) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
}

async function getTaskFull(req, res, next) {
  try {
    const { id } = req.params;
    const task = await store.findTaskById(id, { populate: 'project' });

    if (!task) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    // Verify target project exists
    const projectDoc = await store.findProjectDocById(req.body.projectId);
    if (!projectDoc) {
      throw new BadRequestError(`Cannot create task: Project with ID '${req.body.projectId}' does not exist`);
    }

    if (projectDoc.ownerId && req.user && projectDoc.ownerId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to create tasks in this project');
    }

    const newTask = await store.createTask(req.body);
    return sendCreated(res, newTask);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const existingTask = await store.findTaskById(id);
    if (!existingTask) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

    const targetProjectPublicId = req.body.projectId || existingTask.projectId;
    const projectDoc = await store.findProjectDocById(targetProjectPublicId);
    if (!projectDoc) {
      throw new BadRequestError(`Cannot update task: Project with ID '${targetProjectPublicId}' does not exist`);
    }

    if (projectDoc.ownerId && req.user && projectDoc.ownerId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to modify tasks in this project');
    }

    const updatedTask = await store.updateTask(id, req.body);
    return sendSuccess(res, updatedTask);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const existingTask = await store.findTaskById(id);
    if (!existingTask) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

    const projectDoc = await store.findProjectDocById(existingTask.projectId);
    if (projectDoc && projectDoc.ownerId && req.user && projectDoc.ownerId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to delete tasks from this project');
    }

    await store.deleteTask(id);
    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTasks,
  getTaskById,
  getTaskFull,
  createTask,
  updateTask,
  deleteTask,
};
