import axios from 'axios';
import type {
  FeatureFlag,
  ListFlagsResponse,
  GetFlagResponse,
  OrgFlagMatch,
  OrgSearchResponse,
} from '../types';
import type { Environment } from './environment';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  // The session lives in an httpOnly cookie when the backend runs in oidc mode.
  withCredentials: true,
});

export interface Identity {
  /** 'session' = signed in here; 'tkinfra' = borrowed from the CLI's cache. */
  source: 'session' | 'tkinfra';
  user: { username?: string; email?: string; name?: string };
}

export async function getIdentity(): Promise<Identity> {
  const res = await api.get<Identity>('/auth/me');
  return res.data;
}

export async function logout(): Promise<string | null> {
  const res = await api.post<{ logoutUrl: string | null }>('/auth/logout');
  return res.data.logoutUrl;
}

// Every request names the environment it targets; the backend rejects
// anything it doesn't recognize rather than guessing.
function forEnv(env: Environment) {
  return { params: { env } };
}

// The upstream list RPC leaves every flag's org lists empty, so anything that
// renders override counts has to ask for `with_orgs` — it costs the backend one
// extra read per flag.
export async function listFlags(
  env: Environment,
  withOrgs = false
): Promise<FeatureFlag[]> {
  const res = await api.get<ListFlagsResponse>('/flags', {
    params: { env, ...(withOrgs ? { with_orgs: 'true' } : {}) },
  });
  return res.data.flags;
}

// Org overrides are only populated by the per-flag read, so this search runs
// on the backend rather than by filtering the flag list here.
export async function searchOrg(
  org_id: string,
  env: Environment
): Promise<OrgFlagMatch[]> {
  const res = await api.get<OrgSearchResponse>(
    `/orgs/${encodeURIComponent(org_id)}/flags`,
    forEnv(env)
  );
  return res.data.matches;
}

export async function getFlag(
  flag: string,
  env: Environment
): Promise<FeatureFlag> {
  const res = await api.get<GetFlagResponse>(`/flags/${flag}`, forEnv(env));
  return res.data.flag;
}

export async function setFlag(
  flag: string,
  env: Environment,
  enabled: boolean,
  rollout_percent: number
): Promise<FeatureFlag> {
  const res = await api.put<GetFlagResponse>(
    `/flags/${flag}`,
    { enabled, rollout_percent },
    forEnv(env)
  );
  return res.data.flag;
}

export async function addFlagOrg(
  flag: string,
  env: Environment,
  org_id: string,
  enabled: boolean
): Promise<FeatureFlag> {
  const res = await api.post<GetFlagResponse>(
    `/flags/${flag}/orgs`,
    { org_id, enabled },
    forEnv(env)
  );
  return res.data.flag;
}

export async function removeFlagOrg(
  flag: string,
  env: Environment,
  org_id: string
): Promise<FeatureFlag> {
  const res = await api.delete<GetFlagResponse>(
    `/flags/${flag}/orgs/${org_id}`,
    forEnv(env)
  );
  return res.data.flag;
}

export async function addFlagProduct(
  flag: string,
  env: Environment,
  product_type: string,
  product_sub_type: string,
  enabled: boolean
): Promise<FeatureFlag> {
  const res = await api.post<GetFlagResponse>(
    `/flags/${flag}/products`,
    { product_type, product_sub_type, enabled },
    forEnv(env)
  );
  return res.data.flag;
}

export async function removeFlagProduct(
  flag: string,
  env: Environment,
  product_type: string,
  product_sub_type: string
): Promise<FeatureFlag> {
  const res = await api.delete<GetFlagResponse>(
    `/flags/${flag}/products/${product_type}/${product_sub_type}`,
    forEnv(env)
  );
  return res.data.flag;
}
