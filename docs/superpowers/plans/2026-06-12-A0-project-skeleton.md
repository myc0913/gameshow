# A0 项目骨架实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 初始化 Vite + React + TypeScript 项目，搭建 Play/How/Why 三个 Tab 页面及 Play 页左右分栏占位布局。

**Architecture:** 单页应用，App 组件管理当前 Tab 的 state，按 Tab 渲染对应 Page 组件。PlayPage 采用左右分栏（左 40% 操作区，右 60% 展示区）。CSS 使用全局 styles.css。

**Tech Stack:** Vite 6 + React 18 + TypeScript 5, 纯 CSS（无框架）

---

### Task 1: 初始化 Vite + React + TypeScript 项目

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, 等脚手架文件

- [ ] **Step 1: 用 Vite 创建项目**

```bash
cd E:/gameshow
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: 安装依赖**

```bash
cd E:/gameshow
npm install
```

- [ ] **Step 3: 验证 dev server 可启动**

```bash
npm run dev
```

访问 `http://localhost:5173`，确认 Vite + React 默认页面正常显示。然后终止 dev server。

- [ ] **Step 4: 清理 Vite 默认文件**

删除 Vite 生成的默认文件：
```bash
rm -f src/App.css
rm -f src/index.css
rm -f src/assets/react.svg
rm -f public/vite.svg
```

- [ ] **Step 5: 创建项目子目录**

```bash
mkdir -p src/data
mkdir -p src/engine
mkdir -p src/components
mkdir -p src/pages
mkdir -p src/types
```

---

### Task 2: 定义 TypeScript 类型骨架

**Files:**
- Create: `src/types/rune.ts`
- Create: `src/types/skill.ts`

- [ ] **Step 1: 创建符文类型定义**

```typescript
// src/types/rune.ts

/** 基础元素类型 */
export type RuneElement = 'fire' | 'frost' | 'lightning' | 'wind';

/** 单个符文 */
export interface Rune {
  id: string;
  name: string;
  element: RuneElement;
  /** 语义向量各维度值，A1 阶段填充 */
  vector: number[];
}
```

- [ ] **Step 2: 创建技能类型定义**

```typescript
// src/types/skill.ts

/** 技能参数 */
export interface SkillParam {
  name: string;
  value: number;
  unit?: string;
}

/** 规则引擎生成的技能结果 */
export interface Skill {
  name: string;
  tags: string[];
  params: SkillParam[];
  /** 简短风味描述 */
  description: string;
}

/** 规则引擎 trace 记录，用于 How 页解释 */
export interface TraceEntry {
  step: string;
  detail: string;
}

export interface SkillResult {
  skill: Skill;
  trace: TraceEntry[];
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误。

---

### Task 3: 创建全局样式

**Files:**
- Create: `src/styles.css`

- [ ] **Step 1: 编写全局样式**

```css
/* src/styles.css */

/* === Reset & Base === */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-bg: #0f0f14;
  --color-surface: #1a1a24;
  --color-border: #2a2a3a;
  --color-text: #e0e0e0;
  --color-text-dim: #8888a0;
  --color-accent: #c084fc;
  --color-accent-glow: #a855f7;
  --radius: 8px;
  --gap: 16px;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}

/* === Layout === */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--gap);
}

.page-content {
  flex: 1;
  overflow-y: auto;
}

/* === Play Page: 左右分栏 === */
.play-layout {
  display: flex;
  gap: var(--gap);
  height: 100%;
}

.play-left {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-width: 0;
}

.play-right {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-width: 0;
}

/* === 面板通用 === */
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--gap);
}

.panel-title {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

/* === 占位区 === */
.placeholder-area {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text-dim);
  font-size: 0.9rem;
  min-height: 80px;
}

.placeholder-area.placeholder-runes {
  min-height: 120px;
}

.placeholder-area.placeholder-canvas {
  min-height: 240px;
  flex: 1;
}

/* === 槽位栏 === */
.slot-bar {
  display: flex;
  gap: 8px;
}

.slot {
  flex: 1;
  aspect-ratio: 1;
  max-width: 64px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
  font-size: 0.75rem;
}

/* === 铭刻按钮 === */
.btn-engrave {
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 10px 24px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-engrave:hover {
  background: var(--color-accent-glow);
}

.btn-engrave:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* === Tab 导航 === */
.tab-nav {
  display: flex;
  gap: 4px;
  margin-bottom: var(--gap);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0;
}

.tab-btn {
  background: none;
  border: none;
  color: var(--color-text-dim);
  padding: 8px 20px;
  font-size: 0.95rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

/* === 响应式 === */
@media (max-width: 768px) {
  .play-layout {
    flex-direction: column;
  }
}
```

---

### Task 4: 创建 TabNav 组件

**Files:**
- Create: `src/components/TabNav.tsx`

- [ ] **Step 1: 编写 TabNav 组件**

```typescript
// src/components/TabNav.tsx

export type TabId = 'play' | 'how' | 'why';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'play', label: 'Play' },
  { id: 'how', label: 'How' },
  { id: 'why', label: 'Why' },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误。

---

### Task 5: 创建 PlayPage 占位组件

**Files:**
- Create: `src/pages/PlayPage.tsx`

- [ ] **Step 1: 编写 PlayPage 组件**

```typescript
// src/pages/PlayPage.tsx

export function PlayPage() {
  return (
    <div className="play-layout">
      {/* 左栏：操作区 */}
      <div className="play-left">
        {/* 符文池 */}
        <div className="panel">
          <div className="panel-title">符文池</div>
          <div className="placeholder-area placeholder-runes">
            选择符文（A2 实现）
          </div>
        </div>

        {/* 槽位栏 */}
        <div className="panel">
          <div className="panel-title">技能槽位</div>
          <div className="slot-bar">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="slot">{n}</div>
            ))}
          </div>
        </div>

        {/* 铭刻按钮 */}
        <button className="btn-engrave" disabled>
          铭刻生成
        </button>
      </div>

      {/* 右栏：展示区 */}
      <div className="play-right">
        {/* 技能结果面板 */}
        <div className="panel">
          <div className="panel-title">技能结果</div>
          <div className="placeholder-area">
            铭刻符文后在此展示技能
          </div>
        </div>

        {/* 动画区 */}
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">技能动画</div>
          <div className="placeholder-area placeholder-canvas">
            Three.js Canvas 占位（A3 实现）
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误。

---

### Task 6: 创建 HowPage 和 WhyPage 占位组件

**Files:**
- Create: `src/pages/HowPage.tsx`
- Create: `src/pages/WhyPage.tsx`

- [ ] **Step 1: 编写 HowPage 组件**

```typescript
// src/pages/HowPage.tsx

export function HowPage() {
  return (
    <div className="page-content">
      <div className="panel">
        <h2>规则引擎如何工作</h2>
        <div className="placeholder-area" style={{ minHeight: 200, marginTop: 16 }}>
          生成技能后，此处展示规则引擎的 trace 日志（A4 实现）
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 编写 WhyPage 组件**

```typescript
// src/pages/WhyPage.tsx

export function WhyPage() {
  return (
    <div className="page-content">
      <div className="panel">
        <h2>为什么不是技能树？</h2>
        <div className="placeholder-area" style={{ minHeight: 200, marginTop: 16 }}>
          理念阐述：排列即构筑，顺序即指纹（A5 实现）
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误。

---

### Task 7: 创建 App.tsx 和 main.tsx 入口

**Files:**
- Create: `src/App.tsx`（覆盖 Vite 默认）
- Create: `src/main.tsx`（覆盖 Vite 默认）

- [ ] **Step 1: 编写 App 组件（Tab 切换）**

```typescript
// src/App.tsx

import { useState } from 'react';
import { TabNav, type TabId } from './components/TabNav';
import { PlayPage } from './pages/PlayPage';
import { HowPage } from './pages/HowPage';
import { WhyPage } from './pages/WhyPage';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('play');

  const renderPage = () => {
    switch (activeTab) {
      case 'play':
        return <PlayPage />;
      case 'how':
        return <HowPage />;
      case 'why':
        return <WhyPage />;
    }
  };

  return (
    <div className="app-shell">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      {renderPage()}
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 编写 main.tsx 入口**

```typescript
// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: 更新 index.html 标题**

修改 `index.html` 中的 `<title>`：
```html
<title>技能符文构筑实验室</title>
```

- [ ] **Step 4: 验证 dev server 启动无报错**

```bash
npm run dev
```

访问 `http://localhost:5173`，确认：
- 默认进入 Play 页
- 三个 Tab 可切换
- 控制台无报错

---

### Task 8: 最终验证与收尾

- [ ] **Step 1: TypeScript 全面检查**

```bash
npx tsc --noEmit
```

预期：无任何类型错误。

- [ ] **Step 2: 构建检查**

```bash
npm run build
```

预期：Vite 构建成功，无报错。

- [ ] **Step 3: 对照验收标准自查**

- `npm run dev` 可启动 ✓
- 默认进入 Play 页 ✓
- 三个 Tab 可切换 ✓
- 控制台无报错 ✓
- Play 页可见符文池空区、4 槽位、铭刻按钮、结果面板空态、动画区 Canvas 框 ✓

- [ ] **Step 4: 对照 anti-cheat-checklist 自查**

```bash
# 确认无硬编码技能结果
grep -r "if.*join\|冰焰\|雷风" src/ || echo "通过：无硬编码技能"
# 确认 engine/ 目录存在但无逻辑（A0 要求）
ls src/engine/
```
