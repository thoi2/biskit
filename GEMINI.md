# Project Overview

This is a monorepo for a web application with a frontend, backend, and an AI service.

- **Frontend:** A Next.js application using React, Tailwind CSS, and Radix UI for the user interface, Zustand and React Query for state management.
- **Backend:** A Spring Boot application using Java, Spring Data JPA for database interaction with MySQL, Spring Data Redis for caching, Spring Security for authentication and authorization, and WebSockets for real-time communication.
- **AI:** A FastAPI application using Python, PyTorch, and PyTorch Geometric for machine learning-powered features.
- **Database:** The project uses MySQL as the primary database and Redis for in-memory data storage.
- **Orchestration:** The entire application is orchestrated using Docker Compose.

## Building and Running

The project is containerized using Docker. To build and run the application, you can use the following Docker Compose commands:

- **Development:** `docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build`
- **Production:** `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`

### Frontend (Next.js)

- **Development server:** `npm run dev` or `yarn dev`
- **Build:** `npm run build` or `yarn build`
- **Start:** `npm run start` or `yarn start`
- **Lint:** `npm run lint` or `yarn lint`

### Backend (Spring Boot)

The backend is a Gradle project. You can use the Gradle wrapper to build and run the application.

- **Build:** `./gradlew build`
- **Run:** `./gradlew bootRun`

### AI (FastAPI)

The AI service is a Python application.

- **Run (development):** `uvicorn app.main:app --reload`

## Development Conventions

- The project follows a monorepo structure, with separate directories for the frontend, backend, and AI services.
- Each service has its own Dockerfile for containerization.
- The frontend uses TypeScript and follows the conventions of a standard Next.js project.
- The backend is a standard Spring Boot application with a layered architecture.
- The AI service is a standard FastAPI application.
