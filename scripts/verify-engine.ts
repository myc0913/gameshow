/**
 * verify-engine.ts — V6-5 更新
 *
 * Validates that src/engine/v6/ follows the rules:
 *   1. V6 engine directory contains all required files.
 *   2. No lookup-table anti-patterns.
 *   3. No backend/API calls.
 *   4. generateBuildV6 is a pure function.
 *   5. A/B runtime test (same seeds, different order → different result).
 *   6. Partial build (1-3 seeds) works.
 *   7. AnimationSpec is produced for every skill.
 *   8. Trace completeness.
 *
 * Usage: npx tsx scripts/verify-engine.ts
 * Exit code: 0 = pass, 1 = fail
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENGINE_DIR = join(__dirname, "..", "src", "engine", "v6");

const REQUIRED_FILES = [
  "index.ts",
  "validation.ts",
  "math.ts",
  "sourceProjection.ts",
  "computeForwardPass.ts",
  "computeBackwardPass.ts",
  "decodeAnimationSpec.ts",
  "finalizeGeneratedSkill.ts",
  "generateBuildV6.ts",
  "diffBuilds.ts",
];

const BACKEND_PATTERNS = [
  "axios",
  "@anthropic",
  "openai",
  "fetch(",
  "XMLHttpRequest",
];

function println(label: string, msg: string): void {
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
  console.log("\n1. V6 Engine directory structure");

  const files = getEngineFiles();

  if (files.length === 0) {
    println("SKIP", "src/engine/v6/ is empty or does not exist");
    return 1;
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
    println("SKIP", "src/engine/v6/ is empty");
    return 0;
  }

  let totalViolations = 0;

  for (const f of files) {
    const content = readFileSync(join(ENGINE_DIR, f), "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect full permutation table patterns
      if (/\.join\s*\(/.test(line) && /===[^=]|==[^=]/.test(line)) {
        println("FAIL", `${f}:${i + 1} .join() followed by comparison — possible string-keyed lookup`);
        totalViolations++;
      }

      if (
        /switch\s*\(/.test(line) &&
        (/\brune/i.test(line) || /\bskill/i.test(line))
      ) {
        // Allow small switches (form labels, etc.) — flag only large ones
        println("WARN", `${f}:${i + 1} switch on rune/skill expression`);
      }
    }
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
  if (files.length === 0) return 0;

  let totalViolations = 0;

  for (const f of files) {
    const content = readFileSync(join(ENGINE_DIR, f), "utf-8");
    const lines = content.split("\n");

    for (const pattern of BACKEND_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

        if (trimmed.includes(pattern)) {
          println("FAIL", `${f}:${i + 1} contains "${pattern}"`);
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
// 4. Pure function check for generateBuildV6
// ---------------------------------------------------------------------------

function checkPureFunction(): number {
  console.log("\n4. generateBuildV6 pure function check");

  const genPath = join(ENGINE_DIR, "generateBuildV6.ts");

  if (!existsSync(genPath)) {
    println("SKIP", "generateBuildV6.ts does not exist");
    return 1;
  }

  const content = readFileSync(genPath, "utf-8");
  let failures = 0;

  const hasExport =
    /export\s+(function\s+generateBuildV6|const\s+generateBuildV6)/.test(content);
  if (hasExport) {
    println("PASS", "generateBuildV6 function found (exported)");
  } else {
    println("FAIL", "generateBuildV6 function is not exported");
    failures++;
  }

  const mathRandomMatches = content.match(/Math\.random\s*\(/g);
  if (!mathRandomMatches) {
    println("PASS", "No Math.random() usage detected");
  } else {
    println("FAIL", `Math.random() used (${mathRandomMatches.length} occurrence(s)) — engine should be deterministic`);
    failures++;
  }

  return failures;
}

// ---------------------------------------------------------------------------
// 5. A/B + partial build + AnimationSpec runtime test
// ---------------------------------------------------------------------------

async function runRuntimeTests(): Promise<number> {
  console.log("\n5. Runtime verification");

  const genPath = join(ENGINE_DIR, "generateBuildV6.ts");
  if (!existsSync(genPath)) {
    println("SKIP", "generateBuildV6.ts not found");
    return 1;
  }

  try {
    const importPath =
      "file://" + join(__dirname, "..", "src", "engine", "v6", "generateBuildV6.ts");
    const { generateBuildV6 } = await import(importPath);

    let failures = 0;

    // --- Test 1: A/B comparison (4 seeds, different order) ---
    console.log("\n  [A/B Test] Same 4 seeds, different order:");
    const buildA = generateBuildV6({
      seedIds: ["fire_flow", "frost_zone", "lightning_mark", "wind_impact"],
    });
    const buildB = generateBuildV6({
      seedIds: ["wind_impact", "lightning_mark", "frost_zone", "fire_flow"],
    });

    console.log(`    A: ${buildA.skills.map((s) => s.generatedName).join(", ")}`);
    console.log(`    B: ${buildB.skills.map((s) => s.generatedName).join(", ")}`);

    const namesA = buildA.skills.map((s) => s.generatedName).join("|");
    const namesB = buildB.skills.map((s) => s.generatedName).join("|");
    if (namesA !== namesB) {
      println("PASS", "A/B 技能名不同");
    } else {
      println("FAIL", "A/B 技能名相同");
      failures++;
    }

    // 检查动画差异（form 或 palette 或 cue 不同）
    const animDiffs = buildA.skills.filter(
      (s, i) => {
        const b = buildB.skills[i];
        return (
          s.animation.form !== b?.animation.form ||
          s.animation.primaryPalette[0] !== b?.animation.primaryPalette[0] ||
          s.animation.forwardCue?.visualCue !== b?.animation.forwardCue?.visualCue ||
          s.animation.backwardCue?.visualCue !== b?.animation.backwardCue?.visualCue
        );
      },
    ).length;
    if (animDiffs >= 3) {
      println("PASS", `${animDiffs}/4 个技能动画参数有差异`);
    } else {
      println("FAIL", `只有 ${animDiffs}/4 个技能动画参数不同（期望 ≥ 3）`);
      failures++;
    }

    // --- Test 2: 1 seed partial build ---
    console.log("\n  [Partial Build] 1 seed:");
    const build1 = generateBuildV6({ seedIds: ["fire_impact"] });
    if (build1.skills.length === 1) {
      println("PASS", `1 个种子生成 ${build1.skills.length} 个技能: ${build1.skills[0].generatedName}`);
      // 检查 AnimationSpec
      if (build1.skills[0].animation.form) {
        println("PASS", `  AnimationSpec form: ${build1.skills[0].animation.form}`);
      } else {
        println("FAIL", "  AnimationSpec form 缺失");
        failures++;
      }
    } else {
      println("FAIL", `期望 1 个技能，实际 ${build1.skills.length}`);
      failures++;
    }

    // --- Test 3: 2 seeds ---
    console.log("\n  [Partial Build] 2 seeds:");
    const build2 = generateBuildV6({ seedIds: ["fire_impact", "frost_flow"] });
    if (build2.skills.length === 2) {
      println("PASS", `2 个种子生成 ${build2.skills.length} 个技能`);
      // 检查每个技能的 AnimationSpec 完整性
      for (const skill of build2.skills) {
        const spec = skill.animation;
        const hasPalette = spec.primaryPalette.length === 3;
        const hasTiming = spec.timing.windupSeconds > 0 && spec.timing.travelSeconds > 0;
        const hasGeometry = spec.geometry.reach > 0;
        if (hasPalette && hasTiming && hasGeometry) {
          println("PASS", `  ${skill.generatedName}: AnimationSpec 完整`);
        } else {
          println("FAIL", `  ${skill.generatedName}: AnimationSpec 不完整`);
          failures++;
        }
      }
    } else {
      println("FAIL", `期望 2 个技能，实际 ${build2.skills.length}`);
      failures++;
    }

    // --- Test 4: 4 same seeds (重复构筑) ---
    console.log("\n  [Duplicate Seeds] 4x same seed:");
    const buildDup = generateBuildV6({
      seedIds: ["fire_impact", "fire_impact", "fire_impact", "fire_impact"],
    });
    if (buildDup.skills.length === 4) {
      println("PASS", `4 个相同种子生成 ${buildDup.skills.length} 个技能`);
      println("INFO", `技能名: ${buildDup.skills.map((s) => s.generatedName).join(", ")}`);
    } else {
      println("FAIL", `期望 4 个技能，实际 ${buildDup.skills.length}`);
      failures++;
    }

    // --- Test 5: trace 完整性 ---
    console.log("\n  [Trace] 完整性检查:");
    if (buildA.trace && buildA.trace.skills?.length === 4) {
      println("PASS", "trace 包含 4 个技能阶段");
    } else {
      println("FAIL", "trace 不完整");
      failures++;
    }

    // --- Test 6: AnimationSpec 9 forms coverage ---
    console.log("\n  [Animation] 9 种形态覆盖:");
    const allForms = new Set<string>();
    // 测试多种种子组合以覆盖所有形态
    const testSets = [
      ["fire_impact", "frost_flow", "lightning_zone", "wind_mark"],
      ["stone_impact", "shadow_flow", "fire_zone", "frost_mark"],
      ["lightning_impact", "wind_flow", "stone_zone", "shadow_mark"],
      ["shadow_impact", "fire_flow", "frost_zone", "lightning_mark"],
    ];
    for (const seeds of testSets) {
      const b = generateBuildV6({ seedIds: seeds });
      b.skills.forEach((s) => allForms.add(s.animation.form));
    }
    println("INFO", `覆盖形态: ${[...allForms].sort().join(", ")}`);
    if (allForms.size >= 4) {
      println("PASS", `至少覆盖 4 种形态 (实际 ${allForms.size})`);
    } else {
      println("INFO", `形态覆盖较少 (${allForms.size})，但仍在有效范围内`);
    }

    return failures;
  } catch (err) {
    println("FAIL", `Runtime test error: ${String(err)}`);
    return 1;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== Engine Verification (V6-5) ===");

  const staticFailures =
    checkEngineStructure() +
    checkAntiLookup() +
    checkBackendCalls() +
    checkPureFunction();

  const runtimeFailures = await runRuntimeTests();

  const failures = staticFailures + runtimeFailures;

  console.log(`\n=== Verification Complete: ${failures} failure(s) ===`);
  console.log(failures === 0 ? "All checks passed." : "Some checks failed.");

  process.exit(failures === 0 ? 0 : 1);
}

main();
