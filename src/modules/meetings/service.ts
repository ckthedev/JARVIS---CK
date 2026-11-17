import { prisma } from "@/lib/prisma/client";
import { MeetingDto } from "./types";

export class MeetingService {
  async getUpcomingMeetings(userId: string, limit = 5): Promise<MeetingDto[]> {
    const meetings = await prisma.meeting.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
        status: { not: "CANCELLED" },
      },
      orderBy: { startTime: "asc" },
      take: limit,
      include: {
        _count: {
          select: { attendees: true },
        },
      },
    });

    return meetings.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      startTime: m.startTime,
      endTime: m.endTime,
      location: m.location,
      meetingUrl: m.meetingUrl,
      status: m.status,
      attendeesCount: m._count.attendees,
    }));
  }

  async getTodayMeetingCount(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.meeting.count({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: "CANCELLED" },
      },
    });
  }
}

export const meetingService = new MeetingService();
