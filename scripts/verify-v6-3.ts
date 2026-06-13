// scripts/verify-v6-3.ts
// 验证 V6-3 Play 接入 — 默认 A/B 案例 + 组件集成
// 依据: docs/v6/presentation-and-migration.md §12.5
// 运行: npx tsx scripts/verify-v6-3.ts

import { generateBuildV6 } from '../src/engine/v6/generateBuildV6.ts';
import { diffBuilds } from '../src/engine/v6/diffBuilds.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../src/types/v6.ts';
import { getMechanicValue } from '../src/engine/v6/math.ts';
import { DEFAULT_BUILD_A, DEFAULT_BUILD_B } from '../src/data/v6/namingLexicon.ts';

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
    console.log(`  ✅ ${label} (actual=${actual.toFixed(4)}, expected≈${expected.toFixed(4)})`);
    passed++;
  } else {
    console.log(`  ❌ ${label} (actual=${actual.toFixed(4)}, expected≈${expected.toFixed(4)}, diff=${(actual - expected).toFixed(4)})`);
    failed++;
  }
}

console.log('\n=== V6-3 验收：默认 A/B 案例 ===\n');

// Generate A/B
let buildA, buildB;
try {
  buildA = generateBuildV6({ seedIds: DEFAULT_BUILD_A });
  buildB = generateBuildV6({ seedIds: DEFAULT_BUILD_B });
  check(true, 'generateBuildV6(A) 成功');
  check(true, 'generateBuildV6(B) 成功');
} catch (e) {
  check(false, `generateBuildV6 抛错: ${e}`);
  console.log(`\n结果: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// 1. At least 3/4 skill names different
console.log('\n1. 名称差异:');
let nameDiffCount = 0;
for (let i = 0; i < 4; i++) {
  const skillA = buildA.skills.find((s) => s.seedId === buildB.skills[i].seedId);
  if (skillA) {
    const diff = skillA.generatedName !== buildB.skills[i].generatedName;
    if (diff) nameDiffCount++;
    console.log(`  ${skillA.seedId}: "${skillA.generatedName}" vs "${buildB.skills[i].generatedName}" ${diff ? '✗' : '✓'}`);
  }
}
check(nameDiffCount >= 3, `至少 3/4 名称不同 (实际: ${nameDiffCount}/4)`);

// 2. At least 3/4 skills have "meaningful difference"
console.log('\n2. 有意义差异:');
let meaningfulCount = 0;
const diffs = diffBuilds(buildA, buildB);
for (const diff of diffs) {
  const maxStatDelta = Math.max(0, ...diff.statDiffs.map((d) => Math.abs(d.delta)));
  const sumAbsStatDelta = diff.statDiffs.reduce((s, d) => s + Math.abs(d.delta), 0);
  const maxMechDelta = Math.max(0, ...diff.mechanicDiffs.map((d) => Math.abs(d.delta)));
  const isMeaningful =
    maxStatDelta >= 0.08 ||
    sumAbsStatDelta >= 0.16 ||
    maxMechDelta >= 0.12 ||
    diff.forwardCueChanged ||
    (diff.backwardCueChanged);
  if (isMeaningful) meaningfulCount++;
  console.log(`  ${diff.seedId}: maxStatΔ=${maxStatDelta.toFixed(3)} sumAbsStatΔ=${sumAbsStatDelta.toFixed(3)} maxMechΔ=${maxMechDelta.toFixed(3)} fwdCue=${diff.forwardCueChanged} bwdCue=${diff.backwardCueChanged} → ${isMeaningful ? '有意义' : '不足'}`);
}
check(meaningfulCount >= 3, `至少 3/4 有意义差异 (实际: ${meaningfulCount}/4)`);

// 3. At least 2/4 skills have different significant mechanic tags
console.log('\n3. 机制标签差异:');
let tagDiffCount = 0;
for (const diff of diffs) {
  const skillA = buildA.skills.find((s) => s.seedId === diff.seedId);
  const skillB = buildB.skills.find((s) => s.seedId === diff.seedId);
  if (skillA && skillB) {
    const tagsA = new Set(skillA.tags);
    const tagsB = new Set(skillB.tags);
    const diffTags = [...tagsA].filter((t) => !tagsB.has(t)).length + [...tagsB].filter((t) => !tagsA.has(t)).length;
    if (diffTags >= 1) tagDiffCount++;
    console.log(`  ${diff.seedId}: A=${skillA.tags.join(', ')} | B=${skillB.tags.join(', ')} (不同: ${diffTags})`);
  }
}
check(tagDiffCount >= 2, `至少 2/4 标签不同 (实际: ${tagDiffCount}/4)`);

// 4. At least 1/4 animation Cue different
console.log('\n4. 动画差异:');
let animDiffCount = 0;
for (const diff of diffs) {
  if (diff.forwardCueChanged || diff.backwardCueChanged) animDiffCount++;
  console.log(`  ${diff.seedId}: fwdCue=${diff.forwardCueChanged} bwdCue=${diff.backwardCueChanged}`);
}
check(animDiffCount >= 1, `至少 1/4 动画 Cue 不同 (实际: ${animDiffCount}/4)`);

// 5. frost_zone has different main forward reaction in A vs B
console.log('\n5. frost_zone 前向反应:');
const frostA = buildA.skills.find((s) => s.seedId === 'frost_zone');
const frostB = buildB.skills.find((s) => s.seedId === 'frost_zone');
if (frostA && frostB) {
  const fwdA = buildA.trace.contributions.find(
    (c) => c.targetSlot === frostA.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  const fwdB = buildB.trace.contributions.find(
    (c) => c.targetSlot === frostB.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  console.log(`  A: ${fwdA?.reactionName ?? '无前向反应'} (source: ${fwdA?.sourceElement ?? 'N/A'})`);
  console.log(`  B: ${fwdB?.reactionName ?? '无前向反应'} (source: ${fwdB?.sourceElement ?? 'N/A'})`);
  check(
    (fwdA?.reactionKey ?? '') !== (fwdB?.reactionKey ?? ''),
    'frost_zone 在 A/B 中主前向反应不同',
  );
}

// 6. fire_flow role differs between A and B
console.log('\n6. fire_flow 角色:');
const fireA = buildA.skills.find((s) => s.seedId === 'fire_flow');
const fireB = buildB.skills.find((s) => s.seedId === 'fire_flow');
if (fireA && fireB) {
  const fwdA = buildA.trace.contributions.filter(
    (c) => c.targetSlot === fireA.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  const bwdA = buildA.trace.contributions.filter(
    (c) => c.targetSlot === fireA.slot && c.pass === 'backward' && c.acceptedDelta !== 0,
  );
  const fwdB = buildB.trace.contributions.filter(
    (c) => c.targetSlot === fireB.slot && c.pass === 'forward' && c.acceptedDelta !== 0,
  );
  const bwdB = buildB.trace.contributions.filter(
    (c) => c.targetSlot === fireB.slot && c.pass === 'backward' && c.acceptedDelta !== 0,
  );
  const roleA = fwdA.length > bwdA.length ? '前向为主' : bwdA.length > fwdA.length ? '后向为主' : '均衡';
  const roleB = fwdB.length > bwdB.length ? '前向为主' : bwdB.length > fwdB.length ? '后向为主' : '均衡';
  console.log(`  A: slot=${fireA.slot} fwd=${fwdA.length} bwd=${bwdA.length} → ${roleA}`);
  console.log(`  B: slot=${fireB.slot} fwd=${fwdB.length} bwd=${bwdB.length} → ${roleB}`);
  check(roleA !== roleB, `fire_flow A/B 角色不同 (A=${roleA}, B=${roleB})`);
}

// 7. Parameter absolute sum calibration
console.log('\n7. 参数绝对差之和校准:');
const expectedSums: Record<string, number> = {
  fire_flow: 0.20,
  frost_zone: 0.24,
  lightning_mark: 0.38,
  wind_impact: 0.29,
};
for (const diff of diffs) {
  const sum = diff.statDiffs.reduce((s, d) => s + Math.abs(d.delta), 0);
  const expected = expectedSums[diff.seedId];
  if (expected !== undefined) {
    console.log(`  ${diff.seedId}: Σ|Δ| = ${sum.toFixed(3)} (预期约 ${expected.toFixed(2)})`);
    assertClose(sum, expected, 0.25, `${diff.seedId} 参数绝对差之和接近预期`);
  }
}

// 8. Permutation uniqueness: 24 permutations, at least 20 unique fingerprints
console.log('\n8. 排列唯一性:');
const allPermutations = permute(DEFAULT_BUILD_A);
const fingerprints = new Set<string>();
for (const perm of allPermutations) {
  try {
    const build = generateBuildV6({ seedIds: perm });
    const fp = build.skills.map((s) =>
      `${s.seedId}:${s.generatedName}:${s.animation.forwardCue?.visualCue ?? 'none'}:${s.animation.backwardCue?.visualCue ?? 'none'}`
    ).join('|');
    fingerprints.add(fp);
  } catch { /* skip */ }
}
console.log(`  ${fingerprints.size}/${allPermutations.length} 唯一构筑 fingerprint`);
check(fingerprints.size >= 20, `至少 20 个唯一 fingerprint (实际: ${fingerprints.size})`);

// 9. All permutations: no NaN/Infinity/out-of-bounds
console.log('\n9. 全排列数值检查:');
let validCount = 0;
for (const perm of allPermutations) {
  try {
    const build = generateBuildV6({ seedIds: perm });
    let valid = true;
    for (const skill of build.skills) {
      for (const key of STAT_KEYS) {
        const v = skill.finalStats[key];
        if (isNaN(v) || !isFinite(v) || v < 0 || v > 1) {
          console.log(`    ❌ ${perm.join(',')} skill=${skill.seedId} ${key}=${v}`);
          valid = false;
        }
      }
    }
    if (valid) validCount++;
  } catch { /* skip */ }
}
check(validCount === 24, `24 个排列全部有效 (实际: ${validCount})`);

// Helper: permutation generator
function permute(arr: string[]): string[][] {
  if (arr.length <= 1) return [arr];
  const result: string[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permute(rest)) {
      result.push([arr[i], ...p]);
    }
  }
  return result;
}

console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
