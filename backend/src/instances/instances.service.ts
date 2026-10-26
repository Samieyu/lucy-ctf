import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TTL_MINUTES = 30;
const EXTENSION_MINUTES = 15;
const MAX_EXTENSIONS = 1;

@Injectable()
export class InstancesService {
  private readonly dockerHost: string;

  constructor(private readonly prisma: PrismaService) {
    this.dockerHost = process.env.DOCKER_HOST || 'http://docker-proxy:2375';
  }

  isInstancesEnabled(): boolean {
    return process.env.INSTANCES_ENABLED === 'true';
  }

  async getInstanceStatus(challengeId: string, teamId: string) {
    if (!this.isInstancesEnabled()) {
      return { enabled: false, instance: null };
    }

    const instance = await this.prisma.challengeInstance.findUnique({
      where: { teamId_challengeId: { teamId, challengeId } },
    });

    if (!instance || instance.status === 'STOPPED') {
      return { enabled: true, instance: null };
    }

    const now = new Date();
    if (now > instance.expiresAt) {
      await this.stopInstance(challengeId, teamId).catch(() => {});
      return { enabled: true, instance: null };
    }

    return {
      enabled: true,
      instance: {
        host: instance.connectionHost || process.env.INSTANCE_PUBLIC_HOST || 'localhost',
        port: instance.port,
        expiresAt: instance.expiresAt,
        status: instance.status,
        extensionsRemaining: MAX_EXTENSIONS - instance.extensionsCount,
      },
    };
  }

  async startInstance(challengeId: string, teamId: string) {
    if (!this.isInstancesEnabled()) {
      throw new ServiceUnavailableException(
        'Dynamic instances feature is currently disabled by administrator configuration.',
      );
    }

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }

    if (!challenge.isDynamicInstance || !challenge.dockerImage) {
      throw new BadRequestException('This challenge does not support dynamic instances');
    }

    // Check if active instance already exists
    const existing = await this.prisma.challengeInstance.findUnique({
      where: { teamId_challengeId: { teamId, challengeId } },
    });

    if (existing && existing.status === 'RUNNING' && new Date() < existing.expiresAt) {
      return {
        message: 'Instance is already running',
        host: existing.connectionHost || process.env.INSTANCE_PUBLIC_HOST || 'localhost',
        port: existing.port,
        expiresAt: existing.expiresAt,
      };
    }

    const port = Math.floor(30000 + Math.random() * 9000);
    const containerName = `lucyctf_inst_${teamId.slice(0, 8)}_${challengeId.slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + DEFAULT_TTL_MINUTES * 60 * 1000);
    const exposedPort = `${challenge.instancePort || 80}/tcp`;

    let containerId: string | null = null;
    try {
      // Create container via socket proxy
      const createRes = await fetch(
        `${this.dockerHost}/containers/create?name=${containerName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Image: challenge.dockerImage,
            HostConfig: {
              PortBindings: {
                [exposedPort]: [{ HostPort: String(port) }],
              },
              Memory: 134217728, // 128 MB limit
              NanoCpus: 500000000, // 0.5 CPU
              Privileged: false,
              NetworkMode: 'ctf_isolated_net',
              ReadonlyRootfs: false,
            },
          }),
        },
      );

      if (createRes.ok) {
        const createData = await createRes.json();
        containerId = createData.Id;
        // Start container
        await fetch(`${this.dockerHost}/containers/${containerId}/start`, {
          method: 'POST',
        });
      }
    } catch {
      // In dev or mockup when socket proxy is not running
      containerId = `mock_${containerName}`;
    }

    const host = process.env.INSTANCE_PUBLIC_HOST || 'localhost';

    await this.prisma.challengeInstance.upsert({
      where: { teamId_challengeId: { teamId, challengeId } },
      update: {
        containerId,
        port,
        connectionHost: host,
        status: 'RUNNING',
        expiresAt,
        extensionsCount: 0,
      },
      create: {
        challengeId,
        teamId,
        containerId,
        port,
        connectionHost: host,
        status: 'RUNNING',
        expiresAt,
        extensionsCount: 0,
      },
    });

    return {
      message: 'Challenge instance started successfully',
      host,
      port,
      expiresAt,
    };
  }

  async extendInstance(challengeId: string, teamId: string) {
    if (!this.isInstancesEnabled()) {
      throw new ServiceUnavailableException('Dynamic instances feature is disabled');
    }

    const instance = await this.prisma.challengeInstance.findUnique({
      where: { teamId_challengeId: { teamId, challengeId } },
    });

    if (!instance || instance.status !== 'RUNNING') {
      throw new NotFoundException('No active instance found to extend');
    }

    if (instance.extensionsCount >= MAX_EXTENSIONS) {
      throw new ForbiddenException(
        'This instance has already been extended the maximum number of times.',
      );
    }

    const newExpiresAt = new Date(
      instance.expiresAt.getTime() + EXTENSION_MINUTES * 60 * 1000,
    );

    const updated = await this.prisma.challengeInstance.update({
      where: { id: instance.id },
      data: {
        expiresAt: newExpiresAt,
        extensionsCount: { increment: 1 },
      },
    });

    return {
      message: `Instance extended by ${EXTENSION_MINUTES} minutes`,
      expiresAt: updated.expiresAt,
    };
  }

  async stopInstance(challengeId: string, teamId: string) {
    const instance = await this.prisma.challengeInstance.findUnique({
      where: { teamId_challengeId: { teamId, challengeId } },
    });

    if (!instance) {
      return { success: true };
    }

    if (instance.containerId && !instance.containerId.startsWith('mock_')) {
      try {
        await fetch(`${this.dockerHost}/containers/${instance.containerId}/stop?t=5`, {
          method: 'POST',
        });
        await fetch(`${this.dockerHost}/containers/${instance.containerId}?force=true`, {
          method: 'DELETE',
        });
      } catch {}
    }

    await this.prisma.challengeInstance.update({
      where: { id: instance.id },
      data: { status: 'STOPPED' },
    });

    return { success: true, message: 'Instance stopped' };
  }
}
