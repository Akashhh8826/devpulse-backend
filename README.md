# DevPulse REST API Backend

> High-performance RESTful API backend for **DevPulse** — developer productivity dashboard and project/task management platform. 

Task 3 upgraded the DevPulse backend from Task 2's transient in-memory storage layer to persistent **MongoDB** database storage using **Mongoose**, preserving full backwards compatibility with all existing API contracts and the Week 1 frontend integration.

[![Deployment Status](https://img.shields.io/badge/Deployment-Live-success?style=for-the-badge&logo=render)](https://devpulse-backend-jbzu.onrender.com/api/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/Akashhh8826/devpulse-backend)

---

## ⚡ Features

- **User Management**: User profile and UI preferences (`theme`, `sidebarCollapsed`).
- **Project Management**: Project tracking with status enums (`planning`, `in_progress`, `completed`, `on_hold`), progress tracking (0-100%), and due dates.
- **Task Management**: Task tracking with Kanban board status (`todo`, `in_progress`, `done`), priority levels (`low`, `medium`, `high`), and auto-populated completion dates (`completedAt`).
- **Full persistent CRUD**: Complete Create, Read, Update, Delete capabilities across all domain resources.
- **MongoDB Persistent Storage**: Data survives server restarts and crashes.
- **Mongoose Schemas & Models**: Strongly-typed object data modeling for User, Project, Task, and Activity.
- **Schema-Level Validation**: Strict field constraints, enum restrictions, required parameters, and date checks.
- **Project → Task Relationship**: Tasks explicitly reference Project documents via Mongoose `ObjectId` references.
- **Cascading Deletion**: Deleting a project automatically deletes all associated tasks to prevent orphaned data.
- **Persistent Dashboard Analytics**: Live computation of sprint velocity, completion rate, activity feeds, and rule-based productivity insights directly from MongoDB queries.
- **Centralized Error Handling**: Standardized JSON error response format matching Zod and Mongoose validation errors.
- **Environment-Driven Configuration**: Secure variable loading via `dotenv`.
- **RESTful Endpoints**: Clean, standardized REST API routes with pagination and filtering support.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB / MongoDB Atlas
- **Object Data Modeling (ODM)**: Mongoose
- **Input Validation**: Zod
- **Environment Management**: `dotenv`
- **CORS Management**: `cors` middleware
- **Development Server Runner**: Node `--watch` / Nodemon

---

## 📁 Project Structure

```
devpulse-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Primary MongoDB Mongoose connection module
│   │   └── db.js                # Database connection export
│   ├── controllers/
│   │   ├── dashboard.controller.js# Persistent analytics handlers
│   │   ├── projects.controller.js # Project CRUD handlers
│   │   ├── tasks.controller.js     # Task CRUD, Kanban, & populate handlers
│   │   └── users.controller.js     # User CRUD & profile handlers
│   ├── data/
│   │   ├── seedData.js          # Seed dataset definitions
│   │   └── store.js             # Mongoose Data Access Layer (DAL)
│   ├── middleware/
│   │   ├── errorHandler.js      # Centralized JSON error handler
│   │   ├── notFoundHandler.js   # 404 Not Found route handler
│   │   └── validation.js        # Zod input validation schemas
│   ├── models/
│   │   ├── Activity.js          # Activity Mongoose schema
│   │   ├── Project.js           # Project Mongoose schema
│   │   ├── Task.js              # Task Mongoose schema (ref: Project)
│   │   └── User.js              # User Mongoose schema
│   ├── routes/
│   │   ├── dashboard.routes.js   # /api/dashboard/* routes
│   │   ├── projects.routes.js    # /api/projects routes
│   │   ├── tasks.routes.js       # /api/tasks routes
│   │   └── users.routes.js       # /api/users routes
│   ├── scripts/
│   │   └── seed.js              # Independent database seed script
│   ├── utils/
│   │   ├── errors.js            # Custom AppError classes
│   │   └── response.js          # Standardized JSON response helpers
│   ├── app.js                   # Express app setup & middleware mounting
│   └── server.js                # HTTP server & database entry point
├── .env.example                 # Safe environment variable template
├── package.json                 # Dependencies & npm scripts
└── README.md                    # Project documentation
```

---

## 🗄️ Database Design

The database contains three main domain models (plus an audit `Activity` log model):

### 1. User (`src/models/User.js`)
- `id`: String (Required, Unique public ID e.g. `user-1`)
- `name`: String (Required, trimmed)
- `email`: String (Required, Unique, lowercase)
- `avatarInitials`: String (Default: '')
- `theme`: String (Default: 'sunset-rose')
- `sidebarCollapsed`: Boolean (Default: false)
- `createdAt` / `updatedAt`: Timestamps

### 2. Project (`src/models/Project.js`)
- `id`: String (Required, Unique public ID e.g. `proj-1`)
- `name`: String (Required, trimmed)
- `description`: String (Default: '')
- `status`: String (Enum: `['planning', 'in_progress', 'completed', 'on_hold']`, Default: 'planning')
- `progress`: Number (Min: 0, Max: 100, Default: 0)
- `dueDate`: Date (Required)
- `createdAt` / `updatedAt`: Timestamps

### 3. Task (`src/models/Task.js`)
- `id`: String (Required, Unique public ID e.g. `task-1`)
- `projectId`: Mongoose `ObjectId` (Required, `ref: 'Project'`)
- `projectPublicId`: String (Required, public project string ID e.g. `proj-1`)
- `title`: String (Required, trimmed)
- `description`: String (Default: '')
- `status`: String (Enum: `['todo', 'in_progress', 'done']`, Default: 'todo')
- `priority`: String (Enum: `['low', 'medium', 'high']`, Default: 'medium')
- `dueDate`: Date (Required)
- `completedAt`: Date (Nullable, auto-populated when `status: 'done'`)
- `createdAt` / `updatedAt`: Timestamps

### Project → Task Relationship
`Task.projectId` references the `Project` model via a proper Mongoose `ObjectId` reference, ensuring database-level relational integrity. In public API responses, `projectId` cleanly resolves to the project's public string ID (e.g. `proj-1`), and optional population (`?populate=project` or `GET /api/tasks/:id/full`) embeds the full Project object.

---

## 💻 MongoDB Setup

### 1. Local MongoDB
Ensure a local MongoDB server is running on port `27017` and set your URI in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/devpulse
```

### 2. MongoDB Atlas Cloud
To use MongoDB Atlas in cloud or staging environments:
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with read/write privileges.
3. Add your IP address to Network Access (`0.0.0.0/0` for cloud services like Render).
4. Copy your cluster connection string and place it into `.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/devpulse?retryWrites=true&w=majority
```

---

## 🌐 Environment Variables

Environment variables are loaded via `dotenv`. Keep local credentials in `.env` (excluded by `.gitignore`). Use `.env.example` as a template:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb://localhost:27017/devpulse
```

---

## 🚀 Installation & Running Locally

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Start the production server:**
   ```bash
   npm start
   ```

---

## 🌱 Database Seeding

To populate MongoDB with realistic initial sample users, projects, tasks, and activity logs:

```bash
npm run seed
```

This runs `node src/scripts/seed.js`, which connects to MongoDB, clears existing collections, inserts the seed dataset, and exits cleanly.

---

## 📖 API Endpoints Reference

### Health Check
- **`GET /api/health`**: Service availability & status

### Users API (`/api/users`)
- **`GET /api/users`**: List all users
- **`POST /api/users`**: Create a new user
- **`GET /api/users/:id`**: Get single user details
- **`PUT /api/users/:id`** / **`PATCH /api/users/:id`**: Update user details
- **`DELETE /api/users/:id`**: Delete user
- **`GET /api/users/profile`**: Get current user profile (`user-1` default)
- **`PUT /api/users/profile`** / **`PATCH /api/users/profile`**: Update current user profile

### Projects API (`/api/projects`)
- **`GET /api/projects`**: List projects (supports `status` filter and `sort` param)
- **`POST /api/projects`**: Create a new project
- **`GET /api/projects/:id`**: Get project details
- **`PUT /api/projects/:id`** / **`PATCH /api/projects/:id`**: Update project status or progress
- **`DELETE /api/projects/:id`**: Delete project (triggers task cascade deletion)

### Tasks API (`/api/tasks`)
- **`GET /api/tasks`**: List tasks (supports `projectId`, `status`, `priority`, `sort`, `view=kanban`, and `populate=project`)
- **`POST /api/tasks`**: Create a new task under a valid project
- **`GET /api/tasks/:id`**: Get task details (supports `?populate=project`)
- **`GET /api/tasks/:id/full`**: Get task with fully populated project details
- **`PUT /api/tasks/:id`** / **`PATCH /api/tasks/:id`**: Update task details or status
- **`DELETE /api/tasks/:id`**: Delete task

### Dashboard API (`/api/dashboard`)
- **`GET /api/dashboard/summary`**: Persistent aggregate metrics (total projects, total tasks, completed, pending, next deadline)
- **`GET /api/dashboard/velocity`**: Sprint velocity (% task completion change)
- **`GET /api/dashboard/activity`**: Paginated recent activity log feed (`page`, `limit`)
- **`GET /api/dashboard/insight`**: Dynamic productivity tips and metrics

---

## 🛡️ Validation & Error Handling

- **Dual Validation**: Request payloads are validated at the middleware layer using Zod schemas and enforced at the database level using Mongoose schemas.
- **Relational Integrity**: Attempting to create or update a task with a non-existent `projectId` is rejected with an HTTP `400 Bad Request` error:
  ```json
  {
    "error": {
      "message": "Cannot create task: Project with ID 'nonexistent-id' does not exist",
      "code": "BAD_REQUEST"
    }
  }
  ```

---

## 🔄 Task 3 Database Integration (Task 2 vs Task 3)

| Feature | Task 2 Backend | Task 3 Backend |
| :--- | :--- | :--- |
| **Data Storage** | In-memory JavaScript arrays | Persistent MongoDB database collections |
| **Data Retention** | Data lost on server restart | Data survives server restarts and crashes |
| **Data Models** | Plain JavaScript objects | Mongoose Schemas (`User`, `Project`, `Task`, `Activity`) |
| **Relationships** | In-memory array filtering | Mongoose `ObjectId` `ref: 'Project'` relationship & population |
| **Validation** | Zod middleware | Zod middleware + Mongoose schema validation |
| **Project Deletion** | Array filtering | **Cascade Deletion** (deleting a project deletes associated tasks) |
| **Dashboard** | Array calculation | Persistent MongoDB live queries |
| **API Contract** | Standard REST API | 100% preserved response structure and endpoint paths |

---

## 🗑️ Cascade Deletion Policy

When a project is deleted via `DELETE /api/projects/:id`, all tasks referencing that project (`Task.projectId`) are automatically deleted from MongoDB. This prevents orphaned tasks and maintains database integrity.

---

## 🌐 Live Production Deployment

The backend API is deployed live on **Render**:

- **Live API Base URL**: [https://devpulse-backend-jbzu.onrender.com](https://devpulse-backend-jbzu.onrender.com/)
- **Health Check Endpoint**: [https://devpulse-backend-jbzu.onrender.com/api/health](https://devpulse-backend-jbzu.onrender.com/api/health)

---

## 🧪 Verification & Testing

The Task 3 implementation was verified through automated tests:

1. **Health Check**: Verified `GET /api/health` returns HTTP 200 `online`.
2. **User CRUD**: Verified user creation, reading, updating, and deletion.
3. **Project CRUD**: Verified project creation, status updates, progress recalculations, and deletion.
4. **Task CRUD**: Verified task creation, Kanban grouping, status updates, and `completedAt` timestamp automation.
5. **MongoDB Persistence**: Verified created projects and tasks persist across server restarts.
6. **Task → Project Relationship**: Verified invalid `projectId` rejection and `?populate=project` fetching.
7. **Cascade Deletion**: Verified deleting a project removes all referencing tasks.
8. **Dashboard Analytics**: Verified summary, velocity, activity logs, and insight metrics reflect database state.

---

## 🔒 Security

- Sensitive credentials and connection strings are stored exclusively in environment variables (`.env`).
- `.env` is strictly excluded via `.gitignore`.
- `.env.example` contains safe placeholder values only.
- Real credentials and database URIs are never committed to GitHub.

---

## 🔗 Repository & Task 3 Deliverables

- **GitHub Repository**: [https://github.com/Akashhh8826/devpulse-backend](https://github.com/Akashhh8826/devpulse-backend)
- **Live Production API**: [https://devpulse-backend-jbzu.onrender.com](https://devpulse-backend-jbzu.onrender.com/)
