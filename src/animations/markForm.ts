// ============================================================
// V6 形态模板：mark（印记）
// 目标位置的旋转印记，延迟后引爆
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import {
  TARGET_POS,
  clearTransientGroup,
  emitChargeParticles,
  emitImpactParticles,
  spawnParticle,
} from './shared.ts';
import { hexToNumber } from './palette.ts';

export function renderMark(
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
  // 延迟爆发：在 linger 阶段中段触发第二次
  const secondImpactDelay = Math.min(0.7, timing.lingerSeconds * 0.5);
  const totalDuration = impactTime + timing.lingerSeconds + 0.5;

  clearTransientGroup(state.formGroup);

  const markRadius = geometry.radius * 0.45;

  // ---- 蓄力 ----
  if (elapsed < windup) {
    const chargeProgress = elapsed / windup;
    emitChargeParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, dt);
    state.chargeGlow.visible = true;
    state.chargeGlow.material.opacity = 0.16 + chargeProgress * 0.42;
    state.chargeGlow.scale.setScalar(0.65 + chargeProgress * 0.75);
    state.energyLight.intensity = 0.4 + chargeProgress * 1.5;
    return;
  }

  // ---- 印记出现 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);

  if (elapsed < impactTime) {
    state.chargeGlow.material.opacity = Math.max(0, 0.5 - travelProgress * 0.7);

    // 印记外环
    const outerGeo = new THREE.TorusGeometry(markRadius, 0.025, 6, 36);
    const outerMat = new THREE.MeshBasicMaterial({
      color: highlightNum,
      transparent: true,
      opacity: 0.25 + travelProgress * 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.position.set(TARGET_POS.x, TARGET_POS.y + 0.02, TARGET_POS.z + 0.36);
    outer.rotation.z = elapsed * 0.85;
    outer.scale.setScalar(0.65 + 0.12 * Math.sin(elapsed * 7));
    state.formGroup.add(outer);

    // 刻度标记
    for (let i = 0; i < 4; i++) {
      const tickGeo = new THREE.BoxGeometry(0.035, 0.18, 0.025);
      const tickMat = new THREE.MeshBasicMaterial({
        color: primaryNum,
        transparent: true,
        opacity: 0.3 + travelProgress * 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(
        TARGET_POS.x + Math.cos(i * Math.PI / 2) * markRadius,
        TARGET_POS.y + 0.02 + Math.sin(i * Math.PI / 2) * markRadius,
        TARGET_POS.z + 0.36,
      );
      tick.rotation.z = -i * Math.PI / 2;
      state.formGroup.add(tick);
    }

    state.energyLight.intensity = 0.8 + travelProgress * 1.5;
    return;
  }

  // ---- 命中及延迟爆发 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, false, 0.6);
    state.impactGlow.visible = true;
    state.impactGlow.position.copy(TARGET_POS);
    state.impactGlow.scale.setScalar(0.3);
    state.impactGlow.material.opacity = 0.7;
    state.energyLight.intensity = 3.0;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.2);
  }

  // 第一次命中后的印记持续
  if (impactAge < secondImpactDelay) {
    const ringGeo = new THREE.TorusGeometry(markRadius, 0.025, 6, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: highlightNum,
      transparent: true,
      opacity: 0.5 + 0.2 * Math.sin(impactAge * 10),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(TARGET_POS.x, TARGET_POS.y + 0.02, TARGET_POS.z + 0.36);
    ring.rotation.z = elapsed * 1.2;
    ring.scale.setScalar(0.7 + impactAge * 0.5);
    state.formGroup.add(ring);
  }

  // 延迟第二次爆发
  if (impactAge >= secondImpactDelay && !state.impactTriggered) {
    // 标记为已触发，实际在下面处理
  }

  // 二次爆发
  if (impactAge >= secondImpactDelay) {
    const secondAge = impactAge - secondImpactDelay;

    if (secondAge < 0.05) {
      // 二次爆发瞬间
      emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count * 1.5, 1 / travel, true, 0.8);
      state.energyLight.intensity = 5.0;
      state.impactGlow.scale.setScalar(0.5);
      state.impactGlow.material.opacity = 0.9;
    }

    // 残余粒子
    if (secondAge < 0.8) {
      const n = Math.max(1, Math.round(geometry.count * dt * 0.3));
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * markRadius * 2;
        const origin = new THREE.Vector3(
          TARGET_POS.x + Math.cos(angle) * radius,
          TARGET_POS.y + 0.1 + Math.random() * 0.3,
          TARGET_POS.z + Math.sin(angle) * radius,
        );
        spawnParticle(
          state,
          origin,
          new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.5 + Math.random(), (Math.random() - 0.5) * 0.5),
          0.3 + Math.random() * 0.4,
          Math.random() > 0.4 ? primaryPalette[0] : primaryPalette[1],
        );
      }
    }

    state.impactGlow.scale.setScalar(0.5 + secondAge * 3.0);
    state.impactGlow.material.opacity = Math.max(0, 0.9 - secondAge * 1.2);
    state.energyLight.intensity = Math.max(0.3, 5.0 - secondAge * 4.5);
  } else {
    state.impactGlow.scale.setScalar(0.3 + impactAge * 1.5);
    state.impactGlow.material.opacity = Math.max(0, 0.7 - impactAge * 0.8);
    state.energyLight.intensity = Math.max(0.5, 3.0 - impactAge * 2.5);
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
