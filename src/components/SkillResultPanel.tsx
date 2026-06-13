// src/components/SkillResultPanel.tsx
// V6-3: 消费 GeneratedBuild + V6SkillCard

import type { GeneratedBuild } from '../types/v6.ts';
import { ELEMENT_COLORS } from '../data/vectorDims.ts';
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

  const safeActiveIndex = Math.min(activeSkillIndex, build.skills.length - 1);
  const skill = build.skills[safeActiveIndex];
  if (!skill) return null;

  return (
    <div className={`panel skill-detail-panel ${justGenerated ? 'skill-result--flash' : ''}`}>
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">SKILL CODEX</span>
          <h3>技能详情</h3>
        </div>
        <span className="skill-position-badge">技能{SKILL_NUMERALS[safeActiveIndex]}</span>
      </div>

      {/* Current selected skill card */}
      <V6SkillCard
        skill={skill}
        slotIndex={safeActiveIndex}
        contributions={build.trace.contributions}
        isActive={true}
        onSelect={() => {}}
      />

      {/* Skill roster */}
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
