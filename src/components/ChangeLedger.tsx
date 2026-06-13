// src/components/ChangeLedger.tsx
// V6-3: 构筑变化账本条
// 依据: docs/v6/presentation-and-migration.md §6.3

import type { SkillDiff, StatKey, MechanicKey } from '../types/v6.ts';
import { STAT_LABELS, MECHANIC_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';

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
              <strong>{diff.seedId}</strong>
              {slotMoved && (
                <span className="change-ledger__slot-move">
                  Slot {diff.slotA + 1} → Slot {diff.slotB + 1}
                </span>
              )}
              {!hasChanges && <span className="change-ledger__no-change">无变化</span>}
            </div>

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
                      {label} {sign}{(d.delta * 100).toFixed(0)}
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
                  const sign = d.delta > 0 ? '+' : '';
                  return (
                    <span
                      key={d.key}
                      className={`change-ledger__delta ${d.delta > 0 ? 'delta--up' : 'delta--down'}`}
                    >
                      {label} {sign}{(d.delta * 100).toFixed(0)}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Cue changes */}
            {(diff.forwardCueChanged || diff.backwardCueChanged) && (
              <div className="change-ledger__cues">
                {diff.forwardCueChanged && <span>前向 Cue 变化</span>}
                {diff.backwardCueChanged && <span>后向 Cue 变化</span>}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
