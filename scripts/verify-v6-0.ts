// scripts/verify-v6-0.ts
// 验证 V6-0 数据类型和数据完整性
// 运行: npx tsx scripts/verify-v6-0.ts

import { ELEMENT_KEYS, STAT_KEYS, MECHANIC_KEYS } from '../src/types/v6.ts';
import { BASE_SKILLS, getBaseSkill, getBaseSkillsByElement } from '../src/data/v6/baseSkills.ts';
import { DIRECTED_REACTIONS, getDirectedReaction } from '../src/data/v6/reactionRules.ts';
import { ELEMENT_CAPABILITIES, STAT_DRIVERS, MECHANIC_DRIVERS, FORM_RECEPTIVITY_MODIFIERS } from '../src/data/v6/capabilityRules.ts';
import { CUE_PREFIX_MAP, BACKWARD_SUFFIX_MAP, DEFAULT_BUILD_A, DEFAULT_BUILD_B } from '../src/data/v6/namingLexicon.ts';

let passed = 0;
let failed = 0;

function check(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

console.log('=== V6-0 类型与静态数据验证 ===\n');

// ---- 类型常量 ----
console.log('--- 类型常量 ---');
check(ELEMENT_KEYS.length === 6, '6 个元素');
check(STAT_KEYS.length === 10, '10 个参数');
check(MECHANIC_KEYS.length === 17, '17 个机制');

// ---- 基础技能 ----
console.log('\n--- 基础技能 ---');
check(BASE_SKILLS.length === 24, '24 个基础技能');
const ids = BASE_SKILLS.map((s) => s.id);
check(new Set(ids).size === 24, '24 个唯一 seed ID');

// 每个元素 4 个技能
for (const el of ELEMENT_KEYS) {
  const skills = getBaseSkillsByElement(el);
  check(skills.length === 4, `${el} 有 4 个技能`);
}

// 所有技能都有完整的 10 个参数
for (const s of BASE_SKILLS) {
  for (const key of STAT_KEYS) {
    const val = s.baseStats[key];
    check(typeof val === 'number' && val >= 0 && val <= 1, `${s.id}.${key}=${val.toFixed(2)} 在 [0,1]`);
  }
}

// 形态不依赖 aspect 推断
check(getBaseSkill('frost_mark').form === 'construct', 'frost_mark 形态是 construct');
check(getBaseSkill('wind_mark').form === 'summon', 'wind_mark 形态是 summon');
check(getBaseSkill('fire_impact').form === 'projectile', 'fire_impact 形态是 projectile');

// ---- 反应规则 ----
console.log('\n--- 反应规则 ---');
check(DIRECTED_REACTIONS.length === 36, '36 个定向反应');

const reactionKeys = new Set(DIRECTED_REACTIONS.map((r) => `${r.source}->${r.target}`));
check(reactionKeys.size === 36, '36 个唯一 source->target key');

// 所有 6×6=36 个方向都存在
for (const src of ELEMENT_KEYS) {
  for (const tgt of ELEMENT_KEYS) {
    check(reactionKeys.has(`${src}->${tgt}`), `${src}->${tgt} 规则存在`);
  }
}

// 关键语义检查
const fireToFrost = getDirectedReaction('fire', 'frost');
check((fireToFrost.forward.mechanicDeltas.freeze ?? 0) < 0, '火->冰: freeze 下降');
check((fireToFrost.forward.mechanicDeltas.obscure ?? 0) > 0, '火->冰: obscure 上升');

const lightningToStone = getDirectedReaction('lightning', 'stone');
check((lightningToStone.forward.mechanicDeltas.fracture ?? 0) > 0, '雷->岩: fracture 上升');
check((lightningToStone.forward.mechanicDeltas.shock ?? 0) <= 0, '雷->岩: shock 不上升');

const stoneToLightning = getDirectedReaction('stone', 'lightning');
check((stoneToLightning.forward.statDeltas.propagation ?? 0) < 0, '岩->雷: propagation 下降');
check((stoneToLightning.forward.mechanicDeltas.chain ?? 0) <= 0, '岩->雷: chain 不上升');

const windToFire = getDirectedReaction('wind', 'fire');
check((windToFire.forward.statDeltas.area ?? 0) > 0, '风->火: area 上升');
check((windToFire.forward.statDeltas.propagation ?? 0) > 0, '风->火: propagation 上升');

const frostToFire = getDirectedReaction('frost', 'fire');
check((frostToFire.forward.statDeltas.power ?? 0) < 0 || (frostToFire.forward.statDeltas.speed ?? 0) < 0,
  '冰->火: power 或 speed 下降');
check((frostToFire.forward.mechanicDeltas.chill ?? 0) > 0, '冰->火: chill 上升');

// 同元素 accent 为 0
for (const el of ELEMENT_KEYS) {
  const r = getDirectedReaction(el, el);
  check(r.forward.accentStrength === 0, `${el}->${el}: forward accent=0`);
  check(r.backward.accentStrength === 0, `${el}->${el}: backward accent=0`);
}

// ---- 能力边界 ----
console.log('\n--- 能力边界 ---');
for (const el of ELEMENT_KEYS) {
  const cap = ELEMENT_CAPABILITIES[el];
  check(cap.native.length > 0, `${el} 有原生机制`);
  check(cap.forbidden.length > 0, `${el} 有禁止机制`);
  // native 不在 forbidden 中
  const overlap = cap.native.filter((m) => cap.forbidden.includes(m));
  check(overlap.length === 0, `${el} native ∩ forbidden 为空`);
}

// ---- 驱动映射 ----
console.log('\n--- 驱动映射 ---');
check(Object.keys(STAT_DRIVERS).length === 10, '10 个参数驱动映射');
check(Object.keys(MECHANIC_DRIVERS).length === 17, '17 个机制驱动映射');
check(Object.keys(FORM_RECEPTIVITY_MODIFIERS).length === 9, '9 个形态接受度');

// ---- 命名 ----
console.log('\n--- 命名词库 ---');
check(Object.keys(CUE_PREFIX_MAP).length === 31, '31 个 Cue 前缀');
check(Object.keys(BACKWARD_SUFFIX_MAP).length === 6, '6 个后位后缀');
check(DEFAULT_BUILD_A.length === 4, '默认 A: 4 个 seed');
check(DEFAULT_BUILD_B.length === 4, '默认 B: 4 个 seed');
// A 和 B 是同一组 seed 但不同顺序
check(
  [...DEFAULT_BUILD_A].sort().join(',') === [...DEFAULT_BUILD_B].sort().join(','),
  'A 和 B 使用同一组 seed',
);

// ---- 结果 ----
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n❌ V6-0 验证未通过！');
  process.exit(1);
} else {
  console.log('\n✅ V6-0 全部验证通过！');
}
