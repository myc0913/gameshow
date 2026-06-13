// ============================================================
// V6 形态模板：chain（连锁）
// 节点间跳跃的连锁传导效果
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

export function renderChain(
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

  const nodeCount = Math.max(3, geometry.count);
  const chainPoints: THREE.Vector3[] = [CAST_POS];
  for (let i = 1; i < nodeCount - 1; i++) {
    const t = i / (nodeCount - 1);
    chainPoints.push(
      new THREE.Vector3(
        CAST_POS.x + (TARGET_POS.x - CAST_POS.x) * t + (Math.sin(i * 1.8) * 0.5),
        CAST_POS.y + (TARGET_POS.y - CAST_POS.y) * t + Math.sin(i * 2.2) * 0.4,
        CAST_POS.z + (TARGET_POS.z - CAST_POS.z) * t + Math.cos(i * 1.5) * 0.4,
      ),
    );
  }
  chainPoints.push(TARGET_POS);

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

  // ---- 传导 ----
  const travelElapsed = elapsed - windup;
  const travelProgress = THREE.MathUtils.clamp(travelElapsed / travel, 0, 1);
  const eased = 1 - Math.pow(1 - travelProgress, 3);

  if (elapsed < impactTime) {
    state.chargeGlow.material.opacity = Math.max(0, 0.5 - travelProgress * 0.7);

    // 渲染连线（逐步出现）
    const activeSegments = Math.ceil(eased * (chainPoints.length - 1));
    for (let i = 0; i < activeSegments && i < chainPoints.length - 1; i++) {
      const segProgress = THREE.MathUtils.clamp(
        (eased * (chainPoints.length - 1) - i),
        0,
        1,
      );
      const segOpacity = 0.22 + segProgress * 0.55;
      const line = createLine(
        [chainPoints[i], chainPoints[i + 1]],
        primaryNum,
        segOpacity,
      );
      state.formGroup.add(line);
    }

    // 节点球
    for (let i = 1; i <= activeSegments && i < chainPoints.length; i++) {
      const nodeActive = Math.min(1, eased * (chainPoints.length - 1) - i + 1);
      if (nodeActive <= 0) continue;
      const nodeGeo = new THREE.OctahedronGeometry(0.09, 0);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: i === activeSegments ? highlightNum : primaryNum,
        transparent: true,
        opacity: 0.4 + nodeActive * 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.copy(chainPoints[i]);
      node.scale.setScalar(0.45 + Math.sin(elapsed * 12 + i) * 0.18);
      state.formGroup.add(node);
    }

    const direction = TARGET_POS.clone().sub(CAST_POS).normalize();
    const currentPoint = new THREE.Vector3().lerpVectors(CAST_POS, TARGET_POS, eased);
    emitTravelParticles(state, currentPoint, direction, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, dt);

    state.energyLight.intensity = 1.0 + travelProgress * 2.5;
    return;
  }

  // ---- 命中及余韵 ----
  const impactAge = elapsed - impactTime;

  if (!state.impactTriggered) {
    state.impactTriggered = true;
    emitImpactParticles(state, primaryPalette[0], primaryPalette[1], geometry.count, 1 / travel, false, 1.2);
    state.impactGlow.visible = true;
    state.impactGlow.scale.setScalar(0.35);
    state.impactGlow.material.opacity = 0.9;
    state.energyLight.intensity = 4.5;
    state.targetCore.visible = true;
    state.targetCore.scale.setScalar(0.25);
  }

  // 连线渐隐
  if (impactAge < 0.6) {
    const fadeOpacity = 0.6 * (1 - impactAge / 0.6);
    for (let i = 0; i < chainPoints.length - 1; i++) {
      const line = createLine([chainPoints[i], chainPoints[i + 1]], primaryNum, fadeOpacity);
      state.formGroup.add(line);
    }
    for (let i = 1; i < chainPoints.length - 1; i++) {
      const nodeGeo = new THREE.OctahedronGeometry(0.09, 0);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: primaryNum,
        transparent: true,
        opacity: fadeOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.copy(chainPoints[i]);
      node.scale.setScalar(0.6 - impactAge * 0.5);
      state.formGroup.add(node);
    }
  }

  state.impactGlow.scale.setScalar(0.45 + impactAge * 3.0);
  state.impactGlow.material.opacity = Math.max(0, 0.92 - impactAge * 1.2);
  state.energyLight.intensity = Math.max(0.3, 4.5 - impactAge * 4.5);

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
