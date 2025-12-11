# Portfolio Full-Stack Project

This is a **Monorepo** containing the full-stack source code for my portfolio application. It demonstrates a modern microservices-based architecture handling Frontend, BFF (Backend for Frontend), and Backend services.

## 🏗️ Architecture Structure

| Service      | Technology           | Path        | Port | Description                                             |
| ------------ | -------------------- | ----------- | ---- | ------------------------------------------------------- |
| **Frontend** | React (Next.js)      | `/frontend` | 3000 | The user interface application.                         |
| **BFF**      | Node.js (Express/TS) | `/bff`      | 4000 | Acts as an API Gateway/Aggregator for the frontend.     |
| **Backend**  | Java Spring Boot     | `/backend`  | 8080 | Core business logic and database interactions.          |
| **Gateway**  | Nginx                | Docker      | 8080 | Reverse proxy unifying frontend and BFF under one port. |
| **Database** | MySQL 8.0            | Docker      | 3306 | Primary data store.                                     |

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Required for full system)
- [Node.js 20+](https://nodejs.org/) (For local frontend/bff dev)
- [Java 21 (JDK)](https://adoptium.net/) (For local backend dev)

### 🐳 Option 1: Run Everything (Recommended for Integration Testing)

You can spin up the entire system (Frontend + BFF + Backend + DB + Middleware) with a single command:

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down
```

> Access Frontend at: [http://localhost:8080](http://localhost:8080) (via Gateway)

### 💻 Option 2: Run Services Individually (Development Mode)

Useful when you want to focus on coding one specific service with Hot Reload.

**1. Frontend Only**

```bash
npm run dev:frontend
# OR
cd frontend && npm run dev
```

**2. BFF Only**

```bash
npm run dev:bff
# OR
cd bff && npm run dev
```

**3. Backend Only**

```bash
npm run dev:backend
# OR
cd backend && ./mvnw spring-boot:run
```

---

## 🛠️ Project Configuration

### IDE Setup (VS Code)

1. Open this root folder in VS Code.
2. Click **"Open Workspace"** when prompted, or open `portfolio.code-workspace` manually.
3. This will configure extensions (ESLint for JS, Extension Pack for Java) automatically based on the folder context.

### Gitignore Policy

- **Root `.gitignore`**: Handles global files (`node_modules`, `.DS_Store`, `.idea`).
- **Sub-project `.gitignore`**: Handles specific build artifacts (`.next`, `target`, `dist`).

---

## 🔄 CI/CD Pipelines

Automated workflows are configured in `.github/workflows/`:

- **Frontend CI/CD**:
  - **CI**: Runs Lint/Test on every push to `frontend/**`.
  - **CD**: Builds Docker Image & Pushes to GHCR on changes to `main`.
- **Backend CI**: Builds with Maven on every push to `backend/**`.
- **BFF CI**: Builds Typescript on every push to `bff/**`.

## 📜 License

[MIT](LICENSE)
