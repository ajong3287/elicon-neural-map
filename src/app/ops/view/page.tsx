import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ViewPage({
  searchParams,
}: {
  searchParams: { path?: string };
}) {
  const filePath = searchParams.path;

  if (!filePath) {
    return (
      <div style={{ padding: "2rem", fontFamily: "monospace" }}>
        <h1>❌ No file specified</h1>
        <Link href="/ops" style={{ color: "#0070f3" }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const projectRoot = process.cwd();
  const fullPath = path.join(projectRoot, filePath);

  // Security: Prevent path traversal
  if (!fullPath.startsWith(projectRoot)) {
    notFound();
  }

  let content: string;
  let stats: any;

  try {
    content = await fs.readFile(fullPath, "utf-8");
    stats = await fs.stat(fullPath);
  } catch {
    notFound();
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/ops" style={{ color: "#0070f3" }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ marginTop: "1rem" }}>📄 {path.basename(filePath)}</h1>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          Path: {filePath} | Size: {(stats.size / 1024).toFixed(1)} KB |
          Modified: {stats.mtime.toLocaleString("ko-KR")}
        </p>
      </header>

      <div
        style={{
          background: "#f5f5f5",
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
          overflowX: "auto",
        }}
      >
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            lineHeight: "1.6",
          }}
        >
          {content}
        </pre>
      </div>

      <footer style={{ marginTop: "2rem", color: "#999", fontSize: "0.9rem" }}>
        <p>
          💡 Tip: Press Ctrl+F to search within this document | Copy text
          directly from the box above
        </p>
      </footer>
    </div>
  );
}
