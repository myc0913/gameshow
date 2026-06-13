// ============================================================
// V4 核心类型：元素、行为、技能种子、语义状态
// ============================================================

/** 6 种元素 */
export type ElementKey = 'fire' | 'frost' | 'lightning' | 'stone' | 'shadow' | 'wind';

/** 元素 key 列表 */
export const ELEMENT_KEYS: ElementKey[] = [
  'fire', 'frost', 'lightning', 'stone', 'shadow', 'wind',
];

/** 16 个通用行为维度 */
export type BehaviorKey =
  | 'impact'
  | 'burst'
  | 'dot'
  | 'spread'
  | 'zone'
  | 'control'
  | 'bind'
  | 'chain'
  | 'delay'
  | 'mark'
  | 'pierce'
  | 'guard'
  | 'pullPush'
  | 'mobility'
  | 'speed'
  | 'summon';

/** 行为维度列表（固定顺序） */
export const BEHAVIOR_KEYS: BehaviorKey[] = [
  'impact', 'burst', 'dot', 'spread', 'zone', 'control',
  'bind', 'chain', 'delay', 'mark', 'pierce', 'guard',
  'pullPush', 'mobility', 'speed', 'summon',
];

/** 元素向量 */
export type ElementVector = Record<ElementKey, number>;

/** 行为向量 */
export type BehaviorVector = Record<BehaviorKey, number>;

/** 双层语义状态 */
export type SkillSemanticState = {
  element: ElementVector;
  behavior: BehaviorVector;
};

/** 固化方向 */
export type SeedAspect = 'impact' | 'flow' | 'zone' | 'mark';

/** 技能种子 */
export type SkillSeed = {
  id: string;
  element: ElementKey;
  aspect: SeedAspect;
  name: string;
  description: string;
  semantic: SkillSemanticState;
};

/** 元素互动关系 */
export type ElementPairKey = string; // `${ElementKey}+${ElementKey}` normalized

export type ElementInteraction = {
  behaviorBoost: Partial<Record<BehaviorKey, number>>;
  labelHint: string;
};

/** 技能位互馈权重 */
export type MutualFeedbackWeights = {
  self: number;
  forwardContext: number;
  backwardMutation: number;
  resonance: number;
};

/** 距离衰减权重 */
export type DistanceWeights = Record<number, number>;
