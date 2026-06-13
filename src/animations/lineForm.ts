// ============================================================
// V6 形态模板：line（直线）
// 沿地面从施法者到目标的直线光束
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

export function renderLine(
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

  // ---- 光束延伸 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 3);

  if (elapsed < impactTime) {
    state.chargeGlow.material.opacity = Math.max(0, 0.5 - travelProgress * 0.7);

    // 主光束（沿地面）
    const beamStart = CAST_POS.clone();
    beamStart.y = 0.08;
    const beamEnd = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(CAST_POS.x, 0.08, CAST_POS.z),
      new THREE.Vector3(TARGET_POS.x, 0.08, TARGET_POS.z),
      eased,
    );

    // 核心光束（粗）
    const corePoints = [
      beamStart.clone().add(new THREE.Vector3(0, 0.02, 0)),
      beamEnd.clone().add(new THREE.Vector3(0, 0.02, 0)),
    ];
    const coreLine = createLine(corePoints, primaryNum, 0.35 + eased * 0.5);
    state.formGroup.add(coreLine);

    // 外层光束（宽，淡）
    const outerPoints = [
      beamStart.clone().add(new THREE.Vector3(0, 0.05, 0)),
      beamEnd.clone().add(new THREE.Vector3(0, 0.05, 0)),
    ];
    const outerLine = createLine(outerPoints, highlightNum, 0.15 + eased * 0.35);
    state.formGroup.add(outerLine);

    // 地面沿线粒子
    const direction = TARGET_POS.clone().sub(CAST_POS).normalize();
    const midPoint = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(CAST_POS.x, 0.1, CAST_POS.z),
      new THREE.Vector3(TARGET_POS.x, 0.1, TARGET_POS.z),
      eased,
    );
    emitTravelParticles(state, midPoint, direction, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, dt);

    state.energyLight.intensity = 0.8 + travelProgress * 2.5;
    return;
  }

  // ---- 命中及余韵 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, (spec.mechanics?.delayedBurst ?? 0) > 0);
    state.impactGlow.visible = true;
    state.impactGlow.scale.setScalar(0.35);
    state.impactGlow.material.opacity = 0.9;
    state.energyLight.intensity = 4.2;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.25);
  }

  // 余韵光束（渐隐）
  if (impactAge < 0.3) {
    const fadeOpacity = 0.7 * (1 - impactAge / 0.3);
    const beamStart = new THREE.Vector3(CAST_POS.x, 0.1, CAST_POS.z);
    const beamEnd = new THREE.Vector3(TARGET_POS.x, 0.1, TARGET_POS.z);
    const line = createLine([beamStart, beamEnd], primaryNum, fadeOpacity);
    state.formGroup.add(line);
  }

  state.impactGlow.scale.setScalar(0.45 + impactAge * 3.0);
  state.impactGlow.material.opacity = Math.max(0, 0.9 - impactAge * 1.2);
  state.energyLight.intensity = Math.max(0.3, 4.2 - impactAge * 4.5);
  state.targetCore.scale.setScalar(0.35 + impactAge * 2.2);

  // 击退
  if ((spec.mechanics?.knockback ?? 0) > 0) {
    const knock = Math.sin(Math.min(1, impactAge / 0.42) * Math.PI * 0.5) * geometry.displacement * 0.65;
    state.target.position.x = TARGET_POS.x + knock;
    state.target.rotation.z = -knock * 0.12;
  }

  const shakeStrength = Math.max(0, 0.05 - impactAge * 0.065) * geometry.impactScale;
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
