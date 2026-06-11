/** 16 维语义向量维度列表 */
export const VECTOR_DIMS = [
  'spread',
  'dot',
  'burst',
  'slow',
  'crystallize',
  'zoneControl',
  'chain',
  'delay',
  'instantBurst',
  'pierce',
  'bind',
  'structure',
  'conditional',
  'markAmplify',
  'displacement',
  'haste',
] as const;

/** 向量维度名称类型 */
export type VectorDim = (typeof VECTOR_DIMS)[number];
