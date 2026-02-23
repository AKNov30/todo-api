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
