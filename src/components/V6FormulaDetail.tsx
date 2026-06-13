// src/components/V6FormulaDetail.tsx
// V6 公式详情 — 可折叠的完整计算矩阵
// 依据: docs/v6/presentation-and-migration.md §7.3, "为什么不是查表" proof

import { useMemo } from 'react';
import type {
  ContributionTrace,
  AggregateTrace,
  GeneratedSkill,
  StatKey,
  MechanicKey,
} from '../types/v6.ts';
import { STAT_LABELS, MECHANIC_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';

interface V6FormulaDetailProps {
  contributions: ContributionTrace[];
  aggregates: AggregateTrace[];
  skills: GeneratedSkill[];
}

function getKeyLabel(key: string): string {
  return STAT_LABELS[key as StatKey] ?? MECHANIC_LABELS[key as MechanicKey] ?? key;
}

export function V6FormulaDetail({ contributions, aggregates, skills }: V6FormulaDetailProps) {
  // Sort contributions by sourceSlot, targetSlot, pass
  const sortedContribs = useMemo(() => {
    return [...contributions].sort((a, b) => {
      if (a.targetSlot !== b.targetSlot) return a.targetSlot - b.targetSlot;
      if (a.pass !== b.pass) return a.pass === 'forward' ? -1 : 1;
      return a.sourceSlot - b.sourceSlot;
    });
  }, [contributions]);

  const sortedAggs = useMemo(() => {
    return [...aggregates].sort((a, b) => {
      if (a.targetSlot !== b.targetSlot) return a.targetSlot - b.targetSlot;
      if (a.pass !== b.pass) return a.pass === 'forward' ? -1 : 1;
      return a.key.localeCompare(b.key);
    });
  }, [aggregates]);

  // Count unique seeds for fingerprint
  const uniqueSeeds = new Set(skills.map((s) => s.seedId)).size;
  const slotCount = skills.length;
  const totalFormulas = contributions.length;

  return (
    <div className="v6-formula">
      <details>
        <summary className="v6-formula__summary">
          推演公式详情 — {totalFormulas} 条贡献记录，{aggregates.length} 条聚合记录
          <span className="v6-formula__hint">（展开查看完整计算矩阵）</span>
        </summary>

        <div className="v6-formula__body">
          {/* Why not a lookup table proof */}
          <div className="v6-formula__proof">
            <h4>为什么这不是查表？</h4>
            <ul>
              <li>
                当前 trace 对应 <strong>{slotCount} 个技能位、{uniqueSeeds} 个不同种子</strong>。
                {totalFormulas > 0
                  ? <>规则引擎实时生成了 <strong>{totalFormulas} 条独立贡献</strong>与 <strong>{aggregates.length} 条聚合记录</strong>。</>
                  : <>单技能没有互馈对象，因此贡献与聚合记录均为 <strong>0</strong>。</>}
              </li>
              <li>
                每条贡献都是<strong>实时计算</strong>的：规则 delta × 亲合力 × 距离衰减 × 权威度 × 来源表达 × 目标接受度 × 全局增益 → 有符号饱和。
              </li>
              <li>
                不存在任何以「四枚符文完整排列」为 key 的预制结果。所有最终值都来自上述公式的连续聚合。
              </li>
              <li>
                每条贡献都有唯一的 <code>trace ID</code>，可追溯到具体的来源技能、目标技能、使用的反应规则和计算参数。
              </li>
            </ul>
          </div>

          {/* Contribution matrix */}
          <h4 className="v6-formula__section-title">贡献计算矩阵</h4>
          <div className="v6-formula__table-wrap">
            <table className="v6-formula__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>方向</th>
                  <th>来源位→目标位</th>
                  <th>反应</th>
                  <th>维度</th>
                  <th>规则Δ</th>
                  <th>亲合</th>
                  <th>距离</th>
                  <th>权威</th>
                  <th>表达</th>
                  <th>接受</th>
                  <th>原始Δ</th>
                  <th>接受Δ</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {sortedContribs.map((ct) => (
                  <tr key={ct.id} className={ct.status === 'rejected' ? 'v6-formula__row--rejected' : ''}>
                    <td className="v6-formula__td--id">{ct.id}</td>
                    <td style={{ color: ct.pass === 'forward' ? 'var(--gold-400)' : 'var(--jade-400)' }}>
                      {ct.pass === 'forward' ? '前向' : '后向'}
                    </td>
                    <td>
                      <span style={{ color: ELEMENT_COLORS[ct.sourceElement] }}>
                        位{ct.sourceSlot + 1}
                      </span>
                      {' → '}
                      <span style={{ color: ELEMENT_COLORS[ct.targetElement] }}>
                        位{ct.targetSlot + 1}
                      </span>
                    </td>
                    <td className="v6-formula__td--name">{ct.reactionName}</td>
                    <td>{ct.key === 'accent' ? '混合元素' : getKeyLabel(ct.key)}</td>
                    <td className="v6-formula__td--num">{ct.ruleDelta.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{ct.affinity.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{ct.distanceFactor.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{ct.authorityFactor.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{ct.sourceExpression.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{ct.targetReceptivity.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{ct.rawDelta.toFixed(3)}</td>
                    <td className={`v6-formula__td--num ${ct.acceptedDelta > 0 ? 'delta--pos' : ct.acceptedDelta < 0 ? 'delta--neg' : ''}`}>
                      {ct.acceptedDelta > 0 ? '+' : ''}{ct.acceptedDelta.toFixed(3)}
                    </td>
                    <td style={{ color: ct.status === 'rejected' ? 'var(--cinnabar-400)' : 'var(--jade-400)' }}>
                      {ct.status === 'accepted' ? '接受' : '拒绝'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aggregate matrix */}
          <h4 className="v6-formula__section-title">聚合饱和矩阵</h4>
          <div className="v6-formula__table-wrap">
            <table className="v6-formula__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>方向</th>
                  <th>目标位</th>
                  <th>维度</th>
                  <th>来源ID数</th>
                  <th>有符号和</th>
                  <th>饱和上限</th>
                  <th>饱和后Δ</th>
                  <th>聚合前值</th>
                  <th>聚合后值</th>
                </tr>
              </thead>
              <tbody>
                {sortedAggs.map((agg) => (
                  <tr key={agg.id}>
                    <td className="v6-formula__td--id">{agg.id}</td>
                    <td style={{ color: agg.pass === 'forward' ? 'var(--gold-400)' : 'var(--jade-400)' }}>
                      {agg.pass === 'forward' ? '前向' : '后向'}
                    </td>
                    <td>位{agg.targetSlot + 1}</td>
                    <td>{getKeyLabel(agg.key)}</td>
                    <td className="v6-formula__td--num">{agg.contributionIds.length}</td>
                    <td className="v6-formula__td--num">{agg.signedSum.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{agg.cap.toFixed(2)}</td>
                    <td className={`v6-formula__td--num ${agg.saturatedDelta > 0 ? 'delta--pos' : agg.saturatedDelta < 0 ? 'delta--neg' : ''}`}>
                      {agg.saturatedDelta > 0 ? '+' : ''}{agg.saturatedDelta.toFixed(3)}
                    </td>
                    <td className="v6-formula__td--num">{agg.valueBefore.toFixed(3)}</td>
                    <td className="v6-formula__td--num">{agg.valueAfter.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}
