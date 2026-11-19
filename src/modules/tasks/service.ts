import { prisma } from "@/lib/prisma/client";
import {
  TaskDto,
  TaskFilters,
  DashboardTaskStats,
  TaskCategoryDto,
  ProjectDto,
  TaskStatus,
  TaskPriority,
} from "./types";
import {
  CreateTaskInput,
  UpdateTaskInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/validations/task";
import {
  getKolkataStartOfDay,
  getKolkataEndOfDay,
} from "@/lib/utils/timezone";
import { Prisma } from "@prisma/client";

export class TaskService {
  /**
   * Query tasks with multi-filter, search, view tabs, and sorting.
   */
  async getTasks(userId: string, filters: TaskFilters = {}): Promise<TaskDto[]> {
    const {
      search,
      status,
      priority,
      categoryId,
      projectId,
      view = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      page,
      limit,
    } = filters;

    const where: Prisma.TaskWhereInput = {
      userId,
      deletedAt: null, // Soft delete filter
    };

    // Text search in title or description
    if (search && search.trim() !== "") {
      const query = search.trim();
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    // Direct filters
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    // View tab filtering (Asia/Kolkata timezone aware)
    const todayStart = getKolkataStartOfDay();
    const todayEnd = getKolkataEndOfDay();

    switch (view) {
      case "my-day":
        where.status = { notIn: ["COMPLETED", "CANCELLED"] };
        where.AND = [
          {
            OR: [
              // Due today in Asia/Kolkata
              {
                dueDate: {
                  gte: todayStart,
                  lte: todayEnd,
                },
              },
              // Start date has arrived (<= today in Asia/Kolkata)
              {
                startDate: {
                  lte: todayEnd,
                },
              },
            ],
          },
        ];
        break;

      case "upcoming":
        where.status = { notIn: ["COMPLETED", "CANCELLED"] };
        where.dueDate = {
          gt: todayEnd,
        };
        break;

      case "overdue":
        where.status = { notIn: ["COMPLETED", "CANCELLED"] };
        where.dueDate = {
          lt: todayStart,
        };
        break;

      case "completed":
        where.status = "COMPLETED";
        break;

      case "cancelled":
        where.status = "CANCELLED";
        break;

      case "all":
      default:
        // No additional view filtering
        break;
    }

    // Sorting
    let orderBy: Prisma.TaskOrderByWithRelationInput[] = [];

    if (sortBy === "priority") {
      // In PostgreSQL, priority text sorting can be combined with createdAt
      orderBy = [{ priority: sortOrder }, { createdAt: "desc" }];
    } else if (sortBy === "dueDate") {
      orderBy = [{ dueDate: sortOrder }, { createdAt: "desc" }];
    } else if (sortBy === "title") {
      orderBy = [{ title: sortOrder }];
    } else {
      orderBy = [{ createdAt: sortOrder }];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip: page && limit ? (page - 1) * limit : undefined,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true, color: true, status: true },
        },
      },
    });

    return tasks.map((t) => ({
      id: t.id,
      userId: t.userId,
      title: t.title,
      description: t.description,
      status: t.status as TaskStatus,
      priority: t.priority as TaskPriority,
      startDate: t.startDate,
      dueDate: t.dueDate,
      completedAt: t.completedAt,
      deletedAt: t.deletedAt,
      projectId: t.projectId,
      categoryId: t.categoryId,
      category: t.category,
      project: t.project,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  /**
   * Get single task with ownership check.
   */
  async getTaskById(userId: string, taskId: string): Promise<TaskDto | null> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true, color: true, status: true },
        },
      },
    });

    if (!task) return null;

    return {
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      deletedAt: task.deletedAt,
      projectId: task.projectId,
      categoryId: task.categoryId,
      category: task.category,
      project: task.project,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Create a new task.
   */
  async createTask(userId: string, input: CreateTaskInput): Promise<TaskDto> {
    // Validate category ownership if assigned
    if (input.categoryId) {
      const category = await prisma.taskCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new Error("Category not found or does not belong to you.");
      }
    }

    // Validate project ownership if assigned
    if (input.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId },
      });
      if (!project) {
        throw new Error("Project not found or does not belong to you.");
      }
    }

    const completedAt = input.status === "COMPLETED" ? new Date() : null;

    const task = await prisma.task.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "NORMAL",
        status: input.status ?? "TODO",
        categoryId: input.categoryId ?? null,
        projectId: input.projectId ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        completedAt,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true, color: true, status: true },
        },
      },
    });

    return {
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      deletedAt: task.deletedAt,
      projectId: task.projectId,
      categoryId: task.categoryId,
      category: task.category,
      project: task.project,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Update task fields, managing completedAt state transitions.
   */
  async updateTask(
    userId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<TaskDto> {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Task not found or access denied.");
    }

    // Validate category ownership if changing
    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await prisma.taskCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new Error("Category not found or does not belong to you.");
      }
    }

    // Validate project ownership if changing
    if (input.projectId !== undefined && input.projectId !== null) {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId },
      });
      if (!project) {
        throw new Error("Project not found or does not belong to you.");
      }
    }

    // Handle completedAt transition
    let completedAt: Date | null = existing.completedAt;
    if (input.status !== undefined) {
      if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
        completedAt = new Date();
      } else if (input.status !== "COMPLETED" && existing.status === "COMPLETED") {
        completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status, completedAt } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.startDate !== undefined
          ? { startDate: input.startDate ? new Date(input.startDate) : null }
          : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
          : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true, color: true, status: true },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      description: updated.description,
      status: updated.status as TaskStatus,
      priority: updated.priority as TaskPriority,
      startDate: updated.startDate,
      dueDate: updated.dueDate,
      completedAt: updated.completedAt,
      deletedAt: updated.deletedAt,
      projectId: updated.projectId,
      categoryId: updated.categoryId,
      category: updated.category,
      project: updated.project,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Soft delete task using deletedAt.
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Task not found or access denied.");
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Calculate all 8 real-time dashboard task metrics in Asia/Kolkata timezone.
   */
  async getDashboardTaskStats(userId: string): Promise<DashboardTaskStats> {
    const todayStart = getKolkataStartOfDay();
    const todayEnd = getKolkataEndOfDay();

    const [
      totalActive,
      todo,
      inProgress,
      completed,
      overdue,
      critical,
      today,
      upcoming,
    ] = await Promise.all([
      // Total active tasks (not completed or cancelled, not deleted)
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      }),
      // To Do
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: "TODO",
        },
      }),
      // In Progress
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: "IN_PROGRESS",
        },
      }),
      // Completed
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: "COMPLETED",
        },
      }),
      // Overdue (incomplete, dueDate < today in Asia/Kolkata)
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { lt: todayStart },
        },
      }),
      // Critical priority (incomplete, priority = CRITICAL)
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          priority: "CRITICAL",
        },
      }),
      // Today's tasks (incomplete, dueDate between start & end of today in Asia/Kolkata)
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      // Upcoming deadlines (incomplete, dueDate > end of today in Asia/Kolkata)
      prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { gt: todayEnd },
        },
      }),
    ]);

    return {
      totalActive,
      todo,
      inProgress,
      completed,
      overdue,
      critical,
      today,
      upcoming,
    };
  }

  // ---------------------------------------------------------------------------
  // TASK CATEGORIES
  // ---------------------------------------------------------------------------

  async getCategories(userId: string): Promise<TaskCategoryDto[]> {
    const categories = await prisma.taskCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      taskCount: c._count.tasks,
    }));
  }

  async createCategory(
    userId: string,
    input: CreateCategoryInput
  ): Promise<TaskCategoryDto> {
    const existing = await prisma.taskCategory.findFirst({
      where: {
        userId,
        name: { equals: input.name.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      throw new Error(`A category named "${input.name.trim()}" already exists.`);
    }

    const created = await prisma.taskCategory.create({
      data: {
        userId,
        name: input.name.trim(),
        color: input.color ?? null,
      },
    });

    return {
      id: created.id,
      name: created.name,
      color: created.color,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      taskCount: 0,
    };
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<TaskCategoryDto> {
    const category = await prisma.taskCategory.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new Error("Category not found or access denied.");
    }

    if (input.name && input.name.trim() !== category.name) {
      const duplicate = await prisma.taskCategory.findFirst({
        where: {
          userId,
          name: { equals: input.name.trim(), mode: "insensitive" },
          id: { not: categoryId },
        },
      });
      if (duplicate) {
        throw new Error(`A category named "${input.name.trim()}" already exists.`);
      }
    }

    const updated = await prisma.taskCategory.update({
      where: { id: categoryId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const category = await prisma.taskCategory.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new Error("Category not found or access denied.");
    }

    // Set categoryId = null on tasks, then delete category
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { categoryId, userId },
        data: { categoryId: null },
      }),
      prisma.taskCategory.delete({
        where: { id: categoryId },
      }),
    ]);
  }

  // ---------------------------------------------------------------------------
  // PROJECTS
  // ---------------------------------------------------------------------------

  async getProjects(userId: string): Promise<ProjectDto[]> {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      taskCount: p._count.tasks,
    }));
  }

  async createProject(
    userId: string,
    input: CreateProjectInput
  ): Promise<ProjectDto> {
    const created = await prisma.project.create({
      data: {
        userId,
        name: input.name.trim(),
        description: input.description ?? null,
        color: input.color ?? null,
        status: input.status ?? "ACTIVE",
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      color: created.color,
      status: created.status,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      taskCount: 0,
    };
  }

  async updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<ProjectDto> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      color: updated.color,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    // Preserve associated tasks (set projectId = null), then delete project
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { projectId, userId },
        data: { projectId: null },
      }),
      prisma.project.delete({
        where: { id: projectId },
      }),
    ]);
  }
}

export const taskService = new TaskService();
