// src/components/RunePool.tsx
// V6-3: 24 个 BaseSkillDefinition + 元素/形态筛选

import { useState, useMemo } from 'react';
import type { ElementKey, SkillForm } from '../types/v6.ts';
import { ELEMENT_KEYS } from '../types/v6.ts';
import { BASE_SKILLS } from '../data/v6/baseSkills.ts';
import { ELEMENT_COLORS, ELEMENT_LABELS } from '../data/vectorDims.ts';
import { FORM_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';

interface RunePoolProps {
  onAddSeed: (seedId: string) => void;
}

const ELEMENT_NAMES: Record<ElementKey, string> = {
  fire: '离火', frost: '玄冰', lightning: '惊雷',
  stone: '厚土', shadow: '幽影', wind: '罡风',
};

const FORM_KEYS: SkillForm[] = [
  'projectile', 'cone', 'zone', 'chain', 'movement',
  'construct', 'mark', 'summon', 'line',
];

export function RunePool({ onAddSeed }: RunePoolProps) {
  const [expandedElement, setExpandedElement] = useState<ElementKey | null>(null);
  const [formFilter, setFormFilter] = useState<SkillForm | 'all'>('all');

  const seedsByElement = useMemo(() => {
    const map = new Map<ElementKey, typeof BASE_SKILLS>();
    for (const el of ELEMENT_KEYS) {
      map.set(el, BASE_SKILLS.filter((s) => s.element === el));
    }
    return map;
  }, []);

  const handleElementClick = (el: ElementKey) => {
    setExpandedElement(expandedElement === el ? null : el);
  };

  const handleAspectClick = (seedId: string) => {
    onAddSeed(seedId);
  };

  return (
    <div className="panel seed-library">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">SKILL SEEDS</span>
          <h3>技能种子</h3>
        </div>
        <span className="panel-heading__count">6 系 · 24 枚</span>
      </div>
      <p className="panel-intro">选择元素展开，选择种子填入构筑序列。</p>

      {/* 形态筛选 */}
      <div className="seed-form-filter">
        <button
          className={`seed-form-btn ${formFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setFormFilter('all')}
        >
          全部
        </button>
        {FORM_KEYS.map((f) => (
          <button
            key={f}
            className={`seed-form-btn ${formFilter === f ? 'is-active' : ''}`}
            onClick={() => setFormFilter(f)}
          >
            {FORM_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      <div className="rune-pool-list">
        {ELEMENT_KEYS.map((el) => {
          const allSeeds = seedsByElement.get(el) ?? [];
          const seeds = formFilter === 'all'
            ? allSeeds
            : allSeeds.filter((s) => s.form === formFilter);
          const isExpanded = expandedElement === el;

          return (
            <div key={el} className="seed-group">
              <button
                className={`seed-element-btn ${isExpanded ? 'seed-element-btn--expanded' : ''}`}
                style={{ borderLeft: `4px solid ${ELEMENT_COLORS[el]}` }}
                onClick={() => handleElementClick(el)}
              >
                <span className="seed-element__symbol" style={{ color: ELEMENT_COLORS[el] }}>
                  {ELEMENT_LABELS[el]}
                </span>
                <span className="seed-element__name">{ELEMENT_NAMES[el]}</span>
                <span className="seed-element__count">{seeds.length}</span>
                <span className="seed-element__expand">{isExpanded ? '▾' : '▸'}</span>
              </button>

              {isExpanded && (
                <div className="seed-aspects">
                  {seeds.length === 0 ? (
                    <p className="seed-aspects__empty">无匹配技能种子</p>
                  ) : (
                    seeds.map((seed) => (
                      <button
                        key={seed.id}
                        className="seed-aspect-btn"
                        onClick={() => handleAspectClick(seed.id)}
                        title={seed.coreEffect}
                        style={{ borderColor: ELEMENT_COLORS[el] }}
                      >
                        <span className="seed-aspect__name">{seed.name}</span>
                        <span className="seed-aspect__type">
                          {FORM_LABELS[seed.form] ?? seed.form}
                        </span>
                        <span className="seed-aspect__behaviors">
                          {seed.aspect}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="pool-hint">
        种子可以重复选择，用于验证极端构筑。
      </div>
    </div>
  );
}
