import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, Loader2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import {
  getFlag,
  setFlag,
  allowOrg,
  disallowOrg,
  removeOrg,
  allowProduct,
  disallowProduct,
  removeProduct,
} from "../api/client";
import type {
  Environment,
  FlagDetail,
  OrgRule,
  ProductRule,
} from "../types";
import { PRODUCT_TYPES, ENTERPRISE_SUB_TYPES } from "../types";
import { prettyFlagName } from "../utils/flagName";

interface Props {
  flag: string;
  env: Environment;
  onClose: () => void;
}

export function FlagDetailPanel({ flag, env, onClose }: Props) {
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["flag", flag, env],
    queryFn: () => getFlag(flag, env),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["flag", flag, env] });
    qc.invalidateQueries({ queryKey: ["flags", env] });
  }

  return (
    <div className="card flex flex-col h-[calc(100vh-80px)] sticky top-[64px] overflow-hidden">
      {/* Panel header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-100 truncate">
            {prettyFlagName(flag)}
          </h2>
          <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
            {flag}
          </p>
        </div>
        <button onClick={onClose} className="btn-ghost btn-sm ml-2 shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {isError && (
          <div className="p-4">
            <div className="px-3 py-2 bg-red-900/20 border border-red-700/30 rounded-lg text-red-400 text-xs">
              {(error as Error)?.message || "Failed to load flag details"}
            </div>
            <RawFallback flag={flag} env={env} onMutate={invalidate} />
          </div>
        )}

        {data && (
          <DetailContent
            data={data}
            env={env}
            flag={flag}
            onMutate={invalidate}
          />
        )}
      </div>
    </div>
  );
}

// When the backend can't parse CLI output, show mutation controls anyway
function RawFallback({
  flag,
  env,
  onMutate,
}: {
  flag: string;
  env: Environment;
  onMutate: () => void;
}) {
  return (
    <div className="mt-4">
      <SetFlagControls flag={flag} env={env} detail={null} onMutate={onMutate} />
    </div>
  );
}

function DetailContent({
  data,
  env,
  flag,
  onMutate,
}: {
  data: FlagDetail;
  env: Environment;
  flag: string;
  onMutate: () => void;
}) {
  return (
    <div className="flex flex-col divide-y divide-gray-800">
      {/* Global controls */}
      <section className="px-4 py-4">
        <SetFlagControls
          flag={flag}
          env={env}
          detail={data}
          onMutate={onMutate}
        />
      </section>

      {/* Org rules */}
      <section className="px-4 py-4">
        <OrgSection
          flag={flag}
          env={env}
          orgRules={data.orgRules}
          onMutate={onMutate}
        />
      </section>

      {/* Product rules */}
      <section className="px-4 py-4">
        <ProductSection
          flag={flag}
          env={env}
          productRules={data.productRules}
          onMutate={onMutate}
        />
      </section>

      {/* Raw output (collapsible) */}
      {data.rawOutput && (
        <section className="px-4 py-4">
          <RawOutput output={data.rawOutput} />
        </section>
      )}
    </div>
  );
}

function SetFlagControls({
  flag,
  env,
  detail,
  onMutate,
}: {
  flag: string;
  env: Environment;
  detail: FlagDetail | null;
  onMutate: () => void;
}) {
  const [localEnabled, setLocalEnabled] = useState<boolean>(
    detail?.enabled ?? false
  );
  const [localPercent, setLocalPercent] = useState<number>(
    detail?.rolloutPercent ?? 0
  );
  const [isDirty, setIsDirty] = useState(false);

  const mutation = useMutation({
    mutationFn: () => setFlag(flag, env, localEnabled, localPercent),
    onSuccess: () => {
      setIsDirty(false);
      onMutate();
    },
  });

  function handleToggle() {
    setLocalEnabled((prev) => !prev);
    setIsDirty(true);
  }

  function handlePercent(v: number) {
    setLocalPercent(v);
    setIsDirty(true);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Global Settings
      </h3>

      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">Global Enabled</p>
          <p className="text-xs text-gray-500">
            When disabled, no org can access this flag
          </p>
        </div>
        <Toggle
          checked={localEnabled}
          onChange={handleToggle}
          loading={mutation.isPending}
        />
      </div>

      {/* Rollout percent */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-200">Rollout %</p>
          <span className="text-sm font-mono text-indigo-400 font-semibold">
            {localPercent}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={localPercent}
          onChange={(e) => handlePercent(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Save button */}
      {isDirty && (
        <button
          className="btn-primary w-full justify-center"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          Save Changes
        </button>
      )}

      {mutation.isError && (
        <p className="text-xs text-red-400">
          {(mutation.error as Error)?.message || "Save failed"}
        </p>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  loading,
}: {
  checked: boolean;
  onChange: () => void;
  loading?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={loading}
      className={clsx(
        "relative inline-flex w-11 h-6 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50",
        checked ? "bg-indigo-600" : "bg-gray-700"
      )}
    >
      <span
        className={clsx(
          "inline-block w-4 h-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function OrgSection({
  flag,
  env,
  orgRules,
  onMutate,
}: {
  flag: string;
  env: Environment;
  orgRules: OrgRule[];
  onMutate: () => void;
}) {
  const [newOrgId, setNewOrgId] = useState("");
  const [addMode, setAddMode] = useState<"allow" | "disallow">("allow");

  const allowList = orgRules.filter((o) => o.enabled);
  const disallowList = orgRules.filter((o) => !o.enabled);

  const addMutation = useMutation({
    mutationFn: () =>
      addMode === "allow"
        ? allowOrg(flag, env, newOrgId.trim())
        : disallowOrg(flag, env, newOrgId.trim()),
    onSuccess: () => {
      setNewOrgId("");
      onMutate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (orgId: string) => removeOrg(flag, env, orgId),
    onSuccess: onMutate,
  });

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Org Rules
      </h3>

      {/* Allow list */}
      <OrgList
        title="Allow List"
        orgs={allowList}
        color="green"
        onRemove={(orgId) => removeMutation.mutate(orgId)}
        removing={removeMutation.isPending}
      />

      {/* Disallow list */}
      <OrgList
        title="Disallow List"
        orgs={disallowList}
        color="red"
        onRemove={(orgId) => removeMutation.mutate(orgId)}
        removing={removeMutation.isPending}
      />

      {/* Add org */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Add org:</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Org UUID"
            value={newOrgId}
            onChange={(e) => setNewOrgId(e.target.value)}
            className="input flex-1 font-mono text-xs"
          />
          <select
            value={addMode}
            onChange={(e) => setAddMode(e.target.value as "allow" | "disallow")}
            className="bg-gray-800 border border-gray-700 rounded-md text-xs px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-300"
          >
            <option value="allow">Allow</option>
            <option value="disallow">Disallow</option>
          </select>
          <button
            className="btn-primary btn-sm shrink-0"
            disabled={!newOrgId.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={12} />
            )}
          </button>
        </div>
        {addMutation.isError && (
          <p className="text-xs text-red-400">
            {(addMutation.error as Error)?.message || "Add failed"}
          </p>
        )}
      </div>
    </div>
  );
}

function OrgList({
  title,
  orgs,
  color,
  onRemove,
  removing,
}: {
  title: string;
  orgs: OrgRule[];
  color: "green" | "red";
  onRemove: (orgId: string) => void;
  removing: boolean;
}) {
  if (orgs.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{title}:</p>
      <div className="space-y-1">
        {orgs.map((org) => (
          <div
            key={org.orgId}
            className={clsx(
              "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono",
              color === "green"
                ? "bg-emerald-900/20 border border-emerald-700/20 text-emerald-400"
                : "bg-red-900/20 border border-red-700/20 text-red-400"
            )}
          >
            <span className="truncate">{org.orgId}</span>
            <button
              onClick={() => onRemove(org.orgId)}
              disabled={removing}
              className="ml-2 shrink-0 text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductSection({
  flag,
  env,
  productRules,
  onMutate,
}: {
  flag: string;
  env: Environment;
  productRules: ProductRule[];
  onMutate: () => void;
}) {
  const [newType, setNewType] = useState<string>(PRODUCT_TYPES[0]);
  const [newSubType, setNewSubType] = useState<string>("");
  const [addMode, setAddMode] = useState<"allow" | "disallow">("allow");

  const addMutation = useMutation({
    mutationFn: () =>
      addMode === "allow"
        ? allowProduct(flag, env, newType, newSubType || undefined)
        : disallowProduct(flag, env, newType, newSubType || undefined),
    onSuccess: onMutate,
  });

  const removeMutation = useMutation({
    mutationFn: ({
      type,
      subType,
    }: {
      type: string;
      subType?: string;
    }) => removeProduct(flag, env, type, subType),
    onSuccess: onMutate,
  });

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Product Rules
      </h3>

      {/* Existing rules */}
      {productRules.length > 0 ? (
        <div className="space-y-1">
          {productRules.map((rule, i) => (
            <div
              key={i}
              className={clsx(
                "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs",
                rule.enabled
                  ? "bg-emerald-900/20 border border-emerald-700/20 text-emerald-400"
                  : "bg-red-900/20 border border-red-700/20 text-red-400"
              )}
            >
              <span className="font-medium">
                {rule.productType}
                {rule.productSubType && (
                  <span className="text-gray-500 ml-1">
                    / {rule.productSubType}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "text-xs",
                    rule.enabled ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {rule.enabled ? "allow" : "disallow"}
                </span>
                <button
                  onClick={() =>
                    removeMutation.mutate({
                      type: rule.productType,
                      subType: rule.productSubType,
                    })
                  }
                  disabled={removeMutation.isPending}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600">No product rules</p>
      )}

      {/* Add product rule */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Add product rule:</p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={newType}
            onChange={(e) => {
              setNewType(e.target.value);
              setNewSubType("");
            }}
            className="bg-gray-800 border border-gray-700 rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-300"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {newType === "enterprise" ? (
            <select
              value={newSubType}
              onChange={(e) => setNewSubType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-300"
            >
              <option value="">All enterprise</option>
              {ENTERPRISE_SUB_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <div />
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={addMode}
            onChange={(e) =>
              setAddMode(e.target.value as "allow" | "disallow")
            }
            className="bg-gray-800 border border-gray-700 rounded-md text-xs px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-300"
          >
            <option value="allow">Allow</option>
            <option value="disallow">Disallow</option>
          </select>
          <button
            className="btn-primary btn-sm shrink-0"
            disabled={addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={12} />
            )}
            Add
          </button>
        </div>

        {addMutation.isError && (
          <p className="text-xs text-red-400">
            {(addMutation.error as Error)?.message || "Add failed"}
          </p>
        )}
      </div>
    </div>
  );
}

function RawOutput({ output }: { output: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors"
      >
        <ChevronDown
          size={12}
          className={clsx("transition-transform", open && "rotate-180")}
        />
        Raw CLI output
      </button>
      {open && (
        <pre className="mt-2 p-3 bg-gray-950 border border-gray-800 rounded-md text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-all">
          {output}
        </pre>
      )}
    </div>
  );
}
