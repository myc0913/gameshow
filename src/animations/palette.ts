// ============================================================
// V6 调色板工具 — 将 hex 色板转换为 Three.js 材质
// ============================================================

import * as THREE from 'three';

/** 将 "#rrggbb" 格式转换为 THREE.Color */
export function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(parseInt(hex.slice(1), 16));
}

/** 将 "#rrggbb" 格式转换为数字颜色（用于 material.color.set） */
export function hexToNumber(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

/**
 * 根据 3 色调色板创建材质三元组：
 * - primary: 主体材质（不透明 / additive）
 * - highlight: 高光材质（additive blending）
 * - shadow: 阴影/边缘材质
 */
export interface PaletteMaterials {
  primary: THREE.Color;
  highlight: THREE.Color;
  shadow: THREE.Color;
}

export function paletteToColors(palette: string[]): PaletteMaterials {
  return {
    primary: hexToThreeColor(palette[0] ?? '#ffffff'),
    highlight: hexToThreeColor(palette[1] ?? '#ffffff'),
    shadow: hexToThreeColor(palette[2] ?? '#888888'),
  };
}

/**
 * 创建带有调色板颜色的 additive 材质
 */
export function createAdditiveMaterial(hex: string, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: hexToNumber(hex),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * 创建 Sprite 材质（用于光晕）
 */
export function createGlowSpriteMaterial(
  hex: string,
  map: THREE.Texture,
  opacity = 0.7,
): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map,
    color: hexToNumber(hex),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
