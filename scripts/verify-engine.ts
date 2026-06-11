/**
 * verify-engine.ts
 *
 * PostToolUse hook script — validates that src/engine/ follows the rules:
 *   1. Engine directory contains all required files.
 *   2. No lookup-table anti-patterns (joined strings as keys, rune switch stmts).
 *   3. No backend/API calls (axios, fetch, openai, etc.).
 *   4. generateSkill is a pure function (exported, seeded Math.random if used).
 *   5. A/B test info banner.
 *
 * Usage: npx tsx scripts/verify-engine.ts
 * Exit code: 0 = pass, 1 = fail (output is human-readable either way).
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENGINE_DIR = join(__dirname, "..", "src", "engine");

const REQUIRED_FILES = [
  "vectorMath.ts",
  "positionEncoding.ts",
  "attentionEngine.ts",
  "skillDecoder.ts",
  "skillNameGenerator.ts",
  "specialResonance.ts",
  "skillGenerator.ts",
];

const BACKEND_PATTERNS = [
  "axios",
  "@anthropic",
  "openai",
  "fetch(",
  "XMLHttpRequest",
];

function println(label: string, msg: string): void {
  // Pad label to 8 chars for alignment
  const padded = label.padEnd(8);
  console.log(`  ${padded}${msg}`);
}

function getEngineFiles(): string[] {
  if (!existsSync(ENGINE_DIR)) return [];
  return readdirSync(ENGINE_DIR).filter((f) => f.endsWith(".ts"));
}

// ---------------------------------------------------------------------------
// 1. Engine directory structure
// ---------------------------------------------------------------------------

function checkEngineStructure(): number {
  console.log("\n1. Engine directory structure");

  const files = getEngineFiles();

  if (files.length === 0) {
    println("SKIP", "src/engine/ is empty or does not exist (pre-A1 stage)");
    return 0;
  }

  const fileSet = new Set(files);
  let failures = 0;

  for (const f of REQUIRED_FILES) {
    if (fileSet.has(f)) {
      println("PASS", `${f} exists`);
    } else {
      println("FAIL", `${f} is missing`);
      failures++;
    }
  }

  return failures;
}

// ---------------------------------------------------------------------------
// 2. Anti-lookup-table patterns
// ---------------------------------------------------------------------------

function checkAntiLookup(): number {
  console.log("\n2. Anti-lookup-table check");

  const files = getEngineFiles();
  if (files.length === 0) {
    println("SKIP", "src/engine/ is empty or does not exist (pre-A1 stage)");
    return 0;
  }

  let totalViolations = 0;

  for (const f of files) {
    const content = readFileSync(join(ENGINE_DIR, f), "utf-8");
    const lines = content.split("\n");
    let lineViolations = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern 1: .join(...) followed by === or == (string-keyed lookup)
      if (/\.join\s*\(/.test(line) && /===[^=]|==[^=]/.test(line)) {
        println("FAIL", `${f}:${i + 1} .join() followed by comparison — possible string-keyed lookup`);
        lineViolations++;
      }

      // Pattern 2: switch on rune-related expressions
      if (
        /switch\s*\(/.test(line) &&
        (/\brune/i.test(line) || /\belement/i.test(line) || /\bskill/i.test(line))
      ) {
        println("FAIL", `${f}:${i + 1} switch on rune/skill expression — should use pure functions`);
        lineViolations++;
      }

      // Pattern 3: if conditions using joined rune strings
      if (
        /if\s*\(/.test(line) &&
        /\.join\s*\(/.test(line) &&
        (/\brune/i.test(line) || /\belement/i.test(line))
      ) {
        println("FAIL", `${f}:${i + 1} if condition with joined rune string — potential lookup bypass`);
        lineViolations++;
      }
    }

    totalViolations += lineViolations;
  }

  if (totalViolations === 0) {
    println("PASS", "No lookup-table anti-patterns detected");
  }

  return totalViolations;
}

// ---------------------------------------------------------------------------
// 3. No backend/API calls
// ---------------------------------------------------------------------------

function checkBackendCalls(): number {
  console.log("\n3. No backend API calls");

  const files = getEngineFiles();
  if (files.length === 0) {
    println("SKIP", "src/engine/ is empty or does not exist (pre-A1 stage)");
    return 0;
  }

  let totalViolations = 0;

  for (const f of files) {
    const content = readFileSync(join(ENGINE_DIR, f), "utf-8");
    const lines = content.split("\n");

    for (const pattern of BACKEND_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        // Skip comments
        const trimmed = lines[i].trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

        if (trimmed.includes(pattern)) {
          println("FAIL", `${f}:${i + 1} contains "${pattern}" — backend/API call not allowed in engine`);
          totalViolations++;
        }
      }
    }
  }

  if (totalViolations === 0) {
    println("PASS", "No backend/API calls detected");
  }

  return totalViolations;
}

// ---------------------------------------------------------------------------
// 4. Pure function check for generateSkill
// ---------------------------------------------------------------------------

function checkPureFunction(): number {
  console.log("\n4. generateSkill pure function check");

  const skillGenPath = join(ENGINE_DIR, "skillGenerator.ts");

  if (!existsSync(skillGenPath)) {
    println("SKIP", "skillGenerator.ts does not exist (pre-A1 stage)");
    return 0;
  }

  const content = readFileSync(skillGenPath, "utf-8");
  let failures = 0;

  // Check generateSkill is exported
  const hasExport =
    /export\s+(function\s+generateSkill|const\s+generateSkill|async\s+function\s+generateSkill)/.test(content);
  if (hasExport) {
    println("PASS", "generateSkill function found (exported)");
  } else {
    println("FAIL", "generateSkill function is not exported from skillGenerator.ts");
    failures++;
  }

  // Check for Math.random() usage
  const mathRandomMatches = content.match(/Math\.random\s*\(/g);
  if (!mathRandomMatches) {
    println("PASS", "No Math.random() usage detected");
    return failures;
  }

  // Math.random() is used — check for seed parameter
  const hasSeedParam =
    /function\s+generateSkill\s*\([^)]*\bseed\b[^)]*\)/.test(content) ||
    /generateSkill\s*[:=]\s*\([^)]*\bseed\b[^)]*\)/.test(content);

  if (hasSeedParam) {
    println("PASS", "Math.random() is seeded via seed parameter");
  } else {
    println("FAIL", `Math.random() used (${mathRandomMatches.length} occurrence(s)) but no seed parameter found on generateSkill`);
    failures++;
  }

  return failures;
}

// ---------------------------------------------------------------------------
// 5. A/B runtime test — actually runs generateSkill()
// ---------------------------------------------------------------------------

async function runABTest(): Promise<number> {
  console.log("\n5. A/B runtime verification");

  const skillGenPath = join(ENGINE_DIR, "skillGenerator.ts");
  if (!existsSync(skillGenPath)) {
    println("SKIP", "skillGenerator.ts not found — cannot run A/B test");
    return 0;
  }

  try {
    // Use file:// URL for Windows ESM compatibility
    const importPath =
      "file://" + join(__dirname, "..", "src", "engine", "skillGenerator.ts");
    const { generateSkill } = await import(importPath);

    const SEED = "verify-a1";
    const resultA = generateSkill({
      runeIds: ["fire", "frost", "lightning", "wind"],
      seed: SEED + "-a",
    });
    const resultB = generateSkill({
      runeIds: ["wind", "lightning", "frost", "fire"],
      seed: SEED + "-b",
    });

    console.log("\n  A: fire → frost → lightning → wind");
    console.log(`    名称: ${resultA.name}`);
    console.log(
      `    标签: ${resultA.tags.slice(0, 6).join(", ") || "(无)"}`,
    );
    console.log(
      `    Top5: ${resultA.topDims
        .map((d) => `${d.dim}=${d.value.toFixed(3)}`)
        .join(", ")}`,
    );

    console.log("\n  B: wind → lightning → frost → fire");
    console.log(`    名称: ${resultB.name}`);
    console.log(
      `    标签: ${resultB.tags.slice(0, 6).join(", ") || "(无)"}`,
    );
    console.log(
      `    Top5: ${resultB.topDims
        .map((d) => `${d.dim}=${d.value.toFixed(3)}`)
        .join(", ")}`,
    );

    let failures = 0;

    // 验收 1: 名称不同
    if (resultA.name !== resultB.name) {
      println("PASS", "技能名称不同");
    } else {
      println("FAIL", `技能名称相同: ${resultA.name}`);
      failures++;
    }

    // 验收 2: 标签至少 2 个不同
    const diffTags =
      resultA.tags.filter((t) => !resultB.tags.includes(t)).length +
      resultB.tags.filter((t) => !resultA.tags.includes(t)).length;
    if (diffTags >= 2) {
      println("PASS", `标签差异 ≥ 2（实际: ${diffTags}）`);
    } else {
      println("FAIL", `标签差异不足（实际: ${diffTags}，需要 ≥ 2）`);
      failures++;
    }

    // 验收 3: Top5 维度至少有 3 项排序不同或数值差异明显
    const dimDiffs = resultA.topDims.filter(
      (d, i) => d.dim !== resultB.topDims[i]?.dim,
    ).length;
    const valueDiffs = resultA.topDims.filter((d, i) => {
      const b = resultB.topDims[i];
      return b && Math.abs(d.value - b.value) > 0.05;
    }).length;
    if (dimDiffs >= 3 || valueDiffs >= 3) {
      println(
        "PASS",
        `Top5 差异足够（排序差异: ${dimDiffs}, 数值差异: ${valueDiffs}）`,
      );
    } else {
      println(
        "FAIL",
        `Top5 差异不足（排序差异: ${dimDiffs}, 数值差异: ${valueDiffs}）`,
      );
      failures++;
    }

    // 验收 4: 关键参数差异 ≥ 2（阈值 3 反映 0-100 尺度上的实质差异）
    const paramDiff = ["rangePower", "controlPower", "burstPower"].filter((k) => {
      const key = k as keyof typeof resultA.params;
      return Math.abs((resultA.params[key] as number) - (resultB.params[key] as number)) > 3;
    }).length;
    if (paramDiff >= 2) {
      println("PASS", `关键参数差异 ≥ 2（实际: ${paramDiff}）`);
    } else {
      println("FAIL", `关键参数差异不足（实际: ${paramDiff}，需要 ≥ 2）`);
      failures++;
    }

    // 验收 5: trace 可读
    if (
      resultA.trace.positionedVectors.length === 4 &&
      resultA.trace.interactionScores.length === 4 &&
      resultA.trace.attentionWeights.length === 4 &&
      resultA.trace.decodeReasons.length > 0
    ) {
      println("PASS", "trace 可读");
    } else {
      println("FAIL", "trace 不完整");
      failures++;
    }

    // 验收 6: 动画参数不同
    if (
      resultA.animationParams.primaryColor !==
      resultB.animationParams.primaryColor
    ) {
      println("PASS", "动画主色调不同");
    } else {
      println("FAIL", "动画主色调相同");
      failures++;
    }

    if (resultA.resonance) {
      println("INFO", `A 触发特殊共鸣: ${resultA.resonance.label}`);
    }
    if (resultB.resonance) {
      println("INFO", `B 触发特殊共鸣: ${resultB.resonance.label}`);
    }

    return failures;
  } catch (err) {
    println("FAIL", `A/B runtime test error: ${String(err)}`);
    return 1;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== Engine Verification ===");

  const staticFailures =
    checkEngineStructure() +
    checkAntiLookup() +
    checkBackendCalls() +
    checkPureFunction();

  const abFailures = await runABTest();

  const failures = staticFailures + abFailures;

  console.log(`\n=== Verification Complete: ${failures} failure(s) ===`);
  console.log(failures === 0 ? "All checks passed." : "Some checks failed.");

  process.exit(failures === 0 ? 0 : 1);
}

main();
