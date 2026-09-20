const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must reference a valid Project'],
    },
    projectPublicId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in_progress', 'done'],
        message: 'Status must be one of: todo, in_progress, done',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be one of: low, medium, high',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        if (ret.projectId && typeof ret.projectId === 'object' && ret.projectId.id) {
          ret.project = ret.projectId;
          ret.projectId = ret.projectPublicId || ret.projectId.id;
        } else {
          ret.projectId = ret.projectPublicId || ret.projectId;
        }
        delete ret.projectPublicId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        if (ret.projectId && typeof ret.projectId === 'object' && ret.projectId.id) {
          ret.project = ret.projectId;
          ret.projectId = ret.projectPublicId || ret.projectId.id;
        } else {
          ret.projectId = ret.projectPublicId || ret.projectId;
        }
        delete ret.projectPublicId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
