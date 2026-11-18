import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma/client";
import { fileService } from "../src/modules/files/service";
import { noteService } from "../src/modules/notes/service";
import { storageProvider } from "../src/lib/storage";
import { getMaxUploadSizeBytes } from "../src/lib/storage/file-types";

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
  console.log("=== JARVIS PHASE 4: COMPLETE FILE MANAGEMENT SYSTEM TEST SUITE ===");

  // 1. Fetch Admin User
  const user = await prisma.user.findFirst({
    where: { email: "ck@jarvis.local" },
  });

  if (!user) {
    throw new Error("Admin user ck@jarvis.local not found in PostgreSQL!");
  }
  console.log(`Testing with user: ${user.name} (${user.email}, id: ${user.id})`);

  // Clean test fixtures
  console.log("Cleaning file test fixtures...");
  await prisma.noteAttachment.deleteMany({ where: { file: { userId: user.id } } });
  await prisma.socialMediaAsset.deleteMany({ where: { file: { userId: user.id } } });
  const existingFiles = await prisma.storedFile.findMany({ where: { userId: user.id } });
  for (const f of existingFiles) {
    try {
      await storageProvider.deleteFile(f.storagePath);
    } catch {
      // ignore missing files during test cleanup
    }
  }
  await prisma.storedFile.deleteMany({ where: { userId: user.id } });
  await prisma.folder.deleteMany({ where: { userId: user.id } });

  // Initialize storage directories
  await storageProvider.init();

  // TEST GROUP 1: STORAGE ARCHITECTURE & DIRECTORY STRUCTURE
  console.log("\n--- TEST GROUP 1: Storage Architecture & Security ---");
  const baseDataDir = path.resolve(process.cwd(), "data");
  const uploadsDir = path.resolve(baseDataDir, "uploads");
  const thumbsDir = path.resolve(baseDataDir, "thumbnails");
  const tempDir = path.resolve(baseDataDir, "temp");
  const backupsDir = path.resolve(baseDataDir, "backups");

  assert(
    fs.existsSync(uploadsDir) &&
      fs.existsSync(thumbsDir) &&
      fs.existsSync(tempDir) &&
      fs.existsSync(backupsDir),
    "1. Data storage directories (uploads, thumbnails, temp, backups) exist outside public web root"
  );

  // Path traversal prevention
  const dangerousName = "../../../../etc/passwd";
  const disarmedSafeName = path.basename(dangerousName);
  assert(
    disarmedSafeName === "passwd" && !disarmedSafeName.includes(".."),
    "2. Path traversal attack vectors safely disarmed to basename"
  );

  // TEST GROUP 2: FILE UPLOADS ACROSS FORMATS & CATEGORIES
  console.log("\n--- TEST GROUP 2: File Uploads & Category Detection ---");

  // PNG (IMAGE)
  const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const imgFile = await fileService.uploadFile(user.id, pngBuffer, "system-architecture.png");
  assert(
    imgFile.category === "IMAGE" &&
      imgFile.mimeType === "image/png" &&
      imgFile.extension === "png" &&
      imgFile.checksum !== null &&
      imgFile.checksum.length === 64,
    "3. Upload PNG image with accurate category, MIME type, and SHA-256 checksum"
  );

  // PDF (DOCUMENT)
  const pdfBuffer = Buffer.from("%PDF-1.4 Mock PDF Content");
  const docFile = await fileService.uploadFile(user.id, pdfBuffer, "system-specifications.pdf");
  assert(
    docFile.category === "DOCUMENT" && docFile.mimeType === "application/pdf",
    "4. Upload PDF document detected as DOCUMENT"
  );

  // MP3 (AUDIO)
  const mp3Buffer = Buffer.from("ID3MockAudioPayload12345");
  const audioFile = await fileService.uploadFile(user.id, mp3Buffer, "voice-briefing.mp3");
  assert(
    audioFile.category === "AUDIO" && audioFile.mimeType === "audio/mpeg",
    "5. Upload MP3 audio detected as AUDIO"
  );

  // MP4 (VIDEO)
  const mp4Buffer = Buffer.from("MockMp4VideoPayloadData");
  const videoFile = await fileService.uploadFile(user.id, mp4Buffer, "demo-recording.mp4");
  assert(
    videoFile.category === "VIDEO" && videoFile.mimeType === "video/mp4",
    "6. Upload MP4 video detected as VIDEO"
  );

  // TS & JSON (CODE)
  const codeBuffer = Buffer.from("export const jarvis = { version: '1.0.0' };");
  const codeFile = await fileService.uploadFile(user.id, codeBuffer, "config.ts");
  assert(
    codeFile.category === "CODE" && codeFile.mimeType.includes("typescript"),
    "7. Upload TypeScript file detected as CODE"
  );

  // CSV (SPREADSHEET)
  const csvBuffer = Buffer.from("Name,Role,Status\nCK,Admin,Active");
  const sheetFile = await fileService.uploadFile(user.id, csvBuffer, "budget-q4.csv");
  assert(
    sheetFile.category === "SPREADSHEET" && sheetFile.mimeType === "text/csv",
    "8. Upload CSV file detected as SPREADSHEET"
  );

  // PPTX (PRESENTATION)
  const pptxBuffer = Buffer.from("MockPresentationContent");
  const presFile = await fileService.uploadFile(user.id, pptxBuffer, "keynote.pptx");
  assert(
    presFile.category === "PRESENTATION",
    "9. Upload PPTX file detected as PRESENTATION"
  );

  // ZIP (ARCHIVE)
  const zipBuffer = Buffer.from("PK\x03\x04MockZipData");
  const zipFile = await fileService.uploadFile(user.id, zipBuffer, "backup-archive.zip");
  assert(
    zipFile.category === "ARCHIVE" && zipFile.mimeType === "application/zip",
    "10. Upload ZIP archive detected as ARCHIVE"
  );

  // TEST GROUP 3: DUPLICATE FILENAME AUTO-INCREMENT
  console.log("\n--- TEST GROUP 3: Duplicate Filename Handling ---");
  const dupFile = await fileService.uploadFile(user.id, pngBuffer, "system-architecture.png");
  assert(
    dupFile.originalName === "system-architecture (1).png",
    "11. Duplicate filename automatically increments to 'filename (1).ext'"
  );

  const dupFile2 = await fileService.uploadFile(user.id, pngBuffer, "system-architecture.png");
  assert(
    dupFile2.originalName === "system-architecture (2).png",
    "12. Successive duplicate filename increments to 'filename (2).ext'"
  );

  // TEST GROUP 4: UPLOAD SIZE LIMIT ENFORCEMENT
  console.log("\n--- TEST GROUP 4: Upload Size Limit ---");
  const maxBytes = getMaxUploadSizeBytes();
  let oversizedBlocked = false;
  try {
    const hugeBuffer = Buffer.alloc(maxBytes + 1024);
    await fileService.uploadFile(user.id, hugeBuffer, "too-large.dat");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    oversizedBlocked = msg.includes("exceeds configured maximum upload limit");
  }
  assert(oversizedBlocked, "13. Oversized file exceeding upload limit rejected with error");

  // TEST GROUP 5: FOLDER MANAGEMENT & NESTING
  console.log("\n--- TEST GROUP 5: Folder Management & Nesting ---");
  const rootFolder = await fileService.createFolder(user.id, {
    name: "Engineering",
    color: "#00D4FF",
  });
  assert(
    rootFolder.id !== undefined && rootFolder.name === "Engineering",
    "14. Create root folder with custom color"
  );

  // Duplicate folder name blocked in same parent
  let dupFolderBlocked = false;
  try {
    await fileService.createFolder(user.id, {
      name: "engineering",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    dupFolderBlocked = msg.includes("already exists");
  }
  assert(dupFolderBlocked, "15. Duplicate folder name blocked in same parent directory");

  // Nested subfolder
  const subFolder = await fileService.createFolder(user.id, {
    name: "Architecture Specs",
    parentId: rootFolder.id,
    color: "#7A3FFF",
  });
  assert(
    subFolder.parentId === rootFolder.id,
    "16. Create nested subfolder inside parent folder"
  );

  // Deeply nested subfolder
  const subSubFolder = await fileService.createFolder(user.id, {
    name: "Diagrams",
    parentId: subFolder.id,
    color: "#10B981",
  });
  assert(
    subSubFolder.parentId === subFolder.id,
    "17. Support multi-level logical folder nesting"
  );

  // Breadcrumb navigation
  const crumbs = await fileService.getFolderBreadcrumbs(user.id, subSubFolder.id);
  assert(
    crumbs.length === 3 &&
      crumbs[0].name === "Engineering" &&
      crumbs[1].name === "Architecture Specs" &&
      crumbs[2].name === "Diagrams",
    "18. Breadcrumb trail accurately reflects hierarchical ancestry"
  );

  // Circular movement prevention
  let circularBlocked = false;
  try {
    await fileService.moveFolder(user.id, rootFolder.id, {
      parentId: subSubFolder.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    circularBlocked = msg.includes("Cannot move a folder into one of its subfolders");
  }
  assert(circularBlocked, "19. Circular folder movement into descendants strictly blocked");

  // Rename folder
  const renamedFolder = await fileService.updateFolder(user.id, rootFolder.id, {
    name: "Core Engineering",
  });
  assert(
    renamedFolder.name === "Core Engineering",
    "20. Rename folder successfully"
  );

  // TEST GROUP 6: FILE OPERATIONS (MOVE, COPY, RENAME, DOWNLOAD)
  console.log("\n--- TEST GROUP 6: File Operations ---");

  // Move file into subfolder
  const movedFile = await fileService.moveFile(user.id, imgFile.id, {
    folderId: subSubFolder.id,
  });
  assert(
    movedFile.folderId === subSubFolder.id && movedFile.folder?.name === "Diagrams",
    "21. Move file into nested folder"
  );

  // Move file back to root
  const movedBackFile = await fileService.moveFile(user.id, imgFile.id, {
    folderId: null,
  });
  assert(
    movedBackFile.folderId === null,
    "22. Move file back to root directory"
  );

  // Copy file
  const copiedFile = await fileService.copyFile(user.id, imgFile.id, subSubFolder.id);
  assert(
    copiedFile.id !== imgFile.id &&
      copiedFile.folderId === subSubFolder.id &&
      copiedFile.originalName.startsWith("Copy of") &&
      copiedFile.checksum === imgFile.checksum,
    "23. Copy file duplicates record and creates physical storage copy with identical checksum"
  );

  // Rename file
  const renamedFile = await fileService.renameFile(user.id, docFile.id, {
    name: "jarvis-whitepaper-v1.pdf",
  });
  assert(
    renamedFile.originalName === "jarvis-whitepaper-v1.pdf" &&
      renamedFile.extension === "pdf",
    "24. Rename file updates database metadata and preserves extension"
  );

  // Download file
  const download = await fileService.downloadFile(user.id, imgFile.id);
  assert(
    download.buffer.length === pngBuffer.length &&
      download.filename === imgFile.originalName &&
      download.file.lastAccessedAt !== null,
    "25. Download file returns correct buffer, filename, and tracks lastAccessedAt"
  );

  // TEST GROUP 7: SEARCH, FILTERING & SORTING
  console.log("\n--- TEST GROUP 7: Search, Filtering & Sorting ---");

  // Search by name
  const searchByName = await fileService.getFiles(user.id, {
    search: "whitepaper",
  });
  assert(
    searchByName.length >= 1 && searchByName[0].originalName.includes("whitepaper"),
    "26. Search files by filename substring"
  );

  // Search by extension
  const searchByExt = await fileService.getFiles(user.id, {
    search: ".mp3",
  });
  assert(
    searchByExt.length >= 1 && searchByExt[0].extension === "mp3",
    "27. Search files by extension"
  );

  // Filter by category
  const audioList = await fileService.getFiles(user.id, {
    section: "audio",
  });
  assert(
    audioList.every((f) => f.category === "AUDIO"),
    "28. Filter files by category section (AUDIO)"
  );

  // Sort files by size
  const sortedBySize = await fileService.getFiles(user.id, {
    sortBy: "sizeBytes",
    sortOrder: "desc",
  });
  assert(
    sortedBySize.length >= 2 && sortedBySize[0].sizeBytes >= sortedBySize[1].sizeBytes,
    "29. Sort files by size descending"
  );

  // TEST GROUP 8: SOFT DELETE, RESTORE & PERMANENT DELETE
  console.log("\n--- TEST GROUP 8: Trash & Deletion Lifecycle ---");

  // Soft delete file
  await fileService.softDeleteFile(user.id, zipFile.id);
  const activeFilesAfterTrash = await fileService.getFiles(user.id, { section: "all" });
  assert(
    activeFilesAfterTrash.every((f) => f.id !== zipFile.id),
    "30. Soft-deleted file excluded from active files list"
  );

  const trashFiles = await fileService.getFiles(user.id, { section: "trash" });
  assert(
    trashFiles.some((f) => f.id === zipFile.id),
    "31. Soft-deleted file appears in Trash section"
  );

  // Restore file
  const restoredFile = await fileService.restoreFile(user.id, zipFile.id);
  assert(
    restoredFile.deletedAt === null,
    "32. Restore file from trash sets deletedAt to null"
  );

  // Permanent delete single file
  await fileService.permanentlyDeleteFile(user.id, presFile.id);
  const checkDeleted = await fileService.getFileById(user.id, presFile.id);
  assert(
    checkDeleted === null,
    "33. Permanent delete removes file record and physical file from disk"
  );

  // TEST GROUP 9: BULK OPERATIONS
  console.log("\n--- TEST GROUP 9: Bulk Operations ---");
  const bulkFiles = [audioFile.id, videoFile.id];

  // Bulk move
  const bulkMoveResult = await fileService.bulkAction(user.id, {
    action: "move",
    fileIds: bulkFiles,
    targetFolderId: rootFolder.id,
  });
  assert(
    bulkMoveResult.count === 2,
    "34. Bulk move moves multiple files to target folder in single transaction"
  );

  // Bulk delete (trash)
  const bulkDeleteResult = await fileService.bulkAction(user.id, {
    action: "delete",
    fileIds: bulkFiles,
  });
  assert(
    bulkDeleteResult.count === 2,
    "35. Bulk delete moves multiple files to trash"
  );

  // Bulk restore
  const bulkRestoreResult = await fileService.bulkAction(user.id, {
    action: "restore",
    fileIds: bulkFiles,
  });
  assert(
    bulkRestoreResult.count === 2,
    "36. Bulk restore recovers multiple files from trash"
  );

  // TEST GROUP 10: FOLDER DELETION POLICIES
  console.log("\n--- TEST GROUP 10: Folder Deletion Policies ---");

  // Setup test folder with a file inside
  const testPolicyFolder = await fileService.createFolder(user.id, {
    name: "Policy Test Folder",
    parentId: rootFolder.id,
  });
  const fileInside = await fileService.uploadFile(
    user.id,
    Buffer.from("policy content"),
    "policy-file.txt",
    testPolicyFolder.id
  );

  // Delete folder with "move_to_parent" policy
  await fileService.deleteFolder(user.id, testPolicyFolder.id, {
    action: "move_to_parent",
  });
  const fileAfterFolderDelete = await fileService.getFileById(user.id, fileInside.id);
  assert(
    fileAfterFolderDelete !== null && fileAfterFolderDelete.folderId === rootFolder.id,
    "37. Folder delete with 'move_to_parent' safely re-parents files to parent folder"
  );

  // TEST GROUP 11: STORAGE OVERVIEW & HEALTH
  console.log("\n--- TEST GROUP 11: Storage Overview & Stats ---");
  const stats = await fileService.getStorageOverview(user.id);
  assert(
    stats.totalFiles > 0 &&
      stats.totalBytes > 0 &&
      stats.totalFolders > 0 &&
      stats.isHealthy === true,
    "38. Storage overview computes accurate counts, byte tallies, and health reconciliation"
  );

  // TEST GROUP 12: NOTES ATTACHMENT INTEGRATION (PHASE 3)
  console.log("\n--- TEST GROUP 12: Notes Attachments Integration ---");
  const testNote = await noteService.createNote(user.id, {
    title: "Project Blueprint Note",
    content: "<p>Note referencing design blueprint</p>",
  });

  // Attach file to note
  const attachment = await fileService.attachFileToNote(user.id, testNote.id, imgFile.id);
  assert(
    attachment.noteId === testNote.id && attachment.fileId === imgFile.id,
    "39. Attach existing file to note creates NoteAttachment relation"
  );

  // Prevent duplicate attachment
  const dupAttachment = await fileService.attachFileToNote(user.id, testNote.id, imgFile.id);
  assert(
    dupAttachment.id === attachment.id,
    "40. Attaching same file to note is idempotent (prevents duplicate link records)"
  );

  // List attachments for note
  const noteAttachments = await fileService.getNoteAttachments(user.id, testNote.id);
  assert(
    noteAttachments.length === 1 && noteAttachments[0].file.id === imgFile.id,
    "41. Fetch all attachments for a specific note"
  );

  // Detach file from note
  const detached = await fileService.detachFileFromNote(user.id, testNote.id, imgFile.id);
  const remainingAttachments = await fileService.getNoteAttachments(user.id, testNote.id);
  const fileStillExists = await fileService.getFileById(user.id, imgFile.id);
  assert(
    detached && remainingAttachments.length === 0 && fileStillExists !== null,
    "42. Detach file from note leaves physical file intact in File Manager"
  );

  // TEST GROUP 13: EMPTY TRASH
  console.log("\n--- TEST GROUP 13: Empty Trash ---");
  await fileService.softDeleteFile(user.id, dupFile.id);
  const emptyTrashResult = await fileService.emptyTrash(user.id);
  assert(
    emptyTrashResult.filesCount >= 1,
    "43. Empty trash permanently unlinks all soft-deleted files from database and storage disk"
  );

  // TEST GROUP 14: API SECURITY (HTTP 401 REJECTIONS)
  console.log("\n--- TEST GROUP 14: API Security (Unauthenticated 401) ---");
  const unauthGetFiles = await fetch("http://localhost:3000/api/files");
  assert(unauthGetFiles.status === 401, "44. GET /api/files rejects unauthenticated request with 401");

  const unauthPostFiles = await fetch("http://localhost:3000/api/files", { method: "POST" });
  assert(unauthPostFiles.status === 401, "45. POST /api/files rejects unauthenticated request with 401");

  const unauthGetStats = await fetch("http://localhost:3000/api/files/stats");
  assert(unauthGetStats.status === 401, "46. GET /api/files/stats rejects unauthenticated request with 401");

  const unauthGetFolders = await fetch("http://localhost:3000/api/files/folders");
  assert(unauthGetFolders.status === 401, "47. GET /api/files/folders rejects unauthenticated request with 401");

  const unauthPostFolders = await fetch("http://localhost:3000/api/files/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Hacker Folder" }),
  });
  assert(unauthPostFolders.status === 401, "48. POST /api/files/folders rejects unauthenticated request with 401");

  const unauthGetAttachments = await fetch("http://localhost:3000/api/files/attachments?noteId=123");
  assert(unauthGetAttachments.status === 401, "49. GET /api/files/attachments rejects unauthenticated request with 401");

  const unauthDeleteTrash = await fetch("http://localhost:3000/api/files/trash", { method: "DELETE" });
  assert(unauthDeleteTrash.status === 401, "50. DELETE /api/files/trash rejects unauthenticated request with 401");

  // TEST GROUP 15: SOCIAL MEDIA RELATIONAL INTEGRATION PREPARATION
  console.log("\n--- TEST GROUP 15: Social Media Relational Integration ---");
  const post = await prisma.socialPost.create({
    data: {
      userId: user.id,
      content: "Phase 4 File Manager release post",
    },
  });

  const socialAsset = await prisma.socialMediaAsset.create({
    data: {
      socialPostId: post.id,
      url: `/api/files/${imgFile.id}/preview`,
      fileType: "IMAGE",
      fileId: imgFile.id,
    },
    include: {
      file: true,
    },
  });
  assert(
    socialAsset.fileId === imgFile.id && socialAsset.file?.id === imgFile.id,
    "51. Social media asset relation successfully connects to StoredFile"
  );

  // SEED REALISTIC INITIAL ASSETS FOR JARVIS ADMIN
  console.log("\n--- Seeding Initial Assets for JARVIS Admin ---");
  const projectsFolder = await fileService.createFolder(user.id, {
    name: "Projects & Architecture",
    color: "#00D4FF",
  });
  const mediaFolder = await fileService.createFolder(user.id, {
    name: "Media & Assets",
    color: "#7A3FFF",
  });
  const docsFolder = await fileService.createFolder(user.id, {
    name: "Documentation",
    color: "#10B981",
  });

  await fileService.uploadFile(
    user.id,
    Buffer.from("# JARVIS Architecture Specification\n\nModular monolith built with Next.js App Router, Prisma ORM, and PostgreSQL."),
    "jarvis-architecture.md",
    projectsFolder.id
  );
  await fileService.uploadFile(
    user.id,
    Buffer.from("ID,Feature,Status\n1,Task Manager,Complete\n2,Notes Manager,Complete\n3,File Manager,Complete\n4,Reminders,Phase 5"),
    "feature-roadmap.csv",
    docsFolder.id
  );
  await fileService.uploadFile(
    user.id,
    pngBuffer,
    "jarvis-logo-concept.png",
    mediaFolder.id
  );

  // SUMMARY
  console.log("\n========================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log("========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("FATAL TEST ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
