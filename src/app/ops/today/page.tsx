import fs from "fs/promises";
import path from "path";
import Link from "next/link";

type FileInfo = {
  name: string;
  path: string;
  size: number;
  mtime: Date;
  category: string;
};

async function getTodayFiles(): Promise<FileInfo[]> {
  const projectRoot = process.cwd();
  const dirs = [
    { path: "issues", category: "Issue" },
    { path: "docs/PROOFS", category: "Proof" },
    { path: "docs/DECISIONS", category: "Decision" },
  ];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const allFiles: FileInfo[] = [];

  for (const dir of dirs) {
    const fullPath = path.join(projectRoot, dir.path);
    try {
      const files = await fs.readdir(fullPath);
      for (const name of files) {
        if (!name.endsWith(".md")) continue;

        const filePath = path.join(fullPath, name);
        const stats = await fs.stat(filePath);

        if (stats.mtime >= todayStart) {
          allFiles.push({
            name,
            path: path.join(dir.path, name),
            size: stats.size,
            mtime: stats.mtime,
            category: dir.category,
          });
        }
      }
    } catch {
      // Directory doesn't exist or permission error
      continue;
    }
  }

  return allFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

export default async function TodayPage() {
  const files = await getTodayFiles();

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>📅 Today&apos;s Activity</h1>
      <p style={{ color: "#666" }}>
        Files modified today ({new Date().toLocaleDateString("ko-KR")})
      </p>

      <section style={{ marginTop: "2rem" }}>
        {files.length === 0 ? (
          <p style={{ color: "#999" }}>No files modified today</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={cellStyle}>Category</th>
                <th style={cellStyle}>File</th>
                <th style={cellStyle}>Size</th>
                <th style={cellStyle}>Modified</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.path}>
                  <td style={cellStyle}>
                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        background:
                          file.category === "Issue"
                            ? "#e3f2fd"
                            : file.category === "Proof"
                              ? "#fff3e0"
                              : "#e8f5e9",
                        fontSize: "0.85rem",
                      }}
                    >
                      {file.category}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <Link
                      href={`/ops/view?path=${encodeURIComponent(file.path)}`}
                      style={{ color: "#0070f3" }}
                    >
                      {file.name}
                    </Link>
                  </td>
                  <td style={cellStyle}>{(file.size / 1024).toFixed(1)} KB</td>
                  <td style={cellStyle}>
                    {file.mtime.toLocaleString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer style={{ marginTop: "3rem", color: "#999", fontSize: "0.9rem" }}>
        <p>
          💡 Tip: This shows all files modified since midnight local time
        </p>
        <p>
          <Link href="/ops" style={{ color: "#0070f3" }}>
            ← Back to Dashboard
          </Link>
        </p>
      </footer>
    </div>
  );
}

const cellStyle = {
  padding: "0.5rem",
  border: "1px solid #ddd",
  textAlign: "left" as const,
};
