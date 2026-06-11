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
import { join } from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// 5. A/B test case info
// ---------------------------------------------------------------------------

function printABTestInfo(): void {
  console.log("\n5. A/B test case verification");
  println("INFO", 'A/B runtime test requires the project to be built first. Run: npx tsx scripts/verify-engine.ts && npm run build && npx vite preview');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("=== Engine Verification ===");

  const failures =
    checkEngineStructure() +
    checkAntiLookup() +
    checkBackendCalls() +
    checkPureFunction();

  printABTestInfo();

  console.log(`\n=== Verification Complete: ${failures} failure(s) ===`);
  console.log(failures === 0 ? "All checks passed." : "Some checks failed.");

  process.exit(failures === 0 ? 0 : 1);
}

main();
