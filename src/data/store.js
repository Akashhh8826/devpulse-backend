const { initialUsers, initialProjects, initialTasks, initialActivityLogs } = require('./seedData');

class DataStore {
  constructor() {
    this.users = [...initialUsers];
    this.projects = [...initialProjects];
    this.tasks = [...initialTasks];
    this.activityLogs = [...initialActivityLogs];

    this.userCounter = this.users.length + 1;
    this.projectCounter = this.projects.length + 1;
    this.taskCounter = this.tasks.length + 1;
    this.activityCounter = this.activityLogs.length + 1;
  }

  // --- LOG ACTIVITY ---
  addActivityLog(type, title, description, projectId = null) {
    const log = {
      id: `act-${this.activityCounter++}`,
      type,
      title,
      description,
      projectId,
      timestamp: new Date().toISOString(),
    };
    this.activityLogs.unshift(log); // Keep most recent first
    return log;
  }

  // --- PROJECT PROGRESS HELPER ---
  recalculateProjectProgress(projectId) {
    const projectTasks = this.tasks.filter((t) => t.projectId === projectId);
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) return;

    if (projectTasks.length === 0) {
      // Keep existing progress or 0
      return;
    }

    const completed = projectTasks.filter((t) => t.status === 'done').length;
    project.progress = Math.round((completed / projectTasks.length) * 100);
    project.updatedAt = new Date().toISOString();
  }

  // ==========================================
  // USERS DAL
  // ==========================================
  findAllUsers() {
    return [...this.users];
  }

  findUserById(id) {
    return this.users.find((u) => u.id === id) || null;
  }

  createUser(userData) {
    const now = new Date().toISOString();
    const newUser = {
      id: `user-${this.userCounter++}`,
      name: userData.name,
      email: userData.email,
      avatarInitials: userData.avatarInitials || userData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      theme: userData.theme || 'sunset-rose',
      sidebarCollapsed: userData.sidebarCollapsed ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id, updates) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const updatedUser = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  deleteUser(id) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  // ==========================================
  // PROJECTS DAL
  // ==========================================
  findAllProjects({ status, sort = 'recent' } = {}) {
    let result = [...this.projects];

    if (status) {
      const normalizedStatus = status.replace(/-/g, '_');
      result = result.filter((p) => p.status === normalizedStatus);
    }

    // Sorting
    switch (sort) {
      case 'progress':
        result.sort((a, b) => b.progress - a.progress);
        break;
      case 'dueDate':
        result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return result;
  }

  findProjectById(id) {
    return this.projects.find((p) => p.id === id) || null;
  }

  createProject(projectData) {
    const now = new Date().toISOString();
    const newProject = {
      id: `proj-${this.projectCounter++}`,
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'planning',
      progress: projectData.progress ?? 0,
      dueDate: projectData.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(newProject);

    this.addActivityLog(
      'project_created',
      `Project Created: ${newProject.name}`,
      `New project "${newProject.name}" was created.`,
      newProject.id
    );

    return newProject;
  }

  updateProject(id, updates) {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const oldProject = this.projects[index];
    const updatedProject = {
      ...oldProject,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.projects[index] = updatedProject;

    if (updates.status && updates.status !== oldProject.status) {
      this.addActivityLog(
        'project_status_changed',
        `Project Status Updated: ${updatedProject.name}`,
        `Status changed from ${oldProject.status} to ${updatedProject.status}.`,
        updatedProject.id
      );
    }

    return updatedProject;
  }

  deleteProject(id) {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const deletedProject = this.projects[index];
    this.projects.splice(index, 1);
    // Cascade delete associated tasks
    this.tasks = this.tasks.filter((t) => t.projectId !== id);

    this.addActivityLog(
      'project_deleted',
      `Project Deleted: ${deletedProject.name}`,
      `Project "${deletedProject.name}" and its tasks were removed.`
    );

    return true;
  }

  // ==========================================
  // TASKS DAL
  // ==========================================
  findAllTasks({ projectId, status, priority, sort = 'dueDate' } = {}) {
    let result = [...this.tasks];

    if (projectId) {
      result = result.filter((t) => t.projectId === projectId);
    }

    if (status) {
      const normalizedStatus = status.replace(/-/g, '_');
      result = result.filter((t) => t.status === normalizedStatus);
    }

    if (priority) {
      result = result.filter((t) => t.priority === priority);
    }

    if (sort === 'dueDate') {
      result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else if (sort === 'recent') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }

  findTaskById(id) {
    return this.tasks.find((t) => t.id === id) || null;
  }

  createTask(taskData) {
    const now = new Date().toISOString();
    const isDone = taskData.status === 'done';

    const newTask = {
      id: `task-${this.taskCounter++}`,
      projectId: taskData.projectId,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      createdAt: now,
      updatedAt: now,
      completedAt: isDone ? now : null,
    };

    this.tasks.push(newTask);
    this.recalculateProjectProgress(newTask.projectId);

    this.addActivityLog(
      'task_created',
      `Task Created: ${newTask.title}`,
      `New task added under project.`,
      newTask.projectId
    );

    return newTask;
  }

  updateTask(id, updates) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const oldTask = this.tasks[index];
    const now = new Date().toISOString();

    let completedAt = oldTask.completedAt;
    if (updates.status) {
      if (updates.status === 'done' && oldTask.status !== 'done') {
        completedAt = now;
      } else if (updates.status !== 'done' && oldTask.status === 'done') {
        completedAt = null;
      }
    }

    const updatedTask = {
      ...oldTask,
      ...updates,
      completedAt,
      updatedAt: now,
    };

    this.tasks[index] = updatedTask;
    this.recalculateProjectProgress(updatedTask.projectId);

    if (updates.status === 'done' && oldTask.status !== 'done') {
      this.addActivityLog(
        'task_completed',
        `Task Completed: ${updatedTask.title}`,
        `Task "${updatedTask.title}" marked as completed.`,
        updatedTask.projectId
      );
    }

    return updatedTask;
  }

  deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const deletedTask = this.tasks[index];
    this.tasks.splice(index, 1);
    this.recalculateProjectProgress(deletedTask.projectId);
    return true;
  }

  // ==========================================
  // DASHBOARD / ANALYTICS DAL
  // ==========================================
  getDashboardSummary() {
    const totalProjects = this.projects.length;
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter((t) => t.status === 'done').length;
    const pendingTasks = totalTasks - completedTasks;

    const now = new Date();
    const upcomingDeadlines = this.tasks
      .filter((t) => t.status !== 'done' && new Date(t.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const upcomingDeadlinesCount = upcomingDeadlines.length;
    const nextDeadlineDate = upcomingDeadlines[0] ? upcomingDeadlines[0].dueDate : null;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      upcomingDeadlinesCount,
      nextDeadlineDate,
    };
  }

  getDashboardVelocity() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const completedThisWeek = this.tasks.filter((t) => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= oneWeekAgo && completedDate <= now;
    }).length;

    const completedLastWeek = this.tasks.filter((t) => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= twoWeeksAgo && completedDate < oneWeekAgo;
    }).length;

    let sprintVelocity = 0;
    if (completedLastWeek === 0) {
      sprintVelocity = completedThisWeek > 0 ? 100 : 0;
    } else {
      sprintVelocity = Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100);
    }

    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter((t) => t.status === 'done').length;
    const overallCompletionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completedThisWeek,
      completedLastWeek,
      sprintVelocity,
      overallCompletionPercent,
    };
  }

  getDashboardActivity({ page = 1, limit = 10 } = {}) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedLogs = this.activityLogs.slice(startIndex, endIndex);

    return {
      logs: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: this.activityLogs.length,
        totalPages: Math.ceil(this.activityLogs.length / limitNum) || 1,
      },
    };
  }

  getDashboardInsight() {
    const summary = this.getDashboardSummary();
    const velocity = this.getDashboardVelocity();

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
