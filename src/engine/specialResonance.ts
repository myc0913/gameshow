import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';
import type { SpecialResonanceResult } from '../types/skill.ts';

type SpecialResonanceRule = {
  id: string;
  label: string;
  requiredRunes: RuneId[];
  requiredOrderPattern?: RuneId[];
  seedChance: number;
  resultModifier: Partial<Record<VectorDim, number>>;
  explanation: string;
};

const SPECIAL_RESONANCES: SpecialResonanceRule[] = [
  {
    id: 'storm_prison',
    label: '风雷锁域',
    requiredRunes: ['wind', 'lightning', 'frost', 'stone'],
    requiredOrderPattern: ['wind', 'lightning'],
    seedChance: 0.15,
    resultModifier: {
      chain: 0.2,
      bind: 0.2,
      delay: 0.15,
    },
    explanation:
      '疾风作为起手推动雷电形成连续跳跃，后续冰霜与岩石将跳跃轨迹固化为锁域。',
  },
  {
    id: 'shadow_flame',
    label: '暗火处决',
    requiredRunes: ['shadow', 'fire', 'shadow', 'fire'],
    seedChance: 0.12,
    resultModifier: {
      markAmplify: 0.25,
      burst: 0.2,
      conditional: 0.15,
    },
    explanation:
      '暗影与火焰交替铭刻形成标记-引爆循环，每次条件触发后爆发伤害提升。',
  },
];

/**
 * 检查并应用特殊共鸣。必须 seed 可复现。
 */
export function checkSpecialResonance(
  runeIds: RuneId[],
  seed?: string,
): {
  resonance?: SpecialResonanceResult;
  modifier: Partial<Record<VectorDim, number>>;
} {
  for (const rule of SPECIAL_RESONANCES) {
    const runesSorted = [...runeIds].sort();
    const requiredSorted = [...rule.requiredRunes].sort();
    const runesMatch =
      runesSorted.length === requiredSorted.length &&
      runesSorted.every((r, i) => r === requiredSorted[i]);

    if (!runesMatch) continue;

    if (rule.requiredOrderPattern) {
      const pattern = rule.requiredOrderPattern;
      const matchesPattern = pattern.every(
        (runeId, i) => runeIds[i] === runeId,
      );
      if (!matchesPattern) continue;
    }

    const chanceValue = seed
      ? deterministicRandom(seed + rule.id)
      : Math.random();

    if (chanceValue < rule.seedChance) {
      return {
        resonance: {
          id: rule.id,
          label: rule.label,
          explanation: rule.explanation,
        },
        modifier: rule.resultModifier,
      };
    }
  }

  return { modifier: {} };
}

/** 简单的确定性随机（基于字符串 hash） */
function deterministicRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash * 31 + char) % 1000003;
  }
  return (hash % 1000) / 1000;
}
