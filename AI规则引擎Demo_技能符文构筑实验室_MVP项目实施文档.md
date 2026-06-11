# AI 规则引擎 Demo：技能符文构筑实验室  
## MVP 项目实施文档 / Vibe Coding Contract

> 目标：用一个纯前端可交互 Demo，验证「同样 4 枚技能符文，不同排列顺序，会经由规则引擎生成体感明显不同的技能结果」。  
> 该文档面向 vibe coding / Claude Code / Codex / Cursor 等 coding agent 使用，应作为开发时的最高优先级项目合同。

---

## 0. 一句话北极星

**这不是预设技能树，也不是随机生成器，而是玩家的排列行为在规则引擎中留下了可计算的构筑指纹。**

MVP 不追求内容量，优先保证一个闭环：

```text
选择符文 → 排列顺序 → 铭刻生成 → 观看技能动画 → 对比同符文不同顺序 → 理解规则引擎
```

---

## 1. Demo 定位

### 1.1 面向谁

该 Demo 面向作品集展示、游戏策划面试、技术策划/系统策划沟通场景。

访问者应能在 1–2 分钟内理解：

1. 玩家不是在点固定技能树节点。
2. 系统不是简单 if/else 查表。
3. 每枚符文都有语义向量。
4. 槽位顺序会改变符文的权重和交互。
5. 最终技能名称、标签、参数和动画都来自同一份计算结果。

### 1.2 对外包装语言

MVP 对外使用 MMO 玩家熟悉的表达：

- 符文
- 铭刻
- 技能槽
- Build
- 技能构筑
- 构筑对比

不要在第一屏直接抛出《漂流诸天》的大量世界观。  
《漂流诸天》的「道痕构筑 / 固化」只放在 Why 页作为理念映射。

---

## 2. 技术选型

### 2.1 推荐栈

- React
- Vite
- TypeScript
- Three.js
- CSS Modules / 普通 CSS / Tailwind 均可，优先选择实现最快的方式
- 状态管理优先 React state；如状态复杂可用 Zustand

### 2.2 明确不做

MVP 阶段禁止引入以下内容：

- 后端服务
- 数据库
- 外部 AI API
- 登录系统
- 复杂战斗系统
- 复杂角色养成
- 多人同步
- 大量技能内容制作
- 真实机器学习模型

规则引擎必须在前端本地运行。

---

## 3. 推荐目录结构

```text
src/
  data/
    vectorDims.ts
    runes.ts
    nameWords.ts
  engine/
    vectorMath.ts
    positionEncoding.ts
    attentionEngine.ts
    skillDecoder.ts
    skillNameGenerator.ts
    specialResonance.ts
    skillGenerator.ts
  components/
    RuneCard.tsx
    RunePool.tsx
    RuneSlotBar.tsx
    SkillResultPanel.tsx
    SkillScene.tsx
    ComparePanel.tsx
    VectorBar.tsx
    TechExplainer.tsx
    TabNav.tsx
  pages/
    PlayPage.tsx
    HowPage.tsx
    WhyPage.tsx
  types/
    rune.ts
    skill.ts
  App.tsx
  main.tsx
  styles.css
```

### 3.1 架构原则

核心规则必须放在 `engine/`，并尽量写成纯函数。  
UI 只负责调用规则、展示结果、播放动画，不应在组件里硬编码技能结果。

正确：

```ts
const result = generateSkill(selectedRuneIds);
```

错误：

```ts
if (runes.join(',') === 'fire,frost,lightning,wind') {
  return '冰焰雷风爆环';
}
```

---

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

---

## 6. 计算流程

### 6.1 位置编码

4 个槽位对应 4 种角色：

| 槽位 | role | 基础倍率 | 设计含义 |
|---|---|---:|---|
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

---

## 9. 页面设计

## 9.1 Tab 结构

Demo 只有 3 个主 Tab：

1. Play：体验页
2. How：技术页
3. Why：理念页

第一屏必须默认进入 Play。

---

## 10. Play 页合同

### 10.1 必须包含

- 符文池
- 4 个铭刻槽
- 铭刻生成按钮
- 重置按钮
- 随机填充按钮
- 默认对比样例按钮
- 技能结果面板
- Three.js 技能演示区
- 构筑对比区

### 10.2 交互要求

必须支持：

1. 点击符文加入第一个空槽。
2. 点击槽位移除符文。
3. 拖拽调整槽位顺序。
4. 点击重置清空。
5. 点击随机填充，自动填满 4 个槽。
6. 点击默认对比样例，生成 A/B 两个顺序不同但符文相同的结果。
7. 点击铭刻生成，展示结果并刷新动画。
8. 每次生成结果后可以保存到对比栏。

### 10.3 铭刻前反馈

当符文放入槽位但尚未生成时，只展示模糊融合反馈：

- 发光边框
- 粒子/渐变/脉冲
- 简短提示：`能量正在融合，铭刻后将解析为技能。`

禁止提前显示：

- 技能名称
- 具体描述
- 具体数值
- 最终标签

---

## 11. SkillScene / Three.js 动画合同

### 11.1 场景元素

必须包含：

- 简单施法点
- 训练假人
- 地面或空间粒子
- 命中反馈

### 11.2 动画时长

每次播放 3–5 秒。  
允许循环播放，但必须有清晰释放节奏。

### 11.3 动画参数

```ts
type SkillAnimationParams = {
  primaryColor: string;
  secondaryColor: string;
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

### 11.4 参数映射

- AOE 高：范围更大，粒子分布更宽。
- burst 高：末段出现明显爆裂。
- slow / crystallize 高：地面有冰霜扩散或冷色区域。
- chain 高：出现折线跳跃。
- bind / structure 高：出现环形禁锢或岩壁。
- conditional / markAmplify 高：假人身上先出现标记，再触发二段效果。
- displacement / haste 高：粒子速度更快，出现风线或击退轨迹。

### 11.5 最低动画分类

MVP 至少要有 3 类肉眼可辨表现：

1. 爆发型：快速命中 + 末端爆裂。
2. 控制型：地面区域形成 + 禁锢环/冻结感。
3. 连锁型：折线跳跃 + 多节点闪烁。

如果时间不足，可以先用几何体、线段、点云和简单材质完成，不要卡在模型资产上。

---

## 12. ComparePanel 合同

### 12.1 展示内容

对比栏至少展示两个构筑：

- 构筑 A
- 构筑 B

每侧显示：

- 4 个符文顺序
- 技能名称
- 技能描述
- 技能标签
- 关键参数条
- 动画回放按钮

### 12.2 必须高亮

1. 两个构筑使用了哪些相同符文。
2. 哪些槽位顺序发生变化。
3. 哪些技能向量维度发生明显变化。
4. 为什么最终技能不同。

### 12.3 默认对比样例

```text
构筑 A：火焰 → 冰霜 → 雷电 → 疾风
偏向：扩散、减速、连锁、AOE

构筑 B：疾风 → 雷电 → 冰霜 → 火焰
偏向：高速突进、瞬时爆发、延迟爆裂
```

对比解释应自动基于 `trace.finalTopDims` 和参数差异生成，不要纯手写。

---

## 13. How 页合同

How 页目标：让非技术面试官理解「不是查表」。

### 13.1 必须展示的流程

```text
符文向量
   ↓
槽位编码
   ↓
符文间交互分数
   ↓
简化注意力权重
   ↓
最终技能向量
   ↓
技能标签 / 描述 / 动画参数
```

### 13.2 必须展示的具体例子

使用：

```text
火焰 → 冰霜 → 雷电 → 疾风
```

展示：

- 每个符文的主维度
- 每个槽位的影响
- interaction scores 的简化矩阵
- attention weights 的简化矩阵
- 最终向量 Top 5
- 解码出的技能标签
- 换成 `疾风 → 雷电 → 冰霜 → 火焰` 后哪些维度变化

### 13.3 表达原则

How 页不要写成数学论文。  
更适合使用以下解释：

> 每枚符文不是一个固定技能，而是一组倾向。  
> 槽位会改变这组倾向在技能中的职责。  
> 符文之间还会互相放大或抑制。  
> 因此，同样的材料换一个顺序，最终会得到不同的构筑指纹。

---

## 14. Why 页合同

标题建议：

```text
从技能树到语义构筑：让玩家的排列成为规则的一部分
```

必须表达：

1. 传统 Build 往往是预设节点选择。
2. 本 Demo 尝试把技能拆成可计算的语义单元。
3. 玩家不是选择现成技能，而是在排列符文。
4. 结果不是完全随机，也不是人工预设的固定组合。
5. 每次排列都会留下一个构筑指纹。
6. 在《漂流诸天》中，这套符文原型会被替换为「道痕」。
7. MVP 阶段使用符文语言，是为了降低理解门槛。

核心句必须出现：

```text
这不是预设 Build 树，而是玩家排列留下的可计算语义签名。
```

---

## 15. 开发阶段拆分

## A0：项目骨架与静态页面

### 目标

先跑起来，不写复杂规则。

### 任务

- 初始化 Vite + React + TypeScript 项目。
- 创建 3 个 Tab：Play / How / Why。
- 创建基础 CSS 风格。
- 创建空的符文池、槽位、结果面板、动画区占位。

### 验收

- `npm run dev` 可启动。
- 默认进入 Play 页。
- 三个 Tab 可切换。
- 控制台无报错。

---

## A1：规则引擎纯函数

### 目标

先把最重要的「同符文不同顺序结果不同」跑通。

### 任务

实现：

- `vectorDims.ts`
- `runes.ts`
- `vectorMath.ts`
- `positionEncoding.ts`
- `attentionEngine.ts`
- `skillDecoder.ts`
- `skillNameGenerator.ts`
- `specialResonance.ts`
- `skillGenerator.ts`

### 验收

写一个临时测试或控制台输出，验证：

```text
A = fire, frost, lightning, wind
B = wind, lightning, frost, fire
```

二者必须满足：

- 技能名不同
- 标签不同
- Top 5 维度不同
- 参数条明显不同
- trace 可读

---

## A2：Play 页交互

### 目标

玩家可以完成选择、排列、铭刻生成。

### 任务

- RunePool
- RuneSlotBar
- SkillResultPanel
- 基础 ComparePanel
- 点击添加
- 移除槽位
- 重置
- 随机填充
- 默认对比样例
- 拖拽排序

### 验收

- 可以从 6 枚符文中填满 4 个槽。
- 槽位顺序可调整。
- 未满 4 个槽时铭刻按钮禁用或提示。
- 点击铭刻后生成技能结果。
- 点击默认对比样例后展示 A/B 差异。

---

## A3：Three.js 技能演示

### 目标

让技能结果有可见差异。

### 任务

- 创建基础 Three.js 场景。
- 添加施法点、训练假人、地面。
- 根据 `animationParams` 播放粒子/线段/环形效果。
- 支持 replay。

### 验收

至少肉眼可辨：

- 爆发型
- 控制型
- 连锁型

默认 A/B 对比的动画必须不一样。

---

## A4：How 页技术解释

### 目标

证明系统不是查表。

### 任务

- 使用 `generateSkill` 的 trace 渲染解释。
- 展示流程图。
- 展示符文主维度。
- 展示槽位影响。
- 展示交互矩阵。
- 展示最终 Top 5。
- 展示 A/B 顺序交换后的差异解释。

### 验收

非程序用户能看懂：

```text
符文不是固定技能，而是语义向量；顺序改变了槽位职责和交互权重。
```

---

## A5：Why 页、README 与部署

### 目标

让 Demo 可以作为作品集项目交付。

### 任务

- 完成 Why 页文案。
- 写 README。
- 补充公开部署说明。
- 做一次 UI polish。
- 修复控制台报错。

### 验收

交付物包含：

1. Demo URL。
2. 代码仓库。
3. README。
4. 2 分钟录屏脚本或录屏说明。

---

## 16. README 必须包含

README 建议结构：

```text
# Skill Rune Lab

## Demo Goal
## How to Use
## Core Idea
## Why It Is Not a Lookup Table
## Rule Engine Pipeline
## Same Runes, Different Order Example
## Relation to Drifting Realms / 道痕构筑
## Local Development
## Deployment
```

其中 `Why It Is Not a Lookup Table` 必须说明：

- 结果来自符文向量、槽位编码、注意力权重和解码规则。
- 系统没有为每一种排列手写固定技能。
- 特殊共鸣只是可解释的稀有修正，不是主要生成方式。

---

## 17. 录屏脚本

2 分钟演示建议：

### 0:00–0:20

打开 Play 页，说明：

> 这是一个技能符文构筑 Demo，用来验证同样符文不同顺序会生成不同技能。

### 0:20–0:50

选择：

```text
火焰 → 冰霜 → 雷电 → 疾风
```

点击铭刻，展示技能名、标签、参数和动画。

### 0:50–1:20

点击默认对比样例，展示：

```text
疾风 → 雷电 → 冰霜 → 火焰
```

说明两边符文相同但顺序不同，技能表现不同。

### 1:20–1:45

切到 How 页，展示：

```text
符文向量 → 槽位编码 → 交互权重 → 最终技能向量 → 解码
```

### 1:45–2:00

切到 Why 页，总结：

> 这不是预设 Build 树，而是玩家排列留下的可计算语义签名。

---

## 18. Coding Agent 开发提示词

后续可以直接把下面这段作为第一轮 vibe coding prompt：

```text
你是一名前端工程师。请根据《AI 规则引擎 Demo：技能符文构筑实验室 MVP 项目实施文档》开发一个纯前端 React + Vite + TypeScript Demo。

核心目标不是做完整战斗系统，而是验证：同样 4 枚技能符文，不同排列顺序，会通过内置规则引擎生成明显不同的技能名称、描述、标签、参数和 Three.js 动画。

请严格遵守：
1. 不要接入后端、数据库或外部 AI API。
2. 不要用完整排列查表生成技能。
3. 核心规则必须放在 src/engine 下，写成可测试的纯函数。
4. UI 只能调用 generateSkill，不要在组件中硬编码技能结果。
5. 每次生成必须输出 trace，用于 How 页解释计算过程。
6. 默认对比案例必须是：
   A: fire → frost → lightning → wind
   B: wind → lightning → frost → fire
   二者必须产生明显不同的技能名、标签、参数和动画。
7. Three.js 动画不需要复杂模型，但至少要有爆发型、控制型、连锁型三类肉眼可辨表现。
8. Play 页第一屏必须可直接操作，不要先展示长篇设定。
9. How 页必须说明为什么这不是查表。
10. Why 页必须说明它与《漂流诸天》道痕构筑系统的关系。

请先实现 A0+A1+A2：项目骨架、规则引擎、Play 页基础交互。完成后输出：
- changed files
- 如何运行
- A/B 默认案例的生成结果摘要
- 是否满足验收标准
- 尚未完成的内容
```

---

## 19. 反作弊 / 反跑偏检查清单

开发过程中每轮都检查：

- [ ] 是否还围绕「排列顺序产生构筑指纹」？
- [ ] 是否出现了完整排列查表？如果出现，必须移除。
- [ ] 是否把大量时间花在美术资产上？MVP 阶段应避免。
- [ ] 是否把 How 页写成无法理解的数学说明？需要改成游戏策划能理解的表达。
- [ ] 是否 Play 页一打开就能操作？
- [ ] 是否默认 A/B 对比足够明显？
- [ ] 是否技能结果和动画来自同一个 finalVector？
- [ ] 是否 trace 可以解释结果？
- [ ] 是否控制台无明显报错？

---

## 20. 最终验收标准

项目完成时必须满足：

1. 可以选择 6 枚符文中的任意 4 枚并排列。
2. 可以拖拽或点击调整顺序。
3. 点击「铭刻生成」后生成技能名称、描述、标签和参数。
4. 同一组符文的不同顺序，产出的技能名称、描述、参数和动画有明显差异。
5. 至少有 3 类肉眼可辨动画表现：爆发型、控制型、连锁型。
6. 对比模式可以并排展示两次构筑结果。
7. 技术页能解释符文向量、槽位编码、交互权重和技能解码流程。
8. 理念页能说明该 Demo 与《漂流诸天》道痕系统的关系，但不强迫访问者先理解世界观。
9. 部署后可以通过公开 URL 访问。
10. 控制台无明显报错。

---

## 21. 最小可接受版本

如果时间不足，最小可接受版本可以砍掉：

- 复杂拖拽库，改为上移/下移按钮。
- 复杂粒子系统，改为简单几何体 + 线段 + 环形扩散。
- 多个特殊共鸣，只保留 1 个或不做。
- 复杂 UI 动效，只保留颜色、发光、参数条。

但不能砍掉：

- 4 槽顺序影响结果。
- generateSkill 规则引擎。
- A/B 默认对比。
- How 页 trace 解释。
- 至少 3 类动画差异。

---

## 22. 作品集展示时的解释口径

可以这样介绍：

> 这个 Demo 是我对 AI 规则引擎游戏范式的一次小规模验证。  
> 我没有直接做一个完整 MMO，而是先抽出最关键的系统命题：玩家是否能通过排列语义单元，得到可解释但不可简单枚举的技能结果。  
> 在这个原型中，每枚符文都有 16 维语义向量，槽位顺序会改变符文职责，符文之间通过简化注意力机制产生交互，最终解码为技能名称、标签、参数和动画。  
> 所以它不是技能树，也不是查表，而是一个可计算的构筑空间。  
> 在《漂流诸天》的完整设定里，这套符文会进一步替换为「道痕」，成为角色把世界痕迹固化为个人战技的系统基础。

---

## 23. 当前 MVP 的成功标准

这个 Demo 成功，不是因为它内容多，而是因为访问者能很快产生以下判断：

```text
我明白了：
同样的符文材料，只要顺序变了，规则引擎就会给出不同的技能倾向。
这套东西未来确实可以扩展成更自由的技能构筑系统。
```

这就是本 MVP 的核心价值。
