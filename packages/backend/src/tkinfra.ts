import { execSync } from "child_process";

export type Environment = "local" | "dev" | "staging" | "prod";

export interface FlagSummary {
  name: string;
  enabled: boolean;
  rolloutPercent: number;
  allowCount: number;
  disallowCount: number;
}

export interface OrgRule {
  orgId: string;
  enabled: boolean; // true=allow, false=disallow
}

export interface ProductRule {
  productType: string;
  productSubType?: string;
  enabled: boolean; // true=allow, false=disallow
}

export interface FlagDetail extends FlagSummary {
  orgRules: OrgRule[];
  productRules: ProductRule[];
  rawOutput?: string;
}

function runTkinfra(args: string, env: Environment = "local"): string {
  const cmd = `tkinfra ff ${args} -e=${env}`;
  try {
    // NOTE: do not force OPERATOR_AGENT_PROTOCOL here. tkinfra defaults to the
    // right transport per environment; pinning it to grpc makes every non-local
    // env fail with "permission denied / server closed the stream".
    const output = execSync(cmd, {
      env: process.env,
      timeout: 30000,
      encoding: "utf8",
    });
    return output.trim();
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const out = (error.stdout || "") + (error.stderr || "");
    throw new Error(
      `tkinfra command failed: ${cmd}\n${out || error.message || String(err)}`
    );
  }
}

// tkinfra colorizes its output; strip escape sequences before matching.
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;

function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, "");
}

// The status line tkinfra prints for a flag, in both `list` and `get`:
//   FEATURE_FLAG_TVC  (ENABLED)  100% Rollout
const STATUS_RE = /^(FEATURE_FLAG_\w+)\s+\((ENABLED|DISABLED)\)\s+(\d+)%/i;

function parseStatusLine(
  line: string
): { name: string; enabled: boolean; rolloutPercent: number } | null {
  const m = line.match(STATUS_RE);
  if (!m) return null;
  return {
    name: m[1],
    enabled: m[2].toUpperCase() === "ENABLED",
    rolloutPercent: parseInt(m[3], 10),
  };
}

// Parse the output of `tkinfra ff list`, one flag per line:
//   FEATURE_FLAG_TVC  (ENABLED)  100% Rollout
//   FEATURE_FLAG_CIRCUIT_BREAKER_EMAIL  (ENABLED)  0% Rollout
// A key=value form is also accepted as a fallback in case the CLI changes.
export function parseListOutput(output: string): FlagSummary[] {
  const flags: FlagSummary[] = [];

  for (const raw of output.split("\n")) {
    const line = stripAnsi(raw).trim();
    if (!line.includes("FEATURE_FLAG_")) continue;

    const status = parseStatusLine(line);
    if (status) {
      // Org/product counts aren't in the list output — `get` fills them in.
      flags.push({ ...status, allowCount: 0, disallowCount: 0 });
      continue;
    }

    // Fallback: FEATURE_FLAG_NAME enabled=true percent=50 orgs_allow=2
    const nameMatch = line.match(/FEATURE_FLAG_\w+/);
    if (!nameMatch) continue;

    const enabledMatch = line.match(/enabled\s*[:=]\s*(true|false)/i);
    const percentMatch = line.match(/percent\s*[:=]\s*(\d+)/i);
    const allowMatch = line.match(/(?:orgs?_allow|allow_count)\s*[:=]\s*(\d+)/i);
    const disallowMatch = line.match(
      /(?:orgs?_disallow|disallow_count)\s*[:=]\s*(\d+)/i
    );

    flags.push({
      name: nameMatch[0],
      enabled: enabledMatch ? enabledMatch[1].toLowerCase() === "true" : false,
      rolloutPercent: percentMatch ? parseInt(percentMatch[1], 10) : 0,
      allowCount: allowMatch ? parseInt(allowMatch[1], 10) : 0,
      disallowCount: disallowMatch ? parseInt(disallowMatch[1], 10) : 0,
    });
  }

  return flags;
}

// Parse the output of `tkinfra ff get -f FLAG`:
//
//   FEATURE_FLAG_TVC  (ENABLED)  100% Rollout
//   Whitelisted Orgs ✅:
//     - 69febc39-7ac1-42c1-9786-f20f9cc52c5b
//   Blacklisted Orgs ❌:
//     (none)
//   Whitelisted Products ✅:
//     (none)
//   Blacklisted Products ❌:
//     (none)
const SECTION_RE = /^(Whitelisted|Blacklisted)\s+(Orgs|Products)\b/i;
const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function parseGetOutput(flagName: string, output: string): FlagDetail {
  const orgRules: OrgRule[] = [];
  const productRules: ProductRule[] = [];

  let enabled = false;
  let rolloutPercent = 0;
  // null until a section header is seen; true=whitelist, false=blacklist
  let sectionAllows: boolean | null = null;
  let sectionKind: "orgs" | "products" | null = null;

  for (const raw of output.split("\n")) {
    const line = stripAnsi(raw).trim();
    if (!line) continue;

    const status = parseStatusLine(line);
    if (status) {
      enabled = status.enabled;
      rolloutPercent = status.rolloutPercent;
      continue;
    }

    const section = line.match(SECTION_RE);
    if (section) {
      sectionAllows = section[1].toLowerCase() === "whitelisted";
      sectionKind = section[2].toLowerCase() === "orgs" ? "orgs" : "products";
      continue;
    }

    if (sectionAllows === null || line === "(none)") continue;

    const item = line.replace(/^[-*•]\s*/, "").trim();
    if (!item || item === "(none)") continue;

    if (sectionKind === "orgs") {
      const uuid = item.match(UUID_RE);
      if (uuid) orgRules.push({ orgId: uuid[0], enabled: sectionAllows });
      continue;
    }

    // Products render as "TYPE", "TYPE / SUBTYPE", or "TYPE (SUBTYPE)".
    const [productType, productSubType] = item
      .split(/\s*[/(]\s*/)
      .map((part) => part.replace(/\)$/, "").trim())
      .filter(Boolean);
    if (productType) {
      productRules.push({ productType, productSubType, enabled: sectionAllows });
    }
  }

  return {
    name: flagName,
    enabled,
    rolloutPercent,
    allowCount: orgRules.filter((o) => o.enabled).length,
    disallowCount: orgRules.filter((o) => !o.enabled).length,
    orgRules,
    productRules,
    rawOutput: output,
  };
}

// API functions
export function listFlags(env: Environment): FlagSummary[] {
  const output = runTkinfra("list", env);
  return parseListOutput(output);
}

export function getFlag(flag: string, env: Environment): FlagDetail {
  const output = runTkinfra(`get -f ${flag}`, env);
  return parseGetOutput(flag, output);
}

export function setFlag(
  flag: string,
  env: Environment,
  enabled?: boolean,
  percent?: number
): void {
  const parts = [`set -f ${flag}`];
  if (enabled !== undefined) parts.push(`--enabled=${enabled}`);
  if (percent !== undefined) parts.push(`--percent=${percent}`);
  runTkinfra(parts.join(" "), env);
}

export function allowOrg(flag: string, env: Environment, orgId: string): void {
  runTkinfra(`allow -f ${flag} --org ${orgId}`, env);
}

export function disallowOrg(
  flag: string,
  env: Environment,
  orgId: string
): void {
  runTkinfra(`disallow -f ${flag} --org ${orgId}`, env);
}

export function removeOrg(
  flag: string,
  env: Environment,
  orgId: string
): void {
  runTkinfra(`remove -f ${flag} --org ${orgId}`, env);
}

export function allowProduct(
  flag: string,
  env: Environment,
  type: string,
  subType?: string
): void {
  const parts = [`product allow -f ${flag} --type ${type}`];
  if (subType) parts.push(`--sub-type ${subType}`);
  runTkinfra(parts.join(" "), env);
}

export function disallowProduct(
  flag: string,
  env: Environment,
  type: string,
  subType?: string
): void {
  const parts = [`product disallow -f ${flag} --type ${type}`];
  if (subType) parts.push(`--sub-type ${subType}`);
  runTkinfra(parts.join(" "), env);
}

export function removeProduct(
  flag: string,
  env: Environment,
  type: string,
  subType?: string
): void {
  const parts = [`product remove -f ${flag} --type ${type}`];
  if (subType) parts.push(`--sub-type ${subType}`);
  runTkinfra(parts.join(" "), env);
}
