// src/pages/PlayPage.tsx
// V6-5: V6 引擎独占，旧引擎已退场，SkillScene 直接消费 AnimationSpec

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { GeneratedBuild } from '../types/v6.ts';
import { generateBuildV6 } from '../engine/v6/generateBuildV6.ts';
import { diffBuilds } from '../engine/v6/diffBuilds.ts';
import { SKILL_SEEDS } from '../data/skillSeeds.ts';
import { RunePool } from '../components/RunePool.tsx';
import { RuneSlotBar } from '../components/RuneSlotBar.tsx';
import { SkillResultPanel } from '../components/SkillResultPanel.tsx';
import { ComparePanel } from '../components/ComparePanel.tsx';
import { ChangeLedger } from '../components/ChangeLedger.tsx';
import { SkillScene } from '../components/SkillScene.tsx';

const DEFAULT_COMPARE_A = [
  'fire_flow', 'frost_zone', 'lightning_mark', 'wind_impact',
];
const DEFAULT_COMPARE_B = [
  'wind_impact', 'lightning_mark', 'frost_zone', 'fire_flow',
];

export interface PlayPageBuildState {
  seedIds: string[];
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
  // Slots store seedId strings
  const [slots, setSlots] = useState<(string | null)[]>(
    initialSeeds
      ? [...initialSeeds, ...Array(4 - initialSeeds.length).fill(null)]
      : [null, null, null, null],
  );
  const [v6PreviousBuild, setV6PreviousBuild] = useState<GeneratedBuild | null>(null);
  const [compareA, setCompareA] = useState<GeneratedBuild | null>(null);
  const [compareB, setCompareB] = useState<GeneratedBuild | null>(null);
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

  // V6 engine call
  const v6Build = useMemo(() => {
    if (filledSeedIds.length === 0) return null;
    try {
      return generateBuildV6({ seedIds: filledSeedIds });
    } catch {
      return null;
    }
  }, [filledSeedIds]);

  // V6 change ledger
  const changeDiffs = useMemo(() => {
    if (!v6PreviousBuild || !v6Build) return null;
    return diffBuilds(v6PreviousBuild, v6Build);
  }, [v6PreviousBuild, v6Build]);

  // Notify parent of build changes
  useEffect(() => {
    if (onBuildChange) {
      onBuildChange({
        seedIds: filledSeedIds,
        v6Build,
        v6PreviousBuild,
      });
    }
  }, [filledSeedIds, v6Build, v6PreviousBuild, onBuildChange]);

  /** Add seed to first empty slot */
  const handleAddSeed = useCallback((seedId: string) => {
    const emptyIndex = slots.findIndex((slot) => slot === null);
    if (emptyIndex === -1) return;

    setV6PreviousBuild(v6Build);
    const next = [...slots];
    next[emptyIndex] = seedId;
    setSlots(next);
    setJustFilledIndex(emptyIndex);
  }, [v6Build, slots]);

  // Pulse animation after seed fill
  useEffect(() => {
    if (justFilledIndex === null) return;
    const timer = setTimeout(() => setJustFilledIndex(null), 400);
    return () => clearTimeout(timer);
  }, [justFilledIndex]);

  /** Remove from slot */
  const handleRemoveRune = useCallback((index: number) => {
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
  }, [v6Build, filledCount]);

  /** Drag reorder */
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const targetIndex = Math.min(toIndex, Math.max(0, filledCount - 1));
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
  }, [v6Build, filledCount]);

  /** Reset */
  const handleReset = useCallback(() => {
    setV6PreviousBuild(v6Build);
    setSlots([null, null, null, null]);
    setPreviewBuild(null);
    setActiveSkillIndex(0);
    setJustFilledIndex(null);
  }, [v6Build]);

  /** Random fill */
  const handleRandomFill = useCallback(() => {
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
  }, [v6Build]);

  /** Default compare example */
  const handleDefaultCompare = useCallback(() => {
    try {
      const buildA = generateBuildV6({ seedIds: DEFAULT_COMPARE_A });
      const buildB = generateBuildV6({ seedIds: DEFAULT_COMPARE_B });
      setCompareA(buildA);
      setCompareB(buildB);

      if (slots.every((slot) => slot === null)) {
        setV6PreviousBuild(v6Build);
        setSlots([...DEFAULT_COMPARE_A]);
        setJustFilledIndex(3);
      }
    } catch { /* engine error — ignore */ }
  }, [v6Build, slots]);

  /** Save current build to compare */
  const handleSaveCompare = useCallback(() => {
    if (!v6Build) return;
    if (!compareA) {
      setCompareA(v6Build);
      setCompareSlot('A');
    } else if (!compareB) {
      setCompareB(v6Build);
      setCompareSlot('B');
    } else {
      setCompareA(v6Build);
      setCompareSlot('A');
    }
  }, [v6Build, compareA, compareB]);

  const handleClearCompare = useCallback(
    (slot: 'A' | 'B') => {
      if (slot === 'A') {
        setCompareA(null);
        if (compareSlot === 'A') setCompareSlot(null);
      } else {
        setCompareB(null);
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

  // Animation spec — 直接传递 V6 AnimationSpec
  const displayedBuild = previewBuild ?? v6Build;
  const safeActiveSkillIndex = Math.min(
    activeSkillIndex,
    Math.max(0, (v6Build?.skills.length ?? 1) - 1),
  );
  const displayedSkill = displayedBuild?.skills[previewBuild ? previewSkillIndex : safeActiveSkillIndex] ?? null;
  const currentAnimSpec = displayedSkill?.animation ?? null;

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
            spec={currentAnimSpec}
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

      {/* Change ledger */}
      <ChangeLedger
        diffs={changeDiffs}
        prevSeedIds={v6PreviousBuild?.input.seedIds ?? []}
        currSeedIds={v6Build?.input.seedIds ?? []}
      />

      <ComparePanel
        buildA={compareA}
        buildB={compareB}
        onClear={handleClearCompare}
        onReplay={handleReplayAnimation}
      />
    </div>
  );
}
