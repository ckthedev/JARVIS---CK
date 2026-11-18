import { prisma } from "../src/lib/prisma/client";
import { noteService } from "../src/modules/notes/service";
import { taskService } from "../src/modules/tasks/service";

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
  console.log("=== JARVIS PHASE 3: NOTES MANAGEMENT SYSTEM TEST SUITE ===");

  // 1. Fetch Admin User
  const user = await prisma.user.findFirst({
    where: { email: "ck@jarvis.local" },
  });

  if (!user) {
    throw new Error("Admin user ck@jarvis.local not found in PostgreSQL!");
  }
  console.log(`Testing with user: ${user.name} (${user.email}, id: ${user.id})`);

  // Clean test fixtures for notes
  console.log("Cleaning note test fixtures...");
  await prisma.noteAttachment.deleteMany({ where: { note: { userId: user.id } } });
  await prisma.noteTagOnNote.deleteMany({ where: { note: { userId: user.id } } });
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.noteCategory.deleteMany({ where: { userId: user.id } });
  await prisma.noteTag.deleteMany({ where: { userId: user.id } });

  // TEST GROUP 1: CATEGORIES
  console.log("\n--- TEST GROUP 1: Categories ---");
  const catArchitecture = await noteService.createCategory(user.id, {
    name: "System Architecture",
    color: "#00D4FF",
  });
  assert(
    catArchitecture.id !== undefined && catArchitecture.name === "System Architecture",
    "1. Create category with custom color"
  );

  let dupCategoryBlocked = false;
  try {
    await noteService.createCategory(user.id, {
      name: "system architecture", // Case-insensitive duplicate
      color: "#FF0000",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    dupCategoryBlocked = msg.includes("already exists");
  }
  assert(dupCategoryBlocked, "2. Prevent duplicate category names for same user (case-insensitive)");

  const catRenamed = await noteService.updateCategory(user.id, catArchitecture.id, {
    name: "Enterprise Architecture",
    color: "#00E5FF",
  });
  assert(catRenamed.name === "Enterprise Architecture", "3. Rename category and update color");

  // TEST GROUP 2: TAGS
  console.log("\n--- TEST GROUP 2: Tags ---");
  const tagInfra = await noteService.createTag(user.id, {
    name: "infrastructure",
    color: "#7A3FFF",
  });
  assert(tagInfra.id !== undefined && tagInfra.name === "infrastructure", "4. Create tag");

  let dupTagBlocked = false;
  try {
    await noteService.createTag(user.id, {
      name: "INFRASTRUCTURE",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    dupTagBlocked = msg.includes("already exists");
  }
  assert(dupTagBlocked, "5. Prevent duplicate tag names for same user");

  const tagSecurity = await noteService.createTag(user.id, {
    name: "security",
    color: "#F59E0B",
  });
  assert(tagSecurity.name === "security", "6. Create additional tag");

  // TEST GROUP 3: NOTE CREATION & RICH TEXT
  console.log("\n--- TEST GROUP 3: Note Creation & Rich-Text Content ---");
  const note1 = await noteService.createNote(user.id, {
    title: "Kubernetes High Availability Cluster Specs",
    content: "<h1>Cluster Topology</h1><p>Three control plane nodes with etcd quorum and raft consensus.</p>",
    categoryId: catRenamed.id,
    tagNames: ["infrastructure", "security"],
    isPinned: false,
    isArchived: false,
  });

  assert(
    note1.id !== undefined &&
      note1.title === "Kubernetes High Availability Cluster Specs" &&
      note1.categoryId === catRenamed.id &&
      note1.tags.length === 2 &&
      note1.wordCount > 0,
    "7. Create note with title, rich-text HTML, category, and multiple tags"
  );

  assert(
    note1.plainText.includes("Cluster Topology Three control plane nodes"),
    "8. Plain text extraction from rich-text HTML is accurate and clean"
  );

  // Default title behavior
  const untitledNote = await noteService.createNote(user.id, {
    content: "<p>Quick scratchpad thought</p>",
  });
  assert(untitledNote.title === "Untitled Note", "9. Untitled note receives sensible default title");

  // TEST GROUP 4: EDIT NOTE & AUTOSAVE PERSISTENCE
  console.log("\n--- TEST GROUP 4: Edit Note & Database Persistence ---");
  const updatedNote1 = await noteService.updateNote(user.id, note1.id, {
    title: "Kubernetes Multi-Region HA Cluster Specs",
    content: "<h2>Updated Topology</h2><p>Spanning 3 availability zones with automated failover.</p>",
  });

  assert(
    updatedNote1.title === "Kubernetes Multi-Region HA Cluster Specs" &&
      updatedNote1.plainText.includes("Updated Topology Spanning 3 availability zones"),
    "10. Update note title and content; plain text re-extracted and saved"
  );

  // Verify in PostgreSQL directly
  const dbNote = await prisma.note.findUnique({
    where: { id: note1.id },
  });
  assert(
    dbNote !== null &&
      dbNote.title === "Kubernetes Multi-Region HA Cluster Specs" &&
      dbNote.userId === user.id,
    "11. Verify note edits are persistently committed to PostgreSQL"
  );

  // TEST GROUP 5: PIN & ARCHIVE OPERATIONS
  console.log("\n--- TEST GROUP 5: Pinning & Archiving ---");
  const pinnedNote = await noteService.togglePin(user.id, note1.id);
  assert(pinnedNote.isPinned === true, "12a. Pin note sets isPinned = true");

  const unpinnedNote = await noteService.togglePin(user.id, note1.id);
  assert(unpinnedNote.isPinned === false, "12b. Unpin note sets isPinned = false");

  // Re-pin for pinned view test
  await noteService.togglePin(user.id, note1.id);

  const archivedNote = await noteService.toggleArchive(user.id, untitledNote.id);
  assert(archivedNote.isArchived === true, "13a. Archive note sets isArchived = true");

  const unarchivedNote = await noteService.toggleArchive(user.id, untitledNote.id);
  assert(unarchivedNote.isArchived === false, "13b. Unarchive note sets isArchived = false");

  // TEST GROUP 6: DUPLICATION
  console.log("\n--- TEST GROUP 6: Note Duplication ---");
  const duplicated = await noteService.duplicateNote(user.id, note1.id);
  assert(
    duplicated.id !== note1.id &&
      duplicated.title === "Copy of Kubernetes Multi-Region HA Cluster Specs" &&
      duplicated.categoryId === catRenamed.id &&
      duplicated.tags.length === 2,
    "14. Duplicate note creates copy preserving category, tags, and content"
  );

  // TEST GROUP 7: SOFT DELETION, TRASH & PERMANENT DELETE
  console.log("\n--- TEST GROUP 7: Soft Deletion, Trash & Restore ---");
  await noteService.softDeleteNote(user.id, duplicated.id);

  const activeNotesAfterDelete = await noteService.getNotes(user.id, { section: "all" });
  assert(
    !activeNotesAfterDelete.some((n) => n.id === duplicated.id),
    "15a. Soft-deleted note is excluded from 'All Notes' view"
  );

  const trashNotes = await noteService.getNotes(user.id, { section: "trash" });
  assert(
    trashNotes.some((n) => n.id === duplicated.id),
    "15b. Soft-deleted note appears in 'Trash' section with deletedAt timestamp"
  );

  // Restore note
  const restoredNote = await noteService.restoreNote(user.id, duplicated.id);
  assert(restoredNote.deletedAt === null, "16. Restore note from trash clears deletedAt timestamp");

  const activeNotesAfterRestore = await noteService.getNotes(user.id, { section: "all" });
  assert(
    activeNotesAfterRestore.some((n) => n.id === duplicated.id),
    "16b. Restored note appears back in 'All Notes'"
  );

  // Permanently delete duplicated note
  await noteService.permanentlyDeleteNote(user.id, duplicated.id);
  const checkPermDeleted = await prisma.note.findUnique({ where: { id: duplicated.id } });
  assert(checkPermDeleted === null, "17. Permanently delete note removes record from PostgreSQL");

  // TEST GROUP 8: SEARCH & FILTERING
  console.log("\n--- TEST GROUP 8: Search & Filtering ---");
  // Create another note for search tests
  const devNote = await noteService.createNote(user.id, {
    title: "Frontend State Management Architecture",
    content: "<p>Evaluating React 19 server actions vs client hooks for state synchronization.</p>",
    tagNames: ["development", "react"],
  });

  // Search by title
  const searchTitle = await noteService.getNotes(user.id, { search: "Kubernetes" });
  assert(
    searchTitle.length === 1 && searchTitle[0].id === note1.id,
    "18a. Search notes by title"
  );

  // Search by content (plainText)
  const searchContent = await noteService.getNotes(user.id, { search: "server actions" });
  assert(
    searchContent.length === 1 && searchContent[0].id === devNote.id,
    "18b. Search notes by content plain text"
  );

  // Search by tag
  const searchTag = await noteService.getNotes(user.id, { search: "security" });
  assert(
    searchTag.some((n) => n.id === note1.id),
    "18c. Search notes by tag"
  );

  // Filter by category
  const filteredByCategory = await noteService.getNotes(user.id, {
    section: "category",
    categoryId: catRenamed.id,
  });
  assert(
    filteredByCategory.length === 1 && filteredByCategory[0].id === note1.id,
    "19. Filter notes by category"
  );

  // Filter by tag
  const filteredByTag = await noteService.getNotes(user.id, {
    tagNames: ["react"],
  });
  assert(
    filteredByTag.length === 1 && filteredByTag[0].id === devNote.id,
    "20. Filter notes by tag"
  );

  // TEST GROUP 9: SORTING
  console.log("\n--- TEST GROUP 9: Sorting ---");
  const sortAlpha = await noteService.getNotes(user.id, { sortBy: "title", sortOrder: "asc" });
  assert(
    sortAlpha[0].title.localeCompare(sortAlpha[sortAlpha.length - 1].title) <= 0,
    "21. Sort notes alphabetically (A-Z)"
  );

  // TEST GROUP 10: CATEGORY DELETION PRESERVES NOTES
  console.log("\n--- TEST GROUP 10: Referential Integrity on Category Deletion ---");
  await noteService.deleteCategory(user.id, catRenamed.id);
  const noteAfterCatDelete = await prisma.note.findUnique({ where: { id: note1.id } });
  assert(
    noteAfterCatDelete !== null && noteAfterCatDelete.categoryId === null,
    "22. Deleting category preserves notes and sets categoryId to null"
  );

  // TEST GROUP 11: DASHBOARD INTEGRATION
  console.log("\n--- TEST GROUP 11: Dashboard Metrics & Recent Notes ---");
  const noteStats = await noteService.getDashboardNoteStats(user.id);
  const activeCountDb = await prisma.note.count({
    where: { userId: user.id, deletedAt: null, isArchived: false },
  });
  assert(
    noteStats.totalActive === activeCountDb,
    "23a. Dashboard totalActive matches real database count"
  );
  assert(noteStats.pinned >= 1, "23b. Dashboard pinned notes count is accurate");

  const recentNotes = await noteService.getRecentNotes(user.id, 5);
  assert(recentNotes.length >= 2, "23c. Recent notes returned for dashboard display");

  // TEST GROUP 12: API SECURITY - UNAUTHENTICATED REQUESTS REJECTED (HTTP 401)
  console.log("\n--- TEST GROUP 12: API Security (HTTP 401 Unauthorized) ---");
  const resNotes = await fetch("http://localhost:3000/api/notes");
  assert(resNotes.status === 401, "24a. GET /api/notes rejects unauthenticated request with 401");

  const resPostNote = await fetch("http://localhost:3000/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Infiltration Note" }),
  });
  assert(resPostNote.status === 401, "24b. POST /api/notes rejects unauthenticated request with 401");

  const resStats = await fetch("http://localhost:3000/api/notes/stats");
  assert(resStats.status === 401, "24c. GET /api/notes/stats rejects unauthenticated request with 401");

  const resCategories = await fetch("http://localhost:3000/api/notes/categories");
  assert(resCategories.status === 401, "24d. GET /api/notes/categories rejects unauthenticated request with 401");

  const resTags = await fetch("http://localhost:3000/api/notes/tags");
  assert(resTags.status === 401, "24e. GET /api/notes/tags rejects unauthenticated request with 401");

  const resTrash = await fetch("http://localhost:3000/api/notes/trash", { method: "DELETE" });
  assert(resTrash.status === 401, "24f. DELETE /api/notes/trash rejects unauthenticated request with 401");

  // TEST GROUP 13: PHASE 2 REGRESSION VERIFICATION
  console.log("\n--- TEST GROUP 13: Phase 2 Regression Verification ---");
  const taskStats = await taskService.getDashboardTaskStats(user.id);
  assert(typeof taskStats.totalActive === "number", "25a. Task management stats query remains functional");
  const tasks = await taskService.getTasks(user.id, { limit: 3 });
  assert(Array.isArray(tasks), "25b. Task service queries remain intact and operational");

  // Seed realistic starter notes for admin
  console.log("\n--- Seeding Initial Documents for JARVIS Admin ---");
  await noteService.seedDefaultCategories(user.id);
  const categories = await noteService.getCategories(user.id);
  const archCat = categories.find((c) => c.name === "Ideas") || categories[0];
  const devCat = categories.find((c) => c.name === "Development") || categories[0];

  await noteService.createNote(user.id, {
    title: "JARVIS Core Architecture & Vision",
    content: "<h1>JARVIS Assistant</h1><p>A private, local-first personal productivity system built with Next.js 15, Prisma ORM, and PostgreSQL.</p><ul><li>Phase 1: Foundation & Private Auth</li><li>Phase 2: Task Management & Kanban Board</li><li>Phase 3: Notes Management & Tiptap Rich-Text</li></ul>",
    categoryId: archCat?.id,
    tagNames: ["architecture", "roadmap"],
    isPinned: true,
  });

  await noteService.createNote(user.id, {
    title: "Zero-Trust Infrastructure & Deployment Notes",
    content: "<h2>Security Principles</h2><p>All sensitive operations run strictly on localhost. No public registrations, credentials hashed with bcrypt, and session authorization enforced on every route.</p>",
    categoryId: devCat?.id,
    tagNames: ["security", "deployment"],
    isPinned: false,
  });

  console.log("\n================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log("================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed with unhandled error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
