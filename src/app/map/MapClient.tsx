"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import Editor from "@monaco-editor/react";

cytoscape.use(fcose as any);

// STEP05.16: Safe mode threshold
const SAFE_THRESHOLD = 160;

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
const ISSUE_REPO_TARGET = "neuralmap_issue_repo_target";
const SHARE_UPLOAD_TOKEN = "neuralmap_share_upload_token";
const AUTO_UPLOAD_KEY = "neuralmap_auto_upload";
const TARGET_REPO_KEY = "neuralmap_target_repo";
const GH_ISSUE_TOKEN = "neuralmap_gh_issue_token";
const AUTO_CREATE_ISSUE_KEY = "neuralmap_auto_create_issue";

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

  // Upload state (moved to STEP05.11)
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

  // STEP05.22: Share Package fallback UI state
  const [sharePackageText, setSharePackageText] = useState("");
  const [showSharePackageFallback, setShowSharePackageFallback] = useState(false);

  // STEP05.23: Issue Composer fallback UI state
  const [issueText, setIssueText] = useState("");
  const [showIssueFallback, setShowIssueFallback] = useState(false);

  // STEP05.24: Target Repo state (with localStorage)
  const [issueRepo, setIssueRepo] = useState<string>("ajong3287/elicon-neural-map");

  // STEP05.25: Share Package Upload state (with localStorage)
  const [shareUploadToken, setShareUploadToken] = useState<string>("");
  const [autoUpload, setAutoUpload] = useState<boolean>(false);

  // STEP05.26: Issue Template state (last uploaded Package ID/URL)
  const [lastPkgId, setLastPkgId] = useState<string>("");
  const [lastPkgUrl, setLastPkgUrl] = useState<string>("");
  const [issueTitle, setIssueTitle] = useState<string>("");

  // STEP05.27: GitHub Issue Auto-Create state (with localStorage)
  const [targetRepo, setTargetRepo] = useState<string>("ajong3287/elicon-neural-map");
  const [ghToken, setGhToken] = useState<string>("");
  const [autoCreateIssue, setAutoCreateIssue] = useState<boolean>(false);
  const [issueLabels, setIssueLabels] = useState<string[]>([]);
  const [lastIssueUrl, setLastIssueUrl] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // STEP05.30: Stats Dashboard
  const [stats, setStats] = useState<any>(null);

  // STEP05.11: Server snapshot state
  const [uploadToken, setUploadToken] = useState("");

  // STEP05.16: Safe mode state
  const [safeMode, setSafeMode] = useState<boolean>(false);

  // STEP05.17: Search + Jump state
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // STEP05.20.2: Responsive UI state
  const [isNarrow, setIsNarrow] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);

  // STEP05.10: Load saved snaps on mount
  useEffect(() => {
    setSavedSnaps(loadSavedSnaps());
  }, []);

  // STEP05.24: Load/save issueRepo from/to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(ISSUE_REPO_TARGET);
    if (saved) setIssueRepo(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ISSUE_REPO_TARGET, issueRepo);
  }, [issueRepo]);

  // STEP05.25: Load/save shareUploadToken and autoUpload from/to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedToken = window.localStorage.getItem(SHARE_UPLOAD_TOKEN);
    const savedAutoUpload = window.localStorage.getItem(AUTO_UPLOAD_KEY);
    if (savedToken) setShareUploadToken(savedToken);
    if (savedAutoUpload === "true") setAutoUpload(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SHARE_UPLOAD_TOKEN, shareUploadToken);
  }, [shareUploadToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTO_UPLOAD_KEY, autoUpload ? "true" : "false");
  }, [autoUpload]);

  // STEP05.27: Load/save targetRepo, ghToken, autoCreateIssue from/to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTargetRepo = window.localStorage.getItem(TARGET_REPO_KEY);
    const savedGhToken = window.localStorage.getItem(GH_ISSUE_TOKEN);
    const savedAutoCreate = window.localStorage.getItem(AUTO_CREATE_ISSUE_KEY);
    if (savedTargetRepo) setTargetRepo(savedTargetRepo);
    if (savedGhToken) setGhToken(savedGhToken);
    if (savedAutoCreate === "true") setAutoCreateIssue(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TARGET_REPO_KEY, targetRepo);
  }, [targetRepo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GH_ISSUE_TOKEN, ghToken);
  }, [ghToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTO_CREATE_ISSUE_KEY, autoCreateIssue ? "true" : "false");
  }, [autoCreateIssue]);

  // STEP05.20.2: Responsive breakpoint detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsNarrow(e.matches);
      if (!e.matches) setRightOpen(true); // Auto-open on wide screen
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // STEP05.30: Fetch stats on mount
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
      })
      .catch((err) => console.error("Stats fetch failed:", err));
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

  // STEP05.17: Jump to node
  function jumpToNode(id: string) {
    if (!id) return;

    // Set focus
    setFocusId(id);

    // Animate to node if cy is ready
    if (cyRef.current) {
      const cy = cyRef.current;
      const ele = cy.$id(id);
      if (ele && ele.length > 0) {
        cy.animate(
          {
            center: { eles: ele },
            zoom: Math.max(cy.zoom(), 1.2),
          },
          { duration: 200 }
        );
        // Optional: highlight the node
        ele.select();
      }
    }
  }

  // STEP05.17: Navigate search results
  function handleNext() {
    if (searchResults.length === 0) return;
    const nextIdx = (activeIdx + 1) % searchResults.length;
    setActiveIdx(nextIdx);
    jumpToNode(searchResults[nextIdx]);
  }

  function handlePrev() {
    if (searchResults.length === 0) return;
    const prevIdx = (activeIdx - 1 + searchResults.length) % searchResults.length;
    setActiveIdx(prevIdx);
    jumpToNode(searchResults[prevIdx]);
  }

  function handleJump() {
    if (searchResults.length === 0) return;
    jumpToNode(searchResults[activeIdx]);
  }

  function clearSearch() {
    setSearchQ("");
    setSearchResults([]);
    setActiveIdx(0);
    setFocusId("");
  }

  // STEP05.21: URL normalization for snapshot matching
  function normalizeUrl(urlStr: string): string {
    try {
      const url = new URL(urlStr);
      const coreParams = ["cycle", "cluster", "q", "focusId", "focusOnly", "dir", "ext", "hideIsolated", "hubThreshold", "safeMode"];
      const params = new URLSearchParams();

      coreParams.forEach((key) => {
        const val = url.searchParams.get(key);
        if (val !== null) params.set(key, val);
      });

      params.sort();
      const normalized = `${url.origin}${url.pathname}${params.toString() ? "?" + params.toString() : ""}`;
      return normalized;
    } catch {
      return urlStr;
    }
  }

  // STEP05.19: Export Report (2 Templates: PM/Dev)
  function buildPMReport(): string {
    const timestamp = new Date().toISOString();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const stats = graph?.stats ?? { nodes: 0, edges: 0, clusters: 0, cycles: 0 };
    const { hubs, isolated, isolatedCount } = dashboard;

    // STEP05.21: Find active snapshot with normalized URL matching
    const normalizedUrl = normalizeUrl(url);
    const activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

    let md = "# Project Management Report\n\n";
    md += `**Generated**: ${timestamp}\n\n`;

    // STEP05.20: Add snapshot info if present
    if (activeSnap) {
      md += `**Snapshot**: ${activeSnap.name}\n`;
      md += `**Snapshot ID**: ${activeSnap.id}\n`;
      md += `**Snapshot Created**: ${activeSnap.createdAt}\n\n`;
    } else {
      md += `**Snapshot**: (none)\n\n`;
    }

    md += `**Share URL**: ${url}\n\n`;

    md += "## Purpose\n\n";
    md += "Graph analysis and architecture review\n\n";

    md += "## Current State\n\n";
    md += `- **Nodes**: ${stats.nodes}\n`;
    md += `- **Edges**: ${stats.edges}\n`;
    md += `- **Hubs** (degree ≥ ${hubThreshold}): ${hubs.length} nodes\n`;
    md += `- **Isolated Nodes**: ${isolatedCount} nodes\n\n`;

    md += "## Key Findings\n\n";
    md += `### Top 5 Hubs\n\n`;
    const topHubs = hubs.slice(0, 5);
    topHubs.forEach((h, i) => {
      md += `${i + 1}. **${h.label}** (degree: ${h.deg})\n`;
    });
    md += "\n";

    md += `### Isolated Nodes\n\n`;
    md += `- **Total**: ${isolatedCount} nodes\n`;
    if (isolated.length > 0) {
      md += `- **Top 5**: ${isolated.slice(0, 5).map(n => n.label).join(", ")}\n`;
    }
    md += "\n";

    md += "## Reproduction\n\n";
    md += `- **Share URL**: ${url}\n`;
    md += `- **Filters Applied**:\n`;
    md += `  - Directory: ${dirFilter || "(all)"}\n`;
    md += `  - Extension: ${extFilter || "(all)"}\n`;
    md += `  - Hide Isolated: ${hideIsolated}\n`;
    md += `  - Hub Threshold: ≥ ${hubThreshold}\n\n`;

    md += "## Next Actions\n\n";
    md += "- [ ] Review hub nodes for refactoring opportunities\n";
    md += "- [ ] Investigate isolated nodes for dead code\n";
    md += "- [ ] Consider architectural improvements based on clusters\n\n";

    md += "---\n";
    md += `*Generated by elicon-neural-map at ${timestamp}*\n`;

    return md;
  }

  function buildDevReport(): string {
    const timestamp = new Date().toISOString();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const schemaVersion = (graph as any)?.schemaVersion ?? "unknown";
    const stats = graph?.stats ?? { nodes: 0, edges: 0, clusters: 0, cycles: 0 };
    const { hubs, isolated, isolatedCount } = dashboard;

    // STEP05.21: Find active snapshot with normalized URL matching
    const normalizedUrl = normalizeUrl(url);
    const activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

    let md = "# Development Report\n\n";
    md += `**Generated**: ${timestamp}\n\n`;

    // STEP05.20: Add snapshot info if present
    if (activeSnap) {
      md += `**Snapshot**: ${activeSnap.name}\n`;
      md += `**Snapshot ID**: ${activeSnap.id}\n`;
      md += `**Snapshot Created**: ${activeSnap.createdAt}\n\n`;
    } else {
      md += `**Snapshot**: (none)\n\n`;
    }

    md += `**Share URL**: ${url}\n\n`;

    md += "## Graph Metadata\n\n";
    md += `- **Schema Version**: ${schemaVersion}\n`;
    md += `- **Nodes**: ${stats.nodes}\n`;
    md += `- **Edges**: ${stats.edges}\n`;
    md += `- **Clusters**: ${stats.clusters}\n`;
    md += `- **Cycles**: ${stats.cycles}\n`;
    md += "\n";

    md += "## Filter State\n\n";
    md += `- **Directory**: ${dirFilter || "(all)"}\n`;
    md += `- **Extension**: ${extFilter || "(all)"}\n`;
    md += `- **Hide Isolated**: ${hideIsolated}\n`;
    md += `- **Hub Threshold**: ≥ ${hubThreshold}\n`;
    md += `- **Safe Mode**: ${safeMode ? "ON" : "OFF"} (threshold: ${SAFE_THRESHOLD})\n`;
    md += "\n";

    md += "## Focus State\n\n";
    md += `- **Focus ID**: ${focusId || "(none)"}\n`;
    md += `- **Focus Only**: ${focusOnly}\n`;
    md += "\n";

    md += `## Top Hubs (${hubs.length})\n\n`;
    md += "| # | Node | Degree |\n";
    md += "|---|------|--------|\n";
    hubs.forEach((h, i) => {
      md += `| ${i + 1} | ${h.label} | ${h.deg} |\n`;
    });
    md += "\n";

    md += `## Isolated Nodes (${isolatedCount} total, showing top ${isolated.length})\n\n`;
    if (isolated.length > 0) {
      md += "| # | Node |\n";
      md += "|---|------|\n";
      isolated.forEach((n, i) => {
        md += `| ${i + 1} | ${n.label} |\n`;
      });
    } else {
      md += "(No isolated nodes)\n";
    }
    md += "\n";

    md += "---\n";
    md += `*Report generated by elicon-neural-map at ${timestamp}*\n`;

    return md;
  }

  // STEP05.23: Build GitHub Issue Markdown (Bug/Feature)
  function buildIssueMd(kind: "bug" | "feature"): string {
    const timestamp = new Date().toISOString();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const normalizedUrl = normalizeUrl(url);
    const activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

    let md = "";

    if (kind === "bug") {
      md += "## Bug Description\n\n";
      md += "[간단한 버그 설명]\n\n";
      md += "## Steps to Reproduce\n\n";
      md += "1. [단계 1]\n";
      md += "2. [단계 2]\n";
      md += "3. [단계 3]\n\n";
      md += "## Expected Behavior\n\n";
      md += "[예상 동작]\n\n";
      md += "## Actual Behavior\n\n";
      md += "[실제 동작]\n\n";
    } else {
      md += "## Feature Request\n\n";
      md += "[기능 설명]\n\n";
      md += "## User Story\n\n";
      md += "As a [사용자 유형], I want [기능] so that [목적].\n\n";
      md += "## Acceptance Criteria\n\n";
      md += "- [ ] [조건 1]\n";
      md += "- [ ] [조건 2]\n";
      md += "- [ ] [조건 3]\n\n";
    }

    md += "## Impact Checklist\n\n";
    md += "- [ ] Share/Invite funnel\n";
    md += "- [ ] Auth/Login flow\n";
    md += "- [ ] Billing/Subscription\n";
    md += "- [ ] i18n (EN/JA/KO/ZH)\n";
    md += "- [ ] Mobile UI\n";
    md += "- [ ] Performance\n\n";

    md += "## Snapshot Info\n\n";
    if (activeSnap) {
      md += `- **Name**: ${activeSnap.name}\n`;
      md += `- **ID**: ${activeSnap.id}\n`;
      md += `- **Created**: ${activeSnap.createdAt}\n`;
    } else {
      md += "- **Snapshot**: (none)\n";
    }
    md += `- **Share URL**: ${url}\n\n`;

    // Append Dev Report as collapsible details
    const devReport = buildDevReport();
    md += "<details>\n";
    md += "<summary>Dev Report</summary>\n\n";
    md += "```md\n";
    md += devReport;
    md += "\n```\n\n";
    md += "</details>\n\n";

    md += "---\n";
    md += `*Issue generated by elicon-neural-map at ${timestamp}*\n`;

    return md;
  }

  // STEP05.26: Build Issue Template (PM - for decision making)
  function buildIssuePM(): string {
    const timestamp = new Date().toISOString();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const normalizedUrl = normalizeUrl(url);
    const activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

    let md = "";

    // Header
    md += `# ${issueTitle || "Issue: [Please edit title]"}\n\n`;
    md += `**Generated**: ${timestamp}\n`;
    md += `**Target Repo**: ${issueRepo}\n\n`;

    // Package Info
    md += "## Package Info\n\n";
    if (lastPkgId && lastPkgUrl) {
      md += `- **Package ID**: ${lastPkgId}\n`;
      md += `- **Package URL**: ${lastPkgUrl}\n`;
    } else {
      md += "- **Package**: (not uploaded)\n";
    }
    md += "\n";

    // Snapshot Info
    md += "## Snapshot Info\n\n";
    if (activeSnap) {
      md += `- **Name**: ${activeSnap.name}\n`;
      md += `- **ID**: ${activeSnap.id}\n`;
      md += `- **Created**: ${activeSnap.createdAt}\n`;
    } else {
      md += "- **Snapshot**: (none)\n";
    }
    md += `- **Share URL**: ${url}\n\n`;

    // Filter/Focus State
    md += "## Current State\n\n";
    md += `- **Directory Filter**: ${dirFilter || "(all)"}\n`;
    md += `- **Extension Filter**: ${extFilter || "(all)"}\n`;
    md += `- **Hide Isolated**: ${hideIsolated}\n`;
    md += `- **Focus ID**: ${focusId || "(none)"}\n`;
    md += `- **Focus Only**: ${focusOnly}\n`;
    md += `- **Safe Mode**: ${safeMode ? "ON" : "OFF"}\n\n`;

    // PM Template Body
    md += "## Summary\n\n";
    md += "[간단한 이슈 설명 - PM 관점에서 무엇을 결정해야 하는가?]\n\n";

    md += "## User Impact\n\n";
    md += "- **Who**: [영향 받는 사용자 유형]\n";
    md += "- **What**: [어떤 영향을 받는가?]\n";
    md += "- **Severity**: [Critical / High / Medium / Low]\n\n";

    md += "## Acceptance Criteria\n\n";
    md += "- [ ] [조건 1]\n";
    md += "- [ ] [조건 2]\n";
    md += "- [ ] [조건 3]\n\n";

    md += "## Next Actions\n\n";
    md += "- [ ] [액션 1]\n";
    md += "- [ ] [액션 2]\n";
    md += "- [ ] [액션 3]\n\n";

    md += "---\n";
    md += `*PM Issue generated by elicon-neural-map at ${timestamp}*\n`;

    return md;
  }

  // STEP05.26: Build Issue Template (Dev - for debugging/reproduction)
  function buildIssueDev(): string {
    const timestamp = new Date().toISOString();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const normalizedUrl = normalizeUrl(url);
    const activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

    // Hubs and isolated nodes for debug hints (from dashboard)
    const { hubs, isolated } = dashboard;

    let md = "";

    // Header
    md += `# ${issueTitle || "Bug: [Please edit title]"}\n\n`;
    md += `**Generated**: ${timestamp}\n`;
    md += `**Target Repo**: ${issueRepo}\n\n`;

    // Package Info
    md += "## Package Info\n\n";
    if (lastPkgId && lastPkgUrl) {
      md += `- **Package ID**: ${lastPkgId}\n`;
      md += `- **Package URL**: ${lastPkgUrl}\n`;
    } else {
      md += "- **Package**: (not uploaded)\n";
    }
    md += "\n";

    // Snapshot Info
    md += "## Snapshot Info\n\n";
    if (activeSnap) {
      md += `- **Name**: ${activeSnap.name}\n`;
      md += `- **ID**: ${activeSnap.id}\n`;
      md += `- **Created**: ${activeSnap.createdAt}\n`;
    } else {
      md += "- **Snapshot**: (none)\n";
    }
    md += `- **Share URL**: ${url}\n\n`;

    // Filter/Focus State
    md += "## Current State\n\n";
    md += `- **Directory Filter**: ${dirFilter || "(all)"}\n`;
    md += `- **Extension Filter**: ${extFilter || "(all)"}\n`;
    md += `- **Hide Isolated**: ${hideIsolated}\n`;
    md += `- **Focus ID**: ${focusId || "(none)"}\n`;
    md += `- **Focus Only**: ${focusOnly}\n`;
    md += `- **Safe Mode**: ${safeMode ? "ON" : "OFF"}\n\n`;

    // Dev Template Body
    md += "## Reproduction Steps\n\n";
    md += "1. [단계 1]\n";
    md += "2. [단계 2]\n";
    md += "3. [단계 3]\n\n";

    md += "## Expected Behavior\n\n";
    md += "[예상 동작]\n\n";

    md += "## Actual Behavior\n\n";
    md += "[실제 동작]\n\n";

    md += "## Debug Hints\n\n";
    md += `- **Top Hubs**: ${hubs.length > 0 ? hubs.map((h) => h.label).join(", ") : "(none)"}\n`;
    md += `- **Isolated Nodes**: ${isolated.length > 0 ? isolated.map((n) => n.label).join(", ") : "(none)"}\n`;
    md += `- **Active Filters**: Dir=${dirFilter || "all"}, Ext=${extFilter || "all"}\n`;
    md += `- **Focus State**: ${focusId ? `Focused on ${focusId}` : "No focus"}\n\n`;

    md += "## Notes\n\n";
    md += "[추가 정보, 스크린샷, 로그 등]\n\n";

    md += "---\n";
    md += `*Dev Issue generated by elicon-neural-map at ${timestamp}*\n`;

    return md;
  }

  async function copyPMReport() {
    try {
      const md = buildPMReport();
      await navigator.clipboard.writeText(md);
      alert("PM Report copied to clipboard!");
    } catch (err) {
      alert("Failed to copy PM report: " + String(err));
    }
  }

  async function copyDevReport() {
    try {
      const md = buildDevReport();
      await navigator.clipboard.writeText(md);
      alert("Dev Report copied to clipboard!");
    } catch (err) {
      alert("Failed to copy Dev report: " + String(err));
    }
  }

  // STEP05.23: Copy Issue Markdown (Bug/Feature)
  async function copyIssue(kind: "bug" | "feature") {
    try {
      const md = buildIssueMd(kind);
      await navigator.clipboard.writeText(md);
      const label = kind === "bug" ? "Bug" : "Feature";
      setSnapMsg(`✅ ${label} issue copied to clipboard!`);
      setTimeout(() => setSnapMsg(""), 3000);
    } catch (err) {
      // Clipboard failed - show fallback textarea
      const md = buildIssueMd(kind);
      setIssueText(md);
      setShowIssueFallback(true);
      setSnapMsg("⚠️ Clipboard blocked - use fallback below");
      setTimeout(() => setSnapMsg(""), 5000);
    }
  }

  // STEP05.24: Open GitHub Issue with auto-snapshot
  async function openIssue(kind: "bug" | "feature") {
    try {
      // 1. Check if active snapshot exists
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const normalizedUrl = normalizeUrl(currentUrl);
      let activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

      // 2. Auto-save snapshot if none exists
      if (!activeSnap) {
        const autoName = `auto_${new Date().toISOString().slice(0, 16).replace("T", "_")}`;
        const newSnap: SavedSnap = {
          id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: autoName,
          url: currentUrl,
          createdAt: new Date().toISOString(),
        };
        const updated = [...savedSnaps, newSnap];
        setSavedSnaps(updated);
        persistSavedSnaps(updated);
        activeSnap = newSnap;
        setSnapMsg(`📸 Auto-saved: ${autoName}`);
        setTimeout(() => setSnapMsg(""), 3000);
      }

      // 3. Build and copy issue markdown
      const md = buildIssueMd(kind);
      await navigator.clipboard.writeText(md);

      // 4. Open GitHub issue page in new tab
      const title = kind === "bug" ? "[BUG] " : "[FEAT] ";
      const githubUrl = `https://github.com/${issueRepo}/issues/new?title=${encodeURIComponent(title)}`;
      window.open(githubUrl, "_blank");

      const label = kind === "bug" ? "Bug" : "Feature";
      setSnapMsg(`🚀 ${label} issue opened in GitHub!`);
      setTimeout(() => setSnapMsg(""), 3000);
    } catch (err) {
      // Clipboard failed - show fallback textarea
      const md = buildIssueMd(kind);
      setIssueText(md);
      setShowIssueFallback(true);
      setSnapMsg("⚠️ Clipboard blocked - use fallback below");
      setTimeout(() => setSnapMsg(""), 5000);

      // Still open GitHub even if clipboard failed
      const title = kind === "bug" ? "[BUG] " : "[FEAT] ";
      const githubUrl = `https://github.com/${issueRepo}/issues/new?title=${encodeURIComponent(title)}`;
      window.open(githubUrl, "_blank");
    }
  }

  // STEP05.26: Copy Issue Template (PM)
  async function copyIssuePM() {
    try {
      const md = buildIssuePM();
      await navigator.clipboard.writeText(md);
      setSnapMsg("✅ PM Issue template copied!");
      setTimeout(() => setSnapMsg(""), 3000);
    } catch (err) {
      // Clipboard failed - show fallback textarea
      const md = buildIssuePM();
      setSharePackageText(md);
      setShowSharePackageFallback(true);
      setSnapMsg("⚠️ Clipboard blocked - use fallback below");
      setTimeout(() => setSnapMsg(""), 5000);
    }
  }

  // STEP05.26: Copy Issue Template (Dev)
  async function copyIssueDev() {
    try {
      const md = buildIssueDev();
      await navigator.clipboard.writeText(md);
      setSnapMsg("✅ Dev Issue template copied!");
      setTimeout(() => setSnapMsg(""), 3000);
    } catch (err) {
      // Clipboard failed - show fallback textarea
      const md = buildIssueDev();
      setSharePackageText(md);
      setShowSharePackageFallback(true);
      setSnapMsg("⚠️ Clipboard blocked - use fallback below");
      setTimeout(() => setSnapMsg(""), 5000);
    }
  }

  // STEP05.27/05.28: Create GitHub Issue (PM or Dev) with Preflight Guards
  async function createGithubIssue(kind: "pm" | "dev") {
    try {
      // STEP05.28.1: Always Auto-Save Snapshot (강제)
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const normalizedUrl = normalizeUrl(currentUrl);
      let activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

      if (!activeSnap) {
        const autoName = `Auto_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "_")}`;
        const newSnap: SavedSnap = {
          id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: autoName,
          url: currentUrl,
          createdAt: new Date().toISOString(),
        };

        const updated = [newSnap, ...savedSnaps].slice(0, SNAP_STORE_LIMIT);
        persistSavedSnaps(updated);
        setSavedSnaps(updated);
        activeSnap = newSnap;

        setSnapMsg(`📸 Auto-saved snapshot: ${autoName}`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // 1. Validate inputs
      if (!targetRepo) {
        setSnapMsg("❌ ERROR: Target Repo required");
        setTimeout(() => setSnapMsg(""), 5000);
        return;
      }

      if (!ghToken) {
        setSnapMsg("❌ ERROR: GitHub Token required");
        setTimeout(() => setSnapMsg(""), 5000);
        return;
      }

      // STEP05.28.2: Preflight - GitHub Token Check
      setSnapMsg("🔍 Verifying GitHub Token...");
      try {
        const tokenCheckResponse = await fetch("https://api.github.com/user", {
          headers: {
            "Authorization": `Bearer ${ghToken}`,
            "Accept": "application/vnd.github+json",
          },
        });

        if (!tokenCheckResponse.ok) {
          throw new Error(
            tokenCheckResponse.status === 401
              ? "Token invalid/expired. Check scope: repo required"
              : `Token check failed: ${tokenCheckResponse.status}`
          );
        }
      } catch (err: any) {
        setSnapMsg(`❌ ERROR: ${err?.message ?? "Token verification failed"}`);
        setTimeout(() => setSnapMsg(""), 7000);
        return;
      }

      // STEP05.28.3: Preflight - Share Package Upload (Best Effort)
      let packageUploadSuccess = false;
      if (autoCreateIssue) {
        setSnapMsg("📦 Uploading Share Package...");
        try {
          await createSharePackage(kind);
          await new Promise((resolve) => setTimeout(resolve, 500));
          packageUploadSuccess = !!(lastPkgId && lastPkgUrl);
        } catch (err) {
          // Upload failed - continue with issue creation
          packageUploadSuccess = false;
        }

        if (!packageUploadSuccess) {
          setSnapMsg("⚠️ Package upload failed - Issue will still be created");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // 3. Build issue body
      const body = kind === "pm" ? buildIssuePM() : buildIssueDev();
      const title = issueTitle || `[${kind.toUpperCase()}] ${new Date().toISOString().slice(0, 10)}`;

      // 4. Build labels array (pm or dev + optional labels)
      const labels = [kind, ...issueLabels];

      // 5. POST to GitHub API
      setSnapMsg("🚀 Creating GitHub Issue...");
      const apiUrl = `https://api.github.com/repos/${targetRepo}/issues`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ghToken}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          labels,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `GitHub API error: ${response.status}`);
      }

      const issueData = await response.json();
      const issueUrl = issueData.html_url;

      // 6. Save issue URL to state
      setLastIssueUrl(issueUrl);

      // STEP05.29: Backlink issueUrl to existing package metadata
      if (lastPkgId && shareUploadToken) {
        try {
          setSnapMsg("🔗 Linking Issue URL to Package...");
          await fetch("/api/share-packages", {
            method: "PATCH",
            headers: {
              "x-share-token": shareUploadToken,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              id: lastPkgId,
              issueUrl,
              targetRepo,
              issueTitle: title,
            }),
          });
        } catch (patchErr) {
          // Non-blocking: Package metadata update failed but issue created successfully
          console.warn("Package metadata update failed:", patchErr);
        }
      }

      // STEP05.29: Prepare clipboard text with Issue URL header
      const clipboardText = `**Issue URL**: ${issueUrl}\n\n${issueUrl}`;

      // STEP05.28.4: Clipboard Failure UX - Auto-open fallback with select()
      try {
        await navigator.clipboard.writeText(clipboardText);
        setSnapMsg(`✅ Issue created! URL copied to clipboard`);
        setTimeout(() => setSnapMsg(""), 5000);
      } catch {
        // Clipboard failed - auto-open fallback textarea with select()
        setIssueText(clipboardText);
        setShowIssueFallback(true);
        setSnapMsg(`✅ Issue created! (Clipboard blocked - auto-selected below)`);
        setTimeout(() => setSnapMsg(""), 5000);

        // Auto-select the textarea content after a brief delay
        setTimeout(() => {
          const textarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
            textarea.select();
          }
        }, 100);
      }

      // 8. Optionally open issue in new tab
      window.open(issueUrl, "_blank");
    } catch (err: any) {
      setSnapMsg(`❌ ERROR: ${err?.message ?? String(err)}`);
      setTimeout(() => setSnapMsg(""), 7000);
    }
  }

  // STEP05.23: Download Share Package (unified PM/Dev with snapshot name)
  // Policy: Auto-save snapshot ONLY if no active snapshot exists
  function downloadSharePackage(kind: "pm" | "dev") {
    try {
      // 1. Check if active snapshot exists
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const normalizedUrl = normalizeUrl(currentUrl);
      let activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

      // 2. If no active snapshot, auto-save one
      if (!activeSnap) {
        const autoName = `Auto_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "_")}`;
        const newSnap: SavedSnap = {
          id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: autoName,
          url: currentUrl,
          createdAt: new Date().toISOString(),
        };

        const updated = [newSnap, ...savedSnaps].slice(0, SNAP_STORE_LIMIT);
        persistSavedSnaps(updated);
        setSavedSnaps(updated);
        activeSnap = newSnap;

        setSnapMsg(`AUTO-SAVED: "${autoName}"`);
        setTimeout(() => setSnapMsg(""), 3000);
      }

      // 3. Generate report based on kind
      const md = kind === "pm" ? buildPMReport() : buildDevReport();
      const label = kind === "pm" ? "PM" : "DEV";

      // 4. Download as file with snapshot name
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const fileName = `${activeSnap.name}_${label}_${timestamp}.md`;

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnapMsg(`✅ Downloaded: ${fileName}`);
      setTimeout(() => setSnapMsg(""), 3000);
    } catch (err) {
      setSnapMsg("ERROR: " + String(err));
      setTimeout(() => setSnapMsg(""), 5000);
    }
  }

  // STEP05.22/05.25: Create Share Package (unified PM/Dev with optional server upload)
  // Policy: Auto-save snapshot ONLY if no active snapshot exists
  async function createSharePackage(kind: "pm" | "dev") {
    try {
      // 1. Check if active snapshot exists
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const normalizedUrl = normalizeUrl(currentUrl);
      let activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

      // 2. If no active snapshot, auto-save one
      if (!activeSnap) {
        const autoName = `Auto_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "_")}`;
        const newSnap: SavedSnap = {
          id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: autoName,
          url: currentUrl,
          createdAt: new Date().toISOString(),
        };

        const updated = [newSnap, ...savedSnaps].slice(0, SNAP_STORE_LIMIT);
        persistSavedSnaps(updated);
        setSavedSnaps(updated);
        activeSnap = newSnap;

        setSnapMsg(`AUTO-SAVED: "${autoName}"`);
        setTimeout(() => setSnapMsg(""), 3000);
      }

      // 3. Generate report based on kind
      let md = kind === "pm" ? buildPMReport() : buildDevReport();
      const label = kind === "pm" ? "PM" : "Dev";

      // 4. STEP05.25: Upload to server if autoUpload is enabled
      if (autoUpload && shareUploadToken) {
        try {
          const uploadResponse = await fetch("/api/share-packages", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-share-token": shareUploadToken,
            },
            body: JSON.stringify({
              kind,
              reportMd: md,
              snapshot: activeSnap,
              normalizedUrl,
              createdAt: new Date().toISOString(),
            }),
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
          }

          const uploadData = await uploadResponse.json();
          if (uploadData.ok && uploadData.id && uploadData.url) {
            // Prepend Package ID and URL to markdown
            const packageHeader = `**Package ID**: ${uploadData.id}\n**Package URL**: ${uploadData.url}\n\n---\n\n`;
            md = packageHeader + md;
            setSnapMsg(`📦 ${label} Package uploaded! ID: ${uploadData.id}`);

            // STEP05.26: Save Package ID/URL to state for Issue Template
            setLastPkgId(uploadData.id);
            setLastPkgUrl(uploadData.url);
          }
        } catch (uploadErr) {
          setSnapMsg(`⚠️ Upload failed: ${String(uploadErr)}`);
          setTimeout(() => setSnapMsg(""), 5000);
          // Continue with local copy even if upload fails
        }
      }

      // 5. Try clipboard copy
      try {
        await navigator.clipboard.writeText(md);
        if (!autoUpload || !shareUploadToken) {
          setSnapMsg(`✅ ${label} Share Package copied!`);
        }
        setTimeout(() => setSnapMsg(""), 3000);
      } catch (clipErr) {
        // 6. Fallback: show textarea
        setSharePackageText(md);
        setShowSharePackageFallback(true);
        setSnapMsg("⚠️ Clipboard blocked - use fallback below");
        setTimeout(() => setSnapMsg(""), 5000);
      }
    } catch (err) {
      setSnapMsg("ERROR: " + String(err));
      setTimeout(() => setSnapMsg(""), 5000);
    }
  }

  // STEP05.11: Server snapshot functions
  async function serverList(token: string) {
    const r = await fetch("/api/snapshots", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`LIST_FAILED_${r.status}`);
    return (await r.json()) as any;
  }

  async function serverSave(token: string, payload: { id: string; name: string; url: string; createdAt: string }) {
    const r = await fetch("/api/snapshots", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`SAVE_FAILED_${r.status}`);
    return (await r.json()) as any;
  }

  async function serverDelete(token: string, id: string) {
    const r = await fetch(`/api/snapshots?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`DEL_FAILED_${r.status}`);
    return (await r.json()) as any;
  }

  useEffect(() => {
    (async () => {
      const r = await fetch("/graph.json", { cache: "no-store" });
      const g = (await r.json()) as Graph;
      setGraph(g);
    })();
  }, []);

  // STEP05.16: Auto-calculate safe mode based on node count
  useEffect(() => {
    if (graph && graph.nodes) {
      setSafeMode(graph.nodes.length > SAFE_THRESHOLD);
    }
  }, [graph]);

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

  // STEP05.17: Search logic - find matching nodes
  useEffect(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setActiveIdx(0);
      return;
    }

    // Search in focusFiltered.nodes (respects current filters)
    const matches = focusFiltered.nodes.filter((n: any) => {
      const id = (n.id || "").toLowerCase();
      const path = (n.path || "").toLowerCase();
      const label = (n.label || "").toLowerCase();
      const name = (n.name || "").toLowerCase();
      return id.includes(q) || path.includes(q) || label.includes(q) || name.includes(q);
    }).map((n: any) => n.id);

    setSearchResults(matches);
    setActiveIdx(0); // Reset to first result
  }, [searchQ, focusFiltered]);

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

    // STEP05.16: Safe mode layout based on node count
    const nodeCount = cy.nodes().length;
    const layoutOptions: any = {
      name: "fcose",
      fit: true,
      padding: 40,
      animate: !safeMode && nodeCount < 100, // Disable animation in safe mode or large graphs
      randomize: false,
      // STEP05.16: Safe mode uses minimal iterations to prevent freezing
      quality: safeMode ? "draft" : (nodeCount < 100 ? "default" : "draft"),
      numIter: safeMode ? 0 : (nodeCount < 100 ? 2500 : nodeCount < 500 ? 1500 : 1000),
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
  }, [elements, safeMode]);

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

        {/* STEP05.16: Safe mode toggle */}
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
          <input
            type="checkbox"
            checked={safeMode}
            onChange={(e) => setSafeMode(e.target.checked)}
          />
          safe mode
        </label>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          nodes: {graph?.nodes.length ?? 0}
        </div>

        {/* STEP05.17: Search + Jump */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 16, paddingLeft: 16, borderLeft: "1px solid #334155" }}>
          <input
            type="text"
            placeholder="Search node…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) {
                  handlePrev();
                } else {
                  handleNext();
                }
              } else if (e.key === "Escape") {
                clearSearch();
              }
            }}
            style={{
              padding: "4px 8px",
              background: "#0f172a",
              color: "#e5e7eb",
              border: "1px solid #263041",
              borderRadius: 8,
              fontSize: 12,
              width: 150,
            }}
          />
          {searchResults.length > 0 && (
            <>
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                {searchResults.length} results ({activeIdx + 1}/{searchResults.length})
              </span>
              <button
                onClick={handlePrev}
                disabled={searchResults.length === 0}
                style={{
                  padding: "4px 8px",
                  background: searchResults.length === 0 ? "#1e293b" : "#334155",
                  color: searchResults.length === 0 ? "#64748b" : "#e5e7eb",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: searchResults.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Prev
              </button>
              <button
                onClick={handleNext}
                disabled={searchResults.length === 0}
                style={{
                  padding: "4px 8px",
                  background: searchResults.length === 0 ? "#1e293b" : "#334155",
                  color: searchResults.length === 0 ? "#64748b" : "#e5e7eb",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: searchResults.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
              <button
                onClick={handleJump}
                disabled={searchResults.length === 0}
                style={{
                  padding: "4px 8px",
                  background: searchResults.length === 0 ? "#1e293b" : "#3b82f6",
                  color: searchResults.length === 0 ? "#64748b" : "#fff",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: searchResults.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Jump
              </button>
            </>
          )}
        </div>

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
      <div style={{ height: "calc(100vh - 54px)", display: "flex", overflow: "hidden" }}>
        {/* Left Tree */}
        <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid #1f2937", overflow: "auto", padding: 10 }}>
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
        <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid #1f2937", position: "relative" }}>
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

        {/* STEP05.20.2: Responsive Right Panel */}
        {!isNarrow && (
          <div style={{ width: 420, flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
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

          {/* STEP05.19: Export Report (PM/Dev Templates) */}
          <div style={{ padding: 10, borderBottom: "1px solid #1f2937" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Export Report</div>
              {(() => {
                // STEP05.21: Show active snapshot badge in Export Report header
                const currentUrl = typeof window !== "undefined" ? window.location.href : "";
                const normalizedUrl = normalizeUrl(currentUrl);
                const activeSnap = savedSnaps.find((s) => normalizeUrl(s.url) === normalizedUrl);

                return activeSnap ? (
                  <div
                    style={{
                      padding: "2px 6px",
                      background: "#3b82f6",
                      color: "#fff",
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activeSnap.name}
                  </div>
                ) : null;
              })()}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button
                onClick={copyPMReport}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Copy PM
              </button>
              <button
                onClick={copyDevReport}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#8b5cf6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Copy Dev
              </button>
              <button
                onClick={() => downloadSharePackage("pm")}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Download PM
              </button>
              <button
                onClick={() => downloadSharePackage("dev")}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#0891b2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Download Dev
              </button>
            </div>

            {/* STEP05.22: Create Share Package Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              <button
                onClick={() => createSharePackage("pm")}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                📦 Share PM
              </button>
              <button
                onClick={() => createSharePackage("dev")}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#ec4899",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                📦 Share Dev
              </button>
            </div>

            {/* STEP05.25: Share Upload Settings */}
            <div style={{ marginTop: 10, borderTop: "1px solid #1f2937", paddingTop: 10 }}>
              <div style={{ fontSize: 10, marginBottom: 6, color: "#9ca3af" }}>
                Share Upload Token:
              </div>
              <input
                type="password"
                value={shareUploadToken}
                onChange={(e) => setShareUploadToken(e.target.value)}
                placeholder="Enter upload token"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  border: "1px solid #263041",
                  borderRadius: 4,
                  fontSize: 10,
                  marginBottom: 8,
                }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={autoUpload}
                  onChange={(e) => setAutoUpload(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Auto Upload Share Packages
              </label>
            </div>

            {/* STEP05.23: Issue Composer Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              <button
                onClick={() => copyIssue("bug")}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                🐛 Copy Issue (Bug)
              </button>
              <button
                onClick={() => copyIssue("feature")}
                style={{
                  flex: "1 1 160px",
                  padding: "6px 12px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ✨ Copy Issue (Feature)
              </button>
            </div>

            {/* STEP05.24: Target Repo & Open Issue Buttons */}
            <div style={{ marginTop: 10, borderTop: "1px solid #1f2937", paddingTop: 10 }}>
              <div style={{ fontSize: 10, marginBottom: 6, color: "#9ca3af" }}>
                Target Repo (owner/repo):
              </div>
              <input
                type="text"
                value={issueRepo}
                onChange={(e) => setIssueRepo(e.target.value)}
                placeholder="ajong3287/elicon-neural-map"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  background: "#0f172a",
                  color: "#e5e7eb",
                  border: "1px solid #263041",
                  borderRadius: 8,
                  fontSize: 11,
                  marginBottom: 8,
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <button
                  onClick={() => openIssue("bug")}
                  style={{
                    flex: "1 1 160px",
                    padding: "6px 12px",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  🚀 Open Issue (Bug)
                </button>
                <button
                  onClick={() => openIssue("feature")}
                  style={{
                    flex: "1 1 160px",
                    padding: "6px 12px",
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  🚀 Open Issue (Feature)
                </button>
              </div>
            </div>

            {/* STEP05.26: Issue Template Copy */}
            <div style={{ marginTop: 10, borderTop: "1px solid #1f2937", paddingTop: 10 }}>
              <div style={{ fontSize: 10, marginBottom: 6, color: "#9ca3af" }}>
                Issue Title (optional):
              </div>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Bug: ... or Feature: ..."
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  border: "1px solid #263041",
                  borderRadius: 4,
                  fontSize: 10,
                  marginBottom: 8,
                }}
              />
              {lastPkgId && lastPkgUrl && (
                <div
                  style={{
                    fontSize: 9,
                    color: "#10b981",
                    marginBottom: 6,
                    padding: "4px 6px",
                    background: "rgba(16, 185, 129, 0.1)",
                    borderRadius: 4,
                  }}
                >
                  Last Package: {lastPkgId}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <button
                  onClick={copyIssuePM}
                  style={{
                    flex: "1 1 160px",
                    padding: "6px 12px",
                    background: "#f59e0b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  📋 Copy Issue (PM)
                </button>
                <button
                  onClick={copyIssueDev}
                  style={{
                    flex: "1 1 160px",
                    padding: "6px 12px",
                    background: "#8b5cf6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  📋 Copy Issue (Dev)
                </button>
              </div>
            </div>

            {/* STEP05.30: Stats Dashboard */}
            {stats && (
              <div style={{ marginTop: 10, borderTop: "1px solid #1f2937", paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
                  📊 02→50 운영 통계
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div style={{ background: "#1e293b", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>Total Packages</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa" }}>{stats.totalPackages}</div>
                  </div>
                  <div style={{ background: "#1e293b", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>Issues Created</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#34d399" }}>{stats.totalIssues}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>Link Completion Rate</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${stats.linkCompletionRate}%`,
                          height: "100%",
                          background: stats.linkCompletionRate >= 90 ? "#34d399" : stats.linkCompletionRate >= 70 ? "#fbbf24" : "#f87171",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", minWidth: 40 }}>
                      {stats.linkCompletionRate}%
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, background: "#1e293b", padding: 6, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>PM</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f472b6" }}>{stats.byKind.pm}</div>
                  </div>
                  <div style={{ flex: 1, background: "#1e293b", padding: 6, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>Dev</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>{stats.byKind.dev}</div>
                  </div>
                </div>

                {Object.keys(stats.byTargetRepo).length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>Top Target Repos</div>
                    <div style={{ fontSize: 9, color: "#cbd5e1", lineHeight: 1.5 }}>
                      {Object.entries(stats.byTargetRepo)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([repo, count]) => (
                          <div key={repo} style={{ marginBottom: 2 }}>
                            • {repo}: <span style={{ color: "#60a5fa", fontWeight: 600 }}>{count as number}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Settings Toggle */}
            <div style={{ marginTop: 10, borderTop: "1px solid #1f2937", paddingTop: 10 }}>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: showAdvanced ? "#1e293b" : "#0f172a",
                  color: "#9ca3af",
                  border: "1px solid #263041",
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>⚙️ Advanced: Issue Auto-Create</span>
                <span>{showAdvanced ? "▼" : "▶"}</span>
              </button>
            </div>

            {/* STEP05.27: GitHub Issue Auto-Create (Advanced) */}
            {showAdvanced && (
              <div style={{ marginTop: 10, borderTop: "1px solid #1f2937", paddingTop: 10 }}>
                <div style={{ fontSize: 10, marginBottom: 6, color: "#9ca3af" }}>
                  Target Repo:
              </div>
              <input
                type="text"
                value={targetRepo}
                onChange={(e) => setTargetRepo(e.target.value)}
                placeholder="owner/repo (e.g., ajong3287/50_퀴즈도전개발)"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  border: "1px solid #263041",
                  borderRadius: 4,
                  fontSize: 10,
                  marginBottom: 8,
                }}
              />

              <div style={{ fontSize: 10, marginBottom: 6, color: "#9ca3af" }}>
                GitHub Token (repo scope):
              </div>
              <input
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="ghp_..."
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  border: "1px solid #263041",
                  borderRadius: 4,
                  fontSize: 10,
                  marginBottom: 8,
                }}
              />

              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#9ca3af", cursor: "pointer", marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={autoCreateIssue}
                  onChange={(e) => setAutoCreateIssue(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Auto Create Issue (upload Package first)
              </label>

              <div style={{ fontSize: 9, color: "#6b7280", marginBottom: 8, lineHeight: 1.4 }}>
                ℹ️ Token needs "repo" scope. Get token at{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Neural%20Map%20Issue%20Creator"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#60a5fa", textDecoration: "underline" }}
                >
                  GitHub Settings
                </a>
              </div>

              <div style={{ fontSize: 10, marginBottom: 6, color: "#9ca3af" }}>
                Labels (optional):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {["bug", "enhancement", "blocked"].map((label) => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#9ca3af", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={issueLabels.includes(label)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIssueLabels([...issueLabels, label]);
                        } else {
                          setIssueLabels(issueLabels.filter((l) => l !== label));
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {lastIssueUrl && (
                <a
                  href={lastIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    fontSize: 9,
                    color: "#10b981",
                    marginBottom: 6,
                    padding: "4px 6px",
                    background: "rgba(16, 185, 129, 0.1)",
                    borderRadius: 4,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  Last Issue: {lastIssueUrl}
                </a>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <button
                  onClick={() => createGithubIssue("pm")}
                  style={{
                    flex: "1 1 160px",
                    padding: "6px 12px",
                    background: "#f59e0b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  🚀 Create Issue (PM)
                </button>
                <button
                  onClick={() => createGithubIssue("dev")}
                  style={{
                    flex: "1 1 160px",
                    padding: "6px 12px",
                    background: "#8b5cf6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  🚀 Create Issue (Dev)
                </button>
              </div>
            </div>
            )}

            {/* STEP05.22: Fallback Textarea (shown when clipboard fails) */}
            {showSharePackageFallback && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, marginBottom: 4, color: "#fbbf24" }}>
                  Clipboard blocked - Select All (Cmd+A) and Copy (Cmd+C):
                </div>
                <textarea
                  value={sharePackageText}
                  readOnly
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.select();
                  }}
                  style={{
                    width: "100%",
                    height: 120,
                    padding: "6px 8px",
                    background: "#0f172a",
                    color: "#e5e7eb",
                    border: "1px solid #f59e0b",
                    borderRadius: 8,
                    fontSize: 10,
                    fontFamily: "monospace",
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={() => {
                    setShowSharePackageFallback(false);
                    setSharePackageText("");
                  }}
                  style={{
                    marginTop: 6,
                    padding: "4px 10px",
                    background: "#374151",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {/* STEP05.23: Issue Fallback Textarea (shown when clipboard fails) */}
            {showIssueFallback && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, marginBottom: 4, color: "#fbbf24" }}>
                  Clipboard blocked - Select All (Cmd+A) and Copy (Cmd+C):
                </div>
                <textarea
                  value={issueText}
                  readOnly
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.select();
                  }}
                  style={{
                    width: "100%",
                    height: 200,
                    padding: "6px 8px",
                    background: "#0f172a",
                    color: "#e5e7eb",
                    border: "1px solid #dc2626",
                    borderRadius: 8,
                    fontSize: 10,
                    fontFamily: "monospace",
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={() => {
                    setShowIssueFallback(false);
                    setIssueText("");
                  }}
                  style={{
                    marginTop: 6,
                    padding: "4px 10px",
                    background: "#374151",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            )}
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

            {/* STEP05.11: Server snapshot controls */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
              <input
                type="password"
                value={uploadToken}
                onChange={(e) => setUploadToken(e.target.value)}
                placeholder="토큰"
                style={{
                  width: 100,
                  padding: "6px 8px",
                  background: "#0f172a",
                  color: "#e5e7eb",
                  border: "1px solid #263041",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <button
                onClick={async () => {
                  if (!uploadToken) {
                    setSnapMsg("ERROR: 토큰 필요");
                    setTimeout(() => setSnapMsg(""), 3000);
                    return;
                  }
                  try {
                    const currentSnap = savedSnaps[0];
                    if (!currentSnap) {
                      setSnapMsg("ERROR: 저장할 스냅샷 없음");
                      setTimeout(() => setSnapMsg(""), 3000);
                      return;
                    }
                    const res = await serverSave(uploadToken, currentSnap);
                    setSnapMsg(`SERVER_SAVED: ${res.count}개`);
                    setTimeout(() => setSnapMsg(""), 3000);
                  } catch (e: any) {
                    setSnapMsg(`ERROR: ${e.message}`);
                    setTimeout(() => setSnapMsg(""), 3000);
                  }
                }}
                style={{
                  padding: "6px 12px",
                  background: "#dc2626",
                  color: "#e5e7eb",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                서버로 저장
              </button>
              <button
                onClick={async () => {
                  if (!uploadToken) {
                    setSnapMsg("ERROR: 토큰 필요");
                    setTimeout(() => setSnapMsg(""), 3000);
                    return;
                  }
                  try {
                    const res = await serverList(uploadToken);
                    const items = res.items || [];
                    setSavedSnaps(items);
                    persistSavedSnaps(items);
                    setSnapMsg(`SERVER_LOADED: ${items.length}개`);
                    setTimeout(() => setSnapMsg(""), 3000);
                  } catch (e: any) {
                    setSnapMsg(`ERROR: ${e.message}`);
                    setTimeout(() => setSnapMsg(""), 3000);
                  }
                }}
                style={{
                  padding: "6px 12px",
                  background: "#059669",
                  color: "#e5e7eb",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                서버에서 불러오기
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
                savedSnaps.map((snap) => {
                  // STEP05.21: Check if this snapshot is active (matches current URL)
                  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
                  const isActive = normalizeUrl(snap.url) === normalizeUrl(currentUrl);

                  return (
                    <div
                      key={snap.id}
                      style={{
                        padding: "6px 8px",
                        marginBottom: 4,
                        background: isActive ? "#1e40af15" : "#0f172a",
                        border: isActive ? "1px solid #3b82f6" : "1px solid #263041",
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div
                          style={{
                            flex: 1,
                            fontWeight: 600,
                            color: "#cbd5e1",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {snap.name}
                        </div>
                        {isActive && (
                          <div
                            style={{
                              padding: "2px 6px",
                              background: "#3b82f6",
                              color: "#fff",
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            활성
                          </div>
                        )}
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
                  );
                })
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
        )}

        {/* STEP05.20.2: Narrow screen drawer */}
        {isNarrow && (
          <>
            <button
              onClick={() => setRightOpen(true)}
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                zIndex: 50,
                padding: "8px 12px",
                borderRadius: 10,
                background: "#111827",
                color: "#e5e7eb",
                border: "1px solid #374151",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Panel ▸
            </button>

            {rightOpen && (
              <>
                <div
                  onClick={() => setRightOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.55)",
                    zIndex: 60,
                  }}
                />
                <div
                  style={{
                    position: "fixed",
                    right: 0,
                    top: 0,
                    height: "100vh",
                    width: "min(92vw, 420px)",
                    zIndex: 70,
                    background: "#0b1220",
                    borderLeft: "1px solid #1f2937",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ padding: 10, borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Panel</div>
                    <button
                      onClick={() => setRightOpen(false)}
                      style={{
                        padding: "4px 8px",
                        background: "transparent",
                        color: "#e5e7eb",
                        border: "1px solid #374151",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Dashboard */}
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
                    </div>

                    {/* Continue with rest of dashboard content... */}
                  </div>

                  {/* Inspector */}
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
