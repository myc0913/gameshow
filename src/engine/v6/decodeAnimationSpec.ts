// ============================================================
// V6 AnimationSpec 解码 — 从最终技能结果生成动画规格
// 依据: docs/v6/presentation-and-migration.md §8
// ============================================================

import type {
  GeneratedSkill,
  AnimationSpec,
  AnimationCue,
} from '../../types/v6.ts';
import { ELEMENT_PALETTES, DEFAULT_TRAJECTORY_BY_FORM } from '../../data/v6/baseSkills.ts';
import { lerp, roundTo } from './math.ts';

/**
 * 从 GeneratedSkill 生成 AnimationSpec。
 * 必须在 finalizeGeneratedSkill 之后调用以覆盖占位 animation 字段。
 */
export function decodeAnimationSpec(skill: GeneratedSkill): AnimationSpec {
  const stats = skill.finalStats;

  // ---- 时序 ----
  const speed = stats.speed;
  const duration = stats.duration;

  const windupSeconds = roundTo(lerp(0.90, 0.15, speed), 2);
  const travelSeconds = roundTo(lerp(1.20, 0.25, speed), 2);
  const lingerSeconds = roundTo(lerp(0.20, 3.00, duration), 2);
  const pulseIntervalSeconds = roundTo(lerp(0.90, 0.22, speed), 2);

  // ---- 几何 ----
  const reach = stats.reach;
  const area = stats.area;
  const propagation = stats.propagation;
  const power = stats.power;
  const force = stats.force;

  const geometry = {
    reach: roundTo(lerp(2.0, 8.0, reach), 2),
    radius: roundTo(lerp(0.6, 3.0, area), 2),
    width: roundTo(lerp(0.15, 1.2, area), 2),
    count: Math.round(lerp(1, 6, propagation)),
    impactScale: roundTo(lerp(0.5, 2.0, power), 2),
    displacement: roundTo(lerp(0.15, 1.0, force), 2),
  };

  // ---- 调色板 ----
  const palette = ELEMENT_PALETTES[skill.primaryElement];
  const primaryPalette = [palette.primary, palette.highlight, palette.shadow];

  // ---- 轨迹 ----
  const trajectory = DEFAULT_TRAJECTORY_BY_FORM[skill.form];

  // ---- Cue 选择 ----
  const forwardCue = selectForwardCue(skill);
  const backwardCue = selectBackwardCue(skill);

  return {
    form: skill.form,
    primaryElement: skill.primaryElement,
    primaryPalette,
    trajectory,
    timing: {
      windupSeconds,
      travelSeconds,
      lingerSeconds,
      pulseIntervalSeconds,
    },
    geometry,
    mechanics: { ...skill.finalMechanics },
    forwardCue,
    backwardCue,
  };
}

/**
 * 选择前向 Cue：取前向 accent 中强度最高者。
 */
function selectForwardCue(skill: GeneratedSkill): AnimationCue | undefined {
  const fwdAccents = skill.accents.filter((a) => a.pass === 'forward' && a.strength > 1e-9);
  if (fwdAccents.length === 0) return undefined;

  const best = fwdAccents.reduce((a, b) => a.strength > b.strength ? a : b);

  return {
    visualCue: best.visualCue,
    sourceElement: best.element,
    pass: 'forward',
    strength: 0.15 + 0.85 * best.strength, // 保证弱 Cue 仍可见
    sourceSlots: best.sourceSlots,
  };
}

/**
 * 选择后向 Cue：取后向 accent 中强度最高者。
 */
function selectBackwardCue(skill: GeneratedSkill): AnimationCue | undefined {
  const bwdAccents = skill.accents.filter((a) => a.pass === 'backward' && a.strength > 1e-9);
  if (bwdAccents.length === 0) return undefined;

  const best = bwdAccents.reduce((a, b) => a.strength > b.strength ? a : b);

  return {
    visualCue: best.visualCue,
    sourceElement: best.element,
    pass: 'backward',
    strength: 0.15 + 0.85 * best.strength,
    sourceSlots: best.sourceSlots,
  };
}
