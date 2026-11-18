import { Inject, Injectable } from '@nestjs/common';
import { fromSupabaseUrl } from '@supabase/server';
import { verifyCredentials } from '@supabase/server/core';
import { UserRole } from '../../domain/enums/user-role.enum';
import {
  ConflictDomainException,
  UnauthorizedDomainException,
} from '../../domain/exceptions/domain.exception';
import {
  AuthGatewayPort,
  AuthTokens,
  CreateAuthUserInput,
  VerifiedTokenClaims,
} from '../../domain/ports/auth-gateway.port';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SupabaseAuthAdapter extends AuthGatewayPort {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {
    super();
  }

  private mapTokens(session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }): AuthTokens {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      tokenType: session.token_type,
    };
  }

  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<{ userId: string; tokens: AuthTokens }> {
    const client = this.db.getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedDomainException(
        'Correo o contraseña incorrectos.',
      );
    }

    return {
      userId: data.user.id,
      tokens: this.mapTokens(data.session),
    };
  }

  async signInWithPhone(
    phone: string,
    password: string,
  ): Promise<{ userId: string; tokens: AuthTokens }> {
    const client = this.db.getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      phone,
      password,
    });

    if (error || !data.user || !data.session) {
      if (error?.code === 'phone_provider_disabled') {
        throw new UnauthorizedDomainException(
          'PHONE_PROVIDER_DISABLED: El proveedor Phone está deshabilitado en Supabase Auth.',
        );
      }
      throw new UnauthorizedDomainException(
        'Número de celular o contraseña incorrectos.',
      );
    }

    return {
      userId: data.user.id,
      tokens: this.mapTokens(data.session),
    };
  }

  async refreshSession(
    refreshToken: string,
  ): Promise<{ userId: string; tokens: AuthTokens }> {
    const client = this.db.getSupabaseClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedDomainException(
        'Refresh token inválido o expirado.',
      );
    }

    return {
      userId: data.user.id,
      tokens: this.mapTokens(data.session),
    };
  }

  async createAuthUser(
    input: CreateAuthUserInput,
  ): Promise<{ userId: string }> {
    const admin = this.db.getSupabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      ...(input.email ? { email: input.email, email_confirm: true } : {}),
      phone: input.phone,
      phone_confirm: true,
      password: input.password,
      app_metadata: {
        role: input.role,
        branchId: input.branchId,
      },
    });

    if (error || !data.user) {
      const msg = error?.message ?? 'No se pudo crear la cuenta en Supabase Auth.';
      if (
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('registered') ||
        msg.toLowerCase().includes('exists')
      ) {
        throw new ConflictDomainException(
          'Ya existe una cuenta con ese correo o número de celular en el proveedor de identidad.',
        );
      }
      throw new UnauthorizedDomainException(msg);
    }

    return { userId: data.user.id };
  }

  async updateAuthUserPhone(userId: string, phone: string): Promise<void> {
    const admin = this.db.getSupabaseAdmin();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      phone,
      phone_confirm: true,
    });
    if (error) {
      const msg = error.message ?? 'Error actualizando celular en Supabase Auth.';
      if (
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('registered') ||
        msg.toLowerCase().includes('exists')
      ) {
        throw new ConflictDomainException(
          'Ese número de celular ya está registrado en el proveedor de identidad.',
        );
      }
      throw new Error(`Error actualizando celular en Supabase Auth: ${msg}`);
    }
  }

  async updateAuthUserMetadata(
    userId: string,
    metadata: { role: UserRole; branchId: string | null },
  ): Promise<void> {
    const admin = this.db.getSupabaseAdmin();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: metadata,
    });
    if (error) {
      throw new Error(
        `Error actualizando metadata en Supabase Auth: ${error.message}`,
      );
    }
  }

  async setAuthUserBanned(userId: string, banned: boolean): Promise<void> {
    const admin = this.db.getSupabaseAdmin();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banned ? '876000h' : 'none',
    });
    if (error) {
      throw new Error(
        `Error cambiando estado de bloqueo en Supabase Auth: ${error.message}`,
      );
    }
  }

  async deleteAuthUser(userId: string): Promise<void> {
    const admin = this.db.getSupabaseAdmin();
    await admin.auth.admin.deleteUser(userId);
  }

  async verifyAccessToken(
    authorizationHeader: string | null,
  ): Promise<VerifiedTokenClaims> {
    if (!authorizationHeader) {
      throw new UnauthorizedDomainException('Falta el header Authorization.');
    }

    const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
    const token = match?.[1]?.trim() ?? null;
    if (!token) {
      throw new UnauthorizedDomainException(
        'Formato inválido en header Authorization. Se espera Bearer <token>.',
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Falta SUPABASE_URL en las variables de entorno.');
    }

    const { data: auth, error } = await verifyCredentials(
      { token, apikey: null },
      {
        auth: 'user',
        issuer: fromSupabaseUrl(supabaseUrl),
      },
    );

    if (error || !auth?.userClaims) {
      throw new UnauthorizedDomainException(
        error?.message ?? 'Token JWT inválido o expirado.',
      );
    }

    const appMeta = (auth.userClaims.appMetadata ?? {}) as {
      role?: UserRole;
      branchId?: string | null;
    };

    return {
      userId: auth.userClaims.id,
      email: auth.userClaims.email ?? null,
      phone:
        typeof auth.jwtClaims?.phone === 'string'
          ? auth.jwtClaims.phone
          : null,
      role: appMeta.role ?? null,
      branchId: appMeta.branchId ?? null,
      token: auth.token ?? token,
    };
  }
}
