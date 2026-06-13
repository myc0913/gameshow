// ============================================================
// V6 SkillScene — Three.js 技能动画组件
// 接受 AnimationSpec，按 form 选择 9 种形态模板渲染
// ============================================================

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';
import type { AnimationSpec } from '../types/v6.ts';
import type { SceneState, Particle } from '../animations/shared.ts';
import {
  PARTICLE_COUNT,
  CAST_POS,
  TARGET_POS,
  DURATION_PADDING,
  createGlowTexture,
  createSilhouette,
  clearTransientGroup,
  updateParticles,
  resetVisuals,
} from '../animations/shared.ts';
import { FORM_RENDERERS } from '../animations/index.ts';
import { renderForwardCue, renderBackwardCue } from '../animations/cues.ts';
import {
  FORM_LABELS,
  ELEMENT_LABELS_V6,
} from '../engine/v6/finalizeGeneratedSkill.ts';
import { ELEMENT_PALETTES } from '../data/v6/baseSkills.ts';
import { VISUAL_CUE_LABELS } from '../data/v6/namingLexicon.ts';

// ---- 公开接口 ----

export interface SkillSceneHandle {
  replay: () => void;
}

interface SkillSceneProps {
  spec: AnimationSpec | null;
  autoPlay: boolean;
  skillName?: string;
  skillIndex?: number;
  previewSource?: string;
  isActive?: boolean;
  replayToken?: number;
}

// ---- 组件 ----

export const SkillScene = forwardRef<SkillSceneHandle, SkillSceneProps>(
  function SkillScene(
    {
      spec,
      autoPlay,
      skillName,
      skillIndex = 0,
      previewSource = '当前构筑',
      isActive = true,
      replayToken = 0,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef<SceneState | null>(null);
    const frameRef = useRef(0);
    const activeRef = useRef(isActive);

    // ---- 生命周期：场景初始化 ----

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // 渲染器
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // 场景
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x081011, 0.075);

      // 相机
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
      const baseCamera = new THREE.Vector3(4.8, 3.05, 6.45);
      camera.position.copy(baseCamera);
      camera.lookAt(0.05, 0.72, 0);

      // 灯光
      scene.add(new THREE.HemisphereLight(0xa5c8c1, 0x11100e, 1.25));
      const keyLight = new THREE.DirectionalLight(0xdce8e2, 2.2);
      keyLight.position.set(-2, 6, 4);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0x8e5c43, 1.6, 12);
      rimLight.position.set(2.5, 2.2, -3);
      scene.add(rimLight);
      const energyLight = new THREE.PointLight(0xffffff, 0, 8);
      energyLight.position.copy(TARGET_POS);
      scene.add(energyLight);

      // 地面
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x111a1a,
        roughness: 0.92,
        metalness: 0.08,
      });
      const ground = new THREE.Mesh(new THREE.CircleGeometry(6.2, 64), groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // 平台
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(3.7, 3.9, 0.12, 64),
        new THREE.MeshStandardMaterial({
          color: 0x152020,
          roughness: 0.78,
          metalness: 0.2,
        }),
      );
      platform.position.y = -0.08;
      platform.receiveShadow = true;
      scene.add(platform);

      const platformRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.25, 0.018, 6, 96),
        new THREE.MeshBasicMaterial({
          color: 0x547069,
          transparent: true,
          opacity: 0.18,
        }),
      );
      platformRing.rotation.x = Math.PI / 2;
      platformRing.position.y = 0.01;
      scene.add(platformRing);

      // 装饰石柱
      for (let index = 0; index < 8; index++) {
        const angle = (index / 8) * Math.PI * 2;
        const stone = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.04, 0.58 + (index % 3) * 0.18),
          new THREE.MeshStandardMaterial({ color: 0x1f2a29, roughness: 0.95 }),
        );
        stone.position.set(Math.cos(angle) * 2.7, 0.015, Math.sin(angle) * 2.7);
        stone.rotation.y = -angle;
        scene.add(stone);
      }

      // 施法者 silhouette
      const caster = createSilhouette(0x182222);
      caster.position.set(CAST_POS.x, 0, CAST_POS.z);
      caster.rotation.y = Math.PI / 2;
      scene.add(caster);

      // 目标 silhouette
      const target = createSilhouette(0x303a39, true);
      target.position.set(TARGET_POS.x, 0, TARGET_POS.z);
      target.rotation.y = -Math.PI / 2;
      scene.add(target);

      // 目标核心
      const targetCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      targetCore.position.copy(TARGET_POS);
      scene.add(targetCore);

      // 蓄力光晕
      const glowTexture = createGlowTexture();
      const chargeGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      chargeGlow.position.copy(CAST_POS);
      scene.add(chargeGlow);

      // 命中光晕
      const impactGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      impactGlow.position.copy(TARGET_POS);
      scene.add(impactGlow);

      // 形态层
      const formGroup = new THREE.Group();
      scene.add(formGroup);

      // Cue 层
      const forwardCueGroup = new THREE.Group();
      scene.add(forwardCueGroup);
      const backwardCueGroup = new THREE.Group();
      scene.add(backwardCueGroup);

      // 粒子系统
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3),
      );
      particleGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3),
      );
      const particlePoints = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          size: 0.055,
          map: glowTexture,
          vertexColors: true,
          transparent: true,
          opacity: 0.86,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        }),
      );
      scene.add(particlePoints);
      const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
        color: new THREE.Color(),
      }));

      // 拖尾
      const trailGeometry = new THREE.BufferGeometry();
      trailGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(26 * 3), 3),
      );
      const trailLine = new THREE.Line(
        trailGeometry,
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      scene.add(trailLine);

      // 组装状态
      const state: SceneState = {
        renderer,
        scene,
        camera,
        baseCamera,
        clock: new THREE.Clock(),
        caster,
        target,
        targetCore,
        energyLight,
        chargeGlow,
        impactGlow,
        formGroup,
        forwardCueGroup,
        backwardCueGroup,
        particlePoints,
        particleGeometry,
        particles,
        trailLine,
        trailPositions: [],
        currentSpec: null,
        elapsed: 0,
        isPlaying: false,
        impactTriggered: false,
      };
      stateRef.current = state;
      resetVisuals(state);

      // 响应式尺寸
      const resize = () => {
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      resize();

      // ---- 动画主循环 ----

      const updateScene = (): void => {
        const dt = Math.min(state.clock.getDelta(), 0.05);
        const currentSpec = state.currentSpec;

        if (state.isPlaying && currentSpec) {
          state.elapsed += dt;
          const totalDuration =
            currentSpec.timing.windupSeconds +
            currentSpec.timing.travelSeconds +
            currentSpec.timing.lingerSeconds +
            DURATION_PADDING;

          // 派发到形态渲染器
          const renderer = FORM_RENDERERS[currentSpec.form];
          if (renderer) {
            renderer(state, currentSpec, state.elapsed, dt);
          }

          // 前向 Cue（传播阶段）
          const travelStart = currentSpec.timing.windupSeconds;
          const travelEnd = travelStart + currentSpec.timing.travelSeconds;
          if (
            currentSpec.forwardCue &&
            state.elapsed > travelStart &&
            state.elapsed < travelEnd
          ) {
            const progress = (state.elapsed - travelStart) / currentSpec.timing.travelSeconds;
            renderForwardCue(state, currentSpec, progress);
          } else {
            clearTransientGroup(state.forwardCueGroup);
          }

          // 后向 Cue（余韵阶段）
          if (
            currentSpec.backwardCue &&
            state.elapsed > travelEnd
          ) {
            const impactAge = state.elapsed - travelEnd;
            renderBackwardCue(state, currentSpec, impactAge);
          } else {
            clearTransientGroup(state.backwardCueGroup);
          }

          // 更新粒子
          updateParticles(state, dt);

          // 动画结束
          if (state.elapsed >= totalDuration) {
            state.isPlaying = false;
            state.camera.position.copy(state.baseCamera);
            state.energyLight.intensity = 0.2;
            // 清空 Cue 层
            clearTransientGroup(state.forwardCueGroup);
            clearTransientGroup(state.backwardCueGroup);
          }
        } else {
          // 空闲动画
          const idle = performance.now() * 0.001;
          state.caster.position.y = Math.sin(idle * 1.2) * 0.008;
          state.targetCore.visible = false;
        }
      };

      const render = () => {
        frameRef.current = requestAnimationFrame(render);
        if (!activeRef.current) return;
        updateScene();
        renderer.render(scene, camera);
      };
      render();

      // 清理
      return () => {
        cancelAnimationFrame(frameRef.current);
        observer.disconnect();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
            object.geometry?.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
              material.dispose();
            });
          }
          if (object instanceof THREE.Sprite) {
            object.material.map?.dispose();
            object.material.dispose();
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    }, []);

    // ---- 播放控制 ----

    const playAnimation = useCallback(() => {
      const state = stateRef.current;
      if (!state?.currentSpec) return;
      resetVisuals(state);
      state.elapsed = 0;
      state.isPlaying = true;
      state.impactTriggered = false;
      state.clock.start();
    }, []);

    useImperativeHandle(ref, () => ({ replay: playAnimation }), [playAnimation]);

    // ---- isActive 切换 ----

    useEffect(() => {
      activeRef.current = isActive;
      if (isActive && stateRef.current) {
        stateRef.current.clock.start();
      }
    }, [isActive]);

    // ---- spec 变更时自动播放 ----

    useEffect(() => {
      const state = stateRef.current;
      if (!state) return;
      state.isPlaying = false;
      resetVisuals(state);
      state.currentSpec = spec;
      if (spec && autoPlay) {
        const timer = window.setTimeout(playAnimation, 70);
        return () => window.clearTimeout(timer);
      }
    }, [spec, autoPlay, replayToken, playAnimation]);

    // ---- 标签计算 ----

    const formLabel: string = spec
      ? (FORM_LABELS[spec.form] ?? spec.form)
      : '等待固化';
    // ---- JSX ----

    return (
      <div className="panel animation-panel">
        <div className="scene-heading">
          <div>
            <span className="section-eyebrow">LIVE COMBAT PREVIEW</span>
            <h3>当前演武</h3>
          </div>
          <div className="scene-heading__meta">
            <span>{previewSource}</span>
            <strong>{skillName ?? '尚未选择技能'}</strong>
          </div>
          {spec && (
            <button className="btn-replay" onClick={playAnimation}>
              重播
            </button>
          )}
        </div>

        <div className="skill-canvas-wrapper">
          <div ref={containerRef} className="skill-canvas" />
          <div className="scene-vignette" />
          <div className="scene-status">
            <span>技能 {String(skillIndex + 1).padStart(2, '0')}</span>
            <i />
            <strong>{formLabel}</strong>
          </div>

          {/* 动画图例：主体 / 前向Cue / 后向Cue */}
          {spec && (
            <div className="scene-legend">
              <span
                className="scene-legend__item scene-legend__body"
                style={{ color: spec.primaryPalette[0] }}
              >
                {ELEMENT_LABELS_V6[spec.primaryElement]}
              </span>
              {spec.forwardCue && (
                <span
                  className="scene-legend__item scene-legend__cue"
                  style={{
                    color: ELEMENT_PALETTES[spec.forwardCue.sourceElement].primary,
                  }}
              >
                  前向 · {VISUAL_CUE_LABELS[spec.forwardCue.visualCue]}
                </span>
              )}
              {spec.backwardCue && (
                <span
                  className="scene-legend__item scene-legend__cue"
                  style={{
                    color: ELEMENT_PALETTES[spec.backwardCue.sourceElement].primary,
                  }}
              >
                  后向 · {VISUAL_CUE_LABELS[spec.backwardCue.visualCue]}
                </span>
              )}
            </div>
          )}

          <div className="scene-timeline">
            <span>蓄势</span>
            <i />
            <span>出手</span>
            <i />
            <span>命中</span>
            <i />
            <span>余韵</span>
          </div>
          {!spec && (
            <div className="skill-canvas__empty">
              <span>演</span>
              <strong>等待技能固化</strong>
              <p>选择种子后，这里将演示当前技能的释放形态。</p>
            </div>
          )}
        </div>
      </div>
    );
  },
);
