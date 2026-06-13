# V6-3 Play 接入 — 设计文档

**日期**: 2026-06-13
**状态**: 已批准
**关联**: V6-0, V6-1, V6-2 已完成；V6-4 (How), V6-5 (Three.js) 后续

---

## 1. 目标

将 Play 页面从旧 V4/V5 引擎切换到 V6 引擎 (`generateBuildV6`)，按照 `docs/v6/presentation-and-migration.md §6` 规范展示技能结果卡、变化账本和 A/B 对比。

## 2. 方案：渐进替换（方案 A）

保留现有组件外壳和布局骨架，内部数据源逐步从旧类型切换到 V6 类型。新旧引擎并行运行，旧路径保留到 V6-5 统一清理。

## 3. 数据流切换

```
当前: SkillSeed[] → generateBuild() → BuildResult → 各组件

V6-3: seedId[] → generateBuildV6() → GeneratedBuild → 新组件
                                    ↘ generateBuild() → BuildResult (保留兼容)
```

PlayPage 的 `useMemo` 中新增 `generateBuildV6` 调用。旧 `generateBuild` 调用保留，供 App 层共享状态兼容。

## 4. App 层共享状态过渡

```ts
interface PlayPageBuildState {
  // 旧字段保留兼容（How 页尚未迁移）
  currentBuild: BuildResult | null;
  previousBuild: BuildResult | null;
  currentSeeds: SkillSeed[];
  // V6 新增
  v6Build: GeneratedBuild | null;
  v6PreviousBuild: GeneratedBuild | null;
}
```

V6-4 切 How 时清理旧字段。

## 5. 组件改动

### 5.1 RuneSlotBar（轻量）

- 槽位数据从 `(SkillSeed | null)[]` 改为 `(string | null)[]`（seedId）
- 显示用的名称/元素色从 `getBaseSkill(seedId)` 获取
- 拖拽重排、移除、选中逻辑不变

### 5.2 RunePool（中量）

- 数据源：6 个旧 SkillSeed → 24 个 BaseSkillDefinition
- 新增元素筛选（6 元素 + "全部"）+ 形态筛选（9 形态）
- 保持可展开/收起
- 点击添加传 seedId

### 5.3 SkillResultPanel（重量 — 核心组件）

按设计文档 §6.2 重构技能卡：

**收起态（第一层）：**
- 生成名称（generatedName）
- 元素 / 形态 / coreEffect 一句话
- 最显著的 3 项变化（基础值 → 最终值，含 delta 符号和颜色）
- 最强的 2 个当前机制标签
- 来源摘要（"受哪些槽位影响"）
- 展开按钮

**展开态（第二层）：**
- 10 个参数完整 `基础 → 前向 → 最终` 三列对比
- 全部机制标签及强度
- 前向主反应名称 + 后向联合修饰摘要
- 动画图例（form + primaryElement + forwardCue/backwardCue）

### 5.4 ComparePanel（重量 — seed 对齐）

- 按 seed（SkillOccurrenceKey）对齐，非按 slot
- 使用 `diffBuilds()` 纯函数生成差异数据
- 展示：A/B 槽位变化、主前向反应变化、参数/机制差异、动画 Cue 差异

### 5.5 新增：变化账本条

- 位于技能卡下方、对比面板上方
- 序列变化时调用 `diffBuilds(prevBuild, currBuild)` 展示摘要
- 显示：技能槽位移动、主前向来源变化、关键参数增减

## 6. 不做的事

- 不写 `GeneratedSkill → DecodedSkill` 通用适配器（丢信息）
- 不修改 `src/types/skill.ts` 旧类型
- SkillScene 动画暂做简易映射（`primaryPalette[0]` → `primaryColor`），完整动画留 V6-5
- HowPage 不改动（V6-4）
- 不删除旧 engine/skillGenerator.ts

## 7. 边界与错误处理

| 场景 | 处理 |
|---|---|
| 槽位全空 | 不调用引擎，卡片区显示空状态 |
| 仅 1 个技能 | 引擎支持 1..4，无互馈时正常展示 |
| 重复 seed | occurrenceIndex 稳定匹配 |
| 引擎抛错 | PageErrorBoundary 兜底 + try/catch 返回 null |
| 交换槽位 | previousBuild 保存，diffBuilds 自动生成账本 |
| 符文池筛选后无结果 | 显示空状态提示 |

## 8. 测试

- 新组件单元测试（SkillResultPanel 收起/展开、ComparePanel seed 对齐、变化账本）
- 集成验证：PlayPage 中 generateBuildV6 正常调用，交换槽位后 diffBuilds 正确
- 回归检查：旧功能不崩（清空/随机/默认对比）
- 验收脚本 `scripts/verify-v6-3.ts`：默认 A/B 通过 V6 管线，检查 §12.5 差异标准

## 9. UI 视觉

继承现有视觉语言（玻璃面板、Ink/Jade/Cinnabar/Gold/Moon/Mist 配色体系、三列 workspace 布局、动画节奏），在此基础上升级卡片内容。UI 细节后续可独立迭代。
