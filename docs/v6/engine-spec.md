---
description: V6 规则引擎的精确数据流、连续聚合公式、TypeScript 输出合同与 Trace 结构。
---

# V6 规则引擎规格

## 1. 输入与输出

引擎支持 `1..4` 枚技能实时生成。Play 可在每次加入、移除、交换技能后立即重新计算。

```ts
type GenerateBuildInput = {
  seedIds: string[];
};

type GenerateBuildV6 = (
  input: GenerateBuildInput
) => GeneratedBuild;
```

输入约束：

- 数组长度为 `1..4`。
- 同一 seed 是否允许重复由 UI 决定；引擎必须能正确处理重复。
- 非法 seed ID 直接抛出带 ID 的错误，不静默回退。
- 不接受随机种子，不读取时间。

输出必须是确定性的：

```ts
generateBuildV6(input) deepEqual generateBuildV6(input)
```

## 2. 总体管线

```text
1. 读取基础技能
2. 建立 base snapshots
3. 从左到右计算前向影响
4. 冻结所有 forward snapshots
5. 将后位来源投影为仅含主元素的 outbound signature
6. 对每个目标联合计算所有后位来源
7. 得到 final snapshots
8. 解码名称、描述、变化摘要和动画规格
9. 输出 GeneratedBuild + BuildTrace
```

伪代码：

```ts
function generateBuildV6(input: GenerateBuildInput): GeneratedBuild {
  const base = input.seedIds.map(getBaseSnapshot);
  const forward = computeForwardPass(base);
  const frozenForward = deepFreezeForDevelopment(forward);
  const backward = computeBackwardPass(frozenForward);
  const skills = backward.map(finalizeGeneratedSkill);
  return {
    version: "v6",
    input,
    skills,
    trace: buildTrace(base, forward, backward, skills),
  };
}
```

生产环境不要求真正执行 `deepFreeze`，但实现不得修改传入对象。

## 3. 快照模型

```ts
type ElementAccent = {
  element: ElementKey;
  strength: number;
  pass: "forward" | "backward";
  sourceSlots: number[];
  visualCue: VisualCueKey;
};

type SkillSnapshot = {
  slot: number;
  seedId: string;
  primaryElement: ElementKey;
  aspect: SeedAspect;
  form: SkillForm;
  coreEffect: string;
  stats: NormalizedStats;
  mechanics: MechanicState;
  accents: ElementAccent[];
};
```

以下字段在所有阶段保持不变：

- `seedId`
- `primaryElement`
- `aspect`
- `form`
- `coreEffect`

只有 `stats`、`mechanics`、`accents` 可以变化。

## 4. 来源表达强度

定向反应表已经说明“可以发生什么”，来源表达强度说明“这个具体技能能表达多少”。

### 4.1 参数驱动映射

```ts
const STAT_DRIVERS: Record<StatKey, StatKey[]> = {
  power: ["power"],
  reach: ["reach", "propagation"],
  area: ["area", "propagation"],
  duration: ["duration"],
  speed: ["speed"],
  control: ["control"],
  force: ["force", "power"],
  propagation: ["propagation"],
  penetration: ["penetration", "power"],
  protection: ["protection", "duration"],
};
```

某个参数键的来源驱动值：

```ts
driver(source, key) =
  max(source.stats[d] for d in STAT_DRIVERS[key])
```

来源表达系数：

```ts
sourceExpression(source, key) =
  0.55 + 0.45 * driver(source, key)
```

范围为 `0.55..1`。这样基础值较低的技能仍能表达元素关系，但强项技能会表达得更明显。

### 4.2 机制驱动映射

```ts
const MECHANIC_DRIVERS: Record<MechanicKey, StatKey[]> = {
  burn: ["power", "duration"],
  chill: ["control", "duration"],
  freeze: ["control", "duration"],
  shock: ["speed", "propagation"],
  stun: ["force", "control"],
  knockback: ["force"],
  pull: ["force", "control"],
  pierce: ["penetration", "power"],
  guard: ["protection", "duration"],
  mark: ["duration", "control"],
  delayedBurst: ["power", "duration"],
  chain: ["propagation", "speed"],
  fracture: ["force", "penetration"],
  bind: ["control", "duration"],
  obscure: ["area", "duration"],
  echo: ["duration", "propagation"],
  haste: ["speed"],
};
```

机制使用相同的 `0.55 + 0.45 * max(driver stats)` 公式。

## 5. 目标形态接受度

元素关系不能改变形态，但不同形态对参数变化的表达能力不同。

基础接受度为 `0.75`，叠加以下修正后限制到 `0.40..1`：

```ts
const FORM_RECEPTIVITY_MODIFIERS:
  Record<SkillForm, Partial<Record<StatKey, number>>> = {
  projectile: {
    reach: +0.10,
    area: -0.20,
    duration: -0.15,
    speed: +0.15,
    penetration: +0.20,
  },
  cone: {
    area: +0.10,
    duration: +0.10,
    propagation: +0.05,
  },
  zone: {
    area: +0.20,
    duration: +0.20,
    speed: -0.25,
    control: +0.10,
  },
  chain: {
    propagation: +0.25,
    speed: +0.10,
    area: +0.05,
    protection: -0.20,
  },
  movement: {
    speed: +0.25,
    reach: +0.10,
    protection: +0.05,
    duration: -0.10,
    area: -0.10,
  },
  construct: {
    protection: +0.25,
    duration: +0.20,
    control: +0.10,
    speed: -0.35,
    propagation: -0.25,
  },
  mark: {
    duration: +0.20,
    control: +0.10,
    power: +0.10,
    speed: -0.15,
  },
  summon: {
    duration: +0.20,
    area: +0.15,
    force: +0.10,
    protection: +0.05,
    speed: -0.20,
  },
  line: {
    reach: +0.15,
    penetration: +0.20,
    force: +0.10,
    area: -0.05,
  },
};
```

公式：

```ts
formReceptivity(target, key) =
  clamp(0.75 + (modifier[target.form][key] ?? 0), 0.40, 1)
```

形态接受度只缩放变化，不做硬门控。

## 6. 前向计算

### 6.1 语义

前位技能对后位技能负责较强的本质改变：

- 改变主要参数轮廓。
- 增减关键机制。
- 增加一个明显的元素混合表现。
- 不改变目标技能固定形态和主元素。

### 6.2 距离

槽位使用 `0..3`，来源在目标左侧。

```ts
forwardDistance(sourceSlot, targetSlot) =
  0.58 ** (targetSlot - sourceSlot - 1)
```

| 间隔 | 系数 |
|---|---:|
| 相邻 | 1.000 |
| 隔 1 个槽位 | 0.580 |
| 隔 2 个槽位 | 0.336 |

因此越近的前向影响越大，但所有前位来源都参与。

### 6.3 前向来源快照

前向按目标槽位从左到右计算。

```text
slot 1 无前向来源
slot 2 读取 slot 1 的已解析前向快照
slot 3 读取 slot 1、2 的已解析前向快照
slot 4 读取 slot 1、2、3 的已解析前向快照
```

使用已经解析的数值可以保留一条有向构筑链，但读取元素关系时只使用来源技能的 `primaryElement`。

禁止读取：

- 来源的 `accentElement` 作为元素规则 key。
- 来源由其他元素新增、且不属于其主元素能力的机制。
- 目标尚未计算完成的状态。

### 6.4 出站投影

```ts
type OutboundSignature = {
  slot: number;
  primaryElement: ElementKey;
  form: SkillForm;
  stats: NormalizedStats;
};
```

`projectOutboundSignature()`：

1. 保留来源当前前向快照中的 10 个参数。
2. 保留主元素、形态和槽位。
3. 丢弃全部 `accents`。
4. 不携带机制列表参与下一个元素 key 的选择。

例如风增强了火技能的范围后，这个火技能可以作为“范围更强的火”影响后续技能；但它不能把风元素或拉拽机制继续传下去。

### 6.5 单项前向贡献

对于来源 `s`、目标 `t`、参数 `k`：

```ts
const FORWARD_PASS_GAIN = 1.35;

rawForwardStatDelta(s, t, k) =
  rule(s.primaryElement, t.primaryElement)
    .forward.statDeltas[k]
  * rule.forward.affinity
  * forwardDistance(s.slot, t.slot)
  * sourceExpression(s, k)
  * formReceptivity(t, k)
  * FORWARD_PASS_GAIN
```

没有定义该参数时贡献为 `0`。

机制使用相同公式，只将参数驱动替换为机制驱动；机制的形态接受度固定为 `0.85`，因为反应表已经人工限制了机制语义。

`1.35` 是全局职责系数，用于保证前向改变明显强于后向修饰。它对所有排列和元素关系一视同仁，不得针对默认 A/B 单独调整。

## 7. 后向计算

### 7.1 语义

后位技能对前位技能负责轻量但可辨识的修饰：

- 小幅调整参数。
- 增加次级机制、触发感或材质表现。
- 所有后位来源联合参与。
- 越靠后的技能权威度越高。
- 不覆盖前位技能的主效果。

### 7.2 冻结边界

开始后向计算前，所有前向快照必须已经生成并冻结。

后向计算期间：

- 每个提案都读取同一组冻结快照。
- 一个目标的已解析后向结果不得成为另一个提案的输入。
- 后向结果不得再次触发前向计算。
- 不存在迭代到收敛的循环。

### 7.3 后位权威度

权威度绑定绝对槽位：

```ts
const BACKWARD_AUTHORITY_BY_SLOT = [
  0.00, // slot 1 不可能作为后向来源
  0.70, // slot 2
  0.85, // slot 3
  1.00, // slot 4
];
```

这体现“越后面的技能越接近玩家最终选择”。

### 7.4 后向距离

后向距离衰减较弱：

```ts
backwardDistance(sourceSlot, targetSlot) =
  0.86 ** (sourceSlot - targetSlot - 1)
```

| 间隔 | 系数 |
|---|---:|
| 相邻 | 1.000 |
| 隔 1 个槽位 | 0.860 |
| 隔 2 个槽位 | 0.740 |

权威度与距离共同作用。例如 slot 1 接收：

```text
slot 2: 0.70 × 1.00 = 0.700
slot 3: 0.85 × 0.86 = 0.731
slot 4: 1.00 × 0.74 = 0.740
```

因此最末位仍略强，但不会完全覆盖其他来源。

### 7.5 单项后向贡献

对于后位来源 `s`、前位目标 `t`、参数 `k`：

```ts
rawBackwardStatDelta(s, t, k) =
  rule(s.primaryElement, t.primaryElement)
    .backward.statDeltas[k]
  * rule.backward.affinity
  * backwardDistance(s.slot, t.slot)
  * BACKWARD_AUTHORITY_BY_SLOT[s.slot]
  * sourceExpression(projectOutboundSignature(s), k)
  * formReceptivity(t, k)
  * BACKWARD_PASS_GAIN
```

机制计算方式相同。

注意元素规则方向始终是“来源元素 -> 目标元素”。不要因为它处于 backward pass 就反转 key。

其中：

```ts
const BACKWARD_PASS_GAIN = 1.00;
```

## 8. 有符号联合聚合

### 8.1 为什么不用 Softmax

Softmax 会导致：

- 所有来源被迫竞争一个正权重总量。
- 负向影响难以表达。
- 没有关系的来源也会获得权重。
- 多个来源同时增强不同维度时被错误压缩。

V6 对每个参数和机制分别进行有符号求和与饱和。

### 8.2 饱和函数

```ts
saturate(sum, cap) =
  cap * Math.tanh(sum / cap)
```

特性：

- 小值接近线性。
- 正负保持。
- 多来源不会无限叠加。
- 相反贡献可以真实抵消。

### 8.3 聚合上限

```ts
const CAPS = {
  forwardStat: 0.35,
  backwardStat: 0.18,
  forwardMechanic: 0.65,
  backwardMechanic: 0.35,
  finalStatMin: 0,
  finalStatMax: 1,
  finalMechanicMin: 0,
  finalMechanicMax: 1,
} as const;
```

对目标参数：

```ts
forwardDelta[k] =
  saturate(sum(all forward stat contributions for k), 0.35)

afterForward.stats[k] =
  clamp(base.stats[k] + forwardDelta[k], 0, 1)

backwardDelta[k] =
  saturate(sum(all backward stat contributions for k), 0.18)

final.stats[k] =
  clamp(afterForward.stats[k] + backwardDelta[k], 0, 1)
```

机制使用同样流程和机制上限。

### 8.4 不做 Top-K

所有合法来源都进入聚合。Top-K 只允许用于 UI：

- 卡片只显示最显著的 3 项变化。
- 动画只显示一个主要前向 Cue 和一个主要后向 Cue。
- How 必须仍能展开全部贡献。

## 9. 能力边界校验

反应表是主要的语义边界。实现时再进行两类校验。

### 9.1 数据加载校验

`validateDirectedReactionRules()` 必须检查：

- 正好存在 36 个唯一的 `source-target` key。
- affinity、accentStrength 在 `0..1`。
- stat delta 在 `-0.35..0.35`。
- mechanic delta 在 `-0.65..0.65`。
- 同元素规则不能产生非零混合元素。
- `雷 -> 岩` 不得增加 `shock` 或 `chain`。
- `岩 -> 雷` 不得增加 `shock` 或 `chain`。
- 只有风或岩来源规则可以增加 `knockback`；岩技能自身的原生击退不受此限制。
- 只有风来源规则可以增加 `pull`。
- 只有冰来源或冰同源规则可以增加 `freeze`。

这些是数据健康检查，不是运行时完整排列分支。

### 9.2 运行时裁剪

如果规则数据被未来修改为不合法：

```ts
acceptedDelta = capabilityAllows(rule, key)
  ? rawDelta
  : 0;
```

Trace 记录：

```ts
{
  status: "rejected",
  reason: "element_capability_forbidden"
}
```

不得静默丢弃。

## 10. 混合元素与视觉贡献

每个非同元素反应可产生一个 accent 提案：

```ts
rawAccentStrength =
  rule.accentStrength
  * rule.affinity
  * distance
  * passMultiplier
```

其中：

```ts
passMultiplier =
  pass === "forward"
    ? 1
    : BACKWARD_AUTHORITY_BY_SLOT[source.slot]
```

同一目标、同一来源元素、同一 pass 的 accent 先求和再饱和：

```ts
accentCap = pass === "forward" ? 0.35 : 0.18;
```

最终结果保留全部非零 `accents`，按强度降序。

限制：

- `primaryElement` 永不改变。
- `accents` 不进入元素规则 key。
- UI 默认显示最强前向 accent 和最强后向 accent。
- 其余 accent 只在 How 展开层显示。

## 11. 变化显著度

每个来源对目标的贡献显著度用于排序和展示，不参与计算：

```ts
contributionSalience =
  sum(abs(acceptedStatDeltas))
  + 0.75 * sum(abs(acceptedMechanicDeltas))
  + 0.50 * acceptedAccentStrength
```

每个目标技能的总体变化显著度：

```ts
skillSalience =
  sum(abs(final.stats[k] - base.stats[k]))
  + 0.75 * sum(abs(final.mechanics[k] - base.mechanics[k]))
```

显著度只决定：

- 卡片先展示哪些变化。
- 哪个 Cue 进入主动画。
- 命名优先采用哪个反应词。

它不能决定贡献是否生效。

## 12. 输出合同

```ts
type ChangeSummary = {
  key: StatKey | MechanicKey;
  kind: "stat" | "mechanic";
  baseValue: number;
  forwardValue: number;
  finalValue: number;
  delta: number;
  sources: Array<{
    slot: number;
    pass: "forward" | "backward";
  }>;
  direction: "increase" | "decrease" | "mixed";
};

type GeneratedSkill = {
  slot: number;
  seedId: string;
  baseName: string;
  generatedName: string;
  primaryElement: ElementKey;
  aspect: SeedAspect;
  form: SkillForm;
  coreEffect: string;
  description: string;
  baseStats: NormalizedStats;
  forwardStats: NormalizedStats;
  finalStats: NormalizedStats;
  baseMechanics: MechanicState;
  forwardMechanics: MechanicState;
  finalMechanics: MechanicState;
  accents: ElementAccent[];
  changes: ChangeSummary[];
  tags: string[];
  animation: AnimationSpec;
};

type GeneratedBuild = {
  version: "v6";
  input: GenerateBuildInput;
  skills: GeneratedSkill[];
  trace: BuildTrace;
};
```

`GeneratedSkill` 保留三层值，是为了让 Play 和 How 不必重新计算差值。

当同一项同时存在正贡献和负贡献时，`direction` 使用 `mixed`，即使最终净变化仍为正或负；UI 应显示净结果，并允许展开查看双方来源。

## 13. Trace 合同

### 13.1 单项贡献

```ts
type ContributionTrace = {
  id: string;
  pass: "forward" | "backward";
  sourceSlot: number;
  targetSlot: number;
  sourceSeedId: string;
  targetSeedId: string;
  sourceElement: ElementKey;
  targetElement: ElementKey;
  reactionKey: string;
  reactionName: string;
  key: StatKey | MechanicKey | "accent";
  kind: "stat" | "mechanic" | "accent";
  ruleDelta: number;
  affinity: number;
  distanceFactor: number;
  authorityFactor: number;
  sourceExpression: number;
  targetReceptivity: number;
  rawDelta: number;
  acceptedDelta: number;
  status: "accepted" | "rejected";
  rejectionReason?: string;
  explanation: string;
};
```

前向 `authorityFactor` 固定为 `1`。

### 13.2 聚合记录

```ts
type AggregateTrace = {
  id: string;
  pass: "forward" | "backward";
  targetSlot: number;
  key: StatKey | MechanicKey;
  contributionIds: string[];
  signedSum: number;
  cap: number;
  saturatedDelta: number;
  valueBefore: number;
  valueAfter: number;
};
```

### 13.3 技能阶段

```ts
type SkillStageTrace = {
  slot: number;
  seedId: string;
  base: SkillSnapshot;
  afterForward: SkillSnapshot;
  final: SkillSnapshot;
  contributionIds: string[];
  aggregateIds: string[];
  dominantForwardContributionId?: string;
  dominantBackwardContributionId?: string;
};

type BuildTrace = {
  version: "v6";
  inputSeedIds: string[];
  contributions: ContributionTrace[];
  aggregates: AggregateTrace[];
  skills: SkillStageTrace[];
};
```

### 13.4 Trace 真实性约束

- How 只能读取 Trace，不重新执行简化公式。
- `explanation` 可以由模板生成，但模板参数必须来自该条贡献。
- 每个最终变化必须能追溯到至少一个 contribution ID。
- 被正负贡献抵消的来源仍保留在 Trace 中。
- 被能力边界拒绝的贡献仍保留在 Trace 中。
- 不允许在 UI 中手写“因为火与冰产生蒸汽”，但 Trace 中不存在对应反应。

## 14. 实时增量语义

用户加入第 4 枚技能后，前 3 枚技能允许重新变化，这是预期行为。

```text
加入 slot 2：
slot 1 获得来自 slot 2 的后向修饰
slot 2 获得来自 slot 1 的前向改变

加入 slot 3：
重新计算全部
slot 1 同时接收 slot 2、3 的后向联合结果
slot 2 增加来自 slot 3 的后向修饰
slot 3 接收 slot 1、2 的前向联合结果
```

React 层每次调用完整纯函数即可。四槽规模不需要增量缓存。

## 15. 必须满足的数学性质

### 15.1 确定性

相同输入相同输出。

### 15.2 有界性

所有最终参数和机制在 `0..1`。

### 15.3 顺序敏感

对至少绝大多数跨元素排列：

```text
generateBuild([a,b,c,d]) != generateBuild([d,c,b,a])
```

差异不能只存在于 Trace ID 或浮点尾数。

### 15.4 主身份稳定

任意排列中：

```text
result.form === base.form
result.primaryElement === base.element
result.coreEffect === base.coreEffect
```

### 15.5 无混合传播

任何 contribution 的 `sourceElement` 必须等于来源 seed 的基础元素。

### 15.6 无递归

后向结果改变后，不产生新 contribution。

### 15.7 末位权威但不独占

slot 4 的后向权威度最高，但 slot 2、3 的合法贡献仍必须出现在聚合中。
