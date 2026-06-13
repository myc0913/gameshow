// ============================================================
// V4 核心数据：24 个技能种子 (6 元素 × 4 固化方向) + 元素互动表
// 废弃旧 RUNES 单向量定义
// ============================================================

import type {
  SkillSeed,
  ElementKey,
  BehaviorKey,
  ElementInteraction,
  ElementPairKey,
} from '../types/rune.ts';
import { ELEMENT_KEYS } from '../types/rune.ts';

// ---- 辅助：创建空元素向量 ----
function elemVec(el: ElementKey): Record<ElementKey, number> {
  const rec: Record<ElementKey, number> = {} as Record<ElementKey, number>;
  for (const e of ELEMENT_KEYS) rec[e] = 0;
  rec[el] = 1.0;
  return rec;
}

// ---- 辅助：创建行为向量 ----
function behVec(
  init: Partial<Record<BehaviorKey, number>>,
): Record<BehaviorKey, number> {
  const defaults: Record<BehaviorKey, number> = {
    impact: 0, burst: 0, dot: 0, spread: 0, zone: 0, control: 0,
    bind: 0, chain: 0, delay: 0, mark: 0, pierce: 0, guard: 0,
    pullPush: 0, mobility: 0, speed: 0, summon: 0,
  };
  return { ...defaults, ...init };
}

// ============================================================
// 24 个技能种子
// ============================================================

export const SKILL_SEEDS: SkillSeed[] = [
  // ---- 火系 ----
  {
    id: 'fire_impact',
    element: 'fire',
    aspect: 'impact',
    name: '爆焰',
    description: '偏向瞬时爆裂与正面冲击的火系固化方向。',
    semantic: {
      element: elemVec('fire'),
      behavior: behVec({
        impact: 0.85, burst: 0.9, dot: 0.15, spread: 0.3, zone: 0.1,
        control: 0.05, delay: 0.05, mark: 0.05, pierce: 0.1,
        pullPush: 0.1, mobility: 0.05, speed: 0.2,
      }),
    },
  },
  {
    id: 'fire_flow',
    element: 'fire',
    aspect: 'flow',
    name: '灼流',
    description: '偏向持续灼烧与蔓延的火系固化方向。',
    semantic: {
      element: elemVec('fire'),
      behavior: behVec({
        dot: 0.9, spread: 0.85, zone: 0.4, control: 0.1,
        impact: 0.05, burst: 0.1, mark: 0.1, delay: 0.1,
        mobility: 0.05, speed: 0.05,
      }),
    },
  },
  {
    id: 'fire_zone',
    element: 'fire',
    aspect: 'zone',
    name: '炎域',
    description: '偏向火场压制与范围留存的火系固化方向。',
    semantic: {
      element: elemVec('fire'),
      behavior: behVec({
        zone: 0.9, control: 0.75, dot: 0.5, spread: 0.3,
        bind: 0.2, burst: 0.1, impact: 0.1, guard: 0.1,
      }),
    },
  },
  {
    id: 'fire_mark',
    element: 'fire',
    aspect: 'mark',
    name: '烬印',
    description: '偏向标记与延迟二段爆发的火系固化方向。',
    semantic: {
      element: elemVec('fire'),
      behavior: behVec({
        mark: 0.9, delay: 0.8, burst: 0.55, dot: 0.2,
        impact: 0.15, control: 0.05, spread: 0.1,
      }),
    },
  },

  // ---- 冰系 ----
  {
    id: 'frost_impact',
    element: 'frost',
    aspect: 'impact',
    name: '碎霜',
    description: '偏向冻裂与碎冰冲击的冰系固化方向。',
    semantic: {
      element: elemVec('frost'),
      behavior: behVec({
        impact: 0.85, burst: 0.8, control: 0.4, pierce: 0.2,
        bind: 0.1, spread: 0.1, guard: 0.05,
      }),
    },
  },
  {
    id: 'frost_flow',
    element: 'frost',
    aspect: 'flow',
    name: '寒流',
    description: '偏向持续减速与寒气侵蚀的冰系固化方向。',
    semantic: {
      element: elemVec('frost'),
      behavior: behVec({
        dot: 0.85, control: 0.75, spread: 0.45, bind: 0.2,
        zone: 0.15, impact: 0.05, burst: 0.05, mobility: 0.05,
      }),
    },
  },
  {
    id: 'frost_zone',
    element: 'frost',
    aspect: 'zone',
    name: '冰域',
    description: '偏向冻结地面与区域封锁的冰系固化方向。',
    semantic: {
      element: elemVec('frost'),
      behavior: behVec({
        zone: 0.9, bind: 0.82, control: 0.5, guard: 0.2,
        dot: 0.1, spread: 0.15,
      }),
    },
  },
  {
    id: 'frost_mark',
    element: 'frost',
    aspect: 'mark',
    name: '霜印',
    description: '偏向标记后凝结与延迟冻结的冰系固化方向。',
    semantic: {
      element: elemVec('frost'),
      behavior: behVec({
        mark: 0.85, delay: 0.8, bind: 0.5, control: 0.3,
        burst: 0.15, impact: 0.1,
      }),
    },
  },

  // ---- 雷系 ----
  {
    id: 'lightning_impact',
    element: 'lightning',
    aspect: 'impact',
    name: '霆击',
    description: '偏向瞬时落雷与快速打击的雷系固化方向。',
    semantic: {
      element: elemVec('lightning'),
      behavior: behVec({
        impact: 0.9, speed: 0.82, burst: 0.55, pierce: 0.15,
        chain: 0.1, mobility: 0.1,
      }),
    },
  },
  {
    id: 'lightning_flow',
    element: 'lightning',
    aspect: 'flow',
    name: '电涌',
    description: '偏向传导、弹跳与连锁的雷系固化方向。',
    semantic: {
      element: elemVec('lightning'),
      behavior: behVec({
        chain: 0.9, spread: 0.8, speed: 0.5, mobility: 0.2,
        impact: 0.1, burst: 0.1, zone: 0.1,
      }),
    },
  },
  {
    id: 'lightning_zone',
    element: 'lightning',
    aspect: 'zone',
    name: '雷网',
    description: '偏向雷场麻痹与区域约束的雷系固化方向。',
    semantic: {
      element: elemVec('lightning'),
      behavior: behVec({
        zone: 0.88, control: 0.78, chain: 0.5, bind: 0.3,
        spread: 0.2, impact: 0.1, burst: 0.1, speed: 0.1,
      }),
    },
  },
  {
    id: 'lightning_mark',
    element: 'lightning',
    aspect: 'mark',
    name: '引雷',
    description: '偏向标记后落雷与追击的雷系固化方向。',
    semantic: {
      element: elemVec('lightning'),
      behavior: behVec({
        mark: 0.88, delay: 0.78, impact: 0.55, burst: 0.3,
        speed: 0.2, chain: 0.15,
      }),
    },
  },

  // ---- 岩系 ----
  {
    id: 'stone_impact',
    element: 'stone',
    aspect: 'impact',
    name: '岩突',
    description: '偏向地刺、穿刺与重击的岩系固化方向。',
    semantic: {
      element: elemVec('stone'),
      behavior: behVec({
        impact: 0.88, pierce: 0.85, burst: 0.5, guard: 0.1,
        bind: 0.1, control: 0.1,
      }),
    },
  },
  {
    id: 'stone_flow',
    element: 'stone',
    aspect: 'flow',
    name: '岩脉',
    description: '偏向岩脉蔓延与地形生成的岩系固化方向。',
    semantic: {
      element: elemVec('stone'),
      behavior: behVec({
        spread: 0.8, summon: 0.7, guard: 0.5, zone: 0.3,
        control: 0.15, impact: 0.1, bind: 0.1,
      }),
    },
  },
  {
    id: 'stone_zone',
    element: 'stone',
    aspect: 'zone',
    name: '岩牢',
    description: '偏向围困、护壁与封锁的岩系固化方向。',
    semantic: {
      element: elemVec('stone'),
      behavior: behVec({
        bind: 0.9, guard: 0.82, zone: 0.5, control: 0.4,
        impact: 0.1, pierce: 0.1, summon: 0.1,
      }),
    },
  },
  {
    id: 'stone_mark',
    element: 'stone',
    aspect: 'mark',
    name: '震纹',
    description: '偏向地面纹路与延迟震荡的岩系固化方向。',
    semantic: {
      element: elemVec('stone'),
      behavior: behVec({
        mark: 0.85, delay: 0.78, burst: 0.55, zone: 0.2,
        control: 0.15, impact: 0.1,
      }),
    },
  },

  // ---- 影系 ----
  {
    id: 'shadow_impact',
    element: 'shadow',
    aspect: 'impact',
    name: '影刺',
    description: '偏向暗袭、背刺与穿刺的影系固化方向。',
    semantic: {
      element: elemVec('shadow'),
      behavior: behVec({
        pierce: 0.9, burst: 0.78, speed: 0.5, impact: 0.4,
        mark: 0.15, mobility: 0.1,
      }),
    },
  },
  {
    id: 'shadow_flow',
    element: 'shadow',
    aspect: 'flow',
    name: '蚀影',
    description: '偏向暗蚀蔓延与持续侵蚀的影系固化方向。',
    semantic: {
      element: elemVec('shadow'),
      behavior: behVec({
        dot: 0.85, mark: 0.75, spread: 0.45, control: 0.15,
        delay: 0.2, burst: 0.1, bind: 0.05,
      }),
    },
  },
  {
    id: 'shadow_zone',
    element: 'shadow',
    aspect: 'zone',
    name: '影缚',
    description: '偏向影子束缚与区域压制的影系固化方向。',
    semantic: {
      element: elemVec('shadow'),
      behavior: behVec({
        bind: 0.9, control: 0.82, zone: 0.5, mark: 0.2,
        dot: 0.1, guard: 0.1,
      }),
    },
  },
  {
    id: 'shadow_mark',
    element: 'shadow',
    aspect: 'mark',
    name: '暗印',
    description: '偏向标记、处决与延迟爆发的影系固化方向。',
    semantic: {
      element: elemVec('shadow'),
      behavior: behVec({
        mark: 0.9, delay: 0.78, burst: 0.58, pierce: 0.2,
        impact: 0.15, control: 0.1,
      }),
    },
  },

  // ---- 风系 ----
  {
    id: 'wind_impact',
    element: 'wind',
    aspect: 'impact',
    name: '风刃',
    description: '偏向高速切割与风刃的风系固化方向。',
    semantic: {
      element: elemVec('wind'),
      behavior: behVec({
        pierce: 0.88, speed: 0.82, impact: 0.55, burst: 0.2,
        mobility: 0.15, spread: 0.1,
      }),
    },
  },
  {
    id: 'wind_flow',
    element: 'wind',
    aspect: 'flow',
    name: '风行',
    description: '偏向位移、加速与流动的风系固化方向。',
    semantic: {
      element: elemVec('wind'),
      behavior: behVec({
        mobility: 0.9, speed: 0.85, spread: 0.45, pullPush: 0.2,
        impact: 0.1, chain: 0.1,
      }),
    },
  },
  {
    id: 'wind_zone',
    element: 'wind',
    aspect: 'zone',
    name: '风壁',
    description: '偏向风墙、偏转与阻挡的风系固化方向。',
    semantic: {
      element: elemVec('wind'),
      behavior: behVec({
        guard: 0.88, pullPush: 0.78, zone: 0.5, control: 0.3,
        mobility: 0.15, spread: 0.1,
      }),
    },
  },
  {
    id: 'wind_mark',
    element: 'wind',
    aspect: 'mark',
    name: '风引',
    description: '偏向牵引、卷入与引导的风系固化方向。',
    semantic: {
      element: elemVec('wind'),
      behavior: behVec({
        pullPush: 0.85, chain: 0.75, delay: 0.45, mobility: 0.3,
        mark: 0.2, speed: 0.2,
      }),
    },
  },
];

// ---- 快速查找 ----

/** seed id → SkillSeed */
const seedMap: Record<string, SkillSeed> = {};
for (const s of SKILL_SEEDS) seedMap[s.id] = s;

export function getSkillSeed(id: string): SkillSeed | undefined {
  return seedMap[id];
}

export function getSkillSeedsByElement(el: ElementKey): SkillSeed[] {
  return SKILL_SEEDS.filter((s) => s.element === el);
}

// ============================================================
// 元素互动表
// ============================================================

function normalizeElementPair(a: ElementKey, b: ElementKey): ElementPairKey {
  const sorted = [a, b].sort();
  return `${sorted[0]}+${sorted[1]}`;
}

const ELEMENT_INTERACTION_MAP: Record<ElementPairKey, ElementInteraction> = {
  'fire+wind': {
    behaviorBoost: { spread: 0.16, zone: 0.1, speed: 0.08 },
    labelHint: '风助火势',
  },
  'fire+lightning': {
    behaviorBoost: { burst: 0.15, impact: 0.12, chain: 0.08 },
    labelHint: '雷火爆燃',
  },
  'fire+frost': {
    behaviorBoost: { burst: 0.12, control: 0.1, zone: 0.08 },
    labelHint: '冷热裂变',
  },
  'fire+stone': {
    behaviorBoost: { zone: 0.12, burst: 0.1, guard: 0.06 },
    labelHint: '熔岩共鸣',
  },
  'fire+shadow': {
    behaviorBoost: { mark: 0.14, delay: 0.12, dot: 0.1 },
    labelHint: '暗燃烬印',
  },
  'frost+wind': {
    behaviorBoost: { spread: 0.14, control: 0.12, speed: 0.06 },
    labelHint: '寒风蔓延',
  },
  'frost+lightning': {
    behaviorBoost: { control: 0.15, chain: 0.12, bind: 0.08 },
    labelHint: '麻痹冻结',
  },
  'frost+stone': {
    behaviorBoost: { guard: 0.14, bind: 0.12, zone: 0.08 },
    labelHint: '冻土壁垒',
  },
  'frost+shadow': {
    behaviorBoost: { bind: 0.13, control: 0.12, delay: 0.1 },
    labelHint: '暗霜禁锢',
  },
  'lightning+wind': {
    behaviorBoost: { chain: 0.15, speed: 0.14, mobility: 0.1 },
    labelHint: '风雷疾走',
  },
  'lightning+stone': {
    behaviorBoost: { chain: 0.14, impact: 0.12, control: 0.08 },
    labelHint: '导电震荡',
  },
  'lightning+shadow': {
    behaviorBoost: { mark: 0.13, burst: 0.12, delay: 0.1 },
    labelHint: '暗雷伏击',
  },
  'stone+wind': {
    behaviorBoost: { pierce: 0.14, spread: 0.1, mobility: 0.06 },
    labelHint: '风蚀岩穿',
  },
  'stone+shadow': {
    behaviorBoost: { bind: 0.14, guard: 0.1, zone: 0.1 },
    labelHint: '暗岩伏锁',
  },
  'shadow+wind': {
    behaviorBoost: { mobility: 0.15, pierce: 0.12, speed: 0.1 },
    labelHint: '风影疾袭',
  },
};

export function getElementInteraction(
  a: ElementKey,
  b: ElementKey,
): ElementInteraction | undefined {
  return ELEMENT_INTERACTION_MAP[normalizeElementPair(a, b)];
}

export function getAllElementInteractions(
  elements: ElementKey[],
): Array<{ pair: [ElementKey, ElementKey]; interaction: ElementInteraction }> {
  const results: Array<{ pair: [ElementKey, ElementKey]; interaction: ElementInteraction }> = [];
  const unique = [...new Set(elements)];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const interaction = getElementInteraction(unique[i], unique[j]);
      if (interaction) {
        results.push({ pair: [unique[i], unique[j]], interaction });
      }
    }
  }
  return results;
}
