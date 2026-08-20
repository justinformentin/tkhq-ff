import axios from "axios";
import type {
  Environment,
  FlagDetail,
  FlagSummary,
} from "../types";

const BASE_URL = "/api";

const http = axios.create({ baseURL: BASE_URL });

function envParam(env: Environment) {
  return { params: { env } };
}

export async function listFlags(env: Environment): Promise<FlagSummary[]> {
  const res = await http.get<{ flags: FlagSummary[] }>("/flags", envParam(env));
  return res.data.flags;
}

export async function getFlag(
  flag: string,
  env: Environment
): Promise<FlagDetail> {
  const res = await http.get<FlagDetail>(`/flags/${flag}`, envParam(env));
  return res.data;
}

export async function setFlag(
  flag: string,
  env: Environment,
  enabled?: boolean,
  percent?: number
): Promise<void> {
  await http.post(
    `/flags/${flag}/set`,
    { enabled, percent },
    envParam(env)
  );
}

export async function allowOrg(
  flag: string,
  env: Environment,
  orgId: string
): Promise<void> {
  await http.post(`/flags/${flag}/org/allow`, { orgId }, envParam(env));
}

export async function disallowOrg(
  flag: string,
  env: Environment,
  orgId: string
): Promise<void> {
  await http.post(`/flags/${flag}/org/disallow`, { orgId }, envParam(env));
}

export async function removeOrg(
  flag: string,
  env: Environment,
  orgId: string
): Promise<void> {
  await http.delete(`/flags/${flag}/org/${orgId}`, envParam(env));
}

export async function allowProduct(
  flag: string,
  env: Environment,
  type: string,
  subType?: string
): Promise<void> {
  await http.post(
    `/flags/${flag}/product/allow`,
    { type, subType },
    envParam(env)
  );
}

export async function disallowProduct(
  flag: string,
  env: Environment,
  type: string,
  subType?: string
): Promise<void> {
  await http.post(
    `/flags/${flag}/product/disallow`,
    { type, subType },
    envParam(env)
  );
}

export async function removeProduct(
  flag: string,
  env: Environment,
  type: string,
  subType?: string
): Promise<void> {
  const params: Record<string, string> = { env, type };
  if (subType) params.subType = subType;
  await http.delete(`/flags/${flag}/product`, { params });
}
