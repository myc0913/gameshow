import type { VectorDim } from '../data/vectorDims.ts';
import type { SkillParams } from '../types/skill.ts';
import { clamp, roundTo } from './vectorMath.ts';
import type { RuneId } from '../types/rune.ts';

/** 从最终向量解码技能标签 */
export function decodeTags(
  finalVector: number[],
  dimIndex: (dim: VectorDim) => number,
): { tags: string[]; reasons: string[] } {
  const tags: string[] = [];
  const reasons: string[] = [];

  const v = (dim: VectorDim) => finalVector[dimIndex(dim)];

  const rules: Array<{ dim: VectorDim; threshold: number; tag: string }> = [
    { dim: 'spread', threshold: 0.5, tag: 'AOE' },
    { dim: 'dot', threshold: 0.45, tag: '持续伤害' },
    { dim: 'burst', threshold: 0.55, tag: '爆发' },
    { dim: 'slow', threshold: 0.4, tag: '减速' },
    { dim: 'crystallize', threshold: 0.5, tag: '冻结' },
    { dim: 'zoneControl', threshold: 0.5, tag: '区域控制' },
    { dim: 'chain', threshold: 0.55, tag: '连锁' },
    { dim: 'delay', threshold: 0.45, tag: '延迟触发' },
    { dim: 'instantBurst', threshold: 0.55, tag: '瞬时爆发' },
    { dim: 'pierce', threshold: 0.5, tag: '穿刺' },
    { dim: 'bind', threshold: 0.45, tag: '禁锢' },
    { dim: 'structure', threshold: 0.5, tag: '结构造物' },
    { dim: 'conditional', threshold: 0.5, tag: '条件触发' },
    { dim: 'markAmplify', threshold: 0.5, tag: '标记增幅' },
    { dim: 'displacement', threshold: 0.5, tag: '击退/位移' },
    { dim: 'haste', threshold: 0.5, tag: '高速释放' },
  ];

  for (const { dim, threshold, tag } of rules) {
    if (v(dim) > threshold) {
      tags.push(tag);
      reasons.push(`${dim}=${v(dim).toFixed(2)} > ${threshold} → ${tag}`);
    }
  }

  return { tags: tags.slice(0, 6), reasons };
}

/** 从最终向量解码技能参数 */
export function decodeParams(
  finalVector: number[],
  dimIndex: (dim: VectorDim) => number,
  runeIds: RuneId[],
): SkillParams {
  const v = (dim: VectorDim) => finalVector[dimIndex(dim)];

  const rangePower = clamp(
    Math.round(((v('spread') + v('zoneControl') + v('structure') * 0.5) / 2.5) * 100),
    0,
    100,
  );
  const controlPower = clamp(
    Math.round(((v('slow') + v('crystallize') + v('bind') + v('zoneControl')) / 4) * 100),
    0,
    100,
  );
  const burstPower = clamp(
    Math.round(((v('burst') + v('instantBurst') + v('markAmplify') * 0.4) / 2.4) * 100),
    0,
    100,
  );
  const chainCount = clamp(Math.round(v('chain') * 5), 0, 5);
  const delaySeconds = clamp(roundTo(v('delay') * 3, 0.1), 0, 3);
  const hasCondition = v('conditional') > 0.5 || v('markAmplify') > 0.55;
  const hasDisplacement = v('displacement') > 0.5 || v('haste') > 0.6;
  const hasKnockback = v('displacement') > 0.58;
  const hasBind = v('bind') > 0.45 || v('structure') > 0.62;

  const damageType = deriveDamageType(runeIds);

  return {
    damageType,
    rangePower,
    controlPower,
    burstPower,
    chainCount,
    delaySeconds,
    hasCondition,
    hasDisplacement,
    hasKnockback,
    hasBind,
  };
}

/** 从符文组合推导伤害类型 */
function deriveDamageType(runeIds: RuneId[]): SkillParams['damageType'] {
  const elementMap: Record<RuneId, SkillParams['damageType']> = {
    fire: '火焰',
    frost: '冰霜',
    lightning: '雷电',
    stone: '岩石',
    shadow: '暗影',
    wind: '疾风',
  };

  const types = runeIds.map((id) => elementMap[id]);
  const unique = [...new Set(types)];
  if (unique.length === 1) return unique[0];

  return '混合';
}
