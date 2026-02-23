# Todo API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a NestJS TodoList API with JWT auth, PostgreSQL + Prisma, and a `/status` endpoint for CI/CD version verification.

**Architecture:** Feature-based NestJS modules (auth, todos, status, prisma). Prisma ORM connects to PostgreSQL. JWT authentication guards todo endpoints. Status endpoint reads version from package.json.

**Tech Stack:** NestJS 10+, Prisma, PostgreSQL, @nestjs/passport, passport-jwt, bcrypt, class-validator, @nestjs/config

---

### Task 1: Scaffold NestJS Project

**Files:**
- Create: `D:\ci-cd-sd\` (NestJS scaffold output)

**Step 1: Initialize NestJS project in the working directory**

```bash
cd D:\ci-cd-sd
npx @nestjs/cli new . --package-manager npm --skip-git
```

This scaffolds NestJS into the current directory without initializing git (we'll do that separately).

Expected: NestJS project files created (src/, package.json, tsconfig.json, etc.)

**Step 2: Install additional dependencies**

```bash
cd D:\ci-cd-sd
npm install @nestjs/config @nestjs/passport passport passport-jwt @prisma/client class-validator class-transformer bcrypt @nestjs/jwt
npm install -D prisma @types/passport-jwt @types/bcrypt
```

**Step 3: Verify the project builds**

```bash
cd D:\ci-cd-sd
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Initialize git and connect to remote**

```bash
cd D:\ci-cd-sd
git init
git remote add origin https://github.com/AKNov30/todo-api.git
```

**Step 5: Commit scaffold**

```bash
cd D:\ci-cd-sd
git add -A
git commit -m "chore: scaffold NestJS project with dependencies"
```

---

### Task 2: Environment Configuration

**Files:**
- Create: `D:\ci-cd-sd\.env`
- Create: `D:\ci-cd-sd\.env.example`
- Modify: `D:\ci-cd-sd\.gitignore` (add .env)
- Modify: `D:\ci-cd-sd\src\app.module.ts`

**Step 1: Create .env file**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/todo_db?schema=public"

# JWT
JWT_SECRET="super-secret-key-change-in-production"
JWT_EXPIRES_IN="1d"

# App
PORT=3000
```

**Step 2: Create .env.example file**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/todo_db?schema=public"

# JWT
JWT_SECRET="change-me"
JWT_EXPIRES_IN="1d"

# App
PORT=3000
```

**Step 3: Add .env to .gitignore**

Append to the existing `.gitignore`:
```
# env
.env
```

**Step 4: Configure ConfigModule in app.module.ts**

Replace the contents of `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

**Step 5: Update main.ts to use ConfigService for PORT**

Replace `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();
```

**Step 6: Verify build**

```bash
cd D:\ci-cd-sd
npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
cd D:\ci-cd-sd
git add src/app.module.ts src/main.ts .env.example .gitignore
git commit -m "feat: add environment configuration with ConfigModule"
```

---

### Task 3: Prisma Setup

**Files:**
- Create: `D:\ci-cd-sd\prisma\schema.prisma`
- Create: `D:\ci-cd-sd\src\prisma\prisma.service.ts`
- Create: `D:\ci-cd-sd\src\prisma\prisma.module.ts`

**Step 1: Initialize Prisma**

```bash
cd D:\ci-cd-sd
npx prisma init
```

This creates `prisma/schema.prisma` and updates `.env` with DATABASE_URL.

**Step 2: Define database schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

**Step 3: Create Prisma service**

Create `src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Step 4: Create Prisma module**

Create `src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Step 5: Import PrismaModule in AppModule**

Update `src/app.module.ts` to add PrismaModule to imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
})
export class AppModule {}
```

**Step 6: Generate Prisma client and verify build**

```bash
cd D:\ci-cd-sd
npx prisma generate
npm run build
```

Expected: Prisma client generated and build succeeds.

**Step 7: Commit**

```bash
cd D:\ci-cd-sd
git add prisma/ src/prisma/ src/app.module.ts
git commit -m "feat: add Prisma ORM setup with User and Todo models"
```

---

### Task 4: Status Module

**Files:**
- Create: `D:\ci-cd-sd\src\status\status.controller.ts`
- Create: `D:\ci-cd-sd\src\status\status.module.ts`
- Modify: `D:\ci-cd-sd\src\app.module.ts`

**Step 1: Create status controller**

Create `src/status/status.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import * as packageJson from '../../package.json';

@Controller('status')
export class StatusController {
  @Get()
  getStatus() {
    return {
      version: packageJson.version,
      status: 'ok',
    };
  }
}
```

**Step 2: Enable resolveJsonModule in tsconfig**

In `tsconfig.json`, ensure `compilerOptions` includes:

```json
"resolveJsonModule": true
```

**Step 3: Create status module**

Create `src/status/status.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';

@Module({
  controllers: [StatusController],
})
export class StatusModule {}
```

**Step 4: Import StatusModule in AppModule**

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StatusModule } from './status/status.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StatusModule,
  ],
})
export class AppModule {}
```

**Step 5: Verify build**

```bash
cd D:\ci-cd-sd
npm run build
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
cd D:\ci-cd-sd
git add src/status/ src/app.module.ts tsconfig.json
git commit -m "feat: add GET /status endpoint returning version from package.json"
```

---

### Task 5: Auth Module - DTOs and Service

**Files:**
- Create: `D:\ci-cd-sd\src\auth\dto\register.dto.ts`
- Create: `D:\ci-cd-sd\src\auth\dto\login.dto.ts`
- Create: `D:\ci-cd-sd\src\auth\auth.service.ts`

**Step 1: Create register DTO**

Create `src/auth/dto/register.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**Step 2: Create login DTO**

Create `src/auth/dto/login.dto.ts`:

```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

**Step 3: Create auth service**

Create `src/auth/auth.service.ts`:

```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

**Step 4: Verify build (will fail - auth.module not yet wired, that's expected)**

No build check here. Continue to next step.

---

### Task 6: Auth Module - JWT Strategy, Guard, Controller, Module

**Files:**
- Create: `D:\ci-cd-sd\src\auth\strategies\jwt.strategy.ts`
- Create: `D:\ci-cd-sd\src\auth\guards\jwt-auth.guard.ts`
- Create: `D:\ci-cd-sd\src\auth\auth.controller.ts`
- Create: `D:\ci-cd-sd\src\auth\auth.module.ts`
- Modify: `D:\ci-cd-sd\src\app.module.ts`

**Step 1: Create JWT strategy**

Create `src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: { sub: number; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

**Step 2: Create JWT auth guard**

Create `src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Step 3: Create auth controller**

Create `src/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

**Step 4: Create auth module**

Create `src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

**Step 5: Import AuthModule in AppModule**

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StatusModule } from './status/status.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StatusModule,
    AuthModule,
  ],
})
export class AppModule {}
```

**Step 6: Verify build**

```bash
cd D:\ci-cd-sd
npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
cd D:\ci-cd-sd
git add src/auth/ src/app.module.ts
git commit -m "feat: add auth module with register, login, and JWT authentication"
```

---

### Task 7: Todos Module

**Files:**
- Create: `D:\ci-cd-sd\src\todos\dto\create-todo.dto.ts`
- Create: `D:\ci-cd-sd\src\todos\dto\update-todo.dto.ts`
- Create: `D:\ci-cd-sd\src\todos\todos.service.ts`
- Create: `D:\ci-cd-sd\src\todos\todos.controller.ts`
- Create: `D:\ci-cd-sd\src\todos\todos.module.ts`
- Modify: `D:\ci-cd-sd\src\app.module.ts`

**Step 1: Create create-todo DTO**

Create `src/todos/dto/create-todo.dto.ts`:

```typescript
import { IsString, IsOptional } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  detail?: string;
}
```

**Step 2: Create update-todo DTO**

Create `src/todos/dto/update-todo.dto.ts`:

```typescript
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  detail?: string;

  @IsBoolean()
  @IsOptional()
  done?: boolean;
}
```

**Step 3: Create todos service**

Create `src/todos/todos.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!todo) {
      throw new NotFoundException(`Todo #${id} not found`);
    }

    return todo;
  }

  async create(dto: CreateTodoDto, userId: number) {
    return this.prisma.todo.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async update(id: number, dto: UpdateTodoDto, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.todo.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.todo.delete({
      where: { id },
    });
  }
}
```

**Step 4: Create todos controller**

Create `src/todos/todos.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(@Request() req) {
    return this.todosService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.todosService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateTodoDto, @Request() req) {
    return this.todosService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTodoDto,
    @Request() req,
  ) {
    return this.todosService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.todosService.remove(id, req.user.id);
  }
}
```

**Step 5: Create todos module**

Create `src/todos/todos.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
```

**Step 6: Import TodosModule in AppModule**

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StatusModule } from './status/status.module';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StatusModule,
    AuthModule,
    TodosModule,
  ],
})
export class AppModule {}
```

**Step 7: Verify build**

```bash
cd D:\ci-cd-sd
npm run build
```

Expected: Build succeeds.

**Step 8: Commit**

```bash
cd D:\ci-cd-sd
git add src/todos/ src/app.module.ts
git commit -m "feat: add todos module with CRUD endpoints protected by JWT"
```

---

### Task 8: Clean Up and Final Verification

**Files:**
- Remove: `D:\ci-cd-sd\src\app.controller.ts` (scaffold leftover)
- Remove: `D:\ci-cd-sd\src\app.service.ts` (scaffold leftover)
- Remove: `D:\ci-cd-sd\src\app.controller.spec.ts` (scaffold leftover)

**Step 1: Remove scaffold leftover files**

Delete these files that were auto-generated by NestJS CLI but are no longer used:
- `src/app.controller.ts`
- `src/app.service.ts`
- `src/app.controller.spec.ts`

**Step 2: Verify build**

```bash
cd D:\ci-cd-sd
npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Run database migration (requires running PostgreSQL)**

```bash
cd D:\ci-cd-sd
npx prisma migrate dev --name init
```

Expected: Migration created and applied. Prisma client regenerated.

**Step 4: Start the server and test manually**

```bash
cd D:\ci-cd-sd
npm run start:dev
```

Test with curl or Postman:

```bash
# Test status endpoint
curl http://localhost:3000/status
# Expected: {"version":"0.0.1","status":"ok"}

# Test register
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"123456\"}"
# Expected: {"id":1,"email":"test@test.com"}

# Test login
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"123456\"}"
# Expected: {"access_token":"eyJ..."}

# Test create todo (use token from login)
curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"title\":\"My first todo\"}"
# Expected: {"id":1,"title":"My first todo","detail":null,"done":false,...}

# Test get todos
curl http://localhost:3000/todos -H "Authorization: Bearer <TOKEN>"
# Expected: array of todos
```

**Step 5: Commit final cleanup**

```bash
cd D:\ci-cd-sd
git add -A
git commit -m "chore: remove scaffold leftovers and finalize project"
```

**Step 6: Push to remote**

```bash
cd D:\ci-cd-sd
git branch -M main
git push -u origin main
```

---

## Summary of Commits

1. `chore: scaffold NestJS project with dependencies`
2. `feat: add environment configuration with ConfigModule`
3. `feat: add Prisma ORM setup with User and Todo models`
4. `feat: add GET /status endpoint returning version from package.json`
5. `feat: add auth module with register, login, and JWT authentication`
6. `feat: add todos module with CRUD endpoints protected by JWT`
7. `chore: remove scaffold leftovers and finalize project`

## Notes for CI/CD

- The `/status` endpoint returns `{"version": "x.x.x", "status": "ok"}` — version comes from `package.json`
- To bump version for CI/CD: update `version` field in `package.json` (e.g., `npm version patch`)
- Database migration must run before the app starts: `npx prisma migrate deploy`
- Required env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`
