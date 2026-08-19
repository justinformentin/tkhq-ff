import { clsx } from "clsx";
import type { Environment, FlagSummary } from "../types";
import { prettyFlagName } from "../utils/flagName";
import { ChevronRight } from "lucide-react";

interface Props {
  flags: FlagSummary[];
  isLoading: boolean;
  selectedFlag: string | null;
  onSelect: (flag: string) => void;
  env: Environment;
}

export function FlagTable({
  flags,
  isLoading,
  selectedFlag,
  onSelect,
}: Props) {
  if (isLoading) {
    return (
      <div className="card overflow-hidden animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-gray-800 px-4 py-3 flex items-center gap-4"
          >
            <div className="w-4 h-4 bg-gray-800 rounded" />
            <div className="flex-1 h-4 bg-gray-800 rounded" />
            <div className="w-16 h-4 bg-gray-800 rounded" />
            <div className="w-12 h-4 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="card px-4 py-12 text-center text-gray-500 text-sm">
        No flags found
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_80px_80px_80px_24px] gap-2 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider font-medium">
        <span>Flag</span>
        <span className="text-center">Status</span>
        <span className="text-center">Rollout</span>
        <span className="text-center">Allow</span>
        <span className="text-center">Deny</span>
        <span />
      </div>

      {/* Rows */}
      <div className="overflow-y-auto max-h-[calc(100vh-160px)]">
        {flags.map((flag) => (
          <FlagRow
            key={flag.name}
            flag={flag}
            isSelected={selectedFlag === flag.name}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function FlagRow({
  flag,
  isSelected,
  onSelect,
}: {
  flag: FlagSummary;
  isSelected: boolean;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(flag.name)}
      className={clsx(
        "w-full grid grid-cols-[1fr_100px_80px_80px_80px_24px] gap-2 items-center px-4 py-2.5 border-b border-gray-800/50 text-left transition-colors hover:bg-gray-800/50 group",
        isSelected && "bg-indigo-950/40 border-l-2 border-l-indigo-500"
      )}
    >
      {/* Flag name */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-gray-200 truncate">
          {prettyFlagName(flag.name)}
        </span>
        <span className="text-xs text-gray-600 truncate font-mono">
          {flag.name}
        </span>
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <StatusBadge enabled={flag.enabled} />
      </div>

      {/* Rollout */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-medium text-gray-300">
          {flag.rolloutPercent}%
        </span>
        <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${flag.rolloutPercent}%` }}
          />
        </div>
      </div>

      {/* Allow count */}
      <div className="text-center">
        {flag.allowCount > 0 ? (
          <span className="badge-green text-xs">{flag.allowCount}</span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </div>

      {/* Disallow count */}
      <div className="text-center">
        {flag.disallowCount > 0 ? (
          <span className="badge-red text-xs">{flag.disallowCount}</span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight
        size={14}
        className={clsx(
          "transition-colors",
          isSelected ? "text-indigo-400" : "text-gray-700 group-hover:text-gray-500"
        )}
      />
    </button>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return <span className="badge-green">Enabled</span>;
  }
  return <span className="badge-red">Disabled</span>;
}
