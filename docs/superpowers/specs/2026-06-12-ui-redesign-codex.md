# UI Redesign — Codex 重构分析

> 日期: 2026-06-12
> 来源: Codex 对 UI 设计的全面重构
> 基线: A0-A1 阶段的原始 UI

---

## 一、架构变化

### 1.1 CSS 分层策略

```
styles.css (2012行) — 基础层: reset, 旧版变量, 组件基础样式, 响应式
visual-refresh.css (1788行) — 覆盖层: 新设计令牌, 新组件样式, 新布局
```

`visual-refresh.css` 在 `App.tsx` 中后于 `styles.css` 加载，利用 CSS 级联规则进行覆盖，原文件不动。这是一种**安全的重构模式**——旧样式保留但被覆盖，新样式作为一个独立文件存在。

### 1.2 架构变化对比

| 维度 | 旧版 (styles.css) | 新版 (visual-refresh.css) |
|------|-------------------|--------------------------|
| 色板命名 | 语义化 (`--color-accent`, `--color-bg`) | 具名色板 (Ink / Jade / Cinnabar / Gold / Moon / Mist) |
| 主色调 | 紫色 (`#c084fc`) | 翡翠绿 (`#62c8b5` / `#91ddcc`) |
| 面板风格 | 纯色表面 (`#1a1a24`) | 玻璃态 (暗色渐变 + 内阴影 + 叠加伪元素) |
| 字体 | 单栈 Segoe UI | 双栈: Noto Sans SC (UI) + Noto Serif SC (展示) |
| 最大宽度 | 1200px | 1680px |
| 布局 | flexbox 垂直流 | Grid 三列工作台 + 弹性降级 |
| 边框圆角 | 统一 8px | 三级: 18px / 12px / 7px |
| 空状态 | 文本占位 | 装饰字形 + 指令文字 + 幽灵网格 |
| 背景 | 纯色 `#0f0f14` | 多层径向渐变 + 网格噪点叠加 |

---

## 二、设计令牌系统

### 2.1 色板命名法

新设计使用**具名色板**而非语义变量。每种颜色有自己的身份：

```
Ink     (墨)   — 深邃背景层   #070b0c → #192526   (5 阶)
Jade    (翡翠) — 主强调色     #62c8b5 / #91ddcc    (2 阶)
Cinnabar(辰砂) — 危险/移除    #cf6048 / #e47a60    (2 阶)
Gold    (金)   — 次级强调/正向 #cdb47b              (1 阶)
Moon    (月)   — 主文字色     #eee9df              (1 阶)
Mist    (雾)   — 次级/三级文字 #a6b3ae / #71817d   (2 阶)
```

**为什么选翡翠绿而非紫色？**
- Jade 在暗色背景上有更好的可读性
- CJK 用户对翡翠/玉色有文化认同
- 与 `cinnabar`(辰砂)、`gold`(金) 构成中国传统色系

### 2.2 间距/圆角/阴影

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--radius-lg: 18px` | 大圆角 | 面板、大容器 |
| `--radius-md: 12px` | 中圆角 | 卡片、槽位 |
| `--radius-sm: 7px` | 小圆角 | 按钮、标签 |
| `--shadow-deep` | `0 24px 80px rgba(0,0,0,0.32)` | 面板浮层 |
| `--line-soft` | `rgba(185,215,204,0.1)` | 微妙分割线 |
| `--line-medium` | `rgba(185,215,204,0.18)` | 可见分割线 |

### 2.3 字体双栈

```css
--font-ui: "Noto Sans SC", "Microsoft YaHei UI", ...     /* 无衬线: 按钮、标签、正文 */
--font-display: "Noto Serif SC", "Songti SC", ...         /* 衬线: 标题、技能名 */
```

这是专为 CJK 内容设计的字体策略——衬线字体给技能名称带来 RPG 百科全书的质感，无衬线字体保证 UI 可读性。

---

## 三、核心布局模式

### 3.1 App Shell

```
.app-shell (max 1680px, 居中)
  └─ .app-header (三列 Grid: brand | motto | tabs)
  └─ .app-main
       └─ section[hidden] × 3  (始终挂载，hidden 切换)
```

**关键设计决策：用 `hidden` 而非条件渲染**
- ✅ 切换 tab 保留滚动位置和局部状态
- ✅ PlayPage 状态在切换到 How 再切回时不丢失
- ⚠️ 三个页面同时存在于 DOM，初始挂载开销略大

### 3.2 Play 工作台 — 三列布局

```
.play-workspace
  grid-template-columns: 270px minmax(480px, 1fr) 350px
  gap: 14px
  min-height: 570px

  ┌────────────┬──────────────────────┬─────────────┐
  │ seed-rail  │   combat-stage       │ result-rail │
  │  270px     │   minmax(480px,1fr)  │   350px     │
  │            │                      │             │
  │ 种子库     │   3D 动画舞台        │  技能详情   │
  └────────────┴──────────────────────┴─────────────┘
```

**响应式降级：**
- 1080px: 右栏折到下方，变成两列
- 820px: 全部单列堆叠

### 3.3 构筑丝带 (Build Ribbon)

三列工作台上方的水平条带，包含：
- 四槽位技能条 (`grid: repeat(4, minmax(140px, 1fr))`)
- 操作按钮组 (2 列 grid, 220px)
- 前向/后向互馈图例 (金/翡翠渐变标注线)

### 3.4 槽位连接器

```css
.slot:not(:last-child)::after {
  /* 翡翠渐变连接线: 1px × 22px，位于槽位之间 */
  background: linear-gradient(90deg, var(--jade-400), transparent);
}
```

这是一个精致的视觉细节——槽位之间的连接线暗示了顺序对结果的影响。

---

## 四、关键视觉技法

### 4.1 面板玻璃态

```css
.panel {
  background:
    linear-gradient(172deg, rgba(13, 20, 21, 0.88), rgba(10, 16, 17, 0.94));
  border: 1px solid var(--line-soft);
  box-shadow: 0 1px 0 rgba(255,255,255,0.018) inset;  /* 顶部微光 */
  border-radius: var(--radius-lg);
}

/* 翡翠色叠加层 */
.panel::after {
  background: linear-gradient(
    160deg, rgba(113, 189, 163, 0.05), transparent 40%
  );
}
```

三层效果：暗色渐变底 + 微妙边框 + 翡翠色对角线叠加 = **暗色玻璃态**

### 4.2 动态颜色注入

组件通过 CSS 自定义属性动态注入元素颜色：

```tsx
// RuneSlotBar.tsx
<div className="slot slot--filled" 
     style={{ '--slot-color': ELEMENT_COLORS[seed.element] }}>
```

```css
.slot--filled {
  border-left: 2px solid var(--slot-color);
}

.slot--active {
  box-shadow: 0 0 0 1px var(--slot-color),
              0 0 18px color-mix(in srgb, var(--slot-color) 22%, transparent);
}
```

颜色流向：`ELEMENT_COLORS` → inline style → CSS `var(--slot-color)` → `border/box-shadow/background`

### 4.3 背景氛围

```css
body {
  background:
    /* 顶部翡翠光晕 */
    radial-gradient(circle at 48% -10%, rgba(71,141,127,0.15), transparent 32%),
    /* 右侧辰砂光晕 */
    radial-gradient(circle at 100% 20%, rgba(139,74,51,0.08), transparent 30%),
    /* 深色渐变底 */
    linear-gradient(160deg, #070a0b 0%, #0a1011 48%, #080b0c 100%);
}

/* 网格噪点纹理 */
body::before {
  background-image:
    linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(to bottom, black, transparent 70%);
  opacity: 0.22;
}
```

双层背景：径向渐变创造氛围光 + 36px 网格噪点叠加模拟纸质质感。噪点向下渐隐（mask）。

### 4.4 动画节奏

| 用途 | 时长 | 缓动 | 说明 |
|------|------|------|------|
| hover/交互 | 160-180ms | ease | 快速的 hover 反馈 |
| 面板刷新闪光 | 900ms | ease-out | 内容更新时的翡翠发光脉冲 |
| 文字差异高亮 | 1.2s | ease-out | 新技能名称的颜色+文字阴影闪烁 |
| 3D 技能动画 | 2-3s | — | Three.js 内置时间驱动 |

### 4.5 空状态设计

每个内容区域都有装饰性空状态，而非纯文本：

- **空槽位**: 大字衬线字形 "+ ···" + "等待技能种子" 指令文字
- **空画布**: 圆形 "演" 字形 + 标题 + 描述段落
- **空详情**: 更大圆形 "技" 字形 + 居中标题
- **空对比**: 虚线边框 + 装饰性幽灵网格 (4 列槽位轮廓) + 居中标签

---

## 五、组件设计原则

### 5.1 统一的面板结构

每个面板组件遵循相同结构：

```
.panel .xxx-panel
  └─ .panel-heading
       ├─ .section-eyebrow  "ENGLISH LABEL"
       ├─ <h3>              中文标题
       └─ .panel-intro      描述段落
  └─ (内容区域)
```

### 5.2 单一数据可视化原语

`VectorBar` 是整个系统中唯一的条形图原语。所有行为维度展示（TechExplainer 的种子状态、槽位卡片、指标）都使用它，确保视觉一致性。

### 5.3 纯 Props 数据流

没有全局状态管理库 (Zustand/Redux)。PlayPage 通过 `useState` + `useMemo` + `useCallback` 管理所有状态，通过 `onBuildChange` 回调向上传递给 App，再向下传递给 HowPage。

### 5.4 预览/编辑分离

```typescript
// PlayPage 中的双状态设计
const [slots, setSlots] = useState(...)           // 编辑状态
const [previewBuild, setPreviewBuild] = useState(...)  // 预览/回放状态
```

这允许用户在查看对比构筑的动画时，不丢失当前编辑中的槽位状态。

---

## 六、响应式策略

| 断点 | 变化 |
|------|------|
| **1680px+** | 最大宽度，完整三列工作台 |
| **1320px** | 缩小品牌区域，隐藏 motto，收紧间距 |
| **1080px** | 工作台变两列 (右栏全宽折行)，技能详情重排 |
| **820px** | 全部单列，header flex-wrap，槽位变两列，连接器隐藏 |
| **560px** | 最小间距(12px)，隐藏副标签，所有网格变两列/单列 |

降级策略的核心思路：**先压缩装饰 (1320)，再折叠列 (1080/820)，最后压缩间距 (560)**。

---

## 七、从这次重构中学到的

### 7.1 设计系统方面

1. **具名色板 > 语义变量 (对于视觉导向项目)**: Ink/Jade/Gold 比 --color-primary/--color-secondary 更容易在设计稿和代码之间对齐。但对于大型应用，语义变量更易于换肤。

2. **字体双栈对 CJK 项目极其重要**: CJK 字符在无衬线字体中缺乏个性，引入衬线字体展示技能名称为整个体验增添了 RPG 百科全书的质感。

3. **空状态值得设计**: 装饰性空状态将"什么都没有"变成"在这里探索"，显著提升第一印象。

4. **网格噪点纹理成本极低、效果显著**: 36px 网格 + 22% 透明度 + mask 渐隐，纯 CSS 实现，为暗色背景增添纸质/桌面质感。

5. **`color-mix()` 是现代 CSS 中最被低估的函数**: 在 `--slot-color` 上使用 `color-mix(in srgb, var(--slot-color) 22%, transparent)` 生成发光效果，无需额外定义变体颜色。

### 7.2 架构方面

1. **CSS 覆盖层模式安全高效**: `styles.css` (基础) + `visual-refresh.css` (覆盖) 允许在不破坏原有结构的情况下进行视觉重设计。适合 vibe coding 场景下的快速迭代。

2. **`hidden` 属性切换 > 条件渲染 (当需要保留状态时)**: 对于 tab 切换场景，`hidden` 比条件渲染更友好——不会丢失滚动位置和组件内部状态。

3. **预览状态应与编辑状态分离**: PlayPage 的 `previewBuild` / `slots` 双状态设计避免了"查看对比构筑时丢失编辑进度"的问题。

### 7.3 可复用的 CSS 技法

```css
/* 玻璃态面板 */
.panel {
  background: linear-gradient(172deg, rgba(13,20,21,0.88), rgba(10,16,17,0.94));
  border: 1px solid rgba(185,215,204,0.1);
  box-shadow: 0 1px 0 rgba(255,255,255,0.018) inset;
  border-radius: 18px;
}

/* 动态颜色发光 */
.slot--active {
  box-shadow: 0 0 0 1px var(--slot-color),
              0 0 18px color-mix(in srgb, var(--slot-color) 22%, transparent);
}

/* 槽位连接线 */
.slot:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -22px;
  width: 22px;
  height: 1px;
  background: linear-gradient(90deg, var(--jade-400), transparent);
}

/* 网格噪点纹理 */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(to bottom, black, transparent 70%);
}

/* 3D 场景暗角 */
.scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center, transparent 55%, rgba(7,11,12,0.5) 100%);
}
```

---

## 八、新旧文件对照

| 旧文件 (被删除/修改) | 新文件 (新增) | 说明 |
|---------------------|---------------|------|
| `src/data/runes.ts` (删除) | `src/data/skillSeeds.ts` | 数据模型从 rune 迁移到 skill seed |
| `src/engine/attentionEngine.ts` (删除) | `src/engine/mutualFeedbackEngine.ts` | 互馈引擎替代注意力引擎 |
| `src/engine/positionEncoding.ts` (删除) | `src/engine/relationScore.ts` | 位置编码被关系评分取代 |
| — | `src/engine/abilityBudget.ts` | 新增能力预算引擎 |
| — | `src/engine/abilityCandidates.ts` | 新增候选能力生成 |
| — | `src/engine/abilityScoring.ts` | 新增能力评分引擎 |
| — | `src/engine/elementLegality.ts` | 新增元素合法性校验 |
| — | `src/components/RunePool.tsx` | 种子库组件 (替代旧的 rune 选择) |
| — | `src/components/SkillScene.tsx` | 3D 技能动画 (Three.js) |
| — | `src/components/TechExplainer.tsx` | How 页技术解释器 |
| — | `src/components/VectorBar.tsx` | 行为维度条形图 |
| `src/styles.css` (修改) | `src/visual-refresh.css` (新增) | 双 CSS 层架构 |
