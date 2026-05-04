import type { BuildStep, StepStatus } from "@/types/build";

/** Human-readable label for a step status. */
export const getStatusLabel = (s: StepStatus) => {
  switch (s) {
    case "complete":
      return "Passed";
    case "in-progress":
      return "Running";
    case "failed":
      return "Failed";
    case "pending":
      return "Waiting";
    default:
      return "Unknown";
  }
};

/** Tailwind color tokens keyed by build/step status string. */
export const getStatusColors = (s: string) => {
  switch (s) {
    case "running":
    case "in-progress":
      return {
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        textColor: "text-zinc-800",
        topBorderColorHex: "#ffba4371",
      };
    case "passed":
    case "complete":
      return {
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
        textColor: "text-zinc-800",
        topBorderColorHex: "#10b98168",
      };
    case "failed":
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-zinc-800",
        topBorderColorHex: "#f45f5fcc",
      };
    case "canceled":
      return {
        bgColor: "bg-zinc-50",
        borderColor: "border-zinc-300",
        textColor: "text-zinc-800",
        topBorderColorHex: "#6b7280",
      };
    default:
      return {
        bgColor: "bg-zinc-50",
        borderColor: "border-zinc-300",
        textColor: "text-zinc-800",
        topBorderColorHex: "#6b7280",
      };
  }
};

/** Parse a duration string like "4s", "1m 20s", or "--" into total seconds. */
export const parseDuration = (d: string): number => {
  if (!d || d === "--") return 0;
  const match = d.match(/(?:(\d+)m\s*)?(\d+)s/);
  if (!match) return 0;
  const minutes = match[1] ? parseInt(match[1], 10) : 0;
  const seconds = match[2] ? parseInt(match[2], 10) : 0;
  return minutes * 60 + seconds;
};

/** Format total seconds into a human-readable duration string. */
export const formatDuration = (secs: number): string => {
  if (secs <= 0) return "0s";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
};

/** Compute aggregate build stats from pipeline steps. */
export const computeBuildStats = (steps: BuildStep[]) => {
  let totalSeconds = 0;
  let failedCount = 0;
  let blockedCount = 0;

  for (const step of steps) {
    totalSeconds += parseDuration(step.duration ?? "--");

    if (step.jobs && step.jobs.length > 0) {
      for (const job of step.jobs) {
        if (job.status === "failed") failedCount++;
      }
    } else if (step.status === "failed") {
      failedCount++;
    }

    if (step.status === "pending") blockedCount++;
  }

  const parts: string[] = [];
  if (failedCount > 0)
    parts.push(`${failedCount} failed job${failedCount !== 1 ? "s" : ""}`);
  if (blockedCount > 0)
    parts.push(`${blockedCount} blocked`);

  return {
    duration: formatDuration(totalSeconds),
    failedCount,
    blockedCount,
    summaryText: parts.join(" · ") || "All passed",
  };
};
