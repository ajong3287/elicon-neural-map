import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function serverGraphPath() {
  return path.join(process.cwd(), ".data", "graph.json");
}

function publicGraphPath() {
  return path.join(process.cwd(), "public", "graph.json");
}

export async function GET() {
  try {
    const p = fs.existsSync(serverGraphPath()) ? serverGraphPath() : publicGraphPath();
    if (!fs.existsSync(p)) {
      return NextResponse.json({ ok: false, error: "NO_GRAPH" }, { status: 404 });
    }
    const txt = fs.readFileSync(p, "utf-8");
    return new NextResponse(txt, {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
