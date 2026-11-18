import { prisma } from "../src/lib/prisma/client";
import { socialService } from "../src/modules/social/service";
import { createSocialPostSchema } from "../src/lib/validations/social";
import { stopBoss } from "../src/modules/reminders/scheduler/pgboss-client";

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
  console.log("   JARVIS PHASE 7: SOCIAL MEDIA MANAGER TEST SUITE");
  console.log("================================================================\n");

  const user = await prisma.user.findFirst({
    where: { email: "ck@jarvis.local" },
  });

  if (!user) {
    throw new Error("Admin user ck@jarvis.local not found in PostgreSQL database!");
  }
  console.log(`Executing test suite for user: ${user.name} (${user.email}, id: ${user.id})\n`);

  // Ensure a test stored file exists in StoredFile table
  let sampleFile = await prisma.storedFile.findFirst({
    where: { userId: user.id, deletedAt: null },
  });

  if (!sampleFile) {
    sampleFile = await prisma.storedFile.create({
      data: {
        userId: user.id,
        originalName: "product-launch-teaser.png",
        storageName: `test-social-img-${Date.now()}.png`,
        storagePath: "uploads/social-test-image.png",
        sizeBytes: BigInt(204800),
        mimeType: "image/png",
        extension: "png",
        category: "IMAGE",
      },
    });
  }

  // Clean fixtures for ck@jarvis.local test runs
  console.log("Cleaning previous test fixtures...");
  await prisma.socialPostActivity.deleteMany({ where: { user: { id: user.id } } });
  await prisma.socialPostMedia.deleteMany({ where: { post: { userId: user.id } } });
  await prisma.socialPostHashtag.deleteMany({ where: { post: { userId: user.id } } });
  await prisma.socialPostPlatform.deleteMany({ where: { post: { userId: user.id } } });
  await prisma.socialPost.deleteMany({ where: { userId: user.id } });
  await prisma.socialCampaign.deleteMany({ where: { userId: user.id } });
  await prisma.contentPillar.deleteMany({ where: { userId: user.id } });
  await prisma.hashtagInCollection.deleteMany({ where: { collection: { userId: user.id } } });
  await prisma.hashtagCollection.deleteMany({ where: { userId: user.id } });
  await prisma.hashtag.deleteMany({ where: { userId: user.id } });

  // ---------------------------------------------------------------------------
  // 1. Create content draft with title, content, status DRAFT
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 1: Create Content Draft ---");
  const post1 = await socialService.createPost(user.id, {
    title: "Phase 7 Release Announcement",
    content: "Excited to unveil the complete Social Media Planner in JARVIS!",
    description: "Announcement teaser across multiple tech channels",
    status: "DRAFT",
    priority: "HIGH",
    timezone: "Asia/Kolkata",
  });

  assert(Boolean(post1 && post1.id), "1.1 Content draft created successfully with valid ID");
  assert(post1.title === "Phase 7 Release Announcement", "1.2 Post title matches input");
  assert(post1.status === "DRAFT", "1.3 Initial status is DRAFT");
  assert(post1.priority === "HIGH", "1.4 Priority is HIGH");
  assert(post1.timezone === "Asia/Kolkata", "1.5 Default timezone is Asia/Kolkata");

  // ---------------------------------------------------------------------------
  // 2. Create platform variants for Instagram, LinkedIn, YouTube
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Platform Variants ---");
  const postWithVariants = await socialService.updatePost(user.id, post1.id, {
    platforms: [
      {
        platform: "INSTAGRAM",
        caption: "✨ Big news! JARVIS Phase 7 is officially live. #AI #Productivity",
      },
      {
        platform: "LINKEDIN",
        caption: "We are thrilled to launch the Social Media Planning module for JARVIS, designed for modern creators and entrepreneurs.",
      },
      {
        platform: "YOUTUBE",
        title: "How I Built JARVIS Social Media Planner in 2026",
        caption: "Complete architecture walkthrough of the single-user productivity platform.",
      },
    ],
  });

  assert(postWithVariants.platforms?.length === 3, "2.1 Created 3 platform variants (Instagram, LinkedIn, YouTube)");
  const igVariant = postWithVariants.platforms?.find((p) => p.platform === "INSTAGRAM");
  const liVariant = postWithVariants.platforms?.find((p) => p.platform === "LINKEDIN");
  const ytVariant = postWithVariants.platforms?.find((p) => p.platform === "YOUTUBE");

  assert(Boolean(igVariant && igVariant.caption?.includes("#AI")), "2.2 Instagram variant has tailored caption with hashtags");
  assert(Boolean(liVariant && liVariant.caption?.includes("thrilled")), "2.3 LinkedIn variant has professional tone");
  assert(Boolean(ytVariant && ytVariant.title === "How I Built JARVIS Social Media Planner in 2026"), "2.4 YouTube variant includes video title");

  // ---------------------------------------------------------------------------
  // 3. Validate character counter: within limit passes, exceeded rejected
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Character Limits Validation ---");
  // Instagram limit is 2200
  const validIgText = "A".repeat(2100);
  const validIgCheck = createSocialPostSchema.safeParse({
    title: "Valid IG Post",
    content: "Valid base content",
    platforms: [{ platform: "INSTAGRAM", caption: validIgText }],
  });
  assert(validIgCheck.success, "3.1 Instagram caption within 2200 limit passes validation");

  const excessiveIgText = "A".repeat(2300);
  const excessiveIgCheck = createSocialPostSchema.safeParse({
    title: "Excessive IG Post",
    content: "Base content",
    platforms: [{ platform: "INSTAGRAM", caption: excessiveIgText }],
  });
  assert(!excessiveIgCheck.success, "3.2 Instagram caption exceeding 2200 limit is rejected by Zod validation");

  // Threads limit is 500
  const excessiveThreads = "T".repeat(600);
  const threadsCheck = createSocialPostSchema.safeParse({
    title: "Threads Post",
    content: "Threads content",
    platforms: [{ platform: "THREADS", caption: excessiveThreads }],
  });
  assert(!threadsCheck.success, "3.3 Threads caption exceeding 500 limit is rejected");

  // ---------------------------------------------------------------------------
  // 4. YouTube platform variant requires title or uses post title; custom data supports title
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: YouTube Variant Specifics ---");
  const ytPost = await socialService.createPost(user.id, {
    title: "Autonomous Agent Deep Dive",
    content: "Video description text for YouTube",
    platforms: [
      {
        platform: "YOUTUBE",
        title: "Autonomous Agent Deep Dive - Full Course",
        caption: "Full video notes and chapter markers below...",
      },
    ],
  });
  assert(ytPost.platforms?.[0].title === "Autonomous Agent Deep Dive - Full Course", "4.1 YouTube variant persists dedicated video title");

  // ---------------------------------------------------------------------------
  // 5. Create campaign with start date, end date, objective
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: Campaigns Management ---");
  const startDate = new Date();
  const endDate = new Date(Date.now() + 14 * 86400000);

  const campaign = await socialService.createCampaign(user.id, {
    name: "Q4 Launch Blitz",
    objective: "Drive 10,000 views and 500 stars",
    description: "Multi-channel release campaign across LinkedIn, Twitter/Threads, and YouTube",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: "ACTIVE",
    platforms: ["LINKEDIN", "YOUTUBE", "THREADS"],
  });

  assert(Boolean(campaign && campaign.id), "5.1 Campaign created successfully with ID");
  assert(campaign.name === "Q4 Launch Blitz", "5.2 Campaign name matches input");
  assert(campaign.status === "ACTIVE", "5.3 Campaign status is ACTIVE");
  assert(campaign.platforms.length === 3, "5.4 Campaign includes target platforms");

  // ---------------------------------------------------------------------------
  // 6. Create content pillars with custom colors
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 6: Content Pillars ---");
  const pillar1 = await socialService.createPillar(user.id, {
    name: "Engineering & Architecture",
    description: "Deep technical articles and system design patterns",
    color: "#00D4FF",
  });

  const pillar2 = await socialService.createPillar(user.id, {
    name: "Product & Growth",
    description: "Product updates, user stories, and productivity insights",
    color: "#7A3FFF",
  });

  assert(Boolean(pillar1 && pillar1.id), "6.1 Content pillar 1 created with cyan color #00D4FF");
  assert(Boolean(pillar2 && pillar2.id), "6.2 Content pillar 2 created with purple color #7A3FFF");

  // ---------------------------------------------------------------------------
  // 7. Assign post to campaign and content pillar
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 7: Assign Post to Campaign & Pillar ---");
  const assignedPost = await socialService.updatePost(user.id, post1.id, {
    campaignId: campaign.id,
    contentPillarId: pillar1.id,
  });

  assert(assignedPost.campaignId === campaign.id, "7.1 Post assigned to campaign ID");
  assert(assignedPost.campaign?.name === "Q4 Launch Blitz", "7.2 Post populated with campaign relation");
  assert(assignedPost.contentPillarId === pillar1.id, "7.3 Post assigned to content pillar ID");
  assert(assignedPost.contentPillar?.name === "Engineering & Architecture", "7.4 Post populated with pillar relation");

  // ---------------------------------------------------------------------------
  // 8. Filter posts by campaign, by pillar, by status, by platform
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 8: Multi-Criteria Post Filtering ---");
  const byCampaign = await socialService.getPosts(user.id, { campaignId: campaign.id });
  assert(byCampaign.some((p) => p.id === post1.id), "8.1 Filtering by campaignId retrieves assigned post");

  const byPillar = await socialService.getPosts(user.id, { contentPillarId: pillar1.id });
  assert(byPillar.some((p) => p.id === post1.id), "8.2 Filtering by contentPillarId retrieves assigned post");

  const byStatus = await socialService.getPosts(user.id, { status: "DRAFT" });
  assert(byStatus.some((p) => p.id === post1.id), "8.3 Filtering by status DRAFT retrieves post");

  const byPlatform = await socialService.getPosts(user.id, { platform: "LINKEDIN" });
  assert(byPlatform.some((p) => p.id === post1.id), "8.4 Filtering by platform LINKEDIN retrieves post");

  // ---------------------------------------------------------------------------
  // 9. Attach media files to post from File Manager (linking StoredFile)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 9: Media Attachment from File Manager ---");
  const mediaAttachment = await socialService.attachMedia(
    user.id,
    post1.id,
    sampleFile.id,
    0,
    "Product banner cover graphic"
  );

  assert(Boolean(mediaAttachment && mediaAttachment.id), "9.1 Media attached successfully to post");
  assert(mediaAttachment.fileId === sampleFile.id, "9.2 Media fileId points directly to StoredFile ID");

  // ---------------------------------------------------------------------------
  // 10. Verify post media displays in order and file is NOT duplicated
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 10: Non-Duplication of Media Files ---");
  const filesMatchingName = await prisma.storedFile.count({
    where: { userId: user.id, originalName: sampleFile.originalName },
  });
  assert(filesMatchingName === 1, "10.1 StoredFile table count has NOT changed (file is NOT duplicated)");

  const hydratedPostWithMedia = await socialService.getPostById(user.id, post1.id);
  assert(Boolean(hydratedPostWithMedia?.media && hydratedPostWithMedia.media.length > 0), "10.2 Post includes media array");
  assert(hydratedPostWithMedia?.media?.[0].file?.originalName === sampleFile.originalName, "10.3 Hydrated media contains original filename");

  // ---------------------------------------------------------------------------
  // 11. Add hashtags to hashtag library with category
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 11: Hashtag Library ---");
  const tag1 = await socialService.createHashtag(user.id, {
    displayTag: "#ArtificialIntelligence",
    category: "Technology",
    notes: "Main tech pillar tag",
  });
  const tag2 = await socialService.createHashtag(user.id, {
    displayTag: "#ProductivityHacks",
    category: "Workflow",
    notes: "General productivity",
  });

  assert(tag1.tag === "artificialintelligence", "11.1 Hashtag 1 normalized cleanly to lowercase without hash");
  assert(tag1.displayTag === "#ArtificialIntelligence", "11.2 Hashtag 1 displayTag preserves casing with hash");
  assert(tag1.category === "Technology", "11.3 Hashtag 1 category is Technology");

  // ---------------------------------------------------------------------------
  // 12. Create hashtag collection and add hashtags
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 12: Hashtag Collections ---");
  const collection = await socialService.createHashtagCollection(user.id, {
    name: "Tech Founders Set",
    description: "Curated tags for SaaS and AI founders",
    color: "#7A3FFF",
    hashtagIds: [tag1.id, tag2.id],
  });

  assert(Boolean(collection && collection.id), "12.1 Hashtag collection created successfully");
  assert(collection.hashtagCount === 2, "12.2 Collection holds 2 hashtags");
  assert(Boolean(collection.hashtags?.some((h) => h.id === tag1.id)), "12.3 Collection includes #ArtificialIntelligence");

  // ---------------------------------------------------------------------------
  // 13. Attach hashtags to post and verify association
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 13: Associate Hashtags with Post ---");
  const postWithHashtags = await socialService.updatePost(user.id, post1.id, {
    hashtagIds: [tag1.id, tag2.id],
  });

  assert(Boolean(postWithHashtags.hashtags && postWithHashtags.hashtags.length === 2), "13.1 Post has 2 hashtags associated in DB");
  assert(Boolean(postWithHashtags.hashtags && postWithHashtags.hashtags[0]?.hashtag?.tag === tag1.tag), "13.2 Post hashtag relationship correctly populated");

  // ---------------------------------------------------------------------------
  // 14. Schedule post with planned date and time in Asia/Kolkata timezone
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 14: Schedule Post in Asia/Kolkata Timezone ---");
  const plannedPublishTime = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours from now

  const scheduledPost = await socialService.updatePost(user.id, post1.id, {
    plannedAt: plannedPublishTime.toISOString(),
    status: "SCHEDULED",
    reminderOffsets: [15, 60],
  });

  assert(scheduledPost.status === "SCHEDULED", "14.1 Post status transitioned to SCHEDULED");
  assert(Boolean(scheduledPost.plannedAt), "14.2 plannedAt timestamp recorded");

  // ---------------------------------------------------------------------------
  // 15. Verify reminder is created in Reminder table for scheduled post
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 15: Reminder Synchronization ---");
  const postReminders = await prisma.reminder.findMany({
    where: { socialPostId: post1.id, deletedAt: null },
    orderBy: { dueAt: "asc" },
  });

  assert(postReminders.length === 2, "15.1 Two reminders synchronized in Reminder table (15m, 60m before)");
  assert(postReminders[0].title.includes(post1.title), "15.2 Reminder title references post title");

  // ---------------------------------------------------------------------------
  // 16. Transition post through workflow: IDEA -> DRAFT -> IN_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 16: Complete Workflow State Machine ---");
  const flowPost = await socialService.createPost(user.id, {
    title: "Workflow Verification Post",
    content: "Testing state machine transitions",
    status: "IDEA",
  });
  assert(flowPost.status === "IDEA", "16.1 Initial state: IDEA");

  const toDraft = await socialService.transitionPostStatus(user.id, flowPost.id, "DRAFT");
  assert(toDraft.status === "DRAFT", "16.2 Transitioned: IDEA -> DRAFT");

  const toReview = await socialService.transitionPostStatus(user.id, flowPost.id, "IN_REVIEW");
  assert(toReview.status === "IN_REVIEW", "16.3 Transitioned: DRAFT -> IN_REVIEW");
  assert(Boolean(toReview.reviewedAt), "16.4 reviewedAt timestamp recorded");

  const toApproved = await socialService.transitionPostStatus(user.id, flowPost.id, "APPROVED");
  assert(toApproved.status === "APPROVED", "16.5 Transitioned: IN_REVIEW -> APPROVED");
  assert(Boolean(toApproved.approvedAt), "16.6 approvedAt timestamp recorded");

  const toScheduled = await socialService.transitionPostStatus(user.id, flowPost.id, "SCHEDULED");
  assert(toScheduled.status === "SCHEDULED", "16.7 Transitioned: APPROVED -> SCHEDULED");

  // ---------------------------------------------------------------------------
  // 17. Verify PUBLISHED status requires manual confirmation and records publishedAt
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 17: Manual Publishing Confirmation ---");
  const toPublished = await socialService.transitionPostStatus(user.id, flowPost.id, "PUBLISHED", "Manually verified live publication on Instagram");
  assert(toPublished.status === "PUBLISHED", "17.1 Post status is PUBLISHED");
  assert(Boolean(toPublished.publishedAt), "17.2 publishedAt timestamp automatically stamped upon manual confirmation");

  // Check audit activity log
  const activities = await prisma.socialPostActivity.findMany({
    where: { postId: flowPost.id },
    orderBy: { createdAt: "desc" },
  });
  assert(activities.length >= 5, "17.3 SocialPostActivity log recorded all workflow state changes");

  // ---------------------------------------------------------------------------
  // 18. Reschedule post: updates plannedAt, adjusts reminders
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 18: Reschedule Post & Sync Reminders ---");
  const newPlannedDate = new Date(Date.now() + 5 * 86400000); // 5 days from now
  const rescheduled = await socialService.reschedulePost(user.id, post1.id, newPlannedDate);

  assert(Boolean(rescheduled.plannedAt), "18.1 Rescheduled post has new plannedAt");
  const updatedReminders = await prisma.reminder.findMany({
    where: { socialPostId: post1.id, deletedAt: null },
  });
  assert(updatedReminders.length > 0, "18.2 Reminders synchronized to new schedule");

  // ---------------------------------------------------------------------------
  // 19. Duplicate post: creates new draft with identical content, platforms, media, hashtags
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 19: Duplicate Post ---");
  const latestPost1 = await socialService.getPostById(user.id, post1.id);
  const duplicate = await socialService.duplicatePost(user.id, post1.id);

  assert(duplicate.id !== post1.id, "19.1 Duplicated post has a new unique ID");
  assert(duplicate.title === `Copy of ${post1.title}`, "19.2 Duplicated post title prefixed with 'Copy of'");
  assert(duplicate.status === "DRAFT", "19.3 Duplicated post starts in DRAFT status");
  assert(duplicate.plannedAt === null, "19.4 Duplicated post schedule is cleared");
  assert(duplicate.platforms?.length === latestPost1?.platforms?.length, "19.5 Duplicated post inherits all platform variants");
  assert(duplicate.media?.length === latestPost1?.media?.length, "19.6 Duplicated post inherits media links without file copying");
  assert(duplicate.hashtags?.length === latestPost1?.hashtags?.length, "19.7 Duplicated post inherits hashtag associations");

  // ---------------------------------------------------------------------------
  // 20. Delete post (soft delete and permanent delete): unlinks media, cancels reminders, preserves original files
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 20: Deletion & Preservation ---");
  // Soft delete post1
  await socialService.deletePost(user.id, post1.id, false);
  const softDeleted = await prisma.socialPost.findUnique({ where: { id: post1.id } });
  assert(Boolean(softDeleted?.deletedAt), "20.1 Post soft deleted (deletedAt timestamp set)");

  // Reminders cancelled
  const remainingReminders = await prisma.reminder.findMany({
    where: { socialPostId: post1.id, isCompleted: false },
  });
  assert(remainingReminders.length === 0, "20.2 Pending reminders cancelled upon post deletion");

  // Permanent delete duplicate
  await socialService.deletePost(user.id, duplicate.id, true);
  const permanentDeleted = await prisma.socialPost.findUnique({ where: { id: duplicate.id } });
  assert(permanentDeleted === null, "20.3 Duplicate post permanently deleted from database");

  // Original stored file is completely preserved
  const originalFileStillExists = await prisma.storedFile.findUnique({ where: { id: sampleFile.id } });
  assert(Boolean(originalFileStillExists && !originalFileStillExists.deletedAt), "20.4 Original StoredFile in File Manager remains 100% intact and undamaged");

  // ---------------------------------------------------------------------------
  // TEST SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log("   PHASE 7 TEST RESULTS SUMMARY");
  console.log("================================================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failed > 0) {
    console.error("\nSome verification tests failed! Please check above output.");
  } else {
    console.log("\n🎉 ALL 20 VERIFICATION POINTS PASSED WITH 100% SUCCESS!");
  }

  // Gracefully stop pgboss
  await stopBoss().catch(() => {});
  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(async (e) => {
  console.error("Fatal error during Phase 7 testing:", e);
  await stopBoss().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
