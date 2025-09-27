# Project Overview

This repository contains a monorepo for a web application comprised of a frontend, a backend, and an AI service. The project is fully containerized using Docker.

- **Frontend:** A [Next.js](https://nextjs.org/) application using React, TypeScript, and [Tailwind CSS](https://tailwindcss.com/). It utilizes [Radix UI](https://www.radix-ui.com/) for accessible components, [Zustand](https://github.com/pmndrs/zustand) for state management, and [React Query](https://tanstack.com/query/latest) for server state management and caching.

- **Backend:** A [Spring Boot](https://spring.io/projects/spring-boot) application using Java 21 and Gradle. It handles business logic, user authentication, and data persistence. Key technologies include Spring Data JPA, Spring Security (with JWT and OAuth2), and Spring Web.

- **AI Service:** A [FastAPI](https://fastapi.tiangolo.com/) application using Python. It serves machine learning models and provides AI-powered features, using libraries like PyTorch, Pandas, and OpenAI.

- **Database & Caching:** The primary database is [MySQL](https://www.mysql.com/), and [Redis](https://redis.io/) is used for caching and session management (e.g., refresh tokens).

- **CI/CD & Deployment:** The project is deployed via a [Jenkins](https://www.jenkins.io/) pipeline defined in the `Jenkinsfile`. The pipeline builds Docker images for each service and orchestrates them using `docker-compose`.

## Building and Running

The entire application is designed to be run with Docker Compose.

### Production / Jenkins Deployment

The Jenkins pipeline (`Jenkinsfile`) automates the deployment process. It uses `docker-compose.yml` in conjunction with `docker-compose.prod.yml` to build and run the services.

- **Build Command:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache`
- **Run Command:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
- **Stop & Cleanup Command:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v` (The `-v` flag is crucial to remove volumes and ensure database re-initialization on the next run).

### Local Development

For local development, you can use the `docker-compose.override.yml` file which enables features like hot-reloading.

- **Run Command:** `docker-compose up --build`
- **Stop Command:** `docker-compose down`

You can also run each service individually:

- **Frontend:**
  ```bash
  cd frontend
  yarn dev
  ```

- **Backend:**
  ```bash
  cd backend
  ./gradlew bootRun
  ```

- **AI Service:**
  ```bash
  cd ai
  uvicorn app.main:app --reload
  ```

## Development Conventions

- **Monorepo Structure:** Code is organized into separate directories (`frontend`, `backend`, `ai`) for each service.
- **Containerization:** Each service has its own `Dockerfile` for creating production-ready images and a `Dockerfile.dev` for development environments.
- **API Communication:** The frontend communicates with the backend via a proxy configured in `next.config.ts`. The backend then communicates with the AI service over the internal Docker network.
- **Authentication:** Authentication is handled via JWTs (Access and Refresh Tokens) stored in secure, HttpOnly cookies. The frontend automatically handles token refresh via an Axios interceptor.
- **Database Initialization:** The MySQL database is initialized via an `init.sql` script when the container is first created. This script also loads initial data from `.csv` files located in the `mysql` directory.
