import { prisma } from "@/lib/prisma/client";
import {
  Prisma,
  Meeting,
  MeetingAttendee,
  MeetingAgendaItem,
  MeetingNoteLink,
  MeetingAttachment,
  StoredFile,
  Reminder,
} from "@prisma/client";
import { FileDto, FileCategory } from "@/modules/files/types";
import {
  MeetingDto,
  MeetingFilters,
  MeetingStats,
  MeetingStatus,
  MeetingType,
  MeetingPriority,
  AttendeeStatus,
  MeetingAttendeeDto,
  MeetingAgendaItemDto,
  MeetingNoteLinkDto,
  MeetingAttachmentDto,
  MeetingLinkedNoteSummary,
} from "./types";
import { ReminderStatus, ReminderPriority, RecurrenceRule } from "@/modules/reminders/types";
import {
  CreateMeetingInput,
  UpdateMeetingInput,
  AttendeeInput,
  AgendaItemInput,
  MeetingNoteInput,
  MeetingTaskInput,
} from "@/lib/validations/meeting";
import { reminderService } from "@/modules/reminders/service";
import { getKolkataStartOfDay, getKolkataEndOfDay } from "@/lib/utils/timezone";

export class MeetingService {
  /**
   * Query meetings with filtering, sections, search, and sorting.
   */
  async getMeetings(userId: string, filters: MeetingFilters = {}): Promise<MeetingDto[]> {
    const {
      section = "all",
      search,
      status,
      meetingType,
      priority,
      startDate,
      endDate,
      participant,
      sortBy = "startTime",
      sortOrder = "asc",
    } = filters;

    const startOfToday = getKolkataStartOfDay();
    const endOfToday = getKolkataEndOfDay();
    const now = new Date();

    const where: Prisma.MeetingWhereInput = {
      userId,
      deletedAt: null,
    };

    // Section filtering
    switch (section) {
      case "today":
        where.AND = [
          { startTime: { lte: endOfToday } },
          { endTime: { gte: startOfToday } },
        ];
        break;
      case "upcoming":
        where.startTime = { gte: now };
        where.status = { in: ["SCHEDULED", "RESCHEDULED", "IN_PROGRESS"] };
        break;
      case "in-progress":
        where.status = "IN_PROGRESS";
        break;
      case "completed":
        where.status = "COMPLETED";
        break;
      case "cancelled":
        where.status = "CANCELLED";
        break;
      case "past":
        where.OR = [
          { endTime: { lt: now } },
          { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
        ];
        break;
      case "calendar":
        if (startDate || endDate) {
          where.AND = [];
          if (startDate) {
            where.AND.push({ endTime: { gte: new Date(startDate) } });
          }
          if (endDate) {
            where.AND.push({ startTime: { lte: new Date(endDate) } });
          }
        }
        break;
      case "all":
      default:
        // No additional section constraints
        break;
    }

    // Direct status filter
    if (status) {
      where.status = status;
    }

    // Meeting type filter
    if (meetingType) {
      where.meetingType = meetingType;
    }

    // Priority filter
    if (priority) {
      where.priority = priority;
    }

    // Date range filter
    if (startDate && section !== "calendar") {
      where.startTime = { ...(where.startTime as Prisma.DateTimeFilter || {}), gte: new Date(startDate) };
    }
    if (endDate && section !== "calendar") {
      where.endTime = { ...(where.endTime as Prisma.DateTimeFilter || {}), lte: new Date(endDate) };
    }

    // Participant filter
    if (participant && participant.trim()) {
      const pTerm = participant.trim();
      where.attendees = {
        some: {
          OR: [
            { name: { contains: pTerm, mode: "insensitive" } },
            { email: { contains: pTerm, mode: "insensitive" } },
          ],
        },
      };
    }

    // Global search
    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions: Prisma.MeetingWhereInput[] = [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
        {
          attendees: {
            some: {
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { email: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          agendaItems: {
            some: {
              title: { contains: term, mode: "insensitive" },
            },
          },
        },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Sorting
    let orderBy: Prisma.MeetingOrderByWithRelationInput = {};
    if (sortBy === "startTime") {
      orderBy = { startTime: sortOrder };
    } else if (sortBy === "title") {
      orderBy = { title: sortOrder };
    } else if (sortBy === "priority") {
      orderBy = { priority: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { startTime: "asc" };
    }

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy,
      include: {
        attendees: {
          orderBy: { createdAt: "asc" },
        },
        agendaItems: {
          orderBy: { sortOrder: "asc" },
        },
        notes: {
          include: {
            note: {
              select: {
                id: true,
                title: true,
                content: true,
                plainText: true,
                isPinned: true,
                isArchived: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
        reminders: {
          where: { deletedAt: null },
        },
      },
    });

    return meetings.map((m) => this.mapToDto(m));
  }

  /**
   * Get a single meeting by ID with full relations.
   */
  async getMeetingById(userId: string, id: string): Promise<MeetingDto | null> {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        attendees: {
          orderBy: { createdAt: "asc" },
        },
        agendaItems: {
          orderBy: { sortOrder: "asc" },
        },
        notes: {
          include: {
            note: {
              select: {
                id: true,
                title: true,
                content: true,
                plainText: true,
                isPinned: true,
                isArchived: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
        reminders: {
          where: { deletedAt: null },
        },
      },
    });

    if (!meeting) return null;
    return this.mapToDto(meeting);
  }

  /**
   * Create a new meeting with attendees, agenda items, reminders, and attachments.
   */
  async createMeeting(userId: string, input: CreateMeetingInput): Promise<MeetingDto> {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        userId,
        title: input.title,
        description: input.description || null,
        startTime,
        endTime,
        timezone: input.timezone || "Asia/Kolkata",
        meetingType: input.meetingType || "ONLINE",
        priority: input.priority || "NORMAL",
        location: input.location || null,
        meetingUrl: input.meetingUrl || null,
        status: "SCHEDULED",
        attendees: input.attendees && input.attendees.length > 0
          ? {
              create: input.attendees.map((a) => ({
                name: a.name,
                email: a.email || null,
                phone: a.phone || null,
                organization: a.organization || null,
                role: a.role || null,
                status: a.status || "INVITED",
              })),
            }
          : undefined,
        agendaItems: input.agendaItems && input.agendaItems.length > 0
          ? {
              create: input.agendaItems.map((ag, index) => ({
                title: ag.title,
                description: ag.description || null,
                durationMinutes: ag.durationMinutes || 15,
                sortOrder: ag.sortOrder !== undefined ? ag.sortOrder : index,
                isCompleted: ag.isCompleted || false,
                notes: ag.notes || null,
              })),
            }
          : undefined,
      },
    });

    // Handle attachments
    if (input.attachmentFileIds && input.attachmentFileIds.length > 0) {
      for (const fileId of input.attachmentFileIds) {
        // verify file belongs to user
        const file = await prisma.storedFile.findFirst({
          where: { id: fileId, userId, deletedAt: null },
        });
        if (file) {
          await prisma.meetingAttachment.create({
            data: {
              meetingId: meeting.id,
              fileId,
            },
          }).catch(() => {
            // ignore duplicate link
          });
        }
      }
    }

    // Handle reminder preferences
    if (input.reminderOffsets && input.reminderOffsets.length > 0) {
      for (const offset of input.reminderOffsets) {
        const reminderDueAt = new Date(startTime.getTime() - offset * 60 * 1000);
        // Only schedule if dueAt is in the future or within recent threshold
        await reminderService.createReminder(userId, {
          title: `Meeting: ${meeting.title}`,
          description: input.meetingUrl
            ? `Meeting link: ${input.meetingUrl}`
            : input.location
            ? `Location: ${input.location}`
            : undefined,
          dueAt: reminderDueAt,
          priority: meeting.priority === "HIGH" ? "HIGH" : "NORMAL",
          meetingId: meeting.id,
          offsetMinutes: offset,
        }).catch((err) => {
          console.warn("[MeetingService] Failed to create meeting reminder:", err);
        });
      }
    }

    const created = await this.getMeetingById(userId, meeting.id);
    return created!;
  }

  /**
   * Update meeting details, attendees, agenda items, reminders.
   */
  async updateMeeting(userId: string, id: string, input: UpdateMeetingInput): Promise<MeetingDto> {
    const existing = await prisma.meeting.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existing) {
      throw new Error("Meeting not found");
    }

    const newStartTime = input.startTime ? new Date(input.startTime) : existing.startTime;
    const newEndTime = input.endTime ? new Date(input.endTime) : existing.endTime;

    const isStartTimeChanged = newStartTime.getTime() !== existing.startTime.getTime();

    await prisma.meeting.update({
      where: { id },
      data: {
        title: input.title !== undefined ? input.title : existing.title,
        description: input.description !== undefined ? input.description : existing.description,
        startTime: newStartTime,
        endTime: newEndTime,
        timezone: input.timezone !== undefined ? input.timezone : existing.timezone,
        meetingType: input.meetingType !== undefined ? input.meetingType : existing.meetingType,
        priority: input.priority !== undefined ? input.priority : existing.priority,
        location: input.location !== undefined ? input.location : existing.location,
        meetingUrl: input.meetingUrl !== undefined ? input.meetingUrl : existing.meetingUrl,
        status: input.status !== undefined ? input.status : existing.status,
      },
    });

    // If start time changed, adjust existing reminders
    if (isStartTimeChanged) {
      await reminderService.handleMeetingRescheduled(id, newStartTime);
    }

    // If attendees list provided, replace or sync attendees
    if (input.attendees !== undefined) {
      await prisma.meetingAttendee.deleteMany({ where: { meetingId: id } });
      if (input.attendees.length > 0) {
        await prisma.meetingAttendee.createMany({
          data: input.attendees.map((a) => ({
            meetingId: id,
            name: a.name,
            email: a.email || null,
            phone: a.phone || null,
            organization: a.organization || null,
            role: a.role || null,
            status: a.status || "INVITED",
          })),
        });
      }
    }

    // If agenda items provided, replace or sync
    if (input.agendaItems !== undefined) {
      await prisma.meetingAgendaItem.deleteMany({ where: { meetingId: id } });
      if (input.agendaItems.length > 0) {
        await prisma.meetingAgendaItem.createMany({
          data: input.agendaItems.map((ag, index) => ({
            meetingId: id,
            title: ag.title,
            description: ag.description || null,
            durationMinutes: ag.durationMinutes || 15,
            sortOrder: ag.sortOrder !== undefined ? ag.sortOrder : index,
            isCompleted: ag.isCompleted || false,
            notes: ag.notes || null,
          })),
        });
      }
    }

    // If attachmentFileIds provided, sync attachments
    if (input.attachmentFileIds !== undefined) {
      await prisma.meetingAttachment.deleteMany({ where: { meetingId: id } });
      for (const fileId of input.attachmentFileIds) {
        const file = await prisma.storedFile.findFirst({
          where: { id: fileId, userId, deletedAt: null },
        });
        if (file) {
          await prisma.meetingAttachment.create({
            data: { meetingId: id, fileId },
          }).catch(() => {});
        }
      }
    }

    const updated = await this.getMeetingById(userId, id);
    return updated!;
  }

  /**
   * Reschedule meeting to new start and end time.
   */
  async rescheduleMeeting(
    userId: string,
    id: string,
    newStartTime: Date | string,
    newEndTime: Date | string
  ): Promise<MeetingDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const start = new Date(newStartTime);
    const end = new Date(newEndTime);

    if (end.getTime() <= start.getTime()) {
      throw new Error("Rescheduled end time must be after start time");
    }

    await prisma.meeting.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
        status: "RESCHEDULED",
      },
    });

    await reminderService.handleMeetingRescheduled(id, start);

    const updated = await this.getMeetingById(userId, id);
    return updated!;
  }

  /**
   * Cancel a meeting.
   */
  async cancelMeeting(userId: string, id: string): Promise<MeetingDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await prisma.meeting.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await reminderService.handleMeetingCancelled(id);

    const updated = await this.getMeetingById(userId, id);
    return updated!;
  }

  /**
   * Start meeting / mark in progress.
   */
  async startMeeting(userId: string, id: string): Promise<MeetingDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await prisma.meeting.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        actualStartTime: meeting.actualStartTime || new Date(),
      },
    });

    const updated = await this.getMeetingById(userId, id);
    return updated!;
  }

  /**
   * Complete a meeting.
   */
  async completeMeeting(userId: string, id: string, actualEndTime?: Date | string): Promise<MeetingDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const now = new Date();
    const end = actualEndTime ? new Date(actualEndTime) : now;

    await prisma.meeting.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualEndTime: end,
        completedAt: now,
        actualStartTime: meeting.actualStartTime || meeting.startTime,
      },
    });

    // Cancel remaining pending reminders
    await reminderService.handleMeetingCancelled(id);

    const updated = await this.getMeetingById(userId, id);
    return updated!;
  }

  /**
   * Mark meeting as NO_SHOW.
   */
  async markNoShow(userId: string, id: string): Promise<MeetingDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await prisma.meeting.update({
      where: { id },
      data: {
        status: "NO_SHOW",
      },
    });

    await reminderService.handleMeetingCancelled(id);

    const updated = await this.getMeetingById(userId, id);
    return updated!;
  }

  /**
   * Delete meeting (soft delete by default, or permanent).
   */
  async deleteMeeting(userId: string, id: string, permanent = false): Promise<void> {
    const meeting = await prisma.meeting.findFirst({
      where: { id, userId },
    });
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await reminderService.handleMeetingCancelled(id);

    if (permanent) {
      // Disconnect tasks so they are not deleted
      await prisma.task.updateMany({
        where: { meetingId: id },
        data: { meetingId: null },
      });
      // Delete Meeting (cascades to attendees, agenda items, note links, attachments, reminders)
      await prisma.meeting.delete({
        where: { id },
      });
    } else {
      await prisma.meeting.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    }
  }

  // ===========================================================================
  // PARTICIPANT / ATTENDEE OPERATIONS
  // ===========================================================================

  async addAttendee(userId: string, meetingId: string, input: AttendeeInput): Promise<MeetingAttendeeDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    const attendee = await prisma.meetingAttendee.create({
      data: {
        meetingId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        organization: input.organization || null,
        role: input.role || null,
        status: input.status || "INVITED",
      },
    });

    return {
      id: attendee.id,
      meetingId: attendee.meetingId,
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone,
      organization: attendee.organization,
      role: attendee.role,
      status: attendee.status as AttendeeStatus,
      createdAt: attendee.createdAt,
      updatedAt: attendee.updatedAt,
    };
  }

  async updateAttendee(
    userId: string,
    meetingId: string,
    attendeeId: string,
    input: Partial<AttendeeInput>
  ): Promise<MeetingAttendeeDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    const attendee = await prisma.meetingAttendee.update({
      where: { id: attendeeId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.organization !== undefined && { organization: input.organization || null }),
        ...(input.role !== undefined && { role: input.role || null }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });

    return {
      id: attendee.id,
      meetingId: attendee.meetingId,
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone,
      organization: attendee.organization,
      role: attendee.role,
      status: attendee.status as AttendeeStatus,
      createdAt: attendee.createdAt,
      updatedAt: attendee.updatedAt,
    };
  }

  async removeAttendee(userId: string, meetingId: string, attendeeId: string): Promise<void> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    await prisma.meetingAttendee.delete({
      where: { id: attendeeId },
    });
  }

  async recordAttendance(
    userId: string,
    meetingId: string,
    attendeeId: string,
    status: AttendeeStatus
  ): Promise<MeetingAttendeeDto> {
    return this.updateAttendee(userId, meetingId, attendeeId, { status });
  }

  // ===========================================================================
  // AGENDA OPERATIONS
  // ===========================================================================

  async addAgendaItem(userId: string, meetingId: string, input: AgendaItemInput): Promise<MeetingAgendaItemDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    const count = await prisma.meetingAgendaItem.count({ where: { meetingId } });

    const item = await prisma.meetingAgendaItem.create({
      data: {
        meetingId,
        title: input.title,
        description: input.description || null,
        durationMinutes: input.durationMinutes || 15,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : count,
        isCompleted: input.isCompleted || false,
        notes: input.notes || null,
      },
    });

    return {
      id: item.id,
      meetingId: item.meetingId,
      title: item.title,
      description: item.description,
      durationMinutes: item.durationMinutes || 15,
      sortOrder: item.sortOrder,
      isCompleted: item.isCompleted,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async updateAgendaItem(
    userId: string,
    meetingId: string,
    itemId: string,
    input: Partial<AgendaItemInput>
  ): Promise<MeetingAgendaItemDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    const item = await prisma.meetingAgendaItem.update({
      where: { id: itemId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isCompleted !== undefined && { isCompleted: input.isCompleted }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });

    return {
      id: item.id,
      meetingId: item.meetingId,
      title: item.title,
      description: item.description,
      durationMinutes: item.durationMinutes || 15,
      sortOrder: item.sortOrder,
      isCompleted: item.isCompleted,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async deleteAgendaItem(userId: string, meetingId: string, itemId: string): Promise<void> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    await prisma.meetingAgendaItem.delete({
      where: { id: itemId },
    });
  }

  async reorderAgendaItems(userId: string, meetingId: string, itemIds: string[]): Promise<MeetingAgendaItemDto[]> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.meetingAgendaItem.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const items = await prisma.meetingAgendaItem.findMany({
      where: { meetingId },
      orderBy: { sortOrder: "asc" },
    });

    return items.map((i) => ({
      id: i.id,
      meetingId: i.meetingId,
      title: i.title,
      description: i.description,
      durationMinutes: i.durationMinutes || 15,
      sortOrder: i.sortOrder,
      isCompleted: i.isCompleted,
      notes: i.notes,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
  }

  // ===========================================================================
  // MEETING NOTES OPERATIONS
  // ===========================================================================

  async linkNote(userId: string, meetingId: string, input: MeetingNoteInput): Promise<MeetingNoteLinkDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    let noteId = input.noteId;

    // If noteId was not provided, create a note for this meeting
    if (!noteId) {
      const newNote = await prisma.note.create({
        data: {
          userId,
          title: input.title || `Notes: ${meeting.title}`,
          content: input.content || "",
          plainText: (input.content || "").replace(/<[^>]*>/g, ""),
        },
      });
      noteId = newNote.id;
    } else {
      // verify note belongs to user
      const existingNote = await prisma.note.findFirst({
        where: { id: noteId, userId, deletedAt: null },
      });
      if (!existingNote) throw new Error("Note not found or does not belong to user");
    }

    const noteLink = await prisma.meetingNoteLink.upsert({
      where: {
        meetingId_noteId: {
          meetingId,
          noteId,
        },
      },
      create: {
        meetingId,
        noteId,
        discussionSummary: input.discussionSummary || null,
        keyDecisions: input.keyDecisions || null,
        importantPoints: input.importantPoints || null,
        followUpInfo: input.followUpInfo || null,
      },
      update: {
        discussionSummary: input.discussionSummary !== undefined ? input.discussionSummary : undefined,
        keyDecisions: input.keyDecisions !== undefined ? input.keyDecisions : undefined,
        importantPoints: input.importantPoints !== undefined ? input.importantPoints : undefined,
        followUpInfo: input.followUpInfo !== undefined ? input.followUpInfo : undefined,
      },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            content: true,
            plainText: true,
            isPinned: true,
            isArchived: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return {
      id: noteLink.id,
      meetingId: noteLink.meetingId,
      noteId: noteLink.noteId,
      discussionSummary: noteLink.discussionSummary,
      keyDecisions: noteLink.keyDecisions,
      importantPoints: noteLink.importantPoints,
      followUpInfo: noteLink.followUpInfo,
      createdAt: noteLink.createdAt,
      updatedAt: noteLink.updatedAt,
      note: noteLink.note,
    };
  }

  async unlinkNote(userId: string, meetingId: string, linkId: string): Promise<void> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    await prisma.meetingNoteLink.delete({
      where: { id: linkId },
    });
  }

  // ===========================================================================
  // FOLLOW-UP TASKS
  // ===========================================================================

  async createFollowUpTask(userId: string, meetingId: string, input: MeetingTaskInput) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    const task = await prisma.task.create({
      data: {
        userId,
        meetingId,
        title: input.title,
        description: input.description || null,
        priority: input.priority || "NORMAL",
        status: "TODO",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
    });

    return task;
  }

  // ===========================================================================
  // ATTACHMENTS
  // ===========================================================================

  async attachFile(userId: string, meetingId: string, fileId: string): Promise<MeetingAttachmentDto> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId, deletedAt: null },
    });
    if (!file) throw new Error("File not found or does not belong to user");

    const attachment = await prisma.meetingAttachment.upsert({
      where: {
        meetingId_fileId: {
          meetingId,
          fileId,
        },
      },
      create: {
        meetingId,
        fileId,
      },
      update: {},
      include: {
        file: true,
      },
    });

    const mappedFile: FileDto = {
      id: attachment.file.id,
      userId: attachment.file.userId,
      folderId: attachment.file.folderId,
      originalName: attachment.file.originalName,
      storageName: attachment.file.storageName,
      mimeType: attachment.file.mimeType,
      sizeBytes: Number(attachment.file.sizeBytes),
      extension: attachment.file.extension,
      category: attachment.file.category as FileCategory,
      checksum: attachment.file.checksum,
      metadata: attachment.file.metadata as Record<string, unknown> | null,
      deletedAt: attachment.file.deletedAt,
      lastAccessedAt: attachment.file.lastAccessedAt,
      createdAt: attachment.file.createdAt,
      updatedAt: attachment.file.updatedAt,
      isPreviewable: Boolean(
        attachment.file.mimeType?.startsWith("image/") || attachment.file.mimeType === "application/pdf"
      ),
    };

    return {
      id: attachment.id,
      meetingId: attachment.meetingId,
      fileId: attachment.fileId,
      createdAt: attachment.createdAt,
      file: mappedFile,
    };
  }

  async detachFile(userId: string, meetingId: string, fileId: string): Promise<void> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId, deletedAt: null },
    });
    if (!meeting) throw new Error("Meeting not found");

    await prisma.meetingAttachment.deleteMany({
      where: {
        meetingId,
        fileId,
      },
    });
  }

  // ===========================================================================
  // STATS & CALENDAR
  // ===========================================================================

  async getMeetingStats(userId: string): Promise<MeetingStats> {
    const now = new Date();
    const startOfToday = getKolkataStartOfDay();
    const endOfToday = getKolkataEndOfDay();

    const [
      total,
      today,
      upcoming,
      inProgress,
      completed,
      cancelled,
      rescheduled,
      noShow,
      past,
      highPriorityCount,
    ] = await Promise.all([
      prisma.meeting.count({ where: { userId, deletedAt: null } }),
      prisma.meeting.count({
        where: {
          userId,
          deletedAt: null,
          startTime: { lte: endOfToday },
          endTime: { gte: startOfToday },
        },
      }),
      prisma.meeting.count({
        where: {
          userId,
          deletedAt: null,
          startTime: { gte: now },
          status: { in: ["SCHEDULED", "RESCHEDULED", "IN_PROGRESS"] },
        },
      }),
      prisma.meeting.count({ where: { userId, deletedAt: null, status: "IN_PROGRESS" } }),
      prisma.meeting.count({ where: { userId, deletedAt: null, status: "COMPLETED" } }),
      prisma.meeting.count({ where: { userId, deletedAt: null, status: "CANCELLED" } }),
      prisma.meeting.count({ where: { userId, deletedAt: null, status: "RESCHEDULED" } }),
      prisma.meeting.count({ where: { userId, deletedAt: null, status: "NO_SHOW" } }),
      prisma.meeting.count({
        where: {
          userId,
          deletedAt: null,
          OR: [{ endTime: { lt: now } }, { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } }],
        },
      }),
      prisma.meeting.count({ where: { userId, deletedAt: null, priority: "HIGH" } }),
    ]);

    return {
      total,
      today,
      upcoming,
      inProgress,
      completed,
      cancelled,
      rescheduled,
      noShow,
      past,
      highPriorityCount,
    };
  }

  async getCalendarMeetings(userId: string, startDate: Date | string, endDate: Date | string): Promise<MeetingDto[]> {
    return this.getMeetings(userId, {
      section: "calendar",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  }

  // ===========================================================================
  // BACKWARD COMPATIBILITY
  // ===========================================================================

  async getUpcomingMeetings(userId: string, limit = 5): Promise<MeetingDto[]> {
    const meetings = await this.getMeetings(userId, { section: "upcoming" });
    return meetings.slice(0, limit);
  }

  async getTodayMeetingCount(userId: string): Promise<number> {
    const stats = await this.getMeetingStats(userId);
    return stats.today;
  }

  // ===========================================================================
  // PRIVATE MAPPER
  // ===========================================================================

  private mapToDto(
    m: Meeting & {
      attendees?: MeetingAttendee[];
      agendaItems?: MeetingAgendaItem[];
      notes?: (MeetingNoteLink & { note?: MeetingLinkedNoteSummary | null })[];
      tasks?: { id: string; title: string; status: string; priority: string; dueDate: Date | null; completedAt: Date | null }[];
      attachments?: (MeetingAttachment & { file?: StoredFile | null })[];
      reminders?: Reminder[];
    }
  ): MeetingDto {
    return {
      id: m.id,
      userId: m.userId,
      title: m.title,
      description: m.description,
      startTime: m.startTime,
      endTime: m.endTime,
      timezone: m.timezone,
      meetingType: m.meetingType as MeetingType,
      priority: m.priority as MeetingPriority,
      location: m.location,
      meetingUrl: m.meetingUrl,
      status: m.status as MeetingStatus,
      actualStartTime: m.actualStartTime,
      actualEndTime: m.actualEndTime,
      completedAt: m.completedAt,
      cancelledAt: m.cancelledAt,
      deletedAt: m.deletedAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      attendees: m.attendees
        ? m.attendees.map((a) => ({
            id: a.id,
            meetingId: a.meetingId,
            name: a.name,
            email: a.email,
            phone: a.phone,
            organization: a.organization,
            role: a.role,
            status: a.status as AttendeeStatus,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          }))
        : [],
      agendaItems: m.agendaItems
        ? m.agendaItems.map((ag) => ({
            id: ag.id,
            meetingId: ag.meetingId,
            title: ag.title,
            description: ag.description,
            durationMinutes: ag.durationMinutes || 15,
            sortOrder: ag.sortOrder,
            isCompleted: ag.isCompleted,
            notes: ag.notes,
            createdAt: ag.createdAt,
            updatedAt: ag.updatedAt,
          }))
        : [],
      notes: m.notes
        ? m.notes.map((n) => ({
            id: n.id,
            meetingId: n.meetingId,
            noteId: n.noteId,
            discussionSummary: n.discussionSummary,
            keyDecisions: n.keyDecisions,
            importantPoints: n.importantPoints,
            followUpInfo: n.followUpInfo,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
            note: n.note || null,
          }))
        : [],
      tasks: m.tasks || [],
      attachments: m.attachments
        ? m.attachments.map((att) => ({
            id: att.id,
            meetingId: att.meetingId,
            fileId: att.fileId,
            createdAt: att.createdAt,
            file: att.file
              ? {
                  id: att.file.id,
                  userId: att.file.userId,
                  folderId: att.file.folderId,
                  originalName: att.file.originalName,
                  storageName: att.file.storageName,
                  mimeType: att.file.mimeType,
                  sizeBytes: Number(att.file.sizeBytes),
                  extension: att.file.extension,
                  category: att.file.category as FileCategory,
                  checksum: att.file.checksum,
                  metadata: att.file.metadata as Record<string, unknown> | null,
                  deletedAt: att.file.deletedAt,
                  lastAccessedAt: att.file.lastAccessedAt,
                  createdAt: att.file.createdAt,
                  updatedAt: att.file.updatedAt,
                  isPreviewable: Boolean(
                    att.file.mimeType?.startsWith("image/") || att.file.mimeType === "application/pdf"
                  ),
                }
              : null,
          }))
        : [],
      reminders: m.reminders
        ? m.reminders.map((r) => ({
            id: r.id,
            userId: r.userId,
            taskId: r.taskId,
            meetingId: r.meetingId,
            title: r.title,
            description: r.description,
            dueAt: r.dueAt,
            isCompleted: r.isCompleted,
            status: r.status as ReminderStatus,
            priority: r.priority as ReminderPriority,
            isRecurring: r.isRecurring,
            recurrenceRule: r.recurrenceRule as RecurrenceRule | null,
            recurrenceInterval: r.recurrenceInterval || 1,
            recurrenceDaysOfWeek: r.recurrenceDaysOfWeek,
            recurrenceDayOfMonth: r.recurrenceDayOfMonth,
            recurrenceMonth: r.recurrenceMonth,
            recurrenceEndAt: r.recurrenceEndAt,
            nextRunAt: r.nextRunAt,
            offsetMinutes: r.offsetMinutes,
            snoozedUntil: r.snoozedUntil,
            snoozeCount: r.snoozeCount,
            lastNotifiedAt: r.lastNotifiedAt,
            completedAt: r.completedAt,
            deletedAt: r.deletedAt,
            missedPolicy: (r.missedPolicy as "NOTIFY_IMMEDIATELY" | "SKIP") || "NOTIFY_IMMEDIATELY",
            jobId: r.jobId,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }))
        : [],
      attendeeCount: m.attendees?.length || 0,
      agendaCount: m.agendaItems?.length || 0,
      taskCount: m.tasks?.length || 0,
      attachmentCount: m.attachments?.length || 0,
    };
  }
}

export const meetingService = new MeetingService();
