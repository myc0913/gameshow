/** 基础元素类型 */
export type RuneElement = 'fire' | 'frost' | 'lightning' | 'wind';

/** 单个符文 */
export interface Rune {
  id: string;
  name: string;
  element: RuneElement;
  /** 语义向量各维度值，A1 阶段填充 */
  vector: number[];
}
