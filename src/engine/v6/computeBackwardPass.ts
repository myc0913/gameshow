// ============================================================
// V6 后向计算 — 右→左，后位技能联合修饰前位技能
// 依据: docs/v6/engine-spec.md §7
// ============================================================

import type {
  SkillSnapshot,
  ContributionTrace,
  AggregateTrace,
  StatKey,
  MechanicKey,
  ElementKey,
} from '../../types/v6.ts';
import { getDirectedReaction } from '../../data/v6/reactionRules.ts';
import {
  BACKWARD_PASS_GAIN,
  BACKWARD_AUTHORITY_BY_SLOT,
  CAPS,
} from '../../data/v6/capabilityRules.ts';
import {
  backwardDistance,
  saturate,
  clamp,
  cloneStats,
  cloneMechanics,
  getMechanicValue,
  setMechanicValue,
  roundTo,
} from './math.ts';
import {
  sourceExpression,
  formReceptivity,
  mechanicFormReceptivity,
  capabilityAllows,
  sourceCapabilityAllows,
  projectOutboundSignature,
} from './sourceProjection.ts';

/**
 * 后向计算结果
 */
export type BackwardPassResult = {
  snapshots: SkillSnapshot[];
  contributions: ContributionTrace[];
  aggregates: AggregateTrace[];
};

/**
 * 计算后向传递。
 *
 * 所有后向计算读取同一组冻结的前向快照。
 * 对每个前位目标 (0..n-2)，收集所有后位来源 (target+1..n-1) 的贡献，
 * 按维度有符号聚合，饱和后应用到目标技能。
 *
 * 越靠后的来源权威度越高（由 BACKWARD_AUTHORITY_BY_SLOT 决定）。
 * 后向结果不触发递归。
 */
export function computeBackwardPass(forwardSnapshots: SkillSnapshot[]): BackwardPassResult {
  const n = forwardSnapshots.length;
  const contributions: ContributionTrace[] = [];
  const aggregates: AggregateTrace[] = [];
  let traceIdCounter = 0;
  const nextTraceId = () => `bwd_${++traceIdCounter}`;

  // 深拷贝前向快照作为起点（后向计算不修改传入的冻结快照）
  const snapshots: SkillSnapshot[] = forwardSnapshots.map((f) => ({
    ...f,
    stats: cloneStats(f.stats),
    mechanics: cloneMechanics(f.mechanics),
    accents: f.accents.map((a) => ({ ...a, sourceSlots: [...a.sourceSlots] })),
  }));

  // 遍历每个前位目标（slot n-1 无后向来源）
  for (let targetSlot = 0; targetSlot < n - 1; targetSlot++) {
    const target = snapshots[targetSlot];

    const statContribs = new Map<StatKey, number[]>();
    const mechContribs = new Map<MechanicKey, number[]>();

    // 对每个后位来源计算贡献（使用冻结的前向快照）
    for (let sourceSlot = targetSlot + 1; sourceSlot < n; sourceSlot++) {
      // 使用冻结快照中的来源数据
      const frozenSource = forwardSnapshots[sourceSlot];
      const sourceOutbound = projectOutboundSignature(frozenSource);
      const rule = getDirectedReaction(frozenSource.primaryElement, target.primaryElement);
      const pkg = rule.backward;
      const dist = backwardDistance(sourceSlot, targetSlot);
      const authority = BACKWARD_AUTHORITY_BY_SLOT[sourceSlot];

      // --- 参数贡献 ---
      for (const [keyStr, ruleDelta] of Object.entries(pkg.statDeltas)) {
        const key = keyStr as StatKey;
        if (Math.abs(ruleDelta) < 1e-9) continue;

        const srcExpr = sourceExpression(sourceOutbound, key);
        const targetRecept = formReceptivity(target.form, key);
        const rawDelta =
          ruleDelta *
          pkg.affinity *
          dist *
          authority *
          srcExpr *
          targetRecept *
          BACKWARD_PASS_GAIN;

        const acceptedDelta = rawDelta;
        const id = nextTraceId();

        if (!statContribs.has(key)) statContribs.set(key, []);
        statContribs.get(key)!.push(acceptedDelta);

        contributions.push(makeBackwardContribution(
          id, sourceSlot, targetSlot,
          frozenSource.seedId, target.seedId,
          frozenSource.primaryElement, target.primaryElement,
          `${rule.source}->${rule.target}`, rule.name,
          key, 'stat',
          ruleDelta, pkg.affinity, dist, authority,
          srcExpr, targetRecept,
          rawDelta, acceptedDelta, 'accepted', undefined,
        ));
      }

      // --- 机制贡献 ---
      for (const [keyStr, ruleDelta] of Object.entries(pkg.mechanicDeltas)) {
        const key = keyStr as MechanicKey;
        if (Math.abs(ruleDelta) < 1e-9) continue;

        const srcExpr = sourceExpression(sourceOutbound, key);
        const mechRecept = mechanicFormReceptivity();
        const rawDelta =
          ruleDelta *
          pkg.affinity *
          dist *
          authority *
          srcExpr *
          mechRecept *
          BACKWARD_PASS_GAIN;

        const capOk = capabilityAllows(target.primaryElement, key, rawDelta) &&
          sourceCapabilityAllows(frozenSource.primaryElement, target.primaryElement, key, rawDelta);
        const acceptedDelta = capOk ? rawDelta : 0;
        const status: 'accepted' | 'rejected' = capOk ? 'accepted' : 'rejected';
        const rejectionReason = capOk ? undefined : 'element_capability_forbidden';

        const id = nextTraceId();

        if (!mechContribs.has(key)) mechContribs.set(key, []);
        mechContribs.get(key)!.push(acceptedDelta);

        contributions.push(makeBackwardContribution(
          id, sourceSlot, targetSlot,
          frozenSource.seedId, target.seedId,
          frozenSource.primaryElement, target.primaryElement,
          `${rule.source}->${rule.target}`, rule.name,
          key, 'mechanic',
          ruleDelta, pkg.affinity, dist, authority,
          srcExpr, mechRecept,
          rawDelta, acceptedDelta, status, rejectionReason,
        ));
      }

      // --- Accent 贡献 ---
      if (pkg.accentStrength > 0) {
        const passMultiplier = authority; // backward: authority 作为 pass 乘数
        const rawAccent =
          pkg.accentStrength *
          pkg.affinity *
          dist *
          passMultiplier;

        if (rawAccent > 1e-9) {
          const id = nextTraceId();
          contributions.push({
            id,
            pass: 'backward',
            sourceSlot,
            targetSlot,
            sourceSeedId: frozenSource.seedId,
            targetSeedId: target.seedId,
            sourceElement: frozenSource.primaryElement,
            targetElement: target.primaryElement,
            reactionKey: `${rule.source}->${rule.target}`,
            reactionName: rule.name,
            key: 'accent',
            kind: 'accent',
            ruleDelta: pkg.accentStrength,
            affinity: pkg.affinity,
            distanceFactor: dist,
            authorityFactor: authority,
            sourceExpression: 1,
            targetReceptivity: 1,
            rawDelta: rawAccent,
            acceptedDelta: rawAccent,
            status: 'accepted',
            explanation: `${rule.name}: ${frozenSource.primaryElement}→${target.primaryElement} 后向混合表现`,
          });

          const existingAccent = target.accents.find(
            (a) => a.element === frozenSource.primaryElement && a.pass === 'backward',
          );
          if (existingAccent) {
            existingAccent.strength += rawAccent;
            if (!existingAccent.sourceSlots.includes(sourceSlot)) {
              existingAccent.sourceSlots.push(sourceSlot);
            }
          } else {
            target.accents.push({
              element: frozenSource.primaryElement,
              strength: rawAccent,
              pass: 'backward',
              sourceSlots: [sourceSlot],
              visualCue: pkg.visualCue,
            });
          }
        }
      }
    }

    // --- 聚合参数贡献 ---
    for (const [key, deltas] of statContribs) {
      const sum = deltas.reduce((a, b) => a + b, 0);
      const saturatedDelta = saturate(sum, CAPS.backwardStat);
      const valueBefore = target.stats[key];
      const valueAfter = clamp(valueBefore + saturatedDelta, CAPS.finalStatMin, CAPS.finalStatMax);

      const contribIds = contributions
        .filter((c) => c.targetSlot === targetSlot && c.key === key && c.kind === 'stat' && c.pass === 'backward')
        .map((c) => c.id);

      aggregates.push({
        id: `bwd_agg_${targetSlot}_${key}`,
        pass: 'backward',
        targetSlot,
        key,
        contributionIds: contribIds,
        signedSum: roundTo(sum, 6),
        cap: CAPS.backwardStat,
        saturatedDelta: roundTo(saturatedDelta, 6),
        valueBefore: roundTo(valueBefore, 6),
        valueAfter: roundTo(valueAfter, 6),
      });

      target.stats[key] = valueAfter;
    }

    // --- 聚合机制贡献 ---
    for (const [key, deltas] of mechContribs) {
      const sum = deltas.reduce((a, b) => a + b, 0);
      const saturatedDelta = saturate(sum, CAPS.backwardMechanic);
      const valueBefore = getMechanicValue(target.mechanics, key);
      const valueAfter = clamp(valueBefore + saturatedDelta, CAPS.finalMechanicMin, CAPS.finalMechanicMax);

      const contribIds = contributions
        .filter((c) => c.targetSlot === targetSlot && c.key === key && c.kind === 'mechanic' && c.pass === 'backward')
        .map((c) => c.id);

      aggregates.push({
        id: `bwd_agg_${targetSlot}_${key}`,
        pass: 'backward',
        targetSlot,
        key,
        contributionIds: contribIds,
        signedSum: roundTo(sum, 6),
        cap: CAPS.backwardMechanic,
        saturatedDelta: roundTo(saturatedDelta, 6),
        valueBefore: roundTo(valueBefore, 6),
        valueAfter: roundTo(valueAfter, 6),
      });

      setMechanicValue(target.mechanics, key, valueAfter);
    }

    // --- 饱和 backward accents ---
    for (const accent of target.accents) {
      if (accent.pass === 'backward') {
        accent.strength = saturate(accent.strength, CAPS.accentBackward);
      }
    }
  }

  return { snapshots, contributions, aggregates };
}

/**
 * 构造后向 ContributionTrace
 */
function makeBackwardContribution(
  id: string,
  sourceSlot: number,
  targetSlot: number,
  sourceSeedId: string,
  targetSeedId: string,
  sourceElement: ElementKey,
  targetElement: ElementKey,
  reactionKey: string,
  reactionName: string,
  key: StatKey | MechanicKey,
  kind: 'stat' | 'mechanic',
  ruleDelta: number,
  affinity: number,
  distanceFactor: number,
  authorityFactor: number,
  sourceExpression_: number,
  targetReceptivity: number,
  rawDelta: number,
  acceptedDelta: number,
  status: 'accepted' | 'rejected',
  rejectionReason: string | undefined,
): ContributionTrace {
  const direction = acceptedDelta > 0 ? '增加' : acceptedDelta < 0 ? '减少' : '无变化';
  const statusText = status === 'rejected' ? '（被能力边界拒绝）' : '';

  const explanation =
    `${reactionName}（${sourceElement}→${targetElement}，后向）：` +
    `${kind === 'stat' ? '参数' : '机制'} ${key} ${direction} ${Math.abs(roundTo(acceptedDelta, 4))}${statusText}`;

  return {
    id,
    pass: 'backward',
    sourceSlot,
    targetSlot,
    sourceSeedId,
    targetSeedId,
    sourceElement,
    targetElement,
    reactionKey,
    reactionName,
    key,
    kind,
    ruleDelta: roundTo(ruleDelta, 4),
    affinity: roundTo(affinity, 4),
    distanceFactor: roundTo(distanceFactor, 4),
    authorityFactor: roundTo(authorityFactor, 4),
    sourceExpression: roundTo(sourceExpression_, 4),
    targetReceptivity: roundTo(targetReceptivity, 4),
    rawDelta: roundTo(rawDelta, 6),
    acceptedDelta: roundTo(acceptedDelta, 6),
    status,
    rejectionReason,
    explanation,
  };
}
