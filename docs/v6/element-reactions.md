---
description: V6 的 6×6 定向元素关系、能力边界、前向包与后向包数据规范。
---

# V6 定向元素反应

## 1. 为什么必须是有方向的 6×6

V6 不使用对称的“元素相性分数”替代设计语义。

```text
火 -> 冰：热量侵入低温结构，产生融化、蒸汽和控制衰减
冰 -> 火：低温压制燃烧，降低火势但增加滞留和冷焰感
```

两者不是同一关系的正负号翻转。因此必须为全部 36 个方向提供基线规则：

- 30 个跨元素方向。
- 6 个同元素共鸣。

规则不是完整技能结果查表。它只描述一个来源元素对一个目标元素可以贡献哪些参数和机制，最终结果仍由技能基础值、形态、距离、多来源聚合和能力边界共同计算。

## 2. 数据结构

```ts
type ReactionPackage = {
  affinity: number;
  statDeltas: Partial<Record<StatKey, number>>;
  mechanicDeltas: Partial<Record<MechanicKey, number>>;
  accentStrength: number;
  visualCue: VisualCueKey;
};

type DirectedReactionRule = {
  source: ElementKey;
  target: ElementKey;
  name: string;
  rationale: string;
  forward: ReactionPackage;
  backward: ReactionPackage;
};
```

含义：

- `source` 是施加影响的技能主元素。
- `target` 是被修改技能的主元素。
- `affinity` 是关系可表达程度，范围 `0..1`，不是正负评价。
- `statDeltas` 和 `mechanicDeltas` 才带正负号。
- `forward` 用于前位技能影响后位技能。
- `backward` 用于后位技能修饰前位技能，系数整体更小。
- `accentStrength` 只允许改变当前目标技能的混合表现，不改变其主元素。
- `visualCue` 是可视化素材键，不参与数值计算。

## 3. 表格记号

### 3.1 参数缩写

| 缩写 | 参数 |
|---|---|
| `POW` | `power` |
| `RCH` | `reach` |
| `AREA` | `area` |
| `DUR` | `duration` |
| `SPD` | `speed` |
| `CTL` | `control` |
| `FRC` | `force` |
| `PROP` | `propagation` |
| `PEN` | `penetration` |
| `PROT` | `protection` |

### 3.2 机制缩写

| 缩写 | 机制 |
|---|---|
| `BURN` | 燃烧 |
| `CHILL` | 寒意 |
| `FREEZE` | 冻结 |
| `SHOCK` | 感电 |
| `STUN` | 震晕 |
| `KB` | 击退 |
| `PULL` | 拉拽 |
| `PIERCE` | 穿透 |
| `GUARD` | 防护 |
| `MARK` | 标记 |
| `DELAY` | 延迟爆发 |
| `CHAIN` | 连锁 |
| `FRACTURE` | 破裂 |
| `BIND` | 束缚 |
| `OBSCURE` | 遮蔽 |
| `ECHO` | 回响 |
| `HASTE` | 加速 |

表中 `F:` 是前向包，`B:` 是后向包。数值是规则系数，不是直接加到最终结果的数值；完整公式见 `engine-spec.md`。

## 4. 火作为来源

| 方向 | 反应 | 设计依据 | F: affinity / 参数 / 机制 / 混合 | B: affinity / 参数 / 机制 / 混合 |
|---|---|---|---|---|
| 火→火 | 烈焰共鸣 | 同源热量让火势更旺并延长燃烧 | 0.82 / POW +.12, AREA +.06, DUR +.08 / BURN +.18 / 0 | 0.76 / POW +.06, DUR +.04 / BURN +.10 / 0 |
| 火→冰 | 融解蒸腾 | 火融化冰，削弱冻结，同时制造蒸汽和短促爆发 | 0.88 / POW +.08, AREA +.10, CTL -.18, DUR -.12 / CHILL -.18, FREEZE -.28, OBSCURE +.18 / 火 0.30 | 0.84 / POW +.04, AREA +.05, CTL -.09, DUR -.06 / FREEZE -.14, OBSCURE +.10 / 火 0.14 |
| 火→雷 | 热电过载 | 高温让放电更猛烈但更难维持稳定路径 | 0.58 / POW +.12, AREA +.05, PROP -.06, DUR -.08 / SHOCK +.08, DELAY +.08 / 火 0.16 | 0.52 / POW +.06, SPD +.03, DUR -.04 / SHOCK +.04 / 火 0.08 |
| 火→岩 | 熔裂 | 热胀冷缩和熔蚀削弱岩体稳定性，而非赋予导电 | 0.78 / POW +.08, AREA +.05, PROT -.18 / FRACTURE +.24, BURN +.08 / 火 0.24 | 0.72 / POW +.04, PROT -.09 / FRACTURE +.12, BURN +.05 / 火 0.12 |
| 火→影 | 余烬潜伏 | 暗影包裹火种，使爆发更晚、更隐蔽 | 0.66 / DUR +.10, PEN +.04, SPD -.05 / BURN +.12, DELAY +.18, OBSCURE +.08 / 火 0.18 | 0.60 / DUR +.05, SPD -.03 / BURN +.07, DELAY +.10 / 火 0.09 |
| 火→风 | 助燃扩散 | 流动空气扩大火势、加快展开，但可能缩短局部停留 | 0.90 / AREA +.16, SPD +.10, PROP +.14, DUR -.05 / BURN +.12 / 火 0.28 | 0.86 / AREA +.08, SPD +.05, FRC +.04, DUR -.03 / BURN +.07 / 火 0.14 |

## 5. 冰作为来源

| 方向 | 反应 | 设计依据 | F: affinity / 参数 / 机制 / 混合 | B: affinity / 参数 / 机制 / 混合 |
|---|---|---|---|---|
| 冰→火 | 冷焰压制 | 低温压低火势，使火焰迟缓并带寒意，不把火直接变成冰 | 0.88 / POW -.10, SPD -.12, AREA -.06, DUR +.08, CTL +.10 / BURN -.14, CHILL +.20 / 冰 0.30 | 0.84 / POW -.05, SPD -.06, DUR +.04, CTL +.05 / BURN -.07, CHILL +.11 / 冰 0.15 |
| 冰→冰 | 深寒共鸣 | 同源寒意积累，提高冻结稳定性 | 0.82 / DUR +.10, CTL +.12, PROT +.05 / CHILL +.16, FREEZE +.14 / 0 | 0.76 / DUR +.05, CTL +.06 / CHILL +.09, FREEZE +.07 / 0 |
| 冰→雷 | 低温迟滞 | 冰层和低温使放电路径更迟缓、更集中；不宣称冰天然导电 | 0.56 / SPD -.10, PROP -.10, CTL +.12, POW +.04 / CHILL +.12, SHOCK -.05 / 冰 0.16 | 0.50 / SPD -.05, PROP -.05, CTL +.06 / CHILL +.07 / 冰 0.08 |
| 冰→岩 | 冻结加固 | 冰填补缝隙可暂时稳定岩体，同时累积脆性 | 0.72 / DUR +.08, CTL +.08, PROT +.12, SPD -.05 / CHILL +.10, FRACTURE +.08 / 冰 0.20 | 0.66 / PROT +.06, CTL +.04, SPD -.03 / CHILL +.06, FRACTURE +.04 / 冰 0.10 |
| 冰→影 | 寒蚀凝滞 | 寒意让暗影流动变慢但更容易束缚目标 | 0.64 / SPD -.10, DUR +.08, CTL +.12 / CHILL +.14, BIND +.10 / 冰 0.18 | 0.58 / SPD -.05, DUR +.04, CTL +.06 / CHILL +.08, BIND +.05 / 冰 0.09 |
| 冰→风 | 冰雾 | 风携带冰晶扩大寒意覆盖，但流动速度受到拖累 | 0.84 / AREA +.12, PROP +.10, SPD -.08, CTL +.10 / CHILL +.18, OBSCURE +.12 / 冰 0.26 | 0.78 / AREA +.06, PROP +.05, SPD -.04, CTL +.05 / CHILL +.10 / 冰 0.13 |

## 6. 雷作为来源

| 方向 | 反应 | 设计依据 | F: affinity / 参数 / 机制 / 混合 | B: affinity / 参数 / 机制 / 混合 |
|---|---|---|---|---|
| 雷→火 | 点燃过载 | 放电触发火焰快速爆发，提高瞬时威力但缩短持续 | 0.70 / POW +.14, SPD +.12, DUR -.10 / SHOCK +.12, DELAY -.08 / 雷 0.20 | 0.64 / POW +.07, SPD +.06, DUR -.05 / SHOCK +.07 / 雷 0.10 |
| 雷→冰 | 电热脆裂 | 瞬时热冲击使冰体破裂，提高爆发和碎片穿透，削弱稳定冻结 | 0.74 / POW +.12, PEN +.10, CTL -.12, PROT -.08 / FRACTURE +.20, FREEZE -.12 / 雷 0.22 | 0.68 / POW +.06, PEN +.05, CTL -.06 / FRACTURE +.11, FREEZE -.06 / 雷 0.11 |
| 雷→雷 | 电荷共鸣 | 同源电荷提高速度、传播和连锁稳定性 | 0.84 / SPD +.12, PROP +.14, PEN +.06 / SHOCK +.16, CHAIN +.14 / 0 | 0.78 / SPD +.06, PROP +.07 / SHOCK +.09, CHAIN +.07 / 0 |
| 雷→岩 | 雷震裂岩 | 雷击的瞬时热压和冲击震裂岩体；不是让普通岩石导电 | 0.76 / POW +.10, FRC +.14, PROT -.16 / FRACTURE +.24, STUN +.12 / 雷 0.22 | 0.70 / POW +.05, FRC +.07, PROT -.08 / FRACTURE +.13, STUN +.06 / 雷 0.11 |
| 雷→影 | 雷影显形 | 高频闪击让暗影更快、更难隐藏，但持续时间缩短 | 0.62 / SPD +.14, PEN +.06, DUR -.08, CTL -.04 / SHOCK +.10, OBSCURE -.10, ECHO +.08 / 雷 0.18 | 0.56 / SPD +.07, DUR -.04 / SHOCK +.06, OBSCURE -.05 / 雷 0.09 |
| 雷→风 | 雷暴激荡 | 放电扰动空气，增强瞬时扩张和冲击，降低稳定持续 | 0.86 / AREA +.10, FRC +.14, SPD +.08, DUR -.10 / SHOCK +.16 / 雷 0.26 | 0.80 / AREA +.05, FRC +.07, DUR -.05 / SHOCK +.09 / 雷 0.13 |

## 7. 岩作为来源

| 方向 | 反应 | 设计依据 | F: affinity / 参数 / 机制 / 混合 | B: affinity / 参数 / 机制 / 混合 |
|---|---|---|---|---|
| 岩→火 | 炉膛约束 | 岩体约束火焰扩散，使其更集中、更持久但展开变慢 | 0.72 / POW +.08, DUR +.12, AREA -.08, SPD -.10, PROT +.06 / GUARD +.10 / 岩 0.20 | 0.66 / POW +.04, DUR +.06, AREA -.04, SPD -.05 / GUARD +.06 / 岩 0.10 |
| 岩→冰 | 冰岩复合 | 岩体支撑冰结构，提高防护和稳定控制但降低速度 | 0.74 / PROT +.16, DUR +.10, CTL +.08, SPD -.10 / GUARD +.14, FRACTURE +.06 / 岩 0.20 | 0.68 / PROT +.08, DUR +.05, SPD -.05 / GUARD +.08 / 岩 0.10 |
| 岩→雷 | 地脉阻断 | 厚重岩体截断放电路径，使能量集中在落点；不使用导电解释 | 0.68 / POW +.10, FRC +.08, PROP -.18, SPD -.08 / STUN +.10, CHAIN -.14 / 岩 0.18 | 0.62 / POW +.05, PROP -.09, SPD -.04 / STUN +.06, CHAIN -.07 / 岩 0.09 |
| 岩→岩 | 山岳共鸣 | 同源结构提高冲击、防护和稳定性 | 0.84 / FRC +.12, PROT +.14, CTL +.08, SPD -.04 / GUARD +.14, STUN +.08 / 0 | 0.78 / FRC +.06, PROT +.07, CTL +.04 / GUARD +.08 / 0 |
| 岩→影 | 封影 | 岩体限制暗影移动空间，提高束缚但降低速度和穿透 | 0.58 / CTL +.12, PROT +.06, SPD -.10, PEN -.08 / BIND +.12, GUARD +.06 / 岩 0.16 | 0.52 / CTL +.06, SPD -.05, PEN -.04 / BIND +.07 / 岩 0.08 |
| 岩→风 | 镇风 | 岩体阻挡和分割气流，降低范围与速度，增加局部冲击 | 0.70 / AREA -.10, SPD -.12, PROP -.08, FRC +.10, PROT +.08 / PULL -.10, GUARD +.10 / 岩 0.18 | 0.64 / AREA -.05, SPD -.06, FRC +.05 / PULL -.05, GUARD +.06 / 岩 0.09 |

## 8. 影作为来源

| 方向 | 反应 | 设计依据 | F: affinity / 参数 / 机制 / 混合 | B: affinity / 参数 / 机制 / 混合 |
|---|---|---|---|---|
| 影→火 | 暗火潜燃 | 暗影隐藏火势，使其延迟爆发并持续灼烧 | 0.66 / DUR +.12, PEN +.06, SPD -.06 / DELAY +.18, BURN +.10, OBSCURE +.12 / 影 0.20 | 0.60 / DUR +.06, PEN +.03, SPD -.03 / DELAY +.10, OBSCURE +.07 / 影 0.10 |
| 影→冰 | 黑冰侵蚀 | 暗影填入冰体裂隙，提高束缚和穿透但削弱防护 | 0.62 / CTL +.12, PEN +.10, PROT -.08, DUR +.05 / BIND +.14, FRACTURE +.08 / 影 0.18 | 0.56 / CTL +.06, PEN +.05, PROT -.04 / BIND +.08 / 影 0.09 |
| 影→雷 | 潜雷 | 暗影延后放电时机并制造回响，牺牲即时速度 | 0.72 / DUR +.10, SPD -.08, PEN +.05 / DELAY +.18, ECHO +.16, SHOCK +.06 / 影 0.22 | 0.66 / DUR +.05, SPD -.04 / DELAY +.10, ECHO +.09 / 影 0.11 |
| 影→岩 | 蚀隙 | 暗影从缝隙侵蚀岩体，提高穿透并削弱结构防护 | 0.64 / PEN +.14, PROT -.14, DUR +.04 / FRACTURE +.14, MARK +.08 / 影 0.18 | 0.58 / PEN +.07, PROT -.07 / FRACTURE +.08, MARK +.05 / 影 0.09 |
| 影→影 | 深影共鸣 | 同源暗影加强延迟、回响和隐蔽性 | 0.82 / DUR +.10, PEN +.06, CTL +.06 / DELAY +.14, ECHO +.16, OBSCURE +.12 / 0 | 0.76 / DUR +.05, CTL +.03 / ECHO +.09, OBSCURE +.07 / 0 |
| 影→风 | 无形乱流 | 暗影隐藏风路并制造难以判断的偏移，不直接增强推拉 | 0.60 / SPD +.08, AREA +.05, CTL +.05 / OBSCURE +.16, ECHO +.08 / 影 0.16 | 0.54 / SPD +.04, AREA +.03 / OBSCURE +.09 / 影 0.08 |

## 9. 风作为来源

| 方向 | 反应 | 设计依据 | F: affinity / 参数 / 机制 / 混合 | B: affinity / 参数 / 机制 / 混合 |
|---|---|---|---|---|
| 风→火 | 风助火势 | 风为火提供氧和传播路径，使其更快、更广 | 0.90 / AREA +.16, SPD +.12, PROP +.16, DUR +.04 / BURN +.14 / 风 0.28 | 0.86 / AREA +.08, SPD +.06, PROP +.08 / BURN +.08 / 风 0.14 |
| 风→冰 | 卷雪 | 风携带冰晶扩大寒意覆盖和传播，但降低局部冻结稳定性 | 0.84 / AREA +.14, PROP +.14, SPD +.08, CTL -.06 / CHILL +.12, FREEZE -.08, OBSCURE +.10 / 风 0.26 | 0.78 / AREA +.07, PROP +.07, SPD +.04, CTL -.03 / CHILL +.07 / 风 0.13 |
| 风→雷 | 风暴导流 | 流动空气拓展雷击路径，提高传播和速度，但分散单点威力 | 0.88 / PROP +.18, SPD +.12, AREA +.08, POW -.08 / CHAIN +.16, SHOCK +.08 / 风 0.28 | 0.82 / PROP +.09, SPD +.06, POW -.04 / CHAIN +.09 / 风 0.14 |
| 风→岩 | 风蚀扬尘 | 持续风蚀扩大裂隙并扬起碎屑，削弱防护而非推动整座岩体 | 0.62 / PEN +.10, PROT -.10, AREA +.05 / FRACTURE +.12, OBSCURE +.12 / 风 0.16 | 0.56 / PEN +.05, PROT -.05 / FRACTURE +.07, OBSCURE +.07 / 风 0.08 |
| 风→影 | 影随风行 | 风提高暗影移动和扩散速度，同时稍微削弱稳定束缚 | 0.68 / SPD +.14, AREA +.08, PROP +.08, CTL -.05 / OBSCURE +.10, BIND -.06 / 风 0.20 | 0.62 / SPD +.07, AREA +.04, CTL -.03 / OBSCURE +.06 / 风 0.10 |
| 风→风 | 气流共鸣 | 同源气流提高速度、覆盖和推拉稳定性 | 0.84 / SPD +.12, AREA +.10, PROP +.10, FRC +.08 / KB +.10, PULL +.10, HASTE +.08 / 0 | 0.78 / SPD +.06, AREA +.05, FRC +.04 / KB +.06, PULL +.06 / 0 |

## 10. 关键关系澄清

### 10.1 岩与雷

允许：

- `雷 -> 岩`：雷击造成瞬时热压、震裂、震晕和防护下降。
- `岩 -> 雷`：岩体阻断放电路径，使雷更集中但传播更差。

不允许：

- 默认生成“导电岩石”。
- 因为岩存在就提高雷的连锁。
- 因为雷存在就让岩技能获得持续感电场。

未来如果增加“金属”“水”“磁”等更合适的元素或材质，再单独设计导电关系。

### 10.2 推拉归属

- 风可以原生增加 `knockback` 和 `pull`。
- 岩可以依靠冲击增加 `knockback`，但不应产生 `pull`。
- 雷可以提高 `force` 或瞬时打断，但不应直接解码为稳定推拉。
- 其他元素只有在反应表明确提供推拉机制时才允许出现。

### 10.3 混合元素不传播

如果 `火 -> 冰` 让冰技能出现火焰裂纹和蒸汽：

```text
当前冰技能：
primaryElement = frost
accentElement = fire

它影响后续技能时：
sourceElement = frost
```

后续规则不得继续读取 `fire` 作为来源，也不得把蒸汽再当成第七元素。

## 11. 视觉 Cue 固定键

数值实现不依赖这些名字，但编码时必须固定为枚举：

```ts
type VisualCueKey =
  | "same_element_resonance"
  | "steam_melt"
  | "thermal_overload"
  | "molten_fracture"
  | "hidden_ember"
  | "fire_spread"
  | "cold_suppression"
  | "cold_drag"
  | "frozen_reinforcement"
  | "frost_bind"
  | "ice_mist"
  | "ignition_surge"
  | "thermal_shatter"
  | "stone_shock_fracture"
  | "shadow_reveal"
  | "storm_agitation"
  | "kiln_focus"
  | "ice_stone_composite"
  | "grounding_block"
  | "shadow_seal"
  | "wind_break"
  | "hidden_flame"
  | "black_ice"
  | "latent_lightning"
  | "shadow_erosion"
  | "hidden_turbulence"
  | "wind_fan_flame"
  | "snow_carry"
  | "storm_channel"
  | "dust_erosion"
  | "shadow_drift";
```

### 11.1 方向到 Cue 的完整映射

`forward.visualCue` 与 `backward.visualCue` 使用同一个方向语义，强度分别读取各自 package。

| 来源＼目标 | 火 | 冰 | 雷 | 岩 | 影 | 风 |
|---|---|---|---|---|---|---|
| 火 | `same_element_resonance` | `steam_melt` | `thermal_overload` | `molten_fracture` | `hidden_ember` | `fire_spread` |
| 冰 | `cold_suppression` | `same_element_resonance` | `cold_drag` | `frozen_reinforcement` | `frost_bind` | `ice_mist` |
| 雷 | `ignition_surge` | `thermal_shatter` | `same_element_resonance` | `stone_shock_fracture` | `shadow_reveal` | `storm_agitation` |
| 岩 | `kiln_focus` | `ice_stone_composite` | `grounding_block` | `same_element_resonance` | `shadow_seal` | `wind_break` |
| 影 | `hidden_flame` | `black_ice` | `latent_lightning` | `shadow_erosion` | `same_element_resonance` | `hidden_turbulence` |
| 风 | `wind_fan_flame` | `snow_carry` | `storm_channel` | `dust_erosion` | `shadow_drift` | `same_element_resonance` |

同一视觉 Cue 可以复用材质和粒子模块，但实际颜色、强度、数量和时序必须来自目标技能的 `AnimationSpec`。

## 12. 调整规则时的约束

允许调整系数，但必须同时满足：

1. 关系名称、依据和数值方向一致。
2. 正负贡献并存时不能先取绝对值。
3. 前向包的整体变化必须显著强于后向包。
4. 任何机制都必须通过目标形态和元素能力检查。
5. 不得为了默认 A/B 案例新增专用分支。
6. 调整后必须运行 36 方向单元测试和排列性质测试。
