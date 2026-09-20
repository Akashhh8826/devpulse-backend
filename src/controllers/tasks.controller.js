const store = require('../data/store');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

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
    const project = await store.findProjectById(req.body.projectId);
    if (!project) {
      throw new BadRequestError(`Cannot create task: Project with ID '${req.body.projectId}' does not exist`);
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

    if (req.body.projectId) {
      const project = await store.findProjectById(req.body.projectId);
      if (!project) {
        throw new BadRequestError(`Cannot update task: Project with ID '${req.body.projectId}' does not exist`);
      }
    }

    const updatedTask = await store.updateTask(id, req.body);

    if (!updatedTask) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

    return sendSuccess(res, updatedTask);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await store.deleteTask(id);

    if (!deleted) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

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
