const store = require('../data/store');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

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

    if (projectDoc.ownerId && req.user && projectDoc.ownerId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to modify this project');
    }

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

    if (projectDoc.ownerId && req.user && projectDoc.ownerId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to delete this project');
    }

    await store.deleteProject(id);
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
