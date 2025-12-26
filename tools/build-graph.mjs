#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { parse } from "@babel/parser";
import traverseImport from "@babel/traverse";
import dotenv from "dotenv";
import { pageRank, tarjanSCC, markCycleEdges } from "./lib/graph-metrics.mjs";

dotenv.config({ path: ".env.local" });

const traverse = (traverseImport && (traverseImport.default ?? traverseImport)) || traverseImport;

const argv = yargs(hideBin(process.argv))
  .option("root", { type: "string", describe: "Root directory to scan" })
  .option("out", { type: "string", default: "./public/graph.json" })
  .option("ext", { type: "string", default: "js,jsx,ts,tsx,md" })
  .parseSync();

const ROOT = path.resolve(argv.root || process.env.MAP_ROOT || ".");
const OUT = path.resolve(argv.out);
const exts = new Set(argv.ext.split(",").map(s => s.trim()).filter(Boolean));

const JS_EXTS = new Set(["js","jsx","ts","tsx","mjs","cjs"]);
const MD_EXTS = new Set(["md"]);

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}
function isInsideRoot(p) {
  const rp = path.resolve(p);
  return rp === ROOT || rp.startsWith(ROOT + path.sep);
}
async function fileExists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

async function resolveImport(fromAbs, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromAbs), spec);

  const candidates = [];
  if (path.extname(base)) candidates.push(base);

  for (const e of ["ts","tsx","js","jsx","mjs","cjs"]) candidates.push(base + "." + e);
  for (const e of ["ts","tsx","js","jsx","mjs","cjs"]) candidates.push(path.join(base, "index." + e));

  for (const c of candidates) {
    if (!isInsideRoot(c)) continue;
    if (await fileExists(c)) return c;
  }
  return null;
}

function parseMdLinks(text) {
  const out = [];
  const wiki = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = wiki.exec(text))) {
    const raw = m[1];
    const main = raw.split("|")[0].split("#")[0].trim();
    if (main) out.push({ type: "wikilink", target: main });
  }
  const md = /\[[^\]]*\]\(([^)]+)\)/g;
  while ((m = md.exec(text))) {
    const raw = m[1].split("#")[0].trim();
    if (raw && !raw.startsWith("http")) out.push({ type: "mdlink", target: raw });
  }
  return out;
}

async function main() {
  const patterns = [];
  for (const e of exts) patterns.push(`**/*.${e}`);

  const ignore = [
    "**/node_modules/**",
    "**/.next/**",
    "**/.git/**",
    "**/.obsidian/**",
    "**/dist/**",
    "**/build/**",
    "**/out/**",
    "**/coverage/**",
  ];

  const absFiles = (await fg(patterns, { cwd: ROOT, absolute: true, ignore })).sort();

  const basenameIndex = new Map();
  for (const f of absFiles) {
    const base = path.basename(f, path.extname(f));
    const arr = basenameIndex.get(base) ?? [];
    arr.push(f);
    basenameIndex.set(base, arr);
  }

  const nodes = [];
  const nodeSet = new Set();
  const edges = [];
  const unresolved = [];

  function addNode(absPath) {
    const id = rel(absPath);
    if (nodeSet.has(id)) return id;
    nodeSet.add(id);
    nodes.push({
      id,
      label: path.basename(absPath),
      ext: path.extname(absPath).replace(".", "").toLowerCase(),
      path: id,
    });
    return id;
  }

  for (const f of absFiles) addNode(f);

  for (const from of absFiles) {
    const ext = path.extname(from).replace(".", "").toLowerCase();
    const fromId = rel(from);

    if (JS_EXTS.has(ext)) {
      let code;
      try { code = await fs.readFile(from, "utf-8"); } catch { continue; }

      let ast;
      try {
        ast = parse(code, {
          sourceType: "unambiguous",
          plugins: ["jsx", "typescript", "dynamicImport"],
        });
      } catch {
        continue;
      }

      const imports = [];
      try {
        traverse(ast, {
          ImportDeclaration(p) {
            const spec = p.node.source?.value;
            if (typeof spec === "string") imports.push(spec);
          },
          CallExpression(p) {
            const callee = p.node.callee;
            if (callee?.type === "Identifier" && callee.name === "require") {
              const arg = p.node.arguments?.[0];
              if (arg?.type === "StringLiteral") imports.push(arg.value);
            }
          },
        });
      } catch {
        // traverse 실패해도 빌드 전체는 계속
      }

      for (const spec of imports) {
        const toAbs = await resolveImport(from, spec);
        if (!toAbs) continue;
        const toId = addNode(toAbs);
        edges.push({ source: fromId, target: toId, type: "import" });
      }
    }

    if (MD_EXTS.has(ext)) {
      let text;
      try { text = await fs.readFile(from, "utf-8"); } catch { continue; }
      const links = parseMdLinks(text);

      for (const l of links) {
        let toAbs = null;

        if (l.type === "wikilink") {
          const hits = basenameIndex.get(l.target);
          if (hits?.length) toAbs = hits[0];
          else {
            const guess = path.resolve(ROOT, l.target + ".md");
            if (await fileExists(guess)) toAbs = guess;
          }
        } else {
          const guess = path.resolve(path.dirname(from), l.target);
          if (await fileExists(guess) && isInsideRoot(guess)) toAbs = guess;
          else {
            const guess2 = path.resolve(path.dirname(from), l.target + ".md");
            if (await fileExists(guess2) && isInsideRoot(guess2)) toAbs = guess2;
          }
        }

        if (toAbs) {
          const toId = addNode(toAbs);
          edges.push({ source: fromId, target: toId, type: l.type });
        } else {
          unresolved.push({ from: fromId, target: l.target, type: l.type });
        }
      }
    }
  }

  const degree = new Map();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  for (const n of nodes) n.degree = degree.get(n.id) ?? 0;

  // v0.1.3: clusters, score, cycles
  const CLUSTER_DEPTH = Number(process.env.CLUSTER_DEPTH || "2");

  function clusterKey(filePath) {
    const rel = ROOT ? path.relative(ROOT, filePath) : filePath;
    const parts = rel.split(path.sep).filter(Boolean);
    const key = parts.slice(0, Math.min(CLUSTER_DEPTH, Math.max(1, parts.length - 1))).join("/");
    return key || "(root)";
  }

  const clustersMap = new Map();
  for (const n of nodes) {
    const key = clusterKey(n.path || n.label || "");
    if (!clustersMap.has(key)) {
      clustersMap.set(key, { id: `cluster:${key}`, label: key, nodeIds: [] });
    }
    clustersMap.get(key).nodeIds.push(n.id);
  }
  const clusters = Array.from(clustersMap.values());

  // importance score (PageRank normalized 0..1)
  const pr = pageRank(nodes, edges, { iters: 35 });
  for (const n of nodes) {
    const s = pr.norm[n.id] ?? 0;
    n.score = Number(s.toFixed(4));
  }

  // SCC cycles
  const sccs = tarjanSCC(nodes, edges).filter((c) => c.length >= 2);
  const cycleNodeSet = new Set(sccs.flat());
  const edges2 = markCycleEdges(edges, cycleNodeSet);

  const graph = {
    schemaVersion: "0.1.3",
    generatedAt: new Date().toISOString(),
    root: ROOT,
    stats: {
      nodes: nodes.length,
      edges: edges2.length,
      clusters: clusters.length,
      cycles: sccs.length,
    },
    clusters,
    cycles: sccs.map((ids, i) => ({ id: `cycle:${i + 1}`, nodeIds: ids })),
    nodes,
    edges: edges2,
    unresolved,
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(graph, null, 2), "utf-8");

  console.log(`✅ graph.json written: ${OUT}`);
  console.log(`   root=${ROOT}`);
  console.log(`   nodes=${graph.stats.nodes}, edges=${graph.stats.edges}, clusters=${graph.stats.clusters}, cycles=${graph.stats.cycles}, unresolved=${unresolved.length}`);
}

main().catch((e) => {
  console.error("❌ build failed:", e);
  process.exit(1);
});
