import { dot, softmax } from './vectorMath.ts';
import type { PositionedVector } from './positionEncoding.ts';

/** 顺序偏置：相邻后续 +0.30，一般后续 +0.12，反向 -0.08 */
function orderBias(i: number, j: number): number {
  if (j === i + 1) return 0.3;
  if (j > i) return 0.12;
  if (j < i) return -0.08;
  return 0;
}

/**
 * 槽位聚合权重：首尾槽位主导，中间槽位辅助。
 * 权重和为 1.0。
 */
const SLOT_AGGREGATION_WEIGHTS = [0.60, 0.15, 0.05, 0.20];

/** Softmax 温度：<1.0 锐化注意力分布，增强位置敏感性 */
const ATTENTION_TEMPERATURE = 0.6;

/**
 * 简化的自注意力机制。
 * 实现合约 engine-pipeline.md §6.2 的步骤：
 * 1. 计算两两交互分数 score(i,j) = dot(v_i, v_j) / sqrt(dim) + orderBias(i,j)
 * 2. 温度锐化 + softmax → attention weights
 * 3. 加权聚合：每个 query 位置对所有 value 的加权和
 * 4. 按槽位权重加权平均（首尾槽位权重大，产生顺序敏感结果）
 * 5. 增益放大使值域匹配标签阈值
 */
export function computeAttention(
  positions: PositionedVector[],
): {
  finalVector: number[];
  interactionScores: number[][];
  attentionWeights: number[][];
} {
  const n = positions.length;
  const vectors = positions.map((p) => p.vector);
  const dim = vectors[0].length;

  // 1. 计算交互分数矩阵
  const scores: number[][] = [];
  for (let i = 0; i < n; i++) {
    scores[i] = [];
    for (let j = 0; j < n; j++) {
      scores[i][j] =
        dot(vectors[i], vectors[j]) / Math.sqrt(dim) + orderBias(i, j);
    }
  }

  // 2. 温度锐化 + softmax → attention weights
  const weights: number[][] = scores.map((row) =>
    softmax(row.map((s) => s / ATTENTION_TEMPERATURE)),
  );

  // 3. 加权聚合 + 槽位加权平均
  const GAIN = 1.0; // 增益因子：60%起源权重已充足放大，无需额外增益
  const finalVector: number[] = new Array(dim).fill(0);
  for (let i = 0; i < n; i++) {
    const slotWeight = SLOT_AGGREGATION_WEIGHTS[i];
    for (let d = 0; d < dim; d++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += weights[i][j] * vectors[j][d];
      }
      finalVector[d] += slotWeight * sum * GAIN;
    }
  }

  return { finalVector, interactionScores: scores, attentionWeights: weights };
}
