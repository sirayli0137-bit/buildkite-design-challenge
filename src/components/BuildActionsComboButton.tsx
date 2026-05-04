import React from "react";
import {
  RefreshCw,
  RotateCcw,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant: "default" | "destructive" | "outline";
}

interface BuildActionsComboButtonProps {
  status: "pending" | "running" | "passed" | "failed" | "canceled" | "complete";
  /** Optional — `App.tsx` omits these; pass to wire actions. */
  onCancelBuild?: () => void;
  onRestartBuild?: () => void;
  onRetryFailedJobs?: () => void;
}

const BuildActionsComboButton: React.FC<BuildActionsComboButtonProps> = ({
  status,
  onCancelBuild,
  onRestartBuild,
  onRetryFailedJobs,
}) => {
  const getPrimaryAction = (): ActionItem | null => {
    switch (status) {
      case "running":
        if (onCancelBuild) {
          return {
            label: "Cancel build",
            onClick: onCancelBuild,
            variant: "outline",
          };
        }
        return null;
      case "failed":
        if (onRetryFailedJobs) {
          return {
            label: "Retry failed jobs",
            icon: RotateCcw,
            onClick: onRetryFailedJobs,
            variant: "default",
          };
        }
        return null;
      case "canceled":
      case "passed":
      case "complete":
        if (onRestartBuild) {
          return {
            label: "Rebuild",
            icon: RefreshCw,
            onClick: onRestartBuild,
            variant: "default",
          };
        }
        return null;
      case "pending":
        if (onRestartBuild) {
          return {
            label: "Start build",
            icon: PlayCircle,
            onClick: onRestartBuild,
            variant: "default",
          };
        }
        return null;
      default:
        return null;
    }
  };

  const getSecondaryActions = (): ActionItem[] => {
    const actions: ActionItem[] = [];
    if (status === "failed" && onRestartBuild) {
      actions.push({
        label: "Rebuild",
        icon: RefreshCw,
        onClick: onRestartBuild,
        variant: "default",
      });
    }
    return actions;
  };

  const primaryAction = getPrimaryAction();
  const secondaryActions = getSecondaryActions();
  const actions: ActionItem[] = [
    ...(primaryAction ? [primaryAction] : []),
    ...secondaryActions,
  ];

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="relative flex flex-1 items-center gap-1 md:flex-none">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={`${action.label}-${index}`}
            type="button"
            onClick={() => action.onClick()}
            className={`inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-gray-300 px-1.5 py-1 text-xs font-medium leading-none shadow-sm transition-colors sm:gap-1.5 sm:px-2.5 sm:text-sm ${
              action.variant === "destructive"
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {Icon && (
              <Icon className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
            )}
            <span className="whitespace-nowrap">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BuildActionsComboButton;
