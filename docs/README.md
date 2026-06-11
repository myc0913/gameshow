---
description: 文档索引 — 从项目宪法到验收标准共15份文件。每轮开发前确认当前阶段应该阅读哪些文档。
---

# Skill Rune Lab — 文档索引

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

- 结果来自符文向量、槽位编码、注意力权重和解码规则。
- 系统没有为每一种排列手写固定技能。
- 特殊共鸣只是可解释的稀有修正，不是主要生成方式。

---

## Coding Agent 开发提示词

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

## 作品集展示时的解释口径

可以这样介绍：

> 这个 Demo 是我对 AI 规则引擎游戏范式的一次小规模验证。  
> 我没有直接做一个完整 MMO，而是先抽出最关键的系统命题：玩家是否能通过排列语义单元，得到可解释但不可简单枚举的技能结果。  
> 在这个原型中，每枚符文都有 16 维语义向量，槽位顺序会改变符文职责，符文之间通过简化注意力机制产生交互，最终解码为技能名称、标签、参数和动画。  
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
