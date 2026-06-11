import type { VectorDim } from '../data/vectorDims.ts';
import { VECTOR_DIMS } from '../data/vectorDims.ts';

/** 两等长向量点积 */
export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/** 数值稳定 softmax */
export function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

/** L2 归一化 */
export function normalize(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (mag === 0) return vec.map(() => 0);
  return vec.map((v) => v / mag);
}

/** Max-scale 归一化：除以最大绝对值，保持值域在 [-1, 1] 且保留相对比例 */
export function normalizeMax(vec: number[]): number[] {
  const maxAbs = Math.max(...vec.map((v) => Math.abs(v)));
  if (maxAbs === 0) return vec.map(() => 0);
  return vec.map((v) => v / maxAbs);
}

/** Clamp 到 [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 0-1 值映射到 0-100，clamp */
export function scale01(value: number): number {
  return clamp(Math.round(value * 100), 0, 100);
}

/** 四舍五入到指定小数位 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** 获取向量 Top N 维度 */
export function getTopDims(
  vector: number[],
  n: number,
): Array<{ dim: VectorDim; value: number }> {
  return vector
    .map((value, i) => ({ dim: VECTOR_DIMS[i], value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

/** 将 number[] 转为 Record<VectorDim, number> */
export function toDimRecord(vector: number[]): Record<VectorDim, number> {
  const record = {} as Record<VectorDim, number>;
  for (let i = 0; i < VECTOR_DIMS.length; i++) {
    record[VECTOR_DIMS[i]] = vector[i];
  }
  return record;
}
