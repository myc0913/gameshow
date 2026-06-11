import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from './vectorDims.ts';

/** 元素维度 → 名字用字 */
export const ELEMENT_WORDS: Record<RuneId, string[]> = {
  fire: ['焰', '灼', '爆'],
  frost: ['霜', '冰', '凝'],
  lightning: ['雷', '闪', '弧'],
  stone: ['岩', '棘', '壁'],
  shadow: ['影', '蚀', '印'],
  wind: ['风', '旋', '疾'],
};

/** 向量维度 → 名字用字 */
export const DIM_WORDS: Record<VectorDim, string[]> = {
  spread: ['环', '域', '潮'],
  dot: ['蚀', '燃', '灼'],
  burst: ['裂', '爆', '震'],
  slow: ['滞', '凝', '缓'],
  crystallize: ['晶', '封', '霜'],
  zoneControl: ['域', '阵', '场'],
  chain: ['链', '跃', '连'],
  delay: ['伏', '延', '待'],
  instantBurst: ['闪', '瞬', '击'],
  pierce: ['穿', '刺', '贯'],
  bind: ['牢', '锁', '禁'],
  structure: ['壁', '垒', '柱'],
  conditional: ['契', '伏', '触'],
  markAmplify: ['印', '痕', '裁'],
  displacement: ['冲', '卷', '退'],
  haste: ['疾', '迅', '掠'],
};
