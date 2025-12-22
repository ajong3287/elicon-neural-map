/**
 * sampleDetails.ts
 * STEP04.4: buildSampleDetails() → NodeDetail[]
 */

export type GraphNode = { id: string; label: string; x: number; y: number };
export type GraphEdge = { id: string; from: string; to: string };

export type NodeDetail = {
  id: string;
  label: string;
  path: string;
  summary: string;
  relatedIds: string[];
};

/**
 * buildSampleDetails
 * 각 노드(n1~n12)에 대한 상세 정보를 하드코딩으로 제공.
 * - path: 파일 경로 (1줄)
 * - summary: 역할 요약 (1줄)
 * - relatedIds: 연결된 노드 ID (최대 5개)
 */
export function buildSampleDetails(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, NodeDetail> {
  const details: NodeDetail[] = [
    {
      id: 'n1',
      label: 'README.md',
      path: '/README.md',
      summary: 'Project overview and quick start guide',
      relatedIds: ['n4'],
    },
    {
      id: 'n2',
      label: 'package.json',
      path: '/package.json',
      summary: 'Project metadata and dependencies',
      relatedIds: ['n4', 'n6'],
    },
    {
      id: 'n3',
      label: 'pnpm-lock.yaml',
      path: '/pnpm-lock.yaml',
      summary: 'Lockfile for reproducible installs',
      relatedIds: ['n2'],
    },
    {
      id: 'n4',
      label: 'src/app/page.tsx',
      path: '/src/app/page.tsx',
      summary: 'Root page component',
      relatedIds: ['n1', 'n2', 'n5'],
    },
    {
      id: 'n5',
      label: 'src/app/map/page.tsx',
      path: '/src/app/map/page.tsx',
      summary: 'Map route server component',
      relatedIds: ['n4', 'n6', 'n10'],
    },
    {
      id: 'n6',
      label: 'src/app/map/MapClient.tsx',
      path: '/src/app/map/MapClient.tsx',
      summary: 'Interactive graph client component',
      relatedIds: ['n5', 'n7'],
    },
    {
      id: 'n7',
      label: 'src/app/map/GraphShell.tsx',
      path: '/src/app/map/GraphShell.tsx',
      summary: 'Graph canvas with pan/zoom',
      relatedIds: ['n5', 'n6'],
    },
    {
      id: 'n8',
      label: 'docs/ai-hub/AI_HUB_GOVERNANCE.md',
      path: '/docs/ai-hub/AI_HUB_GOVERNANCE.md',
      summary: 'AI collaboration governance doc',
      relatedIds: ['n9'],
    },
    {
      id: 'n9',
      label: 'docs/ai-hub/CHANGELOG_AI_HUB.md',
      path: '/docs/ai-hub/CHANGELOG_AI_HUB.md',
      summary: 'AI Hub changelog',
      relatedIds: ['n8', 'n10'],
    },
    {
      id: 'n10',
      label: 'docs/mvp/STEP04_MVP_BREAKDOWN.md',
      path: '/docs/mvp/STEP04_MVP_BREAKDOWN.md',
      summary: 'MVP breakdown into 10 PRs',
      relatedIds: ['n5', 'n9'],
    },
    {
      id: 'n11',
      label: 'src/lib/graph.ts',
      path: '/src/lib/graph.ts',
      summary: 'Graph data types and utilities',
      relatedIds: ['n12'],
    },
    {
      id: 'n12',
      label: 'src/lib/scan.ts',
      path: '/src/lib/scan.ts',
      summary: 'File system scanning utilities',
      relatedIds: ['n11', 'n5'],
    },
  ];

  return new Map(details.map((d) => [d.id, d]));
}
