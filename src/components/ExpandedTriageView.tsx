import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ExternalLink,
  Lightbulb,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Loader2,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import type { BuildStep, Job } from "@/types/build";
import { cn } from "@/lib/utils";
import { parseDuration, formatDuration, getStatusLabel } from "@/lib/buildStatus";
import {
  multiFailScenarioSteps,
  stuckScenarioSteps,
  verifiedScenarioSteps,
} from "@/data/mockBuildSteps";

type BuildStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "canceled"
  | "complete";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TriageData {
  primaryFailedStep: BuildStep | null;
  primaryFailedJob: Job | null;
  failedSteps: BuildStep[];
  blockedSteps: BuildStep[];
  suggestion: string | null;
}

interface VariantProps {
  data: TriageData;
  allSteps: BuildStep[];
}

export interface ExpandedTriageViewProps {
  steps: BuildStep[];
  variant: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12;
  status?: "pending" | "running" | "passed" | "failed" | "canceled" | "complete";
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function deriveTriageData(steps: BuildStep[]): TriageData {
  const firstFailedIdx = steps.findIndex((s) => s.status === "failed");
  const failedSteps = steps.filter((s) => s.status === "failed");
  const primaryFailedStep = failedSteps[0] ?? null;
  const primaryFailedJob =
    primaryFailedStep?.jobs?.find((j) => j.status === "failed") ?? null;
  const blockedSteps =
    firstFailedIdx >= 0
      ? steps.filter((s, i) => i > firstFailedIdx && s.status === "pending")
      : [];
  const suggestion = getSuggestion(primaryFailedStep, primaryFailedJob);
  return {
    failedSteps,
    primaryFailedStep,
    primaryFailedJob,
    blockedSteps,
    suggestion,
  };
}

// Typed dispatch table — each pattern owns its suggestion (one-liner shown
// in the failure row), its longer AI explanation, and its proposed fix
// (file/diff). Matching is via a predicate, not string contents — so
// changing copy doesn't break the explanation/fix lookup.

type FixPreview = {
  file: string;
  before: string;
  after: string;
};

// Adaptive primary action — declared per pattern, not by the row.
// Drives the visual hierarchy: the primary action gets the "recommended"
// button tier (stronger border + weight). Other actions demote to outlined.
// Filled-black is still reserved for Apply fix only — that's the one
// commitment that changes a file.
type PrimaryAction = "retry" | "preview-fix";

type FailurePattern = {
  id: string;
  matches: (step: BuildStep, exitCode: number | null | undefined) => boolean;
  suggestion: string;
  explanation: string | null;
  fix: FixPreview | null;
  // Confidence sets user expectations — and is the leading signal for whether
  // they should trust Preview fix vs. retry. Surfaced on the AI card.
  confidence: "high" | "loose";
  // Which action is recommended for this pattern. Deterministic code bugs
  // (high confidence + fix) point to Preview fix. Loose matches and patterns
  // without a fix fall back to Retry.
  primaryAction: PrimaryAction;
};

const failurePatterns: FailurePattern[] = [
  {
    id: "commonjs-esm-mismatch",
    matches: (step, exitCode) => {
      const name = step.name.toLowerCase();
      const isTest = step.type === "matrix" || name.includes("test");
      return exitCode === 1 && isTest;
    },
    suggestion:
      "Likely a CommonJS/ESM import mismatch on Node 18. Check require() calls.",
    explanation:
      "Your test suite imports auth using require(), which Node 18 doesn't support natively in this configuration. This worked on Node 16 because of CommonJS interop, but Node 18's stricter ESM handling rejects it.",
    fix: {
      file: "src/auth.js",
      before: "const auth = require('./auth')",
      after: "import auth from './auth.js'",
    },
    confidence: "high",
    primaryAction: "preview-fix",
  },
  {
    id: "eslint-violations",
    matches: (step, exitCode) => {
      const isLint = step.name.toLowerCase().includes("lint");
      return exitCode === 2 && isLint;
    },
    suggestion:
      "ESLint found 12 violations across 3 files. Most are auto-fixable.",
    explanation:
      "ESLint detected 12 errors across src/utils.js, src/auth.js, and src/api.js. The most common is unused-vars (8 errors). Running yarn lint --fix should auto-resolve 9 of 12; the remaining 3 require manual changes.",
    fix: {
      file: "src/utils.js",
      before: "import { unused, used } from './lib'",
      after: "import { used } from './lib'",
    },
    confidence: "high",
    primaryAction: "preview-fix",
  },
  {
    id: "oom-kill",
    matches: (_step, exitCode) => exitCode === 137,
    suggestion:
      "Process killed — likely out of memory. Retry, or increase memory limits.",
    explanation: null,
    fix: null,
    confidence: "loose",
    primaryAction: "retry",
  },
];

function matchFailurePattern(
  step: BuildStep | null,
  job: Job | null
): FailurePattern | null {
  if (!step) return null;
  const exitCode = job?.exitCode ?? step.exitCode;
  return failurePatterns.find((p) => p.matches(step, exitCode)) ?? null;
}

// Backward-compatible API for variants V2–V6 that still consume just the
// suggestion string. New code (V7) uses matchFailurePattern directly to
// access explanation + fix as well.
function getSuggestion(
  step: BuildStep | null,
  job: Job | null
): string | null {
  return matchFailurePattern(step, job)?.suggestion ?? null;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepStatusIcon({
  status,
  size = 14,
  className,
}: {
  status: string;
  size?: number;
  className?: string;
}) {
  switch (status) {
    case "complete":
      return (
        <CheckCircle2
          size={size}
          className={cn("text-green-500 flex-shrink-0", className)}
        />
      );
    case "failed":
      return (
        <AlertCircle
          size={size}
          className={cn("text-red-500 flex-shrink-0", className)}
        />
      );
    case "in-progress":
      return (
        <Loader2
          size={size}
          className={cn("text-amber-500 animate-spin flex-shrink-0", className)}
        />
      );
    default:
      return (
        <Circle
          size={size}
          className={cn("text-zinc-300 flex-shrink-0", className)}
        />
      );
  }
}

// ─── Option 5: Native (Buildkite style) ──────────────────────────────────────
// Designed to feel native to the existing Buildkite product UI.
// Aligned to primitives from PageSkeleton, BuildHeader,
// HeaderBreadcrumbStubs, and BuildActionsComboButton:
//   • Status pips: w-3.5 h-3.5 rounded-full bg-{status}-500 (PageSkeleton)
//   • Body text:   text-sm text-zinc-600 (PageSkeleton step row)
//   • Heading:     text-sm/4 font-semibold text-zinc-900 (BuildHeader)
//   • Meta:        text-xs/4 text-zinc-500 (BuildHeader sub-text)
//   • Cards:       rounded-md border border-zinc-200/60 (BuildHeader inner)
//   • Buttons:     BuildActionsComboButton class signature
//   • Rows:        flex items-center gap-3 px-3 py-3 + border-b border-zinc-100
//   • Sub-indent:  pl-10 (PageSkeleton job indent)

function V5StatusPip({ status }: { status: string }) {
  const colorClass =
    status === "complete"
      ? "bg-green-500"
      : status === "failed"
      ? "bg-red-500"
      : status === "in-progress"
      ? "bg-amber-500"
      : "bg-zinc-300";
  return (
    <span
      className={cn(
        "w-3.5 h-3.5 rounded-full flex-shrink-0",
        colorClass
      )}
    />
  );
}

function V5PipelineList({ allSteps }: { allSteps: BuildStep[] }) {
  return (
    <div className="rounded-md border border-zinc-200/60 overflow-hidden">
      {allSteps.map((step, i) => (
        <a
          key={step.id}
          href={`#step-${step.id}`}
          className={cn(
            "flex items-center gap-3 px-3 py-3 transition-colors",
            i < allSteps.length - 1 && "border-b border-zinc-100",
            step.status === "failed"
              ? "hover:bg-red-50/40"
              : "hover:bg-zinc-50"
          )}
        >
          <V5StatusPip status={step.status} />
          <span
            className={cn(
              "text-sm flex-1",
              step.status === "failed"
                ? "text-red-700 font-medium"
                : step.status === "pending"
                ? "text-zinc-400"
                : "text-zinc-600"
            )}
          >
            {step.name}
          </span>
          {step.jobs && step.jobs.length > 0 && (
            <span className="text-xs/4 text-zinc-400">
              {step.jobs.length} jobs
            </span>
          )}
          <span className="text-xs/4 text-zinc-500 font-mono w-16 text-right">
            {step.status === "pending" ? "blocked" : (step.duration ?? "—")}
          </span>
        </a>
      ))}
    </div>
  );
}

function V5Passed({ allSteps }: { allSteps: BuildStep[] }) {
  const totalSecs = allSteps.reduce(
    (sum, s) => sum + parseDuration(s.duration ?? ""),
    0
  );
  return (
    <div className="px-3 py-3 space-y-3">
      <div className="rounded-md border border-green-200/60 px-3 py-3 flex items-center gap-3">
        <V5StatusPip status="complete" />
        <div>
          <p className="text-sm/4 font-semibold text-zinc-900">
            All steps passed
          </p>
          <p className="text-xs/4 text-zinc-500 mt-1">
            Completed in {formatDuration(totalSecs)}
          </p>
        </div>
      </div>
      <V5PipelineList allSteps={allSteps} />
    </div>
  );
}

function V5Running({ allSteps }: { allSteps: BuildStep[] }) {
  const inProgressStep = allSteps.find((s) => s.status === "in-progress");
  const completedCount = allSteps.filter((s) => s.status === "complete").length;
  return (
    <div className="px-3 py-3 space-y-3">
      <div className="rounded-md border border-amber-200/60 px-3 py-3 flex items-center gap-3">
        <V5StatusPip status="in-progress" />
        <div>
          <p className="text-sm/4 font-semibold text-zinc-900">
            {inProgressStep?.name ?? "Build"} running
          </p>
          <p className="text-xs/4 text-zinc-500 mt-1">
            {completedCount} of {allSteps.length} steps complete
          </p>
        </div>
      </div>
      <V5PipelineList allSteps={allSteps} />
    </div>
  );
}

function V5Native({
  data,
  allSteps,
  status = "failed",
}: VariantProps & { status?: string }) {
  const { primaryFailedStep, primaryFailedJob, blockedSteps, suggestion } = data;
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (status === "passed" || status === "complete") {
    return <V5Passed allSteps={allSteps} />;
  }
  if (status === "running") {
    return <V5Running allSteps={allSteps} />;
  }

  const exitCode = primaryFailedJob?.exitCode ?? primaryFailedStep?.exitCode;
  const failedJobName =
    primaryFailedJob?.name ?? primaryFailedStep?.name ?? "Unknown step";
  const failedDuration =
    primaryFailedJob?.duration ?? primaryFailedStep?.duration ?? "--";

  const isRecurring =
    primaryFailedStep?.type === "matrix" ||
    primaryFailedStep?.name.toLowerCase().includes("test");
  const recurringCount = isRecurring ? { failed: 3, total: 5 } : null;

  const handleCopySummary = () => {
    const stepName = primaryFailedStep?.name ?? "";
    const passedNames = allSteps
      .filter((s) => s.status === "complete")
      .map((s) => s.name);
    const summary = [
      `${stepName} › ${failedJobName} failed (exit ${exitCode}).`,
      blockedSteps.length > 0
        ? `${blockedSteps.map((s) => s.name).join(" and ")} ${
            blockedSteps.length === 1 ? "is" : "are"
          } blocked.`
        : null,
      passedNames.length > 0 ? `${passedNames.join(", ")} passed.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-3 py-3 space-y-3">
      {/* ── Failure card ── */}
      <div className="rounded-md border border-red-200/70 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-3 px-3 py-3">
          <V5StatusPip status="failed" />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm/4 font-semibold text-zinc-900">
                {failedJobName}
              </span>
              {primaryFailedJob && (
                <span className="text-xs/4 text-zinc-500">
                  in {primaryFailedStep?.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs/4 text-zinc-500 mt-1 flex-wrap">
              {exitCode != null && (
                <span className="font-mono text-red-600">exit {exitCode}</span>
              )}
              <span className="text-zinc-300">·</span>
              <span>{failedDuration}</span>
              {recurringCount && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span className="text-amber-700">
                    flaky · {recurringCount.failed} of {recurringCount.total} runs
                  </span>
                </>
              )}
            </div>
          </div>
          <a
            href={`#step-${primaryFailedStep?.id}`}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs font-medium leading-none text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            View step
            <ArrowRight size={11} />
          </a>
        </div>

        {/* Sub-jobs */}
        {primaryFailedStep?.jobs && primaryFailedStep.jobs.length > 0 && (
          <div className="border-t border-zinc-100">
            {primaryFailedStep.jobs.map((job, i) => {
              const isLast = i === (primaryFailedStep.jobs?.length ?? 0) - 1;
              return (
                <div
                  key={job.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 pl-10",
                    !isLast && "border-b border-zinc-100"
                  )}
                >
                  <V5StatusPip status={job.status} />
                  <span
                    className={cn(
                      "text-sm flex-1",
                      job.status === "failed"
                        ? "text-red-700 font-medium"
                        : job.status === "pending"
                        ? "text-zinc-400"
                        : "text-zinc-600"
                    )}
                  >
                    {job.name}
                  </span>
                  {job.exitCode != null && job.exitCode !== 0 && (
                    <span className="font-mono text-xs/4 text-red-600">
                      exit {job.exitCode}
                    </span>
                  )}
                  <span className="text-xs/4 text-zinc-500 font-mono w-14 text-right">
                    {job.duration}
                  </span>
                  {job.status === "failed" && (
                    <a
                      href={`#job-${job.id}`}
                      className="text-zinc-400 hover:text-blue-600 transition-colors flex-shrink-0"
                      title="Jump to job"
                    >
                      <ArrowRight size={11} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Blast radius row ── */}
      {blockedSteps.length > 0 && (
        <div className="rounded-md border border-amber-200/60 px-3 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs/4 font-medium text-amber-700 flex-shrink-0">
              Blocks
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {blockedSteps.map((s) => (
                <a
                  key={s.id}
                  href={`#step-${s.id}`}
                  className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-amber-300/70 px-1.5 py-1 text-xs font-medium leading-none text-amber-800 transition-colors hover:bg-amber-50"
                >
                  {s.name}
                  <ArrowRight size={10} />
                </a>
              ))}
            </div>
          </div>
          <button
            onClick={handleCopySummary}
            className={cn(
              "inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium leading-none transition-colors",
              copied
                ? "bg-green-100 text-green-700"
                : "text-zinc-500 hover:bg-amber-100/60 hover:text-zinc-700"
            )}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy summary"}</span>
          </button>
        </div>
      )}

      {/* ── Suggestion ── */}
      {suggestion && !dismissed && (
        <div className="rounded-md border border-zinc-200/60 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Lightbulb
                size={14}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm/5 text-zinc-700">{suggestion}</p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-zinc-300 hover:text-zinc-500 flex-shrink-0 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div className="mt-2 pl-6">
            <button className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs font-medium leading-none text-zinc-700 transition-colors hover:bg-zinc-50">
              Preview fix
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ── Pipeline list ── */}
      <V5PipelineList allSteps={allSteps} />

      {/* ── AI placeholder ── */}
      <div className="border-t border-zinc-200/60 pt-3 px-1">
        <button className="text-xs/4 text-zinc-400 flex items-center gap-1.5 hover:text-zinc-600 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          AI explanation
          <ChevronDown size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Option 2: Zoned ──────────────────────────────────────────────────────────
// Background-fill zones make the three sections explicit.
// Rose zone for failure, amber zone for action, white for pipeline.
// Section labels guide the eye. Status pill badges replace plain text.

function V2Zoned({ data, allSteps }: VariantProps) {
  const { primaryFailedStep, primaryFailedJob, blockedSteps, suggestion } =
    data;
  const [dismissed, setDismissed] = useState(false);

  const exitCode = primaryFailedJob?.exitCode ?? primaryFailedStep?.exitCode;
  const failedJobName =
    primaryFailedJob?.name ?? primaryFailedStep?.name ?? "Unknown step";
  const failedDuration =
    primaryFailedJob?.duration ?? primaryFailedStep?.duration ?? "--";

  const Pill = ({
    status,
    children,
  }: {
    status: string;
    children: React.ReactNode;
  }) => {
    const styles: Record<string, string> = {
      complete: "bg-green-100 text-green-700 border-green-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-zinc-100 text-zinc-500 border-zinc-200",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 border",
          styles[status] ?? styles.pending
        )}
      >
        {children}
      </span>
    );
  };

  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      {/* ── What failed zone ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5 px-1">
          What failed
        </p>
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              {primaryFailedJob && (
                <p className="text-xs text-rose-400">{primaryFailedStep?.name}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-zinc-900">
                  {failedJobName}
                </span>
                <Pill status="failed">exit {exitCode}</Pill>
                <span className="text-xs text-zinc-500">{failedDuration}</span>
              </div>
            </div>
            <a
              href="#"
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600 flex-shrink-0 transition-colors"
            >
              <ExternalLink size={12} />
              <span>Build page</span>
            </a>
          </div>

          {/* Sub-jobs as pills */}
          {primaryFailedStep?.jobs && primaryFailedStep.jobs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {primaryFailedStep.jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-1">
                  <Pill status={job.status}>
                    {job.name.replace("Test (", "").replace(")", "")}
                  </Pill>
                </div>
              ))}
            </div>
          )}

          {/* Blast radius */}
          {blockedSteps.length > 0 && (
            <div className="border-t border-rose-100 pt-2.5 space-y-1.5">
              <p className="text-xs text-rose-500 font-medium">
                Downstream blocked
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {blockedSteps.map((s) => (
                  <a
                    key={s.id}
                    href="#"
                    className="flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-200 rounded-full px-2.5 py-0.5 transition-colors"
                  >
                    {s.name}
                    <ArrowRight size={10} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── What to do zone ── */}
      {suggestion && !dismissed && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5 px-1">
            What to do
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Lightbulb
                  size={13}
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-zinc-700 leading-relaxed">
                  {suggestion}
                </p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-zinc-400 hover:text-zinc-600 flex-shrink-0 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <div className="mt-2.5 pl-5">
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-2.5 py-1 flex items-center gap-1 transition-colors">
                Preview fix
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline zone ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5 px-1">
          Pipeline
        </p>
        <div className="space-y-1">
          {allSteps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border transition-colors",
                step.status === "failed"
                  ? "bg-red-50 border-red-100"
                  : step.status === "pending"
                  ? "bg-zinc-50/60 border-zinc-100"
                  : "bg-white border-zinc-100"
              )}
            >
              <StepStatusIcon status={step.status} size={12} />
              <span
                className={cn(
                  "flex-1 font-medium",
                  step.status === "failed"
                    ? "text-red-700"
                    : step.status === "pending"
                    ? "text-zinc-400"
                    : "text-zinc-600"
                )}
              >
                {step.name}
              </span>
              <span className="text-zinc-400 font-mono text-xs">
                {step.status === "pending" ? "blocked" : step.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI placeholder ── */}
      <div className="border border-dashed border-zinc-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          <span className="text-xs text-zinc-400">AI explanation</span>
        </div>
        <ChevronDown size={12} className="text-zinc-300" />
      </div>
    </div>
  );
}

// ─── Option 3: Sectioned card ────────────────────────────────────────────────
// A flat white card with a red border. Three explicit labelled sections:
// "What failed" (details + sub-jobs), "What it blocks" (downstream chips),
// and "What to do" (suggestion + Preview fix). Compact horizontal pipeline
// strip below the card; AI explanation as a bottom-of-view entry point.

function V3Elevated({ data, allSteps }: VariantProps) {
  const { primaryFailedStep, primaryFailedJob, blockedSteps, suggestion } =
    data;
  const [dismissed, setDismissed] = useState(false);

  const exitCode = primaryFailedJob?.exitCode ?? primaryFailedStep?.exitCode;
  const failedJobName =
    primaryFailedJob?.name ?? primaryFailedStep?.name ?? "Unknown step";
  const failedDuration =
    primaryFailedJob?.duration ?? primaryFailedStep?.duration ?? "--";

  return (
    <div className="px-2 pt-3 pb-5 space-y-4">
      {/* ── Failure card — flat, red-bordered, sectioned ── */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        {/* WHAT FAILED */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
            What failed
          </p>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              {primaryFailedJob && (
                <p className="text-xs text-zinc-400">{primaryFailedStep?.name}</p>
              )}
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-base font-bold text-zinc-900 leading-tight">
                  {failedJobName}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <span className="font-mono text-xs bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 leading-none">
                  exit {exitCode}
                </span>
                <span className="text-xs text-zinc-400">{failedDuration}</span>
              </div>
            </div>
            <a
              href="#"
              className="text-zinc-300 hover:text-blue-500 flex-shrink-0 mt-1 transition-colors"
              title="View on build page"
            >
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Sub-jobs (matrix variants) */}
          {primaryFailedStep?.jobs && primaryFailedStep.jobs.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {primaryFailedStep.jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-2">
                  <StepStatusIcon status={job.status} size={13} />
                  <span
                    className={cn(
                      "text-xs flex-1",
                      job.status === "failed"
                        ? "font-semibold text-red-700"
                        : job.status === "pending"
                        ? "text-zinc-400"
                        : "text-zinc-600"
                    )}
                  >
                    {job.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {job.duration}
                  </span>
                  {job.exitCode != null && job.exitCode !== 0 && (
                    <span className="font-mono text-xs text-red-500">
                      exit {job.exitCode}
                    </span>
                  )}
                  {job.status === "failed" && (
                    <a
                      href="#"
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <ArrowRight size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WHAT IT BLOCKS */}
        {blockedSteps.length > 0 && (
          <div className="border-t border-zinc-100 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              What it blocks
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {blockedSteps.map((s) => (
                <a
                  key={s.id}
                  href="#"
                  className="text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full px-2.5 py-0.5 flex items-center gap-1 transition-colors"
                >
                  {s.name}
                  <ArrowRight size={10} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* WHAT TO DO */}
        {suggestion && !dismissed && (
          <div className="border-t border-zinc-100 px-4 py-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">
                What to do
              </p>
              <button
                onClick={() => setDismissed(true)}
                className="text-zinc-300 hover:text-zinc-500 flex-shrink-0 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb
                size={13}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-zinc-600 leading-relaxed">
                {suggestion}
              </p>
            </div>
            <div className="mt-2.5 pl-5">
              <button className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5 flex items-center gap-1.5 transition-colors">
                Preview fix
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Pipeline step strip — compact horizontal flow ── */}
      <div className="px-1 space-y-2">
        <div className="flex items-center gap-0.5 flex-wrap">
          {allSteps.map((step, i) => (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <ChevronRight size={10} className="text-zinc-200 mx-0.5 flex-shrink-0" />
              )}
              <div className="flex items-center gap-1">
                <StepStatusIcon status={step.status} size={10} />
                <span
                  className={cn(
                    "text-xs",
                    step.status === "failed"
                      ? "text-red-600 font-semibold"
                      : step.status === "pending"
                      ? "text-zinc-300"
                      : "text-zinc-500"
                  )}
                >
                  {step.name}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── AI explanation — bottom of expandable view ── */}
      <div className="border-t border-dashed border-zinc-100 pt-3">
        <button className="text-xs text-zinc-400 flex items-center gap-1.5 hover:text-zinc-600 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          AI explanation
          <ChevronDown size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Option 4: Merged ─────────────────────────────────────────────────────────
// Combines V3's elevated failure card, V2's explicit blast radius treatment,
// V1's quiet dashed suggestion, and a clean vertical pipeline list.
// Adds: recurring-failure badge, copy-summary action, deep links to Tier 3,
// and dedicated passed/running states.

function V4PipelineList({ allSteps }: { allSteps: BuildStep[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium mb-1.5 px-0.5">
        Pipeline
      </p>
      <div className="space-y-px">
        {allSteps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs",
              step.status === "failed" ? "bg-red-50/60" : ""
            )}
          >
            <StepStatusIcon status={step.status} size={12} />
            <a
              href={`#step-${step.id}`}
              className={cn(
                "flex-1",
                step.status === "failed"
                  ? "text-red-700 font-semibold hover:underline"
                  : step.status === "pending"
                  ? "text-zinc-400 pointer-events-none"
                  : "text-zinc-600 hover:underline hover:text-zinc-900"
              )}
            >
              {step.name}
            </a>
            {step.jobs && step.jobs.length > 0 && (
              <span className="text-zinc-300 text-[10px]">
                {step.jobs.length} jobs
              </span>
            )}
            <span className="text-zinc-400 font-mono">
              {step.status === "pending" ? "blocked" : (step.duration ?? "—")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function V4Passed({ allSteps }: { allSteps: BuildStep[] }) {
  const totalSecs = allSteps.reduce(
    (sum, s) => sum + parseDuration(s.duration ?? ""),
    0
  );
  const totalDuration = formatDuration(totalSecs);

  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      <div className="bg-white rounded-xl border border-green-100 shadow-[0_2px_12px_rgba(34,197,94,0.08),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-zinc-900">All steps passed</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Completed in {totalDuration}
            </p>
          </div>
        </div>
      </div>
      <V4PipelineList allSteps={allSteps} />
    </div>
  );
}

function V4Running({ allSteps }: { allSteps: BuildStep[] }) {
  const inProgressStep = allSteps.find((s) => s.status === "in-progress");
  const completedCount = allSteps.filter((s) => s.status === "complete").length;

  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      <div className="bg-white rounded-xl border border-amber-100 shadow-[0_2px_12px_rgba(251,191,36,0.08),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-4 py-4 flex items-center gap-3">
          <Loader2
            size={18}
            className="text-amber-500 animate-spin flex-shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-zinc-900">
              {inProgressStep?.name ?? "Build"} running
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {completedCount} of {allSteps.length} steps complete
            </p>
          </div>
        </div>
      </div>
      <V4PipelineList allSteps={allSteps} />
    </div>
  );
}

function V4Merged({
  data,
  allSteps,
  status = "failed",
}: VariantProps & { status?: string }) {
  const { primaryFailedStep, primaryFailedJob, blockedSteps, suggestion } = data;
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (status === "passed" || status === "complete") {
    return <V4Passed allSteps={allSteps} />;
  }
  if (status === "running") {
    return <V4Running allSteps={allSteps} />;
  }

  const exitCode = primaryFailedJob?.exitCode ?? primaryFailedStep?.exitCode;
  const failedJobName =
    primaryFailedJob?.name ?? primaryFailedStep?.name ?? "Unknown step";
  const failedDuration =
    primaryFailedJob?.duration ?? primaryFailedStep?.duration ?? "--";

  // Mock recurring-failure signal — in production this would come from the build history API.
  const isRecurring =
    primaryFailedStep?.type === "matrix" ||
    primaryFailedStep?.name.toLowerCase().includes("test");
  const recurringCount = isRecurring ? { failed: 3, total: 5 } : null;

  const handleCopySummary = () => {
    const stepName = primaryFailedStep?.name ?? "";
    const passedNames = allSteps
      .filter((s) => s.status === "complete")
      .map((s) => s.name);
    const summary = [
      `${stepName} › ${failedJobName} failed (exit ${exitCode}).`,
      blockedSteps.length > 0
        ? `${blockedSteps.map((s) => s.name).join(" and ")} ${
            blockedSteps.length === 1 ? "is" : "are"
          } blocked.`
        : null,
      passedNames.length > 0 ? `${passedNames.join(", ")} passed.` : null,
    ]
      .filter(Boolean)
      .join(" ");

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      {/* ── Elevated failure card ── */}
      <div className="bg-white rounded-xl border border-red-100 shadow-[0_2px_12px_rgba(239,68,68,0.10),0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 min-w-0 flex-1">
              {primaryFailedJob && (
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                  {primaryFailedStep?.name}
                </p>
              )}
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-base font-bold text-zinc-900 leading-tight">
                  {failedJobName}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap pl-6">
                {exitCode != null && (
                  <span className="font-mono text-xs bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 leading-none">
                    exit {exitCode}
                  </span>
                )}
                <span className="text-xs text-zinc-400">{failedDuration}</span>
                {recurringCount && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    Flaky · {recurringCount.failed} of {recurringCount.total} runs
                  </span>
                )}
              </div>
            </div>
            <a
              href={`#step-${primaryFailedStep?.id}`}
              className="text-zinc-300 hover:text-blue-500 flex-shrink-0 mt-1 transition-colors"
              title="View step on build page"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Sub-jobs */}
        {primaryFailedStep?.jobs && primaryFailedStep.jobs.length > 0 && (
          <div className="border-t border-zinc-100 px-4 py-3 space-y-1.5">
            {primaryFailedStep.jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-2">
                <StepStatusIcon status={job.status} size={12} />
                <span
                  className={cn(
                    "text-xs flex-1",
                    job.status === "failed"
                      ? "font-semibold text-red-700"
                      : job.status === "pending"
                      ? "text-zinc-400"
                      : "text-zinc-600"
                  )}
                >
                  {job.name}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {job.duration}
                </span>
                {job.exitCode != null && job.exitCode !== 0 && (
                  <span className="font-mono text-xs text-red-500">
                    exit {job.exitCode}
                  </span>
                )}
                {job.status === "failed" && (
                  <a
                    href={`#job-${job.id}`}
                    className="text-blue-500 hover:text-blue-700 transition-colors flex-shrink-0"
                    title="Jump to job"
                  >
                    <ArrowRight size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Blast radius row (its own zone, distinct from the failure card) ── */}
      {blockedSteps.length > 0 && (
        <div className="border-l-4 border-amber-400 bg-amber-50/40 rounded-r-lg px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs text-amber-700 font-medium flex-shrink-0">
              Blocks
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {blockedSteps.map((s) => (
                <a
                  key={s.id}
                  href={`#step-${s.id}`}
                  className="text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors"
                >
                  {s.name}
                  <ArrowRight size={9} />
                </a>
              ))}
            </div>
          </div>
          <button
            onClick={handleCopySummary}
            className={cn(
              "text-xs flex items-center gap-1 flex-shrink-0 transition-all rounded px-2 py-1",
              copied
                ? "text-green-600 bg-green-50"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            )}
          >
            {copied ? (
              <>
                <Check size={11} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Copy summary</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Suggestion (V1's quiet dashed style) ── */}
      {suggestion && !dismissed && (
        <div className="border border-dashed border-zinc-300 rounded-md p-3 bg-zinc-50/60">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Lightbulb
                size={13}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-zinc-600 leading-relaxed">
                {suggestion}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-zinc-300 hover:text-zinc-500 flex-shrink-0 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div className="mt-2 pl-5">
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              Preview fix
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ── Pipeline step list ── */}
      <V4PipelineList allSteps={allSteps} />

      {/* ── AI placeholder ── */}
      <div className="border-t border-dashed border-zinc-200 pt-3">
        <button className="text-xs text-zinc-400 flex items-center gap-1.5 hover:text-zinc-600 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          AI explanation
          <ChevronDown size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Option 6: Refined sectioned (V3 + lead-designer critique applied) ──────
// V3 with the ten optimizations applied:
//  1. Dropped redundant "What failed" label — failure name is its own headline
//  2. Failure name is a clickable deep link to the step in Tier 3
//  3. Inline flaky indicator next to exit code
//  4. Copy summary action in the "What it blocks" zone
//  5. Retry job + Preview fix as twin outlined buttons (commitment-graded)
//  6. AI explanation promoted to a Sparkles-iconned button — visible, not loud
//  7. Compact pipeline strip distinguishes "blocked due to failure" from pending
//  8. Passed and running states added (Principle 5)
//  9. Removed dismiss X on suggestion (suggestions are contextual, not state)
// 10. Tighter suggestion copy

function V6PipelineStrip({ allSteps }: { allSteps: BuildStep[] }) {
  const firstFailedIdx = allSteps.findIndex((s) => s.status === "failed");
  return (
    <div className="px-1">
      <div className="flex items-center gap-0.5 flex-wrap">
        {allSteps.map((step, i) => {
          const isBlocked =
            step.status === "pending" &&
            firstFailedIdx >= 0 &&
            i > firstFailedIdx;
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <ChevronRight
                  size={10}
                  className="text-zinc-200 mx-0.5 flex-shrink-0"
                />
              )}
              <a
                href={`#step-${step.id}`}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <StepStatusIcon status={step.status} size={10} />
                <span
                  className={cn(
                    "text-xs",
                    step.status === "failed"
                      ? "text-red-600 font-semibold"
                      : isBlocked
                      ? "text-red-400"
                      : step.status === "pending"
                      ? "text-zinc-300"
                      : "text-zinc-500"
                  )}
                >
                  {step.name}
                </span>
              </a>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function V6Passed({ allSteps }: { allSteps: BuildStep[] }) {
  const totalSecs = allSteps.reduce(
    (sum, s) => sum + parseDuration(s.duration ?? ""),
    0
  );
  return (
    <div className="px-2 pt-3 pb-5 space-y-4">
      <div className="bg-white rounded-xl border border-green-200 px-4 py-3 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
        <div>
          <p className="text-base font-bold text-zinc-900 leading-tight">
            All steps passed
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Completed in {formatDuration(totalSecs)}
          </p>
        </div>
      </div>
      <V6PipelineStrip allSteps={allSteps} />
    </div>
  );
}

function V6Running({ allSteps }: { allSteps: BuildStep[] }) {
  const inProgressStep = allSteps.find((s) => s.status === "in-progress");
  const completedCount = allSteps.filter((s) => s.status === "complete").length;
  return (
    <div className="px-2 pt-3 pb-5 space-y-4">
      <div className="bg-white rounded-xl border border-amber-200 px-4 py-3 flex items-center gap-3">
        <Loader2
          size={20}
          className="text-amber-500 animate-spin flex-shrink-0"
        />
        <div>
          <p className="text-base font-bold text-zinc-900 leading-tight">
            {inProgressStep?.name ?? "Build"} running
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {completedCount} of {allSteps.length} steps complete
          </p>
        </div>
      </div>
      <V6PipelineStrip allSteps={allSteps} />
    </div>
  );
}

function V6Refined({
  data,
  allSteps,
  status = "failed",
}: VariantProps & { status?: string }) {
  const { primaryFailedStep, primaryFailedJob, blockedSteps, suggestion } = data;
  const [copied, setCopied] = useState(false);

  if (status === "passed" || status === "complete") {
    return <V6Passed allSteps={allSteps} />;
  }
  if (status === "running") {
    return <V6Running allSteps={allSteps} />;
  }

  const exitCode = primaryFailedJob?.exitCode ?? primaryFailedStep?.exitCode;
  const failedJobName =
    primaryFailedJob?.name ?? primaryFailedStep?.name ?? "Unknown step";
  const failedDuration =
    primaryFailedJob?.duration ?? primaryFailedStep?.duration ?? "--";

  const isRecurring =
    primaryFailedStep?.type === "matrix" ||
    primaryFailedStep?.name.toLowerCase().includes("test");
  const recurringCount = isRecurring ? { failed: 3, total: 5 } : null;

  const handleCopySummary = () => {
    const stepName = primaryFailedStep?.name ?? "";
    const passedNames = allSteps
      .filter((s) => s.status === "complete")
      .map((s) => s.name);
    const summary = [
      `${stepName} › ${failedJobName} failed (exit ${exitCode}).`,
      blockedSteps.length > 0
        ? `${blockedSteps.map((s) => s.name).join(" and ")} ${
            blockedSteps.length === 1 ? "is" : "are"
          } blocked.`
        : null,
      passedNames.length > 0 ? `${passedNames.join(", ")} passed.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-2 pt-3 pb-5 space-y-4">
      {/* ── Failure card ── */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        {/* Failure details — name itself is the deep link to Tier 3 */}
        <div className="px-4 pt-4 pb-3">
          <div className="space-y-1.5 min-w-0">
            {primaryFailedJob && (
              <p className="text-xs text-zinc-400">
                {primaryFailedStep?.name}
              </p>
            )}
            <a
              href={`#step-${primaryFailedStep?.id}`}
              className="group/title inline-flex items-center gap-2"
            >
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-base font-bold text-zinc-900 leading-tight group-hover/title:underline decoration-red-400 decoration-2 underline-offset-4">
                {failedJobName}
              </span>
              <ArrowRight
                size={13}
                className="text-zinc-300 group-hover/title:text-blue-500 transition-colors"
              />
            </a>
            <div className="flex items-center gap-2 flex-wrap pl-6">
              <span className="font-mono text-xs bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 leading-none">
                exit {exitCode}
              </span>
              <span className="text-xs text-zinc-400">{failedDuration}</span>
              {recurringCount && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  flaky · {recurringCount.failed} of {recurringCount.total} runs
                </span>
              )}
            </div>
          </div>

          {/* Sub-jobs (matrix variants) */}
          {primaryFailedStep?.jobs && primaryFailedStep.jobs.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {primaryFailedStep.jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-2">
                  <StepStatusIcon status={job.status} size={13} />
                  <span
                    className={cn(
                      "text-xs flex-1",
                      job.status === "failed"
                        ? "font-semibold text-red-700"
                        : job.status === "pending"
                        ? "text-zinc-400"
                        : "text-zinc-600"
                    )}
                  >
                    {job.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {job.duration}
                  </span>
                  {job.exitCode != null && job.exitCode !== 0 && (
                    <span className="font-mono text-xs text-red-500">
                      exit {job.exitCode}
                    </span>
                  )}
                  {job.status === "failed" && (
                    <a
                      href={`#job-${job.id}`}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <ArrowRight size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WHAT IT BLOCKS */}
        {blockedSteps.length > 0 && (
          <div className="border-t border-zinc-100 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              What it blocks
            </p>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {blockedSteps.map((s) => (
                  <a
                    key={s.id}
                    href={`#step-${s.id}`}
                    className="text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full px-2.5 py-0.5 flex items-center gap-1 transition-colors"
                  >
                    {s.name}
                    <ArrowRight size={10} />
                  </a>
                ))}
              </div>
              <button
                onClick={handleCopySummary}
                className={cn(
                  "inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium leading-none transition-colors",
                  copied
                    ? "bg-green-100 text-green-700"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                )}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? "Copied" : "Copy summary"}</span>
              </button>
            </div>
          </div>
        )}

        {/* WHAT TO DO */}
        {suggestion && (
          <div className="border-t border-zinc-100 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              What to do
            </p>
            <div className="flex items-start gap-2">
              <Lightbulb
                size={13}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-zinc-700 leading-relaxed">
                {suggestion}
              </p>
            </div>
            {/* Twin actions — commitment-graded (low → medium) */}
            <div className="mt-3 pl-5 flex items-center gap-2 flex-wrap">
              <button className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium leading-none text-zinc-700 hover:bg-zinc-50 transition-colors">
                <RotateCcw size={11} />
                Retry job
              </button>
              <button className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium leading-none text-zinc-700 hover:bg-zinc-50 transition-colors">
                Preview fix
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Pipeline strip — distinguishes blocked vs pending ── */}
      <V6PipelineStrip allSteps={allSteps} />

      {/* ── AI explanation — visible button at bottom of expandable view ── */}
      <div className="border-t border-dashed border-zinc-100 pt-3">
        <button className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
          <Sparkles size={12} className="text-amber-500" />
          Get AI explanation
          <ChevronDown size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Option 7: Horizontal failure rows ───────────────────────────────────────
// Each failure is a self-contained horizontal row that uses the right side of
// the card (currently empty in V6) for inline metadata + actions. Stacks
// naturally for multi-failure scenarios.
//
// Typography (strict): two sizes only.
//   • text-sm   (14px) — failure name + suggestion text
//   • text-xs   (12px) — all meta, buttons, sub-context, labels
//   • font-mono — exit codes and durations only (technical data)
//
// Highlighting (only the highest-value signals):
//   • AlertCircle (red-500), failure name (zinc-900 semibold), exit code badge
//   • Everything else stays plain — duration, flaky text, matrix context, etc.
//
// Accessibility:
//   • Real <a> for every link, focus-visible ring (blue-600), passes WCAG AA
//   • All meta text uses zinc-500 or darker (4.6:1 minimum on white)
//   • Decorative icons: aria-hidden; status colour never the only signal

// Adaptive button tiers used by V7FailureRow. The primary tier sits between
// the standard outlined tier and the filled-black "Apply fix" tier. Filled
// black stays exclusive to Apply fix — that's the only commitment that
// changes a file.
const V7_PRIMARY_BTN_CLASS =
  "inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-white px-2 py-1 text-xs font-semibold leading-none text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors";
const V7_SECONDARY_BTN_CLASS =
  "inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium leading-none text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors";

function V7FailureRow({
  step,
  job,
  suggestion,
  isRecurring,
  recurringCount,
  isLast,
  summary,
}: {
  step: BuildStep;
  job: Job | null;
  suggestion: string | null;
  isRecurring: boolean;
  recurringCount: { failed: number; total: number } | null;
  isLast: boolean;
  summary: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  // Inline retry state machine. Closes the loop on the page so the user
  // doesn't have to leave to learn whether retry worked.
  // Heuristic for the demo: flaky failures pass on retry; deterministic
  // failures (typed pattern match) fail again and route the user to Preview fix.
  const [retryState, setRetryState] = useState<
    "idle" | "retrying" | "passed" | "failed-again"
  >("idle");

  const exitCode = job?.exitCode ?? step.exitCode;
  const name = job?.name ?? step.name;
  const duration = job?.duration ?? step.duration ?? "--";
  const linkHref = job ? `#job-${job.id}` : `#step-${step.id}`;
  const parentLabel = job ? step.name : null;

  // Pattern-driven dispatch — one lookup gives us suggestion, explanation,
  // and fix as a typed bundle. No string-matching against the suggestion.
  const pattern = matchFailurePattern(step, job);
  const aiExplanation = pattern?.explanation ?? null;

  useEffect(() => {
    if (retryState !== "retrying") return;
    const t = setTimeout(() => {
      setRetryState(isRecurring ? "passed" : "failed-again");
    }, 2200);
    return () => clearTimeout(t);
  }, [retryState, isRecurring]);

  // Mock historical baseline — production: from build history API.
  // Tells the user whether the failure was "early" (config issue) or
  // "late" (timeout / environmental). Critical for stuck-build detection too.
  const typicalDuration =
    step.type === "matrix" || step.name.toLowerCase().includes("test")
      ? "1m 18s"
      : null;

  // Matrix context: list other variants and their state in plain text.
  const otherVariants =
    job && step.jobs && step.jobs.length > 1
      ? step.jobs
          .filter((j) => j.id !== job.id)
          .map((j) => {
            const variantName = j.name.replace(/^Test \(/, "").replace(/\)$/, "");
            const stateWord =
              j.status === "complete"
                ? "passed"
                : j.status === "pending"
                ? "pending"
                : j.status === "failed"
                ? "failed"
                : j.status;
            return `${variantName} ${stateWord}`;
          })
          .join(" · ")
      : null;

  // AI-generated fix preview comes from the same pattern.
  const fixPreview = pattern?.fix ?? null;

  // Adaptive primary action — the pattern declares which action is recommended.
  // Deterministic code bugs with a fix → Preview fix is primary. Anything else
  // (loose match, no pattern, no fix) → Retry stays primary.
  const previewFixIsPrimary =
    pattern?.primaryAction === "preview-fix" && fixPreview != null;
  const retryIsPrimary = !previewFixIsPrimary;

  return (
    <div
      className={cn(
        "px-4 py-3",
        !isLast && "border-b border-zinc-100"
      )}
    >
      {/* Top row: identity + meta on the left, Retry on the right.
          Retry's cue is the flaky indicator (environmental signal). */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
          <a
            href={linkHref}
            aria-label={`${name}, failed — view step`}
            className="group/title inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <AlertCircle
              size={14}
              className="text-red-500 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-zinc-900 group-hover/title:underline decoration-zinc-400 decoration-2 underline-offset-4">
              {name}
            </span>
          </a>

          {exitCode != null && (
            <span className="font-mono text-xs bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 leading-none">
              exit {exitCode}
            </span>
          )}

          <span className="text-xs text-zinc-500">
            <span className="font-mono">{duration}</span>
            {typicalDuration && (
              <>
                {" · prev "}
                <span className="font-mono">{typicalDuration}</span>
              </>
            )}
          </span>

          {isRecurring && recurringCount && (
            <span className="text-xs text-amber-700">
              flaky · {recurringCount.failed} of {recurringCount.total} runs
            </span>
          )}
        </div>

        {!applied && retryState === "idle" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <V7CopySummary summary={summary} />
            <button
              type="button"
              onClick={() => setRetryState("retrying")}
              className={
                retryIsPrimary ? V7_PRIMARY_BTN_CLASS : V7_SECONDARY_BTN_CLASS
              }
            >
              <RotateCcw size={11} aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {retryState === "retrying" && (
          <div
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1.5 flex-shrink-0 text-xs text-zinc-500"
          >
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            Retrying…
          </div>
        )}
      </div>

      {/* Sub-line: parent + matrix context */}
      {(parentLabel || otherVariants) && (
        <p className="mt-1 ml-6 text-xs text-zinc-500">
          {parentLabel && <>in {parentLabel}</>}
          {parentLabel && otherVariants && " · "}
          {otherVariants}
        </p>
      )}

      {/* Retry passed — flake confirmed. Failure is resolved on-page; the
          suggestion + Preview fix are hidden because there's nothing to act on. */}
      {retryState === "passed" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 ml-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 flex items-center gap-2"
        >
          <Check
            size={14}
            className="text-green-700 flex-shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm text-zinc-700 flex-1">
            <span className="font-semibold">Retry passed.</span>{" "}
            Flake confirmed — no action needed.
          </p>
          <button
            type="button"
            onClick={() => setRetryState("idle")}
            aria-label="Reset retry state"
            className="text-zinc-500 hover:text-zinc-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Failed again — nudge the user toward Preview fix instead of more retries.
          This is the metric we want to move: retry rate on non-flaky failures. */}
      {retryState === "failed-again" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 ml-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2"
        >
          <AlertTriangle
            size={14}
            className="text-amber-700 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-zinc-700 flex-1">
            <span className="font-semibold">Failed again.</span>{" "}
            Probably not flaky — try Preview fix below instead.
          </p>
          <button
            type="button"
            onClick={() => setRetryState("idle")}
            aria-label="Dismiss"
            className="text-zinc-500 hover:text-zinc-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Suggestion as plain prose with an inline "Show more explanation"
          trigger at the end. AI source is acknowledged inside the expanded
          card (header + security note), not on the surface. */}
      {suggestion && !applied && retryState !== "passed" && (
        <div className="mt-1.5 ml-6">
          <p className="text-sm text-zinc-700 leading-snug">
            {suggestion}
            {aiExplanation && (
              <>
                {" "}
                <V7AIExplanationTrigger
                  open={explanationOpen}
                  onToggle={() => setExplanationOpen((v) => !v)}
                />
              </>
            )}
          </p>

          {explanationOpen && aiExplanation && (
            <div className="mt-2">
              <V7AIExplanationCard
                explanation={aiExplanation}
                confidence={pattern?.confidence ?? "high"}
              />
            </div>
          )}
        </div>
      )}

      {/* Preview AI fix — action close to the suggestion that motivates it.
          The "AI" in the label is explicit so users know the source. */}
      {!applied && retryState !== "passed" && fixPreview && (
        <div className="mt-3 ml-6">
          <button
            type="button"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((v) => !v)}
            className={
              previewFixIsPrimary
                ? V7_PRIMARY_BTN_CLASS
                : V7_SECONDARY_BTN_CLASS
            }
          >
            Preview fix
            <ChevronDown
              size={11}
              aria-hidden="true"
              className={cn(
                "transition-transform",
                previewOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      )}

      {/* AI fix disclosure: file path · diff · Apply confirmation */}
      {previewOpen && !applied && fixPreview && (
        <div className="mt-2 ml-6 rounded-md border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 bg-zinc-50">
            <span className="font-mono text-xs text-zinc-700">
              {fixPreview.file}
            </span>
            <span className="text-xs text-zinc-500">1 file changed</span>
          </div>
          <div className="font-mono text-xs">
            <div className="px-3 py-1 bg-red-50 text-red-700 flex gap-2">
              <span className="text-red-400 select-none" aria-hidden="true">
                −
              </span>
              <code>{fixPreview.before}</code>
            </div>
            <div className="px-3 py-1 bg-green-50 text-green-700 flex gap-2">
              <span className="text-green-500 select-none" aria-hidden="true">
                +
              </span>
              <code>{fixPreview.after}</code>
            </div>
          </div>
          {/* Footer stacks vertically so Apply fix sits in the same left
              column as the Preview fix trigger above. Reading order:
              diff → note → action. */}
          <div className="px-3 py-2 border-t border-zinc-200 bg-zinc-50">
            <p className="text-xs text-zinc-500 mb-2">
              Logs sanitized before AI processing · attributed to your account
            </p>
            <button
              type="button"
              onClick={() => {
                setApplied(true);
                setPreviewOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-900 hover:bg-zinc-800 px-2 py-1 text-xs font-medium leading-none text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
            >
              <Check size={11} aria-hidden="true" />
              Apply fix
            </button>
          </div>
        </div>
      )}

      {/* Applied confirmation — pipeline re-running */}
      {applied && (
        <div className="mt-3 ml-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 flex items-center gap-2">
          <Check
            size={14}
            className="text-green-700 flex-shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm text-zinc-700 flex-1">
            <span className="font-semibold">Fix applied</span>
            {fixPreview && (
              <>
                {" "}
                to{" "}
                <code className="font-mono text-xs bg-white border border-zinc-200 rounded px-1 py-0.5">
                  {fixPreview.file}
                </code>
              </>
            )}
            . Pipeline re-running.
          </p>
          <button
            type="button"
            onClick={() => setApplied(false)}
            aria-label="Reset preview state"
            className="text-zinc-500 hover:text-zinc-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// Compact horizontal pipeline strip — pipeline shape signal in one line.
// Bridges Tier 2 (this view) to Tier 3 (the step list below) via deep links.
// Failed step highlighted; pending steps after the failure (= blocked) are
// surfaced in amber so the strip on its own communicates blast radius.
function V7PipelineStrip({ allSteps }: { allSteps: BuildStep[] }) {
  const firstFailedIdx = allSteps.findIndex((s) => s.status === "failed");
  return (
    <nav aria-label="Pipeline steps" className="px-1">
      <ol className="flex items-center gap-0.5 flex-wrap m-0 p-0 list-none">
        {allSteps.map((step, i) => {
          const isBlocked =
            step.status === "pending" &&
            firstFailedIdx >= 0 &&
            i > firstFailedIdx;
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <ChevronRight
                  size={10}
                  className="text-zinc-300 mx-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              <li>
                <a
                  href={`#step-${step.id}`}
                  aria-label={`${step.name}, ${
                    isBlocked ? "blocked" : getStatusLabel(step.status)
                  }`}
                  className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
                >
                  <StepStatusIcon status={step.status} size={10} />
                  <span
                    className={cn(
                      "text-xs",
                      step.status === "failed"
                        ? "text-red-700 font-semibold"
                        : isBlocked
                        ? "text-amber-700"
                        : step.status === "in-progress"
                        ? "text-amber-700"
                        : "text-zinc-500"
                    )}
                  >
                    {step.name}
                  </span>
                </a>
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// Shared Copy-summary button — owns its own copied state. The visually-
// hidden aria-live span announces the state change to screen readers
// so they hear "Summary copied to clipboard" when the click succeeds.
function V7CopySummary({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        copied
          ? "bg-green-100 text-green-700"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
      )}
    >
      {copied ? (
        <Check size={11} aria-hidden="true" />
      ) : (
        <Copy size={11} aria-hidden="true" />
      )}
      <span>{copied ? "Copied" : "Copy summary"}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Summary copied to clipboard" : ""}
      </span>
    </button>
  );
}

// Shared inline "Show more AI explanation" trigger — a lightweight text link
// for content disclosure. Used inline at the end of any AI-sourced text line.
// The trigger is a content extension, not an action gate; lighter than the
// outlined Preview AI fix button on purpose.
function V7AIExplanationTrigger({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="inline-flex items-center gap-0.5 rounded text-sm text-zinc-500 hover:text-zinc-700 hover:underline decoration-zinc-400 decoration-2 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
    >
      Show more explanation
      <ChevronDown
        size={11}
        aria-hidden="true"
        className={cn("transition-transform", open && "rotate-180")}
      />
    </button>
  );
}

// The expanded card — header / body / footer. No state, no trigger; the
// parent decides when to render it. Visual structure stays consistent
// because the explanation always benefits from the same chrome:
// confidence indicator at top, security note at bottom.
function V7AIExplanationCard({
  explanation,
  confidence = "high",
}: {
  explanation: string;
  confidence?: "high" | "loose";
}) {
  // Captures whether the AI explanation was useful — the only way to measure
  // accept rate over time. Persisted upstream in production; local-only here.
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const confidenceChip =
    confidence === "high"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  const confidenceLabel =
    confidence === "high" ? "High confidence" : "Loose match";

  return (
    <div className="rounded-md border border-zinc-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-200 bg-zinc-50">
        <Sparkles
          size={12}
          className="text-amber-500 flex-shrink-0"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-zinc-700">AI explanation</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center text-xs leading-none px-1.5 py-0.5 rounded border",
            confidenceChip
          )}
        >
          {confidenceLabel}
        </span>
      </div>
      <div className="px-3 py-3">
        <p className="text-sm text-zinc-700 leading-snug">{explanation}</p>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-zinc-200 bg-zinc-50">
        <p className="text-xs text-zinc-500">
          Logs sanitized before AI processing.
        </p>
        {feedback === null ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">Was this helpful?</span>
            <button
              type="button"
              onClick={() => setFeedback("up")}
              aria-label="Mark explanation as helpful"
              className="inline-flex items-center justify-center rounded p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
            >
              <ThumbsUp size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setFeedback("down")}
              aria-label="Mark explanation as not helpful"
              className="inline-flex items-center justify-center rounded p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
            >
              <ThumbsDown size={12} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1 text-xs text-zinc-500"
          >
            <Check size={12} className="text-green-600" aria-hidden="true" />
            Thanks — feedback saved
          </span>
        )}
      </div>
    </div>
  );
}

function V7Passed({ allSteps }: { allSteps: BuildStep[] }) {
  const totalSecs = allSteps.reduce(
    (sum, s) => sum + parseDuration(s.duration ?? ""),
    0
  );
  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      <V7PipelineStrip allSteps={allSteps} />
      <div className="bg-white rounded-md border border-green-200 px-4 py-3 flex items-center gap-3">
        <CheckCircle2
          size={16}
          className="text-green-600 flex-shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-zinc-900 leading-tight">
            All steps passed
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Completed in {formatDuration(totalSecs)}
          </p>
        </div>
      </div>
    </div>
  );
}

function V7Running({ allSteps }: { allSteps: BuildStep[] }) {
  const inProgressStep = allSteps.find((s) => s.status === "in-progress");
  const completedCount = allSteps.filter((s) => s.status === "complete").length;
  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      <V7PipelineStrip allSteps={allSteps} />
      <div className="bg-white rounded-md border border-amber-200 px-4 py-3 flex items-center gap-3">
        <Loader2
          size={16}
          className="text-amber-600 animate-spin flex-shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-zinc-900 leading-tight">
            {inProgressStep?.name ?? "Build"} running
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {completedCount} of {allSteps.length} steps complete
          </p>
        </div>
      </div>
    </div>
  );
}

function V7Refined({
  data,
  allSteps,
  status = "failed",
  topBanner,
  suppressFlaky = false,
}: VariantProps & {
  status?: BuildStatus;
  topBanner?: React.ReactNode;
  suppressFlaky?: boolean;
}) {
  const { primaryFailedStep, primaryFailedJob, blockedSteps, suggestion, failedSteps } =
    data;

  if (status === "passed" || status === "complete") {
    return <V7Passed allSteps={allSteps} />;
  }
  if (status === "running") {
    return <V7Running allSteps={allSteps} />;
  }

  // Suppressed when a higher-scope recurring signal is present (e.g.,
  // the cross-build aggregation banner in V7.5 already conveys "recurring"
  // at a wider scope, making the per-pipeline flaky pill redundant).
  const isRecurring =
    !suppressFlaky &&
    (primaryFailedStep?.type === "matrix" ||
      primaryFailedStep?.name.toLowerCase().includes("test"));
  const recurringCount = isRecurring ? { failed: 3, total: 5 } : null;

  // Each row derives its own suggestion AND its own summary from its own
  // step + job data, so multi-failure builds give per-failure AI guidance
  // and per-failure shareable summaries (each summary leads with the row's
  // specific failure but includes build-level blast radius for context).
  const failureRows = failedSteps.map((step, i) => {
    const failedJob = step.jobs?.find((j) => j.status === "failed") ?? null;
    const rowSuggestion = getSuggestion(step, failedJob);
    const rowFailedName = failedJob?.name ?? step.name;
    const rowExitCode = failedJob?.exitCode ?? step.exitCode;
    const rowSummary = [
      step.name !== rowFailedName
        ? `${step.name} › ${rowFailedName} failed (exit ${rowExitCode}).`
        : `${step.name} failed (exit ${rowExitCode}).`,
      rowSuggestion,
      blockedSteps.length > 0
        ? `${blockedSteps.map((s) => s.name).join(" and ")} ${
            blockedSteps.length === 1 ? "is" : "are"
          } blocked.`
        : null,
    ]
      .filter(Boolean)
      .join(" ");
    return {
      step,
      job: failedJob,
      suggestion: rowSuggestion,
      summary: rowSummary,
      isLast: i === failedSteps.length - 1,
    };
  });

  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      {topBanner}

      {/* Pipeline shape — top of the expanded panel. The textual strip
          replaces the collapsed progress bar's role. Pending steps after
          a failure render in amber, so the strip itself communicates blast
          radius and a separate Blocks list isn't needed. */}
      <V7PipelineStrip allSteps={allSteps} />

      {/* Failure rows in a single bordered card. Each row owns its own
          Copy summary + Retry actions, scoped to that specific failure. */}
      <div className="bg-white rounded-md border border-red-200 overflow-hidden">
        {failureRows.map((row) => (
          <V7FailureRow
            key={row.step.id}
            step={row.step}
            job={row.job}
            suggestion={row.suggestion}
            summary={row.summary}
            isRecurring={isRecurring}
            recurringCount={recurringCount}
            isLast={row.isLast}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Option 7.1: Stuck build (Scenario 2 Variant B) ──────────────────────────
// The build hasn't failed (no notification fires), it just hasn't finished.
// Duration anomaly is the only signal. Without surfacing this, the stuck
// build stays invisible until a human notices the absence of a result.

function V7_1_Stuck() {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const stuckExplanation =
    "AI cannot pinpoint the exact cause of the hang from logs alone. Common patterns at this duration: an unresponsive agent or Docker container, a deadlocked test, or a network timeout to an external dependency. Retrying the job is usually the right first move; if the same step gets stuck across builds, the platform team should investigate.";
  const stuckSteps = stuckScenarioSteps;

  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      <V7PipelineStrip allSteps={stuckSteps} />

      {/* Anomaly card — looks like a normal in-progress card but with a duration warning */}
      <div className="bg-white rounded-md border border-amber-300 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
            <a
              href="#job-test-node18"
              className="group/title inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <AlertTriangle size={14} className="text-amber-700 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-zinc-900 group-hover/title:underline decoration-zinc-400 decoration-2 underline-offset-4">
                Test (Node 18)
              </span>
            </a>
            <span className="text-xs text-zinc-500">
              <span className="font-mono">3h 24m</span>
              {" · "}
              <span className="text-amber-700 font-semibold">8m typical · 25× over</span>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium leading-none text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
            >
              <RotateCcw size={11} aria-hidden="true" />
              Retry job
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium leading-none text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
            >
              <X size={11} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
        <p className="mt-1 ml-6 text-xs text-zinc-500">
          in Test matrix · Node 16 passed · Node 20 pending
        </p>
        <div className="mt-1.5 ml-6">
          <p className="text-sm text-zinc-700 leading-snug">
            Likely an unresponsive agent or stuck process — the step is far past its typical duration. Retry the job, or cancel and re-run the build.
            {" "}
            <V7AIExplanationTrigger
              open={explanationOpen}
              onToggle={() => setExplanationOpen((v) => !v)}
            />
          </p>

          {explanationOpen && (
            <div className="mt-2">
              <V7AIExplanationCard explanation={stuckExplanation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Option 7.2: Post-fix verification (Scenario 1 + 2) ──────────────────────
// After a fix is applied and the new build runs, the previously failing step
// now passes. Carrying forward context from the previous build means the
// developer (or reviewer) gets confidence that the fix landed correctly —
// and that no NEW failure was introduced elsewhere.

function V7_2_Verified() {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const verifiedExplanation =
    "The previous build failed with a CommonJS/ESM import mismatch on Node 18. The fix replaced the require() call in src/auth.js with an ESM import. AI confirms this resolves the original failure, and no related issues were detected in this run.";
  const verifiedSteps = verifiedScenarioSteps;

  const totalSecs = verifiedSteps.reduce(
    (sum, s) => sum + parseDuration(s.duration ?? ""),
    0
  );

  return (
    <div className="px-2 pt-3 pb-5 space-y-3">
      <V7PipelineStrip allSteps={verifiedSteps} />

      {/* Pass card */}
      <div className="bg-white rounded-md border border-green-200 px-4 py-3 flex items-center gap-3">
        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-zinc-900 leading-tight">
            All steps passed
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Completed in {formatDuration(totalSecs)}
          </p>
        </div>
      </div>

      {/* Verification row — carries context from previous build, with the
          AI explanation inline at the end of the verification statement. */}
      <div className="rounded-md border border-zinc-200 px-4 py-3">
        <div className="flex items-start gap-3">
          <Check size={14} className="text-green-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-700 leading-snug">
              <a
                href="#job-test-node18"
                className="font-semibold text-zinc-900 hover:underline decoration-zinc-400 decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded"
              >
                Test (Node 18)
              </a>{" "}
              was previously failing — now passing.
              {" "}
              <V7AIExplanationTrigger
                open={explanationOpen}
                onToggle={() => setExplanationOpen((v) => !v)}
              />
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Fix applied 2 minutes ago by Alex Rivera ·{" "}
              <a
                href="#prev-build"
                className="underline hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded"
              >
                view previous build
              </a>
            </p>

            {explanationOpen && (
              <div className="mt-2">
                <V7AIExplanationCard explanation={verifiedExplanation} />
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-500 font-mono flex-shrink-0">1m 14s</span>
        </div>
      </div>
    </div>
  );
}

// ─── Option 7.3: AI confidence ladder (Scenario 3) ───────────────────────────
// Three commitment levels in one panel: explain (read-only), recommend
// (proposed diff), execute (apply fix). Confirmation gate is always present.
// Logs sanitized before AI processing — surfaced in the footer so the user
// understands what data is being sent.

// ─── Option 7.4: Multi-failure (parallel failures) ───────────────────────────
// Two independent failures in the same build (Lint + Test matrix). The
// horizontal-row layout scales — each failure gets its own row, its own
// metadata, its own actions. Reviewer can compare exit codes / durations
// across rows by visual alignment.

function V7_4_Multi() {
  const data = useMemo(() => deriveTriageData(multiFailScenarioSteps), []);
  return (
    <V7Refined
      data={data}
      allSteps={multiFailScenarioSteps}
      status="failed"
    />
  );
}

// ─── Option 7.5: Cross-build aggregation (Scenario 4) ────────────────────────
// A pattern detected across multiple builds — banner above the standard view.
// The aggregation is from a future telemetry layer (out of scope for this
// component per PRD §12.2), but the design must accommodate it without
// redesign. The structured failure data we surface here becomes the input.

function V7_5_CrossBuild({ data, allSteps }: VariantProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Notification stub — in production posts to the platform team channel.
  // Local-only for the demo so the user can see the action change state.
  const [notified, setNotified] = useState(false);

  const banner = bannerDismissed ? null : (
    <div className="rounded-md border border-amber-300 bg-amber-50/40 px-3 py-2 flex items-start gap-3 flex-wrap">
      <AlertTriangle
        size={14}
        className="text-amber-700 flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-700 leading-snug">
          <span className="font-semibold">Test (Node 18)</span> has failed across{" "}
          <span className="font-semibold">3 builds</span> in the last hour —
          possible shared root cause.
        </p>
        {/* Primary action sits in the same column as the text it acts on.
            "View affected builds" is the primary because cross-build issues
            need investigation before any per-build action makes sense. */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <a href="#cross-build-pattern" className={V7_PRIMARY_BTN_CLASS}>
            View affected builds
          </a>
          {notified ? (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium leading-none text-green-700"
            >
              <Check size={11} aria-hidden="true" />
              Platform team notified
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setNotified(true)}
              className={V7_SECONDARY_BTN_CLASS}
            >
              Notify platform team
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setBannerDismissed(true)}
        aria-label="Dismiss aggregation banner"
        className="text-zinc-500 hover:text-zinc-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 flex-shrink-0"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <V7Refined
      data={data}
      allSteps={allSteps}
      status="failed"
      topBanner={banner}
      suppressFlaky
    />
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ExpandedTriageView({
  steps,
  variant,
  status,
}: ExpandedTriageViewProps) {
  const data = useMemo(() => deriveTriageData(steps), [steps]);

  switch (variant) {
    case 2:
      return <V2Zoned data={data} allSteps={steps} />;
    case 3:
      return <V3Elevated data={data} allSteps={steps} />;
    case 4:
      return <V4Merged data={data} allSteps={steps} status={status} />;
    case 5:
      return <V5Native data={data} allSteps={steps} status={status} />;
    case 6:
      return <V6Refined data={data} allSteps={steps} status={status} />;
    case 8:
      return <V7_1_Stuck />;
    case 9:
      return <V7_2_Verified />;
    case 11:
      return <V7_4_Multi />;
    case 12:
      return <V7_5_CrossBuild data={data} allSteps={steps} />;
    case 7:
    default:
      return <V7Refined data={data} allSteps={steps} status={status} />;
  }
}
