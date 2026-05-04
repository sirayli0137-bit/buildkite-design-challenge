import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type OpenMenu = "pipeline" | "branch" | "build" | "more" | null;

export interface HeaderBreadcrumbStubsProps {
  pipelineName: string;
  branch: string;
  buildNumberLabel: string;
}

/**
 * Minimal breadcrumb chrome (stub menus, no backend). Kept visually quiet so
 * candidates focus on the expandable task area below.
 */
export function HeaderBreadcrumbStubs({
  pipelineName,
  branch,
  buildNumberLabel,
}: HeaderBreadcrumbStubsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<OpenMenu>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pipelineOptions = useMemo(
    () => [pipelineName, "pr-validation", "release"],
    [pipelineName],
  );
  const branchOptions = useMemo(
    () => [branch, "develop", "hotfix/cache"],
    [branch],
  );
  const buildOptions = useMemo(
    () => [buildNumberLabel, "#17531", "#17530"],
    [buildNumberLabel],
  );
  const moreOptions = useMemo(
    () => ["Settings", "Edit pipeline", "View YAML", "Documentation"],
    [],
  );

  const toggle = (id: Exclude<OpenMenu, null>) =>
    setOpen((cur) => (cur === id ? null : id));

  return (
    <div
      ref={rootRef}
      className="flex min-w-0 flex-1 items-center justify-between gap-2"
    >
      <nav
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] leading-tight text-zinc-700"
        aria-label="Pipeline context"
      >
        <StubCrumb
          id="pipeline"
          label={pipelineName}
          isOpen={open === "pipeline"}
          onToggle={() => toggle("pipeline")}
          options={pipelineOptions}
          onCloseMenu={() => setOpen(null)}
        />
        <span className="select-none text-zinc-300" aria-hidden>
          /
        </span>
        <StubCrumb
          id="branch"
          label={branch}
          isOpen={open === "branch"}
          onToggle={() => toggle("branch")}
          options={branchOptions}
          onCloseMenu={() => setOpen(null)}
        />
        <span className="select-none text-zinc-300" aria-hidden>
          /
        </span>
        <StubCrumb
          id="build"
          label={buildNumberLabel}
          isOpen={open === "build"}
          onToggle={() => toggle("build")}
          options={buildOptions}
          onCloseMenu={() => setOpen(null)}
        />
      </nav>

      <div className="relative align-self-center">
        <button
          type="button"
          className={cn(
            "flex p-1 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600",
            open === "more" && "bg-zinc-100 text-zinc-600",
          )}
          aria-expanded={open === "more"}
          aria-label="Pipeline options"
          onClick={(e) => {
            e.stopPropagation();
            toggle("more");
          }}
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
        </button>
        {open === "more" && (
          <MenuPanel align="right">
            {moreOptions.map((opt) => (
              <MenuRow key={opt} onPick={() => setOpen(null)}>
                {opt}
              </MenuRow>
            ))}
          </MenuPanel>
        )}
      </div>
    </div>
  );
}

function StubCrumb({
  id,
  label,
  isOpen,
  onToggle,
  options,
  onCloseMenu,
}: {
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  options: string[];
  onCloseMenu: () => void;
}) {
  return (
    <div className="relative min-w-0 max-w-[min(42vw,11rem)]">
      <button
        type="button"
        id={`breadcrumb-${id}-trigger`}
        className={cn(
          "inline-flex max-w-full items-center gap-0.5 truncate rounded px-1 py-0.5 text-left font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900",
          isOpen && "bg-zinc-100/80 text-zinc-900",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-zinc-400 transition-transform",
            isOpen && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>
      {isOpen && (
        <MenuPanel align="left">
          {options.map((opt) => (
            <MenuRow key={opt} onPick={onCloseMenu}>
              {opt}
            </MenuRow>
          ))}
        </MenuPanel>
      )}
    </div>
  );
}

function MenuPanel({
  align,
  children,
}: {
  align: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute z-[60] mt-1 min-w-[9rem] rounded-md border border-zinc-200/90 bg-white py-0.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
        align === "left" ? "left-0" : "right-0",
      )}
      role="listbox"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function MenuRow({
  children,
  onPick,
}: {
  children: ReactNode;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      className="block w-full px-2.5 py-1.5 text-left text-[13px] text-zinc-700 hover:bg-zinc-50"
      onClick={(e) => {
        e.stopPropagation();
        onPick();
      }}
    >
      {children}
    </button>
  );
}
