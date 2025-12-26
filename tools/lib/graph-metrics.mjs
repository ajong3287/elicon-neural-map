/**
 * v0.1.3 graph metrics
 * - importance: PageRank (fallback to degree)
 * - cycles: SCC (Tarjan) -> sccs with size>=2
 */

export function computeDegrees(nodes, edges) {
  const indeg = Object.create(null);
  const outdeg = Object.create(null);
  for (const n of nodes) { indeg[n.id]=0; outdeg[n.id]=0; }
  for (const e of edges) {
    if (e.source in outdeg) outdeg[e.source] += 1;
    if (e.target in indeg) indeg[e.target] += 1;
  }
  return { indeg, outdeg };
}

// Simple PageRank
export function pageRank(nodes, edges, { damping=0.85, iters=30 } = {}) {
  const ids = nodes.map(n => n.id);
  const N = ids.length || 1;

  const out = Object.create(null);
  const incoming = Object.create(null);
  for (const id of ids) { out[id]=0; incoming[id]=[]; }
  for (const e of edges) {
    if (e.source in out && e.target in incoming) {
      out[e.source] += 1;
      incoming[e.target].push(e.source);
    }
  }

  let pr = Object.create(null);
  for (const id of ids) pr[id] = 1 / N;

  for (let k=0; k<iters; k++) {
    const next = Object.create(null);
    for (const id of ids) {
      let sum = 0;
      for (const src of incoming[id]) {
        const denom = out[src] || N; // sink handling
        sum += pr[src] / denom;
      }
      next[id] = (1 - damping) / N + damping * sum;
    }
    pr = next;
  }

  // normalize 0..1
  let min=Infinity, max=-Infinity;
  for (const id of ids) { min=Math.min(min, pr[id]); max=Math.max(max, pr[id]); }
  const norm = Object.create(null);
  const span = (max-min) || 1;
  for (const id of ids) norm[id] = (pr[id] - min) / span;
  return { raw: pr, norm };
}

/**
 * Tarjan SCC
 * returns array of SCC arrays of node ids
 */
export function tarjanSCC(nodes, edges) {
  const ids = nodes.map(n => n.id);
  const adj = Object.create(null);
  for (const id of ids) adj[id] = [];
  for (const e of edges) {
    if (adj[e.source]) adj[e.source].push(e.target);
  }

  let index = 0;
  const stack = [];
  const onStack = Object.create(null);
  const idx = Object.create(null);
  const low = Object.create(null);
  const sccs = [];

  function strongconnect(v) {
    idx[v] = index;
    low[v] = index;
    index++;
    stack.push(v);
    onStack[v] = true;

    for (const w of adj[v] || []) {
      if (idx[w] === undefined) {
        strongconnect(w);
        low[v] = Math.min(low[v], low[w]);
      } else if (onStack[w]) {
        low[v] = Math.min(low[v], idx[w]);
      }
    }

    if (low[v] === idx[v]) {
      const comp = [];
      while (true) {
        const w = stack.pop();
        onStack[w] = false;
        comp.push(w);
        if (w === v) break;
      }
      sccs.push(comp);
    }
  }

  for (const v of ids) {
    if (idx[v] === undefined) strongconnect(v);
  }
  return sccs;
}

export function markCycleEdges(edges, cycleNodeSet) {
  return edges.map(e => ({
    ...e,
    cycle: cycleNodeSet.has(e.source) && cycleNodeSet.has(e.target)
  }));
}
