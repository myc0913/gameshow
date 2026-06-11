import type { RuneId } from '../types/rune.ts';
import type {
  GeneratedSkill,
  GenerateSkillInput,
  SkillAnimationParams,
} from '../types/skill.ts';
import type { VectorDim } from '../data/vectorDims.ts';
import { VECTOR_DIMS } from '../data/vectorDims.ts';
import { getRuneVector, RUNES } from '../data/runes.ts';
import { getTopDims, toDimRecord } from './vectorMath.ts';
import { applyPositionEncoding } from './positionEncoding.ts';
import { computeAttention } from './attentionEngine.ts';
import { decodeTags, decodeParams } from './skillDecoder.ts';
import { generateSkillName, generateDescription } from './skillNameGenerator.ts';
import { checkSpecialResonance } from './specialResonance.ts';

/** 维度名 → 索引的快速查找 */
function makeDimIndex(): (dim: VectorDim) => number {
  const map = {} as Record<string, number>;
  for (let i = 0; i < VECTOR_DIMS.length; i++) {
    map[VECTOR_DIMS[i]] = i;
  }
  return (dim: VectorDim) => map[dim];
}

/**
 * 规则引擎核心：根据 4 枚符文及其排列顺序生成技能。
 * 纯函数，相同输入始终产生相同输出。
 *
 * 管道：符文向量 → 位置编码 → 注意力交互 → 共鸣检查 → 解码 → 命名
 */
export function generateSkill(input: GenerateSkillInput): GeneratedSkill {
  const { runeIds, seed } = input;

  if (runeIds.length !== 4) {
    throw new Error(
      `generateSkill requires exactly 4 runeIds, got ${runeIds.length}`,
    );
  }

  const dimIndex = makeDimIndex();

  // 1. 位置编码：槽位角色 + 倍率 + 维度偏置
  const positioned = applyPositionEncoding(runeIds, getRuneVector);

  // 2. 注意力交互：计算符文间交互分数 + 加权聚合
  const { finalVector, interactionScores, attentionWeights } =
    computeAttention(positioned);

  // 3. 特殊共鸣检查（seed 可复现）
  const { resonance, modifier } = checkSpecialResonance(runeIds, seed);

  // 应用共鸣修正到最终向量
  let modifiedVector = finalVector;
  if (Object.keys(modifier).length > 0) {
    modifiedVector = finalVector.map((v, i) => {
      const dimName = VECTOR_DIMS[i];
      return v + (modifier[dimName] ?? 0);
    });
  }

  // 4. 提取 Top 5 维度
  const topDims = getTopDims(modifiedVector, 5);

  // 5. 标签解码
  const { tags, reasons: decodeReasons } = decodeTags(modifiedVector, dimIndex);

  // 6. 参数解码
  const params = decodeParams(modifiedVector, dimIndex, runeIds);

  // 7. 命名 + 描述
  const name = generateSkillName(runeIds, topDims);
  const description = generateDescription(runeIds, tags, topDims);

  // 8. 动画参数
  const animationParams = deriveAnimationParams(
    runeIds,
    modifiedVector,
    params,
  );

  // 9. 生成唯一 ID
  const id = seed
    ? `${runeIds.join('-')}_${seed}`
    : `${runeIds.join('-')}_${Date.now()}`;

  return {
    id,
    runeIds,
    name,
    description,
    tags,
    params,
    finalVector: toDimRecord(modifiedVector),
    topDims,
    trace: {
      positionedVectors: positioned.map((p) => ({
        slotIndex: p.slotIndex,
        runeId: p.runeId,
        role: p.role,
        topDims: p.topDims,
      })),
      interactionScores,
      attentionWeights,
      finalTopDims: topDims,
      decodeReasons,
    },
    resonance,
    animationParams,
  };
}

/** 从最终向量推导动画参数 */
function deriveAnimationParams(
  runeIds: RuneId[],
  _vector: number[],
  params: GeneratedSkill['params'],
): SkillAnimationParams {
  const primaryRune = RUNES[runeIds[0]];

  return {
    primaryColor: primaryRune.color,
    secondaryColor: RUNES[runeIds[runeIds.length - 1]].color,
    particleCount: 20 + Math.round(params.rangePower * 0.8),
    spreadRadius: 1 + params.rangePower / 50,
    burstIntensity: params.burstPower / 100,
    chainCount: params.chainCount,
  };
}
