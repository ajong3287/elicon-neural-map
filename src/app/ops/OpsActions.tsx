"use client";

import { useState } from "react";

export default function OpsActions() {
  const [issueId, setIssueId] = useState("REQ-003");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("");

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setMessage(`✓ Copied: ${command}`);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <section
      style={{
        marginTop: "2rem",
        padding: "1.5rem",
        background: "#f9f9f9",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
      <h2>⚡ Quick Actions</h2>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
        Copy commands to terminal for quick file generation
      </p>

      {/* Inputs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            }}
          >
            Issue ID
          </label>
          <input
            type="text"
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            placeholder="REQ-003"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            }}
          >
            Title / Slug
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "_"));
            }}
            placeholder="Short description"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() =>
            copyCommand(`ops/new_issue.sh ${issueId} "${title || "title"}"`)
          }
          style={{
            padding: "0.5rem 1rem",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.9rem",
          }}
        >
          📋 Copy: new issue
        </button>
        <button
          onClick={() =>
            copyCommand(`ops/new_proof.sh ${issueId} ${slug || "proof_slug"}`)
          }
          style={{
            padding: "0.5rem 1rem",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.9rem",
          }}
        >
          🔍 Copy: new proof
        </button>
        <button
          onClick={() =>
            copyCommand(
              `ops/new_decision.sh ${issueId} ${slug || "decision_slug"}`
            )
          }
          style={{
            padding: "0.5rem 1rem",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.9rem",
          }}
        >
          ✅ Copy: new decision
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.5rem",
            background: "#e8f5e9",
            color: "#2e7d32",
            borderRadius: "4px",
            fontSize: "0.9rem",
            fontFamily: "monospace",
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
}
