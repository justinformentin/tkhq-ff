import axios from 'axios';
import type { FeatureFlag, ListFlagsResponse, GetFlagResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function listFlags(): Promise<FeatureFlag[]> {
  const res = await api.get<ListFlagsResponse>('/flags');
  return res.data.flags;
}

export async function getFlag(flag: string): Promise<FeatureFlag> {
  const res = await api.get<GetFlagResponse>(`/flags/${flag}`);
  return res.data.flag;
}

export async function setFlag(
  flag: string,
  enabled: boolean,
  rollout_percent: number
): Promise<FeatureFlag> {
  const res = await api.put<GetFlagResponse>(`/flags/${flag}`, {
    enabled,
    rollout_percent,
  });
  return res.data.flag;
}

export async function addFlagOrg(
  flag: string,
  org_id: string,
  enabled: boolean
): Promise<FeatureFlag> {
  const res = await api.post<GetFlagResponse>(`/flags/${flag}/orgs`, {
    org_id,
    enabled,
  });
  return res.data.flag;
}

export async function removeFlagOrg(
  flag: string,
  org_id: string
): Promise<FeatureFlag> {
  const res = await api.delete<GetFlagResponse>(
    `/flags/${flag}/orgs/${org_id}`
  );
  return res.data.flag;
}

export async function addFlagProduct(
  flag: string,
  product_type: number,
  product_sub_type: number,
  enabled: boolean
): Promise<FeatureFlag> {
  const res = await api.post<GetFlagResponse>(`/flags/${flag}/products`, {
    product_type,
    product_sub_type,
    enabled,
  });
  return res.data.flag;
}

export async function removeFlagProduct(
  flag: string,
  product_type: number,
  product_sub_type: number
): Promise<FeatureFlag> {
  const res = await api.delete<GetFlagResponse>(
    `/flags/${flag}/products/${product_type}/${product_sub_type}`
  );
  return res.data.flag;
}
