// ============================================================
// V6 形态模板：zone（领域）
// 地面上展开的符文领域，旋转并持续
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import {
  TARGET_POS,
  createZoneTexture,
  clearTransientGroup,
  spawnParticle,
  emitImpactParticles,
} from './shared.ts';
import { hexToNumber } from './palette.ts';

export function renderZone(
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

  // ---- 蓄力（粒子在目标区域上空聚集） ----
  if (elapsed < windup) {
    const chargeProgress = elapsed / windup;
    state.chargeGlow.visible = true;
    state.chargeGlow.position.copy(TARGET_POS);
    state.chargeGlow.material.opacity = 0.12 + chargeProgress * 0.35;
    state.chargeGlow.scale.setScalar(0.6 + chargeProgress * 1.2);
    state.energyLight.intensity = 0.3 + chargeProgress * 1.5;

    // 空中粒子向目标区域汇聚
    const n = Math.max(1, Math.round(geometry.count * dt * 0.4));
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * geometry.radius * 1.5;
      const origin = new THREE.Vector3(
        TARGET_POS.x + Math.cos(angle) * radius,
        1.8 + Math.random() * 1.2,
        TARGET_POS.z + Math.sin(angle) * radius,
      );
      spawnParticle(state, origin, new THREE.Vector3(0, -1.5 - Math.random(), 0), 0.7 + Math.random() * 0.5, primaryPalette[0]);
    }
    return;
  }

  // ---- 展开阶段（领域从中心扩展） ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 3);

  if (elapsed < impactTime) {
    state.chargeGlow.material.opacity = Math.max(0, 0.45 - travelProgress * 0.6);
    state.energyLight.intensity = 1.5 + travelProgress * 2.0;

    // 领域平面
    const zoneGeo = new THREE.PlaneGeometry(3.4, 3.4);
    const zoneMat = new THREE.MeshBasicMaterial({
      map: createZoneTexture(),
      color: primaryNum,
      transparent: true,
      opacity: 0.12 + eased * 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const zone = new THREE.Mesh(zoneGeo, zoneMat);
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(TARGET_POS.x, 0.025, TARGET_POS.z);
    zone.scale.setScalar(0.15 + eased * (0.95 + geometry.radius * 0.45));
    zone.rotation.z = -elapsed * 0.22;
    state.formGroup.add(zone);

    // 环形装饰线
    const ringGeo = new THREE.TorusGeometry(geometry.radius * 0.5, 0.015, 6, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: highlightNum,
      transparent: true,
      opacity: 0.18 + eased * 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(TARGET_POS.x, 0.04, TARGET_POS.z);
    ring.scale.setScalar(0.2 + eased * (0.9 + geometry.radius * 0.5));
    ring.rotation.z = elapsed * 0.35;
    state.formGroup.add(ring);

    // 下落粒子
    const n = Math.max(1, Math.round(geometry.count * dt * 0.35));
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * geometry.radius * 0.9;
      const origin = new THREE.Vector3(
        TARGET_POS.x + Math.cos(angle) * radius,
        1.5 + Math.random() * 1.5,
        TARGET_POS.z + Math.sin(angle) * radius,
      );
      spawnParticle(state, origin, new THREE.Vector3(0, -1.2 - Math.random(), 0), 0.7 + Math.random() * 0.5, primaryPalette[0]);
    }
    return;
  }

  // ---- 命中及持续 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, false);
    state.impactGlow.visible = true;
    state.impactGlow.position.copy(TARGET_POS);
    state.impactGlow.scale.setScalar(0.4);
    state.impactGlow.material.opacity = 0.8;
    state.energyLight.intensity = 3.8;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.2);
  }

  // 领域持续存在
  const zoneGeo = new THREE.PlaneGeometry(3.4, 3.4);
  const zoneScale = 0.82 + geometry.radius * 0.48;
  const zoneMat = new THREE.MeshBasicMaterial({
    map: createZoneTexture(),
    color: primaryNum,
    transparent: true,
    opacity: Math.max(0, 0.45 - Math.max(0, impactAge - 1.2) * 0.25),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const zone = new THREE.Mesh(zoneGeo, zoneMat);
  zone.rotation.x = -Math.PI / 2;
  zone.position.set(TARGET_POS.x, 0.025, TARGET_POS.z);
  zone.scale.setScalar(zoneScale + Math.min(0.32, impactAge * 0.3));
  zone.rotation.z = -elapsed * 0.18;
  state.formGroup.add(zone);

  // 持续光环
  const ringGeo = new THREE.TorusGeometry(geometry.radius * 0.5, 0.015, 6, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: highlightNum,
    transparent: true,
    opacity: Math.max(0, 0.55 - impactAge * 0.18),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(TARGET_POS.x, 0.04, TARGET_POS.z);
  ring.scale.setScalar(zoneScale);
  ring.rotation.z = elapsed * 0.25;
  state.formGroup.add(ring);

  state.impactGlow.scale.setScalar(0.4 + impactAge * 2.5);
  state.impactGlow.material.opacity = Math.max(0, 0.8 - impactAge * 1.1);
  state.energyLight.intensity = Math.max(0.3, 3.8 - impactAge * 3.5);
  state.targetCore.scale.setScalar(0.25 + impactAge * 1.8);

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
