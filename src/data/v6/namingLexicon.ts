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
