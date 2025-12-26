import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function packagesDir() {
  return path.join(process.cwd(), ".data", "share-packages");
}

// GET /api/stats
export async function GET() {
  try {
    const dir = packagesDir();

    // Check if packages directory exists
    if (!fs.existsSync(dir)) {
      return NextResponse.json({
        ok: true,
        stats: {
          totalPackages: 0,
          totalIssues: 0,
          linkCompletionRate: 0,
          byKind: { pm: 0, dev: 0 },
          byTargetRepo: {},
          recentPackages: [],
        },
      });
    }

    // Read all package files
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    const packages = files.map((f) => {
      const txt = fs.readFileSync(path.join(dir, f), "utf-8");
      return JSON.parse(txt);
    });

    // Calculate statistics
    const totalPackages = packages.length;
    const totalIssues = packages.filter((p) => p.issueUrl).length;
    const linkCompletionRate =
      totalPackages > 0 ? Math.round((totalIssues / totalPackages) * 100) : 0;

    // By kind (pm/dev)
    const byKind = {
      pm: packages.filter((p) => p.kind === "pm").length,
      dev: packages.filter((p) => p.kind === "dev").length,
    };

    // By targetRepo
    const byTargetRepo: Record<string, number> = {};
    packages.forEach((p) => {
      if (p.targetRepo) {
        byTargetRepo[p.targetRepo] = (byTargetRepo[p.targetRepo] || 0) + 1;
      }
    });

    // Recent packages (last 10, sorted by createdAt desc)
    const recentPackages = packages
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        kind: p.kind,
        createdAt: p.createdAt,
        hasIssue: !!p.issueUrl,
        targetRepo: p.targetRepo || null,
      }));

    return NextResponse.json({
      ok: true,
      stats: {
        totalPackages,
        totalIssues,
        linkCompletionRate,
        byKind,
        byTargetRepo,
        recentPackages,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
