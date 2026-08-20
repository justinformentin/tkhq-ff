import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlagTable } from "./components/FlagTable";
import { FlagDetailPanel } from "./components/FlagDetailPanel";
import { EnvSelector } from "./components/EnvSelector";
import { SearchBar } from "./components/SearchBar";
import { listFlags } from "./api/client";
import type { Environment, FlagSummary } from "./types";
import { ALL_FLAGS } from "./types";
import { Flag, RefreshCw, AlertCircle } from "lucide-react";

export default function App() {
  const [env, setEnv] = useState<Environment>("local");
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterEnabled, setFilterEnabled] = useState<
    "all" | "enabled" | "disabled"
  >("all");

  const {
    data: flags,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["flags", env],
    queryFn: () => listFlags(env),
    // Fall back to static list if backend unavailable
    placeholderData: ALL_FLAGS.map(
      (name): FlagSummary => ({
        name,
        enabled: false,
        rolloutPercent: 0,
        allowCount: 0,
        disallowCount: 0,
      })
    ),
  });

  const filtered = (flags ?? []).filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase());
    const matchEnabled =
      filterEnabled === "all" ||
      (filterEnabled === "enabled" && f.enabled) ||
      (filterEnabled === "disabled" && !f.enabled);
    return matchSearch && matchEnabled;
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Flag className="text-indigo-400" size={20} />
            <h1 className="text-lg font-semibold text-gray-100 tracking-tight">
              Feature Flags
            </h1>
            <span className="text-gray-600 text-sm">/ tkhq</span>
          </div>

          <div className="flex items-center gap-3">
            <EnvSelector value={env} onChange={setEnv} />
            <button
              onClick={() => refetch()}
              className="btn-ghost btn-sm rounded-md"
              disabled={isFetching}
              title="Refresh"
            >
              <RefreshCw
                size={14}
                className={isFetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4 gap-4">
        {/* Left: flag list */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} />
            <div className="flex items-center gap-1 shrink-0">
              {(["all", "enabled", "disabled"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilterEnabled(v)}
                  className={`btn btn-sm rounded-md capitalize ${
                    filterEnabled === v
                      ? "bg-indigo-600 text-white"
                      : "btn-ghost"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {filtered.length} flag{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Error banner */}
          {isError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-700/30 rounded-lg text-red-400 text-sm">
              <AlertCircle size={14} />
              <span>
                Backend unavailable — showing static flag list.{" "}
                {(error as Error)?.message && (
                  <span className="text-red-500/70 text-xs">
                    {(error as Error).message}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Flag table */}
          <FlagTable
            flags={filtered}
            isLoading={isLoading}
            selectedFlag={selectedFlag}
            onSelect={setSelectedFlag}
            env={env}
          />
        </div>

        {/* Right: detail panel */}
        {selectedFlag && (
          <div className="w-[480px] shrink-0">
            <FlagDetailPanel
              flag={selectedFlag}
              env={env}
              onClose={() => setSelectedFlag(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
