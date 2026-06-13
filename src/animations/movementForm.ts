// ============================================================
// V6 形态模板：movement（位移）
// 施法者冲刺到目标位置，带残影效果
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import {
  CAST_POS,
  TARGET_POS,
  clearTransientGroup,
  emitChargeParticles,
  emitImpactParticles,
  spawnParticle,
} from './shared.ts';
import { hexToNumber } from './palette.ts';

export function renderMovement(
  state: SceneState,
  spec: AnimationSpec,
  elapsed: number,
  dt: number,
): void {
  const { timing, geometry, primaryPalette } = spec;
  const primaryNum = hexToNumber(primaryPalette[0]);

  const windup = timing.windupSeconds;
  const travel = timing.travelSeconds;
  const impactTime = windup + travel;
  const totalDuration = impactTime + timing.lingerSeconds + 0.5;

  clearTransientGroup(state.formGroup);

  // ---- 蓄力（施法者下蹲） ----
  if (elapsed < windup) {
    const chargeProgress = elapsed / windup;
    emitChargeParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, dt);
    state.chargeGlow.visible = true;
    state.chargeGlow.material.opacity = 0.16 + chargeProgress * 0.42;
    state.chargeGlow.scale.setScalar(0.65 + chargeProgress * 0.75);
    // 下蹲
    state.caster.position.y = -0.08 * chargeProgress;
    state.caster.scale.setScalar(1 - 0.1 * chargeProgress);
    state.energyLight.intensity = 0.4 + chargeProgress * 2.5;
    return;
  }

  // ---- 冲刺 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 2);

  if (elapsed < impactTime) {
    // 施法者位置：从 CAST 移动到 TARGET 附近
    const casterTarget = new THREE.Vector3().lerpVectors(CAST_POS, TARGET_POS, eased);
    casterTarget.y += Math.sin(travelProgress * Math.PI) * 0.2;
    state.caster.position.copy(casterTarget);
    state.caster.position.y = 0 + Math.sin(travelProgress * Math.PI) * 0.2;
    state.caster.scale.setScalar(0.9 + 0.1 * travelProgress);

    // 残影（在 caster 后面留下几个半透明副本）
    const ghostCount = 3;
    for (let g = 1; g <= ghostCount; g++) {
      const ghostT = Math.max(0, travelProgress - g * 0.08);
      if (ghostT <= 0) continue;
      const ghostEased = 1 - Math.pow(1 - ghostT, 2);
      const ghostPos = new THREE.Vector3().lerpVectors(CAST_POS, TARGET_POS, ghostEased);
      ghostPos.y = 0 + Math.sin(ghostT * Math.PI) * 0.2;

      const ghostGeo = new THREE.SphereGeometry(0.2, 6, 6);
      const ghostMat = new THREE.MeshBasicMaterial({
        color: primaryNum,
        transparent: true,
        opacity: 0.12 * (1 - g / (ghostCount + 1)),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ghost = new THREE.Mesh(ghostGeo, ghostMat);
      ghost.position.copy(ghostPos);
      state.formGroup.add(ghost);
    }

    // 冲刺拖尾粒子
    const n = Math.max(1, Math.round(geometry.count * dt * 0.5));
    for (let i = 0; i < n; i++) {
      const trailPos = casterTarget.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3),
      );
      spawnParticle(
        state,
        trailPos,
        new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.3, (Math.random() - 0.5) * 0.8),
        0.25 + Math.random() * 0.3,
        Math.random() > 0.4 ? primaryPalette[0] : primaryPalette[1],
      );
    }

    state.chargeGlow.material.opacity = Math.max(0, 0.5 - travelProgress);
    state.energyLight.intensity = 1.5 + travelProgress * 2.0;
    return;
  }

  // ---- 命中及返回 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, false);
    state.impactGlow.visible = true;
    state.impactGlow.scale.setScalar(0.4);
    state.impactGlow.material.opacity = 0.85;
    state.energyLight.intensity = 4.5;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.3);
  }

  // 施法者在目标位置停留片刻后返回原位
  const returnDelay = 0.3;
  if (impactAge > returnDelay) {
    const returnProgress = THREE.MathUtils.clamp((impactAge - returnDelay) / 0.5, 0, 1);
    const returnEased = 1 - Math.pow(1 - returnProgress, 2);
    const returnPos = new THREE.Vector3().lerpVectors(TARGET_POS, CAST_POS, returnEased);
    state.caster.position.set(returnPos.x, 0, returnPos.z);
    state.caster.scale.setScalar(1);
  } else {
    // 在目标位置短暂停留
    state.caster.position.set(TARGET_POS.x, 0, TARGET_POS.z);
    state.caster.scale.setScalar(1);
  }

  state.impactGlow.scale.setScalar(0.4 + impactAge * 2.5);
  state.impactGlow.material.opacity = Math.max(0, 0.85 - impactAge * 1.0);
  state.energyLight.intensity = Math.max(0.3, 4.5 - impactAge * 3.5);

  const shakeStrength = Math.max(0, 0.05 - impactAge * 0.07) * geometry.impactScale;
  state.camera.position.set(
    state.baseCamera.x + Math.sin(elapsed * 86) * shakeStrength,
    state.baseCamera.y + Math.cos(elapsed * 73) * shakeStrength * 0.55,
    state.baseCamera.z,
  );

  if (elapsed >= totalDuration) {
    state.isPlaying = false;
    state.camera.position.copy(state.baseCamera);
    state.caster.position.set(CAST_POS.x, 0, CAST_POS.z);
    state.caster.scale.setScalar(1);
    state.energyLight.intensity = 0.2;
  }
}
