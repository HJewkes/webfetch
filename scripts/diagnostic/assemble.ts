#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = process.argv[2];
if (!VERSION) {
  console.error('Usage: npx tsx scripts/diagnostic/assemble.ts <version>');
  process.exit(1);
}

const PROJECT_DIR = join(import.meta.dirname, '..', '..');
const RESULTS_DIR = join(PROJECT_DIR, 'docs', 'diagnostic', VERSION);

// --- Types ---

interface SmokeResult {
  id: string;
  url: string;
  description: string;
  status: 'pass' | 'fail';
  errors: string;
  duration_ms: number;
  exit_code: number;
}

interface TestBenchResult {
  id: string;
  version: string;
  tool_used: string;
  commands_run: string[];
  flags_used: string[];
  files_written: string[];
  workflow: string;
  tool_calls_total: number;
  webfetch_calls: number;
  read_calls: number;
  other_calls: number;
  answer_provided: boolean;
  notes: string;
}

interface JudgeScores {
  tool_selection: number;
  flag_correctness: number;
  workflow_adherence: number;
  efficiency: number;
  answer_quality: number;
}

interface JudgeViolation {
  dimension: string;
  description: string;
}

interface JudgeResult {
  scores: JudgeScores;
  violations: JudgeViolation[];
  strengths: string[];
  summary: string;
}

// --- Helpers ---

function extractJson(raw: string): unknown {
  // Handle claude -p output format: may be wrapped in {result: "..."} or raw JSON
  try {
    const outer = JSON.parse(raw);
    if (outer.result) {
      let inner = outer.result;
      // Strip markdown code fences
      inner = inner.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      // Find JSON object
      const start = inner.indexOf('{');
      const end = inner.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(inner.slice(start, end + 1));
      }
    }
    return outer;
  } catch {
    // Try direct parse
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error(`Could not parse JSON from: ${raw.slice(0, 100)}...`);
  }
}

function loadJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf-8');
  return extractJson(raw) as T;
}

function loadJsonArray<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf-8')) as T[];
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function delta(current: number, previous: number | null): string {
  if (previous === null) return '—';
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return 'flat';
  return diff > 0 ? `**+${fmt(diff)}**` : `${fmt(diff)}`;
}

// --- Load Results ---

// Phase 1: Smoke
const smokeResults = loadJsonArray<SmokeResult>(join(RESULTS_DIR, 'smoke-results.json'));

// Phase 2: Test bench
const testBenchDir = join(RESULTS_DIR, 'test-bench');
const testResults: TestBenchResult[] = [];
for (let i = 1; i <= 16; i++) {
  const id = `D-${String(i).padStart(2, '0')}`;
  const result = loadJsonFile<TestBenchResult>(join(testBenchDir, `${id}.json`));
  if (result) testResults.push(result);
}

// Phase 3: Judge
const judgeResults: Map<string, JudgeResult> = new Map();
for (let i = 1; i <= 16; i++) {
  const id = `D-${String(i).padStart(2, '0')}`;
  const result = loadJsonFile<JudgeResult>(join(testBenchDir, `${id}-judge.json`));
  if (result) judgeResults.set(id, result);
}

// Previous version (for deltas)
const prevVersion = VERSION.replace(/v(\d+)/, (_, n) => `v${Number(n) - 1}`);
const prevDir = join(PROJECT_DIR, 'docs', 'diagnostic', prevVersion);
let prevMetrics: Record<string, number> | null = null;
if (existsSync(join(prevDir, 'metrics.json'))) {
  prevMetrics = JSON.parse(readFileSync(join(prevDir, 'metrics.json'), 'utf-8'));
}

// --- Compute Metrics ---

// Smoke
const smokePass = smokeResults.filter((r) => r.status === 'pass').length;
const smokeTotal = smokeResults.length;

// Test bench aggregates
const totalCalls = testResults.reduce((s, r) => s + r.tool_calls_total, 0);
const totalWebfetchCalls = testResults.reduce((s, r) => s + r.webfetch_calls, 0);
const webfetchAdoption =
  testResults.length > 0
    ? (testResults.filter((r) => r.tool_used === 'webfetch').length / testResults.length) * 100
    : 0;
const avgCalls = avg(testResults.map((r) => r.tool_calls_total));
const answersProvided = testResults.filter((r) => r.answer_provided).length;

// Judge aggregates
const judgeArray = Array.from(judgeResults.values());
const dimensions: (keyof JudgeScores)[] = [
  'tool_selection',
  'flag_correctness',
  'workflow_adherence',
  'efficiency',
  'answer_quality',
];
const dimAvgs: Record<string, number> = {};
for (const dim of dimensions) {
  dimAvgs[dim] = avg(judgeArray.map((j) => j.scores[dim]));
}
const overallAvg = avg(judgeArray.map((j) => avg(dimensions.map((d) => j.scores[d]))));
const perfectCount = judgeArray.filter((j) => dimensions.every((d) => j.scores[d] === 5)).length;
const allViolations = judgeArray.flatMap((j) => j.violations);

// Save metrics for next version delta comparison
const currentMetrics: Record<string, number> = {
  smoke_pass: smokePass,
  smoke_total: smokeTotal,
  webfetch_adoption: webfetchAdoption,
  avg_calls: avgCalls,
  overall_judge: overallAvg,
  prompts_run: testResults.length,
  perfect_count: perfectCount,
  ...Object.fromEntries(dimensions.map((d) => [`judge_${d}`, dimAvgs[d]])),
};
writeFileSync(join(RESULTS_DIR, 'metrics.json'), JSON.stringify(currentMetrics, null, 2));

// --- Generate Scorecard ---

const prev = (key: string) => prevMetrics?.[key] ?? null;

let md = `# Webfetch Diagnostic Scorecard — ${VERSION}\n\n`;
md += `Date: ${new Date().toISOString().slice(0, 10)}\n`;
md += `Agent model: claude-sonnet-4-6\n`;
md += `Prompts run: ${testResults.length}/16\n`;
md += `Previous version: ${prevMetrics ? prevVersion : 'none'}\n\n`;

// Headline metrics
md += `## Headline Metrics\n\n`;
md += `| Metric | Current | Previous | Delta |\n`;
md += `|--------|---------|----------|-------|\n`;
md += `| Smoke tests passed | ${smokePass}/${smokeTotal} | ${prev('smoke_pass') !== null ? `${prev('smoke_pass')}/${prev('smoke_total')}` : '—'} | ${delta(smokePass, prev('smoke_pass'))} |\n`;
md += `| Webfetch adoption rate | ${fmt(webfetchAdoption)}% | ${prev('webfetch_adoption') !== null ? `${fmt(prev('webfetch_adoption')!)}%` : '—'} | ${delta(webfetchAdoption, prev('webfetch_adoption'))} |\n`;
md += `| Avg tool calls/prompt | ${fmt(avgCalls)} | ${prev('avg_calls') !== null ? fmt(prev('avg_calls')!) : '—'} | ${delta(avgCalls, prev('avg_calls'))} |\n`;
md += `| Avg judge score (overall) | ${fmt(overallAvg)}/5 | ${prev('overall_judge') !== null ? `${fmt(prev('overall_judge')!)}/5` : '—'} | ${delta(overallAvg, prev('overall_judge'))} |\n`;
md += `| Prompts at 5/5 overall | ${perfectCount}/${testResults.length} | ${prev('perfect_count') !== null ? `${prev('perfect_count')}/${prev('prompts_run')}` : '—'} | ${delta(perfectCount, prev('perfect_count'))} |\n`;
md += `| Answers provided | ${answersProvided}/${testResults.length} | — | — |\n\n`;

// Judge scores by dimension
md += `## Judge Scores by Dimension\n\n`;
md += `| Dimension | Current | Previous | Delta |\n`;
md += `|-----------|---------|----------|-------|\n`;
for (const dim of dimensions) {
  const key = `judge_${dim}`;
  md += `| ${dim} | ${fmt(dimAvgs[dim])}/5 | ${prev(key) !== null ? `${fmt(prev(key)!)}/5` : '—'} | ${delta(dimAvgs[dim], prev(key))} |\n`;
}
md += '\n';

// Per-prompt breakdown
md += `## Per-Prompt Breakdown\n\n`;
md += `| Prompt | Calls | Tool | Flags | Workflow | Judge (O) | Violations |\n`;
md += `|--------|-------|------|-------|----------|-----------|------------|\n`;
for (const t of testResults) {
  const judge = judgeResults.get(t.id);
  const judgeOverall = judge ? fmt(avg(dimensions.map((d) => judge.scores[d]))) : '—';
  const violations = judge ? judge.violations.length : 0;
  md += `| ${t.id} | ${t.tool_calls_total} | ${t.tool_used} | ${t.flags_used.join(', ') || '—'} | ${t.workflow} | ${judgeOverall}/5 | ${violations} |\n`;
}
md += '\n';

// Violation categories
if (allViolations.length > 0) {
  md += `## Violation Categories\n\n`;
  md += `| Dimension | Count | % of Total |\n`;
  md += `|-----------|-------|------------|\n`;
  const byDim: Record<string, number> = {};
  for (const v of allViolations) {
    byDim[v.dimension] = (byDim[v.dimension] ?? 0) + 1;
  }
  for (const [dim, count] of Object.entries(byDim).sort((a, b) => b[1] - a[1])) {
    md += `| ${dim} | ${count} | ${fmt((count / allViolations.length) * 100)}% |\n`;
  }
  md += `\nTotal violations across all prompts: ${allViolations.length}\n\n`;
}

// Smoke test details
if (smokeResults.length > 0) {
  md += `## Smoke Test Details\n\n`;
  md += `| ID | URL | Status | Duration |\n`;
  md += `|----|-----|--------|----------|\n`;
  for (const s of smokeResults) {
    md += `| ${s.id} | ${s.url} | ${s.status} | ${s.duration_ms}ms |\n`;
  }
  md += '\n';
}

writeFileSync(join(RESULTS_DIR, 'scorecard.md'), md);
console.log(`Scorecard written to: ${join(RESULTS_DIR, 'scorecard.md')}`);
console.log(`Metrics saved to: ${join(RESULTS_DIR, 'metrics.json')}`);
