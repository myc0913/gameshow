// ============================================================
// V6 能力规则 — 参数驱动映射、机制驱动映射、形态接受度、元素能力边界
// 依据: docs/v6/engine-spec.md §4-§5, docs/v6/base-skills.md §5
// ============================================================

import type { StatKey, MechanicKey, SkillForm, ElementKey } from '../../types/v6.ts';

// ---- 参数驱动映射 ----
// 某个参数键由哪些基础参数驱动

export const STAT_DRIVERS: Record<StatKey, StatKey[]> = {
  power: ['power'],
  reach: ['reach', 'propagation'],
  area: ['area', 'propagation'],
  duration: ['duration'],
  speed: ['speed'],
  control: ['control'],
  force: ['force', 'power'],
  propagation: ['propagation'],
  penetration: ['penetration', 'power'],
  protection: ['protection', 'duration'],
};

// ---- 机制驱动映射 ----
// 某个机制由哪些基础参数驱动

export const MECHANIC_DRIVERS: Record<MechanicKey, StatKey[]> = {
  burn: ['power', 'duration'],
  chill: ['control', 'duration'],
  freeze: ['control', 'duration'],
  shock: ['speed', 'propagation'],
  stun: ['force', 'control'],
  knockback: ['force'],
  pull: ['force', 'control'],
  pierce: ['penetration', 'power'],
  guard: ['protection', 'duration'],
  mark: ['duration', 'control'],
  delayedBurst: ['power', 'duration'],
  chain: ['propagation', 'speed'],
  fracture: ['force', 'penetration'],
  bind: ['control', 'duration'],
  obscure: ['area', 'duration'],
  echo: ['duration', 'propagation'],
  haste: ['speed'],
};

// ---- 形态接受度修正 ----
// 基础接受度 0.75，叠加修正后 clamp 到 0.40..1.00

export const FORM_RECEPTIVITY_MODIFIERS: Record<SkillForm, Partial<Record<StatKey, number>>> = {
  projectile: {
    reach: 0.10,
    area: -0.20,
    duration: -0.15,
    speed: 0.15,
    penetration: 0.20,
  },
  cone: {
    area: 0.10,
    duration: 0.10,
    propagation: 0.05,
  },
  zone: {
    area: 0.20,
    duration: 0.20,
    speed: -0.25,
    control: 0.10,
  },
  chain: {
    propagation: 0.25,
    speed: 0.10,
    area: 0.05,
    protection: -0.20,
  },
  movement: {
    speed: 0.25,
    reach: 0.10,
    protection: 0.05,
    duration: -0.10,
    area: -0.10,
  },
  construct: {
    protection: 0.25,
    duration: 0.20,
    control: 0.10,
    speed: -0.35,
    propagation: -0.25,
  },
  mark: {
    duration: 0.20,
    control: 0.10,
    power: 0.10,
    speed: -0.15,
  },
  summon: {
    duration: 0.20,
    area: 0.15,
    force: 0.10,
    protection: 0.05,
    speed: -0.20,
  },
  line: {
    reach: 0.15,
    penetration: 0.20,
    force: 0.10,
    area: -0.05,
  },
};

// ---- 元素能力边界 ----
// 每个元素的机制能力范围

export type ElementCapabilityProfile = {
  native: MechanicKey[];
  possible: MechanicKey[];
  reactionOnly: MechanicKey[];
  forbidden: MechanicKey[];
};

export const ELEMENT_CAPABILITIES: Record<ElementKey, ElementCapabilityProfile> = {
  fire: {
    native: ['burn', 'delayedBurst', 'mark'],
    possible: ['pierce', 'fracture', 'obscure', 'echo'],
    reactionOnly: ['chain', 'stun', 'bind', 'guard', 'haste'],
    forbidden: ['freeze', 'chill', 'pull', 'knockback'],
  },
  frost: {
    native: ['chill', 'freeze', 'guard'],
    possible: ['pierce', 'bind', 'obscure', 'fracture', 'mark'],
    reactionOnly: ['burn', 'delayedBurst', 'echo', 'stun'],
    forbidden: ['shock', 'chain', 'knockback', 'haste'],
  },
  lightning: {
    native: ['shock', 'chain', 'pierce', 'haste'],
    possible: ['mark', 'delayedBurst', 'stun', 'fracture', 'echo'],
    reactionOnly: ['burn', 'obscure', 'bind'],
    forbidden: ['freeze', 'chill', 'guard', 'pull', 'knockback'],
  },
  stone: {
    native: ['stun', 'fracture', 'guard', 'knockback'],
    possible: ['pierce', 'bind', 'mark', 'delayedBurst'],
    reactionOnly: ['burn', 'chill', 'obscure'],
    forbidden: ['shock', 'chain', 'pull', 'haste', 'freeze'],
  },
  shadow: {
    native: ['mark', 'delayedBurst', 'obscure', 'bind', 'echo'],
    possible: ['pierce', 'chill', 'fracture'],
    reactionOnly: ['burn', 'shock', 'stun'],
    forbidden: ['guard', 'pull', 'knockback', 'haste', 'chain'],
  },
  wind: {
    native: ['knockback', 'pull', 'haste', 'pierce'],
    possible: ['chain', 'obscure', 'echo', 'mark', 'stun'],
    reactionOnly: ['burn', 'chill', 'fracture', 'delayedBurst'],
    forbidden: ['freeze', 'guard', 'bind'],
  },
};

// ---- 聚合上限常量 ----

export const CAPS = {
  forwardStat: 0.35,
  backwardStat: 0.18,
  forwardMechanic: 0.65,
  backwardMechanic: 0.35,
  finalStatMin: 0,
  finalStatMax: 1,
  finalMechanicMin: 0,
  finalMechanicMax: 1,
  accentForward: 0.35,
  accentBackward: 0.18,
} as const;

// ---- 全局增益常量 ----

export const FORWARD_PASS_GAIN = 1.35;
export const BACKWARD_PASS_GAIN = 1.00;

// ---- 后位权威度 (绑定绝对槽位) ----

export const BACKWARD_AUTHORITY_BY_SLOT: number[] = [
  0.00, // slot 0 — 不存在后向来源
  0.70, // slot 1
  0.85, // slot 2
  1.00, // slot 3
];

// ---- 基础来源表达系数 ----

export const SOURCE_EXPRESSION_BASE = 0.55;
export const SOURCE_EXPRESSION_RANGE = 0.45;

// ---- 基础形态接受度 ----

export const FORM_RECEPTIVITY_BASE = 0.75;
export const MECHANIC_FORM_RECEPTIVITY = 0.85; // 机制的固定接受度
