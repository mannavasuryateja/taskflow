# TaskFlow — Team Task Management App

A full-stack collaborative task management web application built with React, Node.js/Express, and NeDB.

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React 18, React Router v6     |
| Backend    | Node.js, Express.js           |
| Database   | NeDB (file-based, embedded)   |
| Auth       | JWT (JSON Web Tokens)         |
| Styling    | Custom CSS (no UI library)    |

## Project Structure

```
taskflow/
├── backend/
│   ├── config/         # Database config (NeDB)
│   ├── data/           # NeDB data files (auto-created)
│   ├── middleware/     # JWT auth middleware
│   ├── routes/         # API routes (auth, projects, tasks)
│   ├── .env            # Environment variables (local)
│   ├── .env.example    # Environment variable template
│   ├── railway.json    # Railway deployment config
│   └── server.js       # Express entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ # Layout, TaskModal
│   │   ├── context/    # AuthContext (JWT state)
│   │   ├── pages/      # Dashboard, Projects, ProjectDetail, AuthPage
│   │   └── utils/      # Axios API instance
│   ├── .env.example    # Environment variable template
│   └── railway.json    # Railway deployment config
└── README.md
```

## Quick Start (Local)

### Prerequisites
- Node.js 16+
- npm

### Step 1: Install dependencies

```bash
cd taskflow/backend && npm install
cd ../frontend && npm install
```

### Step 2: Start the backend

```bash
cd taskflow/backend
npm run dev   # Starts on http://localhost:5000
```

The NeDB data files are auto-created in `backend/data/` on first run.

### Step 3: Start the frontend

```bash
cd taskflow/frontend
npm start     # Starts on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Features

### Authentication
- Signup with name, email, password (bcrypt hashed)
- Login with JWT token (7-day expiry)
- Protected routes — redirects to login if unauthenticated

### Projects
- Create projects (creator auto-assigned as Admin)
- Admin can add members by email, assign roles (Admin/Member)
- Admin can remove members and delete projects

### Tasks
- Admin: Create, edit, delete tasks; assign to members; set priority/due date
- Member: Update status of tasks assigned to them only
- Statuses: To Do → In Progress → Done
- Priorities: Low, Medium, High
- Overdue detection (past due date, not Done)

### Dashboard
- Total task count
- Tasks by status (bar chart)
- Tasks per member
- Overdue task count

### Role-Based Access

| Action                    | Admin | Member |
|---------------------------|-------|--------|
| Create task               | ✅    | ❌     |
| Edit task fully           | ✅    | ❌     |
| Update own task status    | ✅    | ✅     |
| Delete task               | ✅    | ❌     |
| Add/remove members        | ✅    | ❌     |
| Delete project            | ✅    | ❌     |
| View project & tasks      | ✅    | ✅     |

---

## API Endpoints

### Auth
| Method | Endpoint          | Description      |
|--------|-------------------|------------------|
| POST   | /api/auth/signup  | Register user    |
| POST   | /api/auth/login   | Login, get JWT   |
| GET    | /api/auth/me      | Get current user |

### Projects
| Method | Endpoint                       | Description         |
|--------|--------------------------------|---------------------|
| GET    | /api/projects                  | Get user's projects |
| POST   | /api/projects                  | Create project      |
| GET    | /api/projects/:id              | Get project details |
| POST   | /api/projects/:id/members      | Add member          |
| DELETE | /api/projects/:id/members/:uid | Remove member       |
| DELETE | /api/projects/:id              | Delete project      |

### Tasks
| Method | Endpoint                      | Description             |
|--------|-------------------------------|-------------------------|
| GET    | /api/tasks/project/:projectId | Get tasks for project   |
| POST   | /api/tasks                    | Create task             |
| PUT    | /api/tasks/:id                | Update task             |
| DELETE | /api/tasks/:id                | Delete task             |
| GET    | /api/tasks/dashboard/stats    | Get dashboard stats     |

---

## Deployment on Railway

### Overview
Deploy as two separate Railway services — one for the backend, one for the frontend.

### Step 1: Push to GitHub
Push the entire `taskflow/` folder to a GitHub repository.

### Step 2: Deploy the Backend

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your repo and set the **Root Directory** to `taskflow/backend`
3. Railway will auto-detect Node.js and use `railway.json`
4. Add these environment variables in the Railway dashboard:

```
PORT=5000
JWT_SECRET=<generate a strong random string>
NODE_ENV=production
FRONTEND_URL=https://<your-frontend-service>.up.railway.app
```

5. Deploy and copy the generated backend URL (e.g. `https://taskflow-backend.up.railway.app`)

> **Note on data persistence:** NeDB stores data in `backend/data/*.db` files. Railway's filesystem is ephemeral — data will reset on redeploy. For persistent storage, add a Railway Volume mounted at `/app/data`, or migrate to a hosted database (MongoDB Atlas, PlanetScale, etc.).

### Step 3: Deploy the Frontend

1. In the same Railway project → New Service → GitHub repo
2. Set the **Root Directory** to `taskflow/frontend`
3. Railway will use `railway.json` to build and serve the React app
4. Add this environment variable:

```
REACT_APP_API_URL=https://<your-backend-service>.up.railway.app/api
```

5. Deploy and open the generated frontend URL

### Step 4: Verify

- Open the frontend URL in your browser
- Sign up for an account and confirm the backend is reachable
- Check `/api/health` on the backend URL — should return `{"status":"ok"}`

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
JWT_SECRET=your_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:5000/api
```
> In local development, the `proxy` field in `package.json` handles this automatically — the `.env` file is only needed for production builds.
