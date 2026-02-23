# Todo API Design

## Overview

NestJS TodoList API with JWT authentication, PostgreSQL + Prisma, and a `/status` endpoint for CI/CD version verification.

**Repo:** https://github.com/AKNov30/todo-api.git
**Scope:** API only (no CI/CD pipeline files)

## Tech Stack

- NestJS 10+
- Prisma ORM + PostgreSQL
- @nestjs/passport + passport-jwt (authentication)
- class-validator + class-transformer (DTO validation)
- @nestjs/config (environment management)
- bcrypt (password hashing)

## Project Structure

```
todo-api/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/           (register.dto, login.dto)
│   │   ├── guards/        (jwt-auth.guard.ts)
│   │   └── strategies/    (jwt.strategy.ts)
│   ├── todos/
│   │   ├── todos.module.ts
│   │   ├── todos.controller.ts
│   │   ├── todos.service.ts
│   │   └── dto/           (create-todo.dto, update-todo.dto)
│   ├── status/
│   │   ├── status.module.ts
│   │   └── status.controller.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── .env
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  todos     Todo[]
  createdAt DateTime @default(now())
}

model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  detail    String?
  done      Boolean  @default(false)
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

### Auth (`/auth`) - Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (email + password) |
| POST | `/auth/login` | Login, returns JWT token |

### Todos (`/todos`) - Requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/todos` | List user's todos |
| GET | `/todos/:id` | Get single todo |
| POST | `/todos` | Create todo |
| PATCH | `/todos/:id` | Update todo |
| DELETE | `/todos/:id` | Delete todo |

### Status (`/status`) - Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | `{"version": "1.0.0", "status": "ok"}` |

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/todo_db?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"
PORT=3000
```

## Key Decisions

- Feature-based module organization (arch-feature-modules)
- Each user sees only their own todos (filtered by userId from JWT)
- Password hashed with bcrypt
- Version read from package.json
- .env in .gitignore, .env.example committed as template
