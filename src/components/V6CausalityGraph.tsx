// src/components/V6CausalityGraph.tsx
// V6 因果图 — SVG 展示技能位之间的前向/后向影响连线
// 依据: docs/v6/presentation-and-migration.md §7.3

import { useState, useMemo } from 'react';
import type {
  ContributionTrace,
  GeneratedSkill,
  ElementKey,
  StatKey,
  MechanicKey,
} from '../types/v6.ts';
import { ELEMENT_LABELS_V6, STAT_LABELS, MECHANIC_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';

interface V6CausalityGraphProps {
  contributions: ContributionTrace[];
  skills: GeneratedSkill[];
  seedCount: number;
}

interface GraphEdge {
  sourceSlot: number;
  targetSlot: number;
  pass: 'forward' | 'backward';
  totalSalience: number;
  reactionName: string;
  sourceElement: ElementKey;
  sourceSeedName: string;
  targetSeedName: string;
  // Per-contribution breakdown
  items: Array<{
    id: string;
    key: string;
    kind: 'stat' | 'mechanic' | 'accent';
    acceptedDelta: number;
    status: 'accepted' | 'rejected';
    distanceFactor: number;
    explanation: string;
  }>;
}

function buildEdges(contributions: ContributionTrace[], skills: GeneratedSkill[]): GraphEdge[] {
  // Group contributions by (sourceSlot, targetSlot, pass)
  const edgeMap = new Map<string, GraphEdge>();

  for (const ct of contributions) {
    const edgeKey = `${ct.sourceSlot}->${ct.targetSlot}:${ct.pass}`;
    let edge = edgeMap.get(edgeKey);
    if (!edge) {
      edge = {
        sourceSlot: ct.sourceSlot,
        targetSlot: ct.targetSlot,
        pass: ct.pass,
        totalSalience: 0,
        reactionName: ct.reactionName,
        sourceElement: ct.sourceElement,
        sourceSeedName: skills[ct.sourceSlot]?.baseName ?? ct.sourceSeedId,
        targetSeedName: skills[ct.targetSlot]?.baseName ?? ct.targetSeedId,
        items: [],
      };
      edgeMap.set(edgeKey, edge);
    }
    const itemSalience = ct.kind === 'stat'
      ? Math.abs(ct.acceptedDelta)
      : ct.kind === 'mechanic'
        ? 0.75 * Math.abs(ct.acceptedDelta)
        : 0.50 * Math.abs(ct.acceptedDelta);
    edge.totalSalience += itemSalience;
    edge.items.push({
      id: ct.id,
      key: ct.key,
      kind: ct.kind,
      acceptedDelta: ct.acceptedDelta,
      status: ct.status,
      distanceFactor: ct.distanceFactor,
      explanation: ct.explanation,
    });
  }

  // 先画弱线、后画强线，让更重要的关系保持在视觉上层。
  return Array.from(edgeMap.values()).sort((a, b) => a.totalSalience - b.totalSalience);
}

function getKeyLabel(key: string): string {
  return STAT_LABELS[key as StatKey] ?? MECHANIC_LABELS[key as MechanicKey] ?? key;
}

function getEdgeKey(edge: GraphEdge): string {
  return `${edge.sourceSlot}->${edge.targetSlot}:${edge.pass}`;
}

export function V6CausalityGraph({ contributions, skills, seedCount }: V6CausalityGraphProps) {
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);

  const edges = useMemo(() => buildEdges(contributions, skills), [contributions, skills]);
  const selectedEdge = edges.find((edge) => getEdgeKey(edge) === selectedEdgeKey) ?? null;

  if (seedCount < 2) {
    return (
      <div style={{ fontSize: '0.82rem', opacity: 0.6, textAlign: 'center', padding: '20px' }}>
        仅 1 个技能位，暂无互馈关系。继续添加种子后会出现前向塑形和后向改写。
      </div>
    );
  }

  const NODE_RADIUS = 30;
  const PADDING = 72;
  const svgWidth = 760;
  const svgHeight = 340;
  const centerY = 170;
  const spacing = (svgWidth - PADDING * 2) / (seedCount - 1 || 1);

  return (
    <div className="v6-causality-graph">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="v6-causality-graph__svg"
        aria-label="技能位互馈因果图"
      >
        {/* Background grid */}
        <defs>
          <pattern id="v6cg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </pattern>
          <marker id="v6cg-arrow-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gold-400)" />
          </marker>
          <marker id="v6cg-arrow-bwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--jade-400)" />
          </marker>
        </defs>
        <rect width={svgWidth} height={svgHeight} fill="url(#v6cg-grid)" />

        {/* Edges */}
        {edges.map((edge) => {
          const sourceX = PADDING + edge.sourceSlot * spacing;
          const targetX = PADDING + edge.targetSlot * spacing;
          const horizontalDirection = targetX >= sourceX ? 1 : -1;
          const x1 = sourceX + horizontalDirection * (NODE_RADIUS + 3);
          const x2 = targetX - horizontalDirection * (NODE_RADIUS + 8);
          const span = Math.max(1, Math.abs(edge.targetSlot - edge.sourceSlot));
          const verticalDirection = edge.pass === 'forward' ? -1 : 1;
          const controlY = centerY + verticalDirection * (58 + span * 34);
          const labelX = (x1 + x2) / 2;
          const labelY = (centerY + controlY) / 2 + verticalDirection * 10;
          const path = `M ${x1} ${centerY} Q ${labelX} ${controlY} ${x2} ${centerY}`;
          const strokeW = Math.max(1.5, Math.min(8, edge.totalSalience * 10));
          const strokeColor = edge.pass === 'forward' ? 'var(--gold-400)' : 'var(--jade-400)';
          const dashArray = edge.pass === 'backward' ? '6 4' : undefined;
          const opacity = 0.35 + Math.min(edge.totalSalience, 0.5) * 1.2;
          const edgeKey = getEdgeKey(edge);
          const isSelected = selectedEdgeKey === edgeKey;
          const toggleEdge = () => setSelectedEdgeKey(isSelected ? null : edgeKey);

          return (
            <g key={edgeKey} className={isSelected ? 'is-selected' : undefined}>
              <path
                d={path}
                fill="none"
                stroke={isSelected ? '#fff' : strokeColor}
                strokeWidth={isSelected ? strokeW + 2 : strokeW}
                strokeDasharray={dashArray}
                opacity={isSelected ? 1 : opacity}
                markerEnd={edge.pass === 'forward' ? 'url(#v6cg-arrow-fwd)' : 'url(#v6cg-arrow-bwd)'}
                className="v6cg-edge"
              />
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                className="v6cg-edge-hit"
                role="button"
                tabIndex={0}
                aria-label={`查看${edge.sourceSeedName}到${edge.targetSeedName}的${edge.pass === 'forward' ? '前向塑形' : '后向改写'}`}
                onClick={toggleEdge}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') toggleEdge();
                }}
              />
              <rect
                x={labelX - 22}
                y={labelY - 10}
                width={44}
                height={18}
                rx={9}
                fill="rgba(8, 16, 17, 0.9)"
                stroke={strokeColor}
                strokeWidth={0.8}
                opacity={isSelected ? 1 : Math.min(0.88, opacity + 0.08)}
                className="v6cg-edge-label-bg"
              />
              <text
                x={labelX}
                y={labelY + 2}
                textAnchor="middle"
                fill={strokeColor}
                fontSize="0.6rem"
                fontFamily="Consolas, monospace"
                opacity={isSelected ? 1 : Math.min(1, opacity + 0.2)}
                className="v6cg-edge-label"
              >
                {(edge.totalSalience * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {skills.slice(0, seedCount).map((skill, i) => {
          const x = PADDING + i * spacing;
          const color = ELEMENT_COLORS[skill.primaryElement] ?? '#888';

          return (
            <g key={i}>
              <circle cx={x} cy={centerY} r={NODE_RADIUS} fill="rgba(18,28,29,0.95)" stroke={color} strokeWidth={2.5} />
              <circle cx={x} cy={centerY} r={NODE_RADIUS - 6} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
              <text x={x} y={centerY - 6} textAnchor="middle" fill={color} fontSize="0.85rem" fontFamily="var(--font-display)" fontWeight={700}>
                {ELEMENT_LABELS_V6[skill.primaryElement]}
              </text>
              <text x={x} y={centerY + 12} textAnchor="middle" fill="var(--mist-300)" fontSize="0.55rem" fontFamily="Consolas, monospace">
                位{i + 1}
              </text>
              <text x={x} y={centerY + NODE_RADIUS + 16} textAnchor="middle" fill="var(--moon-100)" fontSize="0.68rem" fontFamily="var(--font-display)">
                {skill.generatedName.length > 5 ? skill.generatedName.slice(0, 5) + '…' : skill.generatedName}
              </text>
              <text x={x} y={centerY + NODE_RADIUS + 30} textAnchor="middle" fill={color} fontSize="0.55rem">
                {skill.baseName}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${svgWidth - 160}, 14)`}>
          <line x1={0} y1={6} x2={28} y2={6} stroke="var(--gold-400)" strokeWidth={2.5} markerEnd="url(#v6cg-arrow-fwd)" />
          <text x={34} y={10} fill="var(--mist-300)" fontSize="0.55rem">前向塑形</text>
          <line x1={0} y1={22} x2={28} y2={22} stroke="var(--jade-400)" strokeWidth={2.5} strokeDasharray="6 4" markerEnd="url(#v6cg-arrow-bwd)" />
          <text x={34} y={26} fill="var(--mist-300)" fontSize="0.55rem">后向改写</text>
        </g>
      </svg>

      {/* Click-to-inspect popup */}
      {selectedEdge && (
        <div className="v6cg-popup">
          <div className="v6cg-popup__header">
            <span className="v6cg-popup__direction">
              {selectedEdge.pass === 'forward' ? '前向塑形' : '后向改写'}
            </span>
            <span className="v6cg-popup__reaction">
              {ELEMENT_LABELS_V6[selectedEdge.sourceElement]}
              {' → '}
              {ELEMENT_LABELS_V6[skills[selectedEdge.targetSlot]?.primaryElement ?? 'fire']}
              {'：'}{selectedEdge.reactionName}
            </span>
            <button
              className="v6cg-popup__close"
              onClick={() => setSelectedEdgeKey(null)}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          <div className="v6cg-popup__meta">
            距离系数：{selectedEdge.items[0]?.distanceFactor.toFixed(3) ?? '—'}
            {' · '}
            显著度：{(selectedEdge.totalSalience * 100).toFixed(0)}%
            {' · '}
            {selectedEdge.items.length} 项变化
          </div>
          <div className="v6cg-popup__items">
            {selectedEdge.items.map((item, i) => (
              <div key={i} className={`v6cg-popup__item ${item.status === 'rejected' ? 'v6cg-popup__item--rejected' : ''}`}>
                <span className="v6cg-popup__item-key">
                  {item.key === 'accent' ? '混合元素' : getKeyLabel(item.key)}
                </span>
                <span className={`v6cg-popup__item-delta ${item.acceptedDelta > 0 ? 'delta--pos' : item.acceptedDelta < 0 ? 'delta--neg' : ''}`}>
                  {item.status === 'rejected' ? '拒绝' : item.acceptedDelta > 0 ? `+${item.acceptedDelta.toFixed(3)}` : item.acceptedDelta.toFixed(3)}
                </span>
                <span className="v6cg-popup__item-id">[{item.id}]</span>
                {item.status === 'rejected' && (
                  <span className="v6cg-popup__item-reason">元素能力边界不允许</span>
                )}
              </div>
            ))}
          </div>
          <div className="v6cg-popup__explain">
            {selectedEdge.items[0]?.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
