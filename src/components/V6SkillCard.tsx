// src/components/V6SkillCard.tsx
// V6-3: 技能结果卡 — 收起态 + 展开态
// 依据: docs/v6/presentation-and-migration.md §6.2

import { useState } from 'react';
import type { GeneratedSkill, ContributionTrace, StatKey, MechanicKey } from '../types/v6.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../types/v6.ts';
import {
  STAT_LABELS,
  MECHANIC_LABELS,
  ELEMENT_LABELS_V6,
  FORM_LABELS,
} from '../engine/v6/finalizeGeneratedSkill.ts';
import { getMechanicValue } from '../engine/v6/math.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';
import { VISUAL_CUE_LABELS } from '../data/v6/namingLexicon.ts';

interface V6SkillCardProps {
  skill: GeneratedSkill;
  slotIndex: number;
  contributions: ContributionTrace[];
  isActive: boolean;
  onSelect: () => void;
}

const DIRECTION_SYMBOL: Record<string, string> = {
  increase: '↑',
  decrease: '↓',
  mixed: '↕',
};

export function V6SkillCard({
  skill,
  slotIndex,
  contributions,
  isActive,
  onSelect,
}: V6SkillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = ELEMENT_COLORS[skill.primaryElement];

  // Top 3 changes (sorted by |delta|)
  const topChanges = [...skill.changes]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  // Top 2 mechanics (sorted by final value)
  const topMechanics = MECHANIC_KEYS
    .map((k) => ({ key: k, value: getMechanicValue(skill.finalMechanics, k) }))
    .filter((m) => m.value >= 0.10)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const mechanicChanges = MECHANIC_KEYS
    .map((key) => {
      const base = getMechanicValue(skill.baseMechanics, key);
      const final = getMechanicValue(skill.finalMechanics, key);
      return { key, base, final, delta: final - base };
    })
    .filter((item) => Math.abs(item.delta) >= 0.02)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const gainedMechanics = mechanicChanges.filter(
    (item) => item.delta > 0 && item.base < 0.15 && item.final >= 0.15,
  );
  const weakenedMechanics = mechanicChanges.filter(
    (item) => item.delta < -0.02 && item.base >= 0.15,
  );
  const hasMutualFeedback = skill.changes.length > 0 ||
    Boolean(skill.animation.forwardCue || skill.animation.backwardCue);

  // Source summary
  const sourceSlots = new Set<number>();
  for (const c of contributions) {
    if (c.targetSlot === slotIndex && c.acceptedDelta !== 0) {
      sourceSlots.add(c.sourceSlot);
    }
  }
  const forwardSources = [...sourceSlots].filter((s) => s < slotIndex);
  const backwardSources = [...sourceSlots].filter((s) => s > slotIndex);

  // Dominant forward reaction
  const domFwd = contributions.find(
    (c) => c.targetSlot === slotIndex && c.pass === 'forward' && c.acceptedDelta !== 0,
  );

  // Dominant backward reaction
  const domBwd = contributions.find(
    (c) => c.targetSlot === slotIndex && c.pass === 'backward' && c.acceptedDelta !== 0,
  );

  return (
    <article
      className={`v6-skill-card ${isActive ? 'v6-skill-card--active' : ''} ${expanded ? 'v6-skill-card--expanded' : ''}`}
      style={{ '--skill-color': color } as React.CSSProperties}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`预览技能 ${skill.generatedName}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {/* === Collapsed content === */}
      <div className="v6-skill-card__header">
        <span className="v6-skill-card__slot">Slot {slotIndex + 1}</span>
        <h3 className="v6-skill-card__name">{skill.generatedName}</h3>
      </div>

      <p className="v6-skill-card__identity">
        <span className="v6-skill-card__element">{ELEMENT_LABELS_V6[skill.primaryElement]}</span>
        <span className="v6-skill-card__separator">/</span>
        <span className="v6-skill-card__form">{FORM_LABELS[skill.form] ?? skill.form}</span>
      </p>

      <div className="v6-skill-card__effect-summary">
        <div className="v6-skill-card__effect-base">
          <span>基础主效果保持</span>
          <strong>{skill.coreEffect}</strong>
        </div>
        <p className="v6-skill-card__description">
          {hasMutualFeedback
            ? skill.description
            : '当前没有其他技能位参与互馈，名称、机制和动画均保持基础状态。'}
        </p>
        {hasMutualFeedback && (
          <div className="v6-skill-card__semantic-changes">
            <span className="v6-skill-card__semantic-chip">
              施放形态仍为 {FORM_LABELS[skill.form] ?? skill.form}
            </span>
            {gainedMechanics.slice(0, 2).map((item) => (
              <span key={`gain-${item.key}`} className="v6-skill-card__semantic-chip semantic--gain">
                新增机制：{MECHANIC_LABELS[item.key]}
              </span>
            ))}
            {weakenedMechanics.slice(0, 2).map((item) => (
              <span key={`loss-${item.key}`} className="v6-skill-card__semantic-chip semantic--loss">
                弱化机制：{MECHANIC_LABELS[item.key]}
              </span>
            ))}
            {skill.animation.forwardCue && (
              <span className="v6-skill-card__semantic-chip semantic--visual">
                前向动画：{VISUAL_CUE_LABELS[skill.animation.forwardCue.visualCue]}
              </span>
            )}
            {skill.animation.backwardCue && (
              <span className="v6-skill-card__semantic-chip semantic--visual">
                后向余韵：{VISUAL_CUE_LABELS[skill.animation.backwardCue.visualCue]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Top 3 changes */}
      {topChanges.length > 0 && (
        <div className="v6-skill-card__changes">
          {topChanges.map((ch) => {
            const label = ch.kind === 'stat'
              ? STAT_LABELS[ch.key as StatKey]
              : MECHANIC_LABELS[ch.key as MechanicKey];
            const sign = ch.delta > 0 ? '+' : '';
            const deltaClass = ch.direction === 'increase' ? 'delta--up' :
                               ch.direction === 'decrease' ? 'delta--down' : 'delta--mixed';
            return (
              <div key={ch.key} className="v6-skill-card__change-row">
                <span className="v6-skill-card__change-label">{label ?? ch.key}</span>
                <span className="v6-skill-card__change-values">
                  <span className="v6-skill-card__change-base">
                    {(ch.baseValue * 100).toFixed(0)}
                  </span>
                  <span className="v6-skill-card__change-arrow">→</span>
                  <span className="v6-skill-card__change-final">
                    {(ch.finalValue * 100).toFixed(0)}
                  </span>
                </span>
                <span className={`v6-skill-card__change-delta ${deltaClass}`}>
                  {DIRECTION_SYMBOL[ch.direction] ?? ''} {sign}{(ch.delta * 100).toFixed(0)}
                </span>
                {/* Mini change bar */}
                <div className="v6-skill-card__change-bar">
                  <div
                    className="v6-skill-card__change-bar-fill"
                    style={{ width: `${Math.min(100, Math.abs(ch.delta) * 200)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top 2 mechanics */}
      {topMechanics.length > 0 && (
        <div className="v6-skill-card__mechanics">
          {topMechanics.map((m) => {
            const label = MECHANIC_LABELS[m.key];
            return (
              <span key={m.key} className="v6-skill-card__mech-tag">
                {label ?? m.key}
              </span>
            );
          })}
        </div>
      )}

      {/* Source summary */}
      {(forwardSources.length > 0 || backwardSources.length > 0) && (
        <p className="v6-skill-card__sources">
          来源：
          {forwardSources.length > 0 && (
            <span>
              {forwardSources.map((s) => `Slot ${s + 1}`).join(', ')}
              （前向）
            </span>
          )}
          {forwardSources.length > 0 && backwardSources.length > 0 && ' / '}
          {backwardSources.length > 0 && (
            <span>
              {backwardSources.map((s) => `Slot ${s + 1}`).join(', ')}
              （后向）
            </span>
          )}
        </p>
      )}

      {/* Expand button */}
      <button
        className="v6-skill-card__expand-btn"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      >
        {expanded ? '收起详情' : '查看推演'}
      </button>

      {/* === Expanded content === */}
      {expanded && (
        <div className="v6-skill-card__expanded">
          {/* Full stats: base → forward → final */}
          <div className="v6-skill-card__params-table">
            <div className="v6-skill-card__params-header">
              <span>参数</span><span>基础</span><span>前向</span><span>最终</span><span>Δ</span>
            </div>
            {STAT_KEYS.map((key) => {
              const base = skill.baseStats[key];
              const fwd = skill.forwardStats[key];
              const final = skill.finalStats[key];
              const delta = final - base;
              if (Math.abs(base) < 0.005 && Math.abs(fwd) < 0.005 && Math.abs(final) < 0.005) return null;
              return (
                <div key={key} className="v6-skill-card__param-row">
                  <span className="v6-skill-card__param-label">{STAT_LABELS[key]}</span>
                  <span>{(base * 100).toFixed(0)}</span>
                  <span className={Math.abs(fwd - base) > 0.005 ? 'has-change' : ''}>
                    {(fwd * 100).toFixed(0)}
                  </span>
                  <span className={Math.abs(delta) > 0.005 ? 'has-change' : ''}>
                    {(final * 100).toFixed(0)}
                  </span>
                  <span className={delta > 0.005 ? 'delta--up' : delta < -0.005 ? 'delta--down' : ''}>
                    {delta > 0.005 ? '+' : delta < -0.005 ? '' : ''}
                    {(delta * 100).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* All mechanics */}
          <div className="v6-skill-card__all-mechanics">
            <p className="subsection-label">全部机制</p>
            <div className="v6-skill-card__mech-grid">
              {MECHANIC_KEYS.map((key) => {
                const val = getMechanicValue(skill.finalMechanics, key);
                const baseVal = getMechanicValue(skill.baseMechanics, key);
                if (val < 0.01 && baseVal < 0.01) return null;
                const delta = val - baseVal;
                return (
                  <span
                    key={key}
                    className={`v6-skill-card__mech-item ${delta > 0.01 ? 'mech--gained' : delta < -0.01 ? 'mech--lost' : ''}`}
                    title={`${MECHANIC_LABELS[key]}: ${(baseVal * 100).toFixed(0)} → ${(val * 100).toFixed(0)}`}
                  >
                    {MECHANIC_LABELS[key]} {(val * 100).toFixed(0)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Reaction details */}
          <div className="v6-skill-card__reactions">
            {domFwd && (
              <p>
                <strong>前向主反应：</strong>
                {ELEMENT_LABELS_V6[domFwd.sourceElement]} → {ELEMENT_LABELS_V6[domFwd.targetElement]}
                「{domFwd.reactionName}」
              </p>
            )}
            {domBwd && (
              <p>
                <strong>后向主修饰：</strong>
                {ELEMENT_LABELS_V6[domBwd.sourceElement]} → {ELEMENT_LABELS_V6[domBwd.targetElement]}
                「{domBwd.reactionName}」
              </p>
            )}
          </div>

          {/* Animation legend */}
          {skill.animation && (
            <div className="v6-skill-card__animation-legend">
              <span>主体：{ELEMENT_LABELS_V6[skill.animation.primaryElement]} / {FORM_LABELS[skill.animation.form] ?? skill.animation.form}</span>
              {skill.animation.forwardCue && (
                <span>
                  前向 Cue：{ELEMENT_LABELS_V6[skill.animation.forwardCue.sourceElement]} → {ELEMENT_LABELS_V6[skill.primaryElement]}
                  「{VISUAL_CUE_LABELS[skill.animation.forwardCue.visualCue]}」
                </span>
              )}
              {skill.animation.backwardCue && (
                <span>
                  后向 Cue：{ELEMENT_LABELS_V6[skill.animation.backwardCue.sourceElement]} → {ELEMENT_LABELS_V6[skill.primaryElement]}
                  「{VISUAL_CUE_LABELS[skill.animation.backwardCue.visualCue]}」
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
