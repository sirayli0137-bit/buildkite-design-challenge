# Design Engineer Task

A take-home exercise for the Design Engineer role at Buildkite. You'll be working on a CI/CD build header component, specifically the expandable region that appears when you click the PR row.

![The build header in its expanded state](header.png)

Right now this region is placeholder. Your job is to replace it with something useful. A developer looking at a failed build needs to quickly understand **what happened, where it broke, and where to look next**.

## How this works

- Complete this on your own time, in your own environment. It is not a live coding session.
- Spend **no more than 1-2 hours**. This isn't meant to be a finished product. We want to see the beginnings of how you work: what you prioritize, how you structure things, what choices you make.
- **Use whatever tools you want.** Cursor, Claude, Copilot, your own snippets. We care about what you build/design and whether you can explain it.
- You'll **walk us through your solution** in a follow-up conversation. We'll ask about your decisions, tradeoffs, and what you'd do differently with more time. That conversation matters as much as the code.

## Quick start

```bash
npm ci
npm run dev    # http://localhost:5173
```

## The task

Open `src/components/BuildHeader.tsx` and search for **`DESIGN ENGINEER TASK`**. That's the placeholder you're replacing.

The data comes from `src/data/mockBuildSteps.ts`: a 6-step pipeline with a realistic failure where tests fail on Node 18, blocking downstream steps. The collapsed progress bar gives an at-a-glance status. The expanded region you're building is where an engineer might go to gain more understanding, and the list of steps below the header is where they will dive deeper into a specific step.

Think about the shape of the pipeline, which information should be elevated and glanceable, and what's relevant vs noise.
But also consider the space available and what's appropriate in this area.

## Key files

| File | What it does |
|------|-------------|
| `src/components/BuildHeader.tsx` | Header UI: expand/collapse, progress bar, **your task placeholder**. |
| `src/data/mockBuildSteps.ts` | Mock pipeline data. The dataset for the expanded view. |
| `src/types/build.ts` | `BuildStep` and `Job` types. Extend as needed. |
| `src/App.tsx` | Mounts `BuildHeader` with mock data. Entry point. |
| `src/lib/buildStatus.ts` | Status helpers: labels, colors, duration parsing, build stats. |
| `src/lib/utils.ts` | `cn()` Tailwind class merge utility. |

There's no backend, all data is mocked. Breadcrumbs, action buttons, and the page skeleton below the header are layout stubs. No requirement to modify them, unless you feel the need to.

See `AGENTS.md` for a full technical reference (utility signatures, data shape, design patterns).

## What we're evaluating

**From your submission:**

- **Information hierarchy** - is the expanded view scannable? Does it surface what matters?
- **Interaction design** - does it feel right? Are states clear?
- **Accessibility** - semantic markup, keyboard support, screen reader consideration.
- **Design sensibility** - did you make good choices about what to show and how?

**From the walkthrough:**

- **Design rationale** - why did you choose this layout, this hierarchy, this level of detail? How did you decide what belongs here vs what doesn't?
- **Technical understanding** - can you explain your code and reason about it?
- **Tradeoffs** - what did you prioritize and why? What would you do differently with more time?
- **Collaboration instinct** - could a teammate review this PR and follow your thinking?

## Constraints

- Stack: React 18 + TypeScript + Tailwind CSS. `lucide-react` for icons.
- Path alias: `@` maps to `src/` (e.g. `import { cn } from "@/lib/utils"`).
- You can add npm packages if they help, but the existing stack covers most needs.
- `npm run build` and `npm run lint` should still pass when you're done.

We're not evaluating pixel-perfection, production-readiness, or backend integration.
