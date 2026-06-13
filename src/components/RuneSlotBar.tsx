// src/components/RuneSlotBar.tsx
// V6-3: seedId 驱动，GeneratedSkill 展示

import { useState, useCallback } from 'react';
import type { GeneratedSkill } from '../types/v6.ts';
import { getBaseSkill } from '../data/v6/baseSkills.ts';
import { ELEMENT_COLORS, ELEMENT_SECONDARY_COLORS } from '../data/vectorDims.ts';

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
              role={seedId ? 'button' : undefined}
              tabIndex={seedId ? 0 : undefined}
              aria-pressed={seedId ? activeSkillIndex === i : undefined}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (seedId && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onSelectSkill(i);
                }
              }}
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
