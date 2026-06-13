// ============================================================
// V6 主入口 — generateBuildV6 完整管线
// 依据: docs/v6/engine-spec.md §2
// ============================================================

import type {
  GenerateBuildInput,
  GeneratedBuild,
  GeneratedSkill,
  SkillSnapshot,
  BuildTrace,
  SkillStageTrace,
} from '../../types/v6.ts';
import { getBaseSkill } from '../../data/v6/baseSkills.ts';
import { cloneStats, cloneMechanics } from './math.ts';
import { computeForwardPass } from './computeForwardPass.ts';
import { computeBackwardPass } from './computeBackwardPass.ts';
import { finalizeGeneratedSkill } from './finalizeGeneratedSkill.ts';
import { decodeAnimationSpec } from './decodeAnimationSpec.ts';

/**
 * 从种子 ID 序列生成完整构筑。
 *
 * 1. 读取基础技能 → 建立 base snapshots
 * 2. 从左到右计算前向影响
 * 3. 冻结所有 forward snapshots
 * 4. 对每个目标联合计算所有后位来源
 * 5. 得到 final snapshots
 * 6. 解码名称、描述、变化摘要和动画规格
 * 7. 输出 GeneratedBuild + BuildTrace
 *
 * 输入约束：
 * - 数组长度 1..4
 * - 非法 seed ID 抛出错误
 * - 不接受随机种子，不读取时间
 * - 相同输入产生完全相同输出
 */
export function generateBuildV6(input: GenerateBuildInput): GeneratedBuild {
  const seedIds = input.seedIds;

  // 验证输入长度
  if (seedIds.length < 1 || seedIds.length > 4) {
    throw new Error(
      `generateBuildV6: expected 1..4 seed IDs, got ${seedIds.length}`,
    );
  }

  // 1. 建立 base snapshots
  const baseSnapshots: SkillSnapshot[] = seedIds.map((seedId, slot) => {
    const def = getBaseSkill(seedId); // throws on unknown ID
    return {
      slot,
      seedId,
      primaryElement: def.element,
      aspect: def.aspect,
      form: def.form,
      coreEffect: def.coreEffect,
      stats: cloneStats(def.baseStats),
      mechanics: cloneMechanics(def.nativeMechanics),
      accents: [],
    };
  });

  // 2. 前向计算
  const forwardResult = computeForwardPass(baseSnapshots);

  // 3. 前向快照冻结（概念上——后向计算不修改它们）
  const frozenForward = forwardResult.snapshots;

  // 4. 后向计算
  const backwardResult = computeBackwardPass(frozenForward);
  const finalSnapshots = backwardResult.snapshots;

  // 5-6. 最终化每个技能 + 动画规格
  const allContributions = [
    ...forwardResult.contributions,
    ...backwardResult.contributions,
  ];
  const allAggregates = [
    ...forwardResult.aggregates,
    ...backwardResult.aggregates,
  ];

  const skills: GeneratedSkill[] = finalSnapshots.map((finalSnap, i) => {
    const baseSnap = baseSnapshots[i];
    const fwdSnap = frozenForward[i];

    const skill = finalizeGeneratedSkill(
      finalSnap,
      baseSnap,
      fwdSnap,
      allContributions,
      i,
    );

    // 填充 animation spec
    skill.animation = decodeAnimationSpec(skill);

    return skill;
  });

  // 7. 构建 Trace
  const trace: BuildTrace = {
    version: 'v6',
    inputSeedIds: seedIds,
    contributions: allContributions,
    aggregates: allAggregates,
    skills: baseSnapshots.map((baseSnap, i) => {
      const fwdSnap = frozenForward[i];
      const finalSnap = finalSnapshots[i];

      const skillContribIds = allContributions
        .filter((c) => c.targetSlot === i)
        .map((c) => c.id);

      const skillAggIds = allAggregates
        .filter((a) => a.targetSlot === i)
        .map((a) => a.id);

      // 找主导前向/后向贡献
      const fwdContribs = allContributions.filter(
        (c) => c.targetSlot === i && c.pass === 'forward' && c.acceptedDelta !== 0,
      );
      const bwdContribs = allContributions.filter(
        (c) => c.targetSlot === i && c.pass === 'backward' && c.acceptedDelta !== 0,
      );

      let maxSalience = -1;
      let dominantFwdId: string | undefined;
      for (const c of fwdContribs) {
        const sal = Math.abs(c.acceptedDelta) * (c.kind === 'mechanic' ? 0.75 : 1);
        if (sal > maxSalience) {
          maxSalience = sal;
          dominantFwdId = c.id;
        }
      }

      maxSalience = -1;
      let dominantBwdId: string | undefined;
      for (const c of bwdContribs) {
        const sal = Math.abs(c.acceptedDelta) * (c.kind === 'mechanic' ? 0.75 : 1);
        if (sal > maxSalience) {
          maxSalience = sal;
          dominantBwdId = c.id;
        }
      }

      const stage: SkillStageTrace = {
        slot: i,
        seedId: baseSnap.seedId,
        base: baseSnap,
        afterForward: fwdSnap,
        final: finalSnap,
        contributionIds: skillContribIds,
        aggregateIds: skillAggIds,
        dominantForwardContributionId: dominantFwdId,
        dominantBackwardContributionId: dominantBwdId,
      };

      return stage;
    }),
  };

  return {
    version: 'v6',
    input,
    skills,
    trace,
  };
}
