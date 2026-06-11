import type { Rune, RuneId } from '../types/rune.ts';

/**
 * MVP 6 枚符文。
 * vector 索引对应 VECTOR_DIMS 顺序：
 *   [spread, dot, burst, slow, crystallize, zoneControl,
 *    chain, delay, instantBurst, pierce, bind, structure,
 *    conditional, markAmplify, displacement, haste]
 */
export const RUNES: Record<RuneId, Rune> = {
  fire: {
    id: 'fire',
    name: '火焰符文',
    shortName: '火',
    color: '#ff4444',
    secondaryColor: '#ff8844',
    tendency: '扩散、持续伤害、爆裂',
    intuition: '范围燃烧、爆炸',
    vector: [
      0.70, 0.80, 0.75, 0.05, 0.00, 0.10,
      0.00, 0.00, 0.15, 0.00, 0.00, 0.00,
      0.00, 0.00, 0.10, 0.05,
    ],
  },
  frost: {
    id: 'frost',
    name: '冰霜符文',
    shortName: '冰',
    color: '#44aaff',
    secondaryColor: '#88ccff',
    tendency: '减速、凝结、区域控制',
    intuition: '冰冻、控场',
    vector: [
      0.10, 0.10, 0.05, 0.85, 0.80, 0.70,
      0.00, 0.00, 0.00, 0.00, 0.55, 0.15,
      0.00, 0.00, 0.00, 0.00,
    ],
  },
  lightning: {
    id: 'lightning',
    name: '雷电符文',
    shortName: '雷',
    color: '#ffff44',
    secondaryColor: '#ccccff',
    tendency: '连锁、延迟、瞬时爆发',
    intuition: '弹跳、爆发',
    vector: [
      0.05, 0.00, 0.10, 0.00, 0.00, 0.10,
      0.85, 0.65, 0.80, 0.00, 0.00, 0.00,
      0.00, 0.00, 0.20, 0.40,
    ],
  },
  stone: {
    id: 'stone',
    name: '岩石符文',
    shortName: '岩',
    color: '#aa8844',
    secondaryColor: '#ccaa66',
    tendency: '穿刺、固定、结构',
    intuition: '地刺、护壁、禁锢',
    vector: [
      0.00, 0.00, 0.00, 0.10, 0.05, 0.35,
      0.00, 0.00, 0.00, 0.85, 0.65, 0.85,
      0.00, 0.00, 0.10, 0.00,
    ],
  },
  shadow: {
    id: 'shadow',
    name: '暗影符文',
    shortName: '影',
    color: '#8844cc',
    secondaryColor: '#aa66ee',
    tendency: '条件触发、标记增幅',
    intuition: '标记、处决、伏击',
    vector: [
      0.00, 0.40, 0.10, 0.10, 0.05, 0.10,
      0.00, 0.45, 0.10, 0.00, 0.10, 0.00,
      0.85, 0.80, 0.05, 0.00,
    ],
  },
  wind: {
    id: 'wind',
    name: '疾风符文',
    shortName: '风',
    color: '#44dd44',
    secondaryColor: '#88ee88',
    tendency: '位移、加速、击退',
    intuition: '推开、冲刺、风刃',
    vector: [
      0.45, 0.00, 0.00, 0.00, 0.00, 0.10,
      0.35, 0.00, 0.10, 0.00, 0.00, 0.00,
      0.00, 0.00, 0.85, 0.80,
    ],
  },
};

/** 按 id 获取符文向量 */
export function getRuneVector(id: RuneId): number[] {
  return RUNES[id].vector;
}
