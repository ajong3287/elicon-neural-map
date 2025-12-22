"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import Editor from "@monaco-editor/react";

cytoscape.use(fcose as any);

type GNode = { id: string; label: string; ext: string; path: string; degree?: number; score?: number };
type GEdge = { source: string; target: string; type: string; cycle?: boolean };
type GCluster = { id: string; label: string; nodeIds: string[] };
type GCycle = { id: string; nodeIds: string[] };
type Graph = {
  nodes: GNode[];
  edges: GEdge[];
  unresolved?: any[];
  clusters?: GCluster[];
  cycles?: GCycle[];
  stats?: { nodes: number; edges: number; clusters: number; cycles: number };
};

type TreeNode = {
  name: string;
  path: string; // folder path (relative) or file path
  type: "folder" | "file";
  children?: TreeNode[];
};

function buildTree(files: string[]): TreeNode {
  const root: TreeNode = { name: "ROOT", path: "", type: "folder", children: [] };
  for (const f of files) {
    const parts = f.split("/").filter(Boolean);
    let cur = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      acc = acc ? `${acc}/${p}` : p;
      const isLast = i === parts.length - 1;
      if (!cur.children) cur.children = [];
      let next = cur.children.find((c) => c.name === p);
      if (!next) {
        next = {
          name: p,
          path: acc,
          type: isLast ? "file" : "folder",
          children: isLast ? undefined : [],
        };
        cur.children.push(next);
      }
      cur = next;
    }
  }
  // sort folders first
  const sortRec = (n: TreeNode) => {
    if (n.children) {
      n.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      n.children.forEach(sortRec);
    }
  };
  sortRec(root);
  return root;
}

function getFolderOf(filePath: string) {
  const idx = filePath.lastIndexOf("/");
  return idx >= 0 ? filePath.slice(0, idx) : "";
}

export default function MapClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [graph, setGraph] = useState<Graph | null>(null);

  // Upload state
  const [uploadToken, setUploadToken] = useState("");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Read initial state from URL
  const initialSearch = searchParams.get("q") || "";
  const initialCycleId = searchParams.get("cycle") || null;
  const initialClusters = searchParams.get("clusters") ? new Set(searchParams.get("clusters")!.split(",")) : new Set<string>();
  const initialScoreMin = parseFloat(searchParams.get("scoreMin") || "0");
  const initialScoreMax = parseFloat(searchParams.get("scoreMax") || "1");

  // left panel state
  const [treeOpen, setTreeOpen] = useState<Record<string, boolean>>({ "": true });
  const [folderFilter, setFolderFilter] = useState<string>(""); // folder path or ""
  const [search, setSearch] = useState(initialSearch);
  const [scoreRange, setScoreRange] = useState<{ min: number; max: number }>({ min: initialScoreMin, max: initialScoreMax });

  // cycle state
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(initialCycleId);

  // cluster state
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(initialClusters);

  // right panel state
  const [selected, setSelected] = useState<GNode | null>(null);
  const [content, setContent] = useState<string>("노드를 클릭하거나 좌측 트리에서 파일을 선택하세요.");

  useEffect(() => {
    (async () => {
      const r = await fetch("/graph.json", { cache: "no-store" });
      const g = (await r.json()) as Graph;
      setGraph(g);
    })();
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedCycleId) params.set("cycle", selectedCycleId);
    if (collapsedClusters.size > 0) params.set("clusters", Array.from(collapsedClusters).join(","));
    if (scoreRange.min !== 0) params.set("scoreMin", scoreRange.min.toString());
    if (scoreRange.max !== 1) params.set("scoreMax", scoreRange.max.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `/map?${queryString}` : "/map";
    router.replace(newUrl, { scroll: false });
  }, [search, selectedCycleId, collapsedClusters, scoreRange, router]);

  const fileIds = useMemo(() => (graph ? graph.nodes.map((n) => n.id) : []), [graph]);
  const tree = useMemo(() => buildTree(fileIds), [fileIds]);

  const elements = useMemo(() => {
    if (!graph) return [];
    const q = search.trim().toLowerCase();

    // Build set of collapsed node IDs
    const collapsedNodeIds = new Set<string>();
    collapsedClusters.forEach((clusterId) => {
      const cluster = graph.clusters?.find((c) => c.id === clusterId);
      if (cluster) {
        cluster.nodeIds.forEach((nodeId) => collapsedNodeIds.add(nodeId));
      }
    });

    // Build node-to-cluster map
    const nodeToCluster = new Map<string, string>();
    graph.clusters?.forEach((cluster) => {
      if (!collapsedClusters.has(cluster.id)) {
        cluster.nodeIds.forEach((nodeId) => {
          nodeToCluster.set(nodeId, cluster.id);
        });
      }
    });

    const nodes = graph.nodes
      .filter((n) => !collapsedNodeIds.has(n.id))
      .filter((n) => (folderFilter ? n.id.startsWith(folderFilter + "/") || n.id === folderFilter : true))
      .filter((n) => (q ? n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) : true))
      .filter((n) => {
        const s = n.score ?? 0;
        return s >= scoreRange.min && s <= scoreRange.max;
      })
      .map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          ext: n.ext,
          degree: n.degree ?? 0,
          score: n.score ?? 0,
          path: n.path,
          parent: nodeToCluster.get(n.id) // Add parent cluster
        },
      }));

    const nodeIdSet = new Set(nodes.map((x) => x.data.id));
    const edges = graph.edges
      .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map((e, i) => ({ data: { id: `${e.source}__${e.target}__${i}`, source: e.source, target: e.target, type: e.type } }));

    // Add cluster parent nodes (only for non-collapsed clusters with visible nodes)
    const clusterNodes: any[] = [];
    graph.clusters?.forEach((cluster) => {
      if (!collapsedClusters.has(cluster.id)) {
        // Check if cluster has any visible nodes
        const hasVisibleNodes = cluster.nodeIds.some((nodeId) => nodeIdSet.has(nodeId));
        if (hasVisibleNodes) {
          clusterNodes.push({
            data: {
              id: cluster.id,
              label: cluster.label,
              type: 'cluster'
            }
          });
        }
      }
    });

    return [...clusterNodes, ...nodes, ...edges];
  }, [graph, folderFilter, search, collapsedClusters, scoreRange]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.style()
      .selector("node")
      .style({
        label: "data(label)",
        "font-size": 10,
        "text-outline-width": 2,
        "text-outline-color": "#0b0b0f",
        "background-color": "#f3c623", // js 기본 노랑 느낌
        width: (ele: any) => {
          const score = ele.data("score") ?? 0;
          return 14 + score * 28; // 0..1 → 14..42
        },
        height: (ele: any) => {
          const score = ele.data("score") ?? 0;
          return 14 + score * 28;
        },
      })
      .selector('node[ext = "md"]')
      .style({ "background-color": "#38bdf8" })
      .selector('node[ext = "json"]')
      .style({ "background-color": "#22c55e" })
      .selector('node[type = "cluster"]')
      .style({
        "background-color": "rgba(139, 92, 246, 0.08)", // 연한 보라색 배경
        "background-opacity": 0.5,
        "border-width": 2,
        "border-color": "#8b5cf6",
        "border-opacity": 0.6,
        "border-style": "dashed",
        shape: "roundrectangle",
        "text-valign": "top",
        "text-halign": "center",
        "font-size": 11,
        "font-weight": "bold",
        color: "#a78bfa",
        "text-outline-width": 0,
        padding: "12"
      })
      .selector("edge")
      .style({
        "curve-style": "bezier",
        "line-color": "#8b5cf6",
        width: 2,
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#8b5cf6",
      })
      .selector('edge[type = "import"]')
      .style({ "line-style": "solid" })
      .selector('edge[type != "import"]')
      .style({ "line-style": "dashed" })
      .selector(".selected")
      .style({ "border-width": 3, "border-color": "#a78bfa" })
      .selector("node.cycle-highlight")
      .style({
        "border-width": 4,
        "border-color": "#f87171",
        "border-style": "dashed"
      })
      .selector("edge.cycle-highlight")
      .style({
        "line-color": "#ef4444",
        "target-arrow-color": "#ef4444",
        "source-arrow-color": "#ef4444",
        width: 4,
        "line-style": "solid",
        opacity: 1
      })
      .update();

    // Performance-optimized layout based on node count
    const nodeCount = cy.nodes().length;
    const layoutOptions: any = {
      name: "fcose",
      fit: true,
      padding: 40,
      // Optimize for different node counts
      animate: nodeCount < 100, // Disable animation for large graphs
      randomize: false,
      quality: nodeCount < 100 ? "default" : nodeCount < 500 ? "draft" : "draft",
      numIter: nodeCount < 100 ? 2500 : nodeCount < 500 ? 1500 : 1000,
      // Rendering optimizations
      ...(nodeCount >= 500 && {
        tile: true,
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10
      })
    };

    // Additional rendering optimizations for large graphs
    if (nodeCount >= 500) {
      cy.userPanningEnabled(true);
      cy.userZoomingEnabled(true);
      cy.boxSelectionEnabled(false);
    }

    cy.layout(layoutOptions).run();
  }, [elements]);

  // Cycle highlight effect
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graph) return;

    cy.nodes().removeClass("cycle-highlight");
    cy.edges().removeClass("cycle-highlight");

    if (selectedCycleId) {
      const cycle = graph.cycles?.find((c) => c.id === selectedCycleId);
      if (cycle) {
        cycle.nodeIds.forEach((nodeId) => {
          const node = cy.getElementById(nodeId);
          if (node) node.addClass("cycle-highlight");
        });

        // Highlight edges between cycle nodes
        const cycleNodeSet = new Set(cycle.nodeIds);
        cy.edges().forEach((edge) => {
          const src = edge.data("source");
          const tgt = edge.data("target");
          if (cycleNodeSet.has(src) && cycleNodeSet.has(tgt)) {
            edge.addClass("cycle-highlight");
          }
        });
      }
    }
  }, [selectedCycleId, graph]);

  async function onUpload(file: File) {
    setUploadMsg(null);
    try {
      if (!uploadToken) {
        setUploadMsg("ERROR: token required");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/graph", {
        method: "POST",
        headers: { authorization: `Bearer ${uploadToken}` },
        body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? `upload failed: ${r.status}`);
      setUploadMsg(`UPLOAD_OK bytes=${j?.bytes ?? 0}`);
      window.location.reload();
    } catch (e: any) {
      setUploadMsg(`ERROR: ${e?.message ?? String(e)}`);
    }
  }

  async function openFileById(id: string) {
    const n = graph?.nodes.find((x) => x.id === id) ?? null;
    if (n) setSelected(n);
    setContent("Loading...");

    try {
      const r = await fetch(`/api/file?path=${encodeURIComponent(id)}`);
      if (!r.ok) {
        setContent(await r.text());
        return;
      }
      const txt = await r.text();
      setContent(txt);

      // 그래프에서 해당 노드 강조 + center
      const cy = cyRef.current;
      if (cy) {
        cy.nodes().removeClass("selected");
        const node = cy.getElementById(id);
        if (node) {
          node.addClass("selected");
          cy.center(node);
          cy.zoom({ level: Math.min(1.4, cy.zoom() + 0.2), renderedPosition: node.renderedPosition() });
        }
      }
    } catch (e: any) {
      setContent(String(e?.message ?? e));
    }
  }

  function TreeView({ node, depth }: { node: TreeNode; depth: number }) {
    if (!node.children) return null;

    return (
      <div>
        {node.children.map((c) => {
          const key = c.path;
          const isOpen = treeOpen[key] ?? (depth < 1); // shallow open
          const pad = 8 + depth * 12;

          if (c.type === "folder") {
            return (
              <div key={key}>
                <div
                  onClick={() => setTreeOpen((s) => ({ ...s, [key]: !isOpen }))}
                  style={{
                    padding: `6px 8px 6px ${pad}px`,
                    cursor: "pointer",
                    color: "#cbd5e1",
                    display: "flex",
                    justifyContent: "space-between",
                    borderRadius: 8,
                  }}
                  title={c.path}
                >
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {isOpen ? "▾" : "▸"} {c.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderFilter(c.path);
                    }}
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 8,
                      border: "1px solid #263041",
                      background: folderFilter === c.path ? "#7c3aed" : "#0f172a",
                      color: "#e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    필터
                  </button>
                </div>
                {isOpen && <TreeView node={c} depth={depth + 1} />}
              </div>
            );
          }

          return (
            <div
              key={key}
              onClick={() => openFileById(c.path)}
              style={{
                padding: `6px 8px 6px ${pad + 14}px`,
                cursor: "pointer",
                color: "#e2e8f0",
                borderRadius: 8,
                background: selected?.id === c.path ? "#1f1147" : "transparent",
              }}
              title={c.path}
            >
              {c.name}
            </div>
          );
        })}
      </div>
    );
  }

  const activeFolderLabel = folderFilter ? folderFilter : "(전체)";

  return (
    <div style={{ height: "100vh", background: "#0b0b0f", color: "#e5e7eb", position: "relative" }}>
      {/* Cycle Warning Panel */}
      {graph?.cycles && graph.cycles.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 70,
            right: 14,
            zIndex: 50,
            width: 360,
            borderRadius: 12,
            border: "1px solid #374151",
            background: "rgba(15, 23, 42, 0.95)",
            padding: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fbbf24" }}>
            ⚠️ 순환 의존 감지: {graph.cycles.length}개
          </div>
          <div style={{ marginTop: 8, maxHeight: 240, overflowY: "auto", fontSize: 12, lineHeight: 1.6 }}>
            {graph.cycles.slice(0, 10).map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCycleId(selectedCycleId === c.id ? null : c.id)}
                style={{
                  marginTop: 6,
                  color: "#cbd5e1",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: selectedCycleId === c.id ? "rgba(248, 113, 113, 0.2)" : "transparent",
                  border: selectedCycleId === c.id ? "1px solid #f87171" : "1px solid transparent",
                }}
              >
                <span style={{ fontWeight: 500, color: "#a78bfa" }}>{c.id}</span>:{" "}
                <span style={{ color: "#f87171" }}>{c.nodeIds.join(" → ")}</span>
              </div>
            ))}
            {graph.cycles.length > 10 && (
              <div style={{ marginTop: 8, opacity: 0.7, color: "#94a3b8" }}>…더 있음</div>
            )}
          </div>
        </div>
      )}

      {/* Top Tabs */}
      <div style={{ height: 54, borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
        <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>ELICON Neural Map</div>
        <div style={{ display: "flex", gap: 8, marginLeft: 14 }}>
          <Link href="/map" style={{ padding: "8px 10px", borderRadius: 10, background: "#111827", color: "#fff", textDecoration: "none" }}>
            Map
          </Link>
          <Link href="/logic" style={{ padding: "8px 10px", borderRadius: 10, background: "#0f172a", color: "#cbd5e1", textDecoration: "none" }}>
            Logic
          </Link>
          <Link href="/data" style={{ padding: "8px 10px", borderRadius: 10, background: "#0f172a", color: "#cbd5e1", textDecoration: "none" }}>
            Data
          </Link>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Upload UI */}
          <input
            type="password"
            placeholder="token"
            value={uploadToken}
            onChange={(e) => setUploadToken(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #374151", background: "#0f172a", color: "#e5e7eb", fontSize: 12, width: 100 }}
          />
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
            style={{ fontSize: 11 }}
          />
          {uploadMsg && (
            <div style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: uploadMsg.startsWith("ERROR") ? "#7f1d1d" : "#065f46", color: "#fff" }}>
              {uploadMsg}
            </div>
          )}
          <div style={{ fontSize: 12, opacity: 0.8 }}>폴더필터: {activeFolderLabel}</div>
          <button
            onClick={() => setFolderFilter("")}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #374151", background: "#0f172a", color: "#e5e7eb", cursor: "pointer" }}
          >
            필터 해제
          </button>
          <button
            onClick={() => {
              const cy = cyRef.current;
              if (!cy) return;
              const nodeCount = cy.nodes().length;
              const layoutOptions: any = {
                name: "fcose",
                fit: true,
                padding: 40,
                animate: nodeCount < 100,
                randomize: false,
                quality: nodeCount < 100 ? "default" : "draft",
                numIter: nodeCount < 100 ? 2500 : nodeCount < 500 ? 1500 : 1000,
                ...(nodeCount >= 500 && {
                  tile: true,
                  tilingPaddingVertical: 10,
                  tilingPaddingHorizontal: 10
                })
              };
              cy.layout(layoutOptions).run();
            }}
            style={{ padding: "8px 10px", borderRadius: 10, border: 0, background: "#7c3aed", color: "#fff", cursor: "pointer" }}
          >
            Re-layout
          </button>
        </div>
      </div>

      {/* 3 Columns */}
      <div style={{ height: "calc(100vh - 54px)", display: "grid", gridTemplateColumns: "320px 1fr 520px" }}>
        {/* Left Tree */}
        <div style={{ borderRight: "1px solid #1f2937", overflow: "auto", padding: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색(파일명/경로)"
              style={{ padding: "10px 12px", background: "#0f172a", color: "#e5e7eb", border: "1px solid #263041", borderRadius: 12 }}
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>Score:</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={scoreRange.min}
                onChange={(e) => setScoreRange({ ...scoreRange, min: parseFloat(e.target.value) || 0 })}
                style={{ flex: 1, padding: "6px 8px", background: "#0f172a", color: "#e5e7eb", border: "1px solid #263041", borderRadius: 8, fontSize: 11 }}
              />
              <span style={{ color: "#64748b" }}>~</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={scoreRange.max}
                onChange={(e) => setScoreRange({ ...scoreRange, max: parseFloat(e.target.value) || 1 })}
                style={{ flex: 1, padding: "6px 8px", background: "#0f172a", color: "#e5e7eb", border: "1px solid #263041", borderRadius: 8, fontSize: 11 }}
              />
            </div>
          </div>

          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
            nodes: {graph?.nodes.length ?? "-"} / edges: {graph?.edges.length ?? "-"}
          </div>

          {graph?.clusters && graph.clusters.length > 0 && (
            <div style={{ marginBottom: 10, padding: 8, background: "#0f172a", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "#94a3b8" }}>
                Clusters ({graph.clusters.length})
              </div>
              {graph.clusters.map((cluster) => {
                const isCollapsed = collapsedClusters.has(cluster.id);
                return (
                  <div
                    key={cluster.id}
                    onClick={() => {
                      const newSet = new Set(collapsedClusters);
                      if (isCollapsed) {
                        newSet.delete(cluster.id);
                      } else {
                        newSet.add(cluster.id);
                      }
                      setCollapsedClusters(newSet);
                    }}
                    style={{
                      fontSize: 11,
                      padding: "4px 6px",
                      marginTop: 4,
                      cursor: "pointer",
                      borderRadius: 6,
                      background: isCollapsed ? "#1e293b" : "#334155",
                      color: isCollapsed ? "#64748b" : "#cbd5e1",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      {isCollapsed ? "▸" : "▾"} {cluster.label} ({cluster.nodeIds.length})
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <TreeView node={tree} depth={0} />
        </div>

        {/* Center Graph */}
        <div style={{ borderRight: "1px solid #1f2937", position: "relative" }}>
          <CytoscapeComponent
            elements={elements as any}
            style={{ width: "100%", height: "100%" }}
            cy={(cy: any) => {
              cyRef.current = cy;
              cy.on("tap", "node", (evt: any) => {
                const id = evt.target.data("id") as string;
                openFileById(id);
              });
            }}
          />
        </div>

        {/* Right Code */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #1f2937", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>Inspector</div>
            <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selected ? `${selected.label} — ${selected.id}` : "선택된 노드 없음"}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={selected?.ext === "md" ? "markdown" : selected?.ext === "ts" || selected?.ext === "tsx" ? "typescript" : "javascript"}
              value={content}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
              theme="vs-dark"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
