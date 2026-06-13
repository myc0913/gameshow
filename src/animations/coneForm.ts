// ============================================================
// V6 形态模板：cone（锥形/扇形）
// 从施法者向外扩展的扇形光束
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import {
  CAST_POS,
  TARGET_POS,
  createLine,
  clearTransientGroup,
  emitChargeParticles,
  emitTravelParticles,
  emitImpactParticles,
} from './shared.ts';
import { hexToNumber } from './palette.ts';

export function renderCone(
  state: SceneState,
  spec: AnimationSpec,
  elapsed: number,
  dt: number,
): void {
  const { timing, geometry, primaryPalette } = spec;
  const primaryNum = hexToNumber(primaryPalette[0]);
  const highlightNum = hexToNumber(primaryPalette[1]);

  const windup = timing.windupSeconds;
  const travel = timing.travelSeconds;
  const impactTime = windup + travel;
  const totalDuration = impactTime + timing.lingerSeconds + 0.5;

  clearTransientGroup(state.formGroup);

  const fanLines = 7;
  const fanSpread = geometry.width * 0.7;

  // ---- 蓄力 ----
  if (elapsed < windup) {
    const chargeProgress = elapsed / windup;
    emitChargeParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, dt);
    state.chargeGlow.visible = true;
    state.chargeGlow.material.opacity = 0.16 + chargeProgress * 0.42;
    state.chargeGlow.scale.setScalar(0.65 + chargeProgress * 0.75);
    state.energyLight.intensity = 0.4 + chargeProgress * 1.8;
    state.caster.rotation.z = -0.03 * Math.sin(elapsed * 5);
    return;
  }

  // ---- 推进 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 2);

  if (elapsed < impactTime) {
    state.chargeGlow.material.opacity = Math.max(0, 0.5 - travelProgress * 0.7);

    // 扇形线束
    for (let i = 0; i < fanLines; i++) {
      const offset = (i / (fanLines - 1) - 0.5) * fanSpread;
      const end = TARGET_POS.clone();
      end.y += offset * 0.6;
      end.z += offset * 1.2;

      const start = CAST_POS.clone();
      const mid = new THREE.Vector3().lerpVectors(start, end, eased * 0.85);
      const line = createLine([start, mid], primaryNum, 0.15 + travelProgress * 0.35);
      state.formGroup.add(line);
    }

    // 中心光束（更亮）
    const centerEnd = TARGET_POS.clone();
    const centerLine = createLine(
      [CAST_POS, new THREE.Vector3().lerpVectors(CAST_POS, centerEnd, eased * 0.85)],
      highlightNum,
      0.28 + travelProgress * 0.45,
    );
    state.formGroup.add(centerLine);

    // 边缘粒子
    const direction = TARGET_POS.clone().sub(CAST_POS).normalize();
    const midPoint = new THREE.Vector3().lerpVectors(CAST_POS, TARGET_POS, eased * 0.85);
    emitTravelParticles(state, midPoint, direction, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, dt);

    state.energyLight.intensity = 1.0 + travelProgress * 2.0;
    return;
  }

  // ---- 命中 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, false);
    state.impactGlow.visible = true;
    state.impactGlow.scale.setScalar(0.35);
    state.impactGlow.material.opacity = 0.9;
    state.energyLight.intensity = 4.5;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.25);
  }

  state.impactGlow.scale.setScalar(0.45 + impactAge * 3.0);
  state.impactGlow.material.opacity = Math.max(0, 0.9 - impactAge * 1.2);
  state.energyLight.intensity = Math.max(0.3, 4.5 - impactAge * 4.5);
  state.targetCore.scale.setScalar(0.35 + impactAge * 2.5);

  // 击退
  if ((spec.mechanics?.knockback ?? 0) > 0) {
    const knock = Math.sin(Math.min(1, impactAge / 0.42) * Math.PI * 0.5) * geometry.displacement * 0.6;
    state.target.position.x = TARGET_POS.x + knock;
    state.target.rotation.z = -knock * 0.12;
  }

  const shakeStrength = Math.max(0, 0.05 - impactAge * 0.06) * geometry.impactScale;
  state.camera.position.set(
    state.baseCamera.x + Math.sin(elapsed * 86) * shakeStrength,
    state.baseCamera.y + Math.cos(elapsed * 73) * shakeStrength * 0.55,
    state.baseCamera.z,
  );

  if (elapsed >= totalDuration) {
    state.isPlaying = false;
    state.camera.position.copy(state.baseCamera);
    state.energyLight.intensity = 0.2;
  }
}
