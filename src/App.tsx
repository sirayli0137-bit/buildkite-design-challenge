import { useMemo, useState } from "react";
import BuildHeader from "@/components/BuildHeader";
import PageSkeleton from "@/components/PageSkeleton";
import {
  mockBuildSteps,
  multiFailScenarioSteps,
  stuckScenarioSteps,
  verifiedScenarioSteps,
} from "@/data/mockBuildSteps";
import type { BuildStep } from "@/types/build";

type BuildStatus = "pending" | "running" | "passed" | "failed" | "canceled" | "complete";

function getScenarioForVariant(variant: number): {
  steps: BuildStep[];
  status: BuildStatus;
} {
  switch (variant) {
    case 8:
      return { steps: stuckScenarioSteps, status: "running" };
    case 9:
      return { steps: verifiedScenarioSteps, status: "passed" };
    case 11:
      return { steps: multiFailScenarioSteps, status: "failed" };
    default:
      return { steps: mockBuildSteps, status: "failed" };
  }
}

type VariantId = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12;

const VARIANTS: { id: VariantId; label: string; description: string }[] = [
  { id: 2, label: "Option 2 — Zoned", description: "Background fills · section labels · pills" },
  { id: 3, label: "Option 3 — Sectioned", description: "Card · What failed / What it blocks / What to do · compact pipeline" },
  { id: 4, label: "Option 4 — Merged", description: "V3 card + V2 blast radius + flaky badge + copy summary" },
  { id: 5, label: "Option 5 — Native", description: "Buildkite product style · circle pips · rounded-md cards · shared button system" },
  { id: 6, label: "Option 6 — Refined", description: "V3 + critique fixes · flaky · copy · retry+preview · AI button · blocked vs pending · status-aware" },
  { id: 7, label: "Option 7 — Horizontal rows", description: "One row per failure · 14px max · 2 sizes · WCAG AA · scales to N failures" },
  { id: 8, label: "Option 7.1 — Stuck build", description: "Scenario 2B · duration anomaly · retry + cancel" },
  { id: 9, label: "Option 7.2 — Verified", description: "Scenario 1+2 · post-fix · previously failing → now passing" },
  { id: 11, label: "Option 7.4 — Multi-failure", description: "Parallel failures stacked · per-row actions" },
  { id: 12, label: "Option 7.5 — Cross-build", description: "Scenario 4 · aggregation banner · pattern across builds" },
];

function App() {
  const [triageVariant, setTriageVariant] = useState<VariantId>(7);

  const scenario = useMemo(
    () => getScenarioForVariant(triageVariant),
    [triageVariant]
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Variant switcher */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1 flex-wrap">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => setTriageVariant(v.id)}
            className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all ${
              triageVariant === v.id
                ? "bg-blue-600 border-blue-700 text-white shadow-sm"
                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <span className="text-xs font-semibold leading-none">{v.label}</span>
            <span className={`text-[10px] leading-none mt-1 ${triageVariant === v.id ? "text-blue-100" : "text-zinc-400"}`}>
              {v.description}
            </span>
          </button>
        ))}
      </div>

      <BuildHeader
        pipelineName="api-backend"
        buildNumber="17532"
        branch="main"
        pullRequest={{
          number: 4821,
          title: "Harden auth token validation for Node 20",
          triggeredAt: "Today at 1:49 PM",
          author: { name: "Alex Rivera" },
        }}
        buildSteps={scenario.steps}
        status={scenario.status}
        triageVariant={triageVariant}
      />
      <PageSkeleton />
    </div>
  );
}

export default App;
