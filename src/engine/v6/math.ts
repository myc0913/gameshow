// ============================================================
// V6 数学工具 — 饱和、插值、距离衰减
// 依据: docs/v6/engine-spec.md §6.2, §7.4, §8.2
// ============================================================

import type { NormalizedStats, MechanicState, MechanicKey } from '../../types/v6.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../../types/v6.ts';

/**
 * 连续饱和函数: cap * tanh(sum / cap)
 * 小值接近线性，正负保持，多来源不会无限叠加。
 */
export function saturate(sum: number, cap: number): number {
  if (cap <= 0) return 0;
  return cap * Math.tanh(sum / cap);
}

/**
 * 线性插值: a + (b - a) * t
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 值限制到 [min, max]
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 四舍五入到指定小数位
 */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * 前向距离衰减: 0.58^(gap-1)
 * sourceSlot 在 targetSlot 左侧。
 *
 * | 间隔 | 系数 |
 * |------|------|
 * | 相邻 | 1.000 |
 * | 隔1  | 0.580 |
 * | 隔2  | 0.336 |
 */
export function forwardDistance(sourceSlot: number, targetSlot: number): number {
  const gap = targetSlot - sourceSlot;
  if (gap <= 1) return 1.0;
  return 0.58 ** (gap - 1);
}

/**
 * 后向距离衰减: 0.86^(gap-1)
 * sourceSlot 在 targetSlot 右侧。
 *
 * | 间隔 | 系数 |
 * |------|------|
 * | 相邻 | 1.000 |
 * | 隔1  | 0.860 |
 * | 隔2  | 0.740 |
 */
export function backwardDistance(sourceSlot: number, targetSlot: number): number {
  const gap = sourceSlot - targetSlot;
  if (gap <= 1) return 1.0;
  return 0.86 ** (gap - 1);
}

/**
 * 创建一个所有值均为 0 的 NormalizedStats
 */
export function zeroStats(): NormalizedStats {
  const s: Record<string, number> = {};
  for (const key of STAT_KEYS) s[key] = 0;
  return s as NormalizedStats;
}

/**
 * 创建一个所有值均为 0 的 MechanicState (稀疏)
 */
export function zeroMechanics(): MechanicState {
  return {};
}

/**
 * 深拷贝 NormalizedStats
 */
export function cloneStats(stats: NormalizedStats): NormalizedStats {
  const s: Record<string, number> = {};
  for (const key of STAT_KEYS) s[key] = stats[key];
  return s as NormalizedStats;
}

/**
 * 深拷贝 MechanicState
 */
export function cloneMechanics(mechanics: MechanicState): MechanicState {
  const m: Record<string, number> = {};
  for (const key of MECHANIC_KEYS) {
    if (mechanics[key] !== undefined) {
      m[key] = mechanics[key];
    }
  }
  return m as MechanicState;
}

/**
 * 安全获取 mechanics 值，不存在时返回 0
 */
export function getMechanicValue(mechanics: MechanicState, key: MechanicKey): number {
  return mechanics[key] ?? 0;
}

/**
 * 设置 mechanics 值，值为 0 时删除键（保持稀疏）
 */
export function setMechanicValue(mechanics: MechanicState, key: MechanicKey, value: number): void {
  if (Math.abs(value) < 1e-9) {
    delete mechanics[key];
  } else {
    mechanics[key] = value;
  }
}
