// ============================================================
// V6 形态模板：construct（构造）
// 从地面升起的构造体/墙壁
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import {
  TARGET_POS,
  clearTransientGroup,
  spawnParticle,
  emitImpactParticles,
} from './shared.ts';
import { hexToNumber } from './palette.ts';

export function renderConstruct(
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

  const constructWidth = geometry.width * 1.5;
  const constructHeight = geometry.radius * 1.8;

  // ---- 蓄力（地面震动粒子） ----
  if (elapsed < windup) {
    const chargeProgress = elapsed / windup;
    // 地面粒子在目标区域聚集
    const n = Math.max(1, Math.round(geometry.count * dt * 0.5));
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * constructWidth;
      const origin = new THREE.Vector3(
        TARGET_POS.x + Math.cos(angle) * radius,
        0.05,
        TARGET_POS.z + Math.sin(angle) * radius,
      );
      spawnParticle(state, origin, new THREE.Vector3(0, 0.3 + Math.random() * 0.5, 0), 0.3 + Math.random() * 0.4, primaryPalette[0]);
    }
    state.chargeGlow.visible = true;
    state.chargeGlow.position.copy(TARGET_POS);
    state.chargeGlow.material.opacity = 0.1 + chargeProgress * 0.3;
    state.chargeGlow.scale.setScalar(0.5 + chargeProgress * 1.0);
    state.energyLight.intensity = 0.3 + chargeProgress * 1.2;
    return;
  }

  // ---- 升起 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 3);

  if (elapsed < impactTime) {
    state.chargeGlow.material.opacity = Math.max(0, 0.3 - travelProgress * 0.4);

    // 主体柱体
    const pillarGeo = new THREE.CylinderGeometry(
      constructWidth * 0.25,
      constructWidth * 0.35,
      constructHeight * eased,
      8,
    );
    const pillarMat = new THREE.MeshStandardMaterial({
      color: primaryNum,
      roughness: 0.6,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7 + travelProgress * 0.25,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(TARGET_POS.x, (constructHeight * eased) / 2, TARGET_POS.z);
    pillar.castShadow = true;
    state.formGroup.add(pillar);

    // 顶部高光环
    const topRingGeo = new THREE.TorusGeometry(constructWidth * 0.3, 0.02, 6, 32);
    const topRingMat = new THREE.MeshBasicMaterial({
      color: highlightNum,
      transparent: true,
      opacity: 0.3 + travelProgress * 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const topRing = new THREE.Mesh(topRingGeo, topRingMat);
    topRing.rotation.x = -Math.PI / 2;
    topRing.position.set(TARGET_POS.x, constructHeight * eased + 0.02, TARGET_POS.z);
    topRing.rotation.z = elapsed * 0.3;
    state.formGroup.add(topRing);

    // 基底粒子
    const n = Math.max(1, Math.round(geometry.count * dt * 0.3));
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * constructWidth * 0.5;
      const origin = new THREE.Vector3(
        TARGET_POS.x + Math.cos(angle) * radius,
        0.05,
        TARGET_POS.z + Math.sin(angle) * radius,
      );
      spawnParticle(state, origin, new THREE.Vector3(0, 1.0 + Math.random(), 0), 0.3 + Math.random() * 0.4, primaryPalette[0]);
    }

    state.energyLight.intensity = 1.0 + travelProgress * 2.5;
    return;
  }

  // ---- 锁定及持续 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, false);
    state.impactGlow.visible = true;
    state.impactGlow.position.copy(TARGET_POS);
    state.impactGlow.scale.setScalar(0.4);
    state.impactGlow.material.opacity = 0.8;
    state.energyLight.intensity = 4.0;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.2);
  }

  // 构造体保持可见
  const pillarGeo = new THREE.CylinderGeometry(
    constructWidth * 0.25,
    constructWidth * 0.35,
    constructHeight,
    8,
  );
  const pillarMat = new THREE.MeshStandardMaterial({
    color: primaryNum,
    roughness: 0.6,
    metalness: 0.3,
    transparent: true,
    opacity: Math.max(0, 0.85 - Math.max(0, impactAge - 0.8) * 0.4),
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.set(TARGET_POS.x, constructHeight / 2, TARGET_POS.z);
  pillar.castShadow = true;
  state.formGroup.add(pillar);

  // 持续光环
  const ringGeo = new THREE.TorusGeometry(constructWidth * 0.35, 0.02, 6, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: highlightNum,
    transparent: true,
    opacity: Math.max(0, 0.5 - impactAge * 0.15),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(TARGET_POS.x, constructHeight + 0.02, TARGET_POS.z);
  ring.rotation.z = elapsed * 0.2;
  state.formGroup.add(ring);

  state.impactGlow.scale.setScalar(0.4 + impactAge * 2.0);
  state.impactGlow.material.opacity = Math.max(0, 0.8 - impactAge * 1.0);
  state.energyLight.intensity = Math.max(0.3, 4.0 - impactAge * 3.0);

  const shakeStrength = Math.max(0, 0.04 - impactAge * 0.05) * geometry.impactScale;
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
