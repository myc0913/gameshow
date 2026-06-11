# A1 引擎核心实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现规则引擎全部纯函数，使 `generateSkill()` 对相同符文不同顺序产生明显不同的技能结果。

**Architecture:** 三层依赖——types（类型定义）→ data（常量数据）→ engine（纯函数管道）。engine 内部依赖链：vectorMath → positionEncoding → attentionEngine → skillDecoder + skillNameGenerator + specialResonance → skillGenerator（总装）。

**Tech Stack:** TypeScript 5+, 纯函数，无外部依赖（仅 Node 内置 crypto 用于 seed 可复现）

---

## 文件结构总览

```
src/
  types/
    rune.ts          — [修改] 替换为完整 RuneId / Rune 类型
    skill.ts          — [修改] 替换为完整 GeneratedSkill / SkillParams / Trace 等类型
  data/
    vectorDims.ts     — [新建] VECTOR_DIMS 常量 + VectorDim 类型
    runes.ts          — [新建] 6 枚符文定义（含 16 维向量）
    nameWords.ts      — [新建] 命名词库
  engine/
    vectorMath.ts     — [新建] dot / softmax / normalize / clamp / scale01 / getTopDims
    positionEncoding.ts — [新建] 槽位角色、倍率、维度偏置
    attentionEngine.ts  — [新建] 交互分数 + 简化注意力
    skillDecoder.ts     — [新建] 标签解码 + 参数解码
    skillNameGenerator.ts — [新建] 基于元素+维度生成技能名
    specialResonance.ts  — [新建] 特殊共鸣规则（≤3条）
    skillGenerator.ts    — [新建] 总装 generateSkill() 纯函数

scripts/
  verify-engine.ts   — [新建] A/B 对比验证脚本
```

---

### Task 1: 重写 `src/types/rune.ts`

**Files:**
- Modify: `src/types/rune.ts`

- [ ] **Step 1: 替换为完整类型定义**

```ts
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
```

- [ ] **Step 2: 验证类型编译通过**

```bash
npx tsc --noEmit
```

---

### Task 2: 重写 `src/types/skill.ts`

**Files:**
- Modify: `src/types/skill.ts`

- [ ] **Step 1: 替换为完整合约类型**

```ts
import type { RuneId } from './rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';

/** generateSkill() 输入 */
export type GenerateSkillInput = {
  runeIds: RuneId[];
  seed?: string;
};

/** 技能参数 */
export type SkillParams = {
  damageType: '火焰' | '冰霜' | '雷电' | '岩石' | '暗影' | '疾风' | '混合';
  rangePower: number;
  controlPower: number;
  burstPower: number;
  chainCount: number;
  delaySeconds: number;
  hasCondition: boolean;
  hasDisplacement: boolean;
  hasKnockback: boolean;
  hasBind: boolean;
};

/** 技能动画参数 */
export type SkillAnimationParams = {
  primaryColor: string;
  secondaryColor: string;
  particleCount: number;
  spreadRadius: number;
  burstIntensity: number;
  chainCount: number;
};

/** 生成过程 trace */
export type SkillGenerationTrace = {
  positionedVectors: Array<{
    slotIndex: number;
    runeId: RuneId;
    role: 'origin' | 'shape' | 'trigger' | 'finish';
    topDims: Array<{ dim: VectorDim; value: number }>;
  }>;
  interactionScores: number[][];
  attentionWeights: number[][];
  finalTopDims: Array<{ dim: VectorDim; value: number }>;
  decodeReasons: string[];
};

/** 特殊共鸣结果 */
export type SpecialResonanceResult = {
  id: string;
  label: string;
  explanation: string;
};

/** generateSkill() 输出 */
export type GeneratedSkill = {
  id: string;
  runeIds: RuneId[];
  name: string;
  description: string;
  tags: string[];
  params: SkillParams;
  finalVector: Record<VectorDim, number>;
  topDims: Array<{ dim: VectorDim; value: number }>;
  trace: SkillGenerationTrace;
  resonance?: SpecialResonanceResult;
  animationParams: SkillAnimationParams;
};
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

**注意：** 此时编译会因 `../data/vectorDims.ts` 不存在而失败。这是预期行为——继续 Task 3。

---

### Task 3: 创建 `src/data/vectorDims.ts`

**Files:**
- Create: `src/data/vectorDims.ts`

- [ ] **Step 1: 写入向量维度定义**

```ts
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
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

现在 Task 2 的类型错误应已消除。

---

### Task 4: 创建 `src/data/runes.ts`

**Files:**
- Create: `src/data/runes.ts`

- [ ] **Step 1: 写入 6 枚符文定义**

每枚符文包含完整的 16 维向量。向量值域 [0, 1]，主要维度值 > 0.7，次要维度 0.3–0.5，无关维度 < 0.15。

```ts
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
      0.85, 0.80, 0.75, 0.05, 0.00, 0.10, // spread, dot, burst, slow, crystallize, zoneControl
      0.00, 0.00, 0.15, 0.00, 0.00, 0.00, // chain, delay, instantBurst, pierce, bind, structure
      0.00, 0.00, 0.10, 0.05,               // conditional, markAmplify, displacement, haste
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
      0.10, 0.10, 0.05, 0.85, 0.80, 0.70, // spread, dot, burst, slow, crystallize, zoneControl
      0.00, 0.00, 0.00, 0.00, 0.55, 0.15, // chain, delay, instantBurst, pierce, bind, structure
      0.00, 0.00, 0.00, 0.00,               // conditional, markAmplify, displacement, haste
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
      0.05, 0.00, 0.10, 0.00, 0.00, 0.10, // spread, dot, burst, slow, crystallize, zoneControl
      0.85, 0.65, 0.80, 0.00, 0.00, 0.00, // chain, delay, instantBurst, pierce, bind, structure
      0.00, 0.00, 0.20, 0.40,               // conditional, markAmplify, displacement, haste
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
      0.00, 0.00, 0.00, 0.10, 0.05, 0.35, // spread, dot, burst, slow, crystallize, zoneControl
      0.00, 0.00, 0.00, 0.85, 0.65, 0.85, // chain, delay, instantBurst, pierce, bind, structure
      0.00, 0.00, 0.10, 0.00,               // conditional, markAmplify, displacement, haste
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
      0.00, 0.40, 0.10, 0.10, 0.05, 0.10, // spread, dot, burst, slow, crystallize, zoneControl
      0.00, 0.45, 0.10, 0.00, 0.10, 0.00, // chain, delay, instantBurst, pierce, bind, structure
      0.85, 0.80, 0.05, 0.00,               // conditional, markAmplify, displacement, haste
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
      0.45, 0.00, 0.00, 0.00, 0.00, 0.10, // spread, dot, burst, slow, crystallize, zoneControl
      0.35, 0.00, 0.10, 0.00, 0.00, 0.00, // chain, delay, instantBurst, pierce, bind, structure
      0.00, 0.00, 0.85, 0.80,               // conditional, markAmplify, displacement, haste
    ],
  },
};

/** 按 id 获取符文向量 */
export function getRuneVector(id: RuneId): number[] {
  return RUNES[id].vector;
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 5: 创建 `src/data/nameWords.ts`

**Files:**
- Create: `src/data/nameWords.ts`

- [ ] **Step 1: 写入命名词库**

```ts
import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from './vectorDims.ts';

/** 元素维度 → 名字用字 */
export const ELEMENT_WORDS: Record<RuneId, string[]> = {
  fire: ['焰', '灼', '爆'],
  frost: ['霜', '冰', '凝'],
  lightning: ['雷', '闪', '弧'],
  stone: ['岩', '棘', '壁'],
  shadow: ['影', '蚀', '印'],
  wind: ['风', '旋', '疾'],
};

/** 向量维度 → 名字用字 */
export const DIM_WORDS: Record<VectorDim, string[]> = {
  spread: ['环', '域', '潮'],
  dot: ['蚀', '燃', '灼'],
  burst: ['裂', '爆', '震'],
  slow: ['滞', '凝', '缓'],
  crystallize: ['晶', '封', '霜'],
  zoneControl: ['域', '阵', '场'],
  chain: ['链', '跃', '连'],
  delay: ['伏', '延', '待'],
  instantBurst: ['闪', '瞬', '击'],
  pierce: ['穿', '刺', '贯'],
  bind: ['牢', '锁', '禁'],
  structure: ['壁', '垒', '柱'],
  conditional: ['契', '伏', '触'],
  markAmplify: ['印', '痕', '裁'],
  displacement: ['冲', '卷', '退'],
  haste: ['疾', '迅', '掠'],
};
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 6: 创建 `src/engine/vectorMath.ts`

**Files:**
- Create: `src/engine/vectorMath.ts`

- [ ] **Step 1: 写入向量工具函数**

```ts
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
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 7: 创建 `src/engine/positionEncoding.ts`

**Files:**
- Create: `src/engine/positionEncoding.ts`

- [ ] **Step 1: 写入位置编码**

```ts
import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';
import { VECTOR_DIMS } from '../data/vectorDims.ts';
import { clamp, getTopDims } from './vectorMath.ts';

/** 槽位角色 */
export type SlotRole = 'origin' | 'shape' | 'trigger' | 'finish';

/** 4 槽位角色顺序 */
export const SLOT_ROLES: SlotRole[] = ['origin', 'shape', 'trigger', 'finish'];

/** 槽位倍率 */
export const SLOT_MULTIPLIERS: Record<SlotRole, number> = {
  origin: 1.2,
  shape: 1.05,
  trigger: 0.95,
  finish: 1.15,
};

/** 槽位额外维度偏置 */
export const SLOT_DIM_BONUS: Record<SlotRole, Partial<Record<VectorDim, number>>> = {
  origin: { instantBurst: 0.18, haste: 0.16, displacement: 0.12 },
  shape: { spread: 0.16, zoneControl: 0.18, structure: 0.12 },
  trigger: { delay: 0.18, chain: 0.16, conditional: 0.14 },
  finish: { burst: 0.18, bind: 0.15, markAmplify: 0.14 },
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
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 8: 创建 `src/engine/attentionEngine.ts`

**Files:**
- Create: `src/engine/attentionEngine.ts`

- [ ] **Step 1: 写入注意力引擎**

```ts
import { dot, softmax, normalize } from './vectorMath.ts';
import type { PositionedVector } from './positionEncoding.ts';

/** 顺序偏置：相邻后续 +0.18，一般后续 +0.08，反向 -0.04 */
function orderBias(i: number, j: number): number {
  if (j === i + 1) return 0.18;
  if (j > i) return 0.08;
  if (j < i) return -0.04;
  return 0;
}

/** 简化的自注意力机制 */
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

  // 2. 每行 softmax → attention weights
  const weights: number[][] = scores.map((row) => softmax(row));

  // 3. 加权聚合：每个 query 位置对所有 value 的加权和
  const aggregated: number[] = new Array(dim).fill(0);
  for (let i = 0; i < n; i++) {
    for (let d = 0; d < dim; d++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += weights[i][j] * vectors[j][d];
      }
      aggregated[d] += sum;
    }
  }

  // 4. 跨 query 位置平均
  for (let d = 0; d < dim; d++) {
    aggregated[d] /= n;
  }

  // 5. 归一化得到最终技能向量
  const finalVector = normalize(aggregated);

  return { finalVector, interactionScores: scores, attentionWeights: weights };
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 9: 创建 `src/engine/skillDecoder.ts`

**Files:**
- Create: `src/engine/skillDecoder.ts`

- [ ] **Step 1: 写入标签解码 + 参数解码**

```ts
import type { VectorDim } from '../data/vectorDims.ts';
import type { SkillParams } from '../types/skill.ts';
import { clamp, roundTo } from './vectorMath.ts';
import type { RuneId } from '../types/rune.ts';

/** 从最终向量解码技能标签 */
export function decodeTags(
  finalVector: number[],
  dimIndex: (dim: VectorDim) => number,
): { tags: string[]; reasons: string[] } {
  const tags: string[] = [];
  const reasons: string[] = [];

  const v = (dim: VectorDim) => finalVector[dimIndex(dim)];

  const rules: Array<{ dim: VectorDim; threshold: number; tag: string }> = [
    { dim: 'spread', threshold: 0.5, tag: 'AOE' },
    { dim: 'dot', threshold: 0.45, tag: '持续伤害' },
    { dim: 'burst', threshold: 0.55, tag: '爆发' },
    { dim: 'slow', threshold: 0.4, tag: '减速' },
    { dim: 'crystallize', threshold: 0.5, tag: '冻结' },
    { dim: 'zoneControl', threshold: 0.5, tag: '区域控制' },
    { dim: 'chain', threshold: 0.55, tag: '连锁' },
    { dim: 'delay', threshold: 0.45, tag: '延迟触发' },
    { dim: 'instantBurst', threshold: 0.55, tag: '瞬时爆发' },
    { dim: 'pierce', threshold: 0.5, tag: '穿刺' },
    { dim: 'bind', threshold: 0.45, tag: '禁锢' },
    { dim: 'structure', threshold: 0.5, tag: '结构造物' },
    { dim: 'conditional', threshold: 0.5, tag: '条件触发' },
    { dim: 'markAmplify', threshold: 0.5, tag: '标记增幅' },
    { dim: 'displacement', threshold: 0.5, tag: '击退/位移' },
    { dim: 'haste', threshold: 0.5, tag: '高速释放' },
  ];

  for (const { dim, threshold, tag } of rules) {
    if (v(dim) > threshold) {
      tags.push(tag);
      reasons.push(`${dim}=${v(dim).toFixed(2)} > ${threshold} → ${tag}`);
    }
  }

  // 最多 6 个主标签
  return { tags: tags.slice(0, 6), reasons };
}

/** 从最终向量解码技能参数 */
export function decodeParams(
  finalVector: number[],
  dimIndex: (dim: VectorDim) => number,
  runeIds: RuneId[],
): SkillParams {
  const v = (dim: VectorDim) => finalVector[dimIndex(dim)];

  const rangePower = clamp(
    Math.round(((v('spread') + v('zoneControl') + v('structure') * 0.5) / 2.5) * 100),
    0,
    100,
  );
  const controlPower = clamp(
    Math.round(((v('slow') + v('crystallize') + v('bind') + v('zoneControl')) / 4) * 100),
    0,
    100,
  );
  const burstPower = clamp(
    Math.round(((v('burst') + v('instantBurst') + v('markAmplify') * 0.4) / 2.4) * 100),
    0,
    100,
  );
  const chainCount = clamp(Math.round(v('chain') * 5), 0, 5);
  const delaySeconds = clamp(roundTo(v('delay') * 3, 0.1), 0, 3);
  const hasCondition = v('conditional') > 0.5 || v('markAmplify') > 0.55;
  const hasDisplacement = v('displacement') > 0.5 || v('haste') > 0.6;
  const hasKnockback = v('displacement') > 0.58;
  const hasBind = v('bind') > 0.45 || v('structure') > 0.62;

  // 伤害类型：取主导符文元素
  const damageType = deriveDamageType(runeIds);

  return {
    damageType,
    rangePower,
    controlPower,
    burstPower,
    chainCount,
    delaySeconds,
    hasCondition,
    hasDisplacement,
    hasKnockback,
    hasBind,
  };
}

/** 从符文组合推导伤害类型 */
function deriveDamageType(runeIds: RuneId[]): SkillParams['damageType'] {
  const elementMap: Record<RuneId, SkillParams['damageType']> = {
    fire: '火焰',
    frost: '冰霜',
    lightning: '雷电',
    stone: '岩石',
    shadow: '暗影',
    wind: '疾风',
  };

  // 检查是否所有符文同元素
  const types = runeIds.map((id) => elementMap[id]);
  const unique = [...new Set(types)];
  if (unique.length === 1) return unique[0];

  return '混合';
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 10: 创建 `src/engine/skillNameGenerator.ts`

**Files:**
- Create: `src/engine/skillNameGenerator.ts`

- [ ] **Step 1: 写入命名生成器**

```ts
import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';
import { ELEMENT_WORDS, DIM_WORDS } from '../data/nameWords.ts';
import { RUNES } from '../data/runes.ts';

/**
 * 生成技能名称。
 * 规则：主导元素词 + 次级元素词 + Top 维度词 = 2-3 字名称。
 * 禁止完整排列查表。
 */
export function generateSkillName(
  runeIds: RuneId[],
  topDims: Array<{ dim: VectorDim; value: number }>,
): string {
  // 1. 找到主导符文（第一个槽位的符文贡献最大）
  const primaryRune = runeIds[0];
  const secondaryRune = runeIds[runeIds.length - 1];

  // 2. 从主导符文元素词库中取词
  const primaryWords = ELEMENT_WORDS[primaryRune];
  // 用 topDims 第一维的 value 取模选词
  const primaryWord =
    primaryWords[Math.floor((topDims[0]?.value ?? 0) * 10) % primaryWords.length];

  // 3. 从次级符文元素词库中取词（不同于主导词）
  const secondaryWords = ELEMENT_WORDS[secondaryRune];
  const secondaryWord =
    secondaryWords[
      Math.floor(((topDims[1]?.value ?? 0) * 7 + 1) % secondaryWords.length)
    ];

  // 4. 从 Top 维度中取一个非元素维度词
  const dimWords = DIM_WORDS[topDims[0].dim];
  const dimWord = dimWords[Math.floor((topDims[0].value * 13) % dimWords.length)];

  // 5. 组合：元素1字 + 元素2字 + 维度字
  // 确保不超过 4 字
  const name = `${primaryWord}${dimWord}${secondaryWord}`;

  // 如果主导=次级符文，只取两个字
  if (primaryRune === secondaryRune) {
    return `${primaryWord}${dimWord}`;
  }

  return name;
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
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 11: 创建 `src/engine/specialResonance.ts`

**Files:**
- Create: `src/engine/specialResonance.ts`

- [ ] **Step 1: 写入特殊共鸣规则**

```ts
import type { RuneId } from '../types/rune.ts';
import type { VectorDim } from '../data/vectorDims.ts';
import type { SpecialResonanceResult } from '../types/skill.ts';

/** 特殊共鸣定义 */
type SpecialResonanceRule = {
  id: string;
  label: string;
  requiredRunes: RuneId[];
  requiredOrderPattern?: RuneId[];
  seedChance: number;
  resultModifier: Partial<Record<VectorDim, number>>;
  explanation: string;
};

/** MVP 特殊共鸣规则（≤3 条） */
const SPECIAL_RESONANCES: SpecialResonanceRule[] = [
  {
    id: 'storm_prison',
    label: '风雷锁域',
    requiredRunes: ['wind', 'lightning', 'frost', 'stone'],
    requiredOrderPattern: ['wind', 'lightning'],
    seedChance: 0.15,
    resultModifier: {
      chain: 0.2,
      bind: 0.2,
      delay: 0.15,
    },
    explanation:
      '疾风作为起手推动雷电形成连续跳跃，后续冰霜与岩石将跳跃轨迹固化为锁域。',
  },
  {
    id: 'shadow_flame',
    label: '暗火处决',
    requiredRunes: ['shadow', 'fire', 'shadow', 'fire'],
    seedChance: 0.12,
    resultModifier: {
      markAmplify: 0.25,
      burst: 0.2,
      conditional: 0.15,
    },
    explanation:
      '暗影与火焰交替铭刻形成标记-引爆循环，每次条件触发后爆发伤害提升。',
  },
];

/**
 * 检查并应用特殊共鸣。
 * 必须 seed 可复现。
 */
export function checkSpecialResonance(
  runeIds: RuneId[],
  seed?: string,
): {
  resonance?: SpecialResonanceResult;
  modifier: Partial<Record<VectorDim, number>>;
} {
  for (const rule of SPECIAL_RESONANCES) {
    // 检查符文集合匹配
    const runesSorted = [...runeIds].sort();
    const requiredSorted = [...rule.requiredRunes].sort();
    const runesMatch =
      runesSorted.length === requiredSorted.length &&
      runesSorted.every((r, i) => r === requiredSorted[i]);

    if (!runesMatch) continue;

    // 检查顺序模式（如果有要求）
    if (rule.requiredOrderPattern) {
      const pattern = rule.requiredOrderPattern;
      const matchesPattern = pattern.every(
        (runeId, i) => runeIds[i] === runeId,
      );
      if (!matchesPattern) continue;
    }

    // 可复现随机：用 seed + rule id 生成确定性值
    const chanceValue = seed
      ? deterministicRandom(seed + rule.id)
      : Math.random();

    if (chanceValue < rule.seedChance) {
      return {
        resonance: {
          id: rule.id,
          label: rule.label,
          explanation: rule.explanation,
        },
        modifier: rule.resultModifier,
      };
    }
  }

  return { modifier: {} };
}

/** 简单的确定性随机（基于字符串 hash） */
function deterministicRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash * 31 + char) % 1000003;
  }
  return (hash % 1000) / 1000;
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 12: 创建 `src/engine/skillGenerator.ts`

**Files:**
- Create: `src/engine/skillGenerator.ts`

- [ ] **Step 1: 写入总装函数 generateSkill()**

```ts
import type { RuneId } from '../types/rune.ts';
import type {
  GeneratedSkill,
  GenerateSkillInput,
  SkillAnimationParams,
} from '../types/skill.ts';
import { VECTOR_DIMS } from '../data/vectorDims.ts';
import { getRuneVector, RUNES } from '../data/runes.ts';
import { getTopDims, toDimRecord } from './vectorMath.ts';
import { applyPositionEncoding } from './positionEncoding.ts';
import { computeAttention } from './attentionEngine.ts';
import { decodeTags, decodeParams } from './skillDecoder.ts';
import { generateSkillName, generateDescription } from './skillNameGenerator.ts';
import { checkSpecialResonance } from './specialResonance.ts';

/** 维度名 → 索引的快速查找 */
function makeDimIndex() {
  const map = {} as Record<string, number>;
  for (let i = 0; i < VECTOR_DIMS.length; i++) {
    map[VECTOR_DIMS[i]] = i;
  }
  return (dim: string) => map[dim];
}

/**
 * 规则引擎核心：根据 4 枚符文及其排列顺序生成技能。
 * 纯函数，相同输入始终产生相同输出。
 */
export function generateSkill(input: GenerateSkillInput): GeneratedSkill {
  const { runeIds, seed } = input;

  if (runeIds.length !== 4) {
    throw new Error(`generateSkill requires exactly 4 runeIds, got ${runeIds.length}`);
  }

  const dimIndex = makeDimIndex();

  // 1. 位置编码
  const positioned = applyPositionEncoding(runeIds, getRuneVector);

  // 2. 注意力交互 + 聚合
  const { finalVector, interactionScores, attentionWeights } =
    computeAttention(positioned);

  // 3. 检查特殊共鸣
  const { resonance, modifier } = checkSpecialResonance(runeIds, seed);

  // 应用共鸣修正
  let modifiedVector = finalVector;
  if (Object.keys(modifier).length > 0) {
    modifiedVector = finalVector.map((v, i) => {
      const dimName = VECTOR_DIMS[i];
      return v + (modifier[dimName] ?? 0);
    });
  }

  // 4. 获取 Top 维度
  const topDims = getTopDims(modifiedVector, 5);
  const finalTopDims = topDims;

  // 5. 解码标签
  const { tags, reasons: decodeReasons } = decodeTags(modifiedVector, dimIndex);

  // 6. 解码参数
  const params = decodeParams(modifiedVector, dimIndex, runeIds);

  // 7. 生成名称
  const name = generateSkillName(runeIds, topDims);

  // 8. 生成描述
  const description = generateDescription(runeIds, tags, topDims);

  // 9. 动画参数
  const animationParams = deriveAnimationParams(
    runeIds,
    modifiedVector,
    dimIndex,
    params,
  );

  // 10. 生成唯一 ID
  const id = seed
    ? `${runeIds.join('-')}_${seed}`
    : `${runeIds.join('-')}_${Date.now()}`;

  return {
    id,
    runeIds,
    name,
    description,
    tags,
    params,
    finalVector: toDimRecord(modifiedVector),
    topDims: finalTopDims,
    trace: {
      positionedVectors: positioned.map((p) => ({
        slotIndex: p.slotIndex,
        runeId: p.runeId,
        role: p.role,
        topDims: p.topDims,
      })),
      interactionScores,
      attentionWeights,
      finalTopDims,
      decodeReasons,
    },
    resonance,
    animationParams,
  };
}

/** 从最终向量推导动画参数 */
function deriveAnimationParams(
  runeIds: RuneId[],
  vector: number[],
  dimIndex: (dim: string) => number,
  params: GeneratedSkill['params'],
): SkillAnimationParams {
  const primaryRune = RUNES[runeIds[0]];
  const secondaryRune = RUNES[runeIds[runeIds.length - 1]];

  return {
    primaryColor: primaryRune.color,
    secondaryColor: secondaryRune.color,
    particleCount: 20 + Math.round(params.rangePower * 0.8),
    spreadRadius: 1 + params.rangePower / 50,
    burstIntensity: params.burstPower / 100,
    chainCount: params.chainCount,
  };
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

---

### Task 13: 创建验收脚本 `scripts/verify-engine.ts`

**Files:**
- Create: `scripts/verify-engine.ts`

- [ ] **Step 1: 写入验证脚本**

```ts
// scripts/verify-engine.ts
// 验证 generateSkill() 对 A/B 两组相同符文不同顺序产生明显不同的结果。
// 运行: npx tsx scripts/verify-engine.ts

import { generateSkill } from '../src/engine/skillGenerator.ts';

const SEED = 'verify-a1-2026';

const resultA = generateSkill({
  runeIds: ['fire', 'frost', 'lightning', 'wind'],
  seed: SEED + '-a',
});

const resultB = generateSkill({
  runeIds: ['wind', 'lightning', 'frost', 'fire'],
  seed: SEED + '-b',
});

console.log('=== 构筑 A: fire → frost → lightning → wind ===');
console.log('名称:', resultA.name);
console.log('标签:', resultA.tags.join(', '));
console.log('Top5 维度:', resultA.topDims.map((d) => `${d.dim}=${d.value.toFixed(3)}`).join(', '));
console.log('参数:', JSON.stringify(resultA.params, null, 2));
console.log('动画:', JSON.stringify(resultA.animationParams, null, 2));
if (resultA.resonance) {
  console.log('特殊共鸣:', resultA.resonance.label);
}

console.log('\n=== 构筑 B: wind → lightning → frost → fire ===');
console.log('名称:', resultB.name);
console.log('标签:', resultB.tags.join(', '));
console.log('Top5 维度:', resultB.topDims.map((d) => `${d.dim}=${d.value.toFixed(3)}`).join(', '));
console.log('参数:', JSON.stringify(resultB.params, null, 2));
console.log('动画:', JSON.stringify(resultB.animationParams, null, 2));
if (resultB.resonance) {
  console.log('特殊共鸣:', resultB.resonance.label);
}

// --- 验收断言 ---
let passed = 0;
let failed = 0;

function check(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

console.log('\n=== 验收检查 ===');

// 名称不同
check(resultA.name !== resultB.name, '技能名称不同');

// 标签至少有 2 个不同
const diffTags =
  resultA.tags.filter((t) => !resultB.tags.includes(t)).length +
  resultB.tags.filter((t) => !resultA.tags.includes(t)).length;
check(diffTags >= 2, `标签差异数 ≥ 2（实际: ${diffTags}）`);

// Top5 维度至少有 3 项不同排序或数值差异明显
const top5A = resultA.topDims.map((d) => d.dim);
const top5B = resultB.topDims.map((d) => d.dim);
const dimDiffs = top5A.filter((d, i) => d !== top5B[i]).length;
const valueDiffs = resultA.topDims.filter((d, i) => {
  const b = resultB.topDims[i];
  return b && Math.abs(d.value - b.value) > 0.05;
}).length;
check(
  dimDiffs >= 3 || valueDiffs >= 3,
  `Top5 维度排序差异 ≥ 3 或数值差异 ≥ 3（排序差异: ${dimDiffs}, 数值差异: ${valueDiffs})`,
);

// 参数条明显不同
const paramKeys = ['rangePower', 'controlPower', 'burstPower'] as const;
const paramDiff = paramKeys.filter(
  (k) => Math.abs(resultA.params[k] - resultB.params[k]) > 5,
).length;
check(paramDiff >= 2, `关键参数差异 ≥ 2 个（实际: ${paramDiff}）`);

// trace 可读
check(resultA.trace.positionedVectors.length === 4, 'trace 包含 4 个位置向量');
check(
  resultA.trace.interactionScores.length === 4 &&
    resultA.trace.interactionScores[0].length === 4,
  'trace 包含 4×4 交互分数矩阵',
);
check(
  resultA.trace.attentionWeights.length === 4 &&
    resultA.trace.attentionWeights[0].length === 4,
  'trace 包含 4×4 注意力权重矩阵',
);
check(resultA.trace.decodeReasons.length > 0, 'trace 包含解码原因');

// 动画参数不同
check(
  resultA.animationParams.primaryColor !== resultB.animationParams.primaryColor,
  '动画主色调不同',
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n❌ 验收未通过！');
  process.exit(1);
} else {
  console.log('\n✅ 全部验收通过！');
}
```

- [ ] **Step 2: 安装 tsx（如果尚未安装）**

```bash
npx tsx --version
```

- [ ] **Step 3: 运行验收脚本**

```bash
npx tsx scripts/verify-engine.ts
```

预期输出：全部 ✅，0 失败。

---

### Task 14: 对照反跑偏清单自查

- [ ] **Step 1: 逐条检查**

对照 `docs/reference/anti-cheat-checklist.md`：

1. [ ] 是否还围绕「排列顺序产生构筑指纹」？ → 是，positionEncoding + attention 完全基于顺序。
2. [ ] 是否出现了完整排列查表？ → 否，generateSkill() 是纯计算。
3. [ ] 是否把大量时间花在美术资产上？ → 否，A1 只有纯函数。
4. [ ] 是否 How 页写成无法理解的数学说明？ → A1 不涉及 How 页。
5. [ ] 是否 Play 页一打开就能操作？ → A1 不涉及 Play 页。
6. [ ] 是否默认 A/B 对比足够明显？ → verify-engine.ts 验证。
7. [ ] 是否技能结果和动画来自同一个 finalVector？ → 是，animationParams 从 finalVector 推导。
8. [ ] 是否 trace 可以解释结果？ → 是，包含各级中间数据。
9. [ ] 是否控制台无明显报错？ → verify-engine.ts 验证。

- [ ] **Step 2: 运行完整 TypeScript 编译检查**

```bash
npx tsc --noEmit
```

预期：零错误。

---

### Task 15: Git 提交

- [ ] **Step 1: 提交所有 A1 变更**

```bash
git add src/types/rune.ts src/types/skill.ts
git add src/data/vectorDims.ts src/data/runes.ts src/data/nameWords.ts
git add src/engine/vectorMath.ts src/engine/positionEncoding.ts src/engine/attentionEngine.ts
git add src/engine/skillDecoder.ts src/engine/skillNameGenerator.ts src/engine/specialResonance.ts
git add src/engine/skillGenerator.ts
git add scripts/verify-engine.ts
git commit -m "feat(A1): implement rule engine pure functions

- Rewrite types/rune.ts and types/skill.ts per contract
- Add data layer: vectorDims, 6 runes with 16-dim vectors, name word library
- Implement engine pipeline: vectorMath → positionEncoding → attentionEngine → skillDecoder → skillNameGenerator → specialResonance → skillGenerator
- Add verify-engine.ts script confirming A/B sequence produces clearly different results

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
