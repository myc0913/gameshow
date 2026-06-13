// src/components/ComparePanel.tsx
// V6-3: seed 对齐对比 + diffBuilds 纯函数

import type { GeneratedBuild } from '../types/v6.ts';
import { diffBuilds } from '../engine/v6/diffBuilds.ts';
import { STAT_LABELS, ELEMENT_LABELS_V6 } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';
import { VISUAL_CUE_LABELS } from '../data/v6/namingLexicon.ts';

interface ComparePanelProps {
  buildA: GeneratedBuild | null;
  buildB: GeneratedBuild | null;
  onClear: (slot: 'A' | 'B') => void;
  onReplay: (slot: 'A' | 'B') => void;
}

export function ComparePanel({
  buildA,
  buildB,
  onClear,
  onReplay,
}: ComparePanelProps) {
  const diffs = buildA && buildB ? diffBuilds(buildA, buildB) : null;

  return (
    <section className="panel compare-panel">
      <div className="compare-panel__heading">
        <div>
          <span className="section-eyebrow">BUILD COMPARISON</span>
          <h3>同源种子 · 顺序差异</h3>
        </div>
        <p>对照两套完整的四技能 Build，变化来自排列后的互馈拓扑。</p>
      </div>

      {!buildA && !buildB ? (
        <div className="compare-empty">
          <div className="compare-empty__tracks" aria-hidden="true">
            <span>A</span><i /><i /><i /><i />
            <span>B</span><i /><i /><i /><i />
          </div>
          <p>将当前构筑存入对照栏，或载入默认 A/B 案例。</p>
        </div>
      ) : (
        <div className="compare-builds">
          <BuildRow
            slot="A"
            build={buildA}
            onClear={() => onClear('A')}
            onReplay={() => onReplay('A')}
          />
          <BuildRow
            slot="B"
            build={buildB}
            onClear={() => onClear('B')}
            onReplay={() => onReplay('B')}
          />
        </div>
      )}

      {/* Seed-aligned diff summary */}
      {diffs && diffs.length > 0 && (
        <div className="compare-diff-summary">
          <p className="subsection-label">构筑差异（按种子对齐）</p>
          {diffs.map((diff) => {
            const slotMoved = diff.slotA !== diff.slotB;
            const totalDelta = diff.statDiffs.reduce((sum, d) => sum + Math.abs(d.delta), 0);
            return (
              <div key={diff.occurrenceKey} className="compare-diff-item">
                <div className="compare-diff-item__head">
                  <strong>{diff.baseName}</strong>
                  <span>A: Slot {diff.slotA + 1}</span>
                  <span>B: Slot {diff.slotB + 1}</span>
                  {slotMoved && <em>移位</em>}
                  <span className="compare-diff-item__total-delta">
                    Σ|Δ| = {totalDelta.toFixed(2)}
                  </span>
                </div>
                {diff.generatedNameA !== diff.generatedNameB && (
                  <div className="compare-diff-item__name">
                    {diff.generatedNameA} → {diff.generatedNameB}
                  </div>
                )}
                {diff.statDiffs.length > 0 && (
                  <div className="compare-diff-item__stats">
                    {diff.statDiffs.slice(0, 5).map((d) => {
                      const label = STAT_LABELS[d.key];
                      const sign = d.delta > 0 ? '+' : '';
                      return (
                        <span key={d.key} className={d.delta > 0.01 ? 'delta--up' : d.delta < -0.01 ? 'delta--down' : ''}>
                          {label} {sign}{(d.delta * 100).toFixed(0)}
                        </span>
                      );
                    })}
                  </div>
                )}
                {(diff.forwardCueChanged || diff.backwardCueChanged) && (
                  <div className="compare-diff-item__cues">
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
        </div>
      )}
    </section>
  );
}

function BuildRow({
  slot,
  build,
  onClear,
  onReplay,
}: {
  slot: 'A' | 'B';
  build: GeneratedBuild | null;
  onClear: () => void;
  onReplay: () => void;
}) {
  if (!build) {
    return (
      <div className="compare-build-row is-empty">
        <div className="compare-build-row__label">
          <strong>{slot}</strong>
          <span>等待构筑</span>
        </div>
        <p>从技能详情中存入当前 Build</p>
      </div>
    );
  }

  return (
    <div className={`compare-build-row compare-build-row--${slot.toLowerCase()}`}>
      <div className="compare-build-row__label">
        <strong>{slot}</strong>
        <span>构筑 {slot}</span>
        <small>{build.input.seedIds.join(' → ')}</small>
        <div className="compare-build-row__actions">
          <button onClick={onReplay}>演示</button>
          <button onClick={onClear}>移除</button>
        </div>
      </div>

      <div className="compare-skill-grid">
        {build.skills.map((skill, index) => {
          const color = ELEMENT_COLORS[skill.primaryElement];
          return (
            <article
              key={`${slot}-${skill.seedId}-${index}`}
              className="compare-skill-card"
              style={{ '--compare-color': color } as React.CSSProperties}
            >
              <div className="compare-skill-card__topline">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <small>
                  {ELEMENT_LABELS_V6[skill.primaryElement]} · {skill.baseName}
                </small>
              </div>
              <h4>{skill.generatedName}</h4>
              <p>{skill.coreEffect}</p>
              <div className="compare-skill-card__tags">
                {skill.tags.slice(0, 3).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
