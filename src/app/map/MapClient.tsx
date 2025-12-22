'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GraphShell from './GraphShell';

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
  const debug = searchParams?.toString?.() ?? '';

  const selectedLabel = useMemo(() => {
    if (!selectedId) return null;
    const idx = Number(selectedId.replace('n', '')) - 1;
    return nodes[idx]?.label ?? selectedId;
  }, [selectedId, nodes]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 0px)' }}>
      <div style={{ minHeight: 420 }}>
        <GraphShell
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          onSelectNode={setSelectedId}
        />
      </div>

      <aside style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', padding: 12 }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Details</h2>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
          searchParams: {debug || '(none)'}
        </div>

        {selectedId ? (
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <div><strong>Selected:</strong> {selectedLabel}</div>
            <div style={{ opacity: 0.7, marginTop: 8 }}>
              다음(STEP04.4)에서 여기에:
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                <li>경로(1줄)</li>
                <li>요약(1줄)</li>
                <li>연관 노드(최대 5)</li>
              </ul>
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
