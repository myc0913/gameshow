// scripts/verify-v6-2.ts
// 验证 V6-2 结果解码 — 命名、标签、描述、变化摘要、AnimationSpec、diffBuilds
// 依据: docs/v6/presentation-and-migration.md §3-§8, §12
// 运行: npx tsx scripts/verify-v6-2.ts

import { STAT_KEYS, MECHANIC_KEYS, ELEMENT_KEYS } from '../src/types/v6.ts';
import type {
  GeneratedSkill,
  ContributionTrace,
  ChangeSummary,
  SkillDiff,
  AnimationSpec,
} from '../src/types/v6.ts';
import { getBaseSkill } from '../src/data/v6/baseSkills.ts';
import { getDirectedReaction } from '../src/data/v6/reactionRules.ts';
import {
  generateSkillName,
  generateTags,
  generateDescription,
  buildChangeSummaries,
  contributionSalience,
  findDominantForward,
  findDominantBackward,
  finalizeGeneratedSkill,
} from '../src/engine/v6/finalizeGeneratedSkill.ts';
import { decodeAnimationSpec } from '../src/engine/v6/decodeAnimationSpec.ts';
import { diffBuilds } from '../src/engine/v6/diffBuilds.ts';
import { generateBuildV6 } from '../src/engine/v6/generateBuildV6.ts';
import { getMechanicValue, cloneStats, cloneMechanics, roundTo } from '../src/engine/v6/math.ts';
import {
  CUE_PREFIX_MAP,
  BACKWARD_SUFFIX_MAP,
  DEFAULT_BUILD_A,
  DEFAULT_BUILD_B,
} from '../src/data/v6/namingLexicon.ts';

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

// 预先生成测试用数据
const buildA = generateBuildV6({ seedIds: DEFAULT_BUILD_A });
const buildB = generateBuildV6({ seedIds: DEFAULT_BUILD_B });
const build1 = generateBuildV6({ seedIds: ['fire_flow'] });
const build2 = generateBuildV6({ seedIds: ['fire_flow', 'frost_zone'] });
const build3 = generateBuildV6({ seedIds: ['fire_flow', 'frost_zone', 'lightning_mark'] });

console.log('=== V6-2 结果解码验证 ===\n');

// ============================================================
// §3 命名规则
// ============================================================
console.log('--- §3 命名规则 ---');

// 3.1 单技能使用基础名
check(build1.skills[0].generatedName === '焰息', '单技能名称为基础名');

// 3.2 有前向无后向时格式: {反应前缀}{基础名}
// Build A fire_flow (slot 0): 有后向无前向 → 基础名·后位余韵
check(
  buildA.skills[0].generatedName === '焰息·风尾' || buildA.skills[0].generatedName.includes('焰息'),
  'fire_flow 名称包含基础名',
);

// 3.3 有前向有后向时格式: {反应前缀}{基础名}·{后位余韵}
check(
  buildA.skills[1].generatedName.includes('霜环'),
  'frost_zone 名称包含基础名',
);

// 3.4 名称最多 10 个汉字
for (const build of [buildA, buildB]) {
  for (const skill of build.skills) {
    const hanziCount = (skill.generatedName.match(/[一-鿿]/g) || []).length;
    check(hanziCount <= 10, `${skill.seedId} 名称 ${skill.generatedName} 有 ${hanziCount} 个汉字 ≤ 10`);
  }
}

// 3.5 确定性：相同输入相同名称
const buildA2 = generateBuildV6({ seedIds: DEFAULT_BUILD_A });
for (let i = 0; i < 4; i++) {
  check(
    buildA.skills[i].generatedName === buildA2.skills[i].generatedName,
    `${buildA.skills[i].seedId} 名称确定性: "${buildA.skills[i].generatedName}"`,
  );
}

// 3.6 名称来自 Trace：有前向贡献时前缀不为空
for (const skill of buildA.skills) {
  const domFwd = findDominantForward(buildA.trace.contributions, skill.slot);
  const domBwd = findDominantBackward(buildA.trace.contributions, skill.slot);
  if (!domFwd && !domBwd) {
    // 单技能应使用基础名
    check(skill.generatedName === skill.baseName, `${skill.seedId} 无贡献时名称为基础名`);
  }
}

// 3.7 Cue 前缀映射覆盖所有反应规则中的 visualCue
const allCues = new Set<string>();
for (const build of [buildA, buildB]) {
  for (const c of build.trace.contributions) {
    if (c.kind === 'accent') {
      // 从反应规则获取 visualCue
      const ruleKey = c.reactionKey;
      const [src, tgt] = ruleKey.split('->');
      try {
        const reaction = getDirectedReaction(src as any, tgt as any);
        allCues.add(reaction.forward.visualCue);
        allCues.add(reaction.backward.visualCue);
      } catch { /* skip */ }
    }
  }
}
for (const cue of allCues) {
  check(cue in CUE_PREFIX_MAP, `Cue "${cue}" 有对应前缀 "${CUE_PREFIX_MAP[cue as keyof typeof CUE_PREFIX_MAP]}"`);
}

// 3.8 后位余韵映射完整
for (const el of ELEMENT_KEYS) {
  check(el in BACKWARD_SUFFIX_MAP, `${el} 有对应后缀 "${BACKWARD_SUFFIX_MAP[el]}"`);
}

// ============================================================
// §5 标签生成
// ============================================================
console.log('\n--- §5 标签生成 ---');

for (const build of [buildA, buildB]) {
  for (const skill of build.skills) {
    // 5.1 必定有元素标签
    check(skill.tags.length >= 1, `${skill.seedId} 有至少 1 个标签`);
    check(skill.tags.length <= 6, `${skill.seedId} 标签数 ≤ 6: ${skill.tags.length}`);

    // 5.2 无重复标签
    const uniqueTags = new Set(skill.tags);
    check(uniqueTags.size === skill.tags.length, `${skill.seedId} 标签无重复`);

    // 5.3 标签来自计算结果：mechanic 标签值 >= 0.15
    // （只检查非元素、非形态、非反应名的标签）
    const elementLabels = ['火', '冰', '雷', '岩', '影', '风'];
    const formLabels = ['投射', '锥形', '领域', '连锁', '位移', '构造', '印记', '召唤', '直线'];
    for (const tag of skill.tags) {
      if (tag.startsWith('弱化:')) continue;
      if (elementLabels.includes(tag)) continue;
      if (formLabels.includes(tag)) continue;
      // 可能是反应名或机制标签
      // 检查是否是已知反应名
      const isReactionName = build.trace.contributions.some(
        (c) => c.reactionName === tag && c.targetSlot === skill.slot,
      );
      const mechKey = Object.entries({
        '燃烧': 'burn', '寒意': 'chill', '冻结': 'freeze', '感电': 'shock',
        '震晕': 'stun', '击退': 'knockback', '拉拽': 'pull', '穿透': 'pierce',
        '防护': 'guard', '标记': 'mark', '延迟爆发': 'delayedBurst', '连锁': 'chain',
        '破裂': 'fracture', '束缚': 'bind', '遮蔽': 'obscure', '回响': 'echo', '加速': 'haste',
      }).find(([label]) => label === tag)?.[1];
      if (mechKey) {
        const val = getMechanicValue(skill.finalMechanics, mechKey as any);
        check(val >= 0.15, `${skill.seedId} 机制标签 "${tag}" 值=${val.toFixed(2)} ≥ 0.15`);
      } else if (!isReactionName) {
        // 可能是非标准标签，不失败，仅记录
      }
    }
  }
}

// 5.4 弱化标签只在原生机制确实下降时出现
for (const build of [buildA, buildB]) {
  for (const skill of build.skills) {
    const weakenTag = skill.tags.find((t) => t.startsWith('弱化:'));
    if (weakenTag) {
      const mechName = weakenTag.replace('弱化:', '');
      const mechKey = Object.entries({
        '燃烧': 'burn', '寒意': 'chill', '冻结': 'freeze', '感电': 'shock',
        '震晕': 'stun', '击退': 'knockback', '拉拽': 'pull', '穿透': 'pierce',
        '防护': 'guard', '标记': 'mark', '延迟爆发': 'delayedBurst', '连锁': 'chain',
        '破裂': 'fracture', '束缚': 'bind', '遮蔽': 'obscure', '回响': 'echo', '加速': 'haste',
      }).find(([label]) => label === mechName)?.[1] as any;
      if (mechKey) {
        const baseVal = getMechanicValue(skill.baseMechanics, mechKey);
        const finalVal = getMechanicValue(skill.finalMechanics, mechKey);
        check(
          baseVal >= 0.30 && baseVal - finalVal >= 0.12,
          `${skill.seedId} 弱化 "${mechName}": base=${baseVal.toFixed(2)} final=${finalVal.toFixed(2)} drop=${(baseVal - finalVal).toFixed(2)}`,
        );
      }
    }
  }
}

// ============================================================
// §4 描述生成
// ============================================================
console.log('\n--- §4 描述生成 ---');

for (const build of [buildA, buildB, build1, build2]) {
  for (const skill of build.skills) {
    // 4.1 描述不为空
    check(skill.description.length > 0, `${skill.seedId} 描述非空`);

    // 4.2 描述包含核心效果
    check(
      skill.description.includes(skill.coreEffect),
      `${skill.seedId} 描述包含核心效果`,
    );

    // 4.3 描述不包含原始 key 名 (如 "power", "freeze")
    const rawKeys = ['power', 'reach', 'area', 'duration', 'speed', 'control',
      'force', 'propagation', 'penetration', 'protection',
      'burn', 'chill', 'freeze', 'shock', 'stun', 'knockback', 'pull',
      'pierce', 'guard', 'mark', 'delayedBurst', 'chain', 'fracture',
      'bind', 'obscure', 'echo', 'haste', 'accent'];
    for (const rawKey of rawKeys) {
      check(
        !skill.description.includes(rawKey),
        `${skill.seedId} 描述不含原始 key "${rawKey}"`,
      );
    }

    // 4.4 有前向贡献时有前向描述
    const hasFwd = build.trace.contributions.some(
      (c) => c.pass === 'forward' && c.targetSlot === skill.slot && c.acceptedDelta !== 0,
    );
    if (hasFwd) {
      check(
        skill.description.includes('前位'),
        `${skill.seedId} 有前向贡献时有前向描述`,
      );
    }

    // 4.5 有后向贡献时有后向描述
    const hasBwd = build.trace.contributions.some(
      (c) => c.pass === 'backward' && c.targetSlot === skill.slot && c.acceptedDelta !== 0,
    );
    if (hasBwd) {
      check(
        skill.description.includes('后位'),
        `${skill.seedId} 有后向贡献时有后向描述`,
      );
    }

    // 4.6 无贡献时无多余描述
    if (!hasFwd && !hasBwd) {
      check(
        !skill.description.includes('前位') && !skill.description.includes('后位'),
        `${skill.seedId} 无贡献时无非核心描述`,
      );
    }
  }
}

// ============================================================
// §6 变化摘要
// ============================================================
console.log('\n--- §6 变化摘要 ---');

for (const build of [buildA, buildB]) {
  for (const skill of build.skills) {
    // 6.1 只有真正变化的参数才出现
    for (const change of skill.changes) {
      check(
        Math.abs(change.delta) >= 0.005,
        `${skill.seedId} ${change.key} delta=${change.delta.toFixed(4)} ≥ 0.005`,
      );
    }

    // 6.2 变化有来源
    for (const change of skill.changes) {
      check(
        change.sources.length > 0,
        `${skill.seedId} ${change.key} 有 ${change.sources.length} 个来源`,
      );
      // 每个来源应存在于 trace 中
      for (const src of change.sources) {
        const found = build.trace.contributions.some(
          (c) =>
            c.sourceSlot === src.slot &&
            c.targetSlot === skill.slot &&
            c.pass === src.pass &&
            c.key === change.key,
        );
        check(found, `${skill.seedId} ${change.key} 来源 slot${src.slot}(${src.pass}) 可追溯`);
      }
    }

    // 6.3 变化方向正确
    for (const change of skill.changes) {
      if (change.direction === 'increase') {
        check(change.delta > 0, `${skill.seedId} ${change.key} direction=increase 且 delta=${change.delta.toFixed(4)} > 0`);
      } else if (change.direction === 'decrease') {
        check(change.delta < 0, `${skill.seedId} ${change.key} direction=decrease 且 delta=${change.delta.toFixed(4)} < 0`);
      }
      // mixed 方向说明同时有正负贡献
      if (change.direction === 'mixed') {
        check(change.sources.length >= 1, `${skill.seedId} ${change.key} mixed 方向有来源`);
      }
    }

    // 6.4 forwardValue 合法性检查
    // 注意：forward 和 backward 可能反向，forwardValue 不一定在 [base, final] 之间
    for (const change of skill.changes) {
      if (change.kind === 'stat') {
        check(change.forwardValue >= 0 && change.forwardValue <= 1,
          `${skill.seedId} ${change.key} forwardValue=${change.forwardValue.toFixed(4)} 在 [0,1]`);
      }
    }
  }
}

// ============================================================
// §8 AnimationSpec
// ============================================================
console.log('\n--- §8 AnimationSpec ---');

for (const build of [buildA, buildB, build1]) {
  for (const skill of build.skills) {
    const anim = skill.animation;
    const baseDef = getBaseSkill(skill.seedId);

    // 8.1 形态不变
    check(anim.form === baseDef.form, `${skill.seedId} anim.form=${anim.form} 匹配 base.form=${baseDef.form}`);

    // 8.2 主元素不变
    check(anim.primaryElement === skill.primaryElement, `${skill.seedId} anim.primaryElement=${anim.primaryElement} 匹配`);

    // 8.3 调色板 3 色
    check(anim.primaryPalette.length === 3, `${skill.seedId} 调色板有 ${anim.primaryPalette.length} 色`);
    for (const color of anim.primaryPalette) {
      check(/^#[0-9a-fA-F]{6}$/.test(color), `${skill.seedId} 调色板颜色 "${color}" 合法`);
    }

    // 8.4 时序参数合法
    check(anim.timing.windupSeconds > 0, `${skill.seedId} windup=${anim.timing.windupSeconds} > 0`);
    check(anim.timing.travelSeconds > 0, `${skill.seedId} travel=${anim.timing.travelSeconds} > 0`);
    check(anim.timing.lingerSeconds > 0, `${skill.seedId} linger=${anim.timing.lingerSeconds} > 0`);
    check(anim.timing.pulseIntervalSeconds > 0, `${skill.seedId} pulseInterval=${anim.timing.pulseIntervalSeconds} > 0`);

    // 8.5 几何参数合法
    check(anim.geometry.reach > 0, `${skill.seedId} reach=${anim.geometry.reach} > 0`);
    check(anim.geometry.count >= 1, `${skill.seedId} count=${anim.geometry.count} >= 1`);
    check(anim.geometry.impactScale > 0, `${skill.seedId} impactScale=${anim.geometry.impactScale} > 0`);

    // 8.6 轨迹合法
    check(
      ['none', 'straight', 'arc', 'drop', 'ground'].includes(anim.trajectory),
      `${skill.seedId} trajectory="${anim.trajectory}" 合法`,
    );

    // 8.7 Cue 强度增强
    if (anim.forwardCue) {
      check(
        anim.forwardCue.strength >= 0.15,
        `${skill.seedId} forwardCue strength=${anim.forwardCue.strength.toFixed(2)} >= 0.15`,
      );
      check(
        anim.forwardCue.pass === 'forward',
        `${skill.seedId} forwardCue pass=forward`,
      );
      check(
        anim.forwardCue.sourceSlots.length > 0,
        `${skill.seedId} forwardCue 有 ${anim.forwardCue.sourceSlots.length} 个来源槽位`,
      );
    }
    if (anim.backwardCue) {
      check(
        anim.backwardCue.strength >= 0.15,
        `${skill.seedId} backwardCue strength=${anim.backwardCue.strength.toFixed(2)} >= 0.15`,
      );
      check(
        anim.backwardCue.pass === 'backward',
        `${skill.seedId} backwardCue pass=backward`,
      );
    }
  }
}

// 8.8 不同构筑中同 seed 形态一致
const seedsUnion = [...new Set([...DEFAULT_BUILD_A])];
for (const seedId of seedsUnion) {
  const sA = buildA.skills.find((s) => s.seedId === seedId)!;
  const sB = buildB.skills.find((s) => s.seedId === seedId)!;
  check(sA.animation.form === sB.animation.form, `${seedId} A/B 动画形态一致: ${sA.animation.form}`);
  check(sA.animation.primaryElement === sB.animation.primaryElement, `${seedId} A/B 主元素一致`);
}

// ============================================================
// §6.3 diffBuilds
// ============================================================
console.log('\n--- §6.3 diffBuilds ---');

const diffs = diffBuilds(buildA, buildB);

// diffBuilds 按 occurrenceKey 匹配
check(diffs.length === 4, 'diffBuilds 返回 4 个技能差异');

for (const diff of diffs) {
  // 每个 diff 有 seedId
  check(diff.seedId.length > 0, `${diff.occurrenceKey} 有 seedId`);

  // slot 可能变化
  check(diff.slotA !== diff.slotB, `${diff.seedId} 槽位变化: ${diff.slotA}→${diff.slotB}`);

  // 参数差异存在
  check(diff.statDiffs.length > 0, `${diff.seedId} 有 ${diff.statDiffs.length} 个参数差异`);

  // 机制差异可能存在
  if (diff.mechanicDiffs.length > 0) {
    for (const md of diff.mechanicDiffs) {
      check(Math.abs(md.delta) >= 0.005, `${diff.seedId} ${md.key} 机制差异 delta=${md.delta.toFixed(4)} ≥ 0.005`);
    }
  }

  // 参数差异 delta 正确（diffBuilds 内部 roundTo(4)，允许 0.001 容差）
  for (const sd of diff.statDiffs) {
    assertClose(sd.valueB - sd.valueA, sd.delta, 0.001, `${diff.seedId} ${sd.key} delta 一致`);
  }
}

// diffBuilds 对比同一构筑应无差异
const selfDiff = diffBuilds(buildA, buildA);
for (const d of selfDiff) {
  check(d.statDiffs.length === 0, `${d.seedId} 自对比无参数差异`);
  check(d.slotA === d.slotB, `${d.seedId} 自对比槽位相同`);
}

// ============================================================
// §12.5 默认 A/B 验收标准
// ============================================================
console.log('\n--- §12.5 默认 A/B 验收 ---');

// A/B 是相反顺序
check(
  DEFAULT_BUILD_A.join(',') === DEFAULT_BUILD_B.reverse().join(','),
  'A 和 B 是相反顺序',
);

// 12.5.1 至少 3/4 名称不同
let nameDiffCount = 0;
for (const seedId of DEFAULT_BUILD_A) {
  const sA = buildA.skills.find((s) => s.seedId === seedId)!;
  const sB = buildB.skills.find((s) => s.seedId === seedId)!;
  if (sA.generatedName !== sB.generatedName) nameDiffCount++;
}
check(nameDiffCount >= 3, `至少 3/4 名称不同: ${nameDiffCount}/4`);

// 12.5.2 至少 3/4 "有意义差异"
let meaningfulDiffCount = 0;
for (const seedId of DEFAULT_BUILD_A) {
  const sA = buildA.skills.find((s) => s.seedId === seedId)!;
  const sB = buildB.skills.find((s) => s.seedId === seedId)!;

  // 任一参数差 ≥ 0.08
  const anyParamBigDiff = STAT_KEYS.some(
    (k) => Math.abs(sA.finalStats[k] - sB.finalStats[k]) >= 0.08,
  );
  // 全部参数绝对差之和 ≥ 0.16
  const totalParamDiff = STAT_KEYS.reduce(
    (sum, k) => sum + Math.abs(sA.finalStats[k] - sB.finalStats[k]), 0,
  );
  // 任一机制差 ≥ 0.12
  const anyMechBigDiff = MECHANIC_KEYS.some((k) => {
    const va = getMechanicValue(sA.finalMechanics, k);
    const vb = getMechanicValue(sB.finalMechanics, k);
    return Math.abs(va - vb) >= 0.12;
  });
  // 主前向 Cue 不同
  const fwdCueDiff = sA.animation.forwardCue?.visualCue !== sB.animation.forwardCue?.visualCue;
  // 主后向 Cue 不同且强度差 ≥ 0.08
  const bwdCueDiff = sA.animation.backwardCue?.visualCue !== sB.animation.backwardCue?.visualCue &&
    Math.abs((sA.animation.backwardCue?.strength ?? 0) - (sB.animation.backwardCue?.strength ?? 0)) >= 0.08;

  const isMeaningful = anyParamBigDiff || totalParamDiff >= 0.16 || anyMechBigDiff || fwdCueDiff || bwdCueDiff;
  if (isMeaningful) meaningfulDiffCount++;

  console.log(`  ${seedId}: paramBig=${anyParamBigDiff} totalParam=${totalParamDiff.toFixed(3)} mechBig=${anyMechBigDiff} fwdCue=${fwdCueDiff} bwdCue=${bwdCueDiff} → ${isMeaningful ? '有意义' : '不够'}`);
}
check(meaningfulDiffCount >= 3, `至少 3/4 有意义差异: ${meaningfulDiffCount}/4`);

// 12.5.3 至少 2/4 机制标签不同
let tagDiffCount = 0;
for (const seedId of DEFAULT_BUILD_A) {
  const sA = buildA.skills.find((s) => s.seedId === seedId)!;
  const sB = buildB.skills.find((s) => s.seedId === seedId)!;
  const tagsA = new Set(sA.tags);
  const tagsB = new Set(sB.tags);
  const diff = [...tagsA].some((t) => !tagsB.has(t)) || [...tagsB].some((t) => !tagsA.has(t));
  if (diff) tagDiffCount++;
}
check(tagDiffCount >= 2, `至少 2/4 标签不同: ${tagDiffCount}/4`);

// 12.5.4 frost_zone 在不同顺序中有不同主前向反应
const frostZoneA = buildA.skills.find((s) => s.seedId === 'frost_zone')!;
const frostZoneB = buildB.skills.find((s) => s.seedId === 'frost_zone')!;
check(
  frostZoneA.generatedName !== frostZoneB.generatedName,
  `frost_zone 名称不同: "${frostZoneA.generatedName}" vs "${frostZoneB.generatedName}"`,
);

// 12.5.5 fire_flow 在 A 中以后向为主，在 B 中以前向为主
const fireFlowA = buildA.skills.find((s) => s.seedId === 'fire_flow')!;
const fireFlowB = buildB.skills.find((s) => s.seedId === 'fire_flow')!;
// A: slot 0 — 只有后向修饰（无前向来源）
// B: slot 3 — 有前向来源
const fireFlowA_hasFwd = buildA.trace.contributions.some(
  (c) => c.pass === 'forward' && c.targetSlot === fireFlowA.slot && c.acceptedDelta !== 0,
);
const fireFlowB_hasFwd = buildB.trace.contributions.some(
  (c) => c.pass === 'forward' && c.targetSlot === fireFlowB.slot && c.acceptedDelta !== 0,
);
check(!fireFlowA_hasFwd, 'fire_flow 在 A (slot0) 无前向来源');
check(fireFlowB_hasFwd, 'fire_flow 在 B (slot3) 有前向来源');

// 12.5.6 参数校准检查（不是硬编码，只是合理性范围）
const paramDiffSummary: Record<string, number> = {};
for (const seedId of DEFAULT_BUILD_A) {
  const sA = buildA.skills.find((s) => s.seedId === seedId)!;
  const sB = buildB.skills.find((s) => s.seedId === seedId)!;
  const total = STAT_KEYS.reduce(
    (sum, k) => sum + Math.abs(sA.finalStats[k] - sB.finalStats[k]), 0,
  );
  paramDiffSummary[seedId] = total;
  check(total > 0.10, `${seedId} A/B 参数总差 ${total.toFixed(3)} > 0.10`);
}
console.log('  参数差异摘要:', JSON.stringify(paramDiffSummary, null, 2));

// ============================================================
// Trace 可追溯性
// ============================================================
console.log('\n--- Trace 可追溯性 ---');

for (const build of [buildA, buildB]) {
  for (const skill of build.skills) {
    // 每个变化都能在 Trace 中找到对应贡献
    for (const change of skill.changes) {
      const traceContribs = build.trace.contributions.filter(
        (c) => c.targetSlot === skill.slot && c.key === change.key && c.acceptedDelta !== 0,
      );
      check(
        traceContribs.length > 0,
        `${skill.seedId} ${change.key} 在 Trace 中有 ${traceContribs.length} 条贡献`,
      );
    }

    // 每个聚合记录有对应的贡献
    for (const stage of build.trace.skills) {
      if (stage.slot !== skill.slot) continue;
      check(stage.seedId === skill.seedId, `${skill.seedId} Trace stage seedId 匹配`);
      check(stage.base.stats.power !== undefined, `${skill.seedId} Trace stage 有 base stats`);
      check(stage.afterForward.stats.power !== undefined, `${skill.seedId} Trace stage 有 afterForward stats`);
      check(stage.final.stats.power !== undefined, `${skill.seedId} Trace stage 有 final stats`);
    }
  }
}

// ============================================================
// 边界情况
// ============================================================
console.log('\n--- 边界情况 ---');

// 1 技能无贡献
check(build1.trace.contributions.length === 0, '1 技能无贡献记录');
check(build1.skills[0].changes.length === 0, '1 技能无变化摘要');

// 2 技能有双向贡献
check(build2.trace.contributions.length > 0, '2 技能有贡献');
// slot 0 应有后向修饰
const b2HasBackward = build2.trace.contributions.some(
  (c) => c.pass === 'backward' && c.targetSlot === 0,
);
check(b2HasBackward, '2 技能 slot0 有后向修饰');

// 3 技能
check(build3.skills.length === 3, '3 技能构建正常');
check(build3.trace.skills.length === 3, '3 技能 trace 正常');

// 重复 seed 命名区分
const buildDup = generateBuildV6({ seedIds: ['fire_flow', 'fire_flow', 'frost_zone', 'wind_impact'] });
check(buildDup.skills[0].slot === 0 && buildDup.skills[1].slot === 1, '重复 seed 在不同槽位');
// 名称可能相同也可能不同（取决于前向/后向影响）

// AnimationSpec 在所有排列中形态一致
const allPerms = permute(DEFAULT_BUILD_A);
for (const perm of allPerms) {
  const build = generateBuildV6({ seedIds: perm });
  for (const skill of build.skills) {
    const baseForm = getBaseSkill(skill.seedId).form;
    check(
      skill.animation.form === baseForm,
      `排列 ${perm.join(',')} ${skill.seedId} form=${skill.animation.form} 匹配 base=${baseForm}`,
    );
  }
}

// ============================================================
// 结果
// ============================================================
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n❌ V6-2 验证未通过！');
  process.exit(1);
} else {
  console.log('\n✅ V6-2 全部验证通过！');
}

// 辅助函数
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
