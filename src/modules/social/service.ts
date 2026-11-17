import { prisma } from "@/lib/prisma/client";
import { SocialPostDto, SocialAccountDto } from "./types";

export class SocialService {
  async getScheduledPosts(userId: string, limit = 5): Promise<SocialPostDto[]> {
    const posts = await prisma.socialPost.findMany({
      where: {
        userId,
        status: { in: ["SCHEDULED", "DRAFT"] },
      },
      orderBy: { scheduledFor: "asc" },
      take: limit,
      include: {
        socialAccount: {
          select: {
            accountName: true,
            platform: true,
          },
        },
      },
    });

    return posts.map((p) => ({
      id: p.id,
      content: p.content,
      status: p.status,
      scheduledFor: p.scheduledFor,
      accountName: p.socialAccount?.accountName ?? null,
      platform: p.socialAccount?.platform ?? null,
    }));
  }

  async getConnectedAccounts(userId: string): Promise<SocialAccountDto[]> {
    return await prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        accountName: true,
        handle: true,
        status: true,
      },
    });
  }
}

export const socialService = new SocialService();
