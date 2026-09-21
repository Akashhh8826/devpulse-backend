# DevPulse REST API Backend

> High-performance RESTful API backend for **DevPulse** — developer productivity dashboard, project/task management platform, JWT authentication, and AI-powered task generation engine.

Task 4 upgrades the DevPulse backend with full **JWT Authentication**, **Ownership Authorization**, protected write endpoints for Projects and Tasks, and **AI-Powered Task Generation** with structured JSON output, review/accept workflows, and an graceful 501 fallback mechanism.

[![Deployment Status](https://img.shields.io/badge/Deployment-Live-success?style=for-the-badge&logo=render)](https://devpulse-backend-jbzu.onrender.com/api/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/Akashhh8826/devpulse-backend)

---

## ⚡ Features

- **JWT Authentication**: Secure registration (`POST /api/auth/register`), login (`POST /api/auth/login`), current user profile (`GET /api/auth/me`), and stateless token logout (`POST /api/auth/logout`).
- **Bcrypt Password Hashing**: Passwords are securely hashed with `bcryptjs` and hidden from all standard API outputs (`select: false`).
- **Protected Write Operations**: Project & Task create, update, and delete endpoints require a valid `Authorization: Bearer <token>` header.
- **Resource Ownership Authorization**: Projects belong to users (`ownerId`), and tasks inherit ownership through their project. Attempts by unauthorized users to modify or delete another user's projects or tasks yield HTTP `403 Forbidden`.
- **AI-Powered Task Generation**: Generates 3–7 structured development task suggestions based on project name and description using Anthropic Claude (`POST /api/ai/suggest-tasks`).
- **Structured JSON & AI Validation**: Strict validation of AI response output (`title`, `priority`, `rationale`). Malformed responses safely trigger HTTP `502 Bad Gateway`.
- **AI Task Accept Flow**: User review/accept flow (`POST /api/ai/suggest-tasks/accept`) converts accepted suggestions directly into real MongoDB Task documents (`status: "todo"`).
- **Graceful 501 AI Fallback**: If `ANTHROPIC_API_KEY` is unconfigured, the server starts normally and calls to `/api/ai/suggest-tasks` cleanly return HTTP `501 Not Implemented` (`AI_NOT_CONFIGURED`).
- **User Management**: User profile and UI preferences (`theme`, `sidebarCollapsed`).
- **Project & Task Management**: Status enums, progress tracking, Kanban views, and auto-populated completion timestamps.
- **Cascading Deletion**: Deleting a project automatically deletes all associated tasks.
- **Persistent Dashboard Analytics**: Live computation of sprint velocity, completion rate, activity feeds, and productivity insights directly from MongoDB.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB / MongoDB Atlas
- **Object Data Modeling (ODM)**: Mongoose
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **AI Integration**: Anthropic SDK (`@anthropic-ai/sdk`) / Claude Models
- **Input Validation**: Zod
- **Environment Management**: `dotenv`
- **CORS Management**: `cors` middleware

---

## 📁 Project Structure

```
devpulse-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Primary MongoDB Mongoose connection module
│   │   └── db.js                # Database connection export
│   ├── controllers/
│   │   ├── auth.controller.js     # Auth registration, login, profile, logout handlers
│   │   ├── ai.controller.js       # AI task suggestion & accept handlers
│   │   ├── dashboard.controller.js# Persistent analytics handlers
│   │   ├── projects.controller.js # Project CRUD & ownership handlers
│   │   ├── tasks.controller.js     # Task CRUD, Kanban, & ownership handlers
│   │   └── users.controller.js     # User CRUD & profile handlers
│   ├── data/
│   │   ├── seedData.js          # Seed dataset definitions
│   │   └── store.js             # Mongoose Data Access Layer (DAL)
│   ├── middleware/
│   │   ├── auth.js              # JWT Bearer token authentication middleware
│   │   ├── errorHandler.js      # Centralized JSON error handler
│   │   ├── notFoundHandler.js   # 404 Not Found route handler
│   │   └── validation.js        # Zod input validation schemas
│   ├── models/
│   │   ├── Activity.js          # Activity Mongoose schema
│   │   ├── Project.js           # Project Mongoose schema (ownerId ref: User)
│   │   ├── Task.js              # Task Mongoose schema (projectId ref: Project)
│   │   └── User.js              # User Mongoose schema (passwordHash select: false)
│   ├── routes/
│   │   ├── auth.routes.js       # /api/auth routes
│   │   ├── ai.routes.js         # /api/ai routes
│   │   ├── dashboard.routes.js   # /api/dashboard/* routes
│   │   ├── projects.routes.js    # /api/projects routes
│   │   ├── tasks.routes.js       # /api/tasks routes
│   │   └── users.routes.js       # /api/users routes
│   ├── services/
│   │   └── aiService.js         # LLM service & JSON response parser/validator
│   ├── scripts/
│   │   └── seed.js              # Independent database seed script
│   ├── utils/
│   │   ├── errors.js            # Custom AppError classes (401, 403, 501, 502)
│   │   └── response.js          # Standardized JSON response helpers
│   ├── app.js                   # Express app setup & middleware mounting
│   └── server.js                # HTTP server & database entry point
├── .env.example                 # Safe environment variable template
├── package.json                 # Dependencies & npm scripts
└── README.md                    # Project documentation
```

---

## 🗄️ Database Design

### 1. User (`src/models/User.js`)
- `id`: String (Required, Unique public ID)
- `name`: String (Required)
- `email`: String (Required, Unique, lowercase)
- `passwordHash`: String (`select: false`, hidden from JSON transforms)
- `avatarInitials`: String
- `theme` / `sidebarCollapsed`: Preference fields

### 2. Project (`src/models/Project.js`)
- `id`: String (Required, Unique public ID)
- `name`: String (Required)
- `description`: String
- `status`: String (Enum: `['planning', 'in_progress', 'completed', 'on_hold']`)
- `progress`: Number (0-100)
- `dueDate`: Date (Required)
- `ownerId`: Mongoose `ObjectId` (`ref: 'User'`)

### 3. Task (`src/models/Task.js`)
- `id`: String (Required, Unique public ID)
- `projectId`: Mongoose `ObjectId` (`ref: 'Project'`)
- `projectPublicId`: String
- `title`: String (Required)
- `description`: String
- `status`: String (Enum: `['todo', 'in_progress', 'done']`)
- `priority`: String (Enum: `['low', 'medium', 'high']`)
- `dueDate`: Date (Required)
- `completedAt`: Date

---

## 🌐 Environment Variables

Variables are managed via `dotenv`. Template in `.env.example`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb://localhost:27017/devpulse

JWT_SECRET=replace-with-a-long-random-secret

ANTHROPIC_API_KEY=your-anthropic-api-key
```

---

## 📖 API Endpoints Reference

### Health Check
- **`GET /api/health`**: Service availability & status

### Authentication API (`/api/auth`)
- **`POST /api/auth/register`**: Register a new user (`name`, `email`, `password`)
- **`POST /api/auth/login`**: Authenticate user and receive JWT token
- **`GET /api/auth/me`**: Get authenticated user profile (`Authorization: Bearer <token>`)
- **`POST /api/auth/logout`**: Client-side stateless logout acknowledgement

### AI Task Generation API (`/api/ai`) [Protected]
- **`POST /api/ai/suggest-tasks`**: Generate 3–7 AI task suggestions for a project owned by user
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "projectId": "proj-1" }`
  - Response: Array of `{ title, priority, rationale }`
- **`POST /api/ai/suggest-tasks/accept`**: Accept suggestions & create real MongoDB tasks
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "projectId": "proj-1", "tasks": [...] }`

### Projects API (`/api/projects`)
- **`GET /api/projects`**: List all projects (Public)
- **`GET /api/projects/:id`**: Get project details (Public)
- **`POST /api/projects`**: Create project [Protected - Auto-assigns `ownerId`]
- **`PUT /api/projects/:id`** / **`PATCH /api/projects/:id`**: Update project [Protected - Owner check]
- **`DELETE /api/projects/:id`**: Delete project [Protected - Owner check & cascade deletion]

### Tasks API (`/api/tasks`)
- **`GET /api/tasks`**: List tasks (Public, filter by `projectId`, `status`, `view=kanban`)
- **`GET /api/tasks/:id`**: Get task details (Public)
- **`POST /api/tasks`**: Create task [Protected - Project owner check]
- **`PUT /api/tasks/:id`** / **`PATCH /api/tasks/:id`**: Update task [Protected - Project owner check]
- **`DELETE /api/tasks/:id`**: Delete task [Protected - Project owner check]

---

## 🤖 AI Workflow & Fallback Architecture

```text
Project (Name + Description)
   ↓
POST /api/ai/suggest-tasks (Bearer Token)
   ↓
Verify User Ownership of Project
   ↓
Check ANTHROPIC_API_KEY
 ├── Missing Key  → Returns 501 Not Implemented (AI_NOT_CONFIGURED)
 └── Valid Key    → Calls Claude LLM Engine
                        ↓
                  Parses & Validates Structured JSON (3–7 tasks)
                        ↓
                  Returns Suggestions to Client
                        ↓
POST /api/ai/suggest-tasks/accept
                        ↓
Converts accepted tasks into real MongoDB Task documents (status: "todo")
```

---

## 🔒 Security & Authorization

- `401 Unauthorized`: Missing, invalid, or expired JWT token on protected endpoints.
- `403 Forbidden`: Authenticated user attempting to modify or delete a project or task belonging to another user.
- `501 Not Implemented`: AI endpoint called when `ANTHROPIC_API_KEY` is unconfigured. Server remains online and functional.
- `502 Bad Gateway`: AI engine returned non-JSON or malformed output.

---

## 🧪 Verification & Testing

Task 4 features verified via automated integration suite (`scratch/test_task4.js`):

1. **Register**: `POST /api/auth/register` creates user and returns JWT without `passwordHash`.
2. **Login**: `POST /api/auth/login` verifies password with bcrypt and returns valid JWT.
3. **Current User**: `GET /api/auth/me` returns authenticated user profile.
4. **Protected Write Operations**: `POST /api/projects` without token returns 401; with token succeeds.
5. **Ownership Authorization**: User B attempting to modify User A's project returns 403 Forbidden.
6. **AI Suggestions**: `POST /api/ai/suggest-tasks` returns valid JSON array of 3–7 task suggestions.
7. **Accept AI Tasks**: `POST /api/ai/suggest-tasks/accept` persists accepted tasks to MongoDB with `status: "todo"`.
8. **AI Fallback**: Unconfigured AI key returns HTTP 501 `AI_NOT_CONFIGURED` without server crash.

---

## 🔗 Links

- **GitHub Repository**: [https://github.com/Akashhh8826/devpulse-backend](https://github.com/Akashhh8826/devpulse-backend)
- **Live Production API**: [https://devpulse-backend-jbzu.onrender.com](https://devpulse-backend-jbzu.onrender.com/)

