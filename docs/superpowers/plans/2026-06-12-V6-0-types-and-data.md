# V6-0: Types & Static Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create all V6 TypeScript types and static data (24 base skills, 36 reaction rules, capability boundaries, naming lexicon) as parallel modules alongside existing V4 code. Zero engine logic — pure data and type contracts.

**Architecture:** V6 code lives in parallel modules (`src/types/v6.ts`, `src/data/v6/`, `src/engine/v6/`). Existing V4 code is untouched. All V6 data is validated on module load. Types follow the exact contracts in `docs/v6/engine-spec.md`, `docs/v6/base-skills.md`, and `docs/v6/element-reactions.md`.

**Tech Stack:** TypeScript 5+, pure data modules, no React/DOM/Three.js dependencies.

---

## File Structure

```
src/
  types/
    v6.ts                    — [新建] 所有 V6 TypeScript 类型合同
  data/
    v6/
      baseSkills.ts          — [新建] 24 个基础技能定义
      reactionRules.ts       — [新建] 36 个定向元素反应规则
      capabilityRules.ts     — [新建] 元素能力边界 + 参数/机制驱动映射 + 形态接受度
      namingLexicon.ts       — [新建] 命名前缀/后缀词库 + VisualCue 映射
  engine/
    v6/
      validation.ts          — [新建] 数据加载校验纯函数
```

---

### Task 1: Create `src/types/v6.ts` — All V6 Type Contracts

**Files:**
- Create: `src/types/v6.ts`

- [ ] **Step 1: Write the complete V6 type definitions**

```ts
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

// ---- 构筑差异 ----

export type SkillOccurrenceKey = string; // `${seedId}#${occurrenceIndex}`

export type SkillDiff = {
  occurrenceKey: SkillOccurrenceKey;
  seedId: string;
  slotA: number;
  slotB: number;
  statDiffs: Array<{ key: StatKey; valueA: number; valueB: number; delta: number }>;
  mechanicDiffs: Array<{ key: MechanicKey; valueA: number; valueB: number; delta: number }>;
  forwardCueChanged: boolean;
  backwardCueChanged: boolean;
};
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors related to v6.ts (may have errors from other files, that's OK).

---

### Task 2: Create `src/data/v6/baseSkills.ts` — 24 Base Skill Definitions

**Files:**
- Create: `src/data/v6/baseSkills.ts`

- [ ] **Step 1: Write helper functions and base skills data**

```ts
// ============================================================
// V6 基础技能数据 — 24 个技能 (6 元素 × 4 aspect)
// 依据: docs/v6/base-skills.md §6
// ============================================================

import type {
  BaseSkillDefinition,
  NormalizedStats,
  MechanicState,
  ElementKey,
  SkillForm,
  AnimationTrajectory,
} from '../../types/v6.ts';

// ---- 辅助 ----

function stats(
  power: number,
  reach: number,
  area: number,
  duration: number,
  speed: number,
  control: number,
  force: number,
  propagation: number,
  penetration: number,
  protection: number,
): NormalizedStats {
  // 文档值为 0..100，进入引擎时除以 100
  return {
    power: power / 100,
    reach: reach / 100,
    area: area / 100,
    duration: duration / 100,
    speed: speed / 100,
    control: control / 100,
    force: force / 100,
    propagation: propagation / 100,
    penetration: penetration / 100,
    protection: protection / 100,
  };
}

function mechs(init: MechanicState = {}): MechanicState {
  return init;
}

// ---- 默认动画轨迹 ----

export const DEFAULT_TRAJECTORY_BY_FORM: Record<SkillForm, AnimationTrajectory> = {
  projectile: 'straight',
  cone: 'none',
  zone: 'none',
  chain: 'none',
  movement: 'straight',
  construct: 'ground',
  mark: 'none',
  summon: 'none',
  line: 'ground',
};

// ---- 元素调色板 ----

export const ELEMENT_PALETTES: Record<ElementKey, { primary: string; highlight: string; shadow: string }> = {
  fire:    { primary: '#ff5a36', highlight: '#ffb13b', shadow: '#6b1d12' },
  frost:   { primary: '#8fe8ff', highlight: '#dff8ff', shadow: '#4d82d6' },
  lightning: { primary: '#d9efff', highlight: '#8f7cff', shadow: '#f8f4ff' },
  stone:   { primary: '#b79568', highlight: '#6d5842', shadow: '#d9c6a3' },
  shadow:  { primary: '#7a4dba', highlight: '#241735', shadow: '#c05ad9' },
  wind:    { primary: '#a8f2dc', highlight: '#e8fff8', shadow: '#63b9b0' },
};

// ============================================================
// 24 个基础技能
// 参数列顺序: 威力/射程/范围/持续/速度/控制/力量/传播/穿透/防护
// ============================================================

export const BASE_SKILLS: BaseSkillDefinition[] = [
  // ---- 火 (4) ----
  {
    id: 'fire_impact',
    name: '炽焰弹',
    element: 'fire',
    aspect: 'impact',
    form: 'projectile',
    coreEffect: '发射火焰弹，命中后产生一次爆炸',
    baseStats: stats(70, 70, 35, 20, 65, 10, 35, 15, 10, 0),
    nativeMechanics: mechs({ burn: 0.55 }),
    visualProfile: {},
  },
  {
    id: 'fire_flow',
    name: '焰息',
    element: 'fire',
    aspect: 'flow',
    form: 'cone',
    coreEffect: '持续向前喷吐火焰并灼烧覆盖区域',
    baseStats: stats(55, 45, 50, 65, 45, 15, 25, 35, 5, 0),
    nativeMechanics: mechs({ burn: 0.80 }),
    visualProfile: {},
  },
  {
    id: 'fire_zone',
    name: '焚风之径',
    element: 'fire',
    aspect: 'zone',
    form: 'zone',
    coreEffect: '在地面留下持续燃烧的路径区域',
    baseStats: stats(40, 60, 70, 85, 15, 25, 5, 50, 0, 0),
    nativeMechanics: mechs({ burn: 0.75 }),
    visualProfile: {},
  },
  {
    id: 'fire_mark',
    name: '余烬印记',
    element: 'fire',
    aspect: 'mark',
    form: 'mark',
    coreEffect: '标记目标，在延迟后引发火焰爆发',
    baseStats: stats(75, 70, 45, 55, 30, 20, 30, 15, 10, 0),
    nativeMechanics: mechs({ mark: 0.80, delayedBurst: 0.85, burn: 0.35 }),
    visualProfile: {},
  },

  // ---- 冰 (4) ----
  {
    id: 'frost_impact',
    name: '冰锥',
    element: 'frost',
    aspect: 'impact',
    form: 'projectile',
    coreEffect: '发射尖锐冰锥，命中并施加寒意',
    baseStats: stats(60, 80, 10, 25, 65, 45, 10, 15, 55, 0),
    nativeMechanics: mechs({ chill: 0.75, pierce: 0.45 }),
    visualProfile: {},
  },
  {
    id: 'frost_flow',
    name: '寒流',
    element: 'frost',
    aspect: 'flow',
    form: 'cone',
    coreEffect: '持续释放寒流，降低覆盖目标的行动能力',
    baseStats: stats(35, 60, 50, 75, 35, 65, 10, 35, 10, 0),
    nativeMechanics: mechs({ chill: 0.85 }),
    visualProfile: {},
  },
  {
    id: 'frost_zone',
    name: '霜环',
    element: 'frost',
    aspect: 'zone',
    form: 'zone',
    coreEffect: '展开低温区域，逐步冻结范围内目标',
    baseStats: stats(30, 35, 80, 55, 55, 85, 20, 45, 0, 10),
    nativeMechanics: mechs({ chill: 0.85, freeze: 0.65 }),
    visualProfile: {},
  },
  {
    id: 'frost_mark',
    name: '冰墙',
    element: 'frost',
    aspect: 'mark',
    form: 'construct',
    coreEffect: '生成一面阻挡通路的持续冰墙',
    baseStats: stats(10, 55, 45, 85, 5, 70, 5, 0, 0, 90),
    nativeMechanics: mechs({ guard: 0.90, chill: 0.30 }),
    visualProfile: {},
  },

  // ---- 雷 (4) ----
  {
    id: 'lightning_impact',
    name: '闪电箭',
    element: 'lightning',
    aspect: 'impact',
    form: 'projectile',
    coreEffect: '发射高速雷击弹，快速贯穿单个目标',
    baseStats: stats(60, 90, 10, 10, 95, 40, 15, 25, 60, 0),
    nativeMechanics: mechs({ shock: 0.70, pierce: 0.45 }),
    visualProfile: {},
  },
  {
    id: 'lightning_flow',
    name: '感电链',
    element: 'lightning',
    aspect: 'flow',
    form: 'chain',
    coreEffect: '雷击在相邻目标之间连续跳跃',
    baseStats: stats(50, 75, 35, 20, 90, 50, 5, 95, 20, 0),
    nativeMechanics: mechs({ shock: 0.75, chain: 0.90 }),
    visualProfile: {},
  },
  {
    id: 'lightning_zone',
    name: '雷暴云',
    element: 'lightning',
    aspect: 'zone',
    form: 'zone',
    coreEffect: '生成持续落雷的区域',
    baseStats: stats(45, 65, 65, 70, 50, 55, 10, 60, 0, 0),
    nativeMechanics: mechs({ shock: 0.75 }),
    visualProfile: {},
  },
  {
    id: 'lightning_mark',
    name: '引雷印',
    element: 'lightning',
    aspect: 'mark',
    form: 'mark',
    coreEffect: '标记目标或位置，延迟引下一次强雷击',
    baseStats: stats(70, 80, 30, 60, 45, 45, 20, 50, 10, 0),
    nativeMechanics: mechs({ mark: 0.80, delayedBurst: 0.75, shock: 0.75 }),
    visualProfile: {},
  },

  // ---- 岩 (4) ----
  {
    id: 'stone_impact',
    name: '落石',
    element: 'stone',
    aspect: 'impact',
    form: 'projectile',
    coreEffect: '召落岩块砸击目标区域并造成震晕',
    baseStats: stats(75, 70, 40, 15, 45, 65, 80, 10, 20, 10),
    nativeMechanics: mechs({ stun: 0.60, fracture: 0.65 }),
    visualProfile: { trajectory: 'drop' },
  },
  {
    id: 'stone_flow',
    name: '岩突',
    element: 'stone',
    aspect: 'flow',
    form: 'line',
    coreEffect: '沿直线连续刺出岩脊，冲击路径目标',
    baseStats: stats(65, 65, 30, 25, 60, 55, 85, 35, 70, 0),
    nativeMechanics: mechs({ knockback: 0.55, fracture: 0.55 }),
    visualProfile: {},
  },
  {
    id: 'stone_zone',
    name: '地垒',
    element: 'stone',
    aspect: 'zone',
    form: 'construct',
    coreEffect: '升起持续石垒，阻挡攻击和通行',
    baseStats: stats(10, 55, 45, 90, 5, 75, 10, 0, 0, 95),
    nativeMechanics: mechs({ guard: 0.95 }),
    visualProfile: {},
  },
  {
    id: 'stone_mark',
    name: '震纹',
    element: 'stone',
    aspect: 'mark',
    form: 'mark',
    coreEffect: '在地面留下震纹，延迟引发一次地震冲击',
    baseStats: stats(65, 60, 55, 65, 20, 60, 70, 25, 20, 20),
    nativeMechanics: mechs({ mark: 0.75, delayedBurst: 0.75, fracture: 0.50 }),
    visualProfile: {},
  },

  // ---- 影 (4) ----
  {
    id: 'shadow_impact',
    name: '暗影突袭',
    element: 'shadow',
    aspect: 'impact',
    form: 'movement',
    coreEffect: '化作暗影突进并穿过目标造成斩击',
    baseStats: stats(65, 65, 25, 20, 90, 25, 25, 20, 75, 0),
    nativeMechanics: mechs({ pierce: 0.65, mark: 0.25 }),
    visualProfile: {},
  },
  {
    id: 'shadow_flow',
    name: '蚀影',
    element: 'shadow',
    aspect: 'flow',
    form: 'cone',
    coreEffect: '向前释放持续扩散的暗影侵蚀',
    baseStats: stats(40, 60, 45, 75, 50, 45, 10, 45, 20, 0),
    nativeMechanics: mechs({ mark: 0.55, obscure: 0.55 }),
    visualProfile: {},
  },
  {
    id: 'shadow_zone',
    name: '影缚',
    element: 'shadow',
    aspect: 'zone',
    form: 'zone',
    coreEffect: '生成暗影区域并束缚其中的目标',
    baseStats: stats(30, 55, 65, 75, 25, 85, 15, 35, 0, 5),
    nativeMechanics: mechs({ bind: 0.80, obscure: 0.50 }),
    visualProfile: {},
  },
  {
    id: 'shadow_mark',
    name: '暗蚀印',
    element: 'shadow',
    aspect: 'mark',
    form: 'mark',
    coreEffect: '留下可延迟引爆并重复回响的暗蚀印记',
    baseStats: stats(70, 75, 25, 70, 30, 45, 10, 30, 25, 0),
    nativeMechanics: mechs({ mark: 0.90, delayedBurst: 0.85, echo: 0.60 }),
    visualProfile: {},
  },

  // ---- 风 (4) ----
  {
    id: 'wind_impact',
    name: '风刃',
    element: 'wind',
    aspect: 'impact',
    form: 'projectile',
    coreEffect: '发射高速风刃切割并轻微推开目标',
    baseStats: stats(55, 70, 25, 15, 90, 20, 45, 40, 70, 0),
    nativeMechanics: mechs({ knockback: 0.45, pierce: 0.60 }),
    visualProfile: {},
  },
  {
    id: 'wind_flow',
    name: '踏风',
    element: 'wind',
    aspect: 'flow',
    form: 'movement',
    coreEffect: '借风快速位移，并短暂提高行动速度',
    baseStats: stats(20, 65, 35, 35, 100, 10, 30, 35, 10, 0),
    nativeMechanics: mechs({ haste: 0.90 }),
    visualProfile: {},
  },
  {
    id: 'wind_zone',
    name: '气旋',
    element: 'wind',
    aspect: 'zone',
    form: 'zone',
    coreEffect: '生成持续气旋，将范围内目标拉向中心',
    baseStats: stats(25, 55, 75, 70, 45, 75, 70, 65, 0, 5),
    nativeMechanics: mechs({ pull: 0.90 }),
    visualProfile: {},
  },
  {
    id: 'wind_mark',
    name: '飓风之眼',
    element: 'wind',
    aspect: 'mark',
    form: 'summon',
    coreEffect: '生成持续移动空气的风眼，周期推拉附近目标',
    baseStats: stats(40, 55, 50, 75, 35, 65, 80, 55, 10, 0),
    nativeMechanics: mechs({ pull: 0.60, knockback: 0.70 }),
    visualProfile: {},
  },
];

// ---- 快速查找 ----

const skillMap: Record<string, BaseSkillDefinition> = {};
for (const s of BASE_SKILLS) skillMap[s.id] = s;

export function getBaseSkill(id: string): BaseSkillDefinition {
  const skill = skillMap[id];
  if (!skill) throw new Error(`Unknown skill seed: ${id}`);
  return skill;
}

export function getBaseSkillsByElement(el: ElementKey): BaseSkillDefinition[] {
  return BASE_SKILLS.filter((s) => s.element === el);
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No new errors from baseSkills.ts.

---

### Task 3: Create `src/data/v6/reactionRules.ts` — 36 Directed Element Reactions

**Files:**
- Create: `src/data/v6/reactionRules.ts`

- [ ] **Step 1: Write all 36 directed reaction rules**

```ts
// ============================================================
// V6 定向元素反应规则 — 36 个方向 (6×6)
// 依据: docs/v6/element-reactions.md §4-§9
// ============================================================

import type { DirectedReactionRule, ReactionPackage } from '../../types/v6.ts';

// ---- 辅助: 创建反应包 ----

function pkg(
  affinity: number,
  statDeltas: ReactionPackage['statDeltas'],
  mechanicDeltas: ReactionPackage['mechanicDeltas'],
  accentStrength: number,
  visualCue: ReactionPackage['visualCue'],
): ReactionPackage {
  return { affinity, statDeltas, mechanicDeltas, accentStrength, visualCue };
}

// ============================================================
// 36 个定向反应规则
// ============================================================

export const DIRECTED_REACTIONS: DirectedReactionRule[] = [
  // ==================== 火作为来源 ====================
  {
    source: 'fire', target: 'fire',
    name: '烈焰共鸣',
    rationale: '同源热量让火势更旺并延长燃烧',
    forward:  pkg(0.82, { power: 0.12, area: 0.06, duration: 0.08 }, { burn: 0.18 }, 0, 'same_element_resonance'),
    backward: pkg(0.76, { power: 0.06, duration: 0.04 }, { burn: 0.10 }, 0, 'same_element_resonance'),
  },
  {
    source: 'fire', target: 'frost',
    name: '融解蒸腾',
    rationale: '火融化冰，削弱冻结，同时制造蒸汽和短促爆发',
    forward:  pkg(0.88, { power: 0.08, area: 0.10, control: -0.18, duration: -0.12 }, { chill: -0.18, freeze: -0.28, obscure: 0.18 }, 0.30, 'steam_melt'),
    backward: pkg(0.84, { power: 0.04, area: 0.05, control: -0.09, duration: -0.06 }, { freeze: -0.14, obscure: 0.10 }, 0.14, 'steam_melt'),
  },
  {
    source: 'fire', target: 'lightning',
    name: '热电过载',
    rationale: '高温让放电更猛烈但更难维持稳定路径',
    forward:  pkg(0.58, { power: 0.12, area: 0.05, propagation: -0.06, duration: -0.08 }, { shock: 0.08, delayedBurst: 0.08 }, 0.16, 'thermal_overload'),
    backward: pkg(0.52, { power: 0.06, speed: 0.03, duration: -0.04 }, { shock: 0.04 }, 0.08, 'thermal_overload'),
  },
  {
    source: 'fire', target: 'stone',
    name: '熔裂',
    rationale: '热胀冷缩和熔蚀削弱岩体稳定性，而非赋予导电',
    forward:  pkg(0.78, { power: 0.08, area: 0.05, protection: -0.18 }, { fracture: 0.24, burn: 0.08 }, 0.24, 'molten_fracture'),
    backward: pkg(0.72, { power: 0.04, protection: -0.09 }, { fracture: 0.12, burn: 0.05 }, 0.12, 'molten_fracture'),
  },
  {
    source: 'fire', target: 'shadow',
    name: '余烬潜伏',
    rationale: '暗影包裹火种，使爆发更晚、更隐蔽',
    forward:  pkg(0.66, { duration: 0.10, penetration: 0.04, speed: -0.05 }, { burn: 0.12, delayedBurst: 0.18, obscure: 0.08 }, 0.18, 'hidden_ember'),
    backward: pkg(0.60, { duration: 0.05, speed: -0.03 }, { burn: 0.07, delayedBurst: 0.10 }, 0.09, 'hidden_ember'),
  },
  {
    source: 'fire', target: 'wind',
    name: '助燃扩散',
    rationale: '流动空气扩大火势、加快展开，但可能缩短局部停留',
    forward:  pkg(0.90, { area: 0.16, speed: 0.10, propagation: 0.14, duration: -0.05 }, { burn: 0.12 }, 0.28, 'fire_spread'),
    backward: pkg(0.86, { area: 0.08, speed: 0.05, force: 0.04, duration: -0.03 }, { burn: 0.07 }, 0.14, 'fire_spread'),
  },

  // ==================== 冰作为来源 ====================
  {
    source: 'frost', target: 'fire',
    name: '冷焰压制',
    rationale: '低温压低火势，使火焰迟缓并带寒意，不把火直接变成冰',
    forward:  pkg(0.88, { power: -0.10, speed: -0.12, area: -0.06, duration: 0.08, control: 0.10 }, { burn: -0.14, chill: 0.20 }, 0.30, 'cold_suppression'),
    backward: pkg(0.84, { power: -0.05, speed: -0.06, duration: 0.04, control: 0.05 }, { burn: -0.07, chill: 0.11 }, 0.15, 'cold_suppression'),
  },
  {
    source: 'frost', target: 'frost',
    name: '深寒共鸣',
    rationale: '同源寒意积累，提高冻结稳定性',
    forward:  pkg(0.82, { duration: 0.10, control: 0.12, protection: 0.05 }, { chill: 0.16, freeze: 0.14 }, 0, 'same_element_resonance'),
    backward: pkg(0.76, { duration: 0.05, control: 0.06 }, { chill: 0.09, freeze: 0.07 }, 0, 'same_element_resonance'),
  },
  {
    source: 'frost', target: 'lightning',
    name: '低温迟滞',
    rationale: '冰层和低温使放电路径更迟缓、更集中；不宣称冰天然导电',
    forward:  pkg(0.56, { speed: -0.10, propagation: -0.10, control: 0.12, power: 0.04 }, { chill: 0.12, shock: -0.05 }, 0.16, 'cold_drag'),
    backward: pkg(0.50, { speed: -0.05, propagation: -0.05, control: 0.06 }, { chill: 0.07 }, 0.08, 'cold_drag'),
  },
  {
    source: 'frost', target: 'stone',
    name: '冻结加固',
    rationale: '冰填补缝隙可暂时稳定岩体，同时累积脆性',
    forward:  pkg(0.72, { duration: 0.08, control: 0.08, protection: 0.12, speed: -0.05 }, { chill: 0.10, fracture: 0.08 }, 0.20, 'frozen_reinforcement'),
    backward: pkg(0.66, { protection: 0.06, control: 0.04, speed: -0.03 }, { chill: 0.06, fracture: 0.04 }, 0.10, 'frozen_reinforcement'),
  },
  {
    source: 'frost', target: 'shadow',
    name: '寒蚀凝滞',
    rationale: '寒意让暗影流动变慢但更容易束缚目标',
    forward:  pkg(0.64, { speed: -0.10, duration: 0.08, control: 0.12 }, { chill: 0.14, bind: 0.10 }, 0.18, 'frost_bind'),
    backward: pkg(0.58, { speed: -0.05, duration: 0.04, control: 0.06 }, { chill: 0.08, bind: 0.05 }, 0.09, 'frost_bind'),
  },
  {
    source: 'frost', target: 'wind',
    name: '冰雾',
    rationale: '风携带冰晶扩大寒意覆盖，但流动速度受到拖累',
    forward:  pkg(0.84, { area: 0.12, propagation: 0.10, speed: -0.08, control: 0.10 }, { chill: 0.18, obscure: 0.12 }, 0.26, 'ice_mist'),
    backward: pkg(0.78, { area: 0.06, propagation: 0.05, speed: -0.04, control: 0.05 }, { chill: 0.10 }, 0.13, 'ice_mist'),
  },

  // ==================== 雷作为来源 ====================
  {
    source: 'lightning', target: 'fire',
    name: '点燃过载',
    rationale: '放电触发火焰快速爆发，提高瞬时威力但缩短持续',
    forward:  pkg(0.70, { power: 0.14, speed: 0.12, duration: -0.10 }, { shock: 0.12, delayedBurst: -0.08 }, 0.20, 'ignition_surge'),
    backward: pkg(0.64, { power: 0.07, speed: 0.06, duration: -0.05 }, { shock: 0.07 }, 0.10, 'ignition_surge'),
  },
  {
    source: 'lightning', target: 'frost',
    name: '电热脆裂',
    rationale: '瞬时热冲击使冰体破裂，提高爆发和碎片穿透，削弱稳定冻结',
    forward:  pkg(0.74, { power: 0.12, penetration: 0.10, control: -0.12, protection: -0.08 }, { fracture: 0.20, freeze: -0.12 }, 0.22, 'thermal_shatter'),
    backward: pkg(0.68, { power: 0.06, penetration: 0.05, control: -0.06 }, { fracture: 0.11, freeze: -0.06 }, 0.11, 'thermal_shatter'),
  },
  {
    source: 'lightning', target: 'lightning',
    name: '电荷共鸣',
    rationale: '同源电荷提高速度、传播和连锁稳定性',
    forward:  pkg(0.84, { speed: 0.12, propagation: 0.14, penetration: 0.06 }, { shock: 0.16, chain: 0.14 }, 0, 'same_element_resonance'),
    backward: pkg(0.78, { speed: 0.06, propagation: 0.07 }, { shock: 0.09, chain: 0.07 }, 0, 'same_element_resonance'),
  },
  {
    source: 'lightning', target: 'stone',
    name: '雷震裂岩',
    rationale: '雷击的瞬时热压和冲击震裂岩体；不是让普通岩石导电',
    forward:  pkg(0.76, { power: 0.10, force: 0.14, protection: -0.16 }, { fracture: 0.24, stun: 0.12 }, 0.22, 'stone_shock_fracture'),
    backward: pkg(0.70, { power: 0.05, force: 0.07, protection: -0.08 }, { fracture: 0.13, stun: 0.06 }, 0.11, 'stone_shock_fracture'),
  },
  {
    source: 'lightning', target: 'shadow',
    name: '雷影显形',
    rationale: '高频闪击让暗影更快、更难隐藏，但持续时间缩短',
    forward:  pkg(0.62, { speed: 0.14, penetration: 0.06, duration: -0.08, control: -0.04 }, { shock: 0.10, obscure: -0.10, echo: 0.08 }, 0.18, 'shadow_reveal'),
    backward: pkg(0.56, { speed: 0.07, duration: -0.04 }, { shock: 0.06, obscure: -0.05 }, 0.09, 'shadow_reveal'),
  },
  {
    source: 'lightning', target: 'wind',
    name: '雷暴激荡',
    rationale: '放电扰动空气，增强瞬时扩张和冲击，降低稳定持续',
    forward:  pkg(0.86, { area: 0.10, force: 0.14, speed: 0.08, duration: -0.10 }, { shock: 0.16 }, 0.26, 'storm_agitation'),
    backward: pkg(0.80, { area: 0.05, force: 0.07, duration: -0.05 }, { shock: 0.09 }, 0.13, 'storm_agitation'),
  },

  // ==================== 岩作为来源 ====================
  {
    source: 'stone', target: 'fire',
    name: '炉膛约束',
    rationale: '岩体约束火焰扩散，使其更集中、更持久但展开变慢',
    forward:  pkg(0.72, { power: 0.08, duration: 0.12, area: -0.08, speed: -0.10, protection: 0.06 }, { guard: 0.10 }, 0.20, 'kiln_focus'),
    backward: pkg(0.66, { power: 0.04, duration: 0.06, area: -0.04, speed: -0.05 }, { guard: 0.06 }, 0.10, 'kiln_focus'),
  },
  {
    source: 'stone', target: 'frost',
    name: '冰岩复合',
    rationale: '岩体支撑冰结构，提高防护和稳定控制但降低速度',
    forward:  pkg(0.74, { protection: 0.16, duration: 0.10, control: 0.08, speed: -0.10 }, { guard: 0.14, fracture: 0.06 }, 0.20, 'ice_stone_composite'),
    backward: pkg(0.68, { protection: 0.08, duration: 0.05, speed: -0.05 }, { guard: 0.08 }, 0.10, 'ice_stone_composite'),
  },
  {
    source: 'stone', target: 'lightning',
    name: '地脉阻断',
    rationale: '厚重岩体截断放电路径，使能量集中在落点；不使用导电解释',
    forward:  pkg(0.68, { power: 0.10, force: 0.08, propagation: -0.18, speed: -0.08 }, { stun: 0.10, chain: -0.14 }, 0.18, 'grounding_block'),
    backward: pkg(0.62, { power: 0.05, propagation: -0.09, speed: -0.04 }, { stun: 0.06, chain: -0.07 }, 0.09, 'grounding_block'),
  },
  {
    source: 'stone', target: 'stone',
    name: '山岳共鸣',
    rationale: '同源结构提高冲击、防护和稳定性',
    forward:  pkg(0.84, { force: 0.12, protection: 0.14, control: 0.08, speed: -0.04 }, { guard: 0.14, stun: 0.08 }, 0, 'same_element_resonance'),
    backward: pkg(0.78, { force: 0.06, protection: 0.07, control: 0.04 }, { guard: 0.08 }, 0, 'same_element_resonance'),
  },
  {
    source: 'stone', target: 'shadow',
    name: '封影',
    rationale: '岩体限制暗影移动空间，提高束缚但降低速度和穿透',
    forward:  pkg(0.58, { control: 0.12, protection: 0.06, speed: -0.10, penetration: -0.08 }, { bind: 0.12, guard: 0.06 }, 0.16, 'shadow_seal'),
    backward: pkg(0.52, { control: 0.06, speed: -0.05, penetration: -0.04 }, { bind: 0.07 }, 0.08, 'shadow_seal'),
  },
  {
    source: 'stone', target: 'wind',
    name: '镇风',
    rationale: '岩体阻挡和分割气流，降低范围与速度，增加局部冲击',
    forward:  pkg(0.70, { area: -0.10, speed: -0.12, propagation: -0.08, force: 0.10, protection: 0.08 }, { pull: -0.10, guard: 0.10 }, 0.18, 'wind_break'),
    backward: pkg(0.64, { area: -0.05, speed: -0.06, force: 0.05 }, { pull: -0.05, guard: 0.06 }, 0.09, 'wind_break'),
  },

  // ==================== 影作为来源 ====================
  {
    source: 'shadow', target: 'fire',
    name: '暗火潜燃',
    rationale: '暗影隐藏火势，使其延迟爆发并持续灼烧',
    forward:  pkg(0.66, { duration: 0.12, penetration: 0.06, speed: -0.06 }, { delayedBurst: 0.18, burn: 0.10, obscure: 0.12 }, 0.20, 'hidden_flame'),
    backward: pkg(0.60, { duration: 0.06, penetration: 0.03, speed: -0.03 }, { delayedBurst: 0.10, obscure: 0.07 }, 0.10, 'hidden_flame'),
  },
  {
    source: 'shadow', target: 'frost',
    name: '黑冰侵蚀',
    rationale: '暗影填入冰体裂隙，提高束缚和穿透但削弱防护',
    forward:  pkg(0.62, { control: 0.12, penetration: 0.10, protection: -0.08, duration: 0.05 }, { bind: 0.14, fracture: 0.08 }, 0.18, 'black_ice'),
    backward: pkg(0.56, { control: 0.06, penetration: 0.05, protection: -0.04 }, { bind: 0.08 }, 0.09, 'black_ice'),
  },
  {
    source: 'shadow', target: 'lightning',
    name: '潜雷',
    rationale: '暗影延后放电时机并制造回响，牺牲即时速度',
    forward:  pkg(0.72, { duration: 0.10, speed: -0.08, penetration: 0.05 }, { delayedBurst: 0.18, echo: 0.16, shock: 0.06 }, 0.22, 'latent_lightning'),
    backward: pkg(0.66, { duration: 0.05, speed: -0.04 }, { delayedBurst: 0.10, echo: 0.09 }, 0.11, 'latent_lightning'),
  },
  {
    source: 'shadow', target: 'stone',
    name: '蚀隙',
    rationale: '暗影从缝隙侵蚀岩体，提高穿透并削弱结构防护',
    forward:  pkg(0.64, { penetration: 0.14, protection: -0.14, duration: 0.04 }, { fracture: 0.14, mark: 0.08 }, 0.18, 'shadow_erosion'),
    backward: pkg(0.58, { penetration: 0.07, protection: -0.07 }, { fracture: 0.08, mark: 0.05 }, 0.09, 'shadow_erosion'),
  },
  {
    source: 'shadow', target: 'shadow',
    name: '深影共鸣',
    rationale: '同源暗影加强延迟、回响和隐蔽性',
    forward:  pkg(0.82, { duration: 0.10, penetration: 0.06, control: 0.06 }, { delayedBurst: 0.14, echo: 0.16, obscure: 0.12 }, 0, 'same_element_resonance'),
    backward: pkg(0.76, { duration: 0.05, control: 0.03 }, { echo: 0.09, obscure: 0.07 }, 0, 'same_element_resonance'),
  },
  {
    source: 'shadow', target: 'wind',
    name: '无形乱流',
    rationale: '暗影隐藏风路并制造难以判断的偏移，不直接增强推拉',
    forward:  pkg(0.60, { speed: 0.08, area: 0.05, control: 0.05 }, { obscure: 0.16, echo: 0.08 }, 0.16, 'hidden_turbulence'),
    backward: pkg(0.54, { speed: 0.04, area: 0.03 }, { obscure: 0.09 }, 0.08, 'hidden_turbulence'),
  },

  // ==================== 风作为来源 ====================
  {
    source: 'wind', target: 'fire',
    name: '风助火势',
    rationale: '风为火提供氧和传播路径，使其更快、更广',
    forward:  pkg(0.90, { area: 0.16, speed: 0.12, propagation: 0.16, duration: 0.04 }, { burn: 0.14 }, 0.28, 'wind_fan_flame'),
    backward: pkg(0.86, { area: 0.08, speed: 0.06, propagation: 0.08 }, { burn: 0.08 }, 0.14, 'wind_fan_flame'),
  },
  {
    source: 'wind', target: 'frost',
    name: '卷雪',
    rationale: '风携带冰晶扩大寒意覆盖和传播，但降低局部冻结稳定性',
    forward:  pkg(0.84, { area: 0.14, propagation: 0.14, speed: 0.08, control: -0.06 }, { chill: 0.12, freeze: -0.08, obscure: 0.10 }, 0.26, 'snow_carry'),
    backward: pkg(0.78, { area: 0.07, propagation: 0.07, speed: 0.04, control: -0.03 }, { chill: 0.07 }, 0.13, 'snow_carry'),
  },
  {
    source: 'wind', target: 'lightning',
    name: '风暴导流',
    rationale: '流动空气拓展雷击路径，提高传播和速度，但分散单点威力',
    forward:  pkg(0.88, { propagation: 0.18, speed: 0.12, area: 0.08, power: -0.08 }, { chain: 0.16, shock: 0.08 }, 0.28, 'storm_channel'),
    backward: pkg(0.82, { propagation: 0.09, speed: 0.06, power: -0.04 }, { chain: 0.09 }, 0.14, 'storm_channel'),
  },
  {
    source: 'wind', target: 'stone',
    name: '风蚀扬尘',
    rationale: '持续风蚀扩大裂隙并扬起碎屑，削弱防护而非推动整座岩体',
    forward:  pkg(0.62, { penetration: 0.10, protection: -0.10, area: 0.05 }, { fracture: 0.12, obscure: 0.12 }, 0.16, 'dust_erosion'),
    backward: pkg(0.56, { penetration: 0.05, protection: -0.05 }, { fracture: 0.07, obscure: 0.07 }, 0.08, 'dust_erosion'),
  },
  {
    source: 'wind', target: 'shadow',
    name: '影随风行',
    rationale: '风提高暗影移动和扩散速度，同时稍微削弱稳定束缚',
    forward:  pkg(0.68, { speed: 0.14, area: 0.08, propagation: 0.08, control: -0.05 }, { obscure: 0.10, bind: -0.06 }, 0.20, 'shadow_drift'),
    backward: pkg(0.62, { speed: 0.07, area: 0.04, control: -0.03 }, { obscure: 0.06 }, 0.10, 'shadow_drift'),
  },
  {
    source: 'wind', target: 'wind',
    name: '气流共鸣',
    rationale: '同源气流提高速度、覆盖和推拉稳定性',
    forward:  pkg(0.84, { speed: 0.12, area: 0.10, propagation: 0.10, force: 0.08 }, { knockback: 0.10, pull: 0.10, haste: 0.08 }, 0, 'same_element_resonance'),
    backward: pkg(0.78, { speed: 0.06, area: 0.05, force: 0.04 }, { knockback: 0.06, pull: 0.06 }, 0, 'same_element_resonance'),
  },
];

// ---- 快速查找 ----

const reactionMap = new Map<string, DirectedReactionRule>();
for (const r of DIRECTED_REACTIONS) {
  reactionMap.set(`${r.source}->${r.target}`, r);
}

export function getDirectedReaction(
  source: import('../../types/v6.ts').ElementKey,
  target: import('../../types/v6.ts').ElementKey,
): DirectedReactionRule {
  const key = `${source}->${target}`;
  const rule = reactionMap.get(key);
  if (!rule) throw new Error(`Missing reaction rule: ${key}`);
  return rule;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No new errors from reactionRules.ts.

---

### Task 4: Create `src/data/v6/capabilityRules.ts` — Capability Boundaries, Drivers & Form Receptivity

**Files:**
- Create: `src/data/v6/capabilityRules.ts`

- [ ] **Step 1: Write stat/mechanic drivers, form receptivity, and element capability rules**

```ts
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
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No new errors from capabilityRules.ts.

---

### Task 5: Create `src/data/v6/namingLexicon.ts` — Naming Word Library

**Files:**
- Create: `src/data/v6/namingLexicon.ts`

- [ ] **Step 1: Write prefix/suffix mappings and default build constants**

```ts
// ============================================================
// V6 命名词库 — 反应前缀、后位余韵后缀、默认 A/B 构筑
// 依据: docs/v6/presentation-and-migration.md §3, §6.4
// ============================================================

import type { VisualCueKey, ElementKey } from '../../types/v6.ts';

// ---- 反应前缀映射 (VisualCue → 中文前缀) ----

export const CUE_PREFIX_MAP: Record<VisualCueKey, string> = {
  same_element_resonance: '共鸣',
  steam_melt: '蒸融',
  thermal_overload: '炽载',
  molten_fracture: '熔裂',
  hidden_ember: '潜烬',
  fire_spread: '燎风',
  cold_suppression: '霜抑',
  cold_drag: '凝滞',
  frozen_reinforcement: '冻铸',
  frost_bind: '寒缚',
  ice_mist: '冰雾',
  ignition_surge: '迅燃',
  thermal_shatter: '电裂',
  stone_shock_fracture: '雷震',
  shadow_reveal: '显影',
  storm_agitation: '激岚',
  kiln_focus: '炉聚',
  ice_stone_composite: '冰岩',
  grounding_block: '截流',
  shadow_seal: '封影',
  wind_break: '镇风',
  hidden_flame: '暗焰',
  black_ice: '黑冰',
  latent_lightning: '潜雷',
  shadow_erosion: '蚀隙',
  hidden_turbulence: '幽流',
  wind_fan_flame: '风炽',
  snow_carry: '卷雪',
  storm_channel: '风雷',
  dust_erosion: '风蚀',
  shadow_drift: '影行',
};

// ---- 后位余韵后缀 (来源元素 → 后缀) ----

export const BACKWARD_SUFFIX_MAP: Record<ElementKey, string> = {
  fire: '余焰',
  frost: '寒痕',
  lightning: '雷鸣',
  stone: '岩心',
  shadow: '影蚀',
  wind: '风尾',
};

// ---- 默认 A/B 构筑 ----

export const DEFAULT_BUILD_A = [
  'fire_flow',
  'frost_zone',
  'lightning_mark',
  'wind_impact',
];

export const DEFAULT_BUILD_B = [
  'wind_impact',
  'lightning_mark',
  'frost_zone',
  'fire_flow',
];
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No new errors.

---

### Task 6: Create `src/engine/v6/validation.ts` — Data Validation Functions

**Files:**
- Create: `src/engine/v6/validation.ts`

- [ ] **Step 1: Write validation functions**

```ts
// ============================================================
// V6 数据校验 — 在模块加载时验证数据完整性
// 依据: docs/v6/engine-spec.md §9.1
// ============================================================

import type { DirectedReactionRule, BaseSkillDefinition, StatKey, MechanicKey } from '../../types/v6.ts';
import { STAT_KEYS, MECHANIC_KEYS, ELEMENT_KEYS } from '../../types/v6.ts';

/**
 * 验证所有定向反应规则的完整性。
 * 在数据模块加载时调用，抛出错误表示数据问题。
 */
export function validateDirectedReactionRules(rules: DirectedReactionRule[]): void {
  // 1. 正好 36 个唯一 source-target key
  const keys = new Set<string>();
  for (const r of rules) {
    const key = `${r.source}->${r.target}`;
    if (keys.has(key)) {
      throw new Error(`Duplicate reaction key: ${key}`);
    }
    keys.add(key);
  }
  if (keys.size !== 36) {
    throw new Error(`Expected 36 reaction rules, got ${keys.size}`);
  }

  for (const r of rules) {
    // 2. affinity 在 0..1
    if (r.forward.affinity < 0 || r.forward.affinity > 1) {
      throw new Error(`${r.source}->${r.target}: forward.affinity out of range: ${r.forward.affinity}`);
    }
    if (r.backward.affinity < 0 || r.backward.affinity > 1) {
      throw new Error(`${r.source}->${r.target}: backward.affinity out of range: ${r.backward.affinity}`);
    }

    // 3. accentStrength 在 0..1
    if (r.forward.accentStrength < 0 || r.forward.accentStrength > 1) {
      throw new Error(`${r.source}->${r.target}: forward.accentStrength out of range`);
    }
    if (r.backward.accentStrength < 0 || r.backward.accentStrength > 1) {
      throw new Error(`${r.source}->${r.target}: backward.accentStrength out of range`);
    }

    // 4. stat delta 在 -0.35..0.35
    for (const [k, v] of Object.entries(r.forward.statDeltas)) {
      if (v < -0.35 || v > 0.35) {
        throw new Error(`${r.source}->${r.target}: forward stat delta ${k}=${v} out of range`);
      }
    }
    for (const [k, v] of Object.entries(r.backward.statDeltas)) {
      if (v < -0.35 || v > 0.35) {
        throw new Error(`${r.source}->${r.target}: backward stat delta ${k}=${v} out of range`);
      }
    }

    // 5. mechanic delta 在 -0.65..0.65
    for (const [k, v] of Object.entries(r.forward.mechanicDeltas)) {
      if (v < -0.65 || v > 0.65) {
        throw new Error(`${r.source}->${r.target}: forward mechanic delta ${k}=${v} out of range`);
      }
    }
    for (const [k, v] of Object.entries(r.backward.mechanicDeltas)) {
      if (v < -0.65 || v > 0.65) {
        throw new Error(`${r.source}->${r.target}: backward mechanic delta ${k}=${v} out of range`);
      }
    }

    // 6. 同元素规则不能产生非零混合元素
    if (r.source === r.target) {
      if (r.forward.accentStrength !== 0) {
        throw new Error(`${r.source}->${r.target}: same-element rule must have accentStrength=0`);
      }
      if (r.backward.accentStrength !== 0) {
        throw new Error(`${r.source}->${r.target}: same-element rule must have accentStrength=0`);
      }
    }

    // 7. 雷->岩 不得增加 shock 或 chain
    if (r.source === 'lightning' && r.target === 'stone') {
      if ((r.forward.mechanicDeltas.shock ?? 0) > 0) {
        throw new Error('lightning->stone: must not increase shock');
      }
      if ((r.forward.mechanicDeltas.chain ?? 0) > 0) {
        throw new Error('lightning->stone: must not increase chain');
      }
      if ((r.backward.mechanicDeltas.shock ?? 0) > 0) {
        throw new Error('lightning->stone: must not increase shock (backward)');
      }
      if ((r.backward.mechanicDeltas.chain ?? 0) > 0) {
        throw new Error('lightning->stone: must not increase chain (backward)');
      }
    }

    // 8. 岩->雷 不得增加 shock 或 chain
    if (r.source === 'stone' && r.target === 'lightning') {
      if ((r.forward.mechanicDeltas.shock ?? 0) > 0) {
        throw new Error('stone->lightning: must not increase shock');
      }
      if ((r.forward.mechanicDeltas.chain ?? 0) > 0) {
        throw new Error('stone->lightning: must not increase chain');
      }
      if ((r.backward.mechanicDeltas.shock ?? 0) > 0) {
        throw new Error('stone->lightning: must not increase shock (backward)');
      }
      if ((r.backward.mechanicDeltas.chain ?? 0) > 0) {
        throw new Error('stone->lightning: must not increase chain (backward)');
      }
    }

    // 9. 只有风或岩来源规则可以增加 knockback
    if (r.source !== 'wind' && r.source !== 'stone') {
      if ((r.forward.mechanicDeltas.knockback ?? 0) > 0) {
        throw new Error(`${r.source}->${r.target}: only wind/stone can grant knockback`);
      }
      if ((r.backward.mechanicDeltas.knockback ?? 0) > 0) {
        throw new Error(`${r.source}->${r.target}: only wind/stone can grant knockback (backward)`);
      }
    }

    // 10. 只有风来源规则可以增加 pull
    if (r.source !== 'wind') {
      if ((r.forward.mechanicDeltas.pull ?? 0) > 0) {
        throw new Error(`${r.source}->${r.target}: only wind can grant pull`);
      }
      if ((r.backward.mechanicDeltas.pull ?? 0) > 0) {
        throw new Error(`${r.source}->${r.target}: only wind can grant pull (backward)`);
      }
    }

    // 11. 只有冰来源或冰同源规则可以增加 freeze
    if (r.source !== 'frost') {
      if ((r.forward.mechanicDeltas.freeze ?? 0) > 0) {
        throw new Error(`${r.source}->${r.target}: only frost can grant freeze`);
      }
      if ((r.backward.mechanicDeltas.freeze ?? 0) > 0) {
        throw new Error(`${r.source}->${r.target}: only frost can grant freeze (backward)`);
      }
    }
  }
}

/**
 * 验证基础技能数据完整性。
 */
export function validateBaseSkills(skills: BaseSkillDefinition[]): void {
  // 24 个唯一 seed ID
  const ids = new Set<string>();
  for (const s of skills) {
    if (ids.has(s.id)) {
      throw new Error(`Duplicate skill ID: ${s.id}`);
    }
    ids.add(s.id);

    // 10 个基础参数全部存在且在 0..1
    for (const key of STAT_KEYS) {
      const val = s.baseStats[key];
      if (typeof val !== 'number' || val < 0 || val > 1) {
        throw new Error(`Skill ${s.id}: stat ${key}=${val} out of [0,1]`);
      }
    }

    // 机制值在 0..1
    for (const [key, val] of Object.entries(s.nativeMechanics)) {
      if (typeof val !== 'number' || val < 0 || val > 1) {
        throw new Error(`Skill ${s.id}: mechanic ${key}=${val} out of [0,1]`);
      }
    }
  }

  if (ids.size !== 24) {
    throw new Error(`Expected 24 base skills, got ${ids.size}`);
  }

  // 每个元素 4 个技能
  for (const el of ELEMENT_KEYS) {
    const count = skills.filter((s) => s.element === el).length;
    if (count !== 4) {
      throw new Error(`Element ${el}: expected 4 skills, got ${count}`);
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors from validation.ts.

---

### Task 7: Create `src/engine/v6/index.ts` — Barrel Export

**Files:**
- Create: `src/engine/v6/index.ts`

- [ ] **Step 1: Write barrel export (placeholder for future engine modules)**

```ts
// ============================================================
// V6 Engine — barrel export
// V6-0: 仅导出校验函数
// 后续阶段追加: math, forward/backward pass, finalize, animation, diff
// ============================================================

export { validateDirectedReactionRules, validateBaseSkills } from './validation.ts';
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 8: Add Data Module Self-Validation

**Files:**
- Modify: `src/data/v6/baseSkills.ts` (append at bottom)
- Modify: `src/data/v6/reactionRules.ts` (append at bottom)

- [ ] **Step 1: Add self-validation on module load to baseSkills.ts**

Append at the end of `src/data/v6/baseSkills.ts`:

```ts
// ---- 模块加载时自校验 ----

import { validateBaseSkills } from '../../engine/v6/validation.ts';
validateBaseSkills(BASE_SKILLS);
```

- [ ] **Step 2: Add self-validation on module load to reactionRules.ts**

Append at the end of `src/data/v6/reactionRules.ts`:

```ts
// ---- 模块加载时自校验 ----

import { validateDirectedReactionRules } from '../../engine/v6/validation.ts';
validateDirectedReactionRules(DIRECTED_REACTIONS);
```

- [ ] **Step 3: Verify application starts without validation errors**

```bash
npx tsx -e "import './src/data/v6/baseSkills.ts'; import './src/data/v6/reactionRules.ts'; console.log('V6-0 data validation: OK');"
```

Expected output: `V6-0 data validation: OK` (no throw).

---

### Task 9: Create Verification Script

**Files:**
- Create: `scripts/verify-v6-0.ts`

- [ ] **Step 1: Write verification script**

```ts
// scripts/verify-v6-0.ts
// 验证 V6-0 数据类型和数据完整性
// 运行: npx tsx scripts/verify-v6-0.ts

import { ELEMENT_KEYS, STAT_KEYS, MECHANIC_KEYS } from '../src/types/v6.ts';
import { BASE_SKILLS, getBaseSkill, getBaseSkillsByElement } from '../src/data/v6/baseSkills.ts';
import { DIRECTED_REACTIONS, getDirectedReaction } from '../src/data/v6/reactionRules.ts';
import { ELEMENT_CAPABILITIES, STAT_DRIVERS, MECHANIC_DRIVERS, FORM_RECEPTIVITY_MODIFIERS } from '../src/data/v6/capabilityRules.ts';
import { CUE_PREFIX_MAP, BACKWARD_SUFFIX_MAP, DEFAULT_BUILD_A, DEFAULT_BUILD_B } from '../src/data/v6/namingLexicon.ts';

let passed = 0;
let failed = 0;

function check(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

console.log('=== V6-0 类型与静态数据验证 ===\n');

// ---- 类型常量 ----
console.log('--- 类型常量 ---');
check(ELEMENT_KEYS.length === 6, '6 个元素');
check(STAT_KEYS.length === 10, '10 个参数');
check(MECHANIC_KEYS.length === 17, '17 个机制');

// ---- 基础技能 ----
console.log('\n--- 基础技能 ---');
check(BASE_SKILLS.length === 24, '24 个基础技能');
const ids = BASE_SKILLS.map((s) => s.id);
check(new Set(ids).size === 24, '24 个唯一 seed ID');

// 每个元素 4 个技能
for (const el of ELEMENT_KEYS) {
  const skills = getBaseSkillsByElement(el);
  check(skills.length === 4, `${el} 有 4 个技能`);
}

// 所有技能都有完整的 10 个参数
for (const s of BASE_SKILLS) {
  for (const key of STAT_KEYS) {
    const val = s.baseStats[key];
    check(typeof val === 'number' && val >= 0 && val <= 1, `${s.id}.${key}=${val} 在 [0,1]`);
  }
}

// 形态不依赖 aspect 推断
check(getBaseSkill('frost_mark').form === 'construct', 'frost_mark 形态是 construct');
check(getBaseSkill('wind_mark').form === 'summon', 'wind_mark 形态是 summon');
check(getBaseSkill('fire_impact').form === 'projectile', 'fire_impact 形态是 projectile');

// ---- 反应规则 ----
console.log('\n--- 反应规则 ---');
check(DIRECTED_REACTIONS.length === 36, '36 个定向反应');

const reactionKeys = new Set(DIRECTED_REACTIONS.map((r) => `${r.source}->${r.target}`));
check(reactionKeys.size === 36, '36 个唯一 source->target key');

// 所有 6×6=36 个方向都存在
for (const src of ELEMENT_KEYS) {
  for (const tgt of ELEMENT_KEYS) {
    check(reactionKeys.has(`${src}->${tgt}`), `${src}->${tgt} 规则存在`);
  }
}

// 关键语义检查
const fireToFrost = getDirectedReaction('fire', 'frost');
check((fireToFrost.forward.mechanicDeltas.freeze ?? 0) < 0, '火->冰: freeze 下降');
check((fireToFrost.forward.mechanicDeltas.obscure ?? 0) > 0, '火->冰: obscure 上升');

const lightningToStone = getDirectedReaction('lightning', 'stone');
check((lightningToStone.forward.mechanicDeltas.fracture ?? 0) > 0, '雷->岩: fracture 上升');
check((lightningToStone.forward.mechanicDeltas.shock ?? 0) <= 0, '雷->岩: shock 不上升');

const stoneToLightning = getDirectedReaction('stone', 'lightning');
check((stoneToLightning.forward.statDeltas.propagation ?? 0) < 0, '岩->雷: propagation 下降');
check((stoneToLightning.forward.mechanicDeltas.chain ?? 0) <= 0, '岩->雷: chain 不上升');

const windToFire = getDirectedReaction('wind', 'fire');
check((windToFire.forward.statDeltas.area ?? 0) > 0, '风->火: area 上升');
check((windToFire.forward.statDeltas.propagation ?? 0) > 0, '风->火: propagation 上升');

const frostToFire = getDirectedReaction('frost', 'fire');
check((frostToFire.forward.statDeltas.power ?? 0) < 0 || (frostToFire.forward.statDeltas.speed ?? 0) < 0,
  '冰->火: power 或 speed 下降');
check((frostToFire.forward.mechanicDeltas.chill ?? 0) > 0, '冰->火: chill 上升');

// 同元素 accent 为 0
for (const el of ELEMENT_KEYS) {
  const r = getDirectedReaction(el, el);
  check(r.forward.accentStrength === 0, `${el}->${el}: forward accent=0`);
  check(r.backward.accentStrength === 0, `${el}->${el}: backward accent=0`);
}

// ---- 能力边界 ----
console.log('\n--- 能力边界 ---');
for (const el of ELEMENT_KEYS) {
  const cap = ELEMENT_CAPABILITIES[el];
  check(cap.native.length > 0, `${el} 有原生机制`);
  check(cap.forbidden.length > 0, `${el} 有禁止机制`);
  // native 不在 forbidden 中
  const overlap = cap.native.filter((m) => cap.forbidden.includes(m));
  check(overlap.length === 0, `${el} native ∩ forbidden 为空`);
}

// ---- 驱动映射 ----
console.log('\n--- 驱动映射 ---');
check(Object.keys(STAT_DRIVERS).length === 10, '10 个参数驱动映射');
check(Object.keys(MECHANIC_DRIVERS).length === 17, '17 个机制驱动映射');
check(Object.keys(FORM_RECEPTIVITY_MODIFIERS).length === 9, '9 个形态接受度');

// ---- 命名 ----
console.log('\n--- 命名词库 ---');
check(Object.keys(CUE_PREFIX_MAP).length === 31, '31 个 Cue 前缀');
check(Object.keys(BACKWARD_SUFFIX_MAP).length === 6, '6 个后位后缀');
check(DEFAULT_BUILD_A.length === 4, '默认 A: 4 个 seed');
check(DEFAULT_BUILD_B.length === 4, '默认 B: 4 个 seed');
// A 和 B 是同一组 seed 但不同顺序
check(
  [...DEFAULT_BUILD_A].sort().join(',') === [...DEFAULT_BUILD_B].sort().join(','),
  'A 和 B 使用同一组 seed',
);

// ---- 结果 ----
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n❌ V6-0 验证未通过！');
  process.exit(1);
} else {
  console.log('\n✅ V6-0 全部验证通过！');
}
```

- [ ] **Step 2: Run verification script**

```bash
npx tsx scripts/verify-v6-0.ts
```

Expected: All checks pass, exit code 0.

---

### Task 10: Run Full TypeScript Check and Commit

- [ ] **Step 1: Full TypeScript compilation check**

```bash
npx tsc --noEmit
```

Expected: No errors in any file.

- [ ] **Step 2: Commit all V6-0 changes**

```bash
git add src/types/v6.ts
git add src/data/v6/baseSkills.ts
git add src/data/v6/reactionRules.ts
git add src/data/v6/capabilityRules.ts
git add src/data/v6/namingLexicon.ts
git add src/engine/v6/validation.ts
git add src/engine/v6/index.ts
git add scripts/verify-v6-0.ts
git commit -m "feat(V6-0): add types and static data

- Add src/types/v6.ts with all V6 type contracts
- Add 24 base skill definitions (src/data/v6/baseSkills.ts)
- Add 36 directed reaction rules (src/data/v6/reactionRules.ts)
- Add capability boundaries, drivers, form receptivity (src/data/v6/capabilityRules.ts)
- Add naming lexicon and default A/B builds (src/data/v6/namingLexicon.ts)
- Add data validation functions (src/engine/v6/validation.ts)
- Add verification script (scripts/verify-v6-0.ts)
- Existing V4 code untouched; V6 lives in parallel modules

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Verification Checklist

After all tasks complete, confirm:

1. [ ] `npx tsc --noEmit` — zero errors
2. [ ] `npx tsx scripts/verify-v6-0.ts` — all assertions pass
3. [ ] 24 unique seed IDs matching V4 names
4. [ ] 36 unique `source->target` reaction keys
5. [ ] All stat deltas in [-0.35, 0.35]
6. [ ] All mechanic deltas in [-0.65, 0.65]
7. [ ] Same-element rules have accentStrength = 0
8. [ ] lightning→stone does not increase shock/chain
9. [ ] stone→lightning does not increase shock/chain
10. [ ] Only wind/stone grant knockback
11. [ ] Only wind grants pull
12. [ ] Only frost grants freeze
13. [ ] frost_mark form is 'construct' (not inferred from aspect)
14. [ ] wind_mark form is 'summon' (not inferred from aspect)
15. [ ] Existing V4 code compiles without changes
