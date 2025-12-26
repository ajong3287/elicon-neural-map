import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getToken() {
  return process.env.SHARE_UPLOAD_TOKEN || "";
}

function packagesDir() {
  return path.join(process.cwd(), ".data", "share-packages");
}

function packagePath(id: string) {
  return path.join(packagesDir(), `${id}.json`);
}

// GET /api/share-packages?id=pkg_xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "NO_ID" }, { status: 400 });
    }

    const p = packagePath(id);
    if (!fs.existsSync(p)) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const txt = fs.readFileSync(p, "utf-8");
    const pkg = JSON.parse(txt);

    // STEP05.29: Prepend Issue URL section if exists
    let content = pkg.reportMd;
    if (pkg.issueUrl) {
      content = `**Issue URL**: ${pkg.issueUrl}\n\n---\n\n${content}`;
    }

    // Return markdown content as text/plain for easy viewing
    return new NextResponse(content, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

// POST /api/share-packages
// Header: x-share-token
// Body: { kind, reportMd, snapshot, normalizedUrl, createdAt }
export async function POST(req: Request) {
  try {
    const token = getToken();
    const auth = req.headers.get("x-share-token") || "";

    if (!token || auth !== token) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const { kind, reportMd, snapshot, normalizedUrl, createdAt } = body;

    if (!kind || !reportMd) {
      return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }

    // Generate package ID
    const id = `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Create package object
    const pkg = {
      id,
      kind,
      reportMd,
      snapshot: snapshot || null,
      normalizedUrl: normalizedUrl || "",
      createdAt: createdAt || new Date().toISOString(),
    };

    // Save to file
    fs.mkdirSync(packagesDir(), { recursive: true });
    fs.writeFileSync(packagePath(id), JSON.stringify(pkg, null, 2), "utf-8");

    // Return package ID and URL
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const url = `${protocol}://${host}/api/share-packages?id=${id}`;

    return NextResponse.json({
      ok: true,
      id,
      url,
      bytes: Buffer.byteLength(reportMd, "utf-8"),
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

// PATCH /api/share-packages
// Header: x-share-token
// Body: { id, issueUrl, targetRepo?, issueTitle? }
export async function PATCH(req: Request) {
  try {
    const token = getToken();
    const auth = req.headers.get("x-share-token") || "";

    if (!token || auth !== token) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const { id, issueUrl, targetRepo, issueTitle } = body;

    if (!id || !issueUrl) {
      return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }

    // Validate issueUrl format
    if (!issueUrl.startsWith("http://") && !issueUrl.startsWith("https://")) {
      return NextResponse.json({ ok: false, error: "INVALID_URL" }, { status: 400 });
    }

    const p = packagePath(id);
    if (!fs.existsSync(p)) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Read existing package
    const txt = fs.readFileSync(p, "utf-8");
    const pkg = JSON.parse(txt);

    // Update with issueUrl and optional metadata
    pkg.issueUrl = issueUrl;
    if (targetRepo) pkg.targetRepo = targetRepo;
    if (issueTitle) pkg.issueTitle = issueTitle;
    pkg.updatedAt = new Date().toISOString();

    // Write back
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2), "utf-8");

    return NextResponse.json({
      ok: true,
      id,
      issueUrl,
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
