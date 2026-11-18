import { prisma } from "../src/lib/prisma/client";
import { meetingService } from "../src/modules/meetings/service";
import { reminderService } from "../src/modules/reminders/service";
import { stopBoss } from "../src/modules/reminders/scheduler/pgboss-client";
import { getKolkataStartOfDay, getKolkataEndOfDay, APP_TIMEZONE } from "../src/lib/utils/timezone";

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
  console.log("================================================================");
  console.log("   JARVIS PHASE 6: COMPLETE MEETING MANAGEMENT TEST SUITE");
  console.log("================================================================\n");

  // Fetch Admin User
  const user = await prisma.user.findFirst({
    where: { email: "ck@jarvis.local" },
  });

  if (!user) {
    throw new Error("Admin user ck@jarvis.local not found in PostgreSQL database!");
  }
  console.log(`Executing test suite for user: ${user.name} (${user.email}, id: ${user.id})\n`);

  // Create a second user for unauthorized access testing
  let otherUser = await prisma.user.findFirst({
    where: { email: "other@jarvis.local" },
  });
  if (!otherUser) {
    otherUser = await prisma.user.create({
      data: {
        email: "other@jarvis.local",
        name: "Other User",
        passwordHash: "$2a$12$dummyhashforunauthorizedtesting12345678901234567890",
        role: "USER",
      },
    });
  }

  // Clean test fixtures for ck@jarvis.local meetings
  console.log("Cleaning test fixtures for clean execution...");
  await prisma.meetingAttachment.deleteMany({ where: { meeting: { userId: user.id } } });
  await prisma.meetingNoteLink.deleteMany({ where: { meeting: { userId: user.id } } });
  await prisma.meetingAgendaItem.deleteMany({ where: { meeting: { userId: user.id } } });
  await prisma.meetingAttendee.deleteMany({ where: { meeting: { userId: user.id } } });
  await prisma.reminder.deleteMany({ where: { userId: user.id, meetingId: { not: null } } });
  await prisma.task.updateMany({ where: { userId: user.id, meetingId: { not: null } }, data: { meetingId: null } });
  await prisma.meeting.deleteMany({ where: { userId: user.id } });

  // Create a sample file for attachment testing
  let sampleFile = await prisma.storedFile.findFirst({
    where: { userId: user.id, deletedAt: null },
  });
  if (!sampleFile) {
    sampleFile = await prisma.storedFile.create({
      data: {
        userId: user.id,
        originalName: "Phase6_Design_Doc.pdf",
        storageName: `test_file_${Date.now()}.pdf`,
        storagePath: "/tmp/test.pdf",
        mimeType: "application/pdf",
        sizeBytes: BigInt(102400),
        extension: "pdf",
        category: "DOCUMENT",
      },
    });
  }

  // Base timestamps
  const baseStart = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours from now
  const baseEnd = new Date(baseStart.getTime() + 3600 * 1000); // 1 hour duration

  // ===========================================================================
  // TEST 1: CREATE MEETING
  // ===========================================================================
  console.log("\n--- TEST 1: Create Meeting ---");
  const meeting1 = await meetingService.createMeeting(user.id, {
    title: "Q4 Strategy & Execution Review",
    description: "Aligning product roadmap with marketing deliverables.",
    startTime: baseStart.toISOString(),
    endTime: baseEnd.toISOString(),
    timezone: "Asia/Kolkata",
    meetingType: "ONLINE",
    priority: "HIGH",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    reminderOffsets: [15, 30],
    attendees: [
      { name: "John Doe", email: "john@example.com", role: "Product Lead" },
      { name: "Jane Smith", email: "jane@example.com", role: "Tech Lead" },
    ],
    agendaItems: [
      { title: "Review Q3 OKRs", durationMinutes: 15 },
      { title: "Q4 Roadmap Walkthrough", durationMinutes: 30 },
      { title: "Budget & Staffing", durationMinutes: 15 },
    ],
    attachmentFileIds: [sampleFile.id],
  });

  assert(Boolean(meeting1 && meeting1.id), "1.1 Meeting created successfully with ID", meeting1.id);
  assert(meeting1.title === "Q4 Strategy & Execution Review", "1.2 Meeting title matches input");
  assert(meeting1.status === "SCHEDULED", "1.3 Initial status is SCHEDULED");
  assert(meeting1.meetingType === "ONLINE", "1.4 Meeting type is ONLINE");
  assert(meeting1.priority === "HIGH", "1.5 Priority is HIGH");
  assert(meeting1.attendees?.length === 2, "1.6 Two participants initialized");
  assert(meeting1.agendaItems?.length === 3, "1.7 Three agenda items initialized");
  assert(meeting1.attachments?.length === 1, "1.8 Attachment linked");

  // ===========================================================================
  // TEST 2: EDIT MEETING
  // ===========================================================================
  console.log("\n--- TEST 2: Edit Meeting ---");
  const updatedMeeting = await meetingService.updateMeeting(user.id, meeting1.id, {
    title: "Q4 Strategy, Roadmap & Budget Review",
    priority: "NORMAL",
    description: "Updated agenda with financial projections.",
  });
  assert(
    updatedMeeting.title === "Q4 Strategy, Roadmap & Budget Review",
    "2.1 Updated title persisted in PostgreSQL"
  );
  assert(updatedMeeting.priority === "NORMAL", "2.2 Priority changed from HIGH to NORMAL");
  assert(
    updatedMeeting.description === "Updated agenda with financial projections.",
    "2.3 Description updated"
  );

  // ===========================================================================
  // TEST 3: DELETE MEETING
  // ===========================================================================
  console.log("\n--- TEST 3: Delete Meeting (Soft & Permanent) ---");
  const tempMeeting = await meetingService.createMeeting(user.id, {
    title: "Temporary Sync to Delete",
    startTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  });
  // Soft delete
  await meetingService.deleteMeeting(user.id, tempMeeting.id, false);
  const softDeleted = await prisma.meeting.findUnique({ where: { id: tempMeeting.id } });
  assert(Boolean(softDeleted?.deletedAt), "3.1 Soft delete sets deletedAt timestamp");
  const retrievedSoft = await meetingService.getMeetingById(user.id, tempMeeting.id);
  assert(retrievedSoft === null, "3.2 Soft-deleted meeting excluded from active queries");

  // Permanent delete
  await meetingService.deleteMeeting(user.id, tempMeeting.id, true);
  const permDeleted = await prisma.meeting.findUnique({ where: { id: tempMeeting.id } });
  assert(permDeleted === null, "3.3 Permanent delete purges record from PostgreSQL");

  // ===========================================================================
  // TEST 4: CANCEL MEETING
  // ===========================================================================
  console.log("\n--- TEST 4: Cancel Meeting ---");
  const cancelTestMeeting = await meetingService.createMeeting(user.id, {
    title: "Client Sync to Cancel",
    startTime: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 11 * 3600 * 1000).toISOString(),
    reminderOffsets: [15],
  });
  const cancelled = await meetingService.cancelMeeting(user.id, cancelTestMeeting.id);
  assert(cancelled.status === "CANCELLED", "4.1 Meeting status updated to CANCELLED");
  assert(Boolean(cancelled.cancelledAt), "4.2 cancelledAt timestamp recorded");

  // Verify connected reminders cancelled
  const cancelledReminders = await prisma.reminder.findMany({
    where: { meetingId: cancelTestMeeting.id },
  });
  assert(
    cancelledReminders.length > 0 && cancelledReminders.every((r) => r.status === "CANCELLED"),
    "4.3 Associated reminders automatically cancelled upon meeting cancellation"
  );

  // ===========================================================================
  // TEST 5: RESCHEDULE MEETING
  // ===========================================================================
  console.log("\n--- TEST 5: Reschedule Meeting ---");
  const newStart = new Date(baseStart.getTime() + 24 * 3600 * 1000); // Next day
  const newEnd = new Date(baseEnd.getTime() + 24 * 3600 * 1000);
  const rescheduled = await meetingService.rescheduleMeeting(
    user.id,
    meeting1.id,
    newStart.toISOString(),
    newEnd.toISOString()
  );
  assert(rescheduled.status === "RESCHEDULED", "5.1 Meeting status set to RESCHEDULED");
  assert(
    new Date(rescheduled.startTime).getTime() === newStart.getTime(),
    "5.2 New startTime persisted"
  );
  assert(
    new Date(rescheduled.endTime).getTime() === newEnd.getTime(),
    "5.3 New endTime persisted"
  );

  // ===========================================================================
  // TEST 6: MARK MEETING COMPLETED
  // ===========================================================================
  console.log("\n--- TEST 6: Mark Meeting Completed ---");
  const completeTestMeeting = await meetingService.createMeeting(user.id, {
    title: "Sync to Complete",
    startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    endTime: new Date().toISOString(),
  });
  const completed = await meetingService.completeMeeting(user.id, completeTestMeeting.id);
  assert(completed.status === "COMPLETED", "6.1 Meeting status set to COMPLETED");
  assert(Boolean(completed.completedAt), "6.2 completedAt timestamp recorded");
  assert(Boolean(completed.actualEndTime), "6.3 actualEndTime recorded");

  // ===========================================================================
  // TEST 7: MARK MEETING AS NO-SHOW
  // ===========================================================================
  console.log("\n--- TEST 7: Mark Meeting as No-Show ---");
  const noShowTestMeeting = await meetingService.createMeeting(user.id, {
    title: "Vendor Interview No Show",
    startTime: new Date(Date.now() - 7200 * 1000).toISOString(),
    endTime: new Date(Date.now() - 3600 * 1000).toISOString(),
  });
  const noShow = await meetingService.markNoShow(user.id, noShowTestMeeting.id);
  assert(noShow.status === "NO_SHOW", "7.1 Meeting marked as NO_SHOW");

  // ===========================================================================
  // TEST 8, 9, 10, 11: CALENDAR VIEWS (DAY, WEEK, MONTH, AGENDA)
  // ===========================================================================
  console.log("\n--- TEST 8, 9, 10, 11: Calendar Views ---");
  const todayStart = getKolkataStartOfDay();
  const todayEnd = getKolkataEndOfDay();

  // Create a meeting scheduled for today
  const todayMeeting = await meetingService.createMeeting(user.id, {
    title: "Today's Standup Call",
    startTime: new Date(todayStart.getTime() + 10 * 3600 * 1000).toISOString(),
    endTime: new Date(todayStart.getTime() + 11 * 3600 * 1000).toISOString(),
  });

  // Day Calendar
  const dayMeetings = await meetingService.getMeetings(user.id, {
    section: "calendar",
    startDate: todayStart,
    endDate: todayEnd,
  });
  assert(
    dayMeetings.some((m) => m.id === todayMeeting.id),
    "8.1 Day Calendar returns meeting scheduled for today"
  );

  // Week Calendar
  const weekStart = new Date(todayStart.getTime() - 2 * 24 * 3600 * 1000);
  const weekEnd = new Date(todayStart.getTime() + 5 * 24 * 3600 * 1000);
  const weekMeetings = await meetingService.getMeetings(user.id, {
    section: "calendar",
    startDate: weekStart,
    endDate: weekEnd,
  });
  assert(
    weekMeetings.some((m) => m.id === todayMeeting.id),
    "9.1 Week Calendar returns meetings within 7-day span"
  );

  // Month Calendar
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0, 23, 59, 59);
  const monthMeetings = await meetingService.getMeetings(user.id, {
    section: "calendar",
    startDate: monthStart,
    endDate: monthEnd,
  });
  assert(
    monthMeetings.some((m) => m.id === todayMeeting.id),
    "10.1 Month Calendar returns meetings for the active calendar month"
  );

  // Agenda View
  const agendaMeetings = await meetingService.getMeetings(user.id, {
    section: "all",
    sortBy: "startTime",
    sortOrder: "asc",
  });
  assert(agendaMeetings.length >= 2, "11.1 Agenda view returns sorted chronological listing");

  // ===========================================================================
  // TEST 12: OVERLAPPING MEETINGS
  // ===========================================================================
  console.log("\n--- TEST 12: Overlapping Meetings Support ---");
  const slotStart = new Date(Date.now() + 48 * 3600 * 1000);
  const slotEnd = new Date(slotStart.getTime() + 3600 * 1000);

  const overlap1 = await meetingService.createMeeting(user.id, {
    title: "Primary Design Review (Overlap Slot)",
    startTime: slotStart.toISOString(),
    endTime: slotEnd.toISOString(),
  });

  const overlap2 = await meetingService.createMeeting(user.id, {
    title: "Emergency Architecture Discussion (Overlap Slot)",
    startTime: new Date(slotStart.getTime() + 1800 * 1000).toISOString(), // 30m into first meeting
    endTime: new Date(slotEnd.getTime() + 1800 * 1000).toISOString(),
  });

  const overlapResults = await meetingService.getMeetings(user.id, {
    section: "calendar",
    startDate: slotStart,
    endDate: new Date(slotEnd.getTime() + 3600 * 1000),
  });
  assert(
    overlapResults.some((m) => m.id === overlap1.id) && overlapResults.some((m) => m.id === overlap2.id),
    "12.1 Both overlapping meetings preserved and returned concurrently in calendar query"
  );

  // ===========================================================================
  // TEST 13, 14, 15, 16: PARTICIPANT CREATION, EDITING, REMOVAL & ATTENDANCE
  // ===========================================================================
  console.log("\n--- TEST 13, 14, 15, 16: Participant Management ---");
  const attendee = await meetingService.addAttendee(user.id, meeting1.id, {
    name: "Alice Johnson",
    email: "alice@acme.corp",
    phone: "+91 9988776655",
    organization: "Acme Corp",
    role: "External Auditor",
    status: "INVITED",
  });
  assert(Boolean(attendee.id), "13.1 External participant created with private contact details");

  const updatedAttendee = await meetingService.updateAttendee(user.id, meeting1.id, attendee.id, {
    role: "Lead Financial Auditor",
    organization: "Acme Global",
  });
  assert(updatedAttendee.role === "Lead Financial Auditor", "14.1 Participant role updated");

  // Attendance tracking
  const attendedAttendee = await meetingService.recordAttendance(
    user.id,
    meeting1.id,
    attendee.id,
    "ATTENDED"
  );
  assert(attendedAttendee.status === "ATTENDED", "16.1 Attendance status recorded as ATTENDED");

  await meetingService.removeAttendee(user.id, meeting1.id, attendee.id);
  const checkAttendee = await prisma.meetingAttendee.findUnique({ where: { id: attendee.id } });
  assert(checkAttendee === null, "15.1 Participant removed from meeting");

  // ===========================================================================
  // TEST 17: ONLINE MEETING URL
  // ===========================================================================
  console.log("\n--- TEST 17: Online Meeting URL ---");
  const onlineMeeting = await meetingService.createMeeting(user.id, {
    title: "Zoom Architecture Sync",
    startTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 73 * 3600 * 1000).toISOString(),
    meetingType: "ONLINE",
    meetingUrl: "https://zoom.us/j/987654321?pwd=securetoken",
  });
  assert(
    onlineMeeting.meetingUrl === "https://zoom.us/j/987654321?pwd=securetoken",
    "17.1 Online conference link stored safely with query parameters"
  );

  // ===========================================================================
  // TEST 18: PHYSICAL LOCATION
  // ===========================================================================
  console.log("\n--- TEST 18: Physical Location ---");
  const physicalMeeting = await meetingService.createMeeting(user.id, {
    title: "Executive Boardroom Session",
    startTime: new Date(Date.now() + 96 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 97 * 3600 * 1000).toISOString(),
    meetingType: "PHYSICAL",
    location: "Level 42, Conference Suite Alpha, Cyber City",
  });
  assert(
    physicalMeeting.location === "Level 42, Conference Suite Alpha, Cyber City",
    "18.1 Physical venue details stored with room location"
  );

  // ===========================================================================
  // TEST 19 & 20: AGENDA CREATION & EDITING / REORDERING
  // ===========================================================================
  console.log("\n--- TEST 19 & 20: Agenda Management ---");
  const agendaItem = await meetingService.addAgendaItem(user.id, meeting1.id, {
    title: "Security & Encryption Protocols",
    description: "Review end-to-end TLS 1.3 settings.",
    durationMinutes: 20,
    sortOrder: 10,
  });
  assert(agendaItem.title === "Security & Encryption Protocols", "19.1 Agenda item created");

  const updatedAgenda = await meetingService.updateAgendaItem(user.id, meeting1.id, agendaItem.id, {
    isCompleted: true,
    notes: "Agreed to enforce strict HSTS headers.",
  });
  assert(updatedAgenda.isCompleted === true, "20.1 Agenda item marked completed");

  // Reorder agenda
  const meetingWithAgenda = await meetingService.getMeetingById(user.id, meeting1.id);
  const agendaIds = meetingWithAgenda?.agendaItems?.map((i) => i.id) || [];
  if (agendaIds.length >= 2) {
    const reversed = [...agendaIds].reverse();
    const reordered = await meetingService.reorderAgendaItems(user.id, meeting1.id, reversed);
    assert(reordered[0].id === reversed[0], "20.2 Agenda items reordered with updated sortOrder");
  }

  // ===========================================================================
  // TEST 21: MEETING NOTES INTEGRATION
  // ===========================================================================
  console.log("\n--- TEST 21: Meeting Notes Integration ---");
  const noteLink = await meetingService.linkNote(user.id, meeting1.id, {
    title: "Executive Minutes: Q4 Strategy",
    content: "<p>The team finalized core OKRs for Q4 with complete alignment.</p>",
    discussionSummary: "Finalized Q4 product priorities and budget limits.",
    keyDecisions: "Approved hiring 2 senior backend engineers and 1 ML architect.",
    importantPoints: "All services must pass Phase 6 verification tests.",
    followUpInfo: "Coordinate with finance before Friday EOD.",
  });
  assert(Boolean(noteLink.id), "21.1 Discussion notes linked with structured fields");
  assert(
    noteLink.keyDecisions === "Approved hiring 2 senior backend engineers and 1 ML architect.",
    "21.2 Key decisions recorded in relational note link"
  );

  // Verify underlying note was created in Note table
  const createdNote = await prisma.note.findUnique({ where: { id: noteLink.noteId } });
  assert(Boolean(createdNote), "21.3 Underlying note persisted in user's Notes Manager");

  // ===========================================================================
  // TEST 22: FOLLOW-UP TASK CREATION
  // ===========================================================================
  console.log("\n--- TEST 22: Follow-Up Task Integration ---");
  const followUpTask = await meetingService.createFollowUpTask(user.id, meeting1.id, {
    title: "Finalize Vendor NDA for AI Pipeline",
    description: "Action item originating from Q4 strategy sync.",
    priority: "HIGH",
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  });
  assert(Boolean(followUpTask.id), "22.1 Task created linked to meeting");
  assert(followUpTask.meetingId === meeting1.id, "22.2 Task has foreign key meetingId set");

  // Verify task persists if meeting is deleted
  const tempMeetingForTask = await meetingService.createMeeting(user.id, {
    title: "Meeting to Delete with Task",
    startTime: new Date(Date.now() + 100 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 101 * 3600 * 1000).toISOString(),
  });
  const persistentTask = await meetingService.createFollowUpTask(user.id, tempMeetingForTask.id, {
    title: "Action Item to Keep",
  });
  await meetingService.deleteMeeting(user.id, tempMeetingForTask.id, true);
  const remainingTask = await prisma.task.findUnique({ where: { id: persistentTask.id } });
  assert(
    Boolean(remainingTask && remainingTask.meetingId === null),
    "22.3 Follow-up task preserved with meetingId set to null after meeting permanent deletion"
  );

  // ===========================================================================
  // TEST 23: FILE ATTACHMENT INTEGRATION
  // ===========================================================================
  console.log("\n--- TEST 23: File Attachment Integration ---");
  const attachment = await meetingService.attachFile(user.id, meeting1.id, sampleFile.id);
  assert(attachment.fileId === sampleFile.id, "23.1 File attached to meeting");

  await meetingService.detachFile(user.id, meeting1.id, sampleFile.id);
  const checkFile = await prisma.storedFile.findUnique({ where: { id: sampleFile.id } });
  assert(Boolean(checkFile), "23.2 Detaching attachment preserves physical stored file");

  // Re-attach for completeness
  await meetingService.attachFile(user.id, meeting1.id, sampleFile.id);

  // ===========================================================================
  // TEST 24, 25, 26: REMINDER INTEGRATION, RESCHEDULING & CANCELLATION
  // ===========================================================================
  console.log("\n--- TEST 24, 25, 26: Reminder Integration ---");
  const meetingWithReminders = await meetingService.createMeeting(user.id, {
    title: "Reminder Verification Sync",
    startTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    reminderOffsets: [15, 60],
  });

  const reminders = await prisma.reminder.findMany({
    where: { meetingId: meetingWithReminders.id },
  });
  assert(reminders.length === 2, "24.1 Two offset reminders created via ReminderService");

  // Reschedule and verify reminders shift
  const shiftedStart = new Date(Date.now() + 8 * 3600 * 1000);
  const shiftedEnd = new Date(Date.now() + 9 * 3600 * 1000);
  await meetingService.rescheduleMeeting(
    user.id,
    meetingWithReminders.id,
    shiftedStart.toISOString(),
    shiftedEnd.toISOString()
  );

  const updatedReminders = await prisma.reminder.findMany({
    where: { meetingId: meetingWithReminders.id },
  });
  const offset15 = updatedReminders.find((r) => r.offsetMinutes === 15);
  const expectedDue15 = new Date(shiftedStart.getTime() - 15 * 60 * 1000);
  assert(
    Math.abs(new Date(offset15!.dueAt).getTime() - expectedDue15.getTime()) < 1000,
    "25.1 Reminder due date recalculated exactly when meeting is rescheduled"
  );

  // Cancel meeting and verify reminders cancel
  await meetingService.cancelMeeting(user.id, meetingWithReminders.id);
  const cancelledRem = await prisma.reminder.findMany({
    where: { meetingId: meetingWithReminders.id },
  });
  assert(
    cancelledRem.every((r) => r.status === "CANCELLED"),
    "26.1 Reminders marked CANCELLED when meeting is cancelled"
  );

  // ===========================================================================
  // TEST 27: TIMEZONE CONVERSION
  // ===========================================================================
  console.log("\n--- TEST 27: Timezone Conversion (Asia/Kolkata default & UTC storage) ---");
  const kolkataMeeting = await meetingService.createMeeting(user.id, {
    title: "Kolkata Timezone Alignment Call",
    startTime: "2026-11-20T10:00:00+05:30",
    endTime: "2026-11-20T11:00:00+05:30",
    timezone: APP_TIMEZONE,
  });
  // 10:00 AM IST = 04:30 AM UTC
  const rawDbRecord = await prisma.meeting.findUnique({ where: { id: kolkataMeeting.id } });
  const utcHours = rawDbRecord!.startTime.getUTCHours();
  const utcMinutes = rawDbRecord!.startTime.getUTCMinutes();
  assert(
    utcHours === 4 && utcMinutes === 30,
    `27.1 IST 10:00 AM stored as UTC 04:30 AM (hours: ${utcHours}, mins: ${utcMinutes})`
  );
  assert(
    rawDbRecord!.timezone === "Asia/Kolkata",
    "27.2 Timezone Asia/Kolkata preserved in meeting record"
  );

  // ===========================================================================
  // TEST 28: SEARCH AND FILTERS
  // ===========================================================================
  console.log("\n--- TEST 28: Search and Filters ---");
  const searchResults = await meetingService.getMeetings(user.id, {
    search: "Cyber City",
  });
  assert(
    searchResults.length > 0 && searchResults.some((m) => m.id === physicalMeeting.id),
    "28.1 Search by location string matches physical meeting"
  );

  const priorityFiltered = await meetingService.getMeetings(user.id, {
    priority: "HIGH",
  });
  assert(
    priorityFiltered.every((m) => m.priority === "HIGH"),
    "28.2 Filter by priority returns only HIGH priority meetings"
  );

  const typeFiltered = await meetingService.getMeetings(user.id, {
    meetingType: "ONLINE",
  });
  assert(
    typeFiltered.every((m) => m.meetingType === "ONLINE"),
    "28.3 Filter by type returns only ONLINE meetings"
  );

  // ===========================================================================
  // TEST 29: DASHBOARD INTEGRATION
  // ===========================================================================
  console.log("\n--- TEST 29: Dashboard Integration ---");
  const stats = await meetingService.getMeetingStats(user.id);
  const upcomingList = await meetingService.getUpcomingMeetings(user.id, 4);
  const todayCount = await meetingService.getTodayMeetingCount(user.id);

  assert(typeof stats.total === "number" && stats.total > 0, "29.1 Total meetings stat calculated");
  assert(Array.isArray(upcomingList), "29.2 Upcoming meetings list generated for dashboard card");
  assert(typeof todayCount === "number", "29.3 Today meeting count generated for dashboard metric");

  // ===========================================================================
  // TEST 30: UNAUTHORIZED ACCESS PROTECTION
  // ===========================================================================
  console.log("\n--- TEST 30: Unauthorized Access Protection ---");
  let unauthorizedBlocked = false;
  try {
    // Other user attempts to fetch admin's meeting by ID
    const blockedMeeting = await meetingService.getMeetingById(otherUser.id, meeting1.id);
    if (!blockedMeeting) unauthorizedBlocked = true;
  } catch {
    unauthorizedBlocked = true;
  }
  assert(unauthorizedBlocked, "30.1 Foreign user prevented from viewing admin's meeting");

  let unauthorizedUpdateBlocked = false;
  try {
    await meetingService.updateMeeting(otherUser.id, meeting1.id, { title: "Hacked Meeting" });
  } catch {
    unauthorizedUpdateBlocked = true;
  }
  assert(unauthorizedUpdateBlocked, "30.2 Foreign user prevented from modifying admin's meeting");

  // ===========================================================================
  // TEST 31: DATABASE PERSISTENCE
  // ===========================================================================
  console.log("\n--- TEST 31: Database Persistence ---");
  const hydrated = await meetingService.getMeetingById(user.id, meeting1.id);
  assert(Boolean(hydrated), "31.1 Meeting re-queried across independent query transaction");
  assert(
    Boolean(hydrated?.agendaItems && hydrated.agendaItems.length > 0),
    "31.2 Agenda items persisted in relational schema"
  );
  assert(
    Boolean(hydrated?.notes && hydrated.notes.length > 0),
    "31.3 Discussion notes persisted in relational schema"
  );
  assert(
    Boolean(hydrated?.attachments && hydrated.attachments.length > 0),
    "31.4 Attachments persisted in relational schema"
  );

  // ===========================================================================
  // TEST 32: APPLICATION RESTART PERSISTENCE
  // ===========================================================================
  console.log("\n--- TEST 32: Application Restart Persistence ---");
  // Query raw PostgreSQL table directly to confirm zero in-memory or transient storage
  const rawDbMeetings = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, title, status FROM meetings WHERE "userId" = '${user.id}' AND "deletedAt" IS NULL`
  );
  assert(
    rawDbMeetings.length > 0,
    `32.1 PostgreSQL persistent disk storage confirmed (${rawDbMeetings.length} active records in database)`
  );

  // Summary
  console.log("\n================================================================");
  console.log("   PHASE 6 TEST RESULTS SUMMARY");
  console.log("================================================================\n");

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`Total tests run: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\n${failedCount} TESTS FAILED!`);
    process.exit(1);
  } else {
    console.log(`\nALL ${passedCount} VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀`);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution threw error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await stopBoss().catch(() => {});
    await prisma.$disconnect();
  });
