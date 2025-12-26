import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");

  if (!filePath) {
    return new NextResponse("Missing path parameter", { status: 400 });
  }

  try {
    // 프로젝트 루트 경로 (elicon-neural-map 폴더)
    const projectRoot = process.cwd();
    const absolutePath = path.join(projectRoot, filePath);

    // 경로 순회 공격 방지
    if (!absolutePath.startsWith(projectRoot)) {
      return new NextResponse("Invalid path", { status: 403 });
    }

    const content = await fs.readFile(absolutePath, "utf-8");
    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return new NextResponse(`File not found: ${filePath}`, { status: 404 });
    }
    return new NextResponse(`Error reading file: ${error.message}`, { status: 500 });
  }
}
