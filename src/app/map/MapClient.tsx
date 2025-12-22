'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GraphShell from './GraphShell';
import { buildSampleDetails } from './sampleDetails';

type Node = { id: string; label: string; x: number; y: number };
type Edge = { id: string; from: string; to: string };

function buildSampleGraph() {
  // sample IDs
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

  // auto layout: simple ring + a few spokes
  const centerX = 360;
  const centerY = 260;
  const radius = 170;

  const nodes: Node[] = labels.map((label, i) => {
    const angle = (i / labels.length) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    return { id: `n${i + 1}`, label, x, y };
  });

  const edges: Edge[] = [];
  function addEdge(a: number, b: number) {
    edges.push({ id: `e${edges.length + 1}`, from: `n${a}`, to: `n${b}` });
  }

  // make it feel like a dependency web
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

export default function MapClient() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => buildSampleGraph(), []);
  const details = useMemo(() => buildSampleDetails(nodes, edges), [nodes, edges]);
  const debug = searchParams?.toString?.() ?? '';

  const selectedDetail = selectedId ? details.get(selectedId) : null;

  function onClickRelated(relId: string) {
    setSelectedId(relId);
    // (그래프에 자동 center는 안 함 — 간단한 데모)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', height: 'calc(100vh - 0px)' }}>
      <div style={{ minHeight: 420 }}>
        <GraphShell
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          onSelectNode={setSelectedId}
        />
      </div>

      <aside style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', padding: 14, overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 700 }}>Details</h2>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>
          searchParams: {debug || '(none)'}
        </div>

        {selectedDetail ? (
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <div style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: 14 }}>{selectedDetail.label}</strong>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600, marginBottom: 4 }}>PATH</div>
              <div style={{ background: 'rgba(0,0,0,0.06)', padding: '6px 8px', borderRadius: 8, fontFamily: 'monospace', fontSize: 11 }}>
                {selectedDetail.path}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600, marginBottom: 4 }}>SUMMARY</div>
              <div style={{ opacity: 0.85 }}>
                {selectedDetail.summary}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600, marginBottom: 6 }}>RELATED ({selectedDetail.relatedIds.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedDetail.relatedIds.map((relId) => {
                  const rel = details.get(relId);
                  if (!rel) return null;
                  return (
                    <button
                      key={relId}
                      onClick={() => onClickRelated(relId)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      {rel.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            노드를 클릭하면 상세가 표시됩니다. (배경 클릭=선택 해제)
          </div>
        )}
      </aside>
    </div>
  );
}
