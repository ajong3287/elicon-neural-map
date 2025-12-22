import fs from "fs/promises";
import path from "path";
import Link from "next/link";

type FileInfo = {
  name: string;
  path: string;
  size: number;
  mtime: Date;
};

async function getFiles(dir: string): Promise<FileInfo[]> {
  const projectRoot = process.cwd();
  const fullPath = path.join(projectRoot, dir);

  try {
    const files = await fs.readdir(fullPath);
    const fileInfos = await Promise.all(
      files
        .filter((f) => f.endsWith(".md"))
        .map(async (name) => {
          const filePath = path.join(fullPath, name);
          const stats = await fs.stat(filePath);
          return {
            name,
            path: path.join(dir, name),
            size: stats.size,
            mtime: stats.mtime,
          };
        })
    );
    return fileInfos.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  } catch {
    return [];
  }
}

export default async function OpsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";

  const [issues, proofs, decisions] = await Promise.all([
    getFiles("issues"),
    getFiles("docs/PROOFS"),
    getFiles("docs/DECISIONS"),
  ]);

  const filterFiles = (files: FileInfo[]) => {
    if (!query) return files;
    return files.filter((f) =>
      f.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredIssues = filterFiles(issues);
  const filteredProofs = filterFiles(proofs);
  const filteredDecisions = filterFiles(decisions);

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>📊 Neural Map Operations Dashboard</h1>
      <p style={{ color: "#666" }}>
        Local Git workflow hub - Issues → Proofs → Decisions
      </p>

      {/* Search */}
      <form method="get" style={{ margin: "1rem 0" }}>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search (e.g., REQ-001)"
          style={{
            padding: "0.5rem",
            width: "300px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: "0.5rem",
            padding: "0.5rem 1rem",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
        {query && (
          <Link
            href="/ops"
            style={{ marginLeft: "0.5rem", color: "#0070f3" }}
          >
            Clear
          </Link>
        )}
      </form>

      {/* Issues */}
      <section style={{ marginTop: "2rem" }}>
        <h2>📋 Issues ({filteredIssues.length})</h2>
        {filteredIssues.length === 0 ? (
          <p style={{ color: "#999" }}>No issues found</p>
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
                <th style={cellStyle}>File</th>
                <th style={cellStyle}>Size</th>
                <th style={cellStyle}>Modified</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((file) => (
                <tr key={file.path}>
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

      {/* Proofs */}
      <section style={{ marginTop: "2rem" }}>
        <h2>🔍 Proofs ({filteredProofs.length})</h2>
        {filteredProofs.length === 0 ? (
          <p style={{ color: "#999" }}>No proofs found</p>
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
                <th style={cellStyle}>File</th>
                <th style={cellStyle}>Size</th>
                <th style={cellStyle}>Modified</th>
              </tr>
            </thead>
            <tbody>
              {filteredProofs.map((file) => (
                <tr key={file.path}>
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

      {/* Decisions */}
      <section style={{ marginTop: "2rem" }}>
        <h2>✅ Decisions ({filteredDecisions.length})</h2>
        {filteredDecisions.length === 0 ? (
          <p style={{ color: "#999" }}>No decisions found</p>
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
                <th style={cellStyle}>File</th>
                <th style={cellStyle}>Size</th>
                <th style={cellStyle}>Modified</th>
              </tr>
            </thead>
            <tbody>
              {filteredDecisions.map((file) => (
                <tr key={file.path}>
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
          💡 Tip: Click file names to view content | Use search to filter by
          REQ-xxx
        </p>
        <p>
          <Link href="/map" style={{ color: "#0070f3" }}>
            ← Back to Map
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
