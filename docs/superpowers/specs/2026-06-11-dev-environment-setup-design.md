# Dev Environment Setup Design: 技能符文构筑实验室

> 设计日期：2026-06-11
> 状态：已确认，待实施

---

## 0. 背景

项目《AI 规则引擎 Demo：技能符文构筑实验室》是一个纯前端 React + Vite + TypeScript + Three.js MVP Demo。当前项目只有一份 1072 行的实施文档，无源代码。

目标：在开始 A0-A5 逐阶段开发之前，先搭建好开发环境基础设施——插件、文档结构、自动化检查、开发流程。

---

## 1. 设计目标

1. **防跑偏**：自动检查确保 coding agent 不偏离文档约束（查表、后端、硬编码）
2. **防返工**：阶段间接口有明确契约，验收通过才进入下一阶段
3. **提效率**：减少上下文噪音，减少人工重复验证

---

## 2. 插件与 MCP 配置

### 2.1 已就绪（保持）

| 工具 | 用途 |
|------|------|
| superpowers (5.1.0) | brainstorming、writing-plans、executing-plans、TDD、verification-before-completion |

### 2.2 新增安装

| 优先级 | 插件/MCP | 用途 |
|--------|---------|------|
| 🔴 必装 | frontend-design | React UI 组件设计指导 |
| 🔴 必装 | typescript-lsp | TypeScript 类型检查、智能提示 |
| 🔴 必装 | code-review | `/code-review` 阶段审查 |
| 🔴 必装 | context7 MCP | React/Vite/TypeScript/Three.js 最新文档 |
| 🔴 必装 | github MCP | 版本管理与后续部署 |
| 🟡 推荐 | commit-commands | `/commit`、`/commit-push-pr` 规范化 |

### 2.3 明确不装

| 工具 | 理由 |
|------|------|
| ECC (Everything Claude Code) | 63+ agents / 251+ skills 对 MVP 规模严重过度 |
| codegraph MCP | 项目暂无代码可索引，A3 后再评估 |
| feature-dev | superpowers 的 executing-plans + dispatching-parallel-agents 已覆盖 |

---

## 3. 文档拆分

### 3.1 目标结构

```
docs/
├── CONSTITUTION.md              # 宪法（永远适用）
├── contracts/
│   ├── data-structures.md       # 向量维度、符文、技能类型
│   ├── engine-pipeline.md       # 位置编码、注意力、解码、命名、共鸣
│   └── page-specs.md            # Play/How/Why 页面合同
├── phases/
│   ├── A0-project-skeleton.md   # 项目骨架与静态页面
│   ├── A1-engine-core.md        # 规则引擎纯函数
│   ├── A2-play-interaction.md   # Play 页交互
│   ├── A3-threejs-animation.md  # Three.js 技能演示
│   ├── A4-how-page.md           # How 页技术解释
│   └── A5-why-polish-deploy.md  # Why 页、README 与部署
├── reference/
│   ├── anti-cheat-checklist.md  # 反跑偏检查清单（9 条）
│   ├── acceptance-criteria.md   # 最终验收标准（10 条）
│   └── recording-script.md      # 2 分钟录屏脚本
└── README.md                    # 项目入口
```

### 3.2 每阶段加载策略

开发 A1 引擎时，coding agent 加载：

```
CONSTITUTION.md
+ contracts/data-structures.md
+ contracts/engine-pipeline.md
+ phases/A1-engine-core.md
+ reference/anti-cheat-checklist.md
```

约 **400 行** 精准上下文（vs 原 1072 行全量）。

### 3.3 各文件内容映射

| 新文件 | 原文档章节 |
|--------|-----------|
| CONSTITUTION.md | §0-3（北极星、定位、技术选型、目录结构、架构原则） |
| contracts/data-structures.md | §4（向量维度、符文、技能类型） |
| contracts/engine-pipeline.md | §5-8（引擎输入输出、计算流程、解码、特殊共鸣） |
| contracts/page-specs.md | §9-14（Tab结构、Play/How/Why/ComparePanel/SkillScene 合同） |
| phases/A0-*.md ~ A5-*.md | §15（开发阶段拆分），每阶段拆为独立文件 |
| reference/anti-cheat-checklist.md | §19 |
| reference/acceptance-criteria.md | §20 |
| reference/recording-script.md | §17 |
| README.md | §16 + §18 + §22 |

---

## 4. 自动化检查

### 4.1 PostToolUse Hook

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "ifModified": "src/engine/**",
        "command": "npx tsx scripts/verify-engine.ts"
      }
    ]
  }
}
```

修改 `src/engine/` 下文件后自动触发。

### 4.2 验证脚本 `scripts/verify-engine.ts`

| 检查项 | 方法 |
|--------|------|
| generateSkill 纯函数 | 相同输入 3 次调用，输出完全一致 |
| A/B 案例差异 | name / tags / topDims / params 均不同 |
| trace 完整性 | positionedVectors=4、interactionScores 为 4×4 |
| 无查表反模式 | grep 无 `join.*rune`、switch-case 硬编码 |
| 无后端调用 | grep 无 `fetch`、`axios`、外部 API |

### 4.3 spec-guardian 子代理

每阶段结束时运行，基于 `reference/anti-cheat-checklist.md` 9 条检查逐条审查：

1. 是否还围绕「排列顺序产生构筑指纹」？
2. 是否出现了完整排列查表？
3. 是否把大量时间花在美术资产上？
4. 是否 How 页写成了数学论文？
5. 是否 Play 页一打开就能操作？
6. 是否默认 A/B 对比足够明显？
7. 是否技能结果和动画来自同一个 finalVector？
8. 是否 trace 可以解释结果？
9. 是否控制台无明显报错？

### 4.4 权限白名单

```json
{
  "permissions": {
    "allow": [
      "npm run dev",
      "npm run build",
      "npx tsx scripts/*",
      "git add",
      "git commit",
      "git status",
      "git diff"
    ],
    "defaultMode": "acceptEdits"
  }
}
```

---

## 5. 开发流程

### 5.1 逐阶段三步闭环

```
1. 开发    → coding agent 加载阶段文档 + 合同文档，执行开发
2. 验证    → 验收脚本 + PostToolUse hook 自动检查
3. 守门    → spec-guardian 子代理审查，通过才进入下一阶段
```

### 5.2 阶段顺序

```
A0 (骨架) → A1 (引擎) → A2 (交互) → A3 (动画) → A4 (How页) → A5 (Why+部署)
```

每阶段依赖上一阶段输出，不可跳跃。

### 5.3 验收标准传递

每个阶段的验收标准必须满足后才能进入下一阶段。A1 需额外验证：

- A（fire→frost→lightning→wind）与 B（wind→lightning→frost→fire）
- 名称不同、标签不同、Top5 维度不同、参数明显不同、trace 可读

---

## 6. 首次配置执行顺序

1. 安装插件（frontend-design, typescript-lsp, code-review, commit-commands）
2. 配置 MCP（context7, github）
3. 拆分文档（按 §3 目录结构）
4. 创建 `.claude/settings.json`（hooks + 权限白名单）
5. 创建 `CLAUDE.md`（引导 agent 读取正确文档）
6. 创建 `scripts/verify-engine.ts`
7. 创建 spec-guardian 子代理

---

## 7. 不复用的 gugu 配置

| gugu 配置 | 不复用理由 |
|-----------|-----------|
| backend-contract-auditor | 纯前端项目无后端 |
| frontend-runtime-tracer | MVP 规模不需要运行时追踪 |
| python/pep8 rules | 无 Python 代码 |
| targeted-implementation skill | pre-edit gate 对小项目太重量级 |
| phase-planner skill | 项目已有 A0-A5 固定阶段拆分 |
| phase-review skill | spec-guardian 替代 |
| repo-grounded-audit | 项目量级不足以需要 |
| build-error-resolver | superpowers 的 systematic-debugging 覆盖 |
