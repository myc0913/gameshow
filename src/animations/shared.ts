// ============================================================
// V6 动画共享模块 — 场景状态、粒子系统、纹理、工具函数
// ============================================================

import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';

// ---- 常量 ----

export const DURATION_PADDING = 0.5;
export const PARTICLE_COUNT = 420;
export const CAST_POS = new THREE.Vector3(-1.65, 0.72, 0);
export const TARGET_POS = new THREE.Vector3(1.55, 0.78, 0);

// ---- 粒子 ----

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

// ---- 场景状态 ----

export interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  baseCamera: THREE.Vector3;
  clock: THREE.Clock;

  // 基础场景对象
  caster: THREE.Group;
  target: THREE.Group;
  targetCore: THREE.Mesh;
  energyLight: THREE.PointLight;
  chargeGlow: THREE.Sprite;
  impactGlow: THREE.Sprite;

  // 形态专属层（每帧清空重建）
  formGroup: THREE.Group;

  // Cue 层
  forwardCueGroup: THREE.Group;
  backwardCueGroup: THREE.Group;

  // 粒子系统
  particlePoints: THREE.Points;
  particleGeometry: THREE.BufferGeometry;
  particles: Particle[];

  // 拖尾
  trailLine: THREE.Line;
  trailPositions: THREE.Vector3[];

  // 状态
  currentSpec: AnimationSpec | null;
  elapsed: number;
  isPlaying: boolean;
  impactTriggered: boolean;
}

// ---- 纹理 ----

let glowTextureCache: THREE.CanvasTexture | null = null;

export function createGlowTexture(): THREE.CanvasTexture {
  if (glowTextureCache) return glowTextureCache;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,.78)');
  gradient.addColorStop(0.48, 'rgba(255,255,255,.22)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  glowTextureCache = texture;
  return texture;
}

let zoneTextureCache: THREE.CanvasTexture | null = null;

export function createZoneTexture(): THREE.CanvasTexture {
  if (zoneTextureCache) return zoneTextureCache;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const center = 256;

  const wash = context.createRadialGradient(center, center, 30, center, center, 245);
  wash.addColorStop(0, 'rgba(255,255,255,.16)');
  wash.addColorStop(0.55, 'rgba(255,255,255,.055)');
  wash.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = wash;
  context.fillRect(0, 0, 512, 512);

  context.translate(center, center);
  context.lineCap = 'round';
  for (let ring = 0; ring < 3; ring++) {
    context.save();
    context.rotate(ring * 0.48);
    context.strokeStyle = `rgba(255,255,255,${0.42 - ring * 0.09})`;
    context.lineWidth = 5 - ring;
    context.setLineDash([70 + ring * 14, 22 + ring * 9, 18, 30]);
    context.beginPath();
    context.arc(0, 0, 126 + ring * 44, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
  for (let stroke = 0; stroke < 8; stroke++) {
    const angle = (stroke * Math.PI) / 4 + 0.2;
    context.strokeStyle = 'rgba(255,255,255,.2)';
    context.lineWidth = stroke % 2 === 0 ? 4 : 2;
    context.beginPath();
    context.moveTo(Math.cos(angle) * 54, Math.sin(angle) * 54);
    context.lineTo(Math.cos(angle) * 210, Math.sin(angle) * 210);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  zoneTextureCache = texture;
  return texture;
}

// ----  silhouette ----

export function createSilhouette(color: number, isTarget = false): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.12,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: isTarget ? 0x52615f : 0x283b39,
    roughness: 0.5,
    metalness: 0.28,
  });

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.36, 0.88, 10), material);
  robe.position.y = 0.46;
  robe.castShadow = true;
  group.add(robe);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.55, 10), accent);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), material);
  head.position.y = 1.47;
  head.castShadow = true;
  group.add(head);

  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.16), accent);
  shoulder.position.y = 1.25;
  shoulder.castShadow = true;
  group.add(shoulder);

  if (!isTarget) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.62, 8), material);
    sleeve.rotation.z = Math.PI * 0.42;
    sleeve.position.set(0.3, 1.04, 0);
    group.add(sleeve);

    const ribbonMaterial = new THREE.MeshBasicMaterial({
      color: 0x6e938b,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.12), ribbonMaterial);
    ribbon.position.set(-0.2, 0.82, -0.13);
    ribbon.rotation.y = -0.2;
    group.add(ribbon);
  }

  return group;
}

// ---- 线段工具 ----

export function createLine(
  points: THREE.Vector3[],
  color: number,
  opacity: number,
): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Line(geometry, material);
}

// ---- 对象操作 ----

export function setObjectOpacity(object: THREE.Object3D, opacity: number): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Sprite)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if ('opacity' in material) {
        material.transparent = true;
        material.opacity = opacity;
      }
    }
  });
}

export function setObjectColor(object: THREE.Object3D, color: THREE.ColorRepresentation): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Sprite)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if ('color' in material && material.color instanceof THREE.Color) material.color.set(color);
    }
  });
}

// ---- 粒子操作 ----

export function spawnParticle(
  state: SceneState,
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  life: number,
  color: THREE.ColorRepresentation,
): void {
  const particle = state.particles.find((item) => item.life <= 0);
  if (!particle) return;
  particle.position.copy(position);
  particle.velocity.copy(velocity);
  particle.life = life;
  particle.maxLife = life;
  particle.color.set(color);
}

export function updateParticleBuffer(state: SceneState): void {
  const positions = state.particleGeometry.attributes.position.array as Float32Array;
  const colors = state.particleGeometry.attributes.color.array as Float32Array;

  for (let index = 0; index < PARTICLE_COUNT; index++) {
    const particle = state.particles[index];
    const offset = index * 3;
    if (particle.life > 0) {
      const alpha = Math.min(1, particle.life / Math.max(0.001, particle.maxLife));
      positions[offset] = particle.position.x;
      positions[offset + 1] = particle.position.y;
      positions[offset + 2] = particle.position.z;
      colors[offset] = particle.color.r * alpha;
      colors[offset + 1] = particle.color.g * alpha;
      colors[offset + 2] = particle.color.b * alpha;
    } else {
      positions[offset] = 0;
      positions[offset + 1] = -50;
      positions[offset + 2] = 0;
      colors[offset] = 0;
      colors[offset + 1] = 0;
      colors[offset + 2] = 0;
    }
  }

  state.particleGeometry.attributes.position.needsUpdate = true;
  state.particleGeometry.attributes.color.needsUpdate = true;
}

export function updateParticles(state: SceneState, dt: number): void {
  for (const particle of state.particles) {
    if (particle.life <= 0) continue;
    particle.life -= dt;
    particle.position.addScaledVector(particle.velocity, dt);
    particle.velocity.multiplyScalar(Math.pow(0.93, dt * 60));
    particle.velocity.y -= 0.3 * dt;
  }
  updateParticleBuffer(state);
}

// ---- 拖尾 ----

export function updateTrail(state: SceneState, position: THREE.Vector3, color?: THREE.ColorRepresentation): void {
  state.trailPositions.unshift(position.clone());
  if (state.trailPositions.length > 26) state.trailPositions.pop();
  const positions = state.trailLine.geometry.attributes.position.array as Float32Array;
  for (let index = 0; index < 26; index++) {
    const point = state.trailPositions[Math.min(index, state.trailPositions.length - 1)] ?? position;
    positions[index * 3] = point.x;
    positions[index * 3 + 1] = point.y;
    positions[index * 3 + 2] = point.z;
  }
  state.trailLine.geometry.attributes.position.needsUpdate = true;
  state.trailLine.visible = state.trailPositions.length > 1;
  if (color !== undefined) {
    const mat = state.trailLine.material as THREE.LineBasicMaterial;
    mat.color.set(color);
  }
}

export function clearTransientGroup(group: THREE.Group): void {
  for (const child of [...group.children]) {
    child.traverse((object) => {
      const disposable = object as THREE.Object3D & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };
      disposable.geometry?.dispose();
      if (Array.isArray(disposable.material)) {
        for (const material of disposable.material) material.dispose();
      } else {
        disposable.material?.dispose();
      }
    });
    group.remove(child);
  }
}

// ---- 重置 ----

export function resetVisuals(state: SceneState): void {
  state.caster.position.set(CAST_POS.x, 0, CAST_POS.z);
  state.caster.rotation.set(0, Math.PI / 2, 0);
  state.caster.scale.setScalar(1);
  state.caster.visible = true;
  state.target.position.set(TARGET_POS.x, 0, TARGET_POS.z);
  state.target.rotation.set(0, -Math.PI / 2, 0);
  state.target.scale.setScalar(1);
  state.targetCore.scale.setScalar(1);
  state.targetCore.visible = false;
  if (state.targetCore.material instanceof THREE.Material) {
    state.targetCore.material.opacity = 0;
  }
  state.impactGlow.visible = false;
  state.impactGlow.material.opacity = 0;
  state.impactGlow.scale.setScalar(1);
  state.chargeGlow.visible = false;
  state.chargeGlow.material.opacity = 0;
  state.chargeGlow.scale.setScalar(1);
  state.energyLight.intensity = 0;
  state.camera.position.copy(state.baseCamera);
  state.trailLine.visible = false;
  state.trailPositions.length = 0;

  // 清空形态层
  clearTransientGroup(state.formGroup);
  // 清空 Cue 层
  clearTransientGroup(state.forwardCueGroup);
  clearTransientGroup(state.backwardCueGroup);

  for (const particle of state.particles) particle.life = 0;
  updateParticleBuffer(state);
}

// ---- 粒子发射辅助 ----

export function emitChargeParticles(
  state: SceneState,
  color: THREE.ColorRepresentation,
  _secondaryColor: THREE.ColorRepresentation | undefined,
  count: number,
  speed: number,
  dt: number,
): void {
  const n = Math.max(1, Math.round(count * dt * 0.45));
  const speedScale = THREE.MathUtils.clamp(speed / 1.6, 0.65, 1.55);
  for (let index = 0; index < n; index++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.45 + Math.random() * 0.65;
    const origin = new THREE.Vector3(
      CAST_POS.x + Math.cos(angle) * radius,
      CAST_POS.y - 0.1 + Math.random() * 1.2,
      CAST_POS.z + Math.sin(angle) * radius * 0.55,
    );
    const velocity = CAST_POS.clone()
      .sub(origin)
      .multiplyScalar((0.65 + Math.random() * 0.65) * speedScale);
    velocity.y += 0.18;
    spawnParticle(state, origin, velocity, 0.5 + Math.random() * 0.55, color);
  }
}

export function emitTravelParticles(
  state: SceneState,
  point: THREE.Vector3,
  direction: THREE.Vector3,
  color: THREE.ColorRepresentation,
  secondaryColor: THREE.ColorRepresentation | undefined,
  count: number,
  speed: number,
  dt: number,
): void {
  const n = Math.max(1, Math.round(count * dt * 0.62));
  const speedScale = THREE.MathUtils.clamp(speed / 1.6, 0.65, 1.55);
  for (let index = 0; index < n; index++) {
    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * 0.18,
      (Math.random() - 0.5) * 0.18,
      (Math.random() - 0.5) * 0.24,
    );
    const velocity = direction.clone()
      .multiplyScalar((-0.45 - Math.random() * 0.65) * speedScale)
      .add(jitter);
    spawnParticle(
      state,
      point.clone().add(jitter),
      velocity,
      0.24 + Math.random() * 0.34,
      Math.random() > 0.25 ? color : (secondaryColor ?? color),
    );
  }
}

export function emitImpactParticles(
  state: SceneState,
  color: THREE.ColorRepresentation,
  secondaryColor: THREE.ColorRepresentation | undefined,
  count: number,
  speed: number,
  hasBurst: boolean,
  multiplier = 1,
): void {
  const total = Math.min(170, Math.round(count * (hasBurst ? 1.5 : 0.9) * multiplier));
  const speedScale = THREE.MathUtils.clamp(speed / 1.6, 0.7, 1.45);
  for (let index = 0; index < total; index++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const spd = (0.8 + Math.random() * 3.8) * (hasBurst ? 1.25 : 0.82) * speedScale;
    const velocity = new THREE.Vector3(
      Math.cos(theta) * Math.sin(phi) * spd,
      Math.abs(Math.cos(phi)) * spd + 0.3,
      Math.sin(theta) * Math.sin(phi) * spd,
    );
    spawnParticle(
      state,
      TARGET_POS.clone().add(new THREE.Vector3(0, 0.05, 0)),
      velocity,
      0.5 + Math.random() * 0.8,
      Math.random() > 0.42 ? color : (secondaryColor ?? 0xffffff),
    );
  }
}

// ---- 清除纹理缓存（用于测试） ----

export function clearTextureCache(): void {
  glowTextureCache?.dispose();
  glowTextureCache = null;
  zoneTextureCache?.dispose();
  zoneTextureCache = null;
}
