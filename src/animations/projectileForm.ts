// ============================================================
// V6 形态模板：projectile（投射）
// 飞行球体 + 光晕 + 拖尾，弧形轨迹
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import {
  CAST_POS,
  TARGET_POS,
  createGlowTexture,
  clearTransientGroup,
  emitChargeParticles,
  emitTravelParticles,
  emitImpactParticles,
  updateTrail,
} from './shared.ts';
import { hexToNumber } from './palette.ts';

export function renderProjectile(
  state: SceneState,
  spec: AnimationSpec,
  elapsed: number,
  dt: number,
): void {
  const { timing, geometry, primaryPalette, trajectory } = spec;
  const primaryHex = primaryPalette[0];
  const highlightHex = primaryPalette[1];
  const shadowHex = primaryPalette[2];
  const primaryNum = hexToNumber(primaryHex);
  const highlightNum = hexToNumber(highlightHex);
  const shadowNum = hexToNumber(shadowHex);

  const windup = timing.windupSeconds;
  const travel = timing.travelSeconds;
  const impactTime = windup + travel;
  const totalDuration = impactTime + timing.lingerSeconds + 0.5;

  // 清空上一帧形态层
  clearTransientGroup(state.formGroup);

  // ---- 蓄力阶段 ----
  if (elapsed < windup) {
    const chargeProgress = elapsed / windup;
    emitChargeParticles(state, primaryHex, highlightHex, geometry.count, 1 / travel, dt);

    state.chargeGlow.visible = true;
    state.chargeGlow.material.opacity = 0.16 + chargeProgress * 0.42;
    state.chargeGlow.scale.setScalar(0.65 + chargeProgress * 0.75);
    state.energyLight.intensity = 0.4 + chargeProgress * 1.8;
    state.caster.rotation.z = -0.03 * Math.sin(elapsed * 5);
    return;
  }

  // ---- 飞行阶段 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 3);

  if (elapsed < impactTime) {
    const point = new THREE.Vector3().lerpVectors(CAST_POS, TARGET_POS, eased);

    // 弧形偏移
    if (trajectory === 'arc') {
      point.y += Math.sin(travelProgress * Math.PI) * geometry.reach * 0.12;
    } else if (trajectory === 'drop') {
      point.y += (1 - travelProgress) * geometry.reach * 0.25;
    }

    // 投射物
    const projGeo = new THREE.IcosahedronGeometry(0.13 * geometry.impactScale, 2);
    const projMat = new THREE.MeshBasicMaterial({
      color: primaryNum,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const proj = new THREE.Mesh(projGeo, projMat);
    proj.position.copy(point);
    state.formGroup.add(proj);

    // 光晕
    const glowMat = new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: highlightNum,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(glowMat);
    halo.position.copy(point);
    halo.scale.setScalar(0.52 + geometry.impactScale * 0.35);
    state.formGroup.add(halo);

    // 拖尾
    updateTrail(state, point, shadowNum);

    const direction = TARGET_POS.clone().sub(CAST_POS).normalize();
    emitTravelParticles(state, point, direction, primaryHex, highlightHex, geometry.count, 1 / travel, dt);

    // 蓄力光晕消退
    state.chargeGlow.material.opacity = Math.max(0, 0.5 - travelProgress * 0.7);
    state.energyLight.intensity = 1.2 + travelProgress * 1.5;
    return;
  }

  // ---- 命中及余韵 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(
      state,
      primaryHex,
      highlightHex,
      geometry.count,
      1 / travel,
      (spec.mechanics?.delayedBurst ?? 0) > 0,
    );
    state.impactGlow.visible = true;
    state.impactGlow.scale.setScalar(0.35);
    state.impactGlow.material.opacity = 0.9;
    state.energyLight.intensity = 4.2;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.25);
  }

  // 冲击波扩散
  state.impactGlow.scale.setScalar(0.45 + impactAge * 3.2);
  state.impactGlow.material.opacity = Math.max(0, 0.92 - impactAge * 1.25);
  state.energyLight.intensity = Math.max(0.35, 4.2 - impactAge * 5);
  state.targetCore.scale.setScalar(0.35 + impactAge * 2.2);
  if (state.targetCore.material instanceof THREE.Material) {
    state.targetCore.material.opacity = Math.max(0, 0.9 - impactAge * 1.8);
  }

  // 击退
  if ((spec.mechanics?.knockback ?? 0) > 0) {
    const knock = Math.sin(Math.min(1, impactAge / 0.42) * Math.PI * 0.5) * geometry.displacement * 0.7;
    state.target.position.x = TARGET_POS.x + knock;
    state.target.rotation.z = -knock * 0.12;
  }

  // 镜头震动
  const shakeStrength = Math.max(0, 0.055 - impactAge * 0.065) * (0.6 + geometry.impactScale);
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
