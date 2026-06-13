// scripts/verify-v6-1.ts
// 验证 V6-1 规则引擎管线
// 运行: npx tsx scripts/verify-v6-1.ts

import {
  saturate, lerp, clamp, roundTo,
  forwardDistance, backwardDistance,
  zeroStats, zeroMechanics, cloneStats, cloneMechanics,
  getMechanicValue, setMechanicValue,
} from '../src/engine/v6/math.ts';
import {
  sourceExpression, formReceptivity, mechanicFormReceptivity,
  projectOutboundSignature, capabilityAllows, sourceCapabilityAllows,
} from '../src/engine/v6/sourceProjection.ts';
import { computeForwardPass } from '../src/engine/v6/computeForwardPass.ts';
import { computeBackwardPass } from '../src/engine/v6/computeBackwardPass.ts';
import {
  finalizeGeneratedSkill, generateSkillName, generateTags,
  generateDescription, buildChangeSummaries,
} from '../src/engine/v6/finalizeGeneratedSkill.ts';
import { decodeAnimationSpec } from '../src/engine/v6/decodeAnimationSpec.ts';
import { diffBuilds } from '../src/engine/v6/diffBuilds.ts';
import { generateBuildV6 } from '../src/engine/v6/generateBuildV6.ts';
import { getBaseSkill } from '../src/data/v6/baseSkills.ts';
import { DEFAULT_BUILD_A, DEFAULT_BUILD_B } from '../src/data/v6/namingLexicon.ts';
import { STAT_KEYS, MECHANIC_KEYS, ELEMENT_KEYS } from '../src/types/v6.ts';
import type { SkillSnapshot } from '../src/types/v6.ts';

let passed = 0;
let failed = 0;

function check(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

function assertClose(actual: number, expected: number, tolerance: number, label: string): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    console.log(`  ✅ ${label}: ${actual.toFixed(4)} ≈ ${expected.toFixed(4)}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}: got ${actual.toFixed(4)}, expected ${expected.toFixed(4)}`);
    failed++;
  }
}

console.log('=== V6-1 规则引擎管线验证 ===\n');

// ============================================================
// 1. 数学工具
// ============================================================
console.log('--- 数学工具 ---');

// saturate
assertClose(saturate(0.1, 0.35), 0.35 * Math.tanh(0.1 / 0.35), 1e-6, 'saturate 小值接近线性');
check(saturate(0, 0.35) === 0, 'saturate(0)=0');
check(saturate(10, 0.35) < 0.351, 'saturate 有界 (大输入不爆炸)');
check(saturate(-0.2, 0.35) < 0, 'saturate 保持负号');

// lerp
assertClose(lerp(0, 10, 0.5), 5, 1e-6, 'lerp 中点');
assertClose(lerp(2, 8, 0), 2, 1e-6, 'lerp t=0');
assertClose(lerp(2, 8, 1), 8, 1e-6, 'lerp t=1');

// forwardDistance
assertClose(forwardDistance(0, 1), 1.0, 1e-6, '前向相邻距离=1');
assertClose(forwardDistance(0, 2), 0.58, 1e-6, '前向隔1=0.58');
assertClose(forwardDistance(0, 3), 0.58 ** 2, 1e-6, '前向隔2=0.3364');

// backwardDistance
assertClose(backwardDistance(1, 0), 1.0, 1e-6, '后向相邻距离=1');
assertClose(backwardDistance(2, 0), 0.86, 1e-6, '后向隔1=0.86');
assertClose(backwardDistance(3, 0), 0.86 ** 2, 1e-6, '后向隔2=0.7396');

// clamp
check(clamp(0.5, 0, 1) === 0.5, 'clamp 内');
check(clamp(2, 0, 1) === 1, 'clamp 上限');
check(clamp(-1, 0, 1) === 0, 'clamp 下限');

// mechanics helpers
const m = zeroMechanics();
setMechanicValue(m, 'burn', 0.5);
check(getMechanicValue(m, 'burn') === 0.5, 'setMechanicValue/getMechanicValue');
check(getMechanicValue(m, 'freeze') === 0, '不存在机制返回0');
setMechanicValue(m, 'burn', 0);
check(getMechanicValue(m, 'burn') === 0, '零值被清除');

// ============================================================
// 2. 来源投影
// ============================================================
console.log('\n--- 来源投影 ---');

const fireFlow = getBaseSkill('fire_flow');
check(fireFlow.element === 'fire', 'fire_flow 是火元素');

// sourceExpression 范围 0.55..1
const expr = sourceExpression({ stats: fireFlow.baseStats }, 'power');
check(expr >= 0.55 && expr <= 1, `sourceExpression 在 [0.55,1]: ${expr.toFixed(3)}`);

// formReceptivity
const recept = formReceptivity('cone', 'area');
check(recept >= 0.40 && recept <= 1, `formReceptivity 在 [0.40,1]: ${recept.toFixed(3)}`);
check(formReceptivity('construct', 'speed') < 0.75, 'construct 对 speed 接受度低');

// mechanicFormReceptivity
check(mechanicFormReceptivity() === 0.85, '机制接受度固定 0.85');

// projectOutboundSignature
const snap: SkillSnapshot = {
  slot: 0, seedId: 'fire_flow',
  primaryElement: 'fire', aspect: 'flow', form: 'cone',
  coreEffect: 'test', stats: fireFlow.baseStats,
  mechanics: { burn: 0.8 }, accents: [
    { element: 'frost', strength: 0.2, pass: 'forward', sourceSlots: [1], visualCue: 'steam_melt' },
  ],
};
const outbound = projectOutboundSignature(snap);
check(outbound.primaryElement === 'fire', '出站保持主元素');
check(outbound.slot === 0, '出站保持槽位');
check(outbound.form === 'cone', '出站保持形态');
// stats 相同但不同引用
check(outbound.stats.power === fireFlow.baseStats.power, '出站保持参数值');

// capabilityAllows
check(capabilityAllows('fire', 'freeze', 0.1) === false, '火不接受 freeze');
check(capabilityAllows('fire', 'freeze', -0.1) === true, '火接受 freeze 减少');
check(capabilityAllows('lightning', 'chain', 0.1) === true, '雷接受 chain');
check(capabilityAllows('stone', 'chain', 0.1) === false, '岩不接受 chain');

// ============================================================
// 3. 前向计算
// ============================================================
console.log('\n--- 前向计算 ---');

// 用默认 A 的 4 个技能测试: fire_flow, frost_zone, lightning_mark, wind_impact
const buildASeeds = DEFAULT_BUILD_A;
const baseASnaps: SkillSnapshot[] = buildASeeds.map((seedId, slot) => {
  const def = getBaseSkill(seedId);
  return {
    slot, seedId,
    primaryElement: def.element,
    aspect: def.aspect, form: def.form,
    coreEffect: def.coreEffect,
    stats: cloneStats(def.baseStats),
    mechanics: cloneMechanics(def.nativeMechanics),
    accents: [],
  };
});

const fwdResult = computeForwardPass(baseASnaps);
const fwdSnaps = fwdResult.snapshots;

// slot 0 无前向来源，应保持不变
check(fwdSnaps[0].stats.power === baseASnaps[0].stats.power, 'slot0 前向后参数不变');
check(getMechanicValue(fwdSnaps[0].mechanics, 'burn') === 0.80, 'slot0 前向后机制不变');

// slot 1 (frost_zone) 应受 slot 0 (fire_flow) 影响
// 火→冰: freeze 下降, obscure 上升
const frostFreezeBefore = getMechanicValue(baseASnaps[1].mechanics, 'freeze');
const frostFreezeAfter = getMechanicValue(fwdSnaps[1].mechanics, 'freeze');
check(frostFreezeAfter < frostFreezeBefore, `火→冰: freeze 下降 ${frostFreezeBefore.toFixed(2)}→${frostFreezeAfter.toFixed(2)}`);

const frostObscureBefore = getMechanicValue(baseASnaps[1].mechanics, 'obscure');
const frostObscureAfter = getMechanicValue(fwdSnaps[1].mechanics, 'obscure');
check(frostObscureAfter > frostObscureBefore, `火→冰: obscure 上升 ${frostObscureBefore.toFixed(2)}→${frostObscureAfter.toFixed(2)}`);

// 前向贡献记录存在
check(fwdResult.contributions.length > 0, `前向贡献记录: ${fwdResult.contributions.length} 条`);
check(fwdResult.aggregates.length > 0, `前向聚合记录: ${fwdResult.aggregates.length} 条`);

// 所有参数在 [0,1]
for (const snap of fwdSnaps) {
  for (const key of STAT_KEYS) {
    check(snap.stats[key] >= 0 && snap.stats[key] <= 1,
      `前向 ${snap.seedId}.${key}=${snap.stats[key].toFixed(2)} 在 [0,1]`);
  }
}

// ============================================================
// 4. 后向计算
// ============================================================
console.log('\n--- 后向计算 ---');

const bwdResult = computeBackwardPass(fwdSnaps);
const finalSnaps = bwdResult.snapshots;

// slot 3 (wind_impact) 无后向来源，应保持不变
check(finalSnaps[3].stats.power === fwdSnaps[3].stats.power, 'slot3 后向后参数不变');

// slot 0 (fire_flow) 应受后位影响（slot1 frost_zone + slot2 lightning_mark + slot3 wind_impact）
const fireStatsChanged = STAT_KEYS.some(
  (k) => Math.abs(finalSnaps[0].stats[k] - fwdSnaps[0].stats[k]) > 0.001,
);
check(fireStatsChanged, 'slot0 受后向影响产生变化');

// 后向权威度: slot4 > slot3 > slot2 (对应数组索引 3 > 2 > 1)
check(bwdResult.contributions.length > 0, `后向贡献记录: ${bwdResult.contributions.length} 条`);

// 所有参数在 [0,1]
for (const snap of finalSnaps) {
  for (const key of STAT_KEYS) {
    check(snap.stats[key] >= 0 && snap.stats[key] <= 1,
      `后向 ${snap.seedId}.${key}=${snap.stats[key].toFixed(2)} 在 [0,1]`);
  }
}

// ============================================================
// 5. 完整管线 generateBuildV6
// ============================================================
console.log('\n--- generateBuildV6 完整管线 ---');

// 5.1 正常 4 技能
const buildA = generateBuildV6({ seedIds: DEFAULT_BUILD_A });
check(buildA.version === 'v6', 'version=v6');
check(buildA.skills.length === 4, '4 个技能');
check(buildA.trace.version === 'v6', 'trace version=v6');
check(buildA.trace.inputSeedIds.length === 4, 'trace 包含输入');
check(buildA.trace.skills.length === 4, 'trace 包含 4 个技能阶段');
check(buildA.trace.contributions.length > 0, 'trace 包含贡献');
check(buildA.trace.aggregates.length > 0, 'trace 包含聚合');

// 每个技能都有三层值
for (const skill of buildA.skills) {
  check(skill.form !== undefined, `${skill.seedId} 有形态`);
  check(skill.primaryElement !== undefined, `${skill.seedId} 有主元素`);
  check(skill.coreEffect.length > 0, `${skill.seedId} 有主效果`);
  check(skill.generatedName.length > 0, `${skill.seedId} 有生成名称`);
  check(skill.tags.length > 0, `${skill.seedId} 有标签`);
  check(skill.description.length > 0, `${skill.seedId} 有描述`);
  check(skill.animation.form === skill.form, `${skill.seedId} 动画形态匹配`);
}

// 5.2 形态不变
check(buildA.skills[0].form === 'cone', 'fire_flow 形态=cone');
check(buildA.skills[1].form === 'zone', 'frost_zone 形态=zone');
check(buildA.skills[2].form === 'mark', 'lightning_mark 形态=mark');
check(buildA.skills[3].form === 'projectile', 'wind_impact 形态=projectile');

// 5.3 主元素不变
check(buildA.skills[0].primaryElement === 'fire', 'fire_flow 元素=fire');
check(buildA.skills[1].primaryElement === 'frost', 'frost_zone 元素=frost');

// 5.4 1 个技能
const build1 = generateBuildV6({ seedIds: ['fire_flow'] });
check(build1.skills.length === 1, '1 技能构建');
check(build1.skills[0].generatedName === '焰息', '单技能名称为基础名');

// 5.5 2 个技能
const build2 = generateBuildV6({ seedIds: ['fire_flow', 'frost_zone'] });
check(build2.skills.length === 2, '2 技能构建');
check(build2.trace.contributions.length > 0, '2 技能有贡献');

// 5.6 非法 seed
let threw = false;
try {
  generateBuildV6({ seedIds: ['nonexistent'] });
} catch (e) {
  threw = true;
}
check(threw, '非法 seed 抛出错误');

// 5.7 非法长度
threw = false;
try {
  generateBuildV6({ seedIds: [] });
} catch (e) {
  threw = true;
}
check(threw, '空输入抛出错误');

threw = false;
try {
  generateBuildV6({ seedIds: ['fire_flow', 'fire_flow', 'fire_flow', 'fire_flow', 'fire_flow'] });
} catch (e) {
  threw = true;
}
check(threw, '超长输入抛出错误');

// 5.8 重复 seed
const buildDup = generateBuildV6({ seedIds: ['fire_flow', 'fire_flow', 'frost_zone', 'wind_impact'] });
check(buildDup.skills.length === 4, '重复 seed 也能正常工作');

// ============================================================
// 6. 确定性
// ============================================================
console.log('\n--- 确定性 ---');

const build1a = generateBuildV6({ seedIds: DEFAULT_BUILD_A });
const build1b = generateBuildV6({ seedIds: DEFAULT_BUILD_A });
let deterministic = true;
for (let i = 0; i < 4; i++) {
  const sa = build1a.skills[i];
  const sb = build1b.skills[i];
  for (const key of STAT_KEYS) {
    if (Math.abs(sa.finalStats[key] - sb.finalStats[key]) > 1e-10) {
      deterministic = false;
      break;
    }
  }
}
check(deterministic, '相同输入产生完全相同输出');

// ============================================================
// 7. 默认 A/B 对比
// ============================================================
console.log('\n--- 默认 A/B 对比 ---');

const buildB = generateBuildV6({ seedIds: DEFAULT_BUILD_B });

// 7.1 至少 3/4 技能名称不同
let nameDiffs = 0;
for (let i = 0; i < 4; i++) {
  const seedA = buildA.skills.find(s => s.seedId === buildA.skills[i].seedId)!;
  const seedB = buildB.skills.find(s => s.seedId === seedA.seedId)!;
  if (seedA.generatedName !== seedB.generatedName) nameDiffs++;
  console.log(`  A: ${seedA.generatedName}  B: ${seedB.generatedName}`);
}
check(nameDiffs >= 3, `至少 3/4 技能名称不同: ${nameDiffs}/4`);

// 7.2 frost_zone 在不同顺序中有不同前向反应
const frostZoneA = buildA.skills[1]; // slot 1, 前向来源 fire_flow
const frostZoneB = buildB.skills[2]; // slot 2, 前向来源 wind_impact + lightning_mark
check(frostZoneA.generatedName !== frostZoneB.generatedName,
  `frost_zone 名称不同: "${frostZoneA.generatedName}" vs "${frostZoneB.generatedName}"`);

// 7.3 fire_flow 在 A 中以后向为主，在 B 中以前向为主
const fireFlowA = buildA.skills[0];
const fireFlowB = buildB.skills[3];
check(fireFlowA.slot !== fireFlowB.slot,
  `fire_flow 槽位不同: A=slot${fireFlowA.slot} B=slot${fireFlowB.slot}`);

// 7.4 至少 2/4 技能的显著机制标签不同
let mechTagDiffs = 0;
for (const seedId of DEFAULT_BUILD_A) {
  const sA = buildA.skills.find(s => s.seedId === seedId)!;
  const sB = buildB.skills.find(s => s.seedId === seedId)!;
  const tagsA = new Set(sA.tags);
  const tagsB = new Set(sB.tags);
  const diff = [...tagsA].some(t => !tagsB.has(t)) || [...tagsB].some(t => !tagsA.has(t));
  if (diff) mechTagDiffs++;
}
check(mechTagDiffs >= 2, `至少 2/4 技能标签不同: ${mechTagDiffs}/4`);

// 7.5 A≠B（全排列不相同）
const allParamsA = buildA.skills.flatMap(s => STAT_KEYS.map(k => s.finalStats[k]));
const allParamsB = buildB.skills.flatMap(s => STAT_KEYS.map(k => s.finalStats[k]));
const totalDiff = allParamsA.reduce((sum, a, i) => sum + Math.abs(a - allParamsB[i]), 0);
check(totalDiff > 0.1, `A/B 参数总差异 > 0.1: ${totalDiff.toFixed(3)}`);

// ============================================================
// 8. 排列测试 (24 种全排列)
// ============================================================
console.log('\n--- 排列测试 ---');

function permute<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permute(rest)) {
      result.push([arr[i], ...p]);
    }
  }
  return result;
}

const allPerms = permute(DEFAULT_BUILD_A);
check(allPerms.length === 24, '24 种排列');

let validCount = 0;
const fingerprints = new Set<string>();

for (const perm of allPerms) {
  const build = generateBuildV6({ seedIds: perm });

  // 无 NaN/Infinity
  let hasInvalid = false;
  for (const skill of build.skills) {
    for (const key of STAT_KEYS) {
      if (!isFinite(skill.finalStats[key])) hasInvalid = true;
    }
    for (const key of MECHANIC_KEYS) {
      const v = getMechanicValue(skill.finalMechanics, key);
      if (!isFinite(v)) hasInvalid = true;
    }
    // 形态和主元素不变
    if (skill.form !== getBaseSkill(skill.seedId).form) hasInvalid = true;
    if (skill.primaryElement !== getBaseSkill(skill.seedId).element) hasInvalid = true;
  }
  if (!hasInvalid) validCount++;

  // 指纹
  const fp = build.skills.map(s =>
    `${s.seedId}:${STAT_KEYS.map(k => roundTo(s.finalStats[k], 2)).join(',')}`
  ).join('|');
  fingerprints.add(fp);
}

check(validCount === 24, `全部 24 个排列无 NaN/Infinity/形态变化: ${validCount}/24`);
check(fingerprints.size >= 20, `至少 20 个唯一构筑指纹: ${fingerprints.size}/24`);

// ============================================================
// 9. diffBuilds
// ============================================================
console.log('\n--- diffBuilds ---');

const diffs = diffBuilds(buildA, buildB);
check(diffs.length === 4, 'diffBuilds 返回 4 个技能差异');

// 应有参数差异
const hasStatDiff = diffs.some(d => d.statDiffs.length > 0);
check(hasStatDiff, 'diffBuilds 包含参数差异');

// slot 变化
const hasSlotChange = diffs.some(d => d.slotA !== d.slotB);
check(hasSlotChange, 'diffBuilds 反映槽位变化');

// ============================================================
// 10. AnimationSpec
// ============================================================
console.log('\n--- AnimationSpec ---');

for (const skill of buildA.skills) {
  const anim = skill.animation;
  check(anim.form === skill.form, `${skill.seedId} anim.form 匹配`);
  check(anim.primaryElement === skill.primaryElement, `${skill.seedId} anim.element 匹配`);
  check(anim.primaryPalette.length === 3, `${skill.seedId} 调色板 3 色`);
  check(anim.timing.windupSeconds > 0, `${skill.seedId} windup > 0`);
  check(anim.timing.lingerSeconds > 0, `${skill.seedId} linger > 0`);
  check(anim.geometry.reach > 0, `${skill.seedId} reach > 0`);
  check(anim.geometry.count >= 1, `${skill.seedId} count >= 1`);
}

// ============================================================
// 11. 受拒绝的贡献
// ============================================================
console.log('\n--- 能力边界拒绝 ---');

const rejectedContribs = buildA.trace.contributions.filter(c => c.status === 'rejected');
// 可能有一些被拒绝的贡献（取决于具体数据组合）
if (rejectedContribs.length > 0) {
  for (const rc of rejectedContribs) {
    check(rc.rejectionReason === 'element_capability_forbidden',
      `被拒绝贡献有原因: ${rc.rejectionReason}`);
  }
  console.log(`  发现 ${rejectedContribs.length} 条被拒绝贡献`);
} else {
  console.log('  无被拒绝贡献（当前默认 A 组合无冲突）');
}

// ============================================================
// 12. 参数/机制差异摘要
// ============================================================
console.log('\n--- 默认 A/B 参数摘要 ---');

for (const seedId of DEFAULT_BUILD_A) {
  const sA = buildA.skills.find(s => s.seedId === seedId)!;
  const sB = buildB.skills.find(s => s.seedId === seedId)!;

  const significantDiffs = STAT_KEYS.filter(
    k => Math.abs(sA.finalStats[k] - sB.finalStats[k]) >= 0.02,
  );
  const mechDiffs = MECHANIC_KEYS.filter(k => {
    const va = getMechanicValue(sA.finalMechanics, k);
    const vb = getMechanicValue(sB.finalMechanics, k);
    return Math.abs(va - vb) >= 0.02;
  });

  console.log(`  ${seedId}: ${significantDiffs.length} 参数差异, ${mechDiffs.length} 机制差异`);
  console.log(`    A [slot${sA.slot}]: ${sA.generatedName}  tags: ${sA.tags.join(', ')}`);
  console.log(`    B [slot${sB.slot}]: ${sB.generatedName}  tags: ${sB.tags.join(', ')}`);
}

// ============================================================
// 结果
// ============================================================
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n❌ V6-1 验证未通过！');
  process.exit(1);
} else {
  console.log('\n✅ V6-1 全部验证通过！');
}
