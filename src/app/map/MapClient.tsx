'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GraphShell from './GraphShell';
import { buildSampleDetails, GraphEdge, GraphNode } from './sampleDetails';

type Mode = 'browse' | 'inspect';

function buildSampleGraph() {
  const labels = [
    'README.md',
    'package.json',
    'pnpm-lock.yaml',
    'src/app/page.tsx',
    'src/app/map/page.tsx',
    'src/app/map/MapClient.tsx',
    'src/app/map/GraphShell.tsx',
    'docs/ai-hub/AI_HUB_GOVERNANCE.md',
    'docs/ai-hub/CHANGELOG_AI_HUB.md',
    'docs/mvp/STEP04_MVP_BREAKDOWN.md',
    'src/lib/graph.ts',
    'src/lib/scan.ts',
  ];

  const centerX = 360;
  const centerY = 260;
  const radius = 170;

  const nodes: GraphNode[] = labels.map((label, i) => {
    const angle = (i / labels.length) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    return { id: `n${i + 1}`, label, x, y };
  });

  const edges: GraphEdge[] = [];
  function addEdge(a: number, b: number) {
    edges.push({ id: `e${edges.length + 1}`, from: `n${a}`, to: `n${b}` });
  }

  addEdge(1, 4);
  addEdge(2, 4);
  addEdge(4, 5);
  addEdge(5, 6);
  addEdge(6, 7);
  addEdge(7, 5);
  addEdge(8, 9);
  addEdge(9, 10);
  addEdge(10, 5);
  addEdge(11, 12);
  addEdge(12, 5);
  addEdge(3, 2);
  addEdge(2, 6);

  return { nodes, edges };
}

function isDocsLike(label: string) {
  return (
    label.startsWith('docs/') ||
    label.endsWith('.md') ||
    label.includes('/docs/')
  );
}

export default function MapClient() {
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>('browse');
  const [onlyDocs, setOnlyDocs] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // search UI state
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => buildSampleGraph(), []);

  const nodes = useMemo(() => {
    if (!onlyDocs) return rawNodes;
    return rawNodes.filter(n => isDocsLike(n.label));
  }, [rawNodes, onlyDocs]);

  const edges = useMemo(() => {
    if (!onlyDocs) return rawEdges;
    const allowed = new Set(nodes.map(n => n.id));
    return rawEdges.filter(e => allowed.has(e.from) && allowed.has(e.to));
  }, [rawEdges, nodes, onlyDocs]);

  const details = useMemo(() => buildSampleDetails(nodes, edges), [nodes, edges]);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return nodes
      .filter(n => n.label.toLowerCase().includes(s))
      .slice(0, 12);
  }, [q, nodes]);

  useEffect(() => {
    setOpen(q.trim().length > 0);
  }, [q]);

  // selection safety: if filtered out, clear selection
  useEffect(() => {
    if (!selectedId) return;
    const exists = nodes.some(n => n.id === selectedId);
    if (!exists) setSelectedId(null);
  }, [nodes, selectedId]);

  const debug = searchParams?.toString?.() ?? '';
  const detail = selectedId ? details.get(selectedId) : undefined;

  function resetAll() {
    setMode('browse');
    setOnlyDocs(false);
    setSelectedId(null);
    setQ('');
    setOpen(false);
  }

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateRows: '52px 1fr' }}>
      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13 }}>elicon-neural-map</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.65 }}>Mode</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setMode('browse')}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.14)',
                background: mode === 'browse' ? 'rgba(0,0,0,0.06)' : 'transparent',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Browse
            </button>
            <button
              onClick={() => setMode('inspect')}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.14)',
                background: mode === 'inspect' ? 'rgba(0,0,0,0.06)' : 'transparent',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Inspect
            </button>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={onlyDocs}
            onChange={(e) => setOnlyDocs(e.target.checked)}
          />
          <span style={{ fontSize: 12, opacity: 0.75 }}>docs only</span>
        </label>

        <button
          onClick={resetAll}
          style={{
            marginLeft: 'auto',
            padding: '6px 10px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.14)',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          Reset
        </button>
      </header>

      {/* BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', height: '100%' }}>
        <div style={{ minHeight: 420 }}>
          <GraphShell
            nodes={nodes}
            edges={edges}
            selectedId={selectedId}
            onSelectNode={setSelectedId}
            mode={mode}
          />
        </div>

        <aside style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', padding: 12 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Details</h2>

          {/* SEARCH */}
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.10)' }}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>SEARCH</div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setOpen(true)}
                placeholder="파일명/경로 일부 입력… (Enter=첫 결과 선택)"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.14)',
                  fontSize: 13
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const first = matches[0];
                    if (first) {
                      setSelectedId(first.id);
                      setOpen(false);
                    }
                  }
                  if (e.key === 'Escape') {
                    setOpen(false);
                  }
                }}
              />
              <button
                onClick={() => { setQ(''); setOpen(false); }}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.14)' }}
              >
                Clear
              </button>
            </div>

            {open && matches.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 220, overflow: 'auto' }}>
                {matches.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setSelectedId(n.id); setOpen(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: 'rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      marginBottom: 6,
                      fontSize: 13
                    }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            )}

            {open && q.trim() && matches.length === 0 && (
              <div style={{ marginTop: 8, opacity: 0.65, fontSize: 13 }}>
                검색 결과 없음
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
            searchParams: {debug || '(none)'}
          </div>

          {!detail ? (
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              노드를 클릭하면 상세가 표시됩니다. (배경 클릭=선택 해제)
            </div>
          ) : (
            <div style={{ fontSize: 13, lineHeight: 1.45 }}>
              <div style={{ fontSize: 12, opacity: 0.65 }}>PATH</div>
              <div style={{ marginBottom: 10 }}>
                <code style={{ fontSize: 12 }}>{detail.path}</code>
              </div>

              <div style={{ fontSize: 12, opacity: 0.65 }}>SUMMARY</div>
              <div style={{ marginBottom: 12 }}>{detail.summary}</div>

              <div style={{ fontSize: 12, opacity: 0.65 }}>RELATED</div>
              {detail.relatedIds.length === 0 ? (
                <div style={{ opacity: 0.7 }}>연관 노드 없음</div>
              ) : (
                <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                  {detail.relatedIds.map(id => {
                    const n = details.get(id);
                    const label = n?.label ?? id;
                    return (
                      <li key={id} style={{ marginBottom: 6 }}>
                        <button
                          onClick={() => setSelectedId(id)}
                          style={{
                            padding: 0,
                            border: 0,
                            background: 'transparent',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: 13
                          }}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div style={{ marginTop: 14, opacity: 0.65, fontSize: 12 }}>
                (STEP05~에서 실제 폴더 스캔/점수/요약을 이 형식으로 치환합니다)
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
