import {
  BadRequestException,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  UploadDriverDocumentUseCase,
  UploadProfileAvatarUseCase,
} from '../../application/use-cases/uploads/upload-media.use-cases';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { CurrentUser, Roles } from '../decorators/auth.decorators';

interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(
    @Inject(UploadProfileAvatarUseCase)
    private readonly uploadProfileAvatarUseCase: UploadProfileAvatarUseCase,
    @Inject(UploadDriverDocumentUseCase)
    private readonly uploadDriverDocumentUseCase: UploadDriverDocumentUseCase,
  ) {}

  @Post('profile-avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'targetUserId',
    required: false,
    description:
      'Opcional para ADMIN/BRANCH_ADMIN al subir foto de otro usuario o conductor',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Sube foto de perfil al bucket público avatars y guarda URL en BD',
  })
  uploadAvatar(
    @CurrentUser() actor: User,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Query('targetUserId') targetUserId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo en el campo "file".');
    }
    return this.uploadProfileAvatarUseCase.execute(
      actor,
      targetUserId ?? actor.id,
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      },
    );
  }

  @Post('driver-ci/:driverId/:side')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.DRIVER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'driverId', format: 'uuid' })
  @ApiParam({ name: 'side', enum: ['ci-front', 'ci-back'] })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary:
      'Sube foto del CI anverso o reverso al bucket privado driver-documents y devuelve Signed URL',
  })
  uploadDriverCi(
    @CurrentUser() actor: User,
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Param('side') side: 'ci-front' | 'ci-back',
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    if (side !== 'ci-front' && side !== 'ci-back') {
      throw new BadRequestException('El parámetro side debe ser "ci-front" o "ci-back".');
    }
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo en el campo "file".');
    }
    return this.uploadDriverDocumentUseCase.execute(actor, driverId, side, {
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
  }
}
