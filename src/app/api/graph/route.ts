import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getToken() {
  return process.env.GRAPH_UPLOAD_TOKEN || "";
}

function dataDir() {
  return path.join(process.cwd(), ".data");
}

function graphPath() {
  return path.join(dataDir(), "graph.json");
}

export async function GET() {
  try {
    const p = graphPath();
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

export async function POST(req: Request) {
  try {
    const token = getToken();
    const auth = req.headers.get("authorization") || "";
    const got = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || got !== token) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    fs.mkdirSync(dataDir(), { recursive: true });
    fs.writeFileSync(graphPath(), buf);

    return NextResponse.json({ ok: true, bytes: buf.length }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
