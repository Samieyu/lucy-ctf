import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AttachmentsService } from './attachments.service';

interface AuthedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    teamId: string | null;
  };
}

@Controller('challenges/:id/attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  list(@Param('id') challengeId: string) {
    return this.attachmentsService.listAttachments(challengeId);
  }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('id') challengeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentsService.uploadAttachment(challengeId, file);
  }

  @Get(':attachmentId')
  async download(
    @Param('id') challengeId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: AuthedRequest,
    @Res() res: Response,
  ) {
    const fileInfo = await this.attachmentsService.getAttachmentFile(
      challengeId,
      attachmentId,
      req.user.isAdmin,
    );

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileInfo.filename)}"`,
    );
    res.sendFile(fileInfo.filePath);
  }

  @Delete(':attachmentId')
  @UseGuards(AdminGuard)
  remove(
    @Param('id') challengeId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.attachmentsService.deleteAttachment(challengeId, attachmentId);
  }
}
