// ============================================================
// V6 数据校验 — 在模块加载时验证数据完整性
// 依据: docs/v6/engine-spec.md §9.1
// ============================================================

import type { DirectedReactionRule, BaseSkillDefinition } from '../../types/v6.ts';
import { STAT_KEYS, ELEMENT_KEYS } from '../../types/v6.ts';

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
