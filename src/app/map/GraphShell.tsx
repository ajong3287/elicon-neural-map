'use client';

import React, { useMemo, useRef, useState } from 'react';

type Node = { id: string; label: string; x: number; y: number };
type Edge = { id: string; from: string; to: string };

export default function GraphShell(props: {
  nodes: Node[];
  edges: Edge[];
  onSelectNode?: (id: string | null) => void;
  selectedId?: string | null;
  mode?: 'browse' | 'inspect';
}) {
  const { nodes, edges, onSelectNode, selectedId, mode } = props;
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ down: boolean; x: number; y: number; ox: number; oy: number }>({
    down: false, x: 0, y: 0, ox: 0, oy: 0
  });

  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY;
    const next = Math.min(2.5, Math.max(0.4, scale + (delta > 0 ? 0.1 : -0.1)));
    setScale(next);
  }

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    drag.current = { down: true, x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current.down) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy });
  }

  function onMouseUp() {
    drag.current.down = false;
  }

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '40px 1fr', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <strong style={{ fontSize: 14 }}>Graph</strong>
        <span style={{ opacity: 0.6, fontSize: 12 }}>nodes {nodes.length} · edges {edges.length}</span>
        <div style={{ flex: 1 }} />
        <button onClick={resetView} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)' }}>
          Reset view
        </button>
      </div>

      <div
        ref={wrapRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02))',
          cursor: drag.current.down ? 'grabbing' : 'grab'
        }}
      >
        <svg
          width="100%"
          height="100%"
          onClick={() => onSelectNode?.(null)}
          style={{ display: 'block' }}
        >
          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
            {/* edges */}
            {edges.map(e => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              const isActive = selectedId && (e.from === selectedId || e.to === selectedId);
              return (
                <line
                  key={e.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isActive ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.25)'}
                  strokeWidth={isActive ? 2.4 : 1.2}
                />
              );
            })}

            {/* nodes */}
            {nodes.map(n => {
              const isSel = selectedId === n.id;
              const isInspect = mode === 'inspect';
              return (
                <g
                  key={n.id}
                  onClick={(evt) => { evt.stopPropagation(); onSelectNode?.(n.id); }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isSel ? 11 : 8}
                    fill={isSel ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.55)'}
                    stroke={isSel && isInspect ? 'rgba(0,0,0,1)' : 'transparent'}
                    strokeWidth={isSel && isInspect ? 3 : 0}
                  />
                  <text
                    x={n.x + 12}
                    y={n.y + 4}
                    fontSize={12}
                    fill="rgba(0,0,0,0.75)"
                    fontWeight={isSel && isInspect ? 600 : 400}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
