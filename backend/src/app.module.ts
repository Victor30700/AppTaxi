import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './api/app.controller';
import { AuthController } from './api/controllers/auth.controller';
import { BranchesController } from './api/controllers/branches.controller';
import { DriversController } from './api/controllers/drivers.controller';
import { UploadsController } from './api/controllers/uploads.controller';
import { UsersController } from './api/controllers/users.controller';
import { AllExceptionsFilter } from './api/filters/all-exceptions.filter';
import { RolesGuard } from './api/guards/roles.guard';
import { SupabaseAuthGuard } from './api/guards/supabase-auth.guard';
import { GetCurrentUserUseCase } from './application/use-cases/auth/get-current-user.use-case';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { RegisterPassengerUseCase } from './application/use-cases/auth/register-passenger.use-case';
import { CreateBranchUseCase } from './application/use-cases/branches/create-branch.use-case';
import { ListBranchesUseCase } from './application/use-cases/branches/list-branches.use-case';
import { GetDriverDetailUseCase } from './application/use-cases/drivers/get-driver-detail.use-case';
import { ListDriversUseCase } from './application/use-cases/drivers/list-drivers.use-case';
import { RegisterDriverUseCase } from './application/use-cases/drivers/register-driver.use-case';
import { UpdateDriverUseCase } from './application/use-cases/drivers/update-driver.use-case';
import { VerifyDriverUseCase } from './application/use-cases/drivers/verify-driver.use-case';
import {
  UploadDriverDocumentUseCase,
  UploadProfileAvatarUseCase,
} from './application/use-cases/uploads/upload-media.use-cases';
import { ChangeUserStatusUseCase } from './application/use-cases/users/change-user-status.use-case';
import { CreateBranchAdminUseCase } from './application/use-cases/users/create-branch-admin.use-case';
import { UpdateOwnProfileUseCase } from './application/use-cases/users/update-own-profile.use-case';
import { AuthGatewayPort } from './domain/ports/auth-gateway.port';
import { BranchRepositoryPort } from './domain/ports/branch-repository.port';
import { DriverProfileRepositoryPort } from './domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from './domain/ports/media-storage.port';
import { PassengerProfileRepositoryPort } from './domain/ports/passenger-profile-repository.port';
import { UserRepositoryPort } from './domain/ports/user-repository.port';
import { SupabaseAuthAdapter } from './infrastructure/auth/supabase-auth.adapter';
import { DatabaseModule } from './infrastructure/database/database.module';
import { PgBranchRepository } from './infrastructure/database/repositories/pg-branch.repository';
import { PgDriverProfileRepository } from './infrastructure/database/repositories/pg-driver-profile.repository';
import { PgPassengerProfileRepository } from './infrastructure/database/repositories/pg-passenger-profile.repository';
import { PgUserRepository } from './infrastructure/database/repositories/pg-user.repository';
import { SupabaseStorageAdapter } from './infrastructure/storage/supabase-storage.adapter';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AppController,
    AuthController,
    BranchesController,
    UsersController,
    DriversController,
    UploadsController,
  ],
  providers: [
    // Bindings de Puertos (domain) -> Adaptadores (infrastructure)
    { provide: AuthGatewayPort, useClass: SupabaseAuthAdapter },
    { provide: BranchRepositoryPort, useClass: PgBranchRepository },
    { provide: UserRepositoryPort, useClass: PgUserRepository },
    {
      provide: DriverProfileRepositoryPort,
      useClass: PgDriverProfileRepository,
    },
    {
      provide: PassengerProfileRepositoryPort,
      useClass: PgPassengerProfileRepository,
    },
    { provide: MediaStoragePort, useClass: SupabaseStorageAdapter },

    // Casos de Uso (application)
    {
      provide: LoginUseCase,
      useFactory: (
        auth: AuthGatewayPort,
        users: UserRepositoryPort,
        branches: BranchRepositoryPort,
        drivers: DriverProfileRepositoryPort,
        passengers: PassengerProfileRepositoryPort,
        storage: MediaStoragePort,
      ) =>
        new LoginUseCase(auth, users, branches, drivers, passengers, storage),
      inject: [
        AuthGatewayPort,
        UserRepositoryPort,
        BranchRepositoryPort,
        DriverProfileRepositoryPort,
        PassengerProfileRepositoryPort,
        MediaStoragePort,
      ],
    },
    {
      provide: RegisterPassengerUseCase,
      useFactory: (
        auth: AuthGatewayPort,
        users: UserRepositoryPort,
        passengers: PassengerProfileRepositoryPort,
      ) => new RegisterPassengerUseCase(auth, users, passengers),
      inject: [
        AuthGatewayPort,
        UserRepositoryPort,
        PassengerProfileRepositoryPort,
      ],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        auth: AuthGatewayPort,
        users: UserRepositoryPort,
        branches: BranchRepositoryPort,
        drivers: DriverProfileRepositoryPort,
        passengers: PassengerProfileRepositoryPort,
        storage: MediaStoragePort,
      ) =>
        new RefreshTokenUseCase(
          auth,
          users,
          branches,
          drivers,
          passengers,
          storage,
        ),
      inject: [
        AuthGatewayPort,
        UserRepositoryPort,
        BranchRepositoryPort,
        DriverProfileRepositoryPort,
        PassengerProfileRepositoryPort,
        MediaStoragePort,
      ],
    },
    {
      provide: GetCurrentUserUseCase,
      useFactory: (
        users: UserRepositoryPort,
        branches: BranchRepositoryPort,
        drivers: DriverProfileRepositoryPort,
        passengers: PassengerProfileRepositoryPort,
        storage: MediaStoragePort,
      ) =>
        new GetCurrentUserUseCase(
          users,
          branches,
          drivers,
          passengers,
          storage,
        ),
      inject: [
        UserRepositoryPort,
        BranchRepositoryPort,
        DriverProfileRepositoryPort,
        PassengerProfileRepositoryPort,
        MediaStoragePort,
      ],
    },
    {
      provide: CreateBranchUseCase,
      useFactory: (branches: BranchRepositoryPort) =>
        new CreateBranchUseCase(branches),
      inject: [BranchRepositoryPort],
    },
    {
      provide: ListBranchesUseCase,
      useFactory: (branches: BranchRepositoryPort) =>
        new ListBranchesUseCase(branches),
      inject: [BranchRepositoryPort],
    },
    {
      provide: CreateBranchAdminUseCase,
      useFactory: (
        auth: AuthGatewayPort,
        users: UserRepositoryPort,
        branches: BranchRepositoryPort,
      ) => new CreateBranchAdminUseCase(auth, users, branches),
      inject: [AuthGatewayPort, UserRepositoryPort, BranchRepositoryPort],
    },
    {
      provide: UpdateOwnProfileUseCase,
      useFactory: (users: UserRepositoryPort, auth: AuthGatewayPort) =>
        new UpdateOwnProfileUseCase(users, auth),
      inject: [UserRepositoryPort, AuthGatewayPort],
    },
    {
      provide: ChangeUserStatusUseCase,
      useFactory: (users: UserRepositoryPort, auth: AuthGatewayPort) =>
        new ChangeUserStatusUseCase(users, auth),
      inject: [UserRepositoryPort, AuthGatewayPort],
    },
    {
      provide: RegisterDriverUseCase,
      useFactory: (
        auth: AuthGatewayPort,
        users: UserRepositoryPort,
        branches: BranchRepositoryPort,
        drivers: DriverProfileRepositoryPort,
        storage: MediaStoragePort,
      ) =>
        new RegisterDriverUseCase(auth, users, branches, drivers, storage),
      inject: [
        AuthGatewayPort,
        UserRepositoryPort,
        BranchRepositoryPort,
        DriverProfileRepositoryPort,
        MediaStoragePort,
      ],
    },
    {
      provide: ListDriversUseCase,
      useFactory: (
        drivers: DriverProfileRepositoryPort,
        storage: MediaStoragePort,
      ) => new ListDriversUseCase(drivers, storage),
      inject: [DriverProfileRepositoryPort, MediaStoragePort],
    },
    {
      provide: GetDriverDetailUseCase,
      useFactory: (
        drivers: DriverProfileRepositoryPort,
        storage: MediaStoragePort,
      ) => new GetDriverDetailUseCase(drivers, storage),
      inject: [DriverProfileRepositoryPort, MediaStoragePort],
    },
    {
      provide: UpdateDriverUseCase,
      useFactory: (
        users: UserRepositoryPort,
        drivers: DriverProfileRepositoryPort,
        storage: MediaStoragePort,
        auth: AuthGatewayPort,
      ) => new UpdateDriverUseCase(users, drivers, storage, auth),
      inject: [
        UserRepositoryPort,
        DriverProfileRepositoryPort,
        MediaStoragePort,
        AuthGatewayPort,
      ],
    },
    {
      provide: VerifyDriverUseCase,
      useFactory: (
        drivers: DriverProfileRepositoryPort,
        storage: MediaStoragePort,
      ) => new VerifyDriverUseCase(drivers, storage),
      inject: [DriverProfileRepositoryPort, MediaStoragePort],
    },
    {
      provide: UploadProfileAvatarUseCase,
      useFactory: (users: UserRepositoryPort, storage: MediaStoragePort) =>
        new UploadProfileAvatarUseCase(users, storage),
      inject: [UserRepositoryPort, MediaStoragePort],
    },
    {
      provide: UploadDriverDocumentUseCase,
      useFactory: (
        drivers: DriverProfileRepositoryPort,
        storage: MediaStoragePort,
      ) => new UploadDriverDocumentUseCase(drivers, storage),
      inject: [DriverProfileRepositoryPort, MediaStoragePort],
    },

    // Seguridad y Filtros Globales (api)
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
