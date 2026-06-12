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
