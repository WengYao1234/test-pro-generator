#!/usr/bin/env node
// Cross-platform artifact quality gate (Node, UTF-8 native).
// Mirrors scripts/validate-artifacts.ps1 so the gate runs identically on Windows / macOS / Linux.
// Usage: node scripts/validate-artifacts.mjs <RUN_DIR>

import fs from "node:fs";
import path from "node:path";

const runDir = process.env.RUN_DIR || process.argv[2];
if (!runDir) {
  console.error("Usage: node scripts/validate-artifacts.mjs <RUN_DIR>");
  process.exit(2);
}

// Required structural anchors per artifact (single source of truth shared with the PowerShell validator).
const checks = [
  { file: "_parsed-content.md", required: ["# ", "## ", "["] },
  {
    file: "_extraction.md",
    required: ["# ", "> ", "1.1", "1.2", "1.3", "1.4", "1.5", "2.1", "2.2", "2.3", "2.4"],
  },
  {
    file: "_clarifications.md",
    required: ["# ", "## ", "| # |", "|---", "文档成熟度", "阻塞", "影响覆盖", "优化建议"],
  },
  {
    file: "_review.md",
    required: ["# ", "## ", "| # |", "|---", "需求类型", "流程合理性", "量化", "隐性需求", "发言稿"],
  },
];

// Only "clearly unfilled" template placeholders. Intentionally NOT flagged: bare TODO (the
// exploration-budget "unexplored list" must mark TODO), Markdown links [text](url), ellipsis,
// and brackets used as real content (page-flow [登录页], doc tags [背景说明]).
const placeholderPatterns = [
  /\[N\]/,
  /\[URL\]/,
  // Instruction-style: bracket containing template punctuation (fullwidth colon/comma or slash).
  /\[[^\]\r\n]*[：:/，][^\]\r\n]*\]/,
  // No-punctuation CJK placeholders (exact match; avoids false hits on real content).
  /\[位置\]/, /\[具体位置\]/, /\[具体问题\]/, /\[原型位置\]/,
  /\[描述\]/, /\[摘要\]/, /\[路径\]/, /\[时间\]/, /\[当前时间\]/,
  /\[探索时间\]/, /\[文件名\]/, /\[项目名\]/, /\[角色名\]/, /\[页面名\]/,
];

// Leaked patch markers must never appear in artifacts (e.g. a botched multi-file write).
const markerPatterns = [/\*\*\*\s+(Add|Update|Delete)\s+File:/, /\*\*\*\s+(Begin|End)\s+Patch/];

function fail(message) {
  console.error(`Artifact validation FAILED: ${message}`);
  process.exit(1);
}

const resolvedRunDir = path.resolve(runDir);

for (const check of checks) {
  const filePath = path.join(resolvedRunDir, check.file);
  if (!fs.existsSync(filePath)) fail(`Missing artifact: ${filePath}`);

  const content = fs.readFileSync(filePath, "utf8");
  if (!content.trim()) fail(`Empty artifact: ${filePath}`);

  for (const marker of check.required) {
    if (!content.includes(marker)) fail(`${check.file} missing required marker: ${marker}`);
  }
  for (const pattern of placeholderPatterns) {
    if (pattern.test(content)) fail(`${check.file} contains unresolved placeholder: ${pattern}`);
  }
  for (const pattern of markerPatterns) {
    if (pattern.test(content)) fail(`${check.file} contains stray patch marker: ${pattern}`);
  }
}

console.log(`Artifact validation passed: ${resolvedRunDir}`);
