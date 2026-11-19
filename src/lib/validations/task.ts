import { z } from "zod";

export const taskPriorityEnum = z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]);
export const taskStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Task title is required." })
    .max(255, { message: "Task title cannot exceed 255 characters." }),
  description: z.string().trim().max(5000).nullable().optional(),
  priority: taskPriorityEnum.default("NORMAL"),
  status: taskStatusEnum.default("TODO"),
  categoryId: z.string().uuid({ message: "Invalid category ID." }).nullable().optional(),
  projectId: z.string().uuid({ message: "Invalid project ID." }).nullable().optional(),
  startDate: z
    .union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}/), z.date()])
    .nullable()
    .optional(),
  dueDate: z
    .union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}/), z.date()])
    .nullable()
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  status: taskStatusEnum,
});

export const updateTaskPrioritySchema = z.object({
  priority: taskPriorityEnum,
});

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Category name is required." })
    .max(64, { message: "Category name cannot exceed 64 characters." }),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
      message: "Please enter a valid hex color code (e.g. #00D4FF).",
    })
    .nullable()
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Project name is required." })
    .max(100, { message: "Project name cannot exceed 100 characters." }),
  description: z.string().trim().max(2000).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
      message: "Please enter a valid hex color code.",
    })
    .nullable()
    .optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "COMPLETED"]).default("ACTIVE"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
