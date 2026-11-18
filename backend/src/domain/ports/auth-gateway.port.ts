import { UserRole } from '../enums/user-role.enum';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface CreateAuthUserInput {
  email?: string | null;
  phone: string;
  password: string;
  role: UserRole;
  branchId: string | null;
}

export interface VerifiedTokenClaims {
  userId: string;
  email: string | null;
  phone: string | null;
  role: UserRole | null;
  branchId: string | null;
  token: string;
}

/**
 * Puerto de salida para el proveedor de autenticación externo (Supabase Auth + @supabase/server).
 * Desacopla application/ de los detalles del proveedor de identidad.
 */
export abstract class AuthGatewayPort {
  abstract signInWithEmail(
    email: string,
    password: string,
  ): Promise<{ userId: string; tokens: AuthTokens }>;

  abstract signInWithPhone(
    phone: string,
    password: string,
  ): Promise<{ userId: string; tokens: AuthTokens }>;

  abstract refreshSession(
    refreshToken: string,
  ): Promise<{ userId: string; tokens: AuthTokens }>;

  abstract createAuthUser(input: CreateAuthUserInput): Promise<{ userId: string }>;

  abstract updateAuthUserPhone(userId: string, phone: string): Promise<void>;

  abstract updateAuthUserMetadata(
    userId: string,
    metadata: { role: UserRole; branchId: string | null },
  ): Promise<void>;

  abstract setAuthUserBanned(userId: string, banned: boolean): Promise<void>;

  abstract deleteAuthUser(userId: string): Promise<void>;

  abstract verifyAccessToken(
    authorizationHeader: string | null,
  ): Promise<VerifiedTokenClaims>;
}
