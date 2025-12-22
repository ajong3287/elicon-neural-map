import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

type SavedSnap = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

function dataFilePath() {
  // repo root 기준: process.cwd()
  return path.join(process.cwd(), ".data", "snapshots.json");
}

function ensureStore() {
  const p = dataFilePath();
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify([], null, 2), "utf-8");
  }
  return p;
}

function readStore(): SavedSnap[] {
  const p = ensureStore();
  try {
    const raw = fs.readFileSync(p, "utf-8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as SavedSnap[]) : [];
  } catch {
    return [];
  }
}

function writeStore(list: SavedSnap[]) {
  const p = ensureStore();
  fs.writeFileSync(p, JSON.stringify(list, null, 2), "utf-8");
}

function isAuthed(req: Request) {
  const token = process.env.GRAPH_UPLOAD_TOKEN || "";
  if (!token) return false;
  const h = req.headers.get("authorization") || "";
  // Authorization: Bearer <token>
  if (h.startsWith("Bearer ")) {
    return h.slice("Bearer ".length).trim() === token;
  }
  // fallback: x-graph-token
  const x = req.headers.get("x-graph-token") || "";
  return x === token;
}

export async function GET(req: Request) {
  if (!isAuthed(req)) {
    return new Response(JSON.stringify({ ok: false, error: "UNAUTHORIZED" }), { status: 401 });
  }
  const list = readStore();
  return new Response(JSON.stringify({ ok: true, items: list }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  if (!isAuthed(req)) {
    return new Response(JSON.stringify({ ok: false, error: "UNAUTHORIZED" }), { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as null | Partial<SavedSnap>;
  if (!body || !body.url) {
    return new Response(JSON.stringify({ ok: false, error: "BAD_REQUEST" }), { status: 400 });
  }

  const name = (body.name || "").toString().trim() || `snap ${new Date().toLocaleString()}`;
  const url = body.url.toString();
  const item: SavedSnap = {
    id: (body.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`).toString(),
    name,
    url,
    createdAt: (body.createdAt || new Date().toISOString()).toString(),
  };

  const list = readStore();
  // 최신이 위로
  const next = [item, ...list].slice(0, 50);
  writeStore(next);

  return new Response(JSON.stringify({ ok: true, item, count: next.length }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) {
    return new Response(JSON.stringify({ ok: false, error: "UNAUTHORIZED" }), { status: 401 });
  }
  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: "BAD_REQUEST" }), { status: 400 });
  }

  const list = readStore();
  const next = list.filter((s) => s.id !== id);
  writeStore(next);

  return new Response(JSON.stringify({ ok: true, deleted: id, count: next.length }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
