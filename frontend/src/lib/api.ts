import axios from 'axios';
import type { FeatureFlag, ListFlagsResponse, GetFlagResponse } from '../types';
import type { Environment } from './environment';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Every request names the environment it targets; the backend rejects
// anything it doesn't recognize rather than guessing.
function forEnv(env: Environment) {
  return { params: { env } };
}

export async function listFlags(env: Environment): Promise<FeatureFlag[]> {
  const res = await api.get<ListFlagsResponse>('/flags', forEnv(env));
  return res.data.flags;
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
