# 技能符文构筑实验室

> **AI 规则引擎 Demo** — 验证「同样 4 枚技能符文，不同排列顺序，会经由规则引擎生成体感明显不同的技能结果」。

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-latest-black)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff)](https://vitejs.dev/)

已部署网址:https://myc0913.github.io/gameshow/
---

## 一句话

**这不是预设技能树，也不是随机生成器，而是玩家的排列行为在规则引擎中留下了可计算的构筑指纹。**

## 快速开始

```bash
npm install
npm run dev      # 开发模式 → http://localhost:5173
npm run build    # 生产构建 → dist/
npm run preview  # 预览构建产物
```

## 项目结构

```
src/
  engine/v6/              # V6 规则引擎纯函数（核心）
    generateBuildV6.ts     # 主入口：generateBuildV6() 纯函数
    computeForwardPass.ts  # 前向互馈计算
    computeBackwardPass.ts # 后向互馈计算
    finalizeGeneratedSkill.ts # 技能解码（名称/描述/动画规格）
    diffBuilds.ts          # Build 差异对比
    decodeAnimationSpec.ts # 动画参数解码
    sourceProjection.ts    # 后向来源投影
    math.ts                # 向量/聚合工具函数
    validation.ts          # 输入验证
    index.ts               # 公共导出
  data/            # 技能种子数据、命名词库
  components/      # UI 组件（RunePool, RuneSlotBar, V6SkillCard, SkillScene, etc.）
  pages/           # Play / How / Why 三个页面
  types/           # TypeScript 类型定义
```

## 核心机制

### 管道流程

```
4 枚技能种子 → 建立基础快照 → 前向互馈（左→右，越近越强）
→ 冻结前向结果 → 后向来源投影 → 后向联合聚合（右→左修饰）
→ 最终技能解码 → 名称 / 描述 / 参数 / 动画规格 + 完整 Trace
```

### 关键设计

- **24 个基础技能**：每枚技能种子有固定身份（主元素 + 主形态 + 主效果）
- **36 个定向元素反应**：火/冰/雷/岩/影/风 六元素间的有向互馈规则
- **前向强、后向轻**：前位技能较强地改变后位技能，后位技能较轻地联合修饰前位技能
- **连续聚合**：按维度有符号聚合与饱和，不采用 Softmax / Top-K / 完整排列查表
- **完整 Trace**：每次生成输出完整计算过程，所有变化可追溯、可解释

### 默认对比样例

| | 构筑 A | 构筑 B |
|---|---|---|
| 顺序 | 🔥→❄️→⚡→🍃 | 🍃→⚡→❄️→🔥 |
| 名称 | 不同 | 不同 |
| 标签 | 不同 | 不同 |
| 动画 | 不同 | 不同 |

**相同符文，仅交换顺序 → 名称不同、标签不同、动画不同、参数不同。**

## 技术栈

- **React 19** + **TypeScript 6** + **Vite 8**
- **Three.js** — 3D 技能动画（粒子系统 + 几何体 + 线段）
- **纯 CSS** — 暗色主题，无 UI 库依赖
- **纯前端** — 无后端、无数据库、无外部 API

## 设计约束

- ❌ 不接入后端、数据库或外部 AI API
- ❌ 不用完整排列查表生成技能
- ✅ 技能结果必须来自 `generateBuildV6()` 纯函数
- ✅ 核心规则放在 `src/engine/v6/`，写成纯函数
- ✅ 每次生成必须输出完整 `trace`
- ✅ 不采用 Softmax，不采用只保留 Top-K

## 部署

项目为纯静态站点，可部署到任意静态托管服务：

```bash
npm run build
# 将 dist/ 目录部署到 GitHub Pages / Vercel / Netlify / Cloudflare Pages
```

### Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

### 部署验证

构建产物为纯静态文件，可直接通过任意 HTTP 服务器预览：

```bash
npm run preview          # Vite 内置预览服务器
# 或
npx serve dist           # 使用 serve 包
```

## 许可证

MIT
