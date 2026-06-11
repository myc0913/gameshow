import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';
import { VECTOR_DIMS } from '../data/vectorDims.ts';
import { clamp, getTopDims } from './vectorMath.ts';

/** 槽位角色 */
export type SlotRole = 'origin' | 'shape' | 'trigger' | 'finish';

/** 4 槽位角色顺序 */
export const SLOT_ROLES: SlotRole[] = ['origin', 'shape', 'trigger', 'finish'];

/** 槽位倍率：首尾增幅大，中间递减，形成强位置信号 */
export const SLOT_MULTIPLIERS: Record<SlotRole, number> = {
  origin: 1.5,
  shape: 1.0,
  trigger: 0.7,
  finish: 1.4,
};

/** 槽位额外维度偏置（配套放大） */
export const SLOT_DIM_BONUS: Record<SlotRole, Partial<Record<VectorDim, number>>> = {
  origin: { instantBurst: 0.25, haste: 0.22, displacement: 0.18 },
  shape: { spread: 0.22, zoneControl: 0.24, structure: 0.18 },
  trigger: { delay: 0.25, chain: 0.22, conditional: 0.20 },
  finish: { burst: 0.25, bind: 0.20, markAmplify: 0.20 },
};

/** 编码后的符文向量 */
export type PositionedVector = {
  slotIndex: number;
  runeId: RuneId;
  role: SlotRole;
  vector: number[];
  topDims: Array<{ dim: VectorDim; value: number }>;
};

/** 对 4 枚符文应用位置编码 */
export function applyPositionEncoding(
  runeIds: RuneId[],
  getVector: (id: RuneId) => number[],
): PositionedVector[] {
  return runeIds.map((runeId, i) => {
    const role = SLOT_ROLES[i];
    const baseVector = getVector(runeId);
    const multiplier = SLOT_MULTIPLIERS[role];
    const bonus = SLOT_DIM_BONUS[role];

    const vector = baseVector.map((v, dimIndex) => {
      const dimName = VECTOR_DIMS[dimIndex];
      const b = bonus[dimName] ?? 0;
      return clamp(v * multiplier + b, -1, 1.25);
    });

    const topDims = getTopDims(vector, 3);

    return { slotIndex: i, runeId, role, vector, topDims };
  });
}
