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
    const output = execSync(cmd, {
      env: {
        ...process.env,
        OPERATOR_AGENT_PROTOCOL: "grpc",
      },
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

// Parse the output of `tkinfra ff list`
// Expected output format (lines like):
//   FEATURE_FLAG_SEND_SMS: enabled=true percent=100
//   FEATURE_FLAG_FIAT_ON_RAMP_COINBASE: enabled=false percent=0
// Actual format may vary — we handle multiple known patterns
export function parseListOutput(output: string): FlagSummary[] {
  const lines = output.split("\n").filter((l) => l.trim());
  const flags: FlagSummary[] = [];

  for (const line of lines) {
    // Skip header lines or empty lines
    if (!line.includes("FEATURE_FLAG_")) continue;

    // Try to match: FEATURE_FLAG_NAME enabled=true percent=50 orgs_allow=2 orgs_disallow=1
    const nameMatch = line.match(/FEATURE_FLAG_\w+/);
    if (!nameMatch) continue;

    const name = nameMatch[0];
    const enabledMatch = line.match(/enabled\s*[:=]\s*(true|false)/i);
    const percentMatch = line.match(/percent\s*[:=]\s*(\d+)/i);
    const allowMatch = line.match(/(?:orgs?_allow|allow_count)\s*[:=]\s*(\d+)/i);
    const disallowMatch = line.match(
      /(?:orgs?_disallow|disallow_count)\s*[:=]\s*(\d+)/i
    );

    flags.push({
      name,
      enabled: enabledMatch ? enabledMatch[1].toLowerCase() === "true" : false,
      rolloutPercent: percentMatch ? parseInt(percentMatch[1], 10) : 0,
      allowCount: allowMatch ? parseInt(allowMatch[1], 10) : 0,
      disallowCount: disallowMatch ? parseInt(disallowMatch[1], 10) : 0,
    });
  }

  return flags;
}

// Parse the output of `tkinfra ff get -f FLAG`
export function parseGetOutput(flagName: string, output: string): FlagDetail {
  const lines = output.split("\n").filter((l) => l.trim());

  const enabledMatch = output.match(/enabled\s*[:=]\s*(true|false)/i);
  const percentMatch = output.match(/(?:rollout_)?percent\s*[:=]\s*(\d+)/i);

  const orgRules: OrgRule[] = [];
  const productRules: ProductRule[] = [];

  // Parse org rules - look for UUID-like patterns with allow/disallow
  for (const line of lines) {
    // Org line: org_id=<uuid> enabled=true|false  or  allow: <uuid>  or  disallow: <uuid>
    const orgUuidMatch = line.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );
    if (orgUuidMatch) {
      const orgEnabled =
        line.match(/enabled\s*[:=]\s*(true|false)/i)?.[1]?.toLowerCase() ===
          "true" ||
        /\ballow\b/i.test(line.replace(/disallow/gi, ""));
      const isDisallow = /\bdisallow\b/i.test(line);
      orgRules.push({
        orgId: orgUuidMatch[1],
        enabled: !isDisallow,
      });
      continue;
    }

    // Product rules: type=free sub_type=scale enabled=true
    const productTypeMatch = line.match(
      /(?:product_)?type\s*[:=]\s*(\w+)/i
    );
    if (productTypeMatch) {
      const subTypeMatch = line.match(/sub_?type\s*[:=]\s*(\w+)/i);
      const prodEnabled =
        line.match(/enabled\s*[:=]\s*(true|false)/i)?.[1]?.toLowerCase() ===
        "true";
      const isDisallow = /\bdisallow\b/i.test(line);
      productRules.push({
        productType: productTypeMatch[1],
        productSubType: subTypeMatch?.[1],
        enabled: !isDisallow,
      });
    }
  }

  const detail: FlagDetail = {
    name: flagName,
    enabled: enabledMatch
      ? enabledMatch[1].toLowerCase() === "true"
      : false,
    rolloutPercent: percentMatch ? parseInt(percentMatch[1], 10) : 0,
    allowCount: orgRules.filter((o) => o.enabled).length,
    disallowCount: orgRules.filter((o) => !o.enabled).length,
    orgRules,
    productRules,
    rawOutput: output,
  };

  return detail;
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
