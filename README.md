# DevPulse REST API Backend

> High-performance RESTful API backend for **DevPulse** — developer productivity dashboard. Designed with Express, Zod validation, centralized error handling, and an isolated Data Access Layer (DAL) seeded with realistic productivity data. Matches the Week 1 DevPulse frontend data contracts with zero rework required.

[![Deployment Status](https://img.shields.io/badge/Deployment-Live-success?style=for-the-badge&logo=render)](https://devpulse-backend-jbzu.onrender.com/api/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/Akashhh8826/devpulse-backend)

---

## 🌐 Live API & Base URLs

- **Live Production API Base URL**: `https://devpulse-backend-jbzu.onrender.com`
- **Health Check**: [https://devpulse-backend-jbzu.onrender.com/api/health](https://devpulse-backend-jbzu.onrender.com/api/health)

---

### 🔒 Security & Repository Audit Status
- **Clean Source Code**: All sensitive credentials, API keys, and environment variables (`.env`) are strictly excluded via `.gitignore`.
- **Zero Secrets**: No secret tokens or private credentials exist in the codebase or git commit history.
- **Deployment Ready**: Standard deployment support for Render Web Services (`render.yaml`) and Express server.

---

## 🚀 Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd devpulse-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *Default `.env` configuration:*
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=*
   ```

4. **Start the API Server:**
   - **Development mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   - **Production mode:**
     ```bash
     npm start
     ```

5. **Verify API Health:**
   Visit `http://localhost:5000/api/health` or run:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Input Validation**: Zod
- **CORS Management**: `cors` middleware
- **Environment Management**: `dotenv`
- **Data Layer**: Modular In-Memory Data Access Layer (`src/data/store.js`)

### 📁 Deliverable Directory Structure
```
/devpulse-backend
├── src/
│   ├── controllers/
│   │   ├── users.controller.js       # User CRUD & profile/settings handlers
│   │   ├── projects.controller.js    # Project CRUD, filtering, sorting handlers
│   │   ├── tasks.controller.js       # Task CRUD, filtering, Kanban board handlers
│   │   └── dashboard.controller.js   # Read-only aggregate analytics handlers
│   ├── data/
│   │   ├── seedData.js               # Initial realistic domain seed data
│   │   └── store.js                  # In-Memory Data Access Layer (DAL)
│   ├── middleware/
│   │   ├── errorHandler.js           # Centralized JSON error middleware
│   │   ├── notFoundHandler.js        # 404 Route Not Found middleware
│   │   └── validation.js             # Zod input validation schemas
│   ├── routes/
│   │   ├── users.routes.js           # /api/users endpoints
│   │   ├── projects.routes.js        # /api/projects endpoints
│   │   ├── tasks.routes.js           # /api/tasks endpoints
│   │   └── dashboard.routes.js       # /api/dashboard/* endpoints
│   ├── utils/
│   │   ├── errors.js                 # Custom HTTP AppError classes
│   │   └── response.js               # Standardized success response helpers
│   ├── app.js                        # Express app setup & middleware mounting
│   └── server.js                     # HTTP server startup & process listeners
├── .env                              # Active environment variables
├── .env.example                      # Template environment variables
├── package.json                      # Dependencies & npm scripts
└── README.md                         # API Documentation & cURL examples
```

### 🔗 Architectural Note: Week 1 Frontend Alignment & Future DB Migration
- **Frontend Integration**: Built to directly serve the live Week 1 DevPulse frontend ([https://akashhh8826.github.io/developer-productivity-dashboard/](https://akashhh8826.github.io/developer-productivity-dashboard/)) across Dashboard, Projects, Tasks, and Settings views.
- **Task 3 Database Readiness**: All business logic relies strictly on `store.js` methods (`store.findProjects()`, `store.createTask()`, etc.). Swapping the in-memory array store for PostgreSQL, MongoDB, or MySQL in Task 3 requires editing **only** `src/data/store.js` — zero changes needed in controllers or routes!

---

## 📌 Standard JSON Error Response Format

All errors return consistent HTTP status codes paired with uniform JSON structures:

```json
{
  "error": {
    "message": "Validation failed for request payload",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "status",
        "message": "Status must be one of: planning, in_progress, completed, on_hold"
      }
    ]
  }
}
```

Common Error Codes:
- `400 Bad Request` (`BAD_REQUEST`, `VALIDATION_ERROR`)
- `404 Not Found` (`NOT_FOUND`)
- `409 Conflict` (`CONFLICT`)
- `500 Internal Server Error` (`INTERNAL_SERVER_ERROR`)

---

## 📖 Complete API Endpoint Reference & cURL Examples

### 1. 📊 Dashboard Analytics (`/api/dashboard`)

#### **GET** `/api/dashboard/summary`
Returns aggregate project/task metrics and next deadline.
- **cURL Request:**
  ```bash
  curl http://localhost:5000/api/dashboard/summary
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalProjects": 4,
      "totalTasks": 7,
      "completedTasks": 3,
      "pendingTasks": 4,
      "upcomingDeadlinesCount": 3,
      "nextDeadlineDate": "2026-09-20T00:00:00.000Z"
    }
  }
  ```

#### **GET** `/api/dashboard/velocity`
Computes weekly sprint velocity (% change in completed tasks) and overall completion percentage.
- **cURL Request:**
  ```bash
  curl http://localhost:5000/api/dashboard/velocity
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "completedThisWeek": 2,
      "completedLastWeek": 1,
      "sprintVelocity": 100,
      "overallCompletionPercent": 43
    }
  }
  ```

#### **GET** `/api/dashboard/activity`
Returns paginated recent activity logs (created tasks, completed tasks, status changes).
- **Query Parameters:** `page` (default 1), `limit` (default 10)
- **cURL Request:**
  ```bash
  curl "http://localhost:5000/api/dashboard/activity?page=1&limit=5"
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "act-1",
        "type": "task_completed",
        "title": "Task Completed: Figma Wireframes & User Flows",
        "description": "Alex Rivera marked \"Figma Wireframes & User Flows\" as completed.",
        "projectId": "proj-2",
        "timestamp": "2026-09-11T16:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 5,
      "totalItems": 5,
      "totalPages": 1
    }
  }
  ```

#### **GET** `/api/dashboard/insight`
Returns rule-based productivity tip string derived from completion rate and velocity.
- **cURL Request:**
  ```bash
  curl http://localhost:5000/api/dashboard/insight
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "insight": "Great momentum! Task completion rate increased by 100% compared to last week.",
      "metrics": {
        "completionRate": 43,
        "sprintVelocity": 100
      }
    }
  }
  ```

---

### 2. 📁 Projects API (`/api/projects`)

#### **GET** `/api/projects`
List all projects with filtering and sorting support.
- **Query Parameters:**
  - `status`: `planning` | `in_progress` | `completed` | `on_hold` (hyphenated e.g. `in-progress` normalized automatically)
  - `sort`: `recent` (default) | `progress` | `dueDate` | `name`
- **cURL Request:**
  ```bash
  curl "http://localhost:5000/api/projects?status=in_progress&sort=progress"
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "proj-1",
        "name": "E-Commerce Microservices",
        "description": "Migrating monolithic store to distributed Express microservices architecture",
        "status": "in_progress",
        "progress": 65,
        "dueDate": "2026-10-15T00:00:00.000Z",
        "createdAt": "2026-08-01T09:00:00.000Z",
        "updatedAt": "2026-09-14T11:20:00.000Z"
      }
    ],
    "meta": {
      "total": 1
    }
  }
  ```

#### **GET** `/api/projects/:id`
Get single project detail.
- **cURL Request:**
  ```bash
  curl http://localhost:5000/api/projects/proj-1
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "proj-1",
      "name": "E-Commerce Microservices",
      "description": "Migrating monolithic store to distributed Express microservices architecture",
      "status": "in_progress",
      "progress": 65,
      "dueDate": "2026-10-15T00:00:00.000Z",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-09-14T11:20:00.000Z"
    }
  }
  ```

#### **POST** `/api/projects`
Create a new project.
- **cURL Request:**
  ```bash
  curl -X POST http://localhost:5000/api/projects \
    -H "Content-Type: application/json" \
    -d '{
      "name": "DevPulse Analytics Pipeline",
      "description": "Real-time metrics aggregator service",
      "status": "planning",
      "progress": 0,
      "dueDate": "2026-12-31T00:00:00.000Z"
    }'
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "proj-5",
      "name": "DevPulse Analytics Pipeline",
      "description": "Real-time metrics aggregator service",
      "status": "planning",
      "progress": 0,
      "dueDate": "2026-12-31T00:00:00.000Z",
      "createdAt": "2026-09-15T00:15:00.000Z",
      "updatedAt": "2026-09-15T00:15:00.000Z"
    }
  }
  ```

#### **PUT / PATCH** `/api/projects/:id`
Update an existing project.
- **cURL Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/projects/proj-1 \
    -H "Content-Type: application/json" \
    -d '{
      "status": "in_progress",
      "progress": 75
    }'
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "proj-1",
      "name": "E-Commerce Microservices",
      "description": "Migrating monolithic store to distributed Express microservices architecture",
      "status": "in_progress",
      "progress": 75,
      "dueDate": "2026-10-15T00:00:00.000Z",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-09-15T00:16:00.000Z"
    }
  }
  ```

#### **DELETE** `/api/projects/:id`
Delete a project and its associated tasks.
- **cURL Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/projects/proj-5
  ```
- **Response (204 No Content)**

---

### 3. 📋 Tasks API (`/api/tasks`)

#### **GET** `/api/tasks`
List tasks with optional project, status, priority filters, and Kanban board grouping.
- **Query Parameters:**
  - `projectId`: filter by project ID
  - `status`: `todo` | `in_progress` | `done`
  - `priority`: `low` | `medium` | `high`
  - `sort`: `dueDate` (default) | `recent`
  - `view`: `kanban` (returns tasks grouped by columns `{ todo, in_progress, done }`)
- **cURL Request (Standard List):**
  ```bash
  curl "http://localhost:5000/api/tasks?projectId=proj-1&status=in_progress"
  ```
- **cURL Request (Kanban View):**
  ```bash
  curl "http://localhost:5000/api/tasks?view=kanban"
  ```
- **Response (Kanban View 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "todo": [
        {
          "id": "task-3",
          "projectId": "proj-1",
          "title": "Write Integration Tests for Payment Gateway",
          "status": "todo",
          "priority": "medium",
          "dueDate": "2026-09-25T00:00:00.000Z"
        }
      ],
      "in_progress": [
        {
          "id": "task-2",
          "projectId": "proj-1",
          "title": "Implement Rate Limiter Middleware",
          "status": "in_progress",
          "priority": "high",
          "dueDate": "2026-09-20T00:00:00.000Z"
        }
      ],
      "done": [
        {
          "id": "task-1",
          "projectId": "proj-1",
          "title": "Design Auth Service Schema",
          "status": "done",
          "priority": "high",
          "dueDate": "2026-09-10T00:00:00.000Z",
          "completedAt": "2026-09-09T14:30:00.000Z"
        }
      ]
    },
    "meta": {
      "total": 7
    }
  }
  ```

#### **POST** `/api/tasks`
Create a new task under a valid project.
- **cURL Request:**
  ```bash
  curl -X POST http://localhost:5000/api/tasks \
    -H "Content-Type: application/json" \
    -d '{
      "projectId": "proj-1",
      "title": "Setup Prometheus Metrics Exporter",
      "description": "Expose HTTP latency histograms",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-09-30T00:00:00.000Z"
    }'
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "task-8",
      "projectId": "proj-1",
      "title": "Setup Prometheus Metrics Exporter",
      "description": "Expose HTTP latency histograms",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-09-30T00:00:00.000Z",
      "createdAt": "2026-09-15T00:17:00.000Z",
      "updatedAt": "2026-09-15T00:17:00.000Z",
      "completedAt": null
    }
  }
  ```

#### **PUT / PATCH** `/api/tasks/:id`
Update task details or status. Setting `status: "done"` automatically populates `completedAt`.
- **cURL Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/tasks/task-2 \
    -H "Content-Type: application/json" \
    -d '{
      "status": "done"
    }'
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "task-2",
      "projectId": "proj-1",
      "title": "Implement Rate Limiter Middleware",
      "description": "Add Redis sliding window rate limiting to API gateway",
      "status": "done",
      "priority": "high",
      "dueDate": "2026-09-20T00:00:00.000Z",
      "createdAt": "2026-09-02T11:15:00.000Z",
      "updatedAt": "2026-09-15T00:18:00.000Z",
      "completedAt": "2026-09-15T00:18:00.000Z"
    }
  }
  ```

#### **DELETE** `/api/tasks/:id`
Delete a task.
- **cURL Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/tasks/task-8
  ```
- **Response (204 No Content)**

---

### 4. 👤 Users / Profile API (`/api/users`)

#### **GET** `/api/users/profile`
Retrieve user profile and active UI settings.
- **cURL Request:**
  ```bash
  curl http://localhost:5000/api/users/profile
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "user-1",
      "name": "Alex Rivera",
      "email": "alex.rivera@devpulse.io",
      "avatarInitials": "AR",
      "theme": "sunset-rose",
      "sidebarCollapsed": false,
      "createdAt": "2026-01-15T08:00:00.000Z",
      "updatedAt": "2026-09-01T10:30:00.000Z"
    }
  }
  ```

#### **PUT / PATCH** `/api/users/profile`
Update user profile and theme/sidebar preferences.
- **cURL Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/users/profile \
    -H "Content-Type: application/json" \
    -d '{
      "theme": "emerald-dark",
      "sidebarCollapsed": true
    }'
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "user-1",
      "name": "Alex Rivera",
      "email": "alex.rivera@devpulse.io",
      "avatarInitials": "AR",
      "theme": "emerald-dark",
      "sidebarCollapsed": true,
      "createdAt": "2026-01-15T08:00:00.000Z",
      "updatedAt": "2026-09-15T00:19:00.000Z"
    }
  }
  ```

---

## 🧪 Testing

Run the automated verification test suite:
```bash
node scratch/verify_api.js
```
The test suite verifies:
- Health check status
- User CRUD & profile update
- Projects CRUD, status filtering, and sorting
- Tasks CRUD, Kanban view generation, status update `completedAt` automation
- Zod schema input validation (rejecting malformed status enums)
- 404 and 500 error handling
- Dashboard aggregate calculations (`summary`, `velocity`, `activity`, `insight`)
