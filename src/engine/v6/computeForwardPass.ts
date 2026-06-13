// ============================================================
// V6 前向计算 — 左→右，前位技能改变后位技能
// 依据: docs/v6/engine-spec.md §6
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
  FORWARD_PASS_GAIN,
  CAPS,
} from '../../data/v6/capabilityRules.ts';
import {
  forwardDistance,
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
 * 前向计算结果
 */
export type ForwardPassResult = {
  snapshots: SkillSnapshot[];
  contributions: ContributionTrace[];
  aggregates: AggregateTrace[];
};

/**
 * 计算前向传递。
 *
 * 对每个目标槽位 (1..n-1)，收集所有前位来源的贡献，
 * 按维度有符号聚合，饱和后应用到目标技能。
 *
 * 使用已解析的前向快照作为来源（保留构筑链），
 * 但反应规则只使用来源的 primaryElement。
 */
export function computeForwardPass(baseSnapshots: SkillSnapshot[]): ForwardPassResult {
  const n = baseSnapshots.length;
  const contributions: ContributionTrace[] = [];
  const aggregates: AggregateTrace[] = [];
  let traceIdCounter = 0;
  const nextTraceId = () => `fwd_${++traceIdCounter}`;

  // 深拷贝基础快照作为起点
  const snapshots: SkillSnapshot[] = baseSnapshots.map((b) => ({
    ...b,
    stats: cloneStats(b.stats),
    mechanics: cloneMechanics(b.mechanics),
    accents: [...b.accents],
  }));

  // slot 0 无前向来源，从 slot 1 开始
  for (let targetSlot = 1; targetSlot < n; targetSlot++) {
    const target = snapshots[targetSlot];

    // 收集该目标的所有前向贡献（按 key 分组）
    const statContribs = new Map<StatKey, number[]>();
    const mechContribs = new Map<MechanicKey, number[]>();
    // 记录每个贡献的 trace 信息
    const contribRecords: Array<{
      id: string;
      key: StatKey | MechanicKey;
      kind: 'stat' | 'mechanic';
      sourceSlot: number;
      sourceElement: ElementKey;
      ruleDelta: number;
      affinity: number;
      distanceFactor: number;
      sourceExpr: number;
      targetRecept: number;
      rawDelta: number;
      acceptedDelta: number;
      status: 'accepted' | 'rejected';
      rejectionReason?: string;
      reactionName: string;
      reactionKey: string;
    }> = [];

    // 对每个前位来源计算贡献
    for (let sourceSlot = 0; sourceSlot < targetSlot; sourceSlot++) {
      const source = snapshots[sourceSlot];
      const sourceOutbound = projectOutboundSignature(source);
      const rule = getDirectedReaction(source.primaryElement, target.primaryElement);
      const pkg = rule.forward;
      const dist = forwardDistance(sourceSlot, targetSlot);

      // --- 参数贡献 ---
      for (const [keyStr, ruleDelta] of Object.entries(pkg.statDeltas)) {
        const key = keyStr as StatKey;
        // 规则 delta 为 0 时跳过
        if (Math.abs(ruleDelta) < 1e-9) continue;

        const srcExpr = sourceExpression(sourceOutbound, key);
        const targetRecept = formReceptivity(target.form, key);
        const rawDelta =
          ruleDelta *
          pkg.affinity *
          dist *
          srcExpr *
          targetRecept *
          FORWARD_PASS_GAIN;

        // 参数无能力边界限制（能力边界只约束机制）
        const acceptedDelta = rawDelta;
        const status: 'accepted' | 'rejected' = 'accepted';

        const id = nextTraceId();
        contribRecords.push({
          id,
          key,
          kind: 'stat',
          sourceSlot,
          sourceElement: source.primaryElement,
          ruleDelta,
          affinity: pkg.affinity,
          distanceFactor: dist,
          sourceExpr: srcExpr,
          targetRecept,
          rawDelta,
          acceptedDelta,
          status,
          reactionName: rule.name,
          reactionKey: `${rule.source}->${rule.target}`,
        });

        // 收集到聚合组
        if (!statContribs.has(key)) statContribs.set(key, []);
        statContribs.get(key)!.push(acceptedDelta);

        // 生成 ContributionTrace
        contributions.push(makeContributionTrace(
          id, 'forward', sourceSlot, targetSlot,
          source.seedId, target.seedId,
          source.primaryElement, target.primaryElement,
          `${rule.source}->${rule.target}`, rule.name,
          key, 'stat',
          ruleDelta, pkg.affinity, dist, 1, // authorityFactor=1 for forward
          srcExpr, targetRecept,
          rawDelta, acceptedDelta, status, undefined,
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
          srcExpr *
          mechRecept *
          FORWARD_PASS_GAIN;

        // 能力边界检查
        const capOk = capabilityAllows(target.primaryElement, key, rawDelta) &&
          sourceCapabilityAllows(source.primaryElement, target.primaryElement, key, rawDelta);
        const acceptedDelta = capOk ? rawDelta : 0;
        const status: 'accepted' | 'rejected' = capOk ? 'accepted' : 'rejected';
        const rejectionReason = capOk ? undefined : 'element_capability_forbidden';

        const id = nextTraceId();
        contribRecords.push({
          id,
          key,
          kind: 'mechanic',
          sourceSlot,
          sourceElement: source.primaryElement,
          ruleDelta,
          affinity: pkg.affinity,
          distanceFactor: dist,
          sourceExpr: srcExpr,
          targetRecept: mechRecept,
          rawDelta,
          acceptedDelta,
          status,
          rejectionReason,
          reactionName: rule.name,
          reactionKey: `${rule.source}->${rule.target}`,
        });

        if (!mechContribs.has(key)) mechContribs.set(key, []);
        mechContribs.get(key)!.push(acceptedDelta);

        contributions.push(makeContributionTrace(
          id, 'forward', sourceSlot, targetSlot,
          source.seedId, target.seedId,
          source.primaryElement, target.primaryElement,
          `${rule.source}->${rule.target}`, rule.name,
          key, 'mechanic',
          ruleDelta, pkg.affinity, dist, 1,
          srcExpr, mechRecept,
          rawDelta, acceptedDelta, status, rejectionReason,
        ));
      }

      // --- Accent 贡献 ---
      if (pkg.accentStrength > 0) {
        const rawAccent =
          pkg.accentStrength *
          pkg.affinity *
          dist *
          1; // forward passMultiplier = 1

        if (rawAccent > 1e-9) {
          const id = nextTraceId();
          contributions.push({
            id,
            pass: 'forward',
            sourceSlot,
            targetSlot,
            sourceSeedId: source.seedId,
            targetSeedId: target.seedId,
            sourceElement: source.primaryElement,
            targetElement: target.primaryElement,
            reactionKey: `${rule.source}->${rule.target}`,
            reactionName: rule.name,
            key: 'accent',
            kind: 'accent',
            ruleDelta: pkg.accentStrength,
            affinity: pkg.affinity,
            distanceFactor: dist,
            authorityFactor: 1,
            sourceExpression: 1,
            targetReceptivity: 1,
            rawDelta: rawAccent,
            acceptedDelta: rawAccent,
            status: 'accepted',
            explanation: `${rule.name}: ${rule.source}→${rule.target} 混合表现`,
          });

          // 添加 element accent 到目标
          const existingAccent = target.accents.find(
            (a) => a.element === source.primaryElement && a.pass === 'forward',
          );
          if (existingAccent) {
            existingAccent.strength += rawAccent;
            if (!existingAccent.sourceSlots.includes(sourceSlot)) {
              existingAccent.sourceSlots.push(sourceSlot);
            }
          } else {
            target.accents.push({
              element: source.primaryElement,
              strength: rawAccent,
              pass: 'forward',
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
      const saturatedDelta = saturate(sum, CAPS.forwardStat);
      const valueBefore = target.stats[key];
      const valueAfter = clamp(valueBefore + saturatedDelta, CAPS.finalStatMin, CAPS.finalStatMax);

      // 收集相关 contribution IDs
      const contribIds = contribRecords
        .filter((r) => r.key === key && r.kind === 'stat')
        .map((r) => r.id);

      const aggId = `fwd_agg_${targetSlot}_${key}`;
      aggregates.push({
        id: aggId,
        pass: 'forward',
        targetSlot,
        key,
        contributionIds: contribIds,
        signedSum: roundTo(sum, 6),
        cap: CAPS.forwardStat,
        saturatedDelta: roundTo(saturatedDelta, 6),
        valueBefore: roundTo(valueBefore, 6),
        valueAfter: roundTo(valueAfter, 6),
      });

      target.stats[key] = valueAfter;
    }

    // --- 聚合机制贡献 ---
    for (const [key, deltas] of mechContribs) {
      const sum = deltas.reduce((a, b) => a + b, 0);
      const saturatedDelta = saturate(sum, CAPS.forwardMechanic);
      const valueBefore = getMechanicValue(target.mechanics, key);
      const valueAfter = clamp(valueBefore + saturatedDelta, CAPS.finalMechanicMin, CAPS.finalMechanicMax);

      const contribIds = contribRecords
        .filter((r) => r.key === key && r.kind === 'mechanic')
        .map((r) => r.id);

      const aggId = `fwd_agg_${targetSlot}_${key}`;
      aggregates.push({
        id: aggId,
        pass: 'forward',
        targetSlot,
        key,
        contributionIds: contribIds,
        signedSum: roundTo(sum, 6),
        cap: CAPS.forwardMechanic,
        saturatedDelta: roundTo(saturatedDelta, 6),
        valueBefore: roundTo(valueBefore, 6),
        valueAfter: roundTo(valueAfter, 6),
      });

      setMechanicValue(target.mechanics, key, valueAfter);
    }

    // --- 饱和 forward accents ---
    // 同一目标、同一来源元素、同一 pass 的 accent 先求和再饱和
    for (const accent of target.accents) {
      if (accent.pass === 'forward') {
        accent.strength = saturate(accent.strength, CAPS.accentForward);
      }
    }
  }

  return { snapshots, contributions, aggregates };
}

/**
 * 构造 ContributionTrace 条目
 */
function makeContributionTrace(
  id: string,
  pass: 'forward',
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
    `${reactionName}（${sourceElement}→${targetElement}）：` +
    `${kind === 'stat' ? '参数' : '机制'} ${key} ${direction} ${Math.abs(roundTo(acceptedDelta, 4))}${statusText}`;

  return {
    id,
    pass,
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
