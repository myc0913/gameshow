---
description: A1 阶段 — 规则引擎纯函数。见原文档§15对应小节。
---

# A1：规则引擎纯函数

## 目标

先把最重要的「同符文不同顺序结果不同」跑通。

## 任务

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

## 验收

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
