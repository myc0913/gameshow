---
description: 文档索引 — 从项目宪法到验收标准。每轮开发前确认当前阶段应该阅读哪些文档。
---

# Skill Rune Lab — 文档索引

> **当前引擎演进提示：** 后续涉及规则引擎、Play、How 或动画的修改，必须先读
> `v6/README.md` 及其索引的四份设计文档。`contracts/asymmetric-mutual-feedback.md` 用于理解背景与已确认结论。
> 本索引下方的旧阶段文档属于历史实现背景；与 V6 设计包冲突时，以 V6 设计包为准。

## README 必须包含

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

- 结果来自基础技能、定向元素关系、槽位距离、后位权威度和有符号聚合规则。
- 系统没有为每一种排列手写固定技能。
- 特殊共鸣只是可解释的稀有修正，不是主要生成方式。

---

## Coding Agent 开发提示词

V6 不再使用旧的 16 维向量提示词。请直接使用
`v6/presentation-and-migration.md` 第 14 节的开发提示词，并按 V6-0 到 V6-5 分阶段交付。

---

## 作品集展示时的解释口径

可以这样介绍：

> 这个 Demo 是我对 AI 规则引擎游戏范式的一次小规模验证。  
> 我没有直接做一个完整 MMO，而是先抽出最关键的系统命题：玩家是否能通过排列语义单元，得到可解释但不可简单枚举的技能结果。  
> 在这个原型中，每枚符文先定义一个形态固定、主效果明确的基础技能。槽位顺序会改变前向与后向关系，定向元素规则再通过距离、末位权威度和有符号聚合，生成不同的名称、机制、参数和动画。
> 所以它不是技能树，也不是查表，而是一个可计算的构筑空间。  
> 在《漂流诸天》的完整设定里，这套符文会进一步替换为「道痕」，成为角色把世界痕迹固化为个人战技的系统基础。

---

## 当前 MVP 的成功标准

这个 Demo 成功，不是因为它内容多，而是因为访问者能很快产生以下判断：

```text
我明白了：
同样的符文材料，只要顺序变了，规则引擎就会给出不同的技能倾向。
这套东西未来确实可以扩展成更自由的技能构筑系统。
```

这就是本 MVP 的核心价值。

---

## 文档一览

| 文件 | 什么时候读 |
|---|---|
| `CONSTITUTION.md` | **每轮开发必读** — 北极星、定位、选型、结构、原则、不做清单 |
| `v6/README.md` | **V6 开发入口** — 文档优先级、阅读顺序、已确认结论和实现边界 |
| `v6/base-skills.md` | V6 数据层 — 10 项公共参数、机制层、元素能力边界和 24 个基础技能 |
| `v6/element-reactions.md` | V6 关系层 — 全部 36 个定向元素反应、正负参数和机制变化 |
| `v6/engine-spec.md` | V6 引擎层 — 前向、后向、距离、权威度、有符号聚合、输出和 Trace |
| `v6/presentation-and-migration.md` | V6 展示与实施 — Play、How、动画、迁移阶段、测试和交接提示词 |
| `contracts/asymmetric-mutual-feedback.md` | V6 背景合同 — 非对称双向互馈、元素边界、单主效果和变化表达 |
| `contracts/data-structures.md` | 实现 `engine/` 和 `types/` 时 — 向量维度、符文、技能类型、参数、Trace |
| `contracts/engine-pipeline.md` | 实现 `engine/` 时 — 计算流程、位置编码、注意力、解码、命名、特殊共鸣 |
| `contracts/page-specs.md` | 实现 `components/` 和 `pages/` 时 — Tab、Play、Three.js、Compare、How、Why |
| `phases/A0-project-skeleton.md` | A0 阶段 — 项目骨架、三个 Tab、静态占位 |
| `phases/A1-engine-core.md` | A1 阶段 — 规则引擎纯函数实现与验收 |
| `phases/A2-play-interaction.md` | A2 阶段 — Play 页交互实现与验收 |
| `phases/A3-threejs-animation.md` | A3 阶段 — Three.js 技能演示实现与验收 |
| `phases/A4-how-page.md` | A4 阶段 — How 页技术解释实现与验收 |
| `phases/A5-why-polish-deploy.md` | A5 阶段 — Why 页、README、部署、UI Polish |
| `reference/anti-cheat-checklist.md` | **每阶段收尾时** — 9 条反跑偏自查 |
| `reference/acceptance-criteria.md` | A5 收尾时 — 10 条最终验收标准 + 最小可接受版本 |
| `reference/recording-script.md` | A5 部署后 — 2 分钟录屏脚本 |
