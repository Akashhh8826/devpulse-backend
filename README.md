# DevPulse REST API Backend

> High-performance RESTful API backend for **DevPulse** â€” developer productivity dashboard, project/task management platform, JWT authentication, and AI-powered task generation engine.

Task 4 upgrades the DevPulse backend with full **JWT Authentication**, **Ownership Authorization**, protected write endpoints for Projects and Tasks, and **AI-Powered Task Generation** with structured JSON output, review/accept workflows, and an graceful 501 fallback mechanism.

[![Deployment Status](https://img.shields.io/badge/Deployment-Live-success?style=for-the-badge&logo=render)](https://devpulse-backend-jbzu.onrender.com/api/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/Akashhh8826/devpulse-backend)

---

## âš¡ Features

- **JWT Authentication**: Secure registration (`POST /api/auth/register`), login (`POST /api/auth/login`), current user profile (`GET /api/auth/me`), and stateless token logout (`POST /api/auth/logout`).
- **Bcrypt Password Hashing**: Passwords are securely hashed with `bcryptjs` and hidden from all standard API outputs (`select: false`).
- **Protected Write Operations**: Project & Task create, update, and delete endpoints require a valid `Authorization: Bearer <token>` header.
- **Resource Ownership Authorization**: Projects belong to users (`ownerId`), and tasks inherit ownership through their project. Attempts by unauthorized users to modify or delete another user's projects or tasks yield HTTP `403 Forbidden`.
- **AI-Powered Task Generation**: Generates 3â€“7 structured development task suggestions based on project name and description using Google Gemini API (`POST /api/ai/suggest-tasks`).
- **Structured JSON & AI Validation**: Strict validation of AI response output (`title`, `priority`, `rationale`). Malformed responses safely trigger HTTP `502 Bad Gateway`.
- **AI Task Accept Flow**: User review/accept flow (`POST /api/ai/suggest-tasks/accept`) converts accepted suggestions directly into real MongoDB Task documents (`status: "todo"`).
- **Graceful 501 AI Fallback**: If `GEMINI_API_KEY` is unconfigured, the server starts normally and calls to `/api/ai/suggest-tasks` cleanly return HTTP `501 Not Implemented` (`AI_NOT_CONFIGURED`).
- **User Management**: User profile and UI preferences (`theme`, `sidebarCollapsed`).
- **Project & Task Management**: Status enums, progress tracking, Kanban views, and auto-populated completion timestamps.
- **Cascading Deletion**: Deleting a project automatically deletes all associated tasks.
- **Persistent Dashboard Analytics**: Live computation of sprint velocity, completion rate, activity feeds, and productivity insights directly from MongoDB.

---

## ðŸ› ï¸ Tech Stack

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

## ðŸ“ Project Structure

```
devpulse-backend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”œâ”€â”€ database.js          # Primary MongoDB Mongoose connection module
â”‚   â”‚   â””â”€â”€ db.js                # Database connection export
â”‚   â”œâ”€â”€ controllers/
â”‚   â”‚   â”œâ”€â”€ auth.controller.js     # Auth registration, login, profile, logout handlers
â”‚   â”‚   â”œâ”€â”€ ai.controller.js       # AI task suggestion & accept handlers
â”‚   â”‚   â”œâ”€â”€ dashboard.controller.js# Persistent analytics handlers
â”‚   â”‚   â”œâ”€â”€ projects.controller.js # Project CRUD & ownership handlers
â”‚   â”‚   â”œâ”€â”€ tasks.controller.js     # Task CRUD, Kanban, & ownership handlers
â”‚   â”‚   â””â”€â”€ users.controller.js     # User CRUD & profile handlers
â”‚   â”œâ”€â”€ data/
â”‚   â”‚   â”œâ”€â”€ seedData.js          # Seed dataset definitions
â”‚   â”‚   â””â”€â”€ store.js             # Mongoose Data Access Layer (DAL)
â”‚   â”œâ”€â”€ middleware/
â”‚   â”‚   â”œâ”€â”€ auth.js              # JWT Bearer token authentication middleware
â”‚   â”‚   â”œâ”€â”€ errorHandler.js      # Centralized JSON error handler
â”‚   â”‚   â”œâ”€â”€ notFoundHandler.js   # 404 Not Found route handler
â”‚   â”‚   â””â”€â”€ validation.js        # Zod input validation schemas
â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”œâ”€â”€ Activity.js          # Activity Mongoose schema
â”‚   â”‚   â”œâ”€â”€ Project.js           # Project Mongoose schema (ownerId ref: User)
â”‚   â”‚   â”œâ”€â”€ Task.js              # Task Mongoose schema (projectId ref: Project)
â”‚   â”‚   â””â”€â”€ User.js              # User Mongoose schema (passwordHash select: false)
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ auth.routes.js       # /api/auth routes
â”‚   â”‚   â”œâ”€â”€ ai.routes.js         # /api/ai routes
â”‚   â”‚   â”œâ”€â”€ dashboard.routes.js   # /api/dashboard/* routes
â”‚   â”‚   â”œâ”€â”€ projects.routes.js    # /api/projects routes
â”‚   â”‚   â”œâ”€â”€ tasks.routes.js       # /api/tasks routes
â”‚   â”‚   â””â”€â”€ users.routes.js       # /api/users routes
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â””â”€â”€ aiService.js         # LLM service & JSON response parser/validator
â”‚   â”œâ”€â”€ scripts/
â”‚   â”‚   â””â”€â”€ seed.js              # Independent database seed script
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â”œâ”€â”€ errors.js            # Custom AppError classes (401, 403, 501, 502)
â”‚   â”‚   â””â”€â”€ response.js          # Standardized JSON response helpers
â”‚   â”œâ”€â”€ app.js                   # Express app setup & middleware mounting
â”‚   â””â”€â”€ server.js                # HTTP server & database entry point
â”œâ”€â”€ .env.example                 # Safe environment variable template
â”œâ”€â”€ package.json                 # Dependencies & npm scripts
â””â”€â”€ README.md                    # Project documentation
```

---

## ðŸ—„ï¸ Database Design

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

## ðŸŒ Environment Variables

Variables are managed via `dotenv`. Template in `.env.example`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb://localhost:27017/devpulse

JWT_SECRET=replace-with-a-long-random-secret

GEMINI_API_KEY=your-gemini-api-key
```

---

## ðŸ“– API Endpoints Reference

### Health Check
- **`GET /api/health`**: Service availability & status

### Authentication API (`/api/auth`)
- **`POST /api/auth/register`**: Register a new user (`name`, `email`, `password`)
- **`POST /api/auth/login`**: Authenticate user and receive JWT token
- **`GET /api/auth/me`**: Get authenticated user profile (`Authorization: Bearer <token>`)
- **`POST /api/auth/logout`**: Client-side stateless logout acknowledgement

### AI Task Generation API (`/api/ai`) [Protected]
- **`POST /api/ai/suggest-tasks`**: Generate 3â€“7 AI task suggestions for a project owned by user
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

## ðŸ¤– AI Workflow & Fallback Architecture

```text
Project (Name + Description)
   â†“
POST /api/ai/suggest-tasks (Bearer Token)
   â†“
Verify User Ownership of Project
   â†“
Check GEMINI_API_KEY
 â”œâ”€â”€ Missing Key  â†’ Returns 501 Not Implemented (AI_NOT_CONFIGURED)
 â””â”€â”€ Valid Key    â†’ Calls Google Gemini API Engine
                        â†“
                  Parses & Validates Structured JSON (3â€“7 tasks)
                        â†“
                  Returns Suggestions to Client
                        â†“
POST /api/ai/suggest-tasks/accept
                        â†“
Converts accepted tasks into real MongoDB Task documents (status: "todo")
```

---

## ðŸ”’ Security & Authorization

- `401 Unauthorized`: Missing, invalid, or expired JWT token on protected endpoints.
- `403 Forbidden`: Authenticated user attempting to modify or delete a project or task belonging to another user.
- `501 Not Implemented`: AI endpoint called when `GEMINI_API_KEY` is unconfigured. Server remains online and functional.
- `502 Bad Gateway`: AI engine returned non-JSON or malformed output.

---

## ðŸ§ª Verification & Testing

Task 4 features verified via automated integration suite (`scratch/test_task4.js`):

1. **Register**: `POST /api/auth/register` creates user and returns JWT without `passwordHash`.
2. **Login**: `POST /api/auth/login` verifies password with bcrypt and returns valid JWT.
3. **Current User**: `GET /api/auth/me` returns authenticated user profile.
4. **Protected Write Operations**: `POST /api/projects` without token returns 401; with token succeeds.
5. **Ownership Authorization**: User B attempting to modify User A's project returns 403 Forbidden.
6. **AI Suggestions**: `POST /api/ai/suggest-tasks` returns valid JSON array of 3â€“7 task suggestions.
7. **Accept AI Tasks**: `POST /api/ai/suggest-tasks/accept` persists accepted tasks to MongoDB with `status: "todo"`.
8. **AI Fallback**: Unconfigured AI key returns HTTP 501 `AI_NOT_CONFIGURED` without server crash.

---

## ðŸ”— Links

- **GitHub Repository**: [https://github.com/Akashhh8826/devpulse-backend](https://github.com/Akashhh8826/devpulse-backend)
- **Live Production API**: [https://devpulse-backend-jbzu.onrender.com](https://devpulse-backend-jbzu.onrender.com/)



