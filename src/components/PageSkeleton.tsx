import { cn } from "@/lib/utils";
import { mockBuildSteps } from "@/data/mockBuildSteps";
import type { BuildStep, StepStatus } from "@/types/build";

/**
 * Low-fidelity skeleton of the page below the build header.
 *
 * Gives candidates spatial context for where the expandable header sits
 * relative to the full build UI. Not part of the task — do not modify.
 */

type SkeletonRow = { name: string; status: StepStatus; indent?: boolean };

/** Derive skeleton rows from mockBuildSteps so they never drift. */
function toSkeletonRows(steps: BuildStep[]): SkeletonRow[] {
  const rows: SkeletonRow[] = [];
  for (const step of steps) {
    rows.push({ name: step.name, status: step.status });
    if (step.jobs) {
      for (const job of step.jobs) {
        rows.push({ name: job.name, status: job.status, indent: true });
      }
    }
  }
  return rows;
}

const skeletonSteps = toSkeletonRows(mockBuildSteps);

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded bg-zinc-300/80", className)} />;
}

export default function PageSkeleton() {
  return (
    <div className="flex-1 mx-2 lg:mx-3 mt-1 select-none" aria-hidden="true">
      {/* Tab navigation bar */}
      <div className="flex items-center gap-2 border-b border-zinc-200 px-2 py-2.5">
        <Bar className="w-24 h-5 bg-zinc-400/50" />
        <Bar className="w-24 h-5 hover:bg-indigo-100/80" />
        <Bar className="w-24 h-5 hover:bg-indigo-100/80" />
        <Bar className="w-24 h-5 hover:bg-indigo-100/80" />
      </div>

      {/* Content area: step list + sidebar */}
      <div className="flex">
        {/* Step rows */}
        <div className="flex-1 min-w-0">
          {skeletonSteps.map((step) => (
            <div
              key={step.name}
              className={cn(
                "flex items-center gap-3 px-3 py-3 border-b border-zinc-100",
                step.indent && "pl-10",
              )}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full shrink-0",
                  step.status === "complete" && "bg-green-500",
                  step.status === "in-progress" && "bg-amber-500",
                  step.status === "failed" && "bg-red-500",
                  step.status === "pending" && "bg-zinc-300",
                )}
              />
              <span className="text-sm text-zinc-600">
                {step.name}
              </span>
              <div className="ml-auto flex gap-8">
                <Bar className="w-8 h-3" />
                <Bar className="w-12 h-3" />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="w-[33.33%] shrink-0 border-l border-zinc-200 hidden sm:block">
          <div className="flex gap-2 px-4 py-3 border-b border-zinc-100">
            <Bar className="w-32 h-3.5" />
            <Bar className="w-12 h-3.5" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 border-b border-zinc-100"
            >
              <Bar className={cn("h-3", i % 2 === 0 ? "w-20" : "w-16")} />
              <Bar className="w-6 h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
