const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

function buildIdFilter(idKey, idValue) {
  if (!idValue) return { [idKey]: null };
  const filter = [{ [idKey]: idValue }];
  if (mongoose.isValidObjectId(idValue)) {
    filter.push({ _id: idValue });
  }
  return { $or: filter };
}

class DataStore {
  // --- LOG ACTIVITY ---
  async addActivityLog(type, title, description, projectId = null) {
    const count = await Activity.countDocuments();
    const id = `act-${count + 1}-${Date.now()}`;
    const log = await Activity.create({
      id,
      type,
      title,
      description,
      projectId,
      timestamp: new Date(),
    });
    return log.toJSON();
  }

  // --- PROJECT PROGRESS HELPER ---
  async recalculateProjectProgress(projectPublicId) {
    if (!projectPublicId) return;

    const project = await Project.findOne(buildIdFilter('id', projectPublicId));
    if (!project) return;

    const projectTasks = await Task.find({
      $or: [{ projectId: project._id }, { projectPublicId: project.id }],
    });
    if (projectTasks.length === 0) return;

    const completedCount = projectTasks.filter((t) => t.status === 'done').length;
    project.progress = Math.round((completedCount / projectTasks.length) * 100);
    await project.save();
  }

  // ==========================================
  // USERS DAL
  // ==========================================
  async findAllUsers() {
    const users = await User.find().sort({ createdAt: 1 });
    return users.map((u) => u.toJSON());
  }

  async findUserById(id) {
    const user = await User.findOne(buildIdFilter('id', id));
    return user ? user.toJSON() : null;
  }

  async createUser(userData) {
    const count = await User.countDocuments();
    const id = userData.id || `user-${count + 1}-${Date.now()}`;
    const avatarInitials =
      userData.avatarInitials ||
      (userData.name
        ? userData.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'UR');

    const newUser = await User.create({
      id,
      name: userData.name,
      email: userData.email,
      avatarInitials,
      theme: userData.theme || 'sunset-rose',
      sidebarCollapsed: userData.sidebarCollapsed ?? false,
    });

    return newUser.toJSON();
  }

  async updateUser(id, updates) {
    const user = await User.findOneAndUpdate(buildIdFilter('id', id), updates, {
      new: true,
      runValidators: true,
    });
    return user ? user.toJSON() : null;
  }

  async deleteUser(id) {
    const user = await User.findOneAndDelete(buildIdFilter('id', id));
    return !!user;
  }

  // ==========================================
  // PROJECTS DAL
  // ==========================================
  async findAllProjects({ status, sort = 'recent' } = {}) {
    const filter = {};
    if (status) {
      filter.status = status.replace(/-/g, '_');
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'progress':
        sortOption = { progress: -1 };
        break;
      case 'dueDate':
        sortOption = { dueDate: 1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'recent':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const projects = await Project.find(filter).sort(sortOption);
    return projects.map((p) => p.toJSON());
  }

  async findProjectById(id) {
    const project = await Project.findOne(buildIdFilter('id', id));
    return project ? project.toJSON() : null;
  }

  async findProjectDocById(id) {
    if (!id) return null;
    return await Project.findOne(buildIdFilter('id', id));
  }

  async createProject(projectData) {
    const count = await Project.countDocuments();
    const id = projectData.id || `proj-${count + 1}-${Date.now()}`;

    const newProject = await Project.create({
      id,
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'planning',
      progress: projectData.progress ?? 0,
      dueDate: projectData.dueDate,
      ownerId: projectData.ownerId || null,
    });

    await this.addActivityLog(
      'project_created',
      `Project Created: ${newProject.name}`,
      `New project "${newProject.name}" was created.`,
      newProject.id
    );

    return newProject.toJSON();
  }

  async updateProject(id, updates) {
    const project = await Project.findOne(buildIdFilter('id', id));
    if (!project) return null;

    const oldStatus = project.status;
    Object.assign(project, updates);
    await project.save();

    if (updates.status && updates.status !== oldStatus) {
      await this.addActivityLog(
        'project_status_changed',
        `Project Status Updated: ${project.name}`,
        `Status changed from ${oldStatus} to ${project.status}.`,
        project.id
      );
    }

    return project.toJSON();
  }

  async deleteProject(id) {
    const project = await Project.findOne(buildIdFilter('id', id));
    if (!project) return false;

    // Cascade delete associated tasks referencing project's _id or public id
    await Task.deleteMany({
      $or: [{ projectId: project._id }, { projectPublicId: project.id }],
    });

    await Project.deleteOne({ _id: project._id });

    await this.addActivityLog(
      'project_deleted',
      `Project Deleted: ${project.name}`,
      `Project "${project.name}" and its tasks were removed.`
    );

    return true;
  }

  // ==========================================
  // TASKS DAL
  // ==========================================
  async findAllTasks({ projectId, status, priority, sort = 'dueDate', populate } = {}) {
    const filter = {};

    if (projectId) {
      const project = await Project.findOne(buildIdFilter('id', projectId));
      if (project) {
        filter.$or = [{ projectId: project._id }, { projectPublicId: project.id }];
      } else {
        const altFilter = [{ projectPublicId: projectId }];
        if (mongoose.isValidObjectId(projectId)) {
          altFilter.push({ projectId: projectId });
        }
        filter.$or = altFilter;
      }
    }
    if (status) {
      filter.status = status.replace(/-/g, '_');
    }
    if (priority) {
      filter.priority = priority;
    }

    let sortOption = { dueDate: 1 };
    if (sort === 'recent') {
      sortOption = { createdAt: -1 };
    }

    let query = Task.find(filter).sort(sortOption);

    if (populate === 'project' || populate === true || populate === 'true') {
      query = query.populate('projectId');
    }

    const tasks = await query;
    return tasks.map((t) => t.toJSON());
  }

  async findTaskById(id, { populate } = {}) {
    let query = Task.findOne(buildIdFilter('id', id));
    if (populate === 'project' || populate === true || populate === 'true') {
      query = query.populate('projectId');
    }

    const task = await query;
    return task ? task.toJSON() : null;
  }

  async createTask(taskData) {
    const project = await Project.findOne(buildIdFilter('id', taskData.projectId));
    if (!project) {
      return null;
    }

    const count = await Task.countDocuments();
    const id = taskData.id || `task-${count + 1}-${Date.now()}`;
    const isDone = taskData.status === 'done';
    const completedAt = isDone ? new Date() : null;

    const newTask = await Task.create({
      id,
      projectId: project._id,
      projectPublicId: project.id,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      completedAt,
    });

    await this.recalculateProjectProgress(project.id);

    await this.addActivityLog(
      'task_created',
      `Task Created: ${newTask.title}`,
      `New task added under project.`,
      project.id
    );

    return newTask.toJSON();
  }

  async updateTask(id, updates) {
    const task = await Task.findOne(buildIdFilter('id', id));
    if (!task) return null;

    const oldStatus = task.status;
    let completedAt = task.completedAt;

    if (updates.projectId) {
      const project = await Project.findOne(buildIdFilter('id', updates.projectId));
      if (project) {
        task.projectId = project._id;
        task.projectPublicId = project.id;
      }
    }

    if (updates.status) {
      if (updates.status === 'done' && oldStatus !== 'done') {
        completedAt = new Date();
      } else if (updates.status !== 'done' && oldStatus === 'done') {
        completedAt = null;
      }
    }

    Object.assign(task, updates);
    task.completedAt = completedAt;
    await task.save();

    await this.recalculateProjectProgress(task.projectPublicId);

    if (updates.status === 'done' && oldStatus !== 'done') {
      await this.addActivityLog(
        'task_completed',
        `Task Completed: ${task.title}`,
        `Task "${task.title}" marked as completed.`,
        task.projectPublicId
      );
    }

    return task.toJSON();
  }

  async deleteTask(id) {
    const task = await Task.findOne(buildIdFilter('id', id));
    if (!task) return false;

    await Task.deleteOne({ _id: task._id });
    await this.recalculateProjectProgress(task.projectPublicId);
    return true;
  }

  // ==========================================
  // DASHBOARD / ANALYTICS DAL
  // ==========================================
  async getDashboardSummary() {
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'done' });
    const pendingTasks = totalTasks - completedTasks;

    const now = new Date();
    const upcomingTasks = await Task.find({
      status: { $ne: 'done' },
      dueDate: { $gte: now },
    }).sort({ dueDate: 1 });

    const upcomingDeadlinesCount = upcomingTasks.length;
    const nextDeadlineDate = upcomingTasks[0] ? upcomingTasks[0].dueDate : null;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      upcomingDeadlinesCount,
      nextDeadlineDate,
    };
  }

  async getDashboardVelocity() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const completedThisWeek = await Task.countDocuments({
      completedAt: { $gte: oneWeekAgo, $lte: now },
    });

    const completedLastWeek = await Task.countDocuments({
      completedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
    });

    let sprintVelocity = 0;
    if (completedLastWeek === 0) {
      sprintVelocity = completedThisWeek > 0 ? 100 : 0;
    } else {
      sprintVelocity = Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100);
    }

    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'done' });
    const overallCompletionPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completedThisWeek,
      completedLastWeek,
      sprintVelocity,
      overallCompletionPercent,
    };
  }

  async getDashboardActivity({ page = 1, limit = 10 } = {}) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalItems = await Activity.countDocuments();
    const logs = await Activity.find()
      .sort({ timestamp: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return {
      logs: logs.map((a) => a.toJSON()),
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum) || 1,
      },
    };
  }

  async getDashboardInsight() {
    const summary = await this.getDashboardSummary();
    const velocity = await this.getDashboardVelocity();

    let tip = '';
    if (summary.totalTasks === 0) {
      tip = 'No tasks created yet. Start by creating a project and adding actionable tasks!';
    } else if (velocity.overallCompletionPercent >= 80) {
      tip = 'Outstanding velocity! You have completed over 80% of your project tasks. Keep up the high momentum!';
    } else if (velocity.sprintVelocity > 0) {
      tip = `Great momentum! Task completion rate increased by ${velocity.sprintVelocity}% compared to last week.`;
    } else if (summary.pendingTasks > 5) {
      tip = `You currently have ${summary.pendingTasks} pending tasks. Consider prioritizing high-urgency tasks first.`;
    } else {
      tip = 'Maintain steady focus. Tackling 2-3 key tasks daily will keep your project velocity optimal.';
    }

    return {
      insight: tip,
      metrics: {
        completionRate: velocity.overallCompletionPercent,
        sprintVelocity: velocity.sprintVelocity,
      },
    };
  }
}

// Singleton DataStore instance
const store = new DataStore();

module.exports = store;
