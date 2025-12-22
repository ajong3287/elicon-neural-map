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

function getTopDir(label: string) {
  const p = (label || "").replaceAll("\\", "/");
  if (!p.includes("/")) return ".";
  return p.split("/")[0] || ".";
}

function getExt(label: string) {
  const base = (label || "").split("/").pop() || "";
  const i = base.lastIndexOf(".");
  if (i <= 0) return "(noext)";
  return base.slice(i + 1).toLowerCase();
}

function toSortedTop(map: Map<string, number>, topN: number) {
  const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const top = arr.slice(0, topN);
  const rest = arr.slice(topN).reduce((s, [, v]) => s + v, 0);
  return { top, rest };
}

// STEP05.8: URL Snapshot utilities
type UrlSnap = {
  dir?: string;
  ext?: string;
  hid?: 0 | 1;
  hub?: number;
  fid?: string;
  fonly?: 0 | 1;
  onehop?: 0 | 1;
  z?: number;
  px?: number;
  py?: number;
};

function encodeSnap(s: UrlSnap) {
  const p = new URLSearchParams();
  if (s.dir) p.set("dir", s.dir);
  if (s.ext) p.set("ext", s.ext);
  if (typeof s.hid === "number") p.set("hid", String(s.hid));
  if (typeof s.hub === "number") p.set("hub", String(s.hub));
  if (s.fid) p.set("fid", s.fid);
  if (typeof s.fonly === "number") p.set("fonly", String(s.fonly));
  if (typeof s.onehop === "number") p.set("onehop", String(s.onehop));
  if (typeof s.z === "number") p.set("z", s.z.toFixed(3));
  if (typeof s.px === "number") p.set("px", s.px.toFixed(1));
  if (typeof s.py === "number") p.set("py", s.py.toFixed(1));
  return p.toString();
}

function decodeSnap(qs: string): UrlSnap {
  const p = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
  const hub = p.get("hub");
  const z = p.get("z");
  const px = p.get("px");
  const py = p.get("py");
  return {
    dir: p.get("dir") || undefined,
    ext: p.get("ext") || undefined,
    hid: p.has("hid") ? (Number(p.get("hid")) ? 1 : 0) : undefined,
    hub: hub != null ? Number(hub) : undefined,
    fid: p.get("fid") || undefined,
    fonly: p.has("fonly") ? (Number(p.get("fonly")) ? 1 : 0) : undefined,
    onehop: p.has("onehop") ? (Number(p.get("onehop")) ? 1 : 0) : undefined,
    z: z != null ? Number(z) : undefined,
    px: px != null ? Number(px) : undefined,
    py: py != null ? Number(py) : undefined,
  };
}

// STEP05.10: Snapshot History
type SavedSnap = {
  id: string;
  name: string;
  url: string;
  createdAt: string; // ISO
};

const SNAP_STORE_KEY = "neuralmap_saved_snaps_v1";
const SNAP_STORE_LIMIT = 30;

function safeParseJSON<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function loadSavedSnaps(): SavedSnap[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SNAP_STORE_KEY);
  const list = safeParseJSON<SavedSnap[]>(raw, []);
  return Array.isArray(list) ? list : [];
}

function persistSavedSnaps(list: SavedSnap[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNAP_STORE_KEY, JSON.stringify(list));
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function MapClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [graph, setGraph] = useState<Graph | null>(null);

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

  // STEP05.6: filter state
  const [dirFilter, setDirFilter] = useState<string>("(all)");
  const [extFilter, setExtFilter] = useState<string>("(all)");
  const [hideIsolated, setHideIsolated] = useState<boolean>(false);
  const [hubThreshold, setHubThreshold] = useState<number>(6);

  // STEP05.7: focus state
  const [focusId, setFocusId] = useState<string | null>(null);
  const [focusOnly, setFocusOnly] = useState<boolean>(false);

  // STEP05.8: URL snapshot state
  const [cyReady, setCyReady] = useState(false);
  const [snapApplied, setSnapApplied] = useState(false);
  const [vpApplied, setVpApplied] = useState(false);

  // STEP05.10: Snapshot History state
  const [snapName, setSnapName] = useState("");
  const [savedSnaps, setSavedSnaps] = useState<SavedSnap[]>([]);
  const [snapMsg, setSnapMsg] = useState("");

  // STEP05.10: Load saved snaps on mount
  useEffect(() => {
    setSavedSnaps(loadSavedSnaps());
  }, []);

  // STEP05.10: Save current snapshot
  function saveCurrentSnap() {
    const name = snapName.trim();
    if (!name) {
      setSnapMsg("ERROR: 이름을 입력하세요.");
      return;
    }

    const url = typeof window !== "undefined" ? window.location.href : "";
    const newSnap: SavedSnap = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      url,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSnap, ...savedSnaps].slice(0, SNAP_STORE_LIMIT);
    persistSavedSnaps(updated);
    setSavedSnaps(updated);
    setSnapName("");
    setSnapMsg(`SAVED: "${name}"`);
    setTimeout(() => setSnapMsg(""), 3000);
  }

  // STEP05.10: Copy snapshot URL
  async function copySnapUrl(u: string) {
    const ok = await copyText(u);
    if (ok) {
      setSnapMsg("URL 복사 완료");
    } else {
      setSnapMsg("ERROR: 복사 실패");
    }
    setTimeout(() => setSnapMsg(""), 3000);
  }

  // STEP05.10: Delete snapshot
  function deleteSnap(id: string) {
    const updated = savedSnaps.filter((s) => s.id !== id);
    persistSavedSnaps(updated);
    setSavedSnaps(updated);
    setSnapMsg("DELETED");
    setTimeout(() => setSnapMsg(""), 2000);
  }

  // STEP05.10: Open snapshot
  function openSnap(u: string) {
    if (typeof window !== "undefined") {
      window.location.href = u;
    }
  }

  useEffect(() => {
    (async () => {
      const r = await fetch("/graph.json", { cache: "no-store" });
      const g = (await r.json()) as Graph;
      setGraph(g);
    })();
  }, []);

  // STEP05.8: URL → State restoration (initial load)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (snapApplied) return;

    const s = decodeSnap(window.location.search);

    if (s.dir != null) setDirFilter(s.dir);
    if (s.ext != null) setExtFilter(s.ext);
    if (s.hid != null) setHideIsolated(!!s.hid);
    if (s.hub != null && !Number.isNaN(s.hub)) setHubThreshold(s.hub);
    if (s.fid != null) setFocusId(s.fid);
    if (s.fonly != null) setFocusOnly(!!s.fonly);

    setSnapApplied(true);
  }, [snapApplied]);

  // STEP05.8: State/Viewport → URL sync (debounced)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!snapApplied) return;

    const t = setTimeout(() => {
      const cy = cyRef.current;
      const z = cy && typeof cy.zoom === "function" ? cy.zoom() : undefined;
      const pan = cy && typeof cy.pan === "function" ? cy.pan() : undefined;

      const qs = encodeSnap({
        dir: dirFilter || undefined,
        ext: extFilter || undefined,
        hid: hideIsolated ? 1 : 0,
        hub: Number(hubThreshold),
        fid: focusId || undefined,
        fonly: focusOnly ? 1 : 0,
        z: typeof z === "number" ? z : undefined,
        px: pan?.x,
        py: pan?.y,
      });

      const url = new URL(window.location.href);
      url.search = qs ? `?${qs}` : "";
      window.history.replaceState(null, "", url.toString());
    }, 250);

    return () => clearTimeout(t);
  }, [snapApplied, dirFilter, extFilter, hideIsolated, hubThreshold, focusId, focusOnly]);

  // STEP05.8: Zoom/pan restoration (once when cyReady)
  useEffect(() => {
    if (!snapApplied) return;
    if (!cyReady) return;
    if (vpApplied) return;

    const s = decodeSnap(typeof window !== "undefined" ? window.location.search : "");
    const cy = cyRef.current;
    if (!cy) return;

    if (typeof s.z === "number" && !Number.isNaN(s.z)) {
      cy.zoom(s.z);
    }
    if (typeof s.px === "number" && typeof s.py === "number") {
      cy.pan({ x: s.px, y: s.py });
    }

    setVpApplied(true);
  }, [snapApplied, cyReady, vpApplied]);

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

  // STEP05.6: Filter options
  const filterOptions = useMemo(() => {
    const nodes = (graph?.nodes as any[]) || [];
    const dirs = new Set<string>();
    const exts = new Set<string>();
    for (const n of nodes) {
      const label = (n.label ?? "") as string;
      dirs.add(getTopDir(label));
      exts.add(getExt(label));
    }
    const dirList = Array.from(dirs).sort((a, b) => a.localeCompare(b));
    const extList = Array.from(exts).sort((a, b) => a.localeCompare(b));
    return { dirList, extList };
  }, [graph]);

  // STEP05.6: Degree calculation
  const degreeMap = useMemo(() => {
    const nodes = (graph?.nodes as any[]) || [];
    const edges = (graph?.edges as any[]) || [];
    const deg = new Map<string, number>();
    for (const n of nodes) deg.set(n.id, 0);

    for (const e of edges) {
      const a = (e.from ?? e.source ?? e.a) as string | undefined;
      const b = (e.to ?? e.target ?? e.b) as string | undefined;
      if (!a || !b) continue;
      deg.set(a, (deg.get(a) ?? 0) + 1);
      deg.set(b, (deg.get(b) ?? 0) + 1);
    }
    return deg;
  }, [graph]);

  // STEP05.6: Filter pipeline (includes all filters)
  const filtered = useMemo(() => {
    const nodes = (graph?.nodes as any[]) || [];
    const edges = (graph?.edges as any[]) || [];
    const q = search.trim().toLowerCase();

    // Build collapsed node IDs
    const collapsedNodeIds = new Set<string>();
    collapsedClusters.forEach((clusterId) => {
      const cluster = graph?.clusters?.find((c) => c.id === clusterId);
      if (cluster) {
        cluster.nodeIds.forEach((nodeId) => collapsedNodeIds.add(nodeId));
      }
    });

    const keepNode = (n: any) => {
      // Collapsed clusters
      if (collapsedNodeIds.has(n.id)) return false;

      // Folder filter (existing)
      if (folderFilter && !(n.id.startsWith(folderFilter + "/") || n.id === folderFilter)) return false;

      // Search filter (existing)
      const label = (n.label ?? "") as string;
      if (q && !(label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))) return false;

      // Score filter (existing)
      const s = n.score ?? 0;
      if (s < scoreRange.min || s > scoreRange.max) return false;

      // STEP05.6: Dir/Ext filters
      const d = getTopDir(label);
      const x = getExt(label);
      if (dirFilter !== "(all)" && d !== dirFilter) return false;
      if (extFilter !== "(all)" && x !== extFilter) return false;

      // STEP05.6: Isolated filter
      const deg = degreeMap.get(n.id) ?? 0;
      if (hideIsolated && deg === 0) return false;

      return true;
    };

    const kept = nodes.filter(keepNode);
    const keptSet = new Set(kept.map((n) => n.id));

    const keptEdges = edges.filter((e: any) => {
      const a = (e.from ?? e.source ?? e.a) as string | undefined;
      const b = (e.to ?? e.target ?? e.b) as string | undefined;
      if (!a || !b) return false;
      return keptSet.has(a) && keptSet.has(b);
    });

    return { nodes: kept, edges: keptEdges };
  }, [graph, dirFilter, extFilter, hideIsolated, degreeMap, folderFilter, search, scoreRange, collapsedClusters]);

  // STEP05.6: Hub highlight
  const highlightedNodes = useMemo(() => {
    return filtered.nodes.map((n: any) => {
      const deg = degreeMap.get(n.id) ?? 0;
      const isHub = deg >= hubThreshold;
      return { ...n, isHub, deg };
    });
  }, [filtered.nodes, degreeMap, hubThreshold]);

  // STEP05.7: Focus nodes
  const focusNodes = useMemo(() => {
    if (!focusId) return highlightedNodes;
    return highlightedNodes.map((n: any) => {
      const isFocus = n.id === focusId;
      // dim: 포커스 외 노드는 살짝 흐리게
      return {
        ...n,
        isFocus,
        dim: !isFocus,
      };
    });
  }, [highlightedNodes, focusId]);

  // STEP05.7: Focus only (1-hop)
  const focusFiltered = useMemo(() => {
    if (!focusOnly || !focusId) return { nodes: focusNodes, edges: filtered.edges };

    const neighbor = new Set<string>();
    neighbor.add(focusId);

    for (const e of filtered.edges as any[]) {
      const a = (e.from ?? e.source ?? e.a) as string | undefined;
      const b = (e.to ?? e.target ?? e.b) as string | undefined;
      if (!a || !b) continue;
      if (a === focusId) neighbor.add(b);
      if (b === focusId) neighbor.add(a);
    }

    const nodes = (focusNodes as any[]).filter((n) => neighbor.has(n.id));
    const set = new Set(nodes.map((n) => n.id));
    const edges = (filtered.edges as any[]).filter((e) => {
      const a = (e.from ?? e.source ?? e.a) as string | undefined;
      const b = (e.to ?? e.target ?? e.b) as string | undefined;
      if (!a || !b) return false;
      return set.has(a) && set.has(b);
    });

    return { nodes, edges };
  }, [focusOnly, focusId, focusNodes, filtered.edges]);

  // STEP05.7: Elements (use focusFiltered)
  const elements = useMemo(() => {
    if (!graph) return [];

    // Build node-to-cluster map
    const nodeToCluster = new Map<string, string>();
    graph.clusters?.forEach((cluster) => {
      if (!collapsedClusters.has(cluster.id)) {
        cluster.nodeIds.forEach((nodeId) => {
          nodeToCluster.set(nodeId, cluster.id);
        });
      }
    });

    // Use focusFiltered.nodes (already has all filters + focus + hub)
    const nodes = focusFiltered.nodes.map((n: any) => ({
      data: {
        id: n.id,
        label: n.label,
        ext: n.ext,
        degree: n.deg ?? 0,
        score: n.score ?? 0,
        path: n.path,
        parent: nodeToCluster.get(n.id),
        isHub: n.isHub,      // STEP05.6: Hub indicator
        isFocus: n.isFocus,  // STEP05.7: Focus indicator
        dim: n.dim,          // STEP05.7: Dim indicator
      },
    }));

    const nodeIdSet = new Set(nodes.map((x) => x.data.id));

    // Use focusFiltered.edges (already filtered)
    const edges = focusFiltered.edges.map((e: any, i: number) => {
      const source = (e.from ?? e.source ?? e.a) as string;
      const target = (e.to ?? e.target ?? e.b) as string;
      return {
        data: {
          id: `${source}__${target}__${i}`,
          source,
          target,
          type: e.type
        }
      };
    });

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
  }, [graph, focusFiltered, collapsedClusters]);

  // STEP05.5: Dashboard data
  const dashboard = useMemo(() => {
    const nodes = (graph?.nodes as any[]) || [];
    const edges = (graph?.edges as any[]) || [];

    const extMap = new Map<string, number>();
    const dirMap = new Map<string, number>();

    // 폴더/확장자 분포
    for (const n of nodes) {
      const label = (n.label ?? "") as string;
      const ext = getExt(label);
      const dir = getTopDir(label);
      extMap.set(ext, (extMap.get(ext) ?? 0) + 1);
      dirMap.set(dir, (dirMap.get(dir) ?? 0) + 1);
    }

    // 허브 노드 (Top 12)
    const hubs = nodes
      .map((n) => ({ id: n.id, label: n.label ?? n.id, deg: degreeMap.get(n.id) ?? 0 }))
      .sort((a, b) => b.deg - a.deg)
      .slice(0, 12);

    // 고립 노드 (Top 30)
    const isolated = nodes
      .filter((n) => (degreeMap.get(n.id) ?? 0) === 0)
      .map((n) => ({ id: n.id, label: n.label ?? n.id }))
      .slice(0, 30);

    const extTop = toSortedTop(extMap, 12);
    const dirTop = toSortedTop(dirMap, 12);

    return {
      nodesCount: nodes.length,
      edgesCount: edges.length,
      extTop,
      dirTop,
      hubs,
      isolatedCount: nodes.filter((n) => (degreeMap.get(n.id) ?? 0) === 0).length,
      isolated,
    };
  }, [graph, degreeMap]);

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
      // STEP05.6: Hub node style
      .selector("node[isHub]")
      .style({
        "border-width": 3,
        "border-color": "#fbbf24",
        "border-style": "solid"
      })
      // STEP05.7: Focused node style
      .selector("node[isFocus]")
      .style({
        "border-width": 4,
        "border-color": "#22c55e",
        "border-style": "solid",
        opacity: 1
      })
      // STEP05.7: Dimmed node style
      .selector("node[dim]")
      .style({
        opacity: 0.25
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

  // STEP05.8: Copy share URL
  async function copyShareUrl() {
    try {
      const u = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(u);
      alert("URL 복사 완료");
    } catch {
      alert("복사 실패: 브라우저 권한을 확인하세요.");
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

      {/* STEP05.6: Filter Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "10px 10px 0 10px", background: "#0b0b0f", borderBottom: "1px solid #1f2937" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Folder</span>
          <select
            value={dirFilter}
            onChange={(e) => setDirFilter(e.target.value)}
            style={{ padding: "4px 8px", background: "#0f172a", color: "#e5e7eb", border: "1px solid #263041", borderRadius: 8, fontSize: 12 }}
          >
            <option value="(all)">(all)</option>
            {filterOptions.dirList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Ext</span>
          <select
            value={extFilter}
            onChange={(e) => setExtFilter(e.target.value)}
            style={{ padding: "4px 8px", background: "#0f172a", color: "#e5e7eb", border: "1px solid #263041", borderRadius: 8, fontSize: 12 }}
          >
            <option value="(all)">(all)</option>
            {filterOptions.extList.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>

        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
          <input
            type="checkbox"
            checked={hideIsolated}
            onChange={(e) => setHideIsolated(e.target.checked)}
          />
          hide isolated
        </label>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>hub ≥ {hubThreshold}</span>
          <input
            type="range"
            min={1}
            max={20}
            value={hubThreshold}
            onChange={(e) => setHubThreshold(parseInt(e.target.value, 10))}
            style={{ width: 100 }}
          />
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>
          filtered: nodes {focusFiltered.nodes.length} · edges {focusFiltered.edges.length}
        </div>

        {/* STEP05.8: Copy Link Button */}
        <button
          onClick={copyShareUrl}
          style={{
            padding: "6px 12px",
            background: "#1e40af",
            color: "#e5e7eb",
            border: "1px solid #3b82f6",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          링크 복사
        </button>
      </div>

      {/* STEP05.7: Focus Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "10px", background: "#0b0b0f", borderBottom: "1px solid #1f2937" }}>
        {focusId ? (
          <>
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "6px 10px", background: "rgba(251,191,36,0.15)", borderRadius: 8, border: "1px solid rgba(251,191,36,0.3)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>Focus:</span>
              <span style={{ fontSize: 12, opacity: 0.9, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {focusFiltered.nodes.find((n: any) => n.id === focusId)?.label ?? focusId}
              </span>
            </div>

            <button
              onClick={() => setFocusId(null)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #374151", background: "#0f172a", color: "#e5e7eb", cursor: "pointer", fontSize: 12 }}
            >
              Clear
            </button>

            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
              <input
                type="checkbox"
                checked={focusOnly}
                onChange={(e) => setFocusOnly(e.target.checked)}
              />
              focus only (1-hop)
            </label>
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.6 }}>클릭하여 노드 포커스</div>
        )}
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
              setCyReady(true);
              cy.on("tap", "node", (evt: any) => {
                const id = evt.target.data("id") as string;
                openFileById(id);
              });
            }}
          />
        </div>

        {/* Right Code */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* STEP05.5: Dashboard (STEP05.7: with clickable Hub/Isolated) */}
          <div style={{ display: "grid", gap: 10, padding: 10, borderBottom: "1px solid #1f2937" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 700 }}>Dashboard</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                nodes {dashboard.nodesCount} · edges {dashboard.edgesCount}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Top folders */}
              <div style={{ padding: 10, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>Top folders</div>
                {dashboard.dirTop.top.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", opacity: 0.9 }}>
                    <span>{k}</span>
                    <span style={{ opacity: 0.7 }}>{v}</span>
                  </div>
                ))}
                {dashboard.dirTop.rest > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", opacity: 0.6, fontStyle: "italic" }}>
                    <span>others</span>
                    <span>{dashboard.dirTop.rest}</span>
                  </div>
                )}
              </div>

              {/* Top extensions */}
              <div style={{ padding: 10, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>Top extensions</div>
                {dashboard.extTop.top.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", opacity: 0.9 }}>
                    <span>{k}</span>
                    <span style={{ opacity: 0.7 }}>{v}</span>
                  </div>
                ))}
                {dashboard.extTop.rest > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", opacity: 0.6, fontStyle: "italic" }}>
                    <span>others</span>
                    <span>{dashboard.extTop.rest}</span>
                  </div>
                )}
              </div>

              {/* Hub nodes - STEP05.7: clickable */}
              <div style={{ padding: 10, border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8, background: "rgba(251,191,36,0.05)" }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12, color: "#fbbf24" }}>Hub nodes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 120, overflowY: "auto" }}>
                  {dashboard.hubs.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => setFocusId(h.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        padding: "4px 6px",
                        opacity: 0.9,
                        cursor: "pointer",
                        borderRadius: 4,
                        background: focusId === h.id ? "rgba(251,191,36,0.2)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(251,191,36,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = focusId === h.id ? "rgba(251,191,36,0.2)" : "transparent";
                      }}
                    >
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.label}</span>
                      <span style={{ opacity: 0.7, marginLeft: 6, flexShrink: 0 }}>({h.deg})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Isolated nodes - STEP05.7: clickable */}
              <div style={{ padding: 10, border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, background: "rgba(239,68,68,0.05)" }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12, color: "#ef4444" }}>
                  Isolated ({dashboard.isolatedCount})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 120, overflowY: "auto" }}>
                  {dashboard.isolated.map((iso) => (
                    <div
                      key={iso.id}
                      onClick={() => setFocusId(iso.id)}
                      style={{
                        fontSize: 11,
                        padding: "4px 6px",
                        opacity: 0.9,
                        cursor: "pointer",
                        borderRadius: 4,
                        background: focusId === iso.id ? "rgba(239,68,68,0.2)" : "transparent",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = focusId === iso.id ? "rgba(239,68,68,0.2)" : "transparent";
                      }}
                    >
                      {iso.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP05.10: Snapshot History Panel */}
          <div style={{ padding: 10, borderBottom: "1px solid #1f2937" }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12 }}>Snapshot History</div>

            {/* Save current snapshot */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                value={snapName}
                onChange={(e) => setSnapName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveCurrentSnap()}
                placeholder="스냅샷 이름"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  background: "#0f172a",
                  color: "#e5e7eb",
                  border: "1px solid #263041",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <button
                onClick={saveCurrentSnap}
                style={{
                  padding: "6px 12px",
                  background: "#7c3aed",
                  color: "#e5e7eb",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                현재 상태 저장
              </button>
            </div>

            {/* Message */}
            {snapMsg && (
              <div
                style={{
                  padding: "4px 8px",
                  marginBottom: 8,
                  borderRadius: 6,
                  fontSize: 11,
                  background: snapMsg.startsWith("ERROR")
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(34,197,94,0.1)",
                  color: snapMsg.startsWith("ERROR") ? "#ef4444" : "#22c55e",
                  border: snapMsg.startsWith("ERROR")
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(34,197,94,0.3)",
                }}
              >
                {snapMsg}
              </div>
            )}

            {/* Saved snapshots list */}
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {savedSnaps.length === 0 ? (
                <div
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontSize: 11,
                    opacity: 0.5,
                  }}
                >
                  저장된 스냅샷이 없습니다.
                </div>
              ) : (
                savedSnaps.map((snap) => (
                  <div
                    key={snap.id}
                    style={{
                      padding: "6px 8px",
                      marginBottom: 4,
                      background: "#0f172a",
                      border: "1px solid #263041",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 4,
                        color: "#cbd5e1",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {snap.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.6,
                        marginBottom: 6,
                      }}
                    >
                      {new Date(snap.createdAt).toLocaleString("ko-KR")}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => openSnap(snap.url)}
                        style={{
                          flex: 1,
                          padding: "4px 6px",
                          background: "#1e40af",
                          color: "#e5e7eb",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => copySnapUrl(snap.url)}
                        style={{
                          flex: 1,
                          padding: "4px 6px",
                          background: "#059669",
                          color: "#e5e7eb",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => deleteSnap(snap.id)}
                        style={{
                          flex: 1,
                          padding: "4px 6px",
                          background: "#dc2626",
                          color: "#e5e7eb",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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
