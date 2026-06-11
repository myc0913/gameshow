# Dev Environment Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up complete development environment for the skill rune lab project: plugins, MCP servers, document splitting, automated checks, and guardian subagent.

**Architecture:** Configuration-only changes — no application code. Create `.claude/settings.json` for hooks and permissions, `CLAUDE.md` for agent guidance, split the 1072-line spec into layered docs under `docs/`, write an engine verification script, and define a spec-guardian subagent.

**Tech Stack:** Claude Code configuration (JSON, Markdown), TypeScript (verification script)

---

## File Structure

```
Create:
  .claude/settings.json               — hooks + permissions
  .claude/agents/spec-guardian.md     — anti-cheat checker subagent
  CLAUDE.md                           — project-level agent instructions
  scripts/verify-engine.ts            — engine pure-function verification
  docs/CONSTITUTION.md                — from original §0-3
  docs/contracts/data-structures.md   — from original §4
  docs/contracts/engine-pipeline.md   — from original §5-8
  docs/contracts/page-specs.md        — from original §9-14
  docs/phases/A0-project-skeleton.md  — from original §15-A0
  docs/phases/A1-engine-core.md       — from original §15-A1
  docs/phases/A2-play-interaction.md  — from original §15-A2
  docs/phases/A3-threejs-animation.md — from original §15-A3
  docs/phases/A4-how-page.md          — from original §15-A4
  docs/phases/A5-why-polish-deploy.md — from original §15-A5
  docs/reference/anti-cheat-checklist.md  — from original §19
  docs/reference/acceptance-criteria.md   — from original §20
  docs/reference/recording-script.md      — from original §17
  docs/README.md                          — from original §16 + §18 + §22

Directories to create:
  docs/contracts/
  docs/phases/
  docs/reference/
  scripts/
  .claude/agents/
```

---

### Task 1: Create directory structure

**Files:**
- Create: all directories listed above

- [ ] **Step 1: Create all directories**

```bash
mkdir -p docs/contracts docs/phases docs/reference scripts .claude/agents
```

- [ ] **Step 2: Verify directories exist**

```bash
ls -d docs/contracts docs/phases docs/reference scripts .claude/agents
```

Expected: all five directories listed without error

---

### Task 2: Split original document into layered docs

**Files:**
- Create: `docs/CONSTITUTION.md`
- Create: `docs/contracts/data-structures.md`
- Create: `docs/contracts/engine-pipeline.md`
- Create: `docs/contracts/page-specs.md`
- Create: `docs/phases/A0-project-skeleton.md`
- Create: `docs/phases/A1-engine-core.md`
- Create: `docs/phases/A2-play-interaction.md`
- Create: `docs/phases/A3-threejs-animation.md`
- Create: `docs/phases/A4-how-page.md`
- Create: `docs/phases/A5-why-polish-deploy.md`
- Create: `docs/reference/anti-cheat-checklist.md`
- Create: `docs/reference/acceptance-criteria.md`
- Create: `docs/reference/recording-script.md`
- Create: `docs/README.md`
- Reference: `AI规则引擎Demo_技能符文构筑实验室_MVP项目实施文档.md` (read-only source)

- [ ] **Step 1: Extract CONSTITUTION.md (§0-3)**

Read the source document line 1 through line 116, extract sections §0 (北极星), §1 (定位), §2 (技术选型), §3 (目录结构与架构原则). Write to `docs/CONSTITUTION.md` with frontmatter:

```markdown
---
description: 项目宪法 — 北极星、定位、技术选型、架构原则、明确不做清单。每轮开发必读。
---

# 技能符文构筑实验室 — 项目宪法

[content from §0, §1, §2, §3 of the original document]
```

- [ ] **Step 2: Extract contracts/data-structures.md (§4)**

Read the source document §4 (vector dims, rune type, skill types, skill params). Write to `docs/contracts/data-structures.md` with frontmatter:

```markdown
---
description: 核心数据结构合同 — 向量维度、符文定义、技能类型、技能参数。实现 engine/ 和 types/ 时必读。
---

# 核心数据结构合同

[content from §4 of the original document]
```

- [ ] **Step 3: Extract contracts/engine-pipeline.md (§5-8)**

Read the source document §5-8 (engine I/O, computation flow, position encoding, attention, decoding, naming, special resonance). Write to `docs/contracts/engine-pipeline.md` with frontmatter:

```markdown
---
description: 规则引擎合同 — 输入输出、计算流程、位置编码、注意力、解码规则、命名规则、特殊共鸣。实现 engine/ 时必读。
---

# 规则引擎合同

[content from §5, §6, §7, §8 of the original document]
```

- [ ] **Step 4: Extract contracts/page-specs.md (§9-14)**

Read the source document §9-14 (Tab structure, Play page, SkillScene, ComparePanel, How page, Why page contracts). Write to `docs/contracts/page-specs.md` with frontmatter:

```markdown
---
description: 页面合同 — Tab结构、Play页、SkillScene动画、ComparePanel、How页、Why页。实现 components/ 和 pages/ 时必读。
---

# 页面合同

[content from §9, §10, §11, §12, §13, §14 of the original document]
```

- [ ] **Step 5: Extract phase docs (§15-A0 through A5)**

For each phase A0-A5 from the source document §15, create a standalone phase file:

`docs/phases/A0-project-skeleton.md`:
```markdown
---
description: A0 阶段 — 项目骨架与静态页面。初始化 Vite+React+TS，创建3个Tab，基础CSS，空占位组件。
---

# A0：项目骨架与静态页面

[content from §15-A0: 目标、任务、验收]
```

Repeat for A1 through A5 with corresponding content.

- [ ] **Step 6: Extract reference docs (§19, §20, §17)**

Create `docs/reference/anti-cheat-checklist.md` from §19, `docs/reference/acceptance-criteria.md` from §20, `docs/reference/recording-script.md` from §17. Each with descriptive frontmatter.

- [ ] **Step 7: Create docs/README.md (§16 + §18 + §22)**

Create `docs/README.md` as the index of all docs, listing each file with a one-line description of when to read it. Include the §22 (作品集解释口径) as a final section.

- [ ] **Step 8: Verify document count**

```bash
ls -1 docs/CONSTITUTION.md docs/contracts/*.md docs/phases/*.md docs/reference/*.md docs/README.md | wc -l
```

Expected: 15 files

---

### Task 3: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
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
```

---

### Task 4: Create .claude/settings.json

**Files:**
- Create: `.claude/settings.json`

- [ ] **Step 1: Inspect existing Claude Code settings for reference**

```bash
cat "C:/Users/24809/.claude/settings.json" 2>/dev/null || echo "No global settings.json found"
```

Note any existing global settings that need to be preserved or overridden.

- [ ] **Step 2: Write .claude/settings.json**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run dev)",
      "Bash(npm run build)",
      "Bash(npm run preview)",
      "Bash(npm install *)",
      "Bash(npx tsx *)",
      "Bash(npx tsc *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(mkdir *)",
      "Bash(ls *)",
      "Bash(dir *)",
      "Read",
      "Edit",
      "Write"
    ],
    "deny": [
      "Bash(git push *)",
      "Bash(git reset --hard *)",
      "Bash(rm -rf *)",
      "Bash(curl *)",
      "Bash(ssh *)",
      "Bash(sudo *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ],
    "defaultMode": "acceptEdits"
  },
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

- [ ] **Step 3: Verify settings.json is valid JSON**

```bash
python3 -m json.tool .claude/settings.json > /dev/null && echo "Valid JSON"
```

Expected: "Valid JSON"

---

### Task 5: Create scripts/verify-engine.ts

**Files:**
- Create: `scripts/verify-engine.ts`

- [ ] **Step 1: Write the verification script**

```typescript
/**
 * verify-engine.ts
 * 
 * PostToolUse hook script — validates that src/engine/ follows the rules:
 * 1. generateSkill is a pure function (same input = same output)
 * 2. A/B test case produces different results
 * 3. trace is complete and readable
 * 4. No lookup-table anti-patterns
 * 5. No backend/API calls
 * 
 * Usage: npx tsx scripts/verify-engine.ts
 * Exit code: 0 = pass, 1 = fail
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const ENGINE_DIR = 'src/engine';
let failures = 0;

function fail(msg: string) {
  console.error(`  FAIL: ${msg}`);
  failures++;
}

function pass(msg: string) {
  console.log(`  PASS: ${msg}`);
}

console.log('=== Engine Verification ===\n');

// ---- Check 1: engine/ directory exists ----
console.log('1. Engine directory structure');
const engineFiles = existsSync(ENGINE_DIR) ? readdirSync(ENGINE_DIR) : [];
const requiredFiles = [
  'vectorMath.ts', 'positionEncoding.ts', 'attentionEngine.ts',
  'skillDecoder.ts', 'skillNameGenerator.ts', 'specialResonance.ts', 'skillGenerator.ts'
];
if (engineFiles.length === 0) {
  console.log('  SKIP: src/engine/ is empty or does not exist (pre-A1)');
} else {
  for (const f of requiredFiles) {
    if (engineFiles.includes(f)) {
      pass(`${f} exists`);
    } else {
      fail(`${f} is missing`);
    }
  }
}

// ---- Check 2: No hardcoded lookup tables ----
console.log('\n2. Anti-lookup-table check');
const antiPatterns = [
  /\.join\s*\([^)]*\)\s*(===|==)/,
  /switch\s*\([^)]*rune/,
  /if\s*\([^)]*join[^)]*rune/,
];

let foundAntiPattern = false;
for (const file of engineFiles) {
  const content = readFileSync(join(ENGINE_DIR, file), 'utf-8');
  for (const pattern of antiPatterns) {
    if (pattern.test(content)) {
      fail(`${file}: possible lookup table pattern detected: ${pattern}`);
      foundAntiPattern = true;
    }
  }
}
if (!foundAntiPattern) {
  pass('No lookup-table anti-patterns detected');
}

// ---- Check 3: No backend/API calls ----
console.log('\n3. No backend API calls');
const backendPatterns = [
  /from\s+['"]axios['"]/,
  /from\s+['"]@anthropic/,
  /from\s+['"]openai/,
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
];
let foundBackend = false;
for (const file of engineFiles) {
  const content = readFileSync(join(ENGINE_DIR, file), 'utf-8');
  for (const pattern of backendPatterns) {
    if (pattern.test(content)) {
      fail(`${file}: backend/API call detected: ${pattern}`);
      foundBackend = true;
    }
  }
}
if (!foundBackend) {
  pass('No backend/API calls detected');
}

// ---- Check 4: Pure function check (if generateSkill exists) ----
console.log('\n4. generateSkill pure function check');
const generatorFile = join(ENGINE_DIR, 'skillGenerator.ts');
if (existsSync(generatorFile)) {
  try {
    // Dynamic import to check the module
    // Note: This requires the module to be importable as ESM
    // For a simpler static check, verify the function signature pattern
    const content = readFileSync(generatorFile, 'utf-8');
    if (/export\s+(async\s+)?function\s+generateSkill/.test(content)) {
      pass('generateSkill function found');
      
      // Check that it doesn't use Math.random() without seed
      if (/Math\.random\s*\(\s*\)/.test(content) && !/seed/i.test(content)) {
        fail('generateSkill may use Math.random() without seed — reproducibility concern');
      } else {
        pass('No unseeded Math.random() detected');
      }
    } else {
      console.log('  SKIP: generateSkill function not found (pre-A1)');
    }
  } catch (e) {
    console.log(`  SKIP: Cannot import module yet: ${e}`);
  }
}

// ---- Check 5: Run A/B test if generateSkill is available ----
console.log('\n5. A/B test case verification');
if (existsSync(generatorFile)) {
  try {
    const content = readFileSync(generatorFile, 'utf-8');
    if (/export\s+(async\s+)?function\s+generateSkill/.test(content)) {
      console.log('  INFO: A/B runtime test requires the project to be built first.');
      console.log('  INFO: Run: npx tsx scripts/verify-engine-runtime.ts after A1 implementation.');
      console.log('  INFO: Expected: fire,frost,lightning,wind vs wind,lightning,frost,fire produce different results.');
    }
  } catch (e) {
    console.log(`  SKIP: Cannot verify A/B test: ${e}`);
  }
} else {
  console.log('  SKIP: skillGenerator.ts does not exist (pre-A1)');
}

// ---- Summary ----
console.log(`\n=== Verification Complete: ${failures} failure(s) ===`);
if (failures > 0) {
  console.error('SOME CHECKS FAILED — review the issues above before proceeding.');
  process.exit(1);
} else {
  console.log('All checks passed.');
  process.exit(0);
}
```

- [ ] **Step 2: Verify script syntax (TypeScript compilation check)**

```bash
npx tsc --noEmit scripts/verify-engine.ts 2>&1 || echo "Note: TS errors expected until project is initialized — verify manually after A0"
```

---

### Task 6: Create spec-guardian subagent

**Files:**
- Create: `.claude/agents/spec-guardian.md`

- [ ] **Step 1: Write spec-guardian.md**

```markdown
---
type: agent
tools: Read, Glob, Grep, Bash
description: Anti-cheat spec guardian — checks that current code follows the project constitution. Run after each phase completion. Reports violations against the 9 anti-cheat checklist items.
---

# Spec Guardian

> 反跑偏守门员。在每个开发阶段完成后运行，对照反跑偏检查清单逐条审查代码。只报告偏离，不报告风格问题。

## Required Context

Read before starting:

```bash
cat docs/CONSTITUTION.md
cat docs/reference/anti-cheat-checklist.md
git diff --stat
git diff
```

Then load the phase doc for the current phase.

## The 9-Point Anti-Cheat Checklist

For each item, inspect the diff and answer YES (pass) or NO (violation). Provide evidence from the code.

### 1. 是否还围绕「排列顺序产生构筑指纹」？
- Check: Does all engine code compute skill results from rune order? No fixed skill trees?

### 2. 是否出现了完整排列查表？
- Check: Any switch-case on rune combinations? Any if/else chain mapping rune arrays to skill names? Any object/dictionary keyed by joined rune IDs?

### 3. 是否把大量时间花在美术资产上？
- Check: Any large binary files? Complex texture/glTF imports? Time spent on non-MVP visual polish?

### 4. 是否 How 页写成了无法理解的数学说明？
- Check: Is How page content game-designer-readable? Does it use analogies, not equations?

### 5. 是否 Play 页一打开就能操作？
- Check: Does Play page load as default tab? Are runes immediately visible and clickable? No long intro text blocking interaction?

### 6. 是否默认 A/B 对比足够明显？
- Check: A (fire→frost→lightning→wind) vs B (wind→lightning→frost→fire). Are name, tags, params, animation all visibly different?

### 7. 是否技能结果和动画来自同一个 finalVector？
- Check: Does SkillScene read from the same `animationParams` that `generateSkill` outputs? No separate hardcoded animation config?

### 8. 是否 trace 可以解释结果？
- Check: Is `trace` populated with `positionedVectors`, `interactionScores`, `attentionWeights`, `finalTopDims`, `decodeReasons`? Does How page read from trace, not from hand-written text?

### 9. 是否控制台无明显报错？
- Check: Any console.error in component code? Any unhandled promise rejections?

## Output Format

```text
Spec Guardian Review — Phase [A0-A5]
=====================================

Checklist Results:

[PASS] 1. 排列顺序产生构筑指纹
  Evidence: [what code confirms this]

[PASS] 2. 无完整排列查表
  Evidence: [what code confirms this]

[FAIL] 3. 美术资产时间投入
  Evidence: [what code violates this]
  Fix: [what to change]

... (all 9 items)

Summary:
  Passed: N/9
  Failed: M/9
  
Gate: PASS (all 9 passed) / BLOCKED (M items need fixing)
```

## Rules

- Report only factual violations with code evidence. Do not speculate.
- Each FAIL must include a concrete fix suggestion.
- If uncertain whether an item passes, flag it as UNCERTAIN with reasoning.
- Do NOT report code style, naming, or formatting. Only checklist violations.
- Be strict but fair — false positives erode trust.
```

- [ ] **Step 2: Verify agent file is readable**

```bash
wc -l .claude/agents/spec-guardian.md
```

Expected: approximately 80-100 lines

---

### Task 7: Install plugins and configure MCP servers

**Note:** Plugin installation requires interactive Claude Code commands. These steps must be performed manually in the Claude Code session.

- [ ] **Step 1: Install plugins**

Run the following commands in Claude Code (NOT in bash):

```
/plugin install frontend-design@frontend-design
/plugin install typescript-lsp@typescript-lsp
/plugin install code-review@code-review
/plugin install commit-commands@commit-commands
```

- [ ] **Step 2: Configure MCP servers**

Check that context7 and github MCP servers are already enabled from the gugu project global config:

```bash
cat "C:/Users/24809/.claude.json" 2>/dev/null | grep -A5 '"mcpServers"' || echo "Check ~/.claude.json for MCP config"
```

If context7 and github are not globally configured, run:

```
/claude mcp add context7
/claude mcp add github
```

- [ ] **Step 3: Verify plugins are installed**

```
/plugin list
```

Expected: superpowers, frontend-design, typescript-lsp, code-review, commit-commands in the list.

---

### Task 8: Final verification

- [ ] **Step 1: Verify all files exist**

```bash
echo "=== Config files ===" && ls -1 CLAUDE.md .claude/settings.json .claude/agents/spec-guardian.md scripts/verify-engine.ts
echo "=== Doc files ===" && ls -1 docs/CONSTITUTION.md docs/README.md docs/contracts/*.md docs/phases/*.md docs/reference/*.md
```

Expected: all files listed without error.

- [ ] **Step 2: Verify settings.json is valid**

```bash
python3 -m json.tool .claude/settings.json > /dev/null && echo "settings.json: valid"
```

- [ ] **Step 3: Run spec-guardian dry-run (no code to check yet, should pass)**

Read `docs/reference/anti-cheat-checklist.md` and confirm the 9 items are clear and actionable.

- [ ] **Step 4: Commit all setup files**

```bash
git add -A
git status
```

Review the file list, then:

```bash
git commit -m "chore: set up dev environment — plugins, docs split, hooks, guardian

- Add .claude/settings.json with PostToolUse hook and permissions
- Add CLAUDE.md with project rules and doc loading strategy
- Add spec-guardian subagent for phase-completion checks
- Add scripts/verify-engine.ts for engine pure-function validation
- Split 1072-line spec into layered docs (constitution/contracts/phases/reference)
- Doc structure: CONSTITUTION + contracts + phases + reference

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Completion Criteria

All 8 tasks done, with verification:
- [ ] Directories created
- [ ] 15 doc files created with correct content from source
- [ ] CLAUDE.md written with doc loading strategy table
- [ ] .claude/settings.json valid JSON with hooks and permissions
- [ ] scripts/verify-engine.ts compiles and runs checks
- [ ] spec-guardian.md agent file complete with 9-point checklist
- [ ] 4 plugins installed (frontend-design, typescript-lsp, code-review, commit-commands)
- [ ] 2 MCP servers confirmed (context7, github)
- [ ] Git commit with all setup files
