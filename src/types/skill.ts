import type { RuneId } from './rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';

/** generateSkill() 输入 */
export type GenerateSkillInput = {
  runeIds: RuneId[];
  seed?: string;
};

/** 技能参数 */
export type SkillParams = {
  damageType: '火焰' | '冰霜' | '雷电' | '岩石' | '暗影' | '疾风' | '混合';
  rangePower: number;
  controlPower: number;
  burstPower: number;
  chainCount: number;
  delaySeconds: number;
  hasCondition: boolean;
  hasDisplacement: boolean;
  hasKnockback: boolean;
  hasBind: boolean;
};

/** 技能动画参数 */
export type SkillAnimationParams = {
  primaryColor: string;
  secondaryColor: string;
  particleCount: number;
  spreadRadius: number;
  burstIntensity: number;
  chainCount: number;
};

/** 生成过程 trace */
export type SkillGenerationTrace = {
  positionedVectors: Array<{
    slotIndex: number;
    runeId: RuneId;
    role: 'origin' | 'shape' | 'trigger' | 'finish';
    topDims: Array<{ dim: VectorDim; value: number }>;
  }>;
  interactionScores: number[][];
  attentionWeights: number[][];
  finalTopDims: Array<{ dim: VectorDim; value: number }>;
  decodeReasons: string[];
};

/** 特殊共鸣结果 */
export type SpecialResonanceResult = {
  id: string;
  label: string;
  explanation: string;
};

/** generateSkill() 输出 */
export type GeneratedSkill = {
  id: string;
  runeIds: RuneId[];
  name: string;
  description: string;
  tags: string[];
  params: SkillParams;
  finalVector: Record<VectorDim, number>;
  topDims: Array<{ dim: VectorDim; value: number }>;
  trace: SkillGenerationTrace;
  resonance?: SpecialResonanceResult;
  animationParams: SkillAnimationParams;
};
