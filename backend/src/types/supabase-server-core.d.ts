declare module '@supabase/server/core' {
  import type { SupabaseClient } from '@supabase/supabase-js';

  export interface VerifiedUserClaims {
    id: string;
    email?: string;
    role?: string;
    appMetadata?: Record<string, unknown>;
    userMetadata?: Record<string, unknown>;
  }

  export interface VerifiedAuthResult {
    authMode: string;
    token: string | null;
    keyName: string | null;
    userClaims: VerifiedUserClaims | null;
    jwtClaims: Record<string, unknown> | null;
  }

  export interface CredentialsInput {
    token: string | null;
    apikey: string | null;
  }

  export interface VerifyCredentialsOpts {
    auth?: string | string[];
    audience?: string | string[];
    issuer?: string | string[];
  }

  export interface CreateContextClientOpts {
    auth?: {
      token?: string;
      keyName?: string;
    };
  }

  export interface CreateAdminClientOpts {
    auth?: {
      keyName?: string;
    };
  }

  export function createAdminClient<Database = any>(
    options?: CreateAdminClientOpts,
  ): SupabaseClient<Database>;

  export function createContextClient<Database = any>(
    options?: CreateContextClientOpts,
  ): SupabaseClient<Database>;

  export function verifyCredentials(
    credentials: CredentialsInput,
    options: VerifyCredentialsOpts,
  ): Promise<
    | { data: VerifiedAuthResult; error: null }
    | { data: null; error: { message: string; status: number; code?: string } }
  >;
}
