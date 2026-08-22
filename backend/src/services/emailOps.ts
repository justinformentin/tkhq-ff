/**
 * Wrappers for the SES / Email RPCs exposed by OperatorAgentService.
 *
 * Each function maps one-to-one to an upstream RPC.  The HTTP transport POSTs
 * everything to /<package>.<Service>/<Method>, so even "GET-like" reads go out
 * as POST requests — the same convention used by flags.ts / orgOps.ts.
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  AddSuppressedEmailRequest,
  AddSuppressedEmailResponse,
  AuthProxyEmailConfig,
  CreateCustomDomainEntryRequest,
  CreateCustomDomainEntryResponse,
  CreateSesDomainRequest,
  CreateSesDomainResponse,
  DeleteSuppressedEmailRequest,
  EmptyResponse,
  GetEmailVerificationRequest,
  GetEmailVerificationResponse,
  GetSesDomainRequest,
  GetSesDomainResponse,
  GetSuppressedEmailRequest,
  GetSuppressedEmailResponse,
  ListSuppressedEmailsRequest,
  ListSuppressedEmailsResponse,
  RefreshSesDomainRequest,
  RefreshSesDomainResponse,
  UpdateAuthProxyEmailConfigRequest,
  UpdateAuthProxyEmailConfigResponse,
  UpdateEmailVerificationRequest,
  UpdateEmailVerificationResponse,
} from '../grpc/types';

// ---------------------------------------------------------------------------
// SES Domains
// ---------------------------------------------------------------------------

export async function getSesDomain(
  env: Environment,
  domain: string,
  idToken: string
): Promise<GetSesDomainResponse> {
  return agentCall<GetSesDomainRequest, GetSesDomainResponse>(
    env,
    'GetSesDomain',
    { domain },
    idToken
  );
}

export async function createSesDomain(
  env: Environment,
  domain: string,
  mailFromDomain: string | undefined,
  idToken: string
): Promise<CreateSesDomainResponse> {
  return agentCall<CreateSesDomainRequest, CreateSesDomainResponse>(
    env,
    'CreateSesDomain',
    { domain, mail_from_domain: mailFromDomain },
    idToken
  );
}

export async function refreshSesDomain(
  env: Environment,
  domain: string,
  idToken: string
): Promise<RefreshSesDomainResponse> {
  return agentCall<RefreshSesDomainRequest, RefreshSesDomainResponse>(
    env,
    'RefreshSesDomain',
    { domain },
    idToken
  );
}

// ---------------------------------------------------------------------------
// Custom Domains
// ---------------------------------------------------------------------------

export async function createCustomDomainEntry(
  env: Environment,
  domain: string,
  orgId: string | undefined,
  idToken: string
): Promise<CreateCustomDomainEntryResponse> {
  return agentCall<CreateCustomDomainEntryRequest, CreateCustomDomainEntryResponse>(
    env,
    'CreateCustomDomainEntry',
    { domain, org_id: orgId },
    idToken
  );
}

// ---------------------------------------------------------------------------
// Auth Proxy Email Config
// ---------------------------------------------------------------------------

export async function updateAuthProxyEmailConfig(
  env: Environment,
  config: AuthProxyEmailConfig,
  idToken: string
): Promise<UpdateAuthProxyEmailConfigResponse> {
  return agentCall<UpdateAuthProxyEmailConfigRequest, UpdateAuthProxyEmailConfigResponse>(
    env,
    'UpdateAuthProxyEmailConfig',
    { config },
    idToken
  );
}

// ---------------------------------------------------------------------------
// Suppressed Emails (the only paginated surface)
// ---------------------------------------------------------------------------

export async function listSuppressedEmails(
  env: Environment,
  pageToken: string | undefined,
  pageSize: number | undefined,
  idToken: string
): Promise<ListSuppressedEmailsResponse> {
  const req: ListSuppressedEmailsRequest = {};
  if (pageToken) req.page_token = pageToken;
  if (pageSize !== undefined) req.page_size = pageSize;

  return agentCall<ListSuppressedEmailsRequest, ListSuppressedEmailsResponse>(
    env,
    'ListSuppressedEmails',
    req,
    idToken
  );
}

export async function getSuppressedEmail(
  env: Environment,
  emailAddress: string,
  idToken: string
): Promise<GetSuppressedEmailResponse> {
  return agentCall<GetSuppressedEmailRequest, GetSuppressedEmailResponse>(
    env,
    'GetSuppressedEmail',
    { email_address: emailAddress },
    idToken
  );
}

export async function addSuppressedEmail(
  env: Environment,
  emailAddress: string,
  idToken: string
): Promise<AddSuppressedEmailResponse> {
  return agentCall<AddSuppressedEmailRequest, AddSuppressedEmailResponse>(
    env,
    'AddSuppressedEmail',
    { email_address: emailAddress },
    idToken
  );
}

export async function deleteSuppressedEmail(
  env: Environment,
  emailAddress: string,
  idToken: string
): Promise<EmptyResponse> {
  return agentCall<DeleteSuppressedEmailRequest, EmptyResponse>(
    env,
    'DeleteSuppressedEmail',
    { email_address: emailAddress },
    idToken
  );
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export async function getEmailVerification(
  env: Environment,
  emailAddress: string,
  idToken: string
): Promise<GetEmailVerificationResponse> {
  return agentCall<GetEmailVerificationRequest, GetEmailVerificationResponse>(
    env,
    'GetEmailVerification',
    { email_address: emailAddress },
    idToken
  );
}

export async function updateEmailVerification(
  env: Environment,
  emailAddress: string,
  status: string | undefined,
  idToken: string
): Promise<UpdateEmailVerificationResponse> {
  return agentCall<UpdateEmailVerificationRequest, UpdateEmailVerificationResponse>(
    env,
    'UpdateEmailVerification',
    { email_address: emailAddress, status },
    idToken
  );
}
