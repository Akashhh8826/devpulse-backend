const { z } = require('zod');
const { ValidationError } = require('../utils/errors');

// Helper to normalize enum strings like 'in-progress' -> 'in_progress', 'on-hold' -> 'on_hold'
const normalizeStatus = (val) => {
  if (typeof val === 'string') {
    return val.replace(/-/g, '_');
  }
  return val;
};

// Project Validation Schemas
const createProjectSchema = z.object({
  name: z.string({ required_error: 'Project name is required' }).min(1, 'Project name cannot be empty'),
  description: z.string().optional().default(''),
  status: z
    .preprocess(normalizeStatus, z.enum(['planning', 'in_progress', 'completed', 'on_hold'], {
      errorMap: () => ({ message: 'Status must be one of: planning, in_progress, completed, on_hold' }),
    }))
    .default('planning'),
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100').default(0),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'dueDate must be a valid ISO date string',
  }),
});

const updateProjectSchema = createProjectSchema.partial();

// Task Validation Schemas
const createTaskSchema = z.object({
  projectId: z.string({ required_error: 'projectId is required' }).min(1, 'projectId cannot be empty'),
  title: z.string({ required_error: 'Task title is required' }).min(1, 'Task title cannot be empty'),
  description: z.string().optional().default(''),
  status: z
    .preprocess(normalizeStatus, z.enum(['todo', 'in_progress', 'done'], {
      errorMap: () => ({ message: 'Status must be one of: todo, in_progress, done' }),
    }))
    .default('todo'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be one of: low, medium, high' }),
  }).default('medium'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'dueDate must be a valid ISO date string',
  }),
});

const updateTaskSchema = createTaskSchema.partial();

// User Validation Schemas
const createUserSchema = z.object({
  name: z.string({ required_error: 'User name is required' }).min(1, 'User name cannot be empty'),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
  avatarInitials: z.string().optional().default(''),
  theme: z.string().optional().default('sunset-rose'),
  sidebarCollapsed: z.boolean().optional().default(false),
});

const updateUserSchema = createUserSchema.partial();

// Auth Validation Schemas
const registerSchema = z.object({
  name: z.string({ required_error: 'User name is required' }).min(1, 'User name cannot be empty'),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
});

// AI Validation Schemas
const aiSuggestSchema = z.object({
  projectId: z.string({ required_error: 'projectId is required' }).min(1, 'projectId cannot be empty'),
});

const aiAcceptSchema = z.object({
  projectId: z.string({ required_error: 'projectId is required' }).min(1, 'projectId cannot be empty'),
  tasks: z.array(
    z.object({
      title: z.string({ required_error: 'Task title is required' }).min(1, 'Task title cannot be empty'),
      priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
      rationale: z.string().optional(),
    })
  ).min(1, 'At least one task must be provided'),
});

/**
 * Generic Validation Middleware Generator
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError('Validation failed for request payload', details));
      }
      next(err);
    }
  };
}

module.exports = {
  validate,
  schemas: {
    createProject: createProjectSchema,
    updateProject: updateProjectSchema,
    createTask: createTaskSchema,
    updateTask: updateTaskSchema,
    createUser: createUserSchema,
    updateUser: updateUserSchema,
    register: registerSchema,
    login: loginSchema,
    aiSuggest: aiSuggestSchema,
    aiAccept: aiAcceptSchema,
  },
};
