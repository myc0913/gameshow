// ============================================================
// V6 类型合同 — 元素、技能形态、参数、机制、快照、Trace
// 依据: docs/v6/engine-spec.md, docs/v6/base-skills.md
// ============================================================

// ---- 元素 (6) ----

export type ElementKey =
  | 'fire'
  | 'frost'
  | 'lightning'
  | 'stone'
  | 'shadow'
  | 'wind';

export const ELEMENT_KEYS: ElementKey[] = [
  'fire', 'frost', 'lightning', 'stone', 'shadow', 'wind',
];

// ---- 技能形态 (9) ----

export type SkillForm =
  | 'projectile'
  | 'cone'
  | 'zone'
  | 'chain'
  | 'movement'
  | 'construct'
  | 'mark'
  | 'summon'
  | 'line';

export type AnimationTrajectory = 'none' | 'straight' | 'arc' | 'drop' | 'ground';

// ---- Seed Aspect (4) ----

export type SeedAspect = 'impact' | 'flow' | 'zone' | 'mark';

// ---- 连续参数 (10) ----

export type StatKey =
  | 'power'
  | 'reach'
  | 'area'
  | 'duration'
  | 'speed'
  | 'control'
  | 'force'
  | 'propagation'
  | 'penetration'
  | 'protection';

export const STAT_KEYS: StatKey[] = [
  'power', 'reach', 'area', 'duration', 'speed',
  'control', 'force', 'propagation', 'penetration', 'protection',
];

export type NormalizedStats = Record<StatKey, number>;

// ---- 离散机制 (17) ----

export type MechanicKey =
  | 'burn'
  | 'chill'
  | 'freeze'
  | 'shock'
  | 'stun'
  | 'knockback'
  | 'pull'
  | 'pierce'
  | 'guard'
  | 'mark'
  | 'delayedBurst'
  | 'chain'
  | 'fracture'
  | 'bind'
  | 'obscure'
  | 'echo'
  | 'haste';

export const MECHANIC_KEYS: MechanicKey[] = [
  'burn', 'chill', 'freeze', 'shock', 'stun',
  'knockback', 'pull', 'pierce', 'guard', 'mark',
  'delayedBurst', 'chain', 'fracture', 'bind', 'obscure',
  'echo', 'haste',
];

export type MechanicState = Partial<Record<MechanicKey, number>>;

// ---- 视觉 Cue (31) ----

export type VisualCueKey =
  | 'same_element_resonance'
  | 'steam_melt'
  | 'thermal_overload'
  | 'molten_fracture'
  | 'hidden_ember'
  | 'fire_spread'
  | 'cold_suppression'
  | 'cold_drag'
  | 'frozen_reinforcement'
  | 'frost_bind'
  | 'ice_mist'
  | 'ignition_surge'
  | 'thermal_shatter'
  | 'stone_shock_fracture'
  | 'shadow_reveal'
  | 'storm_agitation'
  | 'kiln_focus'
  | 'ice_stone_composite'
  | 'grounding_block'
  | 'shadow_seal'
  | 'wind_break'
  | 'hidden_flame'
  | 'black_ice'
  | 'latent_lightning'
  | 'shadow_erosion'
  | 'hidden_turbulence'
  | 'wind_fan_flame'
  | 'snow_carry'
  | 'storm_channel'
  | 'dust_erosion'
  | 'shadow_drift';

// ---- 反应包 ----

export type ReactionPackage = {
  affinity: number;
  statDeltas: Partial<Record<StatKey, number>>;
  mechanicDeltas: Partial<Record<MechanicKey, number>>;
  accentStrength: number;
  visualCue: VisualCueKey;
};

// ---- 定向元素反应规则 ----

export type DirectedReactionRule = {
  source: ElementKey;
  target: ElementKey;
  name: string;
  rationale: string;
  forward: ReactionPackage;
  backward: ReactionPackage;
};

// ---- 基础技能定义 ----

export type BaseSkillDefinition = {
  id: string;
  name: string;
  element: ElementKey;
  aspect: SeedAspect;
  form: SkillForm;
  coreEffect: string;
  baseStats: NormalizedStats;
  nativeMechanics: MechanicState;
  visualProfile: {
    trajectory?: AnimationTrajectory;
  };
};

// ---- 元素 Accent ----

export type ElementAccent = {
  element: ElementKey;
  strength: number;
  pass: 'forward' | 'backward';
  sourceSlots: number[];
  visualCue: VisualCueKey;
};

// ---- 技能快照 ----

export type SkillSnapshot = {
  slot: number;
  seedId: string;
  primaryElement: ElementKey;
  aspect: SeedAspect;
  form: SkillForm;
  coreEffect: string;
  stats: NormalizedStats;
  mechanics: MechanicState;
  accents: ElementAccent[];
};

// ---- 出站投影 ----

export type OutboundSignature = {
  slot: number;
  primaryElement: ElementKey;
  form: SkillForm;
  stats: NormalizedStats;
};

// ---- 变化摘要 ----

export type ChangeSummary = {
  key: StatKey | MechanicKey;
  kind: 'stat' | 'mechanic';
  baseValue: number;
  forwardValue: number;
  finalValue: number;
  delta: number;
  sources: Array<{
    slot: number;
    pass: 'forward' | 'backward';
  }>;
  direction: 'increase' | 'decrease' | 'mixed';
};

// ---- 动画规格 ----

export type AnimationCue = {
  visualCue: VisualCueKey;
  sourceElement: ElementKey;
  pass: 'forward' | 'backward';
  strength: number;
  sourceSlots: number[];
};

export type AnimationSpec = {
  form: SkillForm;
  primaryElement: ElementKey;
  primaryPalette: string[];
  trajectory: AnimationTrajectory;
  timing: {
    windupSeconds: number;
    travelSeconds: number;
    lingerSeconds: number;
    pulseIntervalSeconds: number;
  };
  geometry: {
    reach: number;
    radius: number;
    width: number;
    count: number;
    impactScale: number;
    displacement: number;
  };
  mechanics: MechanicState;
  forwardCue?: AnimationCue;
  backwardCue?: AnimationCue;
};

// ---- 生成技能输出 ----

export type GeneratedSkill = {
  slot: number;
  seedId: string;
  baseName: string;
  generatedName: string;
  primaryElement: ElementKey;
  aspect: SeedAspect;
  form: SkillForm;
  coreEffect: string;
  description: string;
  baseStats: NormalizedStats;
  forwardStats: NormalizedStats;
  finalStats: NormalizedStats;
  baseMechanics: MechanicState;
  forwardMechanics: MechanicState;
  finalMechanics: MechanicState;
  accents: ElementAccent[];
  changes: ChangeSummary[];
  tags: string[];
  animation: AnimationSpec;
};

// ---- Trace ----

export type ContributionTrace = {
  id: string;
  pass: 'forward' | 'backward';
  sourceSlot: number;
  targetSlot: number;
  sourceSeedId: string;
  targetSeedId: string;
  sourceElement: ElementKey;
  targetElement: ElementKey;
  reactionKey: string;
  reactionName: string;
  key: StatKey | MechanicKey | 'accent';
  kind: 'stat' | 'mechanic' | 'accent';
  ruleDelta: number;
  affinity: number;
  distanceFactor: number;
  authorityFactor: number;
  sourceExpression: number;
  targetReceptivity: number;
  rawDelta: number;
  acceptedDelta: number;
  status: 'accepted' | 'rejected';
  rejectionReason?: string;
  explanation: string;
};

export type AggregateTrace = {
  id: string;
  pass: 'forward' | 'backward';
  targetSlot: number;
  key: StatKey | MechanicKey;
  contributionIds: string[];
  signedSum: number;
  cap: number;
  saturatedDelta: number;
  valueBefore: number;
  valueAfter: number;
};

export type SkillStageTrace = {
  slot: number;
  seedId: string;
  base: SkillSnapshot;
  afterForward: SkillSnapshot;
  final: SkillSnapshot;
  contributionIds: string[];
  aggregateIds: string[];
  dominantForwardContributionId?: string;
  dominantBackwardContributionId?: string;
};

export type BuildTrace = {
  version: 'v6';
  inputSeedIds: string[];
  contributions: ContributionTrace[];
  aggregates: AggregateTrace[];
  skills: SkillStageTrace[];
};

// ---- 引擎输入/输出 ----

export type GenerateBuildInput = {
  seedIds: string[];
};

export type GeneratedBuild = {
  version: 'v6';
  input: GenerateBuildInput;
  skills: GeneratedSkill[];
  trace: BuildTrace;
};

// ---- 构筑差异 (A/B 对比与 diffBuilds 使用) ----

/**
 * 技能出现键，用于跨构筑追踪同一 seed。
 * 格式: `${seedId}#${occurrenceIndex}`
 * occurrenceIndex 从 0 开始，处理重复 seed 时按出现顺序编号。
 * 例如输入 [fire_flow, frost_zone, fire_flow] 中，
 * 第一个 fire_flow 的 key 为 "fire_flow#0"，第二个为 "fire_flow#1"。
 */
export type SkillOccurrenceKey = string;

/**
 * 单个技能在两个构筑间的差异。
 * 由 diffBuilds() 纯函数生成，用于 Play 页的变化账本和 A/B 对比视图。
 */
export type SkillDiff = {
  occurrenceKey: SkillOccurrenceKey;
  seedId: string;
  baseName: string;
  generatedNameA: string;
  generatedNameB: string;
  slotA: number;
  slotB: number;
  statDiffs: Array<{ key: StatKey; valueA: number; valueB: number; delta: number }>;
  mechanicDiffs: Array<{ key: MechanicKey; valueA: number; valueB: number; delta: number }>;
  forwardCueA?: VisualCueKey;
  forwardCueB?: VisualCueKey;
  backwardCueA?: VisualCueKey;
  backwardCueB?: VisualCueKey;
  forwardCueChanged: boolean;
  backwardCueChanged: boolean;
};
