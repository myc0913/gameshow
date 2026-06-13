// ============================================================
// V4 维度定义：6 元素 + 16 通用行为
// 废弃旧 16 维混合向量（spread/dot/burst/slow/crystallize/...）
// ============================================================

import type { ElementKey, BehaviorKey } from '../types/rune.ts';
import { ELEMENT_KEYS, BEHAVIOR_KEYS } from '../types/rune.ts';

export type { ElementKey, BehaviorKey };
export { ELEMENT_KEYS, BEHAVIOR_KEYS };

/** 元素 → 中文标签 */
export const ELEMENT_LABELS: Record<ElementKey, string> = {
  fire: '火',
  frost: '冰',
  lightning: '雷',
  stone: '岩',
  shadow: '影',
  wind: '风',
};

/** 行为 → 中文标签 */
export const BEHAVIOR_LABELS: Record<BehaviorKey, string> = {
  impact: '冲击',
  burst: '爆裂',
  dot: '持续',
  spread: '扩散',
  zone: '区域',
  control: '控制',
  bind: '禁锢',
  chain: '连锁',
  delay: '延迟',
  mark: '标记',
  pierce: '穿透',
  guard: '防护',
  pullPush: '牵引',
  mobility: '位移',
  speed: '疾速',
  summon: '召出',
};

/** 元素 → 颜色 */
export const ELEMENT_COLORS: Record<ElementKey, string> = {
  fire: '#ff4444',
  frost: '#44aaff',
  lightning: '#ffff44',
  stone: '#aa8844',
  shadow: '#8844cc',
  wind: '#44dd44',
};

/** 元素 → 第二颜色 */
export const ELEMENT_SECONDARY_COLORS: Record<ElementKey, string> = {
  fire: '#ff8844',
  frost: '#88ccff',
  lightning: '#ccccff',
  stone: '#ccaa66',
  shadow: '#aa66ee',
  wind: '#88ee88',
};
