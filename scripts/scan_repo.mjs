#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = process.argv[2] || path.resolve(__dirname, '..');
const out = process.argv[3] || path.join(root, 'public', 'graph.json');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  '.cache', '.pnpm', '.DS_Store'
]);

const MAX_FILES = 6000;  // 안전장치
const MAX_DEPTH = 20;

function isIgnoredDir(name) {
  return IGNORE_DIRS.has(name);
}

function walk(dir, depth, acc) {
  if (depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const e of entries) {
    if (acc.files >= MAX_FILES) return;
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full).replaceAll(path.sep, '/');

    if (e.isDirectory()) {
      if (isIgnoredDir(e.name)) continue;
      acc.dirs.push(rel);
      walk(full, depth + 1, acc);
    } else if (e.isFile()) {
      if (e.name === '.DS_Store') continue;
      acc.filesList.push(rel);
      acc.files += 1;
    }
  }
}

function makeGraph(files) {
  const nodes = [];
  const edges = [];

  for (let i = 0; i < files.length; i++) {
    const label = files[i];
    nodes.push({
      id: `f${i + 1}`,
      label,
      x: 0,
      y: 0
    });
  }

  const byDir = new Map();
  for (let i = 0; i < files.length; i++) {
    const p = files[i];
    const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.';
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(`f${i + 1}`);
  }

  let eCount = 0;
  for (const ids of byDir.values()) {
    if (ids.length <= 1) continue;
    const hub = ids[0];
    for (let k = 1; k < ids.length; k++) {
      eCount += 1;
      edges.push({ id: `e${eCount}`, from: hub, to: ids[k] });
    }
  }

  return { root, generatedAt: new Date().toISOString(), nodes, edges };
}

const acc = { dirs: [], filesList: [], files: 0 };
walk(root, 0, acc);

const graph = makeGraph(acc.filesList);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(graph, null, 2), 'utf-8');

console.log('SCAN_OK');
console.log('root:', root);
console.log('out:', out);
console.log('files:', acc.filesList.length);
console.log('nodes:', graph.nodes.length);
console.log('edges:', graph.edges.length);
