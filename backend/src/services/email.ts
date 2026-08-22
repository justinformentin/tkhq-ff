/**
 * Email / SES service — wraps OperatorAgentService RPCs in the email/ses
 * tkinfra group.  Follows the same pattern as orgOps.ts: no enum remapping,
 * no silent env fallbacks, re-read after mutate for write operations.
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  AddSuppressedEmailRequest,
  AddSuppressedEmailResponse,
  CreateCustomDomainEntryRequest,
  CreateCustomDomainEntryResponse,
  CreateSesDomainRequest,
  CreateSesDomainResponse,
  DeleteSuppressedEmailRequest,
  DeleteSuppressedEmailResponse,
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
  SuppressionListReason,
  UpdateAuthProxyEmailConfigRequest,
  UpdateAuthProxyEmailConfigResponse,
  UpdateEmailVerificationRequest,
  UpdateEmailVerificationResponse,
} from '../grpc/types';

// ---------------------------------------------------------------------------
// Email Suppression
// ---------------------------------------------------------------------------

export async function listSuppressedEmails(
  env: Environment,
  req: ListSuppressedEmailsRequest,
  idToken: string
): Promise<ListSuppressedEmailsResponse> {
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
  reason: SuppressionListReason,
  idToken: string
): Promise<AddSuppressedEmailResponse> {
  const result = await agentCall<
    AddSuppressedEmailRequest,
    AddSuppressedEmailResponse
  >(env, 'AddSuppressedEmail', { email_address: emailAddress, reason }, idToken);
  return result;
}

export async function deleteSuppressedEmail(
  env: Environment,
  emailAddress: string,
  idToken: string
): Promise<DeleteSuppressedEmailResponse> {
  return agentCall<DeleteSuppressedEmailRequest, DeleteSuppressedEmailResponse>(
    env,
    'DeleteSuppressedEmail',
    { email_address: emailAddress },
    idToken
  );
}

// ---------------------------------------------------------------------------
// SES Domain
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

export async function createSesDomain(
  env: Environment,
  req: CreateSesDomainRequest,
  idToken: string
): Promise<CreateSesDomainResponse> {
  return agentCall<CreateSesDomainRequest, CreateSesDomainResponse>(
    env,
    'CreateSesDomain',
    req,
    idToken
  );
}

export async function createCustomDomainEntry(
  env: Environment,
  req: CreateCustomDomainEntryRequest,
  idToken: string
): Promise<CreateCustomDomainEntryResponse> {
  return agentCall<
    CreateCustomDomainEntryRequest,
    CreateCustomDomainEntryResponse
  >(env, 'CreateCustomDomainEntry', req, idToken);
}

export async function updateAuthProxyEmailConfig(
  env: Environment,
  req: UpdateAuthProxyEmailConfigRequest,
  idToken: string
): Promise<UpdateAuthProxyEmailConfigResponse> {
  return agentCall<
    UpdateAuthProxyEmailConfigRequest,
    UpdateAuthProxyEmailConfigResponse
  >(env, 'UpdateAuthProxyEmailConfig', req, idToken);
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export async function getEmailVerification(
  env: Environment,
  email: string,
  idToken: string
): Promise<GetEmailVerificationResponse> {
  return agentCall<GetEmailVerificationRequest, GetEmailVerificationResponse>(
    env,
    'GetEmailVerification',
    { email },
    idToken
  );
}

export async function updateEmailVerification(
  env: Environment,
  req: UpdateEmailVerificationRequest,
  idToken: string
): Promise<UpdateEmailVerificationResponse> {
  return agentCall<
    UpdateEmailVerificationRequest,
    UpdateEmailVerificationResponse
  >(env, 'UpdateEmailVerification', req, idToken);
}
