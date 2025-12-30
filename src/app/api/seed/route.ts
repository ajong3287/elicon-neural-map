import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function dataDir() {
  return path.join(process.cwd(), ".data");
}

function graphPath() {
  return path.join(dataDir(), "graph.json");
}

export async function GET(req: NextRequest) {
  try {
    // STEP05.35: Block seed API in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "SEED_BLOCKED_IN_PRODUCTION" },
        { status: 403 }
      );
    }

    // Get kind parameter (dev or pm)
    const kind = req.nextUrl.searchParams.get("kind");
    if (!kind || !["dev", "pm"].includes(kind)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_KIND", valid: ["dev", "pm"] },
        { status: 400 }
      );
    }

    // Load seed data
    const seedFile = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      "seed",
      `${kind}-seed.json`
    );

    if (!fs.existsSync(seedFile)) {
      return NextResponse.json(
        { ok: false, error: "SEED_FILE_NOT_FOUND", file: seedFile },
        { status: 404 }
      );
    }

    const seedData = fs.readFileSync(seedFile, "utf-8");
    const graph = JSON.parse(seedData);

    // Ensure .data directory exists
    fs.mkdirSync(dataDir(), { recursive: true });

    // Write to .data/graph.json
    fs.writeFileSync(graphPath(), JSON.stringify(graph, null, 2));

    return NextResponse.json(
      {
        ok: true,
        kind,
        nodes: graph.nodes?.length ?? 0,
        links: graph.links?.length ?? 0,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
