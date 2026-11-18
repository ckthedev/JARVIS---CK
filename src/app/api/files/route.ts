import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fileService } from "@/modules/files/service";
import { FileViewSection, FileCategory } from "@/modules/files/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") as FileViewSection) || "all";
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search") || undefined;
    const category = (searchParams.get("category") as FileCategory) || undefined;
    const sortBy = (searchParams.get("sortBy") as "name" | "createdAt" | "sizeBytes") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const files = await fileService.getFiles(session.user.id, {
      section,
      folderId: folderId === "null" || folderId === "" ? null : folderId || undefined,
      search,
      category,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({ files });
  } catch (error: unknown) {
    console.error("GET /api/files error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const folderId = formData.get("folderId") as string | null;
    const filesToUpload = formData.getAll("files") as File[];

    if (!filesToUpload || filesToUpload.length === 0) {
      return NextResponse.json({ error: "No files provided for upload" }, { status: 400 });
    }

    const uploadedFiles = [];
    for (const file of filesToUpload) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name || "unnamed_file";
      const browserMimeType = file.type || undefined;

      const stored = await fileService.uploadFile(
        session.user.id,
        buffer,
        originalName,
        folderId && folderId !== "null" ? folderId : null,
        browserMimeType
      );
      uploadedFiles.push(stored);
    }

    return NextResponse.json({ files: uploadedFiles, count: uploadedFiles.length }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/files error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file";
    const status = message.includes("exceeds configured maximum") ? 413 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
