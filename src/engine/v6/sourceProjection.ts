// ============================================================
// V6 来源投影 — 来源表达、形态接受度、出站签名、能力边界
// 依据: docs/v6/engine-spec.md §4-§5, §9.2
// ============================================================

import type {
  StatKey,
  MechanicKey,
  SkillForm,
  ElementKey,
  SkillSnapshot,
  OutboundSignature,
  NormalizedStats,
} from '../../types/v6.ts';
import {
  STAT_DRIVERS,
  MECHANIC_DRIVERS,
  FORM_RECEPTIVITY_MODIFIERS,
  ELEMENT_CAPABILITIES,
  FORM_RECEPTIVITY_BASE,
  SOURCE_EXPRESSION_BASE,
  SOURCE_EXPRESSION_RANGE,
  MECHANIC_FORM_RECEPTIVITY,
} from '../../data/v6/capabilityRules.ts';
import { clamp, cloneStats } from './math.ts';

/**
 * 计算某个参数键的来源驱动值。
 * driver(source, key) = max(source.stats[d] for d in STAT_DRIVERS[key])
 */
export function statDriver(source: { stats: NormalizedStats }, key: StatKey): number {
  const drivers = STAT_DRIVERS[key];
  let maxVal = 0;
  for (const d of drivers) {
    const val = source.stats[d];
    if (val > maxVal) maxVal = val;
  }
  return maxVal;
}

/**
 * 计算某个机制键的来源驱动值。
 * driver(source, key) = max(source.stats[d] for d in MECHANIC_DRIVERS[key])
 */
export function mechanicDriver(source: { stats: NormalizedStats }, key: MechanicKey): number {
  const drivers = MECHANIC_DRIVERS[key];
  let maxVal = 0;
  for (const d of drivers) {
    const val = source.stats[d];
    if (val > maxVal) maxVal = val;
  }
  return maxVal;
}

/**
 * 来源表达系数: 0.55 + 0.45 * driver(source, key)
 * 范围 0.55..1。基础值较低的技能仍能表达元素关系，但强项技能表达更明显。
 */
export function sourceExpression(
  source: { stats: NormalizedStats },
  key: StatKey | MechanicKey,
): number {
  // 参数和机制都使用各自的驱动映射，但公用同一个公式
  const driverVal = STAT_DRIVERS[key as StatKey]
    ? statDriver(source, key as StatKey)
    : mechanicDriver(source, key as MechanicKey);
  return SOURCE_EXPRESSION_BASE + SOURCE_EXPRESSION_RANGE * driverVal;
}

/**
 * 形态接受度: clamp(0.75 + modifier[form][key] ?? 0, 0.40, 1.00)
 * 只缩放变化，不做硬门控。
 */
export function formReceptivity(form: SkillForm, key: StatKey): number {
  const modifier = FORM_RECEPTIVITY_MODIFIERS[form][key] ?? 0;
  return clamp(FORM_RECEPTIVITY_BASE + modifier, 0.40, 1.00);
}

/**
 * 机制的形态接受度固定为 0.85（因为反应表已经人工限制了机制语义）。
 */
export function mechanicFormReceptivity(): number {
  return MECHANIC_FORM_RECEPTIVITY;
}

/**
 * 出站投影: 保留来源的 stats/主元素/形态/槽位，丢弃所有 accents 和 mechanics。
 * 用于后续前向传播时，只传递"这个技能本身的能力强度"，不传递混合元素或外来机制。
 */
export function projectOutboundSignature(snapshot: SkillSnapshot): OutboundSignature {
  return {
    slot: snapshot.slot,
    primaryElement: snapshot.primaryElement,
    form: snapshot.form,
    stats: cloneStats(snapshot.stats),
  };
}

/**
 * 运行时能力边界校验。
 *
 * 检查目标元素是否允许接受某个机制的增量。
 * 如果机制在目标元素的 forbidden 列表中且 delta 为正 → 拒绝。
 * 减小已有机制（负 delta）始终允许。
 *
 * 返回 true 表示该 delta 被允许。
 */
export function capabilityAllows(
  targetElement: ElementKey,
  mechanicKey: MechanicKey,
  delta: number,
): boolean {
  // 负 delta（削弱机制）始终允许
  if (delta <= 0) return true;

  const profile = ELEMENT_CAPABILITIES[targetElement];
  if (!profile) return true; // 安全回退

  // 如果机制在 forbidden 列表中，拒绝正向增量
  if (profile.forbidden.includes(mechanicKey)) {
    return false;
  }

  return true;
}

/**
 * 检查来源元素是否被允许提供某个机制给目标元素。
 * 这是额外的语义边界检查，用于捕获反应规则数据可能的错误。
 *
 * 规则：
 * - 只有风或岩可以增加 knockback
 * - 只有风可以增加 pull
 * - 只有冰可以增加 freeze
 * - 雷→岩不得增加 shock 或 chain
 * - 岩→雷不得增加 shock 或 chain
 */
export function sourceCapabilityAllows(
  sourceElement: ElementKey,
  targetElement: ElementKey,
  mechanicKey: MechanicKey,
  delta: number,
): boolean {
  if (delta <= 0) return true;

  // 只有风或岩可以增加 knockback
  if (mechanicKey === 'knockback' && sourceElement !== 'wind' && sourceElement !== 'stone') {
    return false;
  }

  // 只有风可以增加 pull
  if (mechanicKey === 'pull' && sourceElement !== 'wind') {
    return false;
  }

  // 只有冰可以增加 freeze
  if (mechanicKey === 'freeze' && sourceElement !== 'frost') {
    return false;
  }

  // 雷→岩 不得增加 shock 或 chain
  if (sourceElement === 'lightning' && targetElement === 'stone') {
    if (mechanicKey === 'shock' || mechanicKey === 'chain') {
      return false;
    }
  }

  // 岩→雷 不得增加 shock 或 chain
  if (sourceElement === 'stone' && targetElement === 'lightning') {
    if (mechanicKey === 'shock' || mechanicKey === 'chain') {
      return false;
    }
  }

  return true;
}
