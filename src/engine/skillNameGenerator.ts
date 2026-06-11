import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';
import { ELEMENT_WORDS, DIM_WORDS } from '../data/nameWords.ts';
import { RUNES } from '../data/runes.ts';

/**
 * 生成技能名称。
 * 规则：主导元素词 + Top 维度词 + 次级元素词 = 3 字名称。
 * 禁止完整排列查表。
 */
export function generateSkillName(
  runeIds: RuneId[],
  topDims: Array<{ dim: VectorDim; value: number }>,
): string {
  const primaryRune = runeIds[0];
  const secondaryRune = runeIds[runeIds.length - 1];

  const primaryWords = ELEMENT_WORDS[primaryRune];
  const primaryWord =
    primaryWords[Math.floor((topDims[0]?.value ?? 0) * 10) % primaryWords.length];

  const secondaryWords = ELEMENT_WORDS[secondaryRune];
  const secondaryWord =
    secondaryWords[
      Math.floor(((topDims[1]?.value ?? 0) * 7 + 1) % secondaryWords.length)
    ];

  const dimWords = DIM_WORDS[topDims[0].dim];
  const dimWord = dimWords[Math.floor((topDims[0].value * 13) % dimWords.length)];

  if (primaryRune === secondaryRune) {
    return `${primaryWord}${dimWord}`;
  }

  return `${primaryWord}${dimWord}${secondaryWord}`;
}

/**
 * 生成技能描述文本。
 */
export function generateDescription(
  runeIds: RuneId[],
  tags: string[],
  topDims: Array<{ dim: VectorDim; value: number }>,
): string {
  const runeNames = runeIds.map((id) => RUNES[id].shortName).join('→');
  const tagText = tags.length > 0 ? tags.slice(0, 3).join('、') : '混合';
  const mainDim = topDims[0];
  return `${runeNames} 顺序铭刻，产生以 ${mainDim.dim} 为主导的 ${tagText} 技能。`;
}
