// ============================================================
// V6 构筑差异 — diffBuilds 纯函数
// 依据: docs/v6/presentation-and-migration.md §6.3
// ============================================================

import type {
  GeneratedBuild,
  SkillDiff,
  SkillOccurrenceKey,
} from '../../types/v6.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../../types/v6.ts';
import { getMechanicValue, roundTo } from './math.ts';

/**
 * 为 seed 生成出现键。
 * 格式: `${seedId}#${occurrenceIndex}`
 * occurrenceIndex 从 0 开始，处理重复 seed 时按出现顺序编号。
 */
function buildOccurrenceKeys(seedIds: string[]): SkillOccurrenceKey[] {
  const counts = new Map<string, number>();
  return seedIds.map((id) => {
    const idx = counts.get(id) ?? 0;
    counts.set(id, idx + 1);
    return `${id}#${idx}`;
  });
}

/**
 * 比较两个 GeneratedBuild，按 seed 出现键对齐，返回每个技能的差异。
 *
 * 当同一 seed 在两次构筑中处于不同槽位时，按 occurrenceKey 匹配。
 * 这样交换顺序后可以说"霜环从 slot II 移到 slot III"。
 */
export function diffBuilds(
  previous: GeneratedBuild,
  current: GeneratedBuild,
): SkillDiff[] {
  const prevKeys = buildOccurrenceKeys(previous.input.seedIds);
  const currKeys = buildOccurrenceKeys(current.input.seedIds);

  // 构建 occurrenceKey → skill 的映射
  const prevMap = new Map<SkillOccurrenceKey, { skill: typeof previous.skills[0]; slot: number }>();
  const currMap = new Map<SkillOccurrenceKey, { skill: typeof current.skills[0]; slot: number }>();

  for (let i = 0; i < previous.skills.length; i++) {
    prevMap.set(prevKeys[i], { skill: previous.skills[i], slot: i });
  }
  for (let i = 0; i < current.skills.length; i++) {
    currMap.set(currKeys[i], { skill: current.skills[i], slot: i });
  }

  const allKeys = new Set([...prevMap.keys(), ...currMap.keys()]);
  const diffs: SkillDiff[] = [];

  for (const key of allKeys) {
    const prev = prevMap.get(key);
    const curr = currMap.get(key);

    if (!prev || !curr) continue; // seed 只在一边存在时跳过

    const sA = prev.skill;
    const sB = curr.skill;

    // 参数差异
    const statDiffs: SkillDiff['statDiffs'] = [];
    for (const statKey of STAT_KEYS) {
      const valA = sA.finalStats[statKey];
      const valB = sB.finalStats[statKey];
      const delta = valB - valA;
      if (Math.abs(delta) >= 0.005) {
        statDiffs.push({
          key: statKey,
          valueA: roundTo(valA, 4),
          valueB: roundTo(valB, 4),
          delta: roundTo(delta, 4),
        });
      }
    }

    // 机制差异
    const mechanicDiffs: SkillDiff['mechanicDiffs'] = [];
    for (const mechKey of MECHANIC_KEYS) {
      const valA = getMechanicValue(sA.finalMechanics, mechKey);
      const valB = getMechanicValue(sB.finalMechanics, mechKey);
      const delta = valB - valA;
      if (Math.abs(delta) >= 0.005) {
        mechanicDiffs.push({
          key: mechKey,
          valueA: roundTo(valA, 4),
          valueB: roundTo(valB, 4),
          delta: roundTo(delta, 4),
        });
      }
    }

    // Cue 变化
    const forwardCueChanged =
      sA.animation.forwardCue?.visualCue !== sB.animation.forwardCue?.visualCue;
    const backwardCueChanged =
      sA.animation.backwardCue?.visualCue !== sB.animation.backwardCue?.visualCue;

    diffs.push({
      occurrenceKey: key,
      seedId: sA.seedId,
      baseName: sA.baseName,
      generatedNameA: sA.generatedName,
      generatedNameB: sB.generatedName,
      slotA: prev.slot,
      slotB: curr.slot,
      statDiffs,
      mechanicDiffs,
      forwardCueA: sA.animation.forwardCue?.visualCue,
      forwardCueB: sB.animation.forwardCue?.visualCue,
      backwardCueA: sA.animation.backwardCue?.visualCue,
      backwardCueB: sB.animation.backwardCue?.visualCue,
      forwardCueChanged,
      backwardCueChanged,
    });
  }

  return diffs;
}
