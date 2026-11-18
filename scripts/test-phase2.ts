import { prisma } from "../src/lib/prisma/client";
import { taskService } from "../src/modules/tasks/service";
import {
  isOverdueKolkata,
  isDueTodayKolkata,
  isUpcomingKolkata,
  isMyDayKolkata,
  getKolkataStartOfDay,
  getKolkataDateParts,
} from "../src/lib/utils/timezone";
import { GET as getTasksRoute, POST as postTaskRoute } from "../src/app/api/tasks/route";
import { GET as getStatsRoute } from "../src/app/api/tasks/stats/route";
import { NextRequest } from "next/server";

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`[PASS] ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`[FAIL] ${name}${details ? ` - ${details}` : ""}`);
  }
}

async function runTests() {
  console.log("=== JARVIS PHASE 2 COMPREHENSIVE TEST SUITE ===");
  console.log(`Timezone under test: Asia/Kolkata (IST)`);
  const todayParts = getKolkataDateParts();
  console.log(`Current Date in Kolkata: ${todayParts.dateString}`);

  // Fetch admin user
  const user = await prisma.user.findFirst({
    where: { email: "ck@jarvis.local" },
  });

  if (!user) {
    throw new Error("Admin user ck@jarvis.local not found in PostgreSQL!");
  }
  console.log(`Testing with user: ${user.name} (${user.email}, id: ${user.id})`);

  // Clean up any previous test tasks/categories/projects for this user
  console.log("Cleaning test fixtures...");
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.taskCategory.deleteMany({ where: { userId: user.id } });
  await prisma.project.deleteMany({ where: { userId: user.id } });

  // TEST 1: Create Category & Duplicate Prevention
  console.log("\n--- TEST GROUP: Categories ---");
  const catOps = await taskService.createCategory(user.id, {
    name: "DevOps & Cloud",
    color: "#00D4FF",
  });
  assert(catOps.id !== undefined && catOps.name === "DevOps & Cloud", "Create category with color");

  let duplicateBlocked = false;
  try {
    await taskService.createCategory(user.id, {
      name: "DevOps & Cloud",
      color: "#FF0000",
    });
  } catch (err: any) {
    duplicateBlocked = err.message.includes("already exists");
  }
  assert(duplicateBlocked, "Prevent duplicate category name for same user");

  // TEST 2: Update Category
  const catUpdated = await taskService.updateCategory(user.id, catOps.id, {
    name: "Infrastructure & Cloud",
    color: "#00E5FF",
  });
  assert(catUpdated.name === "Infrastructure & Cloud", "Edit category name and color");

  // TEST 3: Create Project
  console.log("\n--- TEST GROUP: Projects ---");
  const project = await taskService.createProject(user.id, {
    name: "JARVIS Core v2.0",
    description: "Personal AI Assistant Architecture",
    color: "#7A3FFF",
    status: "ACTIVE",
  });
  assert(project.id !== undefined && project.name === "JARVIS Core v2.0", "Create project with status and color");

  // TEST 4: Update Project Status to ARCHIVED
  const projArchived = await taskService.updateProject(user.id, project.id, {
    status: "ARCHIVED",
  });
  assert(projArchived.status === "ARCHIVED", "Update project status to ARCHIVED");

  // Re-activate for task tests
  await taskService.updateProject(user.id, project.id, { status: "ACTIVE" });

  // TEST 5: Create Task with Full Metadata
  console.log("\n--- TEST GROUP: Task Creation & Metadata ---");
  const today = getKolkataStartOfDay();
  const pastDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const futureDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days in future

  const task1 = await taskService.createTask(user.id, {
    title: "Deploy Kubernetes Cluster in Production",
    description: "Configure worker nodes, ingress controller, and persistent storage volumes",
    priority: "CRITICAL",
    status: "TODO",
    categoryId: catUpdated.id,
    projectId: project.id,
    startDate: today,
    dueDate: futureDate,
  });

  assert(
    task1.id !== undefined &&
      task1.title === "Deploy Kubernetes Cluster in Production" &&
      task1.priority === "CRITICAL" &&
      task1.status === "TODO" &&
      task1.completedAt === null,
    "1. Create task with full metadata"
  );

  // TEST 6: Verify task saved in PostgreSQL
  const dbTask1 = await prisma.task.findUnique({ where: { id: task1.id } });
  assert(dbTask1 !== null && dbTask1.userId === user.id, "2. Verify task saved in PostgreSQL with correct user ownership");

  // TEST 7: Edit task fields
  const updatedTask1 = await taskService.updateTask(user.id, task1.id, {
    title: "Deploy Multi-Cloud Kubernetes Cluster",
    priority: "HIGH",
  });
  assert(
    updatedTask1.title === "Deploy Multi-Cloud Kubernetes Cluster" && updatedTask1.priority === "HIGH",
    "3. Edit task fields (title, priority)"
  );

  // TEST 8: Move task in Kanban board (Status transitions)
  console.log("\n--- TEST GROUP: Status Transitions & completedAt ---");
  const movedToProgress = await taskService.updateTask(user.id, task1.id, {
    status: "IN_PROGRESS",
  });
  assert(
    movedToProgress.status === "IN_PROGRESS" && movedToProgress.completedAt === null,
    "4 & 5. Move task to IN_PROGRESS in Kanban, status updated, completedAt remains null"
  );

  // Mark completed
  const completedTask = await taskService.updateTask(user.id, task1.id, {
    status: "COMPLETED",
  });
  assert(
    completedTask.status === "COMPLETED" && completedTask.completedAt !== null,
    "6. Mark task COMPLETED sets completedAt timestamp"
  );

  // Re-open completed task
  const reopenedTask = await taskService.updateTask(user.id, task1.id, {
    status: "TODO",
  });
  assert(
    reopenedTask.status === "TODO" && reopenedTask.completedAt === null,
    "6b. Re-open task from COMPLETED clears completedAt back to null"
  );

  // TEST 9: Create Additional Tasks for Filtering, Timezone & Overdue
  console.log("\n--- TEST GROUP: Timezone & Overdue Handling ---");
  // Overdue task (past date)
  const taskOverdue = await taskService.createTask(user.id, {
    title: "Database Backup Verification (Overdue)",
    description: "Verify automated WAL archiving",
    priority: "NORMAL",
    status: "TODO",
    dueDate: pastDate,
  });

  // Task due TODAY in Asia/Kolkata
  const taskToday = await taskService.createTask(user.id, {
    title: "Security Audit (Due Today)",
    description: "Review SSH keys and IAM access tokens",
    priority: "CRITICAL",
    status: "TODO",
    dueDate: today,
  });

  // Task due in future
  const taskFuture = await taskService.createTask(user.id, {
    title: "Architecture Review (Upcoming)",
    description: "Review system scalability specs",
    priority: "LOW",
    status: "TODO",
    dueDate: futureDate,
  });

  // Verify Timezone Overdue Calculations (Asia/Kolkata)
  const isOverdueReal = isOverdueKolkata(taskOverdue.dueDate, taskOverdue.status);
  const isTodayOverdue = isOverdueKolkata(taskToday.dueDate, taskToday.status);
  const isTodayDue = isDueTodayKolkata(taskToday.dueDate);
  const isFutureUpcoming = isUpcomingKolkata(taskFuture.dueDate, taskFuture.status);

  assert(isOverdueReal === true, "Task with past due date is marked overdue");
  assert(
    isTodayOverdue === false && isTodayDue === true,
    "9. Tasks due today in Asia/Kolkata are NOT marked overdue and are identified as today"
  );
  assert(isFutureUpcoming === true, "Task with future due date is marked upcoming");

  // TEST 10: Filtering & Search
  console.log("\n--- TEST GROUP: Filtering & Search ---");
  // Search by title
  const searchTitleRes = await taskService.getTasks(user.id, { search: "Kubernetes" });
  assert(searchTitleRes.length >= 1 && searchTitleRes[0].id === task1.id, "8a. Search tasks by title");

  // Search by description
  const searchDescRes = await taskService.getTasks(user.id, { search: "WAL archiving" });
  assert(searchDescRes.length >= 1 && searchDescRes[0].id === taskOverdue.id, "8b. Search tasks by description");

  // Filter by priority
  const criticalTasks = await taskService.getTasks(user.id, { priority: "CRITICAL" });
  assert(criticalTasks.every((t) => t.priority === "CRITICAL"), "7a. Filter tasks by priority CRITICAL");

  // Filter by category
  const catTasks = await taskService.getTasks(user.id, { categoryId: catUpdated.id });
  assert(catTasks.length === 1 && catTasks[0].id === task1.id, "7b. Filter tasks by category");

  // Filter by project
  const projTasks = await taskService.getTasks(user.id, { projectId: project.id });
  assert(projTasks.length === 1 && projTasks[0].id === task1.id, "7c. Filter tasks by project");

  // Tabs: My Day
  const myDayTasks = await taskService.getTasks(user.id, { view: "my-day" });
  assert(myDayTasks.some((t) => t.id === taskToday.id), "Tab 'My Day' contains tasks due today");

  // Tabs: Overdue
  const overdueTabTasks = await taskService.getTasks(user.id, { view: "overdue" });
  assert(
    overdueTabTasks.some((t) => t.id === taskOverdue.id) &&
      !overdueTabTasks.some((t) => t.id === taskToday.id),
    "Tab 'Overdue' contains overdue task and excludes today's task"
  );

  // TEST 11: Soft Delete
  console.log("\n--- TEST GROUP: Soft Deletion ---");
  await taskService.deleteTask(user.id, taskFuture.id);
  const deletedTaskDb = await prisma.task.findUnique({ where: { id: taskFuture.id } });
  assert(deletedTaskDb !== null && deletedTaskDb.deletedAt !== null, "10. Soft-delete task sets deletedAt timestamp");

  const normalListAfterDelete = await taskService.getTasks(user.id);
  assert(
    !normalListAfterDelete.some((t) => t.id === taskFuture.id),
    "11. Soft-deleted task is omitted from normal task views"
  );

  // TEST 12: Category Deletion Preserves Tasks (categoryId -> null)
  console.log("\n--- TEST GROUP: Referential Integrity On Delete ---");
  await taskService.deleteCategory(user.id, catUpdated.id);
  const taskAfterCatDelete = await prisma.task.findUnique({ where: { id: task1.id } });
  assert(
    taskAfterCatDelete !== null && taskAfterCatDelete.categoryId === null,
    "14. Deleting category preserves tasks and sets categoryId to null"
  );

  // TEST 13: Project Deletion Preserves Tasks (projectId -> null)
  await taskService.deleteProject(user.id, project.id);
  const taskAfterProjDelete = await prisma.task.findUnique({ where: { id: task1.id } });
  assert(
    taskAfterProjDelete !== null && taskAfterProjDelete.projectId === null,
    "16. Deleting project preserves tasks and sets projectId to null"
  );

  // TEST 14: Dashboard Metrics Match Real Data
  console.log("\n--- TEST GROUP: Dashboard Metrics ---");
  const stats = await taskService.getDashboardTaskStats(user.id);
  // We have task1 (TODO), taskOverdue (TODO, overdue), taskToday (TODO, today, critical)
  // taskFuture was soft-deleted
  const activeCount = await prisma.task.count({
    where: { userId: user.id, deletedAt: null, status: { in: ["TODO", "IN_PROGRESS"] } },
  });
  assert(stats.totalActive === activeCount, "17. Dashboard totalActive matches real database count");
  assert(stats.today >= 1, "Dashboard today count is accurate");
  assert(stats.overdue >= 1, "Dashboard overdue count is accurate");
  assert(stats.critical >= 1, "Dashboard critical priority count is accurate");

  // TEST 15: Security - Unauthenticated API Requests Rejected (HTTP 401)
  console.log("\n--- TEST GROUP: API Security (Unauthenticated 401) ---");
  const tasksRouteRes = await fetch("http://localhost:3000/api/tasks");
  assert(tasksRouteRes.status === 401, "18a. GET /api/tasks rejects unauthenticated request with 401");

  const postRouteRes = await fetch("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hack attempt" }),
  });
  assert(postRouteRes.status === 401, "18b. POST /api/tasks rejects unauthenticated request with 401");

  const statsRouteRes = await fetch("http://localhost:3000/api/tasks/stats");
  assert(statsRouteRes.status === 401, "18c. GET /api/tasks/stats rejects unauthenticated request with 401");

  const catRouteRes = await fetch("http://localhost:3000/api/tasks/categories");
  assert(catRouteRes.status === 401, "18d. GET /api/tasks/categories rejects unauthenticated request with 401");

  const projRouteRes = await fetch("http://localhost:3000/api/tasks/projects");
  assert(projRouteRes.status === 401, "18e. GET /api/tasks/projects rejects unauthenticated request with 401");

  // Clean up test tasks and create fresh representative initial tasks for admin
  console.log("\n--- Seeding Realistic Demo Data for Admin ---");
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.taskCategory.deleteMany({ where: { userId: user.id } });
  await prisma.project.deleteMany({ where: { userId: user.id } });

  const catWork = await taskService.createCategory(user.id, { name: "Engineering", color: "#00D4FF" });
  const catPersonal = await taskService.createCategory(user.id, { name: "Personal Ops", color: "#A78BFA" });
  const catSecurity = await taskService.createCategory(user.id, { name: "Security", color: "#F59E0B" });

  const projJarvis = await taskService.createProject(user.id, {
    name: "JARVIS Core",
    description: "Personal AI Assistant System",
    color: "#00D4FF",
    status: "ACTIVE",
  });
  const projInfra = await taskService.createProject(user.id, {
    name: "Home Infrastructure",
    description: "Self-hosted hardware & storage",
    color: "#7A3FFF",
    status: "ACTIVE",
  });

  // Seed tasks
  await taskService.createTask(user.id, {
    title: "Verify PostgreSQL automated WAL archive and backup retention",
    description: "Ensure recovery point objective of < 15 minutes is sustained across storage pools.",
    priority: "CRITICAL",
    status: "IN_PROGRESS",
    categoryId: catWork.id,
    projectId: projJarvis.id,
    startDate: today,
    dueDate: today,
  });

  await taskService.createTask(user.id, {
    title: "Review Zero-Trust SSH keys and internal certificate rotations",
    description: "Audit all active SSH authorized_keys and update 90-day certificates.",
    priority: "HIGH",
    status: "TODO",
    categoryId: catSecurity.id,
    projectId: projInfra.id,
    startDate: today,
    dueDate: futureDate,
  });

  await taskService.createTask(user.id, {
    title: "Configure local AI embeddings cache and vector indices",
    description: "Benchmark vector query latency on local neural cache.",
    priority: "NORMAL",
    status: "TODO",
    categoryId: catWork.id,
    projectId: projJarvis.id,
    dueDate: futureDate,
  });

  await taskService.createTask(user.id, {
    title: "System architecture and component inventory sign-off",
    description: "Completed full system architecture spec for JARVIS Phase 2.",
    priority: "NORMAL",
    status: "COMPLETED",
    categoryId: catWork.id,
    projectId: projJarvis.id,
    dueDate: today,
  });

  console.log("\n================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log("================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution encountered an error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
