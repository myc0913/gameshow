# AI 规则引擎 Demo：核心规则引擎修正文档 V4

## 版本定位

本文档用于修正当前「技能符文构筑实验室」Demo 中的核心规则引擎。

它不是新的完整项目文档，也不要求重做页面、动画、部署和 README。它只作为现有代码基础上的 **核心逻辑补丁合同**，用于指导后续 vibe coding / coding agent 对规则引擎进行定向修改。

当前最高设计口径为：

> 4 个槽位不是一个技能的 4 个阶段，而是 4 个独立技能位。每个技能位对应一个技能种子。前面的技能会影响后续技能的固化方向，后续技能也会反向改写前面技能的附加能力。最终结果不是一个单技能，而是一组彼此互馈后的技能 Build。

核心目标：

> 保留向量语义计算作为核心，不再用单维度阈值直接触发标签；改为「元素守恒 + 技能位互馈向量计算 + 候选能力竞争解码 + 能力预算筛选」。

---

## 1. 本次修正范围

### 1.1 必须修改

本次只修改以下核心逻辑：

1. 符文 / 技能种子的语义定义方式。
2. 4 个技能位之间的互馈计算。
3. 原有位置倍率 / 起手倾向逻辑。
4. 结果解码逻辑。
5. 技能标签、参数、动画参数的生成来源。
6. How 页 / trace 中对计算过程的解释数据。

### 1.2 不要求修改

本次不要求重做以下内容：

1. 页面整体布局。
2. Tab 结构。
3. Three.js 场景结构。
4. 拖拽交互。
5. 部署流程。
6. README 主体内容。
7. 美术表现。

如果现有 UI 已经可运行，应优先复用现有组件，只替换其调用的 engine 输出结构。

---

## 2. 需要废弃的旧逻辑

### 2.1 废弃「起式 / 形式 / 变式 / 终式」解释

旧版本若仍存在类似表达，需要删除或重命名：

```ts
const POSITION_WEIGHTS = [
  { role: "origin", multiplier: 1.20 },
  { role: "shape", multiplier: 1.05 },
  { role: "trigger", multiplier: 0.95 },
  { role: "finish", multiplier: 1.15 }
];
```

废弃原因：

- 当前 4 个槽位不是同一个技能的 4 个阶段。
- 每个槽位都对应一个独立技能。
- 第 1 位不是起手，第 4 位不是终结。
- 槽位顺序表达的是技能固化先后与互馈拓扑，而不是一个技能内部的动作阶段。

新的槽位命名应为：

```ts
const SKILL_SLOTS = [
  { id: "slot_1", label: "技能位 I" },
  { id: "slot_2", label: "技能位 II" },
  { id: "slot_3", label: "技能位 III" },
  { id: "slot_4", label: "技能位 IV" }
];
```

---

### 2.2 废弃「位置倍率直接乘语义向量」

旧逻辑若存在：

```ts
vector[d] *= positionMultiplier;
```

必须废弃。

原因：

- 位置不应该改变一个技能种子本身是什么。
- 位置只应该影响该技能和其他技能位之间的互馈强度。
- 直接乘倍率会导致技能本体语义漂移，使同一个技能种子在不同槽位变成完全不同的东西。

新的原则：

> 技能位不直接改写 selfVector。技能位只影响 forwardContext 与 backwardMutation 的权重。

---

### 2.3 废弃单维度阈值直接触发标签

旧逻辑若存在：

```ts
if (burst > 0.55) addTag("爆发");
if (chain > 0.55) addTag("连锁");
if (bind > 0.45) addTag("禁锢");
```

不应再作为核心解码方式。

原因：

1. 容易出现断崖式结果。
2. 容易堆出过多标签。
3. 容易产生元素越界。
4. 不适合表达双向互馈带来的轻微改写。

新的方式：

> 最终向量先生成候选能力分数，再经过元素合法性过滤、互斥关系处理和能力预算筛选，最后反推出标签、参数和动画。

---

## 3. 新核心模型总览

新的计算流程：

```text
Step 1：每个技能位生成初始语义状态
  ↓
Step 2：计算技能位之间的关系分数
  ↓
Step 3：计算前向塑形 previous → current
  ↓
Step 4：计算后向改写 later → current
  ↓
Step 5：得到每个技能位最终语义状态
  ↓
Step 6：基于最终语义状态生成候选能力分数
  ↓
Step 7：元素合法性过滤
  ↓
Step 8：互斥关系处理与能力预算筛选
  ↓
Step 9：从能力组生成技能名称、描述、标签、参数、动画参数
  ↓
Step 10：生成 Build 总览与 trace
```

关键原则：

> 向量计算负责生成复杂性；候选能力负责保证可读性；元素守恒负责保证直觉合法；技能位互馈负责保证顺序差异。

---

## 4. 语义状态结构

### 4.1 拆分元素向量与行为向量

不要继续把元素倾向和行为倾向混在一个 16 维数组里。

新的语义状态应拆成两层：

```ts
type ElementKey = "fire" | "frost" | "lightning" | "stone" | "shadow" | "wind";

type BehaviorKey =
  | "impact"
  | "burst"
  | "dot"
  | "spread"
  | "zone"
  | "control"
  | "bind"
  | "chain"
  | "delay"
  | "mark"
  | "pierce"
  | "guard"
  | "pullPush"
  | "mobility"
  | "speed"
  | "summon";

type ElementVector = Record<ElementKey, number>;
type BehaviorVector = Record<BehaviorKey, number>;

type SkillSemanticState = {
  element: ElementVector;
  behavior: BehaviorVector;
};
```

元素向量回答：

> 这个技能有哪些元素来源？

行为向量回答：

> 这些元素被固化成了什么能力倾向？

---

### 4.2 行为维度定义

建议采用以下 16 个通用行为维度：

```ts
const BEHAVIOR_DIMS: BehaviorKey[] = [
  "impact",    // 直接冲击 / 命中强度
  "burst",     // 爆裂 / 瞬时爆发
  "dot",       // 持续伤害 / 持续侵蚀
  "spread",    // 扩散 / 蔓延
  "zone",      // 区域留存 / 场地效果
  "control",   // 控制 / 限制行动
  "bind",      // 禁锢 / 定身 / 锁定
  "chain",     // 连锁 / 传导 / 跳跃
  "delay",     // 延迟触发
  "mark",      // 标记 / 弱点 / 印记
  "pierce",    // 穿透 / 贯穿
  "guard",     // 防护 / 屏障 / 护壁
  "pullPush",  // 牵引 / 击退
  "mobility",  // 位移 / 冲刺
  "speed",     // 释放速度 / 频率
  "summon"     // 召出物 / 残留结构 / 附属物
];
```

注意：

- 不建议使用 `crystallize` 作为通用行为维度，因为它更像冰系表达。
- 不建议使用 `structure` 作为通用行为维度，因为它更像岩系表达。
- 不建议同时保留 `instantBurst` 和 `burst`，两者边界重叠。
- 元素特色应由 decoder 根据 element + behavior 翻译，而不是写死在 behavior 维度里。

---

## 5. 技能种子定义

### 5.1 每个元素保留 4 个固化方向

不要称为 4 个强度档。应称为：

> 每个元素的 4 种固化方向。

建议基础设计如下。

### 火系

| id | 名称 | 主行为 | 副行为 | 直觉 |
|---|---|---|---|---|
| fire_impact | 爆焰 | impact, burst | spread | 瞬时爆裂、冲击 |
| fire_flow | 灼流 | dot, spread | zone | 持续灼烧、蔓延 |
| fire_zone | 炎域 | zone, control | dot | 火场压制、范围留存 |
| fire_mark | 烬印 | mark, delay | burst | 标记、延迟二段爆发 |

### 冰系

| id | 名称 | 主行为 | 副行为 | 直觉 |
|---|---|---|---|---|
| frost_impact | 碎霜 | impact, burst | control | 冻裂、碎冰冲击 |
| frost_flow | 寒流 | dot, control | spread | 持续减速、寒气侵蚀 |
| frost_zone | 冰域 | zone, bind | control | 冻结地面、区域封锁 |
| frost_mark | 霜印 | mark, delay | bind | 标记后凝结、延迟冻结 |

### 雷系

| id | 名称 | 主行为 | 副行为 | 直觉 |
|---|---|---|---|---|
| lightning_impact | 霆击 | impact, speed | burst | 瞬时落雷、快速打击 |
| lightning_flow | 电涌 | chain, spread | speed | 传导、弹跳、连锁 |
| lightning_zone | 雷网 | zone, control | chain | 雷场、麻痹、区域约束 |
| lightning_mark | 引雷 | mark, delay | impact | 标记后落雷、追击 |

### 岩系

| id | 名称 | 主行为 | 副行为 | 直觉 |
|---|---|---|---|---|
| stone_impact | 岩突 | impact, pierce | burst | 地刺、穿刺、重击 |
| stone_flow | 岩脉 | spread, summon | guard | 岩脉蔓延、地形生成 |
| stone_zone | 岩牢 | bind, guard | zone | 围困、护壁、封锁 |
| stone_mark | 震纹 | mark, delay | burst | 地面纹路、延迟震荡 |

### 影系

| id | 名称 | 主行为 | 副行为 | 直觉 |
|---|---|---|---|---|
| shadow_impact | 影刺 | pierce, burst | speed | 暗袭、背刺、穿刺 |
| shadow_flow | 蚀影 | dot, mark | spread | 侵蚀、暗蚀蔓延 |
| shadow_zone | 影缚 | bind, control | zone | 影子束缚、区域压制 |
| shadow_mark | 暗印 | mark, delay | burst | 标记、处决、延迟爆发 |

### 风系

| id | 名称 | 主行为 | 副行为 | 直觉 |
|---|---|---|---|---|
| wind_impact | 风刃 | pierce, speed | impact | 高速切割、风刃 |
| wind_flow | 风行 | mobility, speed | spread | 位移、加速、流动 |
| wind_zone | 风壁 | guard, pullPush | zone | 风墙、偏转、阻挡 |
| wind_mark | 风引 | pullPush, chain | delay | 牵引、卷入、引导 |

---

### 5.2 技能种子数据结构

建议定义：

```ts
type SkillSeed = {
  id: string;
  element: ElementKey;
  aspect: "impact" | "flow" | "zone" | "mark";
  name: string;
  description: string;
  semantic: SkillSemanticState;
};
```

示例：

```ts
const fireImpact: SkillSeed = {
  id: "fire_impact",
  element: "fire",
  aspect: "impact",
  name: "爆焰",
  description: "偏向瞬时爆裂与正面冲击的火系固化方向。",
  semantic: {
    element: {
      fire: 1,
      frost: 0,
      lightning: 0,
      stone: 0,
      shadow: 0,
      wind: 0
    },
    behavior: {
      impact: 0.85,
      burst: 0.9,
      dot: 0.15,
      spread: 0.3,
      zone: 0.1,
      control: 0.05,
      bind: 0,
      chain: 0,
      delay: 0.05,
      mark: 0.05,
      pierce: 0.1,
      guard: 0,
      pullPush: 0.1,
      mobility: 0.05,
      speed: 0.2,
      summon: 0
    }
  }
};
```

---

## 6. 技能位互馈计算

### 6.1 技能位不是语义阶段，而是互馈节点

4 个技能位可以看成 4 个节点：

```text
S1 —— S2 —— S3 —— S4
```

每个节点有一个 self semantic state。

最终每个技能位的语义状态由四部分构成：

```text
finalSkillState[i] =
  selfVector[i]
  + forwardContext[i]
  + backwardMutation[i]
  + resonanceVector[i]
```

建议初始权重：

```ts
const MUTUAL_FEEDBACK_WEIGHTS = {
  self: 0.62,
  forwardContext: 0.22,
  backwardMutation: 0.14,
  resonance: 0.02
};
```

核心约束：

> self 权重必须最高。技能互馈只能改写技能，不应吞掉技能本体。

---

### 6.2 前向塑形

前向塑形表示：

> 前面已经固化的技能，会影响后续技能如何成形。

例如：

```text
技能 I：炎域
技能 II：霆击
```

霆击受到炎域影响后，可能变成：

```text
落雷命中火场时，引发爆燃脉冲。
```

它仍然是雷技能，但被前置火场塑形。

建议函数：

```ts
function computeForwardContext(
  currentIndex: number,
  states: SkillSemanticState[]
): SkillSemanticState
```

计算来源：

```text
所有 j < currentIndex 的技能位
```

---

### 6.3 后向改写

后向改写表示：

> 后续技能会给前面的技能追加触发方式、收束方式或二段效果。

例如：

```text
技能 I：炎域
技能 II：霆击
```

霆击反向改写炎域后，炎域可能获得：

```text
当后续雷击命中区域内目标时，炎域追加一次爆燃脉冲。
```

建议函数：

```ts
function computeBackwardMutation(
  currentIndex: number,
  states: SkillSemanticState[]
): SkillSemanticState
```

计算来源：

```text
所有 j > currentIndex 的技能位
```

---

### 6.4 距离衰减

技能位之间距离越近，互馈越强。

建议初始值：

```ts
const FORWARD_DISTANCE_WEIGHTS: Record<number, number> = {
  1: 1.0,
  2: 0.6,
  3: 0.35
};

const BACKWARD_DISTANCE_WEIGHTS: Record<number, number> = {
  1: 1.0,
  2: 0.75,
  3: 0.5
};
```

说明：

- 前向塑形距离衰减更明显。
- 后向改写距离衰减稍慢，因为后续技能给前面技能追加能力是本系统的重要卖点。
- 但后向改写仍不能覆盖前置技能的本体语义。

---

### 6.5 关系分数 relationScore

不要只用 dot product。

建议：

```ts
function relationScore(
  from: SkillSemanticState,
  to: SkillSemanticState,
  direction: "forward" | "backward",
  distance: number
): number
```

关系分数由以下部分组成：

```text
relationScore =
  semanticCompatibility
  + elementInteraction
  + aspectInteraction
  + directionBias
  + distanceBias
```

其中：

1. semanticCompatibility：行为向量相似度。
2. elementInteraction：元素互动关系。
3. aspectInteraction：固化方向互动关系。
4. directionBias：前向与后向的语义差异。
5. distanceBias：距离衰减。

示例：

```ts
function semanticCompatibility(a: BehaviorVector, b: BehaviorVector): number {
  return cosineSimilarity(a, b);
}
```

但不应只依赖 cosine similarity，因为相似并不等于有趣。

---

## 7. 元素互动关系

### 7.1 元素互动不是凭空生成元素

元素互动可以带来行为变化，但不能凭空创造不存在的主元素。

例如：

```text
火 + 风：增强 spread / zone / speed
火 + 雷：增强 burst / impact / chain
火 + 冰：增强 burst / control，表现为蒸汽、热裂、冷热冲突
影 + 火：增强 mark / delay / dot，表现为暗燃、烬印
岩 + 雷：增强 chain / control / impact，表现为导电、震荡
冰 + 雷：增强 control / chain，表现为麻痹、冻结传导
```

注意：

- 火 + 冰 可以产生“蒸汽”“热裂”“冷热冲突”，但不能在没有冰来源时生成冰冻。
- 火 + 雷 可以产生“爆燃传导”，但不能在没有雷来源时生成纯雷链。
- 纯火构筑不能出现冰、雷、岩、影、风的专属命名。

---

### 7.2 元素互动表

建议实现一个轻量表：

```ts
type ElementPairKey = `${ElementKey}+${ElementKey}`;

type ElementInteraction = {
  behaviorBoost: Partial<Record<BehaviorKey, number>>;
  labelHint: string;
};
```

示例：

```ts
const ELEMENT_INTERACTIONS: Record<ElementPairKey, ElementInteraction> = {
  "fire+wind": {
    behaviorBoost: { spread: 0.16, zone: 0.1, speed: 0.08 },
    labelHint: "风助火势"
  },
  "fire+lightning": {
    behaviorBoost: { burst: 0.15, impact: 0.12, chain: 0.08 },
    labelHint: "雷火爆燃"
  },
  "fire+frost": {
    behaviorBoost: { burst: 0.12, control: 0.1, zone: 0.08 },
    labelHint: "冷热裂变"
  },
  "shadow+fire": {
    behaviorBoost: { mark: 0.14, delay: 0.12, dot: 0.1 },
    labelHint: "暗燃烬印"
  }
};
```

实现时需要保证 pair 顺序可归一：

```ts
normalizeElementPair("wind", "fire") === "fire+wind"
```

---

## 8. 候选能力竞争解码

### 8.1 Decoder 不再直接读阈值出标签

新的 decoder 输入：

```ts
type FinalSkillState = {
  slotIndex: number;
  seed: SkillSeed;
  self: SkillSemanticState;
  forwardContext: SkillSemanticState;
  backwardMutation: SkillSemanticState;
  final: SkillSemanticState;
  trace: SkillComputationTrace;
};
```

输出：

```ts
type DecodedSkill = {
  slotIndex: number;
  seedId: string;
  name: string;
  description: string;
  mainAbility: AbilityCandidate;
  secondaryAbilities: AbilityCandidate[];
  mutationAbility?: AbilityCandidate;
  tags: string[];
  params: SkillParams;
  animationParams: AnimationParams;
  trace: SkillDecodeTrace;
};
```

---

### 8.2 候选能力结构

```ts
type AbilityCandidate = {
  id: string;
  name: string;
  elementFamily: ElementKey | "mixed";
  requiredElements: ElementKey[];
  behaviorWeights: Partial<Record<BehaviorKey, number>>;
  tags: string[];
  paramHints: Partial<SkillParams>;
  animationHints: Partial<AnimationParams>;
  conflictsWith?: string[];
  score?: number;
  reason?: string;
};
```

示例：

```ts
const FIRE_ABILITIES: AbilityCandidate[] = [
  {
    id: "fire_burst_impact",
    name: "爆焰冲击",
    elementFamily: "fire",
    requiredElements: ["fire"],
    behaviorWeights: { impact: 0.6, burst: 0.8 },
    tags: ["爆发", "直接命中"],
    paramHints: { damageProfile: "burst" },
    animationHints: { hasBurst: true }
  },
  {
    id: "fire_burning_flow",
    name: "灼烧附着",
    elementFamily: "fire",
    requiredElements: ["fire"],
    behaviorWeights: { dot: 0.8, spread: 0.45 },
    tags: ["持续伤害", "蔓延"],
    paramHints: { damageProfile: "dot" },
    animationHints: { hasGroundZone: true }
  },
  {
    id: "fire_ember_mark",
    name: "烬印引爆",
    elementFamily: "fire",
    requiredElements: ["fire"],
    behaviorWeights: { mark: 0.7, delay: 0.6, burst: 0.5 },
    tags: ["标记", "延迟触发", "二段爆发"],
    paramHints: { hasConditionalTrigger: true },
    animationHints: { hasDelayMark: true, hasBurst: true }
  }
];
```

---

### 8.3 候选能力评分公式

建议初始公式：

```ts
score =
  selfFit * 0.38 +
  finalFit * 0.28 +
  elementFit * 0.16 +
  contextFit * 0.08 +
  mutationFit * 0.08 +
  resonanceBonus * 0.02 -
  conflictPenalty;
```

解释：

| 分数项 | 作用 |
|---|---|
| selfFit | 当前技能种子本身是否适合这个能力 |
| finalFit | 互馈后的最终向量是否支持这个能力 |
| elementFit | 元素来源是否合法且强度足够 |
| contextFit | 前向塑形是否支持这个能力 |
| mutationFit | 后向改写是否支持这个能力 |
| resonanceBonus | 构筑内是否有共鸣加成 |
| conflictPenalty | 是否和已选能力冲突 |

重点：

- selfFit 和 finalFit 权重要高。
- elementFit 是合法性与强度，不是单纯加分。
- mutationFit 可以帮助后续技能给前面技能追加能力，但不能压倒 selfFit。

---

### 8.4 元素合法性过滤

候选能力进入竞争前，必须先过元素合法性过滤。

```ts
function isElementLegal(
  candidate: AbilityCandidate,
  state: SkillSemanticState,
  minSource = 0.18
): boolean
```

规则：

1. 单元素能力必须要求对应元素来源达到 minSource。
2. 混合元素能力必须要求所有 requiredElements 都达到 minSource。
3. 当前构筑中完全不存在的元素，不能出现在技能名称和核心效果里。
4. 弱来源元素可以作为描述中的触发条件或附加反应，但不能成为主技能元素。

示例：

```text
纯火构筑合法：
- 爆焰冲击
- 灼烧附着
- 炎域压制
- 烬印引爆
- 火环封路

纯火构筑非法：
- 冰封
- 雷链
- 岩牢
- 影缚
- 风刃
```

---

### 8.5 能力预算筛选

每个技能位最终不应什么都有。

建议预算：

```ts
type AbilityBudget = {
  main: 1;
  secondary: 2;
  mutation: 1;
};
```

筛选顺序：

1. 从候选能力中选最高分作为 mainAbility。
2. 从剩余候选中选 1–2 个不冲突的 secondaryAbilities。
3. 如果 backwardMutation 或 forwardContext 足够强，允许选 0–1 个 mutationAbility。
4. 总能力数建议控制在 2–4 个。

能力冲突示例：

```ts
const ABILITY_CONFLICTS = {
  hard_bind: ["high_mobility"],
  instant_burst: ["long_delay"],
  guard_wall: ["full_pierce"],
  pure_single_target: ["large_aoe"]
};
```

---

## 9. 标签、参数、动画参数生成

### 9.1 标签从能力反推

不要直接从 behavior threshold 生成标签。

新的方式：

```text
selected abilities → tags
```

例如：

```text
爆焰冲击 → 爆发 / 直接命中
灼烧附着 → 持续伤害 / 蔓延
烬印引爆 → 标记 / 延迟触发 / 二段爆发
雷网约束 → 区域控制 / 麻痹 / 控制
风引牵拉 → 牵引 / 位移 / 连锁
```

最终标签做去重与数量限制：

```ts
const MAX_TAGS_PER_SKILL = 5;
```

---

### 9.2 参数从能力与最终向量共同生成

参数不应只来自标签，也不应只来自向量。

建议：

```ts
type SkillParams = {
  damageType: ElementKey | "mixed";
  damageProfile: "burst" | "dot" | "hybrid" | "control" | "utility";
  rangeScore: number;
  controlScore: number;
  burstScore: number;
  chainCount: number;
  delayTime: number;
  hasConditionalTrigger: boolean;
  hasMobilityOrKnockback: boolean;
};
```

生成原则：

- `damageType` 来自主元素或混合元素来源。
- `damageProfile` 来自主能力。
- `rangeScore` 参考 `spread + zone`。
- `controlScore` 参考 `control + bind + pullPush`，但必须由合法能力解释。
- `burstScore` 参考 `impact + burst`。
- `chainCount` 必须由 chain 类能力或对应元素互动支持。
- `delayTime` 必须由 delay / mark 类能力支持。

---

### 9.3 动画参数从能力反推，并受向量微调

建议结构：

```ts
type AnimationParams = {
  primaryColor: string;
  secondaryColor?: string;
  particleCount: number;
  particleSpeed: number;
  radius: number;
  hasChain: boolean;
  hasGroundZone: boolean;
  hasDelayMark: boolean;
  hasBurst: boolean;
  hasKnockback: boolean;
  hasBindRing: boolean;
};
```

生成原则：

- 主颜色来自 mainAbility 的主元素。
- secondaryColor 只有在存在合法混合元素时出现。
- hasChain 只能由 chain 能力、雷系传导、风引、或合法元素互动触发。
- hasBindRing 只能由 bind / control 合法能力触发。
- 纯火构筑的 bindRing 应表现为火环压制，而不是冰牢或岩牢。
- 粒子数量、速度、范围可以由最终向量微调。

---

## 10. Build 总览与构筑指纹

最终结果应包含 4 个技能位的独立技能，以及一个 Build 总览。

```ts
type BuildResult = {
  skills: DecodedSkill[];
  buildTags: string[];
  dominantElements: ElementKey[];
  dominantBehaviors: BehaviorKey[];
  fingerprint: string;
  trace: BuildTrace;
};
```

构筑指纹可以由以下内容生成：

```text
技能种子序列
+ 每个技能位最终 Top 行为
+ 主元素分布
+ 能力组 id
```

示例：

```text
FIRE-BUILD / 爆焰-灼流-炎域-烬印 / 火域持续引爆型
```

核心展示语：

> 相同技能种子，不同顺序，会因为互馈拓扑不同形成不同构筑指纹。

---

## 11. Trace 要求

How 页必须能解释计算过程，因此 engine 输出必须包含 trace。

### 11.1 每个技能位 trace

```ts
type SkillComputationTrace = {
  slotIndex: number;
  seedId: string;
  selfTopBehaviors: Array<{ key: BehaviorKey; value: number }>;
  forwardSources: Array<{
    fromSlot: number;
    relationScore: number;
    boostedBehaviors: Partial<Record<BehaviorKey, number>>;
    labelHint?: string;
  }>;
  backwardSources: Array<{
    fromSlot: number;
    relationScore: number;
    boostedBehaviors: Partial<Record<BehaviorKey, number>>;
    labelHint?: string;
  }>;
  finalTopBehaviors: Array<{ key: BehaviorKey; value: number }>;
};
```

### 11.2 解码 trace

```ts
type SkillDecodeTrace = {
  legalCandidates: Array<{ id: string; score: number; reason: string }>;
  rejectedCandidates: Array<{ id: string; reason: string }>;
  selectedMain: string;
  selectedSecondary: string[];
  selectedMutation?: string;
};
```

How 页不需要展示所有数值，但至少展示：

1. 当前技能位的初始 Top 行为。
2. 前向塑形来源。
3. 后向改写来源。
4. 最终 Top 行为。
5. 候选能力 Top 5。
6. 为什么某些能力被拒绝，例如元素来源不足或互斥。

---

## 12. 默认测试案例

本次修正必须至少通过以下案例。

### 12.1 纯火顺序差异

构筑 A：

```text
fire_flow → fire_zone → fire_mark → fire_impact
```

预期倾向：

```text
持续灼烧 → 火场压制 → 烬印延迟 → 爆焰收束
```

可能结果：

```text
火域持续引爆型 Build
```

构筑 B：

```text
fire_impact → fire_mark → fire_zone → fire_flow
```

预期倾向：

```text
爆焰开局 → 烬印标记 → 火场扩张 → 灼烧蔓延
```

可能结果：

```text
爆焰烬印蔓延型 Build
```

验收要求：

- 两者都必须是纯火合法结果。
- 不允许出现冰冻、雷链、岩牢、影缚、风刃等无来源效果。
- 两者技能名称、技能描述、能力组、动画参数必须有明显差异。

---

### 12.2 同种技能重复构筑

构筑：

```text
fire_impact → fire_impact → fire_impact → fire_impact
```

预期：

- 极端爆发火。
- 技能之间可以互相强化 burst / impact。
- 不应生成过多 dot / bind / chain。
- 不应因为重复而崩溃或被 UI 禁止。

---

### 12.3 混合元素顺序差异

构筑 A：

```text
wind_flow → lightning_mark → frost_zone → fire_impact
```

预期倾向：

```text
风塑形速度与牵引 → 雷标记 → 冰域控制 → 火焰爆裂收束
```

构筑 B：

```text
fire_impact → frost_zone → lightning_mark → wind_flow
```

预期倾向：

```text
火爆发开局 → 冰域限制 → 雷标记追击 → 风流动扩散
```

验收要求：

- 两者使用相同技能种子，但顺序不同。
- 输出必须明显不同。
- 可以出现混合反应，但每个元素表现必须有来源。
- 不允许通过完整排列查表硬编码这两个结果。

---

### 12.4 元素合法性守恒

任意纯单元素构筑都必须满足：

```text
纯火不出冰冻 / 雷链 / 岩牢 / 影缚 / 风刃
纯冰不出爆焰 / 雷链 / 岩突 / 影刺 / 风刃
纯雷不出冰封 / 火焰 / 岩牢 / 影缚 / 风壁
纯岩不出火焰 / 冰冻 / 雷链 / 影刺 / 风刃
纯影不出火焰 / 冰冻 / 雷链 / 岩牢 / 风刃
纯风不出火焰 / 冰冻 / 雷链 / 岩牢 / 影缚
```

但允许行为层表达相似功能：

```text
火系 control → 火场压制 / 灼烧逼退
冰系 control → 减速 / 冻结
岩系 control → 岩牢 / 地缚
影系 control → 影缚 / 恐惧标记
风系 control → 风压牵制 / 气旋限制
```

---

## 13. 建议文件修改范围

根据现有项目结构，优先修改：

```text
src/data/runes.ts 或 src/data/skillSeeds.ts
src/data/vectorDims.ts
src/engine/vectorMath.ts
src/engine/attentionEngine.ts 或 src/engine/mutualFeedbackEngine.ts
src/engine/positionEncoding.ts
src/engine/skillDecoder.ts
src/engine/skillNameGenerator.ts
src/engine/specialResonance.ts
src/engine/generateSkill.ts 或 buildEngine.ts
src/components/TechExplainer.tsx
```

建议新增：

```text
src/engine/elementLegality.ts
src/engine/relationScore.ts
src/engine/mutualFeedbackEngine.ts
src/engine/abilityCandidates.ts
src/engine/abilityScoring.ts
src/engine/abilityBudget.ts
```

如果现有文件名不同，可以按实际项目结构调整，但必须保证：

- UI 组件不直接写规则。
- engine 输出包含 trace。
- decoder 不再用单维阈值直接出标签。
- 位置倍率不再直接乘 selfVector。

---

## 14. 给 coding agent 的执行 Prompt

可以直接复制以下内容给 coding agent：

```text
你是一名前端规则引擎工程师。当前项目已经完成基础 Demo，不需要重做 UI、Three.js 场景、部署和 README。请根据《AI 规则引擎 Demo：核心规则引擎修正文档 V4 / 向量互馈解码版》进行核心逻辑修正。

本轮目标：只改核心规则引擎，使现有 Demo 从「位置倍率 + 单维阈值触发」升级为「元素守恒 + 技能位互馈向量计算 + 候选能力竞争解码 + 能力预算筛选」。

必须遵守：

1. 4 个槽位是 4 个独立技能位，不是起式 / 形式 / 变式 / 终式。
2. 删除 position multiplier 直接乘 selfVector 的逻辑。
3. 保留向量计算作为核心，不允许退化成纯模板查表。
4. 将语义状态拆分为 elementVector + behaviorVector。
5. behaviorVector 使用通用 16 维：impact、burst、dot、spread、zone、control、bind、chain、delay、mark、pierce、guard、pullPush、mobility、speed、summon。
6. 每个元素保留 4 种固化方向：impact / flow / zone / mark。
7. 必须允许重复选择，同一个技能种子可以出现在多个技能位。
8. 新增 relationScore，用于计算技能位之间的互馈关系。
9. 新增 forwardContext 与 backwardMutation。前面技能影响后续技能，后续技能反向改写前面技能。
10. self 权重必须最高，互馈不能覆盖技能本体。
11. 废弃单维度阈值直接触发标签。
12. 新增 candidate ability scoring。最终向量先生成候选能力分数，再进行元素合法性过滤、互斥处理和能力预算筛选。
13. 纯火构筑不能生成冰冻、雷链、岩牢、影缚、风刃等无来源效果。其他纯元素同理。
14. tags / params / animationParams 必须从最终能力组反推，并可受最终向量微调。
15. generateSkill 或 buildEngine 必须输出 trace，供 How 页解释。

默认测试案例必须通过：

A. 纯火顺序差异：
fire_flow → fire_zone → fire_mark → fire_impact
对比
fire_impact → fire_mark → fire_zone → fire_flow
两者都必须是纯火合法结果，但名称、描述、能力组、动画参数明显不同。

B. 重复技能种子：
fire_impact → fire_impact → fire_impact → fire_impact
必须合法运行，倾向极端爆发火，不应生成无来源元素。

C. 混合元素顺序差异：
wind_flow → lightning_mark → frost_zone → fire_impact
对比
fire_impact → frost_zone → lightning_mark → wind_flow
两者使用相同技能种子但顺序不同，输出必须明显不同，且不能靠完整排列查表硬编码。

完成后输出：

- changed files
- 删除了哪些旧逻辑
- 新增了哪些 engine 模块
- 3 组默认测试案例的输出摘要
- 纯元素守恒是否通过
- How 页 trace 是否可解释
- 仍需后续优化的内容
```

---

## 15. 最终验收标准

本次核心修正完成后，应满足：

1. 4 个槽位被明确解释为 4 个独立技能位。
2. 不再出现起式 / 形式 / 变式 / 终式作为核心模型。
3. position multiplier 不再直接乘技能本体向量。
4. 技能种子语义拆成 elementVector + behaviorVector。
5. 技能位之间存在前向塑形和后向改写。
6. 同一组技能种子不同顺序会输出不同 Build。
7. 重复技能种子合法。
8. 单元素构筑不产生无来源元素能力。
9. 结果不再由单维阈值直接触发标签。
10. 标签、参数、动画来自能力组，而能力组来自向量评分。
11. How 页能展示至少一个技能位的互馈与候选能力选择过程。
12. 控制台无明显运行错误。

---

## 16. 设计底线

本次修正必须始终围绕一个中心思想：

> 玩家不是在选择预设技能，也不是在触发随机模板，而是在排列一组会彼此改写的技能种子。向量空间计算它们的语义互馈，候选能力系统把计算结果翻译成符合元素直觉的技能表现。

