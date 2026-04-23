import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/services/storage";
import { extractTextFromBuffer } from "@/services/fileParser";
import { processSuite } from "@/services/suiteProcessor";

export const dynamic = "force-dynamic";

// POST /api/suites/[id]/files — upload files and trigger AI processing
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const suite = await prisma.testSuite.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: user.id },
          {
            collaborators: {
              some: { userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
            },
          },
        ],
      },
    });

    if (!suite) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to cloud storage (Supabase Storage or local fallback)
      const stored = await storageProvider.upload(
        buffer,
        file.name,
        file.type || "application/octet-stream",
        params.id
      );

      // Extract text for AI pipeline
      const parsed = await extractTextFromBuffer(buffer, file.type, file.name);

      // Persist file record
      const dbFile = await prisma.uploadedFile.create({
        data: {
          suiteId: params.id,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          storageUrl: stored.url,
          storagePath: stored.storagePath,
          extractedText: parsed.text,
          fileSizeBytes: stored.fileSizeBytes,
        },
      });

      uploadedFiles.push(dbFile);
    }

    await prisma.activityLog.create({
      data: {
        suiteId: params.id,
        userId: user.id,
        actionType: "FILE_UPLOADED",
        metadata: { fileCount: uploadedFiles.length },
      },
    });

    // Fire-and-forget: AI processing runs in background
    // Status is tracked via suite.generationLog and suite.status
    processSuite(params.id).catch((err) =>
      console.error("[files/route] processSuite error:", err)
    );

    return NextResponse.json({
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded. AI generation started.`,
    });
  } catch (err: unknown) {
    console.error("[POST /api/suites/[id]/files]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// GET /api/suites/[id]/files
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const suite = await prisma.testSuite.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: user.id },
          { collaborators: { some: { userId: user.id } } },
        ],
      },
    });

    if (!suite) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const files = await prisma.uploadedFile.findMany({
      where: { suiteId: params.id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ data: files });
  } catch (err: unknown) {
    console.error("[GET /api/suites/[id]/files]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE /api/suites/[id]/files?fileId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    // Only owner can delete files
    const suite = await prisma.testSuite.findFirst({
      where: { id: params.id, ownerId: user.id },
    });

    if (!suite) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const file = await prisma.uploadedFile.findFirst({
      where: { id: fileId, suiteId: params.id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from storage if we have a path
    if (file.storagePath) {
      await storageProvider.delete(file.storagePath).catch((err) =>
        console.warn("[files/DELETE] Storage delete failed:", err)
      );
    }

    await prisma.uploadedFile.delete({ where: { id: fileId } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[DELETE /api/suites/[id]/files]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
