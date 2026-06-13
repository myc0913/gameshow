// ============================================================
// V6 动画模块 — 桶导出 + FormRenderer 类型
// ============================================================

import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';

export type FormRenderer = (
  state: SceneState,
  spec: AnimationSpec,
  elapsed: number,
  dt: number,
) => void;

export { renderProjectile } from './projectileForm.ts';
export { renderCone } from './coneForm.ts';
export { renderZone } from './zoneForm.ts';
export { renderChain } from './chainForm.ts';
export { renderMovement } from './movementForm.ts';
export { renderConstruct } from './constructForm.ts';
export { renderMark } from './markForm.ts';
export { renderSummon } from './summonForm.ts';
export { renderLine } from './lineForm.ts';

import { renderProjectile } from './projectileForm.ts';
import { renderCone } from './coneForm.ts';
import { renderZone } from './zoneForm.ts';
import { renderChain } from './chainForm.ts';
import { renderMovement } from './movementForm.ts';
import { renderConstruct } from './constructForm.ts';
import { renderMark } from './markForm.ts';
import { renderSummon } from './summonForm.ts';
import { renderLine } from './lineForm.ts';

/** 按 SkillForm 键索引的渲染器映射表 */
export const FORM_RENDERERS: Record<string, FormRenderer> = {
  projectile: renderProjectile,
  cone: renderCone,
  zone: renderZone,
  chain: renderChain,
  movement: renderMovement,
  construct: renderConstruct,
  mark: renderMark,
  summon: renderSummon,
  line: renderLine,
};
