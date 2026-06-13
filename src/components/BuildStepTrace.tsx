// src/components/BuildStepTrace.tsx
// V6 分步构筑溯源面板 — 展示每新增一个种子后已有技能发生了哪些变化
// 依据: docs/v6/presentation-and-migration.md §6.3

import type { GeneratedBuild } from '../types/v6.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../types/v6.ts';
import { ELEMENT_LABELS_V6, STAT_LABELS, MECHANIC_LABELS, FORM_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';
import { getBaseSkill } from '../data/v6/baseSkills.ts';
import { DeltaBar } from './DeltaBar.tsx';

interface BuildStepTraceProps {
  /** Incremental builds: [1-seed, 2-seed, 3-seed, 4-seed] */
  incrementalBuilds: GeneratedBuild[];
  /** Seed IDs for display (full 4-seed list) */
  seedIds: string[];
}

export function BuildStepTrace({ incrementalBuilds, seedIds }: BuildStepTraceProps) {
  if (incrementalBuilds.length < 2) {
    return (
      <div style={{ color: 'var(--mist-500)', fontSize: '0.82rem', padding: '16px 0' }}>
        需要至少 2 个种子才能展示分步变化。
      </div>
    );
  }

  return (
    <div className="build-step-trace">
      <p className="step-intro" style={{ marginBottom: '16px' }}>
        逐种子填入后，观察<strong>已有技能的参数和机制变化</strong>。
        每步新增一个种子，其前后种子的统计值和机制都会受到互馈影响。
      </p>

      {incrementalBuilds.map((step, stepIdx) => {
        if (stepIdx === 0) return null; // Skip first step
        const prevStep = incrementalBuilds[stepIdx - 1];
        const newSeedId = step.input.seedIds[stepIdx] ?? seedIds[stepIdx];
        if (!newSeedId) return null;
        const newSeed = getBaseSkill(newSeedId);
        const color = ELEMENT_COLORS[newSeed.element];

        return (
          <div key={stepIdx} className="step-diff-section">
            <h4 className="step-diff-section__title">
              <span className="step-diff-section__badge" style={{ background: color }}>
                +{ELEMENT_LABELS_V6[newSeed.element]}·{newSeed.name}
              </span>
              <span style={{ color: 'var(--mist-300)', fontSize: '0.72rem', fontWeight: 400 }}>
                种子 {stepIdx + 1} → 构筑从 {stepIdx} 技能位扩展到 {stepIdx + 1} 技能位
              </span>
            </h4>

            <div className="step-diff-grid">
              {step.skills.map((skill, i) => {
                const prevSkill = prevStep.skills[i];
                const isNewSlot = !prevSkill;
                const baseSkill = getBaseSkill(skill.seedId);

                if (isNewSlot) {
                  return (
                    <div key={i} className="step-diff-card step-diff-card--new">
                      <div className="step-diff-card__header">
                        <span className="step-diff-card__index">位{i + 1}</span>
                        <span style={{ color: 'var(--jade-300)', fontSize: '0.62rem' }}>新增技能</span>
                      </div>
                      <span className="step-diff-card__name">{skill.generatedName}</span>
                      <span className="step-diff-card__ability" style={{ color: 'var(--jade-400)' }}>
                        {ELEMENT_LABELS_V6[skill.primaryElement]}·{FORM_LABELS[skill.form] ?? skill.form}
                      </span>
                      <span style={{ color: 'var(--mist-400)', fontSize: '0.62rem' }}>
                        {skill.coreEffect}
                      </span>
                    </div>
                  );
                }

                // Existing skill — show changes via diff
                const nameChanged = skill.generatedName !== prevSkill.generatedName;

                // Collect stat diffs (sorted by |delta|)
                const statDiffs = STAT_KEYS
                  .map((k) => ({
                    key: k,
                    valueA: prevSkill.finalStats[k],
                    valueB: skill.finalStats[k],
                  }))
                  .filter((d) => Math.abs(d.valueB - d.valueA) > 0.005)
                  .sort((a, b) => Math.abs(b.valueB - b.valueA) - Math.abs(a.valueB - a.valueA))
                  .slice(0, 5);

                // Collect mechanic diffs
                const mechDiffs = MECHANIC_KEYS
                  .map((k) => ({
                    key: k,
                    valueA: prevSkill.finalMechanics[k] ?? 0,
                    valueB: skill.finalMechanics[k] ?? 0,
                  }))
                  .filter((d) => Math.abs(d.valueB - d.valueA) > 0.005)
                  .sort((a, b) => Math.abs(b.valueB - b.valueA) - Math.abs(a.valueB - a.valueA))
                  .slice(0, 5);

                const hasAnyChange = statDiffs.length > 0 || mechDiffs.length > 0 || nameChanged;

                return (
                  <div key={i} className="step-diff-card">
                    <div className="step-diff-card__header">
                      <span className="step-diff-card__index">位{i + 1}</span>
                      <span
                        className="step-diff-card__seed"
                        style={{ color: color }}
                      >
                        {baseSkill?.name ?? skill.seedId}
                      </span>
                    </div>

                    {nameChanged && (
                      <div className="step-diff-card__change">
                        <span className="step-diff-card__old">{prevSkill.generatedName}</span>
                        <span style={{ color: 'var(--mist-500)', margin: '0 4px' }}>→</span>
                        <span className="step-diff-card__new">{skill.generatedName}</span>
                      </div>
                    )}

                    {statDiffs.length > 0 && (
                      <div className="step-diff-card__behaviors">
                        {statDiffs.map((d) => (
                          <DeltaBar
                            key={`stat-${d.key}`}
                            label={STAT_LABELS[d.key]}
                            valueA={d.valueA}
                            valueB={d.valueB}
                            maxValue={1}
                          />
                        ))}
                      </div>
                    )}

                    {mechDiffs.length > 0 && (
                      <div className="step-diff-card__behaviors">
                        {mechDiffs.map((d) => (
                          <DeltaBar
                            key={`mech-${d.key}`}
                            label={MECHANIC_LABELS[d.key]}
                            valueA={d.valueA}
                            valueB={d.valueB}
                            maxValue={1}
                          />
                        ))}
                      </div>
                    )}

                    {!hasAnyChange && (
                      <span style={{ color: 'var(--mist-500)', fontSize: '0.62rem' }}>
                        无显著变化
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
