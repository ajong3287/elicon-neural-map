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

const MAX_FILES = 6000;
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

// 파일에서 import/require 추출
function extractImports(filePath) {
  const imports = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // import ... from "..." 또는 import("...")
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    // require("...")
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } catch {
    // 파일 읽기 실패 시 무시
  }

  return imports;
}

// 상대 경로를 절대 파일 경로로 해결
function resolveImport(fromFile, importPath) {
  // 외부 패키지 무시 (. 또는 /로 시작하지 않으면)
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  const fromDir = path.dirname(path.join(root, fromFile));
  let resolved = path.resolve(fromDir, importPath);

  // 루트 밖으로 나가면 무시
  if (!resolved.startsWith(root)) {
    return null;
  }

  // 상대 경로로 변환
  resolved = path.relative(root, resolved).replaceAll(path.sep, '/');

  // 확장자 추가 시도 (.ts, .tsx, .js, .jsx)
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

  for (const ext of extensions) {
    const candidate = resolved + ext;
    const fullPath = path.join(root, candidate);
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function makeGraph(files) {
  const nodes = [];
  const edgeSet = new Set();
  const fileSet = new Set(files);

  // 노드 ID 안정화: "p:" + relPath
  for (const file of files) {
    nodes.push({
      id: `p:${file}`,
      label: file,
      x: 0,
      y: 0
    });
  }

  // 의존성 기반 엣지 생성
  for (const file of files) {
    const fullPath = path.join(root, file);
    const imports = extractImports(fullPath);

    for (const imp of imports) {
      const resolved = resolveImport(file, imp);
      if (resolved && fileSet.has(resolved)) {
        const edgeId = `e:p:${file}->p:${resolved}`;
        edgeSet.add(JSON.stringify({
          id: edgeId,
          from: `p:${file}`,
          to: `p:${resolved}`
        }));
      }
    }
  }

  const edges = Array.from(edgeSet).map(s => JSON.parse(s));

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
