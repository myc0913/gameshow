---
description: 项目宪法 — 北极星、定位、技术选型、架构原则、明确不做清单。每轮开发必读。
---

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
