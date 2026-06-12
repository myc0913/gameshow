// ============================================================
// V6 定向元素反应规则 — 36 个方向 (6×6)
// 依据: docs/v6/element-reactions.md §4-§9
// ============================================================

import type { DirectedReactionRule, ReactionPackage, ElementKey } from '../../types/v6.ts';

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
    backward: pkg(0.60, { duration: 0.05, penetration: 0.03, speed: -0.03 }, { burn: 0.07, delayedBurst: 0.10 }, 0.09, 'hidden_ember'),
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
  source: ElementKey,
  target: ElementKey,
): DirectedReactionRule {
  const key = `${source}->${target}`;
  const rule = reactionMap.get(key);
  if (!rule) throw new Error(`Missing reaction rule: ${key}`);
  return rule;
}
