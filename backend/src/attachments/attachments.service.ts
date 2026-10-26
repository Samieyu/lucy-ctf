import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_EXTENSIONS = new Set([
  '.zip',
  '.tar',
  '.gz',
  '.7z',
  '.pdf',
  '.txt',
  '.py',
  '.c',
  '.cpp',
  '.pcap',
  '.pcapng',
  '.bin',
  '.raw',
  '.jpg',
  '.jpeg',
  '.png',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

@Injectable()
export class AttachmentsService {
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadAttachment(
    challengeId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds 25 MB size limit');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        `Extension ${ext} is not allowed. Supported: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
      );
    }

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const randomStoredName = `${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(this.uploadDir, randomStoredName);

    await fs.promises.writeFile(destinationPath, file.buffer);

    return this.prisma.challengeAttachment.create({
      data: {
        challengeId,
        filename: path.basename(file.originalname),
        storedFilename: randomStoredName,
        fileSize: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        sha256,
      },
      select: {
        id: true,
        filename: true,
        fileSize: true,
        sha256: true,
        createdAt: true,
      },
    });
  }

  async getAttachmentFile(
    challengeId: string,
    attachmentId: string,
    isAdmin = false,
  ) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge || (!challenge.isActive && !isAdmin)) {
      throw new ForbiddenException('Challenge is not active');
    }

    const attachment = await this.prisma.challengeAttachment.findFirst({
      where: { id: attachmentId, challengeId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const filePath = path.join(this.uploadDir, attachment.storedFilename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Stored file is missing');
    }

    return {
      filePath,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
    };
  }

  async deleteAttachment(challengeId: string, attachmentId: string) {
    const attachment = await this.prisma.challengeAttachment.findFirst({
      where: { id: attachmentId, challengeId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const filePath = path.join(this.uploadDir, attachment.storedFilename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => {});
    }

    await this.prisma.challengeAttachment.delete({ where: { id: attachment.id } });
    return { success: true };
  }

  async listAttachments(challengeId: string) {
    return this.prisma.challengeAttachment.findMany({
      where: { challengeId },
      select: {
        id: true,
        filename: true,
        fileSize: true,
        sha256: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
