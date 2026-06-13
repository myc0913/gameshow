---
description: V6 的命名、Play、How、Three.js 表达、迁移阶段、测试矩阵与编码交接要求。
---

# V6 展示、迁移与验收

## 1. 展示目标

用户不应该通过想象判断构筑是否变化。每次加入、移除或交换技能后，至少从以下四个层面直接看到结果：

1. 技能名称或副标题变化。
2. 关键参数出现基础值到当前值的明确增减。
3. 机制标签出现、增强、削弱或消失。
4. 动画保留同一主形态，但材质、范围、时序和反应 Cue 明显不同。

How 页负责回答：

```text
谁影响了谁？
为什么这个元素关系合理？
改变了哪些参数和机制？
多个来源怎样联合成最终结果？
为什么顺序交换后结果不同？
```

## 2. 信息分层

不要在所有界面同时展示全部 10 个参数和 17 个机制。

### 2.1 Play 第一层

每个技能卡片只显示：

- 生成名称。
- 基础主效果一句话。
- 固定形态标签。
- 最显著的 3 项变化。
- 最强的 2 个当前机制。
- 一个“受哪些槽位影响”的来源摘要。

### 2.2 Play 展开层

展开后显示：

- 10 个参数中的基础高项和所有发生明显变化的项。
- `基础值 -> 前向后 -> 最终值`。
- 全部当前机制。
- 前向主反应和后向联合修饰。
- 动画图例。

### 2.3 How

How 展示完整 Trace，但默认先给人类可读解释，公式和小数放在二级展开区。

## 3. 名称生成

### 3.1 目标

名称用于快速表达构筑变化，不能反过来决定技能结果。

### 3.2 确定性规则

1. 取 `contributionSalience` 最高的前向贡献组作为前缀来源。
2. 取最高的后向贡献组作为后缀来源。
3. 无前向贡献时保留基础名。
4. 无后向贡献时不加后缀。
5. 同一输入必须生成同一名称。

格式：

```text
有前向、无后向：{反应前缀}{基础名}
无前向、有后向：{基础名}·{后位余韵}
两者都有：{反应前缀}{基础名}·{后位余韵}
都没有：{基础名}
```

### 3.3 词库

反应前缀优先从 `visualCue` 映射：

| Cue | 前缀 |
|---|---|
| `steam_melt` | 蒸融 |
| `thermal_overload` | 炽载 |
| `molten_fracture` | 熔裂 |
| `hidden_ember` | 潜烬 |
| `fire_spread` | 燎风 |
| `cold_suppression` | 霜抑 |
| `cold_drag` | 凝滞 |
| `frozen_reinforcement` | 冻铸 |
| `frost_bind` | 寒缚 |
| `ice_mist` | 冰雾 |
| `ignition_surge` | 迅燃 |
| `thermal_shatter` | 电裂 |
| `stone_shock_fracture` | 雷震 |
| `shadow_reveal` | 显影 |
| `storm_agitation` | 激岚 |
| `kiln_focus` | 炉聚 |
| `ice_stone_composite` | 冰岩 |
| `grounding_block` | 截流 |
| `shadow_seal` | 封影 |
| `wind_break` | 镇风 |
| `hidden_flame` | 暗焰 |
| `black_ice` | 黑冰 |
| `latent_lightning` | 潜雷 |
| `shadow_erosion` | 蚀隙 |
| `hidden_turbulence` | 幽流 |
| `wind_fan_flame` | 风炽 |
| `snow_carry` | 卷雪 |
| `storm_channel` | 风雷 |
| `dust_erosion` | 风蚀 |
| `shadow_drift` | 影行 |
| `same_element_resonance` | 共鸣 |

后位余韵只表示来源主元素：

| 来源元素 | 后缀 |
|---|---|
| 火 | 余焰 |
| 冰 | 寒痕 |
| 雷 | 雷鸣 |
| 岩 | 岩心 |
| 影 | 影蚀 |
| 风 | 风尾 |

如果多个后位来源贡献接近，仍只用显著度最高的一个命名，其他来源保留在变化摘要和 How 中。

### 3.4 名称约束

- 名称最多 10 个汉字，不含分隔符。
- 不把未通过能力校验的机制写入名称。
- 不把低强度 accent 写成技能主元素。
- 不使用完整排列特例。

## 4. 描述生成

描述由真实阶段结果生成：

```text
{coreEffect}。
{dominantForwardSentence}
{backwardJointSentence}
```

示例结构：

```text
持续释放寒流，降低覆盖目标的行动能力。
前位火焰使寒流蒸腾扩散，但冻结能力下降。
后位风与岩共同扩大覆盖并提高稳定性。
```

规则：

- 没有对应 Trace 时不输出该句。
- 正负变化同时存在时必须同时说明。
- 后向有多个有效来源时使用“共同”或分别列出，不假装只来自末位。
- 文案只取 1 个前向主反应和 1 个后向联合摘要，完整细节交给 How。

## 5. 标签生成

标签只概括真实结果，按以下顺序生成：

1. 固定主元素标签。
2. 固定形态标签。
3. 显著度最高的反应名称标签。
4. 最终强度最高的 1 个机制标签。
5. 再选择 1 个强度不低于 `0.15`、且相对基础变化最明显的新增或受影响机制。
6. 如果某个原生机制相对基础值下降至少 `0.12`，增加“弱化：{机制}”标签。

第二个机制标签优先表达构筑变化，不能永远被基础技能原生的高数值机制挤掉。

`0.15` 和 `0.12` 只决定卡片信息层级，不影响引擎计算或机制是否存在。

同一类别按数值降序、再按固定枚举顺序打破平局，禁止依赖对象遍历顺序。

## 6. Play 页面

### 6.1 页面布局

建议从上到下：

```text
符文池
四槽顺序条
当前选中技能的动画舞台
技能 1..4 结果卡
构筑变化账本
A/B 对比入口
```

顺序条必须始终可见，并明确箭头方向：

```text
技能 I -> 技能 II -> 技能 III -> 技能 IV
前向影响增强后位技能；后向影响轻量回写前位技能
```

### 6.2 技能卡

推荐结构：

```text
[Slot II] 蒸融霜环·风尾
冰 / 领域 / 主效果：展开低温区域

范围   80 -> 91  +11
冻结   65 -> 43  -22
遮蔽    0 -> 12  +12

来源：I 火（前向） / IV 风（后向）
[查看推演]
```

变化值必须显示符号和颜色，且基准标记始终可见。

不要只显示：

```text
威力 0.62
范围 0.71
控制 0.58
```

这种展示无法让用户知道是否变化。

### 6.3 实时变化账本

当序列变化时，UI 保存上一份 `GeneratedBuild`，调用纯函数：

```ts
diffBuilds(previousBuild, currentBuild)
```

账本按 seed 对齐，而不是按槽位对齐：

```ts
type SkillOccurrenceKey = `${seedId}#${occurrenceIndex}`;
```

这样交换顺序后可以说：

```text
霜环从 slot II 移到 slot III
主前向来源由火变为雷
冻结 0.43 -> 0.51
破裂 0.08 -> 0.22
动画主 Cue 由蒸汽变为冰裂
```

若存在重复 seed，则用其在输入中的第几次出现进行稳定匹配。

### 6.4 A/B 对比

默认案例固定为同四枚技能：

```ts
const DEFAULT_BUILD_A = [
  "fire_flow",
  "frost_zone",
  "lightning_mark",
  "wind_impact",
];

const DEFAULT_BUILD_B = [
  "wind_impact",
  "lightning_mark",
  "frost_zone",
  "fire_flow",
];
```

对比页按 seed 对齐，展示：

- A、B 所处槽位。
- 主前向反应变化。
- 后向来源组合变化。
- 参数差异。
- 机制差异。
- 动画 Cue 差异。

不得只对比两个构筑的总分。

## 7. How 页面

### 7.1 数据来源

How 接收当前 `GeneratedBuild.trace`。禁止：

- 自己重算简化权重。
- 使用固定案例文案代替 Trace。
- 从生成名称猜测反应。

### 7.2 推荐结构

1. 当前顺序与方向说明。
2. 四技能因果图。
3. 按技能展开的三阶段快照。
4. 每项参数的来源贡献条。
5. 被抵消和被拒绝的贡献。
6. 公式检查器。
7. “为什么不是查表”说明。

### 7.3 因果图

连线规范：

- 实线：前向。
- 虚线：后向。
- 线宽：贡献显著度。
- 颜色：来源元素。
- 箭头必须指向被修改技能。

点击一条线时，显示：

```text
火 -> 冰：融解蒸腾
距离：相邻，系数 1.00
关系强度：0.88
结果：控制 -0.11，冻结 -0.17，遮蔽 +0.10
```

这里显示的是该具体技能经过来源表达、形态接受度后的 `acceptedDelta`，不是反应表原始系数。

### 7.4 三阶段快照

每个技能展示：

```text
基础
  -> 前向固化
  -> 后向联合修饰
```

例如：

```text
冻结：0.65 -> 0.47 -> 0.43
来源：I 火 -0.18；IV 风 -0.04
```

如果存在相反贡献：

```text
范围：0.80 -> 0.87 -> 0.91
来源：I 火 +0.08；III 岩 -0.03；IV 风 +0.06
联合后：+0.11
```

这样用户能看到“某个来源削弱了原有效果，但另一个来源又增加了新内容”。

### 7.5 被拒绝贡献

How 的高级展开区必须显示能力边界：

```text
雷未给岩技能增加连锁：
原因：普通岩石不具备导电传播能力。
保留变化：震裂、防护下降和震晕。
```

这比静默无变化更能建立规则可信度。

## 8. Three.js 动画合同

### 8.1 固定形态优先

动画首先根据 `form` 选择模板，不根据最高参数猜形态。

| Form | 基础动画模板 |
|---|---|
| `projectile` | 发射体沿轨迹移动并命中 |
| `cone` | 从施法点持续喷射扇区 |
| `zone` | 地面或空间区域展开并持续 |
| `chain` | 多目标节点间跳跃 |
| `movement` | 施法者代理体位移并留下轨迹 |
| `construct` | 实体从地面或空间生成并保持 |
| `mark` | 目标印记出现、蓄积、触发 |
| `summon` | 中心体出现并周期释放 |
| `line` | 沿直线依次生成冲击节点 |

### 8.2 AnimationSpec

```ts
type AnimationCue = {
  visualCue: VisualCueKey;
  sourceElement: ElementKey;
  pass: "forward" | "backward";
  strength: number;
  sourceSlots: number[];
};

type AnimationSpec = {
  form: SkillForm;
  primaryElement: ElementKey;
  primaryPalette: string[];
  trajectory: "none" | "straight" | "arc" | "drop" | "ground";
  timing: {
    windupSeconds: number;
    travelSeconds: number;
    lingerSeconds: number;
    pulseIntervalSeconds: number;
  };
  geometry: {
    reach: number;
    radius: number;
    width: number;
    count: number;
    impactScale: number;
    displacement: number;
  };
  mechanics: MechanicState;
  forwardCue?: AnimationCue;
  backwardCue?: AnimationCue;
};
```

### 8.3 参数解码

```ts
windupSeconds = lerp(0.90, 0.15, speed)
travelSeconds = lerp(1.20, 0.25, speed)
lingerSeconds = lerp(0.20, 3.00, duration)
pulseIntervalSeconds = lerp(0.90, 0.22, speed)

geometry.reach = lerp(2.0, 8.0, reach)
geometry.radius = lerp(0.6, 3.0, area)
geometry.width = lerp(0.15, 1.2, area)
geometry.count = round(lerp(1, 6, propagation))
geometry.impactScale = lerp(0.5, 2.0, power)
geometry.displacement = lerp(0.15, 1.0, force)
```

`lerp(a, b, t) = a + (b - a) * t`。

形态模板可以对这些值再做局部限制，但必须记录在单独的纯函数 `decodeAnimationSpec()` 中，不能散落在 Three.js 组件。

### 8.4 Cue 选择

- `forwardCue` 取前向 accent 或贡献显著度最高的一项。
- `backwardCue` 取后向显著度最高的一项。
- 计算层保留所有 Cue，动画只选择两个，避免视觉堆叠。
- 选中的 Cue 只改变材质、粒子、命中反馈或局部附加层，不改变基础形态。
- Cue 强度映射到粒子数量、透明度和局部比例。

所有非零候选都参与排序，不设置计算门槛。为了保证选中的弱 Cue 仍可见：

```ts
renderedCueIntensity = 0.15 + 0.85 * cue.strength;
```

### 8.5 动画语义示例

`霜环` 永远是 zone：

- 基础：蓝白低温圆环扩张。
- 火前向：边缘出现橙色裂纹和蒸汽，冰晶数量减少。
- 雷前向：出现短促白紫裂闪和碎冰冲击。
- 风后向：雾带旋转更快，半径略增。

它不会因为雷或风变成闪电箭、气旋或投射物。

### 8.6 动画图例

动画旁必须显示：

```text
主体：冰 / 领域
前向 Cue：火 -> 冰「融解蒸腾」
后向 Cue：风 -> 冰「卷雪」
```

这样两个视觉相近的动画也不会语义不明。

## 9. 工程目录建议

保留旧实现直至 V6 通过测试，新增平行模块：

```text
src/
  types/
    v6.ts
  data/
    v6/
      baseSkills.ts
      reactionRules.ts
      capabilityRules.ts
      namingLexicon.ts
  engine/
    v6/
      math.ts
      validation.ts
      sourceProjection.ts
      computeForwardPass.ts
      computeBackwardPass.ts
      finalizeGeneratedSkill.ts
      decodeAnimationSpec.ts
      diffBuilds.ts
      generateBuildV6.ts
      index.ts
```

测试与验证：

```text
src/engine/v6/*.test.ts
scripts/verify-engine-v6.ts
```

不要把 V6 核心逻辑写入：

- `PlayPage.tsx`
- `HowPage.tsx`
- `SkillScene.tsx`
- Zustand store
- CSS

## 10. 迁移阶段

### V6-0：类型与静态数据

交付：

- V6 类型。
- 24 个基础技能。
- 36 个反应规则。
- 数据校验。

验收：

- 24 个唯一 seed ID。
- 36 个唯一方向。
- 所有数值合法。
- 岩雷能力边界测试通过。

### V6-1：纯规则引擎

交付：

- 前向计算。
- 出站投影。
- 后向联合计算。
- 有符号饱和。
- 完整 Trace。

验收：

- 无 React、DOM、Three.js 依赖。
- 确定性、边界、无递归测试通过。
- 1..4 个技能都能计算。

### V6-2：结果解码

交付：

- 生成名称。
- 描述。
- 变化摘要。
- `AnimationSpec`。
- `diffBuilds()`。

验收：

- 所有文案都能追溯到 Trace。
- 固定形态不变。
- A/B 差异达到本文件第 12 节标准。

### V6-3：Play 接入

交付：

- 新结果卡。
- 基础值与当前值。
- 实时变化账本。
- A/B 对比。

验收：

- 交换任意两个槽位后立即刷新。
- 用户无需打开 How 即可指出至少 3 个变化。

### V6-4：How 接入

交付：

- 因果图。
- 三阶段快照。
- 来源贡献条。
- 抵消和拒绝项。

验收：

- How 不包含第二套规则。
- 每条显示都存在 Trace ID。

### V6-5：Three.js 接入与旧代码退场

交付：

- 9 个固定形态模板。
- 元素材质层。
- 前向、后向 Cue 层。
- 删除不再使用的候选能力生成路径。

验收：

- 同 seed 在不同构筑中主形态一致。
- A/B 中至少 3 个对应技能的动画规格有肉眼可见差异。
- 删除旧代码前通过全部测试和人工回归。

## 11. 不应继续沿用的旧行为

以下内容在 V6 接入后应逐步退休：

- 根据最高行为维度临时决定技能主形态。
- 多个候选能力竞争后组成技能主体。
- UI 固定展示一组几乎不变的维度。
- How 使用与真实引擎不同的解释公式。
- 只比较 slot，而不追踪同一 seed 在顺序变化后的结果。
- 将任意元素组合泛化为正向加成。
- 将岩雷关系写成默认导电。

删除旧代码必须在 V6 路径完成并验证后进行，不能先删再补。

## 12. 测试矩阵

### 12.1 数据测试

1. 24 个技能定义完整。
2. 10 个基础参数全部存在且在 `0..1`。
3. 36 个反应方向唯一且完整。
4. 所有反应 delta 在合同范围。
5. 关键能力禁止项通过。

### 12.2 公式单元测试

1. 相邻前向距离为 `1`。
2. 最远前向距离约为 `0.3364`。
3. slot 4 对 slot 1 的后向权重高于 slot 2 和 slot 3。
4. 正负贡献可抵消。
5. 多个同向贡献被饱和。
6. 最终值始终在 `0..1`。
7. accent 不作为来源元素传播。
8. 后向结果不产生第二轮贡献。

### 12.3 关系测试

为 36 个方向各写至少一个断言，检查最重要的语义：

```text
火 -> 冰：freeze 下降，obscure 上升
雷 -> 岩：fracture 上升，shock 不上升
岩 -> 雷：propagation 下降，chain 不上升
风 -> 火：area 和 propagation 上升
冰 -> 火：power 或 speed 下降，chill 上升
```

### 12.4 排列测试

对默认四枚技能运行全部 `4! = 24` 种排列：

- 每个结果确定。
- 无 NaN、Infinity、越界。
- 同一 seed 的 form 和 primaryElement 始终不变。
- 至少 20 个排列拥有唯一的构筑 fingerprint。
- 不允许 24 个排列只产生少数几种近似结果。

构筑 fingerprint 只用于测试，可由以下内容组成：

```ts
skills.map(skill => ({
  seedId: skill.seedId,
  roundedStats: roundTo(skill.finalStats, 2),
  mechanics: roundTo(skill.finalMechanics, 2),
  forwardCue: skill.animation.forwardCue?.visualCue,
  backwardCue: skill.animation.backwardCue?.visualCue,
}))
```

它不是运行时查表 key。

### 12.5 默认 A/B 验收

A 与 B 按 seed 对齐后，必须满足：

1. 至少 3/4 个技能生成名称不同。
2. 至少 3/4 个技能达到“有意义差异”。
3. 至少 2/4 个技能的显著机制标签不同。
4. 至少 3/4 个技能的主动画 Cue 或几何参数明显不同。
5. `frost_zone` 在两种顺序中拥有不同的主前向反应。
6. `fire_flow` 在 A 中以后向修饰为主，在 B 中以前向冷焰压制为主。

按本文档默认数据和公式进行的设计干跑，四个 seed 的 A/B 参数绝对差之和应大致落在：

```text
fire_flow       约 0.20
frost_zone      约 0.24
lightning_mark  约 0.38
wind_impact     约 0.29
```

这些不是需要硬编码的结果，只是公式实现校准点。若编码结果相差很大，应优先检查前向全局系数、方向 key、距离、来源投影和饱和顺序。

单技能的“有意义差异”满足任一：

```text
任一参数差 >= 0.08
全部参数绝对差之和 >= 0.16
任一机制差 >= 0.12
主前向 Cue 不同
主后向 Cue 不同且强度差 >= 0.08
```

### 12.6 人工验收

让未读设计文档的人体验默认 A/B，询问：

1. 能否看出同一枚技能在两种顺序中发生了什么变化？
2. 能否说出变化来自前面还是后面的技能？
3. 岩雷关系是否被理解为震裂或阻断，而非普通岩石导电？
4. 动画是否仍能认出同一基础技能？
5. How 是否解释了结果，而不是只展示更多数字？

至少前四问应获得明确答案。

## 13. 编码 AI 的交付要求

每个迁移阶段结束时必须报告：

```text
1. changed files
2. implemented contracts
3. tests and verification output
4. default A/B result summary
5. known deviations from docs
6. next migration stage
```

如果实现与设计冲突：

- 不得静默自行改规则。
- 先在交付说明中指出冲突。
- 若属于工程细节，可选择等价实现并提供测试证明。
- 若会改变元素语义、双向职责、固定形态或 Trace 真实性，必须回到设计确认。

## 14. 开发提示词

可将以下内容与仓库一起交给编码 AI：

```text
请实现技能符文构筑实验室 V6。

先完整阅读：
1. AGENTS.md
2. docs/CONSTITUTION.md
3. docs/v6/README.md
4. docs/v6/base-skills.md
5. docs/v6/element-reactions.md
6. docs/v6/engine-spec.md
7. docs/v6/presentation-and-migration.md

按 V6-0 到 V6-5 分阶段实现，每阶段先测试再接下一层。
不得接入后端或外部 AI API，不得使用完整排列查表。
核心规则必须是 src/engine 下的纯函数，每次生成必须输出真实 Trace。
保留 24 个现有 seed ID，技能主形态、主元素和主效果不可被互馈改写。
混合元素不传播，后向结果不递归。
默认 A/B 必须达到文档第 12.5 节的差异标准。

每阶段完成后运行引擎验证、反作弊自查，并报告 changed files、测试结果、
A/B 摘要和任何偏离文档的内容。不要在未完成 V6 新路径前删除旧实现。
```
