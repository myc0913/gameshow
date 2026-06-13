// ============================================================
// V6 技能结果解码 — 命名、标签、描述、变化摘要
// 依据: docs/v6/presentation-and-migration.md §3-§5, docs/v6/engine-spec.md §11-§12
// ============================================================

import type {
  SkillSnapshot,
  GeneratedSkill,
  ChangeSummary,
  ContributionTrace,
  StatKey,
  MechanicKey,
  ElementKey,
  NormalizedStats,
  MechanicState,
} from '../../types/v6.ts';
import { STAT_KEYS, MECHANIC_KEYS } from '../../types/v6.ts';
import { getBaseSkill } from '../../data/v6/baseSkills.ts';
import { getDirectedReaction } from '../../data/v6/reactionRules.ts';
import { CUE_PREFIX_MAP, BACKWARD_SUFFIX_MAP } from '../../data/v6/namingLexicon.ts';
import { getMechanicValue, roundTo } from './math.ts';

// ---- 形态标签中文名 ----

export const FORM_LABELS: Record<string, string> = {
  projectile: '投射',
  cone: '锥形',
  zone: '领域',
  chain: '连锁',
  movement: '位移',
  construct: '构造',
  mark: '印记',
  summon: '召唤',
  line: '直线',
};

export const ELEMENT_LABELS_V6: Record<ElementKey, string> = {
  fire: '火',
  frost: '冰',
  lightning: '雷',
  stone: '岩',
  shadow: '影',
  wind: '风',
};

export const STAT_LABELS: Record<StatKey, string> = {
  power: '威力',
  reach: '射程',
  area: '范围',
  duration: '持续',
  speed: '速度',
  control: '控制',
  force: '冲击',
  propagation: '传播',
  penetration: '穿透',
  protection: '防护',
};

export const MECHANIC_LABELS: Record<MechanicKey, string> = {
  burn: '燃烧',
  chill: '寒意',
  freeze: '冻结',
  shock: '感电',
  stun: '震晕',
  knockback: '击退',
  pull: '拉拽',
  pierce: '穿透',
  guard: '防护',
  mark: '标记',
  delayedBurst: '延迟爆发',
  chain: '连锁',
  fracture: '破裂',
  bind: '束缚',
  obscure: '遮蔽',
  echo: '回响',
  haste: '加速',
};

/** 获取任意 key 的中文标签 */
function getKeyLabel(key: string): string {
  return STAT_LABELS[key as StatKey] ?? MECHANIC_LABELS[key as MechanicKey] ?? key;
}

// ---- 贡献显著度 ----

/**
 * 计算单个贡献的显著度（用于排序和展示，不参与计算）。
 * salience = sum(|statDeltas|) + 0.75 * sum(|mechDeltas|) + 0.50 * accentStrength
 */
export function contributionSalience(c: ContributionTrace): number {
  if (c.kind === 'accent') {
    return 0.50 * Math.abs(c.acceptedDelta);
  }
  if (c.kind === 'stat') {
    return Math.abs(c.acceptedDelta);
  }
  return 0.75 * Math.abs(c.acceptedDelta);
}

/**
 * 找出对某个目标槽位贡献显著度最高的前向贡献
 */
export function findDominantForward(
  contributions: ContributionTrace[],
  targetSlot: number,
): ContributionTrace | undefined {
  const candidates = contributions.filter(
    (c) => c.pass === 'forward' && c.targetSlot === targetSlot && c.acceptedDelta !== 0,
  );
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, c) =>
    contributionSalience(c) > contributionSalience(best) ? c : best,
  );
}

/**
 * 找出对某个目标槽位贡献显著度最高的后向贡献
 */
export function findDominantBackward(
  contributions: ContributionTrace[],
  targetSlot: number,
): ContributionTrace | undefined {
  const candidates = contributions.filter(
    (c) => c.pass === 'backward' && c.targetSlot === targetSlot && c.acceptedDelta !== 0,
  );
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, c) =>
    contributionSalience(c) > contributionSalience(best) ? c : best,
  );
}

// ---- 命名 ----

/**
 * 生成技能名称。
 *
 * 格式：
 * - 有前向、无后向：{反应前缀}{基础名}
 * - 无前向、有后向：{基础名}·{后位余韵}
 * - 两者都有：{反应前缀}{基础名}·{后位余韵}
 * - 都没有：{基础名}
 *
 * 名称最多 10 个汉字。
 */
export function generateSkillName(
  baseName: string,
  contributions: ContributionTrace[],
  targetSlot: number,
): string {
  const domFwd = findDominantForward(contributions, targetSlot);
  const domBwd = findDominantBackward(contributions, targetSlot);

  const fwdPrefix = domFwd
    ? getForwardPrefix(domFwd)
    : '';

  const bwdSuffix = domBwd
    ? BACKWARD_SUFFIX_MAP[domBwd.sourceElement] ?? ''
    : '';

  let name: string;
  if (fwdPrefix && bwdSuffix) {
    name = `${fwdPrefix}${baseName}·${bwdSuffix}`;
  } else if (fwdPrefix) {
    name = `${fwdPrefix}${baseName}`;
  } else if (bwdSuffix) {
    name = `${baseName}·${bwdSuffix}`;
  } else {
    name = baseName;
  }

  // 截断到 10 个汉字
  if (name.length > 10) {
    name = name.slice(0, 10);
  }

  return name;
}

/**
 * 从前向贡献获取反应前缀
 */
function getForwardPrefix(c: ContributionTrace): string {
  const ruleKey = c.reactionKey; // e.g., "fire->frost"
  try {
    const [src, tgt] = ruleKey.split('->');
    const reaction = getDirectedReaction(src as ElementKey, tgt as ElementKey);
    const cue = reaction.forward.visualCue;
    return CUE_PREFIX_MAP[cue] ?? '';
  } catch {
    return '';
  }
}

// ---- 标签生成 ----

/**
 * 从最终技能结果生成标签列表。
 * 最多 6 个主标签。
 */
export function generateTags(
  element: ElementKey,
  form: string,
  finalMechanics: MechanicState,
  baseMechanics: MechanicState,
  dominantFwd?: ContributionTrace,
): string[] {
  const tags: string[] = [];

  // 1. 固定主元素标签
  tags.push(ELEMENT_LABELS_V6[element]);

  // 2. 固定形态标签
  const formLabel = FORM_LABELS[form];
  if (formLabel) tags.push(formLabel);

  // 3. 显著度最高的反应名称标签
  if (dominantFwd) {
    tags.push(dominantFwd.reactionName);
  }

  // 4. 最终强度最高的机制标签
  const sortedMechs = MECHANIC_KEYS
    .map((k) => ({ key: k, value: getMechanicValue(finalMechanics, k) }))
    .filter((m) => m.value >= 0.15)
    .sort((a, b) => b.value - a.value);

  if (sortedMechs.length > 0) {
    const label = MECHANIC_LABELS[sortedMechs[0].key];
    if (label && !tags.includes(label)) {
      tags.push(label);
    }
  }

  // 5. 选择 1 个 ≥0.15 且相对基础变化最明显的新增/受影响机制
  const changedMechs = MECHANIC_KEYS
    .map((k) => ({
      key: k,
      final: getMechanicValue(finalMechanics, k),
      base: getMechanicValue(baseMechanics, k),
      delta: getMechanicValue(finalMechanics, k) - getMechanicValue(baseMechanics, k),
    }))
    .filter((m) => m.final >= 0.15 && Math.abs(m.delta) >= 0.02)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  if (changedMechs.length > 0) {
    const label = MECHANIC_LABELS[changedMechs[0].key];
    if (label && !tags.includes(label)) {
      tags.push(label);
    }
  }

  // 6. 如果原生机制相对基础值下降 ≥0.12，增加"弱化：{机制}"（取下降最大的）
  let worstWeakened: { key: MechanicKey; loss: number } | null = null;
  for (const k of MECHANIC_KEYS) {
    const baseVal = getMechanicValue(baseMechanics, k);
    const finalVal = getMechanicValue(finalMechanics, k);
    const loss = baseVal - finalVal;
    if (baseVal >= 0.30 && loss >= 0.12) {
      if (!worstWeakened || loss > worstWeakened.loss) {
        worstWeakened = { key: k, loss };
      }
    }
  }
  if (worstWeakened) {
    const label = `弱化:${MECHANIC_LABELS[worstWeakened.key]}`;
    if (!tags.includes(label)) {
      tags.push(label);
    }
  }

  // 去重并限制数量
  const unique = [...new Set(tags)];
  return unique.slice(0, 6);
}

// ---- 描述生成 ----

/**
 * 生成技能描述。
 *
 * {coreEffect}。
 * {dominantForwardSentence}
 * {backwardJointSentence}
 *
 * 规则：
 * - 没有对应 Trace 时不输出该句。
 * - 正负变化同时存在时必须同时说明。
 * - 后向有多个有效来源时使用"共同"或分别列出。
 * - 文案只取主要变化，完整细节交给 How。
 */
export function generateDescription(
  coreEffect: string,
  contributions: ContributionTrace[],
  targetSlot: number,
): string {
  const parts: string[] = [coreEffect + '。'];

  // 前向主反应描述
  const fwdSentence = buildForwardSentence(contributions, targetSlot);
  if (fwdSentence) parts.push(fwdSentence);

  // 后向联合修饰描述
  const bwdSentence = buildBackwardSentence(contributions, targetSlot);
  if (bwdSentence) parts.push(bwdSentence);

  return parts.join('');
}

/**
 * 构建前向影响句子：描述最显著的前向来源对目标的核心改变。
 * 取显著度最高的前向贡献，提取其同来源的所有有效变化，
 * 按 key 聚合净贡献以避免同一词同时出现在增益和减弱中。
 */
function buildForwardSentence(
  contributions: ContributionTrace[],
  targetSlot: number,
): string | null {
  const domFwd = findDominantForward(contributions, targetSlot);
  if (!domFwd) return null;

  // 收集来自同一 sourceSlot 的所有前向有效贡献
  const sameSource = contributions.filter(
    (c) =>
      c.pass === 'forward' &&
      c.targetSlot === targetSlot &&
      c.sourceSlot === domFwd.sourceSlot &&
      c.acceptedDelta !== 0 &&
      c.kind !== 'accent',
  );

  if (sameSource.length === 0) {
    // 只有 accent 变化时，用反应名来描述
    return `前位${ELEMENT_LABELS_V6[domFwd.sourceElement]}技能赋予${domFwd.reactionName}效果。`;
  }

  // 按 key 聚合净贡献
  const netByKey = new Map<string, number>();
  for (const c of sameSource) {
    const prev = netByKey.get(c.key) ?? 0;
    netByKey.set(c.key, prev + c.acceptedDelta);
  }

  const gainKeys: string[] = [];
  const lossKeys: string[] = [];
  for (const [key, net] of netByKey) {
    if (net > 0.005) gainKeys.push(key);
    else if (net < -0.005) lossKeys.push(key);
  }

  if (gainKeys.length === 0 && lossKeys.length === 0) {
    return `前位${ELEMENT_LABELS_V6[domFwd.sourceElement]}技能赋予${domFwd.reactionName}效果。`;
  }

  let sentence = `前位${ELEMENT_LABELS_V6[domFwd.sourceElement]}技能使其`;

  if (gainKeys.length > 0) {
    const gainLabels = gainKeys
      .sort((a, b) => (netByKey.get(b) ?? 0) - (netByKey.get(a) ?? 0))
      .slice(0, 3)
      .map(getKeyLabel);
    sentence += gainLabels.join('、') + '增强';
  }
  if (gainKeys.length > 0 && lossKeys.length > 0) {
    sentence += '，但';
  }
  if (lossKeys.length > 0) {
    const lossLabels = lossKeys
      .sort((a, b) => (netByKey.get(a) ?? 0) - (netByKey.get(b) ?? 0))
      .slice(0, 3)
      .map(getKeyLabel);
    sentence += lossLabels.join('、') + '减弱';
  }
  sentence += '。';
  return sentence;
}

/**
 * 构建后向联合修饰句子。
 * 按来源元素分组，描述最显著的变化方向。
 * 对同一 key 先计算净贡献，避免同一词同时出现在增益和减弱中。
 */
function buildBackwardSentence(
  contributions: ContributionTrace[],
  targetSlot: number,
): string | null {
  const bwdContribs = contributions.filter(
    (c) => c.pass === 'backward' && c.targetSlot === targetSlot && c.acceptedDelta !== 0 && c.kind !== 'accent',
  );

  if (bwdContribs.length === 0) return null;

  // 按来源元素分组
  const byElement = new Map<ElementKey, ContributionTrace[]>();
  for (const c of bwdContribs) {
    const list = byElement.get(c.sourceElement) || [];
    list.push(c);
    byElement.set(c.sourceElement, list);
  }

  const sourceElements = [...byElement.keys()];
  const sourceNames = sourceElements.map((e) => ELEMENT_LABELS_V6[e]).join('与');

  // 按 key 聚合净贡献，避免同一 key 同时出现在增益和减弱中
  const netByKey = new Map<string, number>();
  for (const c of bwdContribs) {
    const prev = netByKey.get(c.key) ?? 0;
    netByKey.set(c.key, prev + c.acceptedDelta);
  }

  const gainKeys: string[] = [];
  const lossKeys: string[] = [];
  for (const [key, net] of netByKey) {
    if (net > 0.005) gainKeys.push(key);
    else if (net < -0.005) lossKeys.push(key);
  }

  const parts: string[] = [];
  if (gainKeys.length > 0) {
    const topGains = gainKeys
      .sort((a, b) => (netByKey.get(b) ?? 0) - (netByKey.get(a) ?? 0))
      .slice(0, 3)
      .map(getKeyLabel);
    parts.push(topGains.join('、') + '小幅提升');
  }
  if (lossKeys.length > 0) {
    const topLosses = lossKeys
      .sort((a, b) => (netByKey.get(a) ?? 0) - (netByKey.get(b) ?? 0))
      .slice(0, 3)
      .map(getKeyLabel);
    parts.push(topLosses.join('、') + '轻微降低');
  }

  if (parts.length === 0) return null;
  return `后位${sourceNames}共同修饰：${parts.join('；')}。`;
}

// ---- 变化摘要 ----

/**
 * 构建 ChangeSummary[] — 对比 base / forward / final 三层值。
 * 只有当值真正发生变化时才包含。
 */
export function buildChangeSummaries(
  baseStats: NormalizedStats,
  forwardStats: NormalizedStats,
  finalStats: NormalizedStats,
  baseMechanics: MechanicState,
  finalMechanics: MechanicState,
  contributions: ContributionTrace[],
  targetSlot: number,
): ChangeSummary[] {
  const changes: ChangeSummary[] = [];

  // 参数变化
  for (const key of STAT_KEYS) {
    const baseVal = baseStats[key];
    const fwdVal = forwardStats[key];
    const finalVal = finalStats[key];
    const delta = finalVal - baseVal;
    if (Math.abs(delta) < 0.005) continue; // 忽略微小变化

    const sources = getChangeSources(contributions, targetSlot, key);
    const direction = getDirection(contributions, targetSlot, key);

    changes.push({
      key,
      kind: 'stat',
      baseValue: roundTo(baseVal, 4),
      forwardValue: roundTo(fwdVal, 4),
      finalValue: roundTo(finalVal, 4),
      delta: roundTo(delta, 4),
      sources,
      direction,
    });
  }

  // 机制变化
  for (const key of MECHANIC_KEYS) {
    const baseVal = getMechanicValue(baseMechanics, key);
    const finalVal = getMechanicValue(finalMechanics, key);
    const delta = finalVal - baseVal;
    if (Math.abs(delta) < 0.005) continue;

    const sources = getChangeSources(contributions, targetSlot, key);

    // 判断 direction: 需要看所有贡献是否同向
    const relevantContribs = contributions.filter(
      (c) => c.targetSlot === targetSlot && c.key === key && c.kind === 'mechanic',
    );
    const hasPos = relevantContribs.some((c) => c.acceptedDelta > 0.005);
    const hasNeg = relevantContribs.some((c) => c.acceptedDelta < -0.005);
    const direction = hasPos && hasNeg ? 'mixed' : delta > 0 ? 'increase' : 'decrease';

    changes.push({
      key,
      kind: 'mechanic',
      baseValue: roundTo(baseVal, 4),
      forwardValue: roundTo(baseVal, 4), // 机制目前不追踪中间值
      finalValue: roundTo(finalVal, 4),
      delta: roundTo(delta, 4),
      sources,
      direction,
    });
  }

  return changes;
}

function getChangeSources(
  contributions: ContributionTrace[],
  targetSlot: number,
  key: StatKey | MechanicKey,
): Array<{ slot: number; pass: 'forward' | 'backward' }> {
  const seen = new Set<string>();
  const sources: Array<{ slot: number; pass: 'forward' | 'backward' }> = [];
  for (const c of contributions) {
    if (c.targetSlot === targetSlot && c.key === key && Math.abs(c.acceptedDelta) > 1e-9) {
      const tag = `${c.sourceSlot}:${c.pass}`;
      if (!seen.has(tag)) {
        seen.add(tag);
        sources.push({ slot: c.sourceSlot, pass: c.pass });
      }
    }
  }
  return sources;
}

function getDirection(
  contributions: ContributionTrace[],
  targetSlot: number,
  key: StatKey | MechanicKey,
): 'increase' | 'decrease' | 'mixed' {
  const relevant = contributions.filter(
    (c) => c.targetSlot === targetSlot && c.key === key && Math.abs(c.acceptedDelta) > 0.005,
  );
  const hasPos = relevant.some((c) => c.acceptedDelta > 0);
  const hasNeg = relevant.some((c) => c.acceptedDelta < 0);
  if (hasPos && hasNeg) return 'mixed';
  if (hasPos) return 'increase';
  return 'decrease';
}

// ---- 主入口 ----

/**
 * 将最终技能快照解码为完整的 GeneratedSkill。
 */
export function finalizeGeneratedSkill(
  snapshot: SkillSnapshot,
  baseSnapshot: SkillSnapshot,
  forwardSnapshot: SkillSnapshot,
  contributions: ContributionTrace[],
  targetSlot: number,
): GeneratedSkill {
  const baseDef = getBaseSkill(snapshot.seedId);

  const name = generateSkillName(
    baseDef.name,
    contributions,
    targetSlot,
  );

  const domFwd = findDominantForward(contributions, targetSlot);

  const tags = generateTags(
    snapshot.primaryElement,
    snapshot.form,
    snapshot.mechanics,
    baseSnapshot.mechanics,
    domFwd,
  );

  const description = generateDescription(
    snapshot.coreEffect,
    contributions,
    targetSlot,
  );

  const changes = buildChangeSummaries(
    baseSnapshot.stats,
    forwardSnapshot.stats,
    snapshot.stats,
    baseSnapshot.mechanics,
    snapshot.mechanics,
    contributions,
    targetSlot,
  );

  // 占位 animation spec（由 decodeAnimationSpec 填充）
  const animation = {
    form: snapshot.form,
    primaryElement: snapshot.primaryElement,
    primaryPalette: [],
    trajectory: (baseDef.visualProfile.trajectory ?? 'none') as 'none',
    timing: { windupSeconds: 0, travelSeconds: 0, lingerSeconds: 0, pulseIntervalSeconds: 0 },
    geometry: { reach: 0, radius: 0, width: 0, count: 0, impactScale: 0, displacement: 0 },
    mechanics: {} as MechanicState,
  };

  return {
    slot: targetSlot,
    seedId: snapshot.seedId,
    baseName: baseDef.name,
    generatedName: name,
    primaryElement: snapshot.primaryElement,
    aspect: snapshot.aspect,
    form: snapshot.form,
    coreEffect: snapshot.coreEffect,
    description,
    baseStats: baseSnapshot.stats,
    forwardStats: forwardSnapshot.stats,
    finalStats: snapshot.stats,
    baseMechanics: baseSnapshot.mechanics,
    forwardMechanics: forwardSnapshot.mechanics,
    finalMechanics: snapshot.mechanics,
    accents: snapshot.accents,
    changes,
    tags,
    animation,
  };
}
