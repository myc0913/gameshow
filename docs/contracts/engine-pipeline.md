---
description: 规则引擎合同 — 输入输出、计算流程、位置编码、注意力、解码规则、命名规则、特殊共鸣。实现 engine/ 时必读。
---

# 规则引擎合同

## 6. 计算流程

### 6.1 位置编码

4 个槽位对应 4 种角色：

| 槽位 | role | 基础倍率 | 设计含义 |
|---|---|---|---:|---|
| 1 | origin | 1.20 | 起手倾向 |
| 2 | shape | 1.05 | 技能形态 |
| 3 | trigger | 0.95 | 触发节奏 |
| 4 | finish | 1.15 | 收束终结 |

额外维度偏置：

```ts
const SLOT_DIM_BONUS = {
  origin: {
    instantBurst: 0.18,
    haste: 0.16,
    displacement: 0.12
  },
  shape: {
    spread: 0.16,
    zoneControl: 0.18,
    structure: 0.12
  },
  trigger: {
    delay: 0.18,
    chain: 0.16,
    conditional: 0.14
  },
  finish: {
    burst: 0.18,
    bind: 0.15,
    markAmplify: 0.14
  }
};
```

实现要求：

1. 每枚符文向量先乘以槽位倍率。
2. 对槽位重点维度加 bonus。
3. 结果 clamp 到 `[-1, 1.25]` 或类似范围，避免数值爆炸。

### 6.2 简化注意力

必须实现以下步骤：

1. 获取 4 个符文向量。
2. 应用位置编码。
3. 计算两两交互分数。
4. 对每一行做 softmax。
5. 使用 attention weight 加权聚合。
6. 归一化得到最终技能向量。

建议公式：

```ts
score(i, j) = dot(vecI, vecJ) / sqrt(dim) + orderBias(i, j)
```

其中：

```ts
function orderBias(i: number, j: number) {
  if (j === i + 1) return 0.18; // 相邻后继更容易被当前符文激活
  if (j > i) return 0.08;       // 后续符文略有前进方向加成
  if (j < i) return -0.04;      // 反向影响较弱但不为 0
  return 0;
}
```

### 6.3 最终向量差异硬性要求

以下两组必须产生明显不同结果：

```text
A: 火焰 → 冰霜 → 雷电 → 疾风
B: 疾风 → 雷电 → 冰霜 → 火焰
```

最低验收：

- A 与 B 的 Top 5 维度排序至少有 3 项不同，或同维度数值差异明显。
- A 与 B 的标签至少有 2 个不同。
- A 与 B 的技能名称不同。
- A 与 B 的动画参数不同。

---

## 7. 解码规则

### 7.1 标签解码

```ts
if (spread > 0.5) addTag('AOE');
if (dot > 0.45) addTag('持续伤害');
if (burst > 0.55) addTag('爆发');
if (slow > 0.4) addTag('减速');
if (crystallize > 0.5) addTag('冻结');
if (zoneControl > 0.5) addTag('区域控制');
if (chain > 0.55) addTag('连锁');
if (delay > 0.45) addTag('延迟触发');
if (instantBurst > 0.55) addTag('瞬时爆发');
if (pierce > 0.5) addTag('穿刺');
if (bind > 0.45) addTag('禁锢');
if (structure > 0.5) addTag('结构造物');
if (conditional > 0.5) addTag('条件触发');
if (markAmplify > 0.5) addTag('标记增幅');
if (displacement > 0.5) addTag('击退/位移');
if (haste > 0.5) addTag('高速释放');
```

如果标签过多，结果面板最多展示 6 个主标签，其余放入详情或不展示。

### 7.2 参数解码

建议：

```ts
rangePower = scale01((spread + zoneControl + structure * 0.5) / 2.5)
controlPower = scale01((slow + crystallize + bind + zoneControl) / 4)
burstPower = scale01((burst + instantBurst + markAmplify * 0.4) / 2.4)
chainCount = clamp(Math.round(chain * 5), 0, 5)
delaySeconds = clamp(roundTo(delay * 3, 0.1), 0, 3)
hasCondition = conditional > 0.5 || markAmplify > 0.55
hasDisplacement = displacement > 0.5 || haste > 0.6
hasKnockback = displacement > 0.58
hasBind = bind > 0.45 || structure > 0.62
```

### 7.3 命名规则

禁止完整排列查表。  
名称必须来自：

1. 主导元素词
2. 次级元素词
3. Top 维度词
4. 可选特殊共鸣标签

示例词库：

```ts
const NAME_WORDS = {
  fire: ['焰', '灼', '爆'],
  frost: ['霜', '冰', '凝'],
  lightning: ['雷', '闪', '弧'],
  stone: ['岩', '棘', '壁'],
  shadow: ['影', '蚀', '印'],
  wind: ['风', '旋', '疾'],

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
  haste: ['疾', '迅', '掠']
};
```

示例输出：

- 冰焰爆环
- 雷霜连锁
- 岩影禁锢
- 风雷穿刺
- 暗火处决
- 霜岩牢笼

---

## 8. 特殊共鸣

特殊共鸣可以存在，但不能成为主要体验。

### 8.1 规则

```ts
type SpecialResonance = {
  id: string;
  label: string;
  requiredRunes: RuneId[];
  requiredOrderPattern?: RuneId[];
  seedChance: number;
  resultModifier: Partial<Record<VectorDim, number>>;
  explanation: string;
};
```

示例：

```ts
const SPECIAL_RESONANCE = [
  {
    id: 'storm_prison',
    label: '风雷锁域',
    requiredRunes: ['wind', 'lightning', 'frost', 'stone'],
    requiredOrderPattern: ['wind', 'lightning'],
    seedChance: 0.15,
    resultModifier: {
      chain: 0.2,
      bind: 0.2,
      delay: 0.15
    },
    explanation: '疾风作为起手推动雷电形成连续跳跃，后续冰霜与岩石将跳跃轨迹固化为锁域。'
  }
];
```

### 8.2 约束

- 必须 seed 可复现。
- 触发时结果页显示「特殊共鸣：xxx」。
- How 页解释其为「稀有交互修正」，不是完整技能查表。
- 不要超过 3 条特殊共鸣。
