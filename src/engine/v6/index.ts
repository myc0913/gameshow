// ============================================================
// V6 Engine — barrel export
// V6-0: 校验函数
// V6-1: 完整规则引擎管线
// ============================================================

// V6-0
export { validateDirectedReactionRules, validateBaseSkills } from './validation.ts';

// V6-1: 数学工具
export {
  saturate,
  lerp,
  clamp,
  roundTo,
  forwardDistance,
  backwardDistance,
  zeroStats,
  zeroMechanics,
  cloneStats,
  cloneMechanics,
  getMechanicValue,
  setMechanicValue,
} from './math.ts';

// V6-1: 来源投影
export {
  statDriver,
  mechanicDriver,
  sourceExpression,
  formReceptivity,
  mechanicFormReceptivity,
  projectOutboundSignature,
  capabilityAllows,
  sourceCapabilityAllows,
} from './sourceProjection.ts';

// V6-1: 前向计算
export {
  computeForwardPass,
  resetForwardTraceIds,
} from './computeForwardPass.ts';
export type { ForwardPassResult } from './computeForwardPass.ts';

// V6-1: 后向计算
export {
  computeBackwardPass,
  resetBackwardTraceIds,
} from './computeBackwardPass.ts';
export type { BackwardPassResult } from './computeBackwardPass.ts';

// V6-1: 技能最终化
export {
  finalizeGeneratedSkill,
  generateSkillName,
  generateTags,
  generateDescription,
  buildChangeSummaries,
  contributionSalience,
  findDominantForward,
  findDominantBackward,
} from './finalizeGeneratedSkill.ts';

// V6-1: 动画规格
export { decodeAnimationSpec } from './decodeAnimationSpec.ts';

// V6-1: 构筑差异
export { diffBuilds } from './diffBuilds.ts';

// V6-1: 主入口
export { generateBuildV6 } from './generateBuildV6.ts';

// V6-3: UI labels
export {
  FORM_LABELS,
  ELEMENT_LABELS_V6,
  STAT_LABELS,
  MECHANIC_LABELS,
} from './finalizeGeneratedSkill.ts';
