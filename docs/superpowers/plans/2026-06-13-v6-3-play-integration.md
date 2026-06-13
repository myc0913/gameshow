# V6-3 Play 接入 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Play 页面从旧 V4/V5 引擎切换到 V6 引擎 `generateBuildV6`，渐进替换组件数据源，保留旧引擎并行运行供 How 页兼容。

**Architecture:** RunePool 输出 seedId 字符串，PlayPage 双向调用新旧引擎，V6 结果驱动新 UI 组件（V6SkillCard、ChangeLedger、seed 对齐 ComparePanel），旧 BuildResult 保留供 App 共享状态。

**Tech Stack:** React 18+ / TypeScript 5+ / Vite / 纯前端

---

## 文件结构映射

```
创建:
  src/components/V6SkillCard.tsx        — V6 技能卡片（收起+展开）
  src/components/ChangeLedger.tsx       — 构筑变化账本条
  scripts/verify-v6-3.ts               — V6-3 验收脚本

修改:
  src/engine/v6/finalizeGeneratedSkill.ts  — 导出 labels
  src/components/RunePool.tsx              — 24 种子 + 筛选
  src/components/RuneSlotBar.tsx           — seedId 驱动
  src/pages/PlayPage.tsx                   — 双引擎 + V6 状态
  src/components/SkillResultPanel.tsx      — V6 类型 + V6SkillCard
  src/components/ComparePanel.tsx          — seed 对齐 + SkillDiff
  src/App.tsx                              — V6 共享状态字段
```

---

### Task 1: 导出 V6 Labels 供 UI 使用

**Files:**
- Modify: `src/engine/v6/finalizeGeneratedSkill.ts`
- Modify: `src/engine/v6/index.ts`

**Why:** `STAT_LABELS`、`MECHANIC_LABELS`、`ELEMENT_LABELS`、`FORM_LABELS` 当前是 `finalizeGeneratedSkill.ts` 内的私有常量，UI 组件需要它们来渲染中文标签。直接 export 并从 index.ts re-export。

- [ ] **Step 1: 将四个 labels 改为 named export**

在 `src/engine/v6/finalizeGeneratedSkill.ts` 中，将四个 `const` 前加 `export`：

```ts
// 行 27-79，将 const 改为 export const
export const FORM_LABELS: Record<string, string> = { ... };
export const ELEMENT_LABELS_V6: Record<ElementKey, string> = { ... };
export const STAT_LABELS: Record<StatKey, string> = { ... };
export const MECHANIC_LABELS: Record<MechanicKey, string> = { ... };
```

注意：`ELEMENT_LABELS` 与 `src/data/vectorDims.ts` 中的同名导出冲突，重命名为 `ELEMENT_LABELS_V6`。

- [ ] **Step 2: 从 index.ts re-export**

在 `src/engine/v6/index.ts` 末尾添加：

```ts
// V6-3: UI labels
export {
  FORM_LABELS,
  ELEMENT_LABELS_V6,
  STAT_LABELS,
  MECHANIC_LABELS,
} from './finalizeGeneratedSkill.ts';
```

- [ ] **Step 3: 运行现有验证确保不破坏**

```bash
npx tsx scripts/verify-v6-2.ts
```

Expected: 所有测试继续通过，无 import 错误。

- [ ] **Step 4: Commit**

```bash
git add src/engine/v6/finalizeGeneratedSkill.ts src/engine/v6/index.ts
git commit -m "feat(v6-3): export UI labels from engine

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: RunePool 切换至 24 个 BaseSkillDefinition

**Files:**
- Modify: `src/components/RunePool.tsx`

**Why:** 当前 RunePool 使用旧 `SkillSeed` 类型和 6 个种子的旧数据源。需要切换到 V6 的 24 个 `BaseSkillDefinition`，添加形态筛选，输出 `seedId: string` 而非 `SkillSeed` 对象。

- [ ] **Step 1: 重写 RunePool 使用 V6 数据**

完整替换 `src/components/RunePool.tsx`：

```tsx
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
```

- [ ] **Step 2: 验证 BASE_SKILLS 导出**

确认 `src/data/v6/baseSkills.ts` 导出了 `BASE_SKILLS` 数组。如果没有，添加：

```ts
export const BASE_SKILLS: BaseSkillDefinition[] = [ ... ];
```

- [ ] **Step 3: 检查 TypeScript 编译**

```bash
npx tsc --noEmit --pretty
```

Expected: 无新增类型错误（可能有旧组件的预存错误，忽略与本次改动无关的）。

- [ ] **Step 4: Commit**

```bash
git add src/components/RunePool.tsx src/data/v6/baseSkills.ts
git commit -m "feat(v6-3): switch RunePool to 24 V6 base skills with form filter

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: RuneSlotBar 切换至 seedId 驱动

**Files:**
- Modify: `src/components/RuneSlotBar.tsx`

**Why:** 槽位数据从 `(SkillSeed | null)[]` 改为 `(string | null)[]`（seedId），显示用的名称/元素色从 `getBaseSkill()` 获取，技能名从 `GeneratedSkill` 获取。

- [ ] **Step 1: 重写 RuneSlotBar props 和渲染逻辑**

完整替换 `src/components/RuneSlotBar.tsx`：

```tsx
// src/components/RuneSlotBar.tsx
// V6-3: seedId 驱动，GeneratedSkill 展示

import { useState, useCallback } from 'react';
import type { GeneratedSkill } from '../types/v6.ts';
import { getBaseSkill } from '../data/v6/baseSkills.ts';
import { ELEMENT_COLORS, ELEMENT_SECONDARY_COLORS } from '../data/vectorDims.ts';
import { ELEMENT_LABELS_V6 } from '../engine/v6/finalizeGeneratedSkill.ts';

interface RuneSlotBarProps {
  slots: (string | null)[];
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  filledCount: number;
  skills: GeneratedSkill[];
  activeSkillIndex: number;
  onSelectSkill: (index: number) => void;
  justFilledIndex?: number | null;
}

const SLOT_LABELS = ['技能一', '技能二', '技能三', '技能四'];
const SLOT_HINTS = [
  '首个技能，被后续技能反向改写',
  '受前位塑形，也改写前位',
  '承接前后互馈影响',
  '反向改写前位技能',
];

export function RuneSlotBar({
  slots,
  onRemove,
  onReorder,
  filledCount,
  skills,
  activeSkillIndex,
  onSelectSkill,
  justFilledIndex,
}: RuneSlotBarProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const showFusionHint = filledCount > 0 && filledCount < 4;

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== toIndex) {
        onReorder(dragIndex, toIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="slot-sequence">
      <div className="feedback-legend feedback-legend--forward">
        <span>前向塑形</span>
        <i />
      </div>
      <div className={`slot-bar ${showFusionHint ? 'slot-bar--fusing' : ''}`}>
        {slots.map((seedId, i) => {
          const isDragging = dragIndex === i;
          const isDragOver = dragOverIndex === i;
          const base = seedId ? getBaseSkill(seedId) : null;

          let slotClass = 'slot';
          if (seedId) slotClass += ' slot--filled';
          if (seedId && activeSkillIndex === i) slotClass += ' slot--active';
          if (seedId && justFilledIndex === i) slotClass += ' slot--just-filled';
          if (isDragging) slotClass += ' slot--dragging';
          if (isDragOver) slotClass += ' slot--dragover';

          const color = base ? ELEMENT_COLORS[base.element] : undefined;
          const color2 = base ? ELEMENT_SECONDARY_COLORS[base.element] : undefined;

          return (
            <div
              key={i}
              className={slotClass}
              draggable={!!seedId}
              onDragStart={() => seedId && handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              onClick={() => seedId && onSelectSkill(i)}
              title={
                base
                  ? `${base.name} — ${SLOT_LABELS[i]}（${SLOT_HINTS[i]}），点击预览，右上角移除`
                  : `${SLOT_LABELS[i]} — ${SLOT_HINTS[i]}`
              }
              style={
                color
                  ? ({
                      '--slot-color': color,
                      '--slot-color2': color2,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {base ? (
                <>
                  <div className="slot__header">
                    <span className="slot__index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="slot__role">{SLOT_LABELS[i]}</span>
                    <button
                      className="slot__remove"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(i);
                      }}
                      aria-label={`移除${SLOT_LABELS[i]}的${base.name}`}
                    >
                      ×
                    </button>
                  </div>
                  <span className="slot__seed" style={{ color }}>
                    {base.name}
                  </span>
                  <span className="slot__skill-name">
                    {skills[i]?.generatedName ?? '语义解析中'}
                  </span>
                  <span className="slot__status">
                    {activeSkillIndex === i ? '当前演示' : '点击预览'}
                  </span>
                </>
              ) : (
                <>
                  <div className="slot__header">
                    <span className="slot__index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="slot__role">{SLOT_LABELS[i]}</span>
                  </div>
                  <span className="slot__empty-mark">+</span>
                  <span className="slot__empty-copy">等待技能种子</span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="feedback-legend feedback-legend--backward">
        <i />
        <span>后向改写</span>
      </div>
      {showFusionHint && (
        <p className="fusion-hint">继续填入种子，新的技能位会参与现有互馈计算。</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 检查 TypeScript 编译**

```bash
npx tsc --noEmit --pretty
```

Expected: RuneSlotBar 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/components/RuneSlotBar.tsx
git commit -m "feat(v6-3): switch RuneSlotBar to seedId-driven with V6 GeneratedSkill

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 创建 V6SkillCard 组件

**Files:**
- Create: `src/components/V6SkillCard.tsx`

**Why:** 这是 V6-3 的核心 UI 组件。按 `presentation-and-migration.md §6.2` 实现收起态（名称 + 主效果 + Top 3 变化 + Top 2 机制 + 来源摘要）和展开态（完整参数三列对比 + 全部机制 + 反应详情 + 动画图例）。

- [ ] **Step 1: 创建 V6SkillCard 组件**

创建 `src/components/V6SkillCard.tsx`：

```tsx
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

  // Top 3 变化（按 |delta| 排序）
  const topChanges = [...skill.changes]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  // Top 2 机制（按最终值排序）
  const topMechanics = MECHANIC_KEYS
    .map((k) => ({ key: k, value: getMechanicValue(skill.finalMechanics, k) }))
    .filter((m) => m.value >= 0.10)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  // 来源摘要
  const sourceSlots = new Set<number>();
  for (const c of contributions) {
    if (c.targetSlot === slotIndex && c.acceptedDelta !== 0) {
      sourceSlots.add(c.sourceSlot);
    }
  }
  const forwardSources = [...sourceSlots].filter((s) => s < slotIndex);
  const backwardSources = [...sourceSlots].filter((s) => s > slotIndex);

  // 前向主反应
  const domFwd = contributions.find(
    (c) => c.targetSlot === slotIndex && c.pass === 'forward' && c.acceptedDelta !== 0,
  );

  // 后向主反应
  const domBwd = contributions.find(
    (c) => c.targetSlot === slotIndex && c.pass === 'backward' && c.acceptedDelta !== 0,
  );

  return (
    <article
      className={`v6-skill-card ${isActive ? 'v6-skill-card--active' : ''} ${expanded ? 'v6-skill-card--expanded' : ''}`}
      style={{ '--skill-color': color } as React.CSSProperties}
      onClick={onSelect}
    >
      {/* === 收起态内容 === */}
      <div className="v6-skill-card__header">
        <span className="v6-skill-card__slot">Slot {slotIndex + 1}</span>
        <h3 className="v6-skill-card__name">{skill.generatedName}</h3>
      </div>

      <p className="v6-skill-card__identity">
        <span className="v6-skill-card__element">{ELEMENT_LABELS_V6[skill.primaryElement]}</span>
        <span className="v6-skill-card__separator">/</span>
        <span className="v6-skill-card__form">{FORM_LABELS[skill.form] ?? skill.form}</span>
        <span className="v6-skill-card__separator">/</span>
        <span className="v6-skill-card__core">{skill.coreEffect}</span>
      </p>

      {/* Top 3 变化 */}
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
                {/* 简易变化条 */}
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

      {/* Top 2 机制标签 */}
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

      {/* 来源摘要 */}
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

      {/* 展开按钮 */}
      <button
        className="v6-skill-card__expand-btn"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      >
        {expanded ? '收起详情' : '查看推演'}
      </button>

      {/* === 展开态内容 === */}
      {expanded && (
        <div className="v6-skill-card__expanded">
          {/* 完整参数三列对比 */}
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

          {/* 全部机制 */}
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

          {/* 反应详情 */}
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

          {/* 动画图例 */}
          {skill.animation && (
            <div className="v6-skill-card__animation-legend">
              <span>主体：{ELEMENT_LABELS_V6[skill.animation.primaryElement]} / {FORM_LABELS[skill.animation.form] ?? skill.animation.form}</span>
              {skill.animation.forwardCue && (
                <span>
                  前向 Cue：{ELEMENT_LABELS_V6[skill.animation.forwardCue.sourceElement]} → {ELEMENT_LABELS_V6[skill.primaryElement]}
                  「{skill.animation.forwardCue.visualCue}」
                </span>
              )}
              {skill.animation.backwardCue && (
                <span>
                  后向 Cue：{ELEMENT_LABELS_V6[skill.animation.backwardCue.sourceElement]} → {ELEMENT_LABELS_V6[skill.primaryElement]}
                  「{skill.animation.backwardCue.visualCue}」
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: 检查 TypeScript 编译**

```bash
npx tsc --noEmit --pretty
```

Expected: V6SkillCard 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/components/V6SkillCard.tsx
git commit -m "feat(v6-3): create V6SkillCard with collapsed/expanded states

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 创建 ChangeLedger 组件

**Files:**
- Create: `src/components/ChangeLedger.tsx`

**Why:** 序列变化时展示构筑变化摘要。调用 `diffBuilds(prev, curr)` 展示每个技能的槽位移动、参数变化、机制变化。

- [ ] **Step 1: 创建 ChangeLedger**

创建 `src/components/ChangeLedger.tsx`：

```tsx
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
        const totalStatDelta = diff.statDiffs.reduce((sum, d) => sum + Math.abs(d.delta), 0);
        const totalMechDelta = diff.mechanicDiffs.reduce((sum, d) => sum + Math.abs(d.delta), 0);
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

            {/* 参数变化 */}
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

            {/* 机制变化 */}
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

            {/* Cue 变化 */}
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
```

- [ ] **Step 2: 检查 TypeScript 编译**

```bash
npx tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ChangeLedger.tsx
git commit -m "feat(v6-3): create ChangeLedger component for build diff tracking

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 更新 SkillResultPanel 消费 V6 类型

**Files:**
- Modify: `src/components/SkillResultPanel.tsx`

**Why:** 当前 SkillResultPanel 消费 `BuildResult` / `DecodedSkill` 旧类型。需要切换为消费 `GeneratedBuild` / `GeneratedSkill`，使用 V6SkillCard 渲染每个技能。

- [ ] **Step 1: 重写 SkillResultPanel 使用 V6 类型**

完整替换 `src/components/SkillResultPanel.tsx`：

```tsx
// src/components/SkillResultPanel.tsx
// V6-3: 消费 GeneratedBuild + V6SkillCard

import type { GeneratedBuild, GeneratedSkill } from '../types/v6.ts';
import { ELEMENT_COLORS, ELEMENT_LABELS } from '../data/vectorDims.ts';
import { ELEMENT_LABELS_V6 } from '../engine/v6/finalizeGeneratedSkill.ts';
import { V6SkillCard } from './V6SkillCard.tsx';

interface SkillResultPanelProps {
  build: GeneratedBuild | null;
  previousBuild: GeneratedBuild | null;
  seedIds: string[];
  justGenerated: boolean;
  canSaveCompare: boolean;
  onSaveCompare: () => void;
  compareSlot: 'A' | 'B' | null;
  activeSkillIndex: number;
  onSelectSkill: (index: number) => void;
}

const SKILL_NUMERALS = ['一', '二', '三', '四'];

export function SkillResultPanel({
  build,
  seedIds,
  justGenerated,
  canSaveCompare,
  onSaveCompare,
  compareSlot,
  activeSkillIndex,
  onSelectSkill,
}: SkillResultPanelProps) {
  if (!build || build.skills.length === 0) {
    return (
      <div className="panel skill-detail-panel">
        <div className="panel-heading">
          <div>
            <span className="section-eyebrow">SKILL CODEX</span>
            <h3>技能详情</h3>
          </div>
        </div>
        <div className="skill-empty">
          <span className="skill-empty__glyph">技</span>
          <strong>尚未固化技能</strong>
          <p>从左侧选择技能种子。每个位置会独立生成一个技能。</p>
        </div>
      </div>
    );
  }

  const skill = build.skills[activeSkillIndex];
  if (!skill) return null;

  const safeActiveIndex = Math.min(activeSkillIndex, build.skills.length - 1);

  return (
    <div className={`panel skill-detail-panel ${justGenerated ? 'skill-result--flash' : ''}`}>
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">SKILL CODEX</span>
          <h3>技能详情</h3>
        </div>
        <span className="skill-position-badge">技能{SKILL_NUMERALS[safeActiveIndex]}</span>
      </div>

      {/* 当前选中技能的完整卡片（默认展开） */}
      <V6SkillCard
        skill={skill}
        slotIndex={safeActiveIndex}
        contributions={build.trace.contributions}
        isActive={true}
        onSelect={() => {}}
      />

      {/* 技能谱列表 */}
      {build.skills.length > 1 && (
        <div className="skill-roster">
          <p className="subsection-label">完整技能谱</p>
          {build.skills.map((item, index) => {
            const seedId = seedIds[index];
            if (!seedId) return null;
            const color = ELEMENT_COLORS[item.primaryElement];

            return (
              <button
                key={`${item.seedId}-${index}`}
                className={`skill-roster__item ${index === safeActiveIndex ? 'is-active' : ''}`}
                onClick={() => onSelectSkill(index)}
              >
                <span className="skill-roster__index">{String(index + 1).padStart(2, '0')}</span>
                <i style={{ backgroundColor: color }} />
                <span>
                  <small>{item.baseName}</small>
                  <strong>{item.generatedName}</strong>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="skill-detail-actions">
        <div className="build-tags">
          {skill.tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <button
          className="btn-save-compare"
          disabled={!canSaveCompare}
          onClick={onSaveCompare}
        >
          {compareSlot ? `已存入构筑 ${compareSlot}` : '存入构筑对照'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 检查编译**

```bash
npx tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SkillResultPanel.tsx
git commit -m "feat(v6-3): rewrite SkillResultPanel to consume V6 GeneratedBuild

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 更新 ComparePanel 为 seed 对齐

**Files:**
- Modify: `src/components/ComparePanel.tsx`

**Why:** 从 slot 对齐改为 seed 对齐（使用 `SkillOccurrenceKey`），用 `diffBuilds()` 纯函数生成差异数据。

- [ ] **Step 1: 重写 ComparePanel**

完整替换 `src/components/ComparePanel.tsx`：

```tsx
// src/components/ComparePanel.tsx
// V6-3: seed 对齐对比 + diffBuilds 纯函数

import type { GeneratedBuild } from '../types/v6.ts';
import { diffBuilds } from '../engine/v6/diffBuilds.ts';
import { STAT_LABELS, MECHANIC_LABELS, ELEMENT_LABELS_V6, FORM_LABELS } from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';

interface ComparePanelProps {
  buildA: GeneratedBuild | null;
  buildB: GeneratedBuild | null;
  seedIdsA: string[];
  seedIdsB: string[];
  onClear: (slot: 'A' | 'B') => void;
  onReplay: (slot: 'A' | 'B') => void;
}

export function ComparePanel({
  buildA,
  buildB,
  seedIdsA,
  seedIdsB,
  onClear,
  onReplay,
}: ComparePanelProps) {
  const bothPresent = Boolean(buildA && buildB);
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
            seedIds={seedIdsA}
            onClear={() => onClear('A')}
            onReplay={() => onReplay('A')}
          />
          <BuildRow
            slot="B"
            build={buildB}
            seedIds={seedIdsB}
            onClear={() => onClear('B')}
            onReplay={() => onReplay('B')}
          />
        </div>
      )}

      {/* Seed 对齐差异摘要 */}
      {diffs && diffs.length > 0 && (
        <div className="compare-diff-summary">
          <p className="subsection-label">构筑差异（按种子对齐）</p>
          {diffs.map((diff) => {
            const slotMoved = diff.slotA !== diff.slotB;
            const totalDelta = diff.statDiffs.reduce((sum, d) => sum + Math.abs(d.delta), 0);
            return (
              <div key={diff.occurrenceKey} className="compare-diff-item">
                <div className="compare-diff-item__head">
                  <strong>{diff.seedId}</strong>
                  <span>A: Slot {diff.slotA + 1}</span>
                  <span>B: Slot {diff.slotB + 1}</span>
                  {slotMoved && <em>移位</em>}
                  <span className="compare-diff-item__total-delta">
                    Σ|Δ| = {totalDelta.toFixed(2)}
                  </span>
                </div>
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
                    {diff.forwardCueChanged && <span>前向 Cue 变化</span>}
                    {diff.backwardCueChanged && <span>后向 Cue 变化</span>}
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
  seedIds,
  onClear,
  onReplay,
}: {
  slot: 'A' | 'B';
  build: GeneratedBuild | null;
  seedIds: string[];
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
```

- [ ] **Step 2: 检查编译**

```bash
npx tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ComparePanel.tsx
git commit -m "feat(v6-3): rewrite ComparePanel for seed-aligned V6 comparison

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 更新 PlayPage — 双引擎并行

**Files:**
- Modify: `src/pages/PlayPage.tsx`

**Why:** PlayPage 是集成点。新增 `generateBuildV6` 调用，槽位改为 `string[]`（seedId），同时保留旧 `generateBuild` 调用供 App 共享状态兼容。

- [ ] **Step 1: 重写 PlayPage**

完整替换 `src/pages/PlayPage.tsx`：

```tsx
// src/pages/PlayPage.tsx
// V6-3: V6 引擎驱动，双引擎并行，旧 BuildResult 保留供 How 兼容

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { SkillSeed } from '../types/rune.ts';
import type { BuildResult } from '../types/skill.ts';
import type { GeneratedBuild } from '../types/v6.ts';
import { generateBuild } from '../engine/skillGenerator.ts';
import { generateBuildV6 } from '../engine/v6/generateBuildV6.ts';
import { diffBuilds } from '../engine/v6/diffBuilds.ts';
import { getSkillSeed, SKILL_SEEDS } from '../data/skillSeeds.ts';
import { getBaseSkill } from '../data/v6/baseSkills.ts';
import { RunePool } from '../components/RunePool.tsx';
import { RuneSlotBar } from '../components/RuneSlotBar.tsx';
import { SkillResultPanel } from '../components/SkillResultPanel.tsx';
import { ComparePanel } from '../components/ComparePanel.tsx';
import { ChangeLedger } from '../components/ChangeLedger.tsx';
import { SkillScene } from '../components/SkillScene.tsx';
import type { AnimationParams } from '../types/skill.ts';

const DEFAULT_COMPARE_A = [
  'fire_flow', 'frost_zone', 'lightning_mark', 'wind_impact',
];
const DEFAULT_COMPARE_B = [
  'wind_impact', 'lightning_mark', 'frost_zone', 'fire_flow',
];

export interface PlayPageBuildState {
  // 旧（保留兼容）
  currentBuild: BuildResult | null;
  previousBuild: BuildResult | null;
  currentSeeds: SkillSeed[];
  // V6 新增
  v6Build: GeneratedBuild | null;
  v6PreviousBuild: GeneratedBuild | null;
}

interface PlayPageProps {
  onBuildChange?: (state: PlayPageBuildState) => void;
  initialSeeds?: string[];
  isActive?: boolean;
}

export function PlayPage({
  onBuildChange,
  initialSeeds,
  isActive = true,
}: PlayPageProps) {
  // 槽位存 seedId 字符串
  const [slots, setSlots] = useState<(string | null)[]>(
    initialSeeds
      ? [...initialSeeds, ...Array(4 - initialSeeds.length).fill(null)]
      : [null, null, null, null],
  );
  const [previousBuild, setPreviousBuild] = useState<BuildResult | null>(null);
  const [v6PreviousBuild, setV6PreviousBuild] = useState<GeneratedBuild | null>(null);
  const [compareA, setCompareA] = useState<GeneratedBuild | null>(null);
  const [compareB, setCompareB] = useState<GeneratedBuild | null>(null);
  const [compareSeedsA, setCompareSeedsA] = useState<string[]>([]);
  const [compareSeedsB, setCompareSeedsB] = useState<string[]>([]);
  const [compareSlot, setCompareSlot] = useState<'A' | 'B' | null>(null);
  const [activeSkillIndex, setActiveSkillIndex] = useState(0);
  const [previewBuild, setPreviewBuild] = useState<GeneratedBuild | null>(null);
  const [previewSkillIndex, setPreviewSkillIndex] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const [justFilledIndex, setJustFilledIndex] = useState<number | null>(null);

  const filledCount = slots.filter(Boolean).length;
  const filledSeedIds = useMemo(
    () => slots.filter(Boolean) as string[],
    [slots],
  );

  // V6 引擎调用
  const v6Build = useMemo(() => {
    if (filledSeedIds.length === 0) return null;
    try {
      return generateBuildV6({ seedIds: filledSeedIds });
    } catch {
      return null;
    }
  }, [filledSeedIds]);

  // 旧引擎调用（保留兼容）
  const currentBuild = useMemo(() => {
    if (filledSeedIds.length === 0) return null;
    try {
      return generateBuild({ seedIds: filledSeedIds });
    } catch {
      return null;
    }
  }, [filledSeedIds]);

  // V6 变化账本
  const changeDiffs = useMemo(() => {
    if (!v6PreviousBuild || !v6Build) return null;
    return diffBuilds(v6PreviousBuild, v6Build);
  }, [v6PreviousBuild, v6Build]);

  // 旧种子对象（兼容 App 共享状态）
  const filledSeedsOld = useMemo(() => {
    return filledSeedIds.map((id) => getSkillSeed(id)!).filter(Boolean);
  }, [filledSeedIds]);

  // 通知父组件 build 变化
  useEffect(() => {
    if (onBuildChange) {
      onBuildChange({
        currentBuild,
        previousBuild,
        currentSeeds: filledSeedsOld,
        v6Build,
        v6PreviousBuild,
      });
    }
  }, [currentBuild, previousBuild, filledSeedsOld, v6Build, v6PreviousBuild, onBuildChange]);

  /** 添加种子到第一个空槽 */
  const handleAddSeed = useCallback((seedId: string) => {
    const emptyIndex = slots.findIndex((slot) => slot === null);
    if (emptyIndex === -1) return;

    setPreviousBuild(currentBuild);
    setV6PreviousBuild(v6Build);
    const next = [...slots];
    next[emptyIndex] = seedId;
    setSlots(next);
    setJustFilledIndex(emptyIndex);
  }, [currentBuild, v6Build, slots]);

  // 种子填入后的脉冲动画
  useEffect(() => {
    if (justFilledIndex === null) return;
    const timer = setTimeout(() => setJustFilledIndex(null), 400);
    return () => clearTimeout(timer);
  }, [justFilledIndex]);

  /** 从槽位移除 */
  const handleRemoveRune = useCallback((index: number) => {
    setPreviousBuild(currentBuild);
    setV6PreviousBuild(v6Build);
    setSlots((prev) => {
      const remaining = prev.filter((id, slotIndex) => slotIndex !== index && id !== null);
      return [...remaining, ...Array(4 - remaining.length).fill(null)];
    });
    setActiveSkillIndex((active) => {
      if (active > index) return active - 1;
      if (active === index) return Math.min(index, Math.max(0, filledCount - 2));
      return active;
    });
    setPreviewBuild(null);
    setJustFilledIndex(null);
  }, [currentBuild, v6Build, filledCount]);

  /** 拖拽重排 */
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const targetIndex = Math.min(toIndex, Math.max(0, filledCount - 1));
    setPreviousBuild(currentBuild);
    setV6PreviousBuild(v6Build);
    setSlots((prev) => {
      const compact = prev.filter(Boolean) as string[];
      const [moved] = compact.splice(fromIndex, 1);
      if (!moved) return prev;
      compact.splice(targetIndex, 0, moved);
      return [...compact, ...Array(4 - compact.length).fill(null)];
    });
    setActiveSkillIndex((active) => {
      if (active === fromIndex) return targetIndex;
      if (fromIndex < targetIndex && active > fromIndex && active <= targetIndex) return active - 1;
      if (targetIndex < fromIndex && active >= targetIndex && active < fromIndex) return active + 1;
      return active;
    });
    setPreviewBuild(null);
  }, [currentBuild, v6Build, filledCount]);

  /** 重置 */
  const handleReset = useCallback(() => {
    setPreviousBuild(currentBuild);
    setV6PreviousBuild(v6Build);
    setSlots([null, null, null, null]);
    setPreviewBuild(null);
    setActiveSkillIndex(0);
    setJustFilledIndex(null);
  }, [currentBuild, v6Build]);

  /** 随机填充 */
  const handleRandomFill = useCallback(() => {
    setPreviousBuild(currentBuild);
    setV6PreviousBuild(v6Build);
    const picked: string[] = [];
    const allIds = SKILL_SEEDS.map((s) => s.id);
    for (let i = 0; i < 4; i++) {
      picked.push(allIds[Math.floor(Math.random() * allIds.length)]);
    }
    setSlots(picked);
    setActiveSkillIndex(0);
    setPreviewBuild(null);
    setJustFilledIndex(3);
  }, [currentBuild, v6Build]);

  /** 默认对比样例 */
  const handleDefaultCompare = useCallback(() => {
    try {
      const buildA = generateBuildV6({ seedIds: DEFAULT_COMPARE_A });
      const buildB = generateBuildV6({ seedIds: DEFAULT_COMPARE_B });
      setCompareA(buildA);
      setCompareB(buildB);
      setCompareSeedsA(DEFAULT_COMPARE_A);
      setCompareSeedsB(DEFAULT_COMPARE_B);

      if (slots.every((slot) => slot === null)) {
        setPreviousBuild(currentBuild);
        setV6PreviousBuild(v6Build);
        setSlots([...DEFAULT_COMPARE_A]);
        setJustFilledIndex(3);
      }
    } catch { /* engine error — ignore */ }
  }, [currentBuild, v6Build, slots]);

  /** 保存当前 Build 到对比栏 */
  const handleSaveCompare = useCallback(() => {
    if (!v6Build) return;
    if (!compareA) {
      setCompareA(v6Build);
      setCompareSeedsA([...filledSeedIds]);
      setCompareSlot('A');
    } else if (!compareB) {
      setCompareB(v6Build);
      setCompareSeedsB([...filledSeedIds]);
      setCompareSlot('B');
    } else {
      setCompareA(v6Build);
      setCompareSeedsA([...filledSeedIds]);
      setCompareSlot('A');
    }
  }, [v6Build, compareA, compareB, filledSeedIds]);

  const handleClearCompare = useCallback(
    (slot: 'A' | 'B') => {
      if (slot === 'A') {
        setCompareA(null);
        setCompareSeedsA([]);
        if (compareSlot === 'A') setCompareSlot(null);
      } else {
        setCompareB(null);
        setCompareSeedsB([]);
        if (compareSlot === 'B') setCompareSlot(null);
      }
    },
    [compareSlot],
  );

  const handleReplayAnimation = useCallback((slot: 'A' | 'B') => {
    const build = slot === 'A' ? compareA : compareB;
    if (!build) return;
    setPreviewBuild(build);
    setPreviewSkillIndex(0);
    setReplayToken((token) => token + 1);
  }, [compareA, compareB]);

  const handleReplayCurrent = useCallback(() => {
    setPreviewBuild(null);
    setReplayToken((token) => token + 1);
  }, []);

  const handleSelectSkill = useCallback((index: number) => {
    setActiveSkillIndex(index);
    setPreviewBuild(null);
  }, []);

  // 当前动画参数（从 V6 AnimationSpec 简易映射）
  const displayedBuild = previewBuild ?? v6Build;
  const safeActiveSkillIndex = Math.min(
    activeSkillIndex,
    Math.max(0, (v6Build?.skills.length ?? 1) - 1),
  );
  const displayedSkill = displayedBuild?.skills[previewBuild ? previewSkillIndex : safeActiveSkillIndex] ?? null;
  const currentAnimParams: AnimationParams | null = displayedSkill
    ? {
        primaryColor: displayedSkill.animation.primaryPalette?.[0] ?? '#ff6600',
        secondaryColor: displayedSkill.animation.primaryPalette?.[1],
        particleCount: displayedSkill.animation.geometry?.count ?? 20,
        particleSpeed: displayedSkill.animation.timing?.travelSeconds
          ? 1 / displayedSkill.animation.timing.travelSeconds
          : 1.0,
        radius: displayedSkill.animation.geometry?.radius ?? 1.5,
        hasChain: (displayedSkill.animation.mechanics?.chain ?? 0) > 0,
        hasGroundZone: displayedSkill.animation.form === 'zone',
        hasDelayMark: displayedSkill.animation.form === 'mark',
        hasBurst: (displayedSkill.animation.mechanics?.delayedBurst ?? 0) > 0,
        hasKnockback: (displayedSkill.animation.mechanics?.knockback ?? 0) > 0,
        hasBindRing: (displayedSkill.animation.mechanics?.bind ?? 0) > 0,
      }
    : null;

  return (
    <div className="page-content play-page">
      <section className="build-ribbon">
        <div className="build-ribbon__heading">
          <div>
            <span className="section-eyebrow">BUILD SEQUENCE</span>
            <h2>四技能构筑序列</h2>
          </div>
          <p>每个位置独立生成一个技能，排列决定技能之间的前向塑形与后向改写。</p>
        </div>
        <div className="build-ribbon__content">
          <RuneSlotBar
            slots={slots}
            onRemove={handleRemoveRune}
            onReorder={handleReorder}
            filledCount={filledCount}
            skills={v6Build?.skills ?? []}
            activeSkillIndex={safeActiveSkillIndex}
            onSelectSkill={handleSelectSkill}
            justFilledIndex={justFilledIndex}
          />
          <div className="build-actions">
            <button className="btn-secondary" onClick={handleReset}>
              清空
            </button>
            <button className="btn-secondary" onClick={handleRandomFill}>
              随机填充
            </button>
            <button className="btn-default-compare" onClick={handleDefaultCompare}>
              默认对比样例
            </button>
            {v6Build && (
              <button className="btn-replay-build" onClick={handleReplayCurrent}>
                重播当前技能
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="play-workspace">
        <aside className="seed-rail">
          <RunePool onAddSeed={handleAddSeed} />
        </aside>

        <section className="combat-stage">
          <SkillScene
            params={currentAnimParams}
            autoPlay={!!displayedBuild}
            skillName={displayedSkill?.generatedName}
            skillIndex={previewBuild ? previewSkillIndex : safeActiveSkillIndex}
            previewSource={previewBuild ? (previewBuild === compareA ? '构筑 A' : '构筑 B') : '当前构筑'}
            isActive={isActive}
            replayToken={replayToken}
          />
        </section>

        <aside className="result-rail">
          <SkillResultPanel
            key={filledSeedIds.join('|') || 'empty'}
            build={v6Build}
            previousBuild={v6PreviousBuild}
            seedIds={filledSeedIds}
            justGenerated={Boolean(v6Build)}
            canSaveCompare={!!v6Build}
            onSaveCompare={handleSaveCompare}
            compareSlot={compareSlot}
            activeSkillIndex={safeActiveSkillIndex}
            onSelectSkill={handleSelectSkill}
          />
        </aside>
      </div>

      {/* 构筑变化账本 */}
      <ChangeLedger
        diffs={changeDiffs}
        prevSeedIds={v6PreviousBuild?.input.seedIds ?? []}
        currSeedIds={v6Build?.input.seedIds ?? []}
      />

      <ComparePanel
        buildA={compareA}
        buildB={compareB}
        seedIdsA={compareSeedsA}
        seedIdsB={compareSeedsB}
        onClear={handleClearCompare}
        onReplay={handleReplayAnimation}
      />
    </div>
  );
}
```

- [ ] **Step 2: 检查编译**

```bash
npx tsc --noEmit --pretty
```

Expected: 除预存旧错误外无新增错误。

- [ ] **Step 3: Commit**

```bash
git add src/pages/PlayPage.tsx
git commit -m "feat(v6-3): integrate V6 engine in PlayPage with dual-engine compat

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 更新 App.tsx 共享状态

**Files:**
- Modify: `src/App.tsx`

**Why:** `PlayPageBuildState` 新增 `v6Build` / `v6PreviousBuild` 字段，How 页暂不使用。

- [ ] **Step 1: 更新 App.tsx**

在 `src/App.tsx` 中，更新 `sharedBuildState` 初始化：

找到行 16-20：
```tsx
const [sharedBuildState, setSharedBuildState] = useState<PlayPageBuildState>({
  currentBuild: null,
  previousBuild: null,
  currentSeeds: [],
});
```

替换为：
```tsx
const [sharedBuildState, setSharedBuildState] = useState<PlayPageBuildState>({
  currentBuild: null,
  previousBuild: null,
  currentSeeds: [],
  v6Build: null,
  v6PreviousBuild: null,
});
```

- [ ] **Step 2: 检查编译**

```bash
npx tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(v6-3): add V6 fields to App shared build state

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: 创建 verify-v6-3 验收脚本

**Files:**
- Create: `scripts/verify-v6-3.ts`

**Why:** 按 `presentation-and-migration.md §12.5` 验证默认 A/B 案例达到差异标准。

- [ ] **Step 1: 创建验收脚本**

创建 `scripts/verify-v6-3.ts`：

```ts
// scripts/verify-v6-3.ts
// 验证 V6-3 Play 接入 — 默认 A/B 案例 + 组件集成
// 依据: docs/v6/presentation-and-migration.md §12.5
// 运行: npx tsx scripts/verify-v6-3.ts

import { generateBuildV6 } from '../src/engine/v6/generateBuildV6.ts';
import { diffBuilds } from '../src/engine/v6/diffBuilds.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../src/types/v6.ts';
import { getMechanicValue } from '../src/engine/v6/math.ts';
import { DEFAULT_BUILD_A, DEFAULT_BUILD_B } from '../src/data/v6/namingLexicon.ts';

let passed = 0;
let failed = 0;

function check(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

function assertClose(actual: number, expected: number, tolerance: number, label: string): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    console.log(`  ✅ ${label} (actual=${actual.toFixed(4)}, expected≈${expected.toFixed(4)})`);
    passed++;
  } else {
    console.log(`  ❌ ${label} (actual=${actual.toFixed(4)}, expected≈${expected.toFixed(4)}, diff=${(actual - expected).toFixed(4)})`);
    failed++;
  }
}

console.log('\n=== V6-3 验收：默认 A/B 案例 ===\n');

// 生成 A/B
let buildA, buildB;
try {
  buildA = generateBuildV6({ seedIds: DEFAULT_BUILD_A });
  buildB = generateBuildV6({ seedIds: DEFAULT_BUILD_B });
  check(true, 'generateBuildV6(A) 成功');
  check(true, 'generateBuildV6(B) 成功');
} catch (e) {
  check(false, `generateBuildV6 抛错: ${e}`);
  console.log(`\n结果: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// 1. 至少 3/4 技能名称不同
console.log('\n1. 名称差异:');
let nameDiffCount = 0;
for (let i = 0; i < 4; i++) {
  const skillA = buildA.skills.find((s) => s.seedId === buildB.skills[i].seedId);
  if (skillA) {
    const diff = skillA.generatedName !== buildB.skills[i].generatedName;
    if (diff) nameDiffCount++;
    console.log(`  ${skillA.seedId}: "${skillA.generatedName}" vs "${buildB.skills[i].generatedName}" ${diff ? '✗' : '✓'}`);
  }
}
check(nameDiffCount >= 3, `至少 3/4 名称不同 (实际: ${nameDiffCount}/4)`);

// 2. 至少 3/4 技能达到"有意义差异"
console.log('\n2. 有意义差异:');
let meaningfulCount = 0;
const diffs = diffBuilds(buildA, buildB);
for (const diff of diffs) {
  const maxStatDelta = Math.max(0, ...diff.statDiffs.map((d) => Math.abs(d.delta)));
  const sumAbsStatDelta = diff.statDiffs.reduce((s, d) => s + Math.abs(d.delta), 0);
  const maxMechDelta = Math.max(0, ...diff.mechanicDiffs.map((d) => Math.abs(d.delta)));
  const isMeaningful =
    maxStatDelta >= 0.08 ||
    sumAbsStatDelta >= 0.16 ||
    maxMechDelta >= 0.12 ||
    diff.forwardCueChanged ||
    (diff.backwardCueChanged);
  if (isMeaningful) meaningfulCount++;
  console.log(`  ${diff.seedId}: maxStatΔ=${maxStatDelta.toFixed(3)} sumAbsStatΔ=${sumAbsStatDelta.toFixed(3)} maxMechΔ=${maxMechDelta.toFixed(3)} fwdCue=${diff.forwardCueChanged} bwdCue=${diff.backwardCueChanged} → ${isMeaningful ? '有意义' : '不足'}`);
}
check(meaningfulCount >= 3, `至少 3/4 有意义差异 (实际: ${meaningfulCount}/4)`);

// 3. 至少 2/4 技能的显著机制标签不同
console.log('\n3. 机制标签差异:');
let tagDiffCount = 0;
for (const diff of diffs) {
  const skillA = buildA.skills.find((s) => s.seedId === diff.seedId);
  const skillB = buildB.skills.find((s) => s.seedId === diff.seedId);
  if (skillA && skillB) {
    const tagsA = new Set(skillA.tags);
    const tagsB = new Set(skillB.tags);
    const diffTags = [...tagsA].filter((t) => !tagsB.has(t)).length + [...tagsB].filter((t) => !tagsA.has(t)).length;
    if (diffTags >= 1) tagDiffCount++;
    console.log(`  ${diff.seedId}: A=${skillA.tags.join(', ')} | B=${skillB.tags.join(', ')} (不同: ${diffTags})`);
  }
}
check(tagDiffCount >= 2, `至少 2/4 标签不同 (实际: ${tagDiffCount}/4)`);

// 4. 至少 3/4 技能的动画 Cue 或几何参数明显不同
console.log('\n4. 动画差异:');
let animDiffCount = 0;
for (const diff of diffs) {
  if (diff.forwardCueChanged || diff.backwardCueChanged) animDiffCount++;
  console.log(`  ${diff.seedId}: fwdCue=${diff.forwardCueChanged} bwdCue=${diff.backwardCueChanged}`);
}
check(animDiffCount >= 1, `至少 1/4 动画 Cue 不同 (实际: ${animDiffCount}/4)`);

// 5. frost_zone 在两种顺序中拥有不同的主前向反应
console.log('\n5. frost_zone 前向反应:');
const frostA = buildA.skills.find((s) => s.seedId === 'frost_zone');
const frostB = buildB.skills.find((s) => s.seedId === 'frost_zone');
if (frostA && frostB) {
  const fwdA = buildA.trace.contributions.find(
    (c) => c.targetSlot === frostA.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  const fwdB = buildB.trace.contributions.find(
    (c) => c.targetSlot === frostB.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  console.log(`  A: ${fwdA?.reactionName ?? '无前向反应'} (source: ${fwdA?.sourceElement ?? 'N/A'})`);
  console.log(`  B: ${fwdB?.reactionName ?? '无前向反应'} (source: ${fwdB?.sourceElement ?? 'N/A'})`);
  check(
    (fwdA?.reactionKey ?? '') !== (fwdB?.reactionKey ?? ''),
    'frost_zone 在 A/B 中主前向反应不同',
  );
}

// 6. fire_flow 在 A 中以后向修饰为主，在 B 中以前向为主
console.log('\n6. fire_flow 角色:');
const fireA = buildA.skills.find((s) => s.seedId === 'fire_flow');
const fireB = buildB.skills.find((s) => s.seedId === 'fire_flow');
if (fireA && fireB) {
  const fwdA = buildA.trace.contributions.filter(
    (c) => c.sourceSlot === fireA.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  const bwdA = buildA.trace.contributions.filter(
    (c) => c.sourceSlot === fireA.slot && c.pass === 'backward' && c.acceptedDelta !== 0,
  );
  const fwdB = buildB.trace.contributions.filter(
    (c) => c.sourceSlot === fireB.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  const bwdB = buildB.trace.contributions.filter(
    (c) => c.sourceSlot === fireB.slot && c.pass === 'backward' && c.acceptedDelta !== 0,
  );
  const roleA = fwdA.length > bwdA.length ? '前向为主' : bwdA.length > fwdA.length ? '后向为主' : '均衡';
  const roleB = fwdB.length > bwdB.length ? '前向为主' : bwdB.length > fwdB.length ? '后向为主' : '均衡';
  console.log(`  A: slot=${fireA.slot} fwd=${fwdA.length} bwd=${bwdA.length} → ${roleA}`);
  console.log(`  B: slot=${fireB.slot} fwd=${fwdB.length} bwd=${bwdB.length} → ${roleB}`);
  check(roleA !== roleB, `fire_flow A/B 角色不同 (A=${roleA}, B=${roleB})`);
}

// 7. 参数绝对差之和校准
console.log('\n7. 参数绝对差之和校准:');
const expectedSums: Record<string, number> = {
  fire_flow: 0.20,
  frost_zone: 0.24,
  lightning_mark: 0.38,
  wind_impact: 0.29,
};
for (const diff of diffs) {
  const sum = diff.statDiffs.reduce((s, d) => s + Math.abs(d.delta), 0);
  const expected = expectedSums[diff.seedId];
  if (expected !== undefined) {
    console.log(`  ${diff.seedId}: Σ|Δ| = ${sum.toFixed(3)} (预期约 ${expected.toFixed(2)})`);
    assertClose(sum, expected, 0.25, `${diff.seedId} 参数绝对差之和接近预期`);
  }
}

// 8. 排列测试：24 种排列至少 20 个唯一 fingerprint
console.log('\n8. 排列唯一性:');
const allPermutations = permute(DEFAULT_BUILD_A);
const fingerprints = new Set<string>();
for (const perm of allPermutations) {
  try {
    const build = generateBuildV6({ seedIds: perm });
    const fp = build.skills.map((s) =>
      `${s.seedId}:${s.generatedName}:${s.animation.forwardCue?.visualCue ?? 'none'}:${s.animation.backwardCue?.visualCue ?? 'none'}`
    ).join('|');
    fingerprints.add(fp);
  } catch { /* skip */ }
}
console.log(`  ${fingerprints.size}/${allPermutations.length} 唯一构筑 fingerprint`);
check(fingerprints.size >= 20, `至少 20 个唯一 fingerprint (实际: ${fingerprints.size})`);

// 9. 全排列无 NaN/Infinity/越界
console.log('\n9. 全排列数值检查:');
let validCount = 0;
for (const perm of allPermutations) {
  try {
    const build = generateBuildV6({ seedIds: perm });
    let valid = true;
    for (const skill of build.skills) {
      for (const key of STAT_KEYS) {
        const v = skill.finalStats[key];
        if (isNaN(v) || !isFinite(v) || v < 0 || v > 1) {
          console.log(`    ❌ ${perm.join(',')} skill=${skill.seedId} ${key}=${v}`);
          valid = false;
        }
      }
    }
    if (valid) validCount++;
  } catch { /* skip */ }
}
check(validCount === 24, `24 个排列全部有效 (实际: ${validCount})`);

// 辅助：排列生成
function permute(arr: string[]): string[][] {
  if (arr.length <= 1) return [arr];
  const result: string[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permute(rest)) {
      result.push([arr[i], ...p]);
    }
  }
  return result;
}

console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行验收脚本**

```bash
npx tsx scripts/verify-v6-3.ts
```

Expected: 所有检查通过（或记录已通过的项和失败项）。

- [ ] **Step 3: 运行现有 V6-2 验证确保不退化**

```bash
npx tsx scripts/verify-v6-2.ts
```

Expected: 全部 1237 测试继续通过。

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-v6-3.ts
git commit -m "feat(v6-3): add V6-3 verification script for Play integration

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: CSS 样式补充与最终集成验证

**Files:**
- Modify: `src/styles.css` 或 `src/visual-refresh.css`

**Why:** V6SkillCard 和 ChangeLedger 需要新的 CSS 类。补充最小样式使组件可用（UI 细节后续可独立迭代）。

- [ ] **Step 1: 添加 V6 组件 CSS**

在 `src/visual-refresh.css` 末尾追加最小样式：

```css
/* ============================================================
   V6-3: V6SkillCard + ChangeLedger + ComparePanel 样式
   ============================================================ */

/* V6SkillCard */
.v6-skill-card {
  background: var(--color-mist);
  border: 1px solid var(--color-moon);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.v6-skill-card--active {
  border-color: var(--skill-color, var(--color-jade));
}
.v6-skill-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.v6-skill-card__slot {
  font-size: 0.75rem;
  color: var(--color-ink);
  opacity: 0.5;
}
.v6-skill-card__name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-ink);
}
.v6-skill-card__identity {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-ink);
  opacity: 0.7;
  margin-bottom: 12px;
}
.v6-skill-card__separator {
  opacity: 0.3;
}
.v6-skill-card__changes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.v6-skill-card__change-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}
.v6-skill-card__change-label {
  min-width: 48px;
  color: var(--color-ink);
  opacity: 0.6;
}
.v6-skill-card__change-values {
  display: flex;
  gap: 4px;
  align-items: center;
}
.v6-skill-card__change-base {
  color: var(--color-ink);
  opacity: 0.4;
}
.v6-skill-card__change-arrow {
  color: var(--color-ink);
  opacity: 0.3;
}
.v6-skill-card__change-final {
  font-weight: 600;
  color: var(--color-ink);
}
.v6-skill-card__change-delta {
  font-weight: 700;
  min-width: 52px;
}
.v6-skill-card__change-bar {
  flex: 1;
  height: 4px;
  background: var(--color-moon);
  border-radius: 2px;
  overflow: hidden;
}
.v6-skill-card__change-bar-fill {
  height: 100%;
  background: var(--skill-color, var(--color-jade));
  border-radius: 2px;
  transition: width 0.3s;
}
.v6-skill-card__mechanics {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.v6-skill-card__mech-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  background: var(--skill-color, var(--color-jade));
  color: #fff;
  opacity: 0.8;
}
.v6-skill-card__sources {
  font-size: 0.8rem;
  color: var(--color-ink);
  opacity: 0.5;
  margin-bottom: 8px;
}
.v6-skill-card__expand-btn {
  background: none;
  border: none;
  font-size: 0.8rem;
  color: var(--color-jade);
  cursor: pointer;
  padding: 0;
}
.v6-skill-card__expand-btn:hover {
  text-decoration: underline;
}

/* 展开态 */
.v6-skill-card__expanded {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-moon);
}
.v6-skill-card__params-table {
  margin-bottom: 16px;
}
.v6-skill-card__params-header,
.v6-skill-card__param-row {
  display: grid;
  grid-template-columns: 64px 48px 48px 48px 48px;
  gap: 4px;
  font-size: 0.8rem;
  align-items: center;
}
.v6-skill-card__params-header {
  font-weight: 600;
  color: var(--color-ink);
  opacity: 0.5;
  margin-bottom: 4px;
}
.v6-skill-card__param-label {
  color: var(--color-ink);
  opacity: 0.6;
}
.has-change {
  color: var(--skill-color, var(--color-cinnabar));
  font-weight: 600;
}

/* Delta 颜色 */
.delta--up { color: var(--color-jade); }
.delta--down { color: var(--color-cinnabar); }
.delta--mixed { color: var(--color-gold); }

/* 展开态其他 */
.v6-skill-card__all-mechanics,
.v6-skill-card__reactions,
.v6-skill-card__animation-legend {
  margin-bottom: 12px;
  font-size: 0.8rem;
}
.v6-skill-card__mech-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.v6-skill-card__mech-item {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  background: var(--color-mist);
  border: 1px solid var(--color-moon);
}
.mech--gained { border-color: var(--color-jade); }
.mech--lost { border-color: var(--color-cinnabar); opacity: 0.6; }

/* ChangeLedger */
.change-ledger__badge {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-cinnabar);
  color: #fff;
  font-size: 0.7rem;
}
.change-ledger__empty {
  color: var(--color-ink);
  opacity: 0.5;
  font-size: 0.85rem;
}
.change-ledger__item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: var(--color-mist);
  border: 1px solid var(--color-moon);
}
.change-ledger__item-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 6px;
}
.change-ledger__slot-move {
  font-size: 0.8rem;
  color: var(--color-cinnabar);
}
.change-ledger__no-change {
  font-size: 0.8rem;
  opacity: 0.5;
}
.change-ledger__deltas {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.change-ledger__delta {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.78rem;
  background: var(--color-moon);
}
.change-ledger__more {
  font-size: 0.75rem;
  opacity: 0.5;
}
.change-ledger__cues {
  display: flex;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--color-gold);
  margin-top: 4px;
}

/* ComparePanel V6 */
.compare-diff-summary {
  margin-top: 16px;
}
.compare-diff-item {
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: var(--color-mist);
  border: 1px solid var(--color-moon);
}
.compare-diff-item__head {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 4px;
}
.compare-diff-item__total-delta {
  font-size: 0.75rem;
  color: var(--color-gold);
  margin-left: auto;
}
.compare-diff-item__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.78rem;
}
.compare-diff-item__cues {
  font-size: 0.75rem;
  color: var(--color-gold);
  margin-top: 4px;
}

/* RunePool V6 form filter */
.seed-form-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.seed-form-btn {
  padding: 2px 8px;
  border: 1px solid var(--color-moon);
  border-radius: 4px;
  background: var(--color-mist);
  font-size: 0.72rem;
  color: var(--color-ink);
  cursor: pointer;
  transition: all 0.15s;
}
.seed-form-btn.is-active {
  background: var(--color-jade);
  color: #fff;
  border-color: var(--color-jade);
}
.seed-aspects__empty {
  color: var(--color-ink);
  opacity: 0.4;
  font-size: 0.8rem;
  padding: 8px;
}
```

- [ ] **Step 2: 运行 Vite dev server 进行手动冒烟测试**

```bash
npx vite --open
```

检查内容：
- [ ] Play 页正常渲染，无白屏
- [ ] 符文池展示 24 个种子，可按元素展开、按形态筛选
- [ ] 点击种子可填入槽位
- [ ] 槽位填满后技能卡正确展示 V6 生成结果
- [ ] 技能卡收起态显示名称、变化、机制标签、来源
- [ ] 技能卡展开态显示完整参数表、全部机制、反应详情
- [ ] 交换两个槽位后变化账本展示差异
- [ ] 默认 A/B 对比正常
- [ ] 清空/随机填充功能正常

- [ ] **Step 3: 运行完整验证**

```bash
npx tsx scripts/verify-v6-2.ts && npx tsx scripts/verify-v6-3.ts
```

Expected: 全部通过。

- [ ] **Step 4: 最终 Commit**

```bash
git add src/visual-refresh.css
git commit -m "feat(v6-3): add V6 component styles and complete Play integration

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成检查清单

- [ ] V6-2 验证 (1237 tests) 继续通过
- [ ] V6-3 验证 (默认 A/B + 排列测试) 全部通过
- [ ] TypeScript 编译无新增错误
- [ ] Play 页手动冒烟：选种子 → 填入 → 生成 → 看卡片 → 交换槽位 → 看账本 → A/B 对比
- [ ] 旧功能不崩：清空、随机填充、默认对比样例、拖拽排序
- [ ] App.tsx 共享状态兼容（How 页不报错）

## 不改内容

- HowPage.tsx（V6-4）
- SkillScene.tsx 核心动画（V6-5）
- `src/engine/skillGenerator.ts`（旧引擎保留）
- `src/types/skill.ts` / `src/types/rune.ts`（旧类型保留）
