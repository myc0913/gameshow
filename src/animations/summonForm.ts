// ============================================================
// V6 形态模板：summon（召唤）
// 实体在目标位置从粒子中显现
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import {
  TARGET_POS,
  createGlowTexture,
  clearTransientGroup,
  spawnParticle,
  emitImpactParticles,
} from './shared.ts';
import { hexToNumber } from './palette.ts';

export function renderSummon(
  state: SceneState,
  spec: AnimationSpec,
  elapsed: number,
  dt: number,
): void {
  const { timing, geometry, primaryPalette } = spec;
  const primaryNum = hexToNumber(primaryPalette[0]);
  const highlightNum = hexToNumber(primaryPalette[1]);
  const shadowNum = hexToNumber(primaryPalette[2]);

  const windup = timing.windupSeconds;
  const travel = timing.travelSeconds;
  const impactTime = windup + travel;
  const totalDuration = impactTime + timing.lingerSeconds + 0.5;

  clearTransientGroup(state.formGroup);

  const summonScale = geometry.impactScale * 0.6;

  // ---- 蓄力（粒子在目标区域聚集） ----
  if (elapsed < windup) {
    const chargeProgress = elapsed / windup;
    const n = Math.max(1, Math.round(geometry.count * dt * 0.55));
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 0.6;
      const height = 0.3 + Math.random() * 1.8;
      const origin = new THREE.Vector3(
        TARGET_POS.x + Math.cos(angle) * radius,
        height,
        TARGET_POS.z + Math.sin(angle) * radius,
      );
      const toCenter = TARGET_POS.clone().sub(origin).normalize().multiplyScalar(0.6 + Math.random() * 0.8);
      spawnParticle(state, origin, toCenter, 0.6 + Math.random() * 0.6, primaryPalette[0]);
    }

    state.chargeGlow.visible = true;
    state.chargeGlow.position.copy(TARGET_POS);
    state.chargeGlow.material.opacity = 0.1 + chargeProgress * 0.35;
    state.chargeGlow.scale.setScalar(0.5 + chargeProgress * 1.5);
    state.energyLight.intensity = 0.3 + chargeProgress * 2.0;
    return;
  }

  // ---- 显现 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 3);

  if (elapsed < impactTime) {
    state.chargeGlow.material.opacity = Math.max(0, 0.4 - travelProgress * 0.5);

    // 召唤物核心球体
    const coreGeo = new THREE.IcosahedronGeometry(0.22 * summonScale, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: primaryNum,
      transparent: true,
      opacity: 0.3 + eased * 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(TARGET_POS);
    core.position.y += 0.35;
    core.scale.setScalar(0.2 + eased * 0.8);
    state.formGroup.add(core);

    // 光晕
    const glowMat = new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: highlightNum,
      transparent: true,
      opacity: 0.3 + eased * 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(glowMat);
    halo.position.copy(TARGET_POS);
    halo.position.y += 0.35;
    halo.scale.setScalar((0.6 + eased * 1.2) * summonScale);
    state.formGroup.add(halo);

    // 召唤阵环
    const ringGeo = new THREE.TorusGeometry(0.35 * summonScale, 0.02, 6, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: shadowNum,
      transparent: true,
      opacity: 0.2 + eased * 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(TARGET_POS.x, 0.04, TARGET_POS.z);
    ring.rotation.z = elapsed * 0.5;
    ring.scale.setScalar(0.3 + eased * 0.7);
    state.formGroup.add(ring);

    // 汇聚粒子
    const n = Math.max(1, Math.round(geometry.count * dt * 0.4));
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 * (1 - eased) + 0.1;
      const height = 1.0 * (1 - eased);
      const origin = new THREE.Vector3(
        TARGET_POS.x + Math.cos(angle) * radius,
        TARGET_POS.y + 0.35 + height,
        TARGET_POS.z + Math.sin(angle) * radius,
      );
      spawnParticle(state, origin, new THREE.Vector3(0, -0.5 - Math.random(), 0), 0.3 + Math.random() * 0.3, primaryPalette[0]);
    }

    state.energyLight.intensity = 1.2 + travelProgress * 3.0;
    return;
  }

  // ---- 完成召唤 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, false, 0.7);
    state.impactGlow.visible = true;
    state.impactGlow.position.copy(TARGET_POS);
    state.impactGlow.scale.setScalar(0.45);
    state.impactGlow.material.opacity = 0.8;
    state.energyLight.intensity = 4.0;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.3);
  }

  // 召唤物持续存在
  const coreGeo = new THREE.IcosahedronGeometry(0.22 * summonScale, 1);
  const coreMat = new THREE.MeshBasicMaterial({
    color: primaryNum,
    transparent: true,
    opacity: Math.max(0, 0.8 - Math.max(0, impactAge - 1.0) * 0.3),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.copy(TARGET_POS);
  core.position.y += 0.35;
  state.formGroup.add(core);

  // 持续光环
  const ringGeo = new THREE.TorusGeometry(0.35 * summonScale, 0.02, 6, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: highlightNum,
    transparent: true,
    opacity: Math.max(0, 0.45 - impactAge * 0.12),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(TARGET_POS.x, 0.04, TARGET_POS.z);
  ring.rotation.z = elapsed * 0.3;
  state.formGroup.add(ring);

  state.impactGlow.scale.setScalar(0.45 + impactAge * 2.0);
  state.impactGlow.material.opacity = Math.max(0, 0.8 - impactAge * 0.9);
  state.energyLight.intensity = Math.max(0.3, 4.0 - impactAge * 2.8);

  if (elapsed >= totalDuration) {
    state.isPlaying = false;
    state.camera.position.copy(state.baseCamera);
    state.energyLight.intensity = 0.2;
  }
}
