import type { Environment } from "../types";

interface Props {
  value: Environment;
  onChange: (env: Environment) => void;
}

const ENVS: Environment[] = ["local", "dev", "staging", "prod"];

const ENV_COLORS: Record<Environment, string> = {
  local: "text-gray-400",
  dev: "text-blue-400",
  staging: "text-amber-400",
  prod: "text-red-400",
};

export function EnvSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">Env:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Environment)}
        className={`bg-gray-800 border border-gray-700 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${ENV_COLORS[value]}`}
      >
        {ENVS.map((env) => (
          <option key={env} value={env} className={ENV_COLORS[env]}>
            {env}
          </option>
        ))}
      </select>
    </div>
  );
}
