// ============================================================
// V4 名字词库：元素 + 行为双层命名
// ============================================================

import type { ElementKey, BehaviorKey } from '../types/rune.ts';

/** 元素 → 名字用字 */
export const ELEMENT_WORDS: Record<ElementKey, string[]> = {
  fire: ['焰', '灼', '爆', '炎', '烬'],
  frost: ['霜', '冰', '凝', '寒', '碎'],
  lightning: ['雷', '闪', '霆', '弧', '电'],
  stone: ['岩', '棘', '壁', '垒', '震'],
  shadow: ['影', '蚀', '暗', '印', '伏'],
  wind: ['风', '旋', '疾', '刃', '引'],
};

/** 行为维度 → 名字用字 */
export const BEHAVIOR_WORDS: Record<BehaviorKey, string[]> = {
  impact: ['冲', '击', '碎'],
  burst: ['裂', '爆', '震'],
  dot: ['蚀', '灼', '侵'],
  spread: ['蔓', '扩', '散'],
  zone: ['域', '场', '阵'],
  control: ['制', '压', '困'],
  bind: ['锁', '缚', '牢'],
  chain: ['链', '跃', '导'],
  delay: ['伏', '延', '待'],
  mark: ['印', '痕', '契'],
  pierce: ['穿', '贯', '刺'],
  guard: ['壁', '护', '障'],
  pullPush: ['牵', '卷', '斥'],
  mobility: ['行', '驰', '闪'],
  speed: ['疾', '迅', '瞬'],
  summon: ['召', '构', '现'],
};

/** 固化方向 → 名字后缀 */
export const ASPECT_WORDS: Record<string, string[]> = {
  impact: ['击', '破', '袭'],
  flow: ['流', '涌', '延'],
  zone: ['域', '阵', '界'],
  mark: ['印', '咒', '契'],
};
