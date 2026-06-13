// src/components/V6PerSkillSnapshot.tsx
// V6 单技能三阶段快照 — base → forward固化 → backward联合修饰
// 依据: docs/v6/presentation-and-migration.md §7.4

import { useMemo } from 'react';
import type {
  GeneratedSkill,
  SkillStageTrace,
  ContributionTrace,
  ElementKey,
} from '../types/v6.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../types/v6.ts';
import { ELEMENT_LABELS_V6, STAT_LABELS, MECHANIC_LABELS, FORM_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';

interface V6PerSkillSnapshotProps {
  skill: GeneratedSkill;
  stageTrace?: SkillStageTrace;
  contributions: ContributionTrace[];
}

/** Small bar showing contribution proportion per source */
function ContributionBar({
  deltas,
  maxAbs,
}: {
  deltas: Array<{ slot: number; element: ElementKey; delta: number; pass: 'forward' | 'backward'; id: string }>;
  maxAbs: number;
}) {
  if (maxAbs < 0.001) return null;
  return (
    <div className="v6ps-contrib-bar">
      {deltas.map((d, i) => {
        const pct = maxAbs > 0 ? Math.abs(d.delta) / maxAbs * 100 : 0;
        return (
          <div
            key={i}
            className={`v6ps-contrib-seg v6ps-contrib-seg--${d.pass}`}
            style={{
              width: `${pct}%`,
              backgroundColor: d.delta > 0 ? ELEMENT_COLORS[d.element] : 'transparent',
              borderColor: ELEMENT_COLORS[d.element],
              borderWidth: '1px',
              borderStyle: d.delta > 0 ? 'solid' : 'dashed',
            }}
            title={`位${d.slot + 1} ${d.pass === 'forward' ? '前向' : '后向'}: ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(3)} [${d.id}]`}
          />
        );
      })}
    </div>
  );
}

function formatDelta(v: number): string {
  if (Math.abs(v) < 0.005) return '0';
  return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
}

function deltaClass(v: number): string {
  if (Math.abs(v) < 0.005) return '';
  return v > 0 ? 'delta--pos' : 'delta--neg';
}

export function V6PerSkillSnapshot({ skill, stageTrace, contributions }: V6PerSkillSnapshotProps) {
  const elementColor = ELEMENT_COLORS[skill.primaryElement] ?? '#888';

  // Build contribution lookup: key => {slot, element, delta, pass, id}[]
  const contribByKey = useMemo(() => {
    const map = new Map<string, Array<{ slot: number; element: ElementKey; delta: number; pass: 'forward' | 'backward'; id: string }>>();
    for (const ct of contributions) {
      if (ct.targetSlot !== skill.slot || ct.status !== 'accepted') continue;
      if (ct.kind === 'accent') continue;
      const group = map.get(ct.key) ?? [];
      group.push({
        slot: ct.sourceSlot,
        element: ct.sourceElement,
        delta: ct.acceptedDelta,
        pass: ct.pass,
        id: ct.id,
      });
      map.set(ct.key, group);
    }
    return map;
  }, [contributions, skill.slot]);

  // Find dominant forward/backward contribution IDs
  const dominantFwdId = stageTrace?.dominantForwardContributionId;
  const dominantBwdId = stageTrace?.dominantBackwardContributionId;

  // Changes with notable deltas
  const changedStats = useMemo(() => {
    return STAT_KEYS.filter((k) => {
      const delta = Math.abs(skill.finalStats[k] - skill.baseStats[k]);
      return delta >= 0.005;
    });
  }, [skill.finalStats, skill.baseStats]);

  const changedMechanics = useMemo(() => {
    return MECHANIC_KEYS.filter((k) => {
      const base = skill.baseMechanics[k] ?? 0;
      const final = skill.finalMechanics[k] ?? 0;
      return Math.abs(final - base) >= 0.005;
    });
  }, [skill.finalMechanics, skill.baseMechanics]);

  const hasAnyChange = changedStats.length > 0 || changedMechanics.length > 0;

  return (
    <div className="v6ps-card" style={{ borderLeftColor: elementColor }}>
      {/* Header */}
      <div className="v6ps-card__header">
        <span className="v6ps-card__slot">技能 {'ⅠⅡⅢⅣ'[skill.slot]}</span>
        <span className="v6ps-card__name" style={{ color: elementColor }}>
          {skill.generatedName}
        </span>
        <span className="v6ps-card__meta">
          {ELEMENT_LABELS_V6[skill.primaryElement]} · {FORM_LABELS[skill.form] ?? skill.form}
        </span>
      </div>
      <div className="v6ps-card__core">{skill.coreEffect}</div>
      <div className="v6ps-card__tags">
        {skill.tags.slice(0, 5).map((t, i) => (
          <span key={i} className="v6ps-tag">{t}</span>
        ))}
      </div>

      {!hasAnyChange && (
        <div className="v6ps-card__nochange" style={{ marginTop: '10px' }}>
          无互馈变化 — 该技能保持基础状态。
        </div>
      )}

      {/* Stats three-stage table */}
      {changedStats.length > 0 && (
        <div className="v6ps-table-wrap">
          <table className="v6ps-table">
            <thead>
              <tr>
                <th>参数</th>
                <th className="v6ps-th--stage">基础</th>
                <th className="v6ps-th--stage">前向固化</th>
                <th className="v6ps-th--stage">后向修饰</th>
                <th className="v6ps-th--delta">净变化</th>
                <th>来源贡献</th>
              </tr>
            </thead>
            <tbody>
              {changedStats.map((key) => {
                const base = skill.baseStats[key];
                const fwd = skill.forwardStats[key];
                const final = skill.finalStats[key];
                const deltas = contribByKey.get(key) ?? [];
                const maxAbs = Math.max(...deltas.map((d) => Math.abs(d.delta)), 0.001);
                return (
                  <tr key={key}>
                    <td className="v6ps-td--label">{STAT_LABELS[key]}</td>
                    <td className="v6ps-td--val">{base.toFixed(2)}</td>
                    <td className="v6ps-td--val">{fwd.toFixed(2)}</td>
                    <td className="v6ps-td--val">{final.toFixed(2)}</td>
                    <td className={`v6ps-td--delta ${deltaClass(final - base)}`}>
                      {formatDelta(final - base)}
                    </td>
                    <td className="v6ps-td--contrib">
                      <ContributionBar deltas={deltas} maxAbs={maxAbs} />
                      {deltas.length > 0 && (
                        <div className="v6ps-contrib-labels">
                          {deltas.map((d, i) => (
                            <span key={i} className="v6ps-contrib-label" style={{ color: ELEMENT_COLORS[d.element] }}>
                              位{d.slot + 1}{d.pass === 'forward' ? '前' : '后'}{formatDelta(d.delta)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mechanics three-stage table */}
      {changedMechanics.length > 0 && (
        <div className="v6ps-table-wrap" style={{ marginTop: '12px' }}>
          <table className="v6ps-table">
            <thead>
              <tr>
                <th>机制</th>
                <th className="v6ps-th--stage">基础</th>
                <th className="v6ps-th--stage">前向固化</th>
                <th className="v6ps-th--stage">后向修饰</th>
                <th className="v6ps-th--delta">净变化</th>
                <th>来源贡献</th>
              </tr>
            </thead>
            <tbody>
              {changedMechanics.map((key) => {
                const base = skill.baseMechanics[key] ?? 0;
                const fwd = skill.forwardMechanics[key] ?? 0;
                const final = skill.finalMechanics[key] ?? 0;
                const deltas = contribByKey.get(key) ?? [];
                const maxAbs = Math.max(...deltas.map((d) => Math.abs(d.delta)), 0.001);
                return (
                  <tr key={key}>
                    <td className="v6ps-td--label">{MECHANIC_LABELS[key]}</td>
                    <td className="v6ps-td--val">{base.toFixed(2)}</td>
                    <td className="v6ps-td--val">{fwd.toFixed(2)}</td>
                    <td className="v6ps-td--val">{final.toFixed(2)}</td>
                    <td className={`v6ps-td--delta ${deltaClass(final - base)}`}>
                      {formatDelta(final - base)}
                    </td>
                    <td className="v6ps-td--contrib">
                      <ContributionBar deltas={deltas} maxAbs={maxAbs} />
                      {deltas.length > 0 && (
                        <div className="v6ps-contrib-labels">
                          {deltas.map((d, i) => (
                            <span key={i} className="v6ps-contrib-label" style={{ color: ELEMENT_COLORS[d.element] }}>
                              位{d.slot + 1}{d.pass === 'forward' ? '前' : '后'}{formatDelta(d.delta)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dominant contributions summary */}
      {(dominantFwdId || dominantBwdId) && (
        <div className="v6ps-dominant">
          {(() => {
            const fwdCt = dominantFwdId ? contributions.find((c) => c.id === dominantFwdId) : undefined;
            const bwdCt = dominantBwdId ? contributions.find((c) => c.id === dominantBwdId) : undefined;
            return (
              <>
                {fwdCt && (
                  <span className="v6ps-dominant__item v6ps-dominant__item--fwd">
                    主导前向：位{fwdCt.sourceSlot + 1} {ELEMENT_LABELS_V6[fwdCt.sourceElement]} → 位{fwdCt.targetSlot + 1}「{fwdCt.reactionName}」[{fwdCt.id}]
                  </span>
                )}
                {bwdCt && (
                  <span className="v6ps-dominant__item v6ps-dominant__item--bwd">
                    主导后向：位{bwdCt.sourceSlot + 1} {ELEMENT_LABELS_V6[bwdCt.sourceElement]} → 位{bwdCt.targetSlot + 1}「{bwdCt.reactionName}」[{bwdCt.id}]
                  </span>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
