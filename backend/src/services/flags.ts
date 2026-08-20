/**
 * Flag listing shared by the flag routes and org search.
 *
 * ListFeatureFlags returns definitions with `whitelisted_orgs` and
 * `blacklisted_orgs` empty on every row — the agent only populates the org
 * lists for GetFeatureFlag. Anything that needs to reason about org overrides
 * therefore has to re-read each flag individually; `listFlagsWithOrgs` does
 * that fan-out.
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  FeatureFlag,
  GetFeatureFlagResponse,
  ListFeatureFlagsResponse,
  toFeatureFlag,
} from '../grpc/types';

// Rows whose enum value the agent can't name come back as the zero value. They
// carry distinct ids but no addressable name, so every route keyed on :flag
// would hit the same nonexistent flag — drop them from the list instead.
const UNNAMED_FLAG = 'FEATURE_FLAG_UNSPECIFIED';

// Backstop for deployments that don't populate FeatureFlagDefinition.is_deprecated.
const DEPRECATED_FLAGS = new Set([
  'FEATURE_FLAG_AUTH_PROXY',
  'FEATURE_FLAG_ACCOUNT_SETTINGS',
  'FEATURE_FLAG_CREATE_PRIVATE_KEY',
  'FEATURE_FLAG_OAUTH',
  'FEATURE_FLAG_SEND_EMAILS',
  'FEATURE_FLAG_SES_EMAIL',
  'FEATURE_FLAG_SUB_ORGS_UI',
]);

// The fan-out is one upstream call per flag, so cap how many are in flight at
// once rather than opening ~40 connections to the agent at the same time.
const MAX_CONCURRENT_READS = 8;

export async function readFlag(
  env: Environment,
  flag: string,
  idToken: string
): Promise<FeatureFlag> {
  const response = await agentCall<{ flag: string }, GetFeatureFlagResponse>(
    env,
    'GetFeatureFlag',
    { flag },
    idToken
  );
  return toFeatureFlag(response.flag);
}

/** ListFeatureFlags, minus the unnamed and deprecated rows. Org lists are empty. */
export async function listFlags(
  env: Environment,
  idToken: string
): Promise<FeatureFlag[]> {
  const response = await agentCall<object, ListFeatureFlagsResponse>(
    env,
    'ListFeatureFlags',
    {},
    idToken
  );
  return (response.flags || [])
    .filter(
      (f) =>
        f.flag &&
        f.flag !== UNNAMED_FLAG &&
        !f.is_deprecated &&
        !DEPRECATED_FLAGS.has(f.flag)
    )
    .map(toFeatureFlag);
}

/**
 * Same list, but with each flag re-read through GetFeatureFlag so its org
 * overrides are populated. Order matches `listFlags`.
 */
export async function listFlagsWithOrgs(
  env: Environment,
  idToken: string
): Promise<FeatureFlag[]> {
  const names = (await listFlags(env, idToken)).map((f) => f.flag);
  const hydrated = new Array<FeatureFlag>(names.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (let i = next++; i < names.length; i = next++) {
      hydrated[i] = await readFlag(env, names[i], idToken);
    }
  }

  // A failed read is not swallowed: reporting "no overrides" for a flag we
  // never actually read is the exact failure this function exists to avoid.
  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_READS, names.length) },
      worker
    )
  );

  return hydrated;
}
