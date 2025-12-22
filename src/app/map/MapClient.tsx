'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GraphShell from './GraphShell';

type Node = { id: string; label: string; x: number; y: number };
type Edge = { id: string; from: string; to: string };

export default function MapClient() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    // STEP04.2: sample graph only (hardcoded)
    const ns: Node[] = [
      { id: 'n1', label: 'README.md', x: 120, y: 120 },
      { id: 'n2', label: 'src/app/map/page.tsx', x: 360, y: 160 },
      { id: 'n3', label: 'GraphShell.tsx', x: 260, y: 320 },
      { id: 'n4', label: 'docs/ai-hub', x: 520, y: 280 },
    ];
    const es: Edge[] = [
      { id: 'e1', from: 'n2', to: 'n3' },
      { id: 'e2', from: 'n1', to: 'n2' },
      { id: 'e3', from: 'n3', to: 'n4' },
    ];
    return { nodes: ns, edges: es };
  }, []);

  const debug = searchParams?.toString?.() ?? '';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100vh - 0px)' }}>
      <div style={{ minHeight: 400 }}>
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
          <div style={{ fontSize: 13 }}>
            <div><strong>Selected:</strong> {selectedId}</div>
            <div style={{ opacity: 0.7, marginTop: 6 }}>
              (STEP04.4에서 여기로 경로/요약/연관 정보를 붙입니다)
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            노드를 클릭하면 상세가 표시됩니다.
          </div>
        )}
      </aside>
    </div>
  );
}
