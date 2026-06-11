/** 符文 ID — MVP 固定 6 种 */
export type RuneId = 'fire' | 'frost' | 'lightning' | 'stone' | 'shadow' | 'wind';

/** 单个符文定义 */
export type Rune = {
  id: RuneId;
  name: string;
  shortName: string;
  color: string;
  secondaryColor: string;
  tendency: string;
  intuition: string;
  /** 16 维语义向量，索引对应 VECTOR_DIMS 顺序 */
  vector: number[];
};
