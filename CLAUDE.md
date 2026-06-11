# CLAUDE.md — 技能符文构筑实验室

## 项目性质

纯前端 React + Vite + TypeScript + Three.js Demo。验证「同样 4 枚技能符文，不同排列顺序，会经由规则引擎生成体感明显不同的技能结果」。

## 最高优先级规则

1. **不要接入后端、数据库或外部 AI API。** 规则引擎在前端本地运行。
2. **不要用完整排列查表生成技能。** 技能结果必须来自 `generateSkill()` 纯函数。
3. **核心规则必须放在 `src/engine/`，写成纯函数。** UI 只调用规则、展示结果。
4. **每次生成必须输出 `trace`。** How 页读取 trace，不手写解释。
5. **默认 A/B 对比案例：** A: fire→frost→lightning→wind, B: wind→lightning→frost→fire。二者必须明显不同。

## 文档加载策略

开发每个阶段时，先加载以下文档组合：

| 开发阶段 | 加载文档 |
|---------|---------|
| 所有阶段 | `docs/CONSTITUTION.md` |
| A0 | + `docs/phases/A0-project-skeleton.md` |
| A1 | + `docs/contracts/data-structures.md` + `docs/contracts/engine-pipeline.md` + `docs/phases/A1-engine-core.md` |
| A2 | + `docs/contracts/page-specs.md` + `docs/phases/A2-play-interaction.md` |
| A3 | + `docs/contracts/page-specs.md` + `docs/phases/A3-threejs-animation.md` |
| A4 | + `docs/contracts/engine-pipeline.md` + `docs/phases/A4-how-page.md` |
| A5 | + `docs/phases/A5-why-polish-deploy.md` |
| 每阶段收尾 | + `docs/reference/anti-cheat-checklist.md` |
| 最终收尾 | + `docs/reference/acceptance-criteria.md` |

## 技术栈

- React 18+ / Vite / TypeScript 5+
- Three.js (技能动画)
- CSS Modules 或 Tailwind（选最快的）
- 状态管理：React state，如需复杂状态用 Zustand

## 目录结构

```
src/
  data/        — 符文数据、词库、向量维度定义
  engine/      — 规则引擎纯函数（核心）
  components/  — UI 组件
  pages/       — Play/How/Why 三个页面
  types/       — TypeScript 类型定义
```

## 每阶段完成后

1. 运行 `npx tsx scripts/verify-engine.ts`（如果 engine/ 有修改）
2. 对照 `docs/reference/anti-cheat-checklist.md` 自查
3. 调用 spec-guardian 子代理审查
4. git commit 当前阶段
