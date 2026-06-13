// ============================================================
// V6 动画 Cue 层 — 前向/后向 Cue 渲染
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState } from './shared.ts';
import { clearTransientGroup } from './shared.ts';
import { ELEMENT_PALETTES } from '../data/v6/baseSkills.ts';

/**
 * 渲染前向 Cue：在传播路径上显示来源元素的浮动粒子与光环。
 * 在 travel 阶段调用。
 */
export function renderForwardCue(
  state: SceneState,
  spec: AnimationSpec,
  progress: number, // 0..1 传播进度
): void {
  const cue = spec.forwardCue;
  if (!cue) return;
  const group = state.forwardCueGroup;

  // 清空上一帧
  clearTransientGroup(group);

  const palette = ELEMENT_PALETTES[cue.sourceElement];
  const opacity = cue.strength; // 已由 decodeAnimationSpec 保证 floor = 0.15 + 0.85 * strength

  // 中点位置（caster → target）
  const midPoint = new THREE.Vector3().lerpVectors(
    new THREE.Vector3(-1.65, 0.72, 0),
    new THREE.Vector3(1.55, 0.78, 0),
    progress,
  );

  // 环绕粒子
  const total = Math.round(3 + cue.strength * 4);
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2 + state.elapsed * (0.5 + cue.strength * 1.5);
    const radius = 0.45 + (i % 3) * 0.12;
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 + cue.strength * 0.04, 6, 6),
      new THREE.MeshBasicMaterial({
        color: parseInt(palette.highlight.slice(1), 16),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    particle.position.set(
      midPoint.x + Math.cos(angle) * radius,
      midPoint.y + Math.sin(angle * 1.3) * radius * 0.3 + 0.3,
      midPoint.z + Math.sin(angle) * radius,
    );
    group.add(particle);
  }

  // 光环
  const ringGeom = new THREE.TorusGeometry(0.22, 0.018, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: parseInt(palette.primary.slice(1), 16),
    transparent: true,
    opacity: opacity * 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.copy(midPoint);
  ring.position.y += 0.08;
  ring.rotation.x = -Math.PI / 2;
  ring.rotation.z = state.elapsed * (0.5 + cue.strength * 0.5);
  group.add(ring);
}

/**
 * 渲染后向 Cue：在目标位置显示来源元素的余韵效果。
 * 在 linger 阶段调用。
 */
export function renderBackwardCue(
  state: SceneState,
  spec: AnimationSpec,
  impactAge: number, // 距命中已过去的时间（秒）
): void {
  const cue = spec.backwardCue;
  if (!cue) return;
  const group = state.backwardCueGroup;

  // 清空上一帧
  clearTransientGroup(group);

  const palette = ELEMENT_PALETTES[cue.sourceElement];
  const opacity = cue.strength * Math.max(0, 1 - impactAge / Math.max(0.1, spec.timing.lingerSeconds));

  if (opacity < 0.02) return;

  const targetPos = new THREE.Vector3(1.55, 0.78, 0);

  // 升腾粒子
  const total = Math.round(2 + cue.strength * 3);
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2 + impactAge * 0.8;
    const radius = 0.35 + impactAge * 0.5 + (i % 2) * 0.2;
    const y = targetPos.y + impactAge * 0.6 + i * 0.15;
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.03 + cue.strength * 0.03, 4, 4),
      new THREE.MeshBasicMaterial({
        color: parseInt(palette.shadow.slice(1), 16),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    particle.position.set(
      targetPos.x + Math.cos(angle) * radius,
      y,
      targetPos.z + Math.sin(angle) * radius,
    );
    group.add(particle);
  }

  // 底部光环（逐渐扩大）
  const ringGeom = new THREE.TorusGeometry(0.3 + impactAge * 0.18, 0.02, 6, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: parseInt(palette.primary.slice(1), 16),
    transparent: true,
    opacity: opacity * 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.copy(targetPos);
  ring.position.y = 0.06;
  ring.rotation.x = -Math.PI / 2;
  ring.rotation.z = impactAge * 0.3;
  group.add(ring);
}
