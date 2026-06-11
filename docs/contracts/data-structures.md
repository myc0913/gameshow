---
description: 核心数据结构合同 — 向量维度、符文定义、技能类型、技能参数。实现 engine/ 和 types/ 时必读。
---

# 核心数据结构

## 4. 核心数据结构

### 4.1 向量维度

```ts
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
  'haste'
] as const;
```

### 4.2 符文定义

每枚符文至少包含：

```ts
export type Rune = {
  id: RuneId;
  name: string;
  shortName: string;
  color: string;
  secondaryColor: string;
  tendency: string;
  intuition: string;
  vector: number[];
};
```

MVP 固定 6 枚符文：

| id | 名称 | 核心倾向 | 玩家直觉 |
|---|---|---|---|
| fire | 火焰符文 | 扩散、持续伤害、爆裂 | 范围燃烧、爆炸 |
| frost | 冰霜符文 | 减速、凝结、区域控制 | 冰冻、控场 |
| lightning | 雷电符文 | 连锁、延迟、瞬时爆发 | 弹跳、爆发 |
| stone | 岩石符文 | 穿刺、固定、结构 | 地刺、护壁、禁锢 |
| shadow | 暗影符文 | 条件触发、标记增幅 | 标记、处决、伏击 |
| wind | 疾风符文 | 位移、加速、击退 | 推开、冲刺、风刃 |

---

## 5. 规则引擎合同

### 5.1 输入

```ts
type GenerateSkillInput = {
  runeIds: RuneId[]; // 长度必须为 4
  seed?: string;     // 用于特殊共鸣的可复现随机
};
```

### 5.2 输出

```ts
type GeneratedSkill = {
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

### 5.3 技能参数

```ts
type SkillParams = {
  damageType: '火焰' | '冰霜' | '雷电' | '岩石' | '暗影' | '疾风' | '混合';
  rangePower: number;       // 0-100
  controlPower: number;     // 0-100
  burstPower: number;       // 0-100
  chainCount: number;       // 0-5
  delaySeconds: number;     // 0-3
  hasCondition: boolean;
  hasDisplacement: boolean;
  hasKnockback: boolean;
  hasBind: boolean;
};
```

### 5.4 Trace 必须存在

为了证明「不是查表」，每次生成都必须输出 `trace`。

```ts
type SkillGenerationTrace = {
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
```

How 页必须读取这份 trace，而不是手写一套解释。
