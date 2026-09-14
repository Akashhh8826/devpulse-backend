const store = require('../data/store');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

function getAllTasks(req, res, next) {
  try {
    const { projectId, status, priority, sort, view } = req.query;
    const tasks = store.findAllTasks({ projectId, status, priority, sort });

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

function getTaskById(req, res, next) {
  try {
    const { id } = req.params;
    const task = store.findTaskById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
}

function createTask(req, res, next) {
  try {
    // Verify target project exists
    const project = store.findProjectById(req.body.projectId);
    if (!project) {
      throw new BadRequestError(`Cannot create task: Project with ID '${req.body.projectId}' does not exist`);
    }

    const newTask = store.createTask(req.body);
    return sendCreated(res, newTask);
  } catch (err) {
    next(err);
  }
}

function updateTask(req, res, next) {
  try {
    const { id } = req.params;

    if (req.body.projectId) {
      const project = store.findProjectById(req.body.projectId);
      if (!project) {
        throw new BadRequestError(`Cannot update task: Project with ID '${req.body.projectId}' does not exist`);
      }
    }

    const updatedTask = store.updateTask(id, req.body);

    if (!updatedTask) {
      throw new NotFoundError(`Task with ID '${id}' not found`);
    }

    return sendSuccess(res, updatedTask);
  } catch (err) {
    next(err);
  }
}

function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = store.deleteTask(id);

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
  createTask,
  updateTask,
  deleteTask,
};
