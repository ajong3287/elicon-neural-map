import chokidar from "chokidar";
import { exec } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// .env.local 로드
dotenv.config({ path: path.join(rootDir, ".env.local") });

const MAP_ROOT = process.env.MAP_ROOT || rootDir;

console.log(`[Watcher] Watching: ${MAP_ROOT}`);
console.log(`[Watcher] Ignoring: node_modules, .git, .next`);

// Debounce 타이머
let timeout = null;
const DEBOUNCE_MS = 500;

function rebuild() {
  console.log(`[Watcher] Rebuilding graph...`);
  exec(
    `node ${path.join(__dirname, "build-graph.mjs")} --out ${path.join(rootDir, "public/graph.json")}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`[Watcher] Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[Watcher] Stderr: ${stderr}`);
      }
      console.log(`[Watcher] ✅ Graph rebuilt`);
      if (stdout) console.log(stdout);
    }
  );
}

// Watcher 시작
const watcher = chokidar.watch(MAP_ROOT, {
  ignored: /(^|[\/\\])(node_modules|\.git|\.next)([\/\\]|$)/,
  persistent: true,
  ignoreInitial: true,
});

watcher.on("change", (filePath) => {
  // JS, TS, MD 파일만
  if (!/\.(js|jsx|ts|tsx|md)$/.test(filePath)) return;

  console.log(`[Watcher] File changed: ${filePath}`);

  // Debounce
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(rebuild, DEBOUNCE_MS);
});

watcher.on("ready", () => {
  console.log(`[Watcher] 👀 Ready. Watching ${MAP_ROOT} for changes...`);
});
