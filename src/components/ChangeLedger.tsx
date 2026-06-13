// src/components/ChangeLedger.tsx
// V6-3: 构筑变化账本条
// 依据: docs/v6/presentation-and-migration.md §6.3

import type { SkillDiff } from '../types/v6.ts';
import { STAT_LABELS, MECHANIC_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { VISUAL_CUE_LABELS } from '../data/v6/namingLexicon.ts';

interface ChangeLedgerProps {
  diffs: SkillDiff[] | null;
  prevSeedIds: string[];
  currSeedIds: string[];
}

export function ChangeLedger({ diffs, prevSeedIds, currSeedIds }: ChangeLedgerProps) {
  if (!diffs || diffs.length === 0) {
    return (
      <section className="panel change-ledger">
        <div className="panel-heading">
          <span className="section-eyebrow">BUILD DIFF</span>
          <h3>构筑变化账本</h3>
        </div>
        <p className="change-ledger__empty">
          修改构筑序列后，这里会展示每个技能的变化。
        </p>
      </section>
    );
  }

  const sequenceChanged = prevSeedIds.join(',') !== currSeedIds.join(',');

  return (
    <section className="panel change-ledger">
      <div className="panel-heading">
        <span className="section-eyebrow">BUILD DIFF</span>
        <h3>构筑变化账本</h3>
        {sequenceChanged && <span className="change-ledger__badge">已变化</span>}
      </div>

      {!sequenceChanged && (
        <p className="change-ledger__empty">序列未变，技能结果与上次相同。</p>
      )}

      {diffs.map((diff) => {
        const slotMoved = diff.slotA !== diff.slotB;
        const hasChanges = diff.statDiffs.length > 0 || diff.mechanicDiffs.length > 0 ||
          diff.forwardCueChanged || diff.backwardCueChanged;

        return (
          <div key={diff.occurrenceKey} className="change-ledger__item">
            <div className="change-ledger__item-header">
              <strong>{diff.baseName}</strong>
              {slotMoved && (
                <span className="change-ledger__slot-move">
                  Slot {diff.slotA + 1} → Slot {diff.slotB + 1}
                </span>
              )}
              {!hasChanges && <span className="change-ledger__no-change">无变化</span>}
            </div>

            <p className="change-ledger__identity-note">
              基础主效果与施放形态保持不变，以下变化来自新的互馈位置。
            </p>

            {diff.generatedNameA !== diff.generatedNameB && (
              <div className="change-ledger__name-change">
                <span>名称</span>
                <del>{diff.generatedNameA}</del>
                <i>→</i>
                <strong>{diff.generatedNameB}</strong>
              </div>
            )}

            {/* Stat changes */}
            {diff.statDiffs.length > 0 && (
              <div className="change-ledger__deltas">
                {diff.statDiffs.slice(0, 5).map((d) => {
                  const label = STAT_LABELS[d.key];
                  const sign = d.delta > 0 ? '+' : '';
                  return (
                    <span
                      key={d.key}
                      className={`change-ledger__delta ${d.delta > 0 ? 'delta--up' : 'delta--down'}`}
                    >
                      {label} {(d.valueA * 100).toFixed(0)} → {(d.valueB * 100).toFixed(0)}
                      {' '}({sign}{(d.delta * 100).toFixed(0)})
                    </span>
                  );
                })}
                {diff.statDiffs.length > 5 && (
                  <span className="change-ledger__more">+{diff.statDiffs.length - 5} 项</span>
                )}
              </div>
            )}

            {/* Mechanic changes */}
            {diff.mechanicDiffs.length > 0 && (
              <div className="change-ledger__deltas">
                {diff.mechanicDiffs.slice(0, 3).map((d) => {
                  const label = MECHANIC_LABELS[d.key];
                  const crossedOn = d.valueA < 0.15 && d.valueB >= 0.15;
                  const crossedOff = d.valueA >= 0.15 && d.valueB < 0.15;
                  const changeKind = crossedOn
                    ? '新增'
                    : crossedOff
                      ? '移除'
                      : d.delta > 0
                        ? '强化'
                        : '弱化';
                  return (
                    <span
                      key={d.key}
                      className={`change-ledger__delta ${d.delta > 0 ? 'delta--up' : 'delta--down'}`}
                    >
                      {changeKind}机制：{label} {(d.valueA * 100).toFixed(0)} → {(d.valueB * 100).toFixed(0)}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Cue changes */}
            {(diff.forwardCueChanged || diff.backwardCueChanged) && (
              <div className="change-ledger__cues">
                {diff.forwardCueChanged && (
                  <span>
                    前向动画：{diff.forwardCueA ? VISUAL_CUE_LABELS[diff.forwardCueA] : '无'}
                    {' → '}
                    {diff.forwardCueB ? VISUAL_CUE_LABELS[diff.forwardCueB] : '无'}
                  </span>
                )}
                {diff.backwardCueChanged && (
                  <span>
                    后向余韵：{diff.backwardCueA ? VISUAL_CUE_LABELS[diff.backwardCueA] : '无'}
                    {' → '}
                    {diff.backwardCueB ? VISUAL_CUE_LABELS[diff.backwardCueB] : '无'}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
