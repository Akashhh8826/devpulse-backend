const store = require('../data/store');
const aiService = require('../services/aiService');
const { sendSuccess, sendCreated } = require('../utils/response');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

async function suggestTasks(req, res, next) {
  try {
    const { projectId } = req.body;
    const project = await store.findProjectDocById(projectId);

    if (!project) {
      throw new NotFoundError(`Project with ID '${projectId}' not found`);
    }

    if (project.ownerId && req.user && project.ownerId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to request suggestions for this project');
    }

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

    if (project.ownerId && req.user && project.ownerId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to accept suggestions for this project');
    }

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
