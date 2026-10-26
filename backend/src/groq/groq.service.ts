import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AskAiHintDto } from './dto/ask-ai-hint.dto';

const MAX_HINTS_PER_CHALLENGE = 5;

@Injectable()
export class GroqService {
  constructor(private readonly prisma: PrismaService) {}

  isEnabled(): boolean {
    const isFlagOn = process.env.AI_HINTS_ENABLED === 'true';
    const hasKey = Boolean(process.env.GROQ_API_KEY);
    return isFlagOn && hasKey;
  }

  async getRemainingUses(userId: string, challengeId: string): Promise<number> {
    const count = await this.prisma.aiHintUsage.count({
      where: { userId, challengeId },
    });
    return Math.max(0, MAX_HINTS_PER_CHALLENGE - count);
  }

  async generateHint(
    challengeId: string,
    userId: string,
    dto: AskAiHintDto,
  ) {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'AI Hint Assistant is currently disabled by event administrators.',
      );
    }

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        isActive: true,
      },
    });

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }

    const currentUsage = await this.prisma.aiHintUsage.count({
      where: { userId, challengeId },
    });

    if (currentUsage >= MAX_HINTS_PER_CHALLENGE) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${MAX_HINTS_PER_CHALLENGE} AI hints for this challenge.`,
      );
    }

    const apiKey = process.env.GROQ_API_KEY!;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const systemPrompt = `You are an educational cybersecurity CTF hint assistant for "Lucy CTF".
CRITICAL RULES:
1. NEVER reveal the exact flag, format, or full solution under any circumstance.
2. Provide only a SHORT, constructive conceptual nudge or guidance (maximum 2-3 sentences).
3. If the user asks for the answer or flag directly, refuse politely and suggest an area to investigate.
4. Challenge Category: ${challenge.category}. Challenge Title: ${challenge.title}.
5. Public Challenge Description: ${challenge.description}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let rawResponse = '';
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: dto.question },
          ],
          temperature: 0.5,
          max_tokens: 250,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Groq API responded with status ${response.status}`);
      }

      const data = await response.json();
      rawResponse =
        data.choices?.[0]?.message?.content?.trim() ||
        'Consider re-analyzing the challenge inputs and headers.';
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      throw new ServiceUnavailableException(
        isTimeout
          ? 'AI Assistant timed out. Please try again later.'
          : 'Failed to contact AI service. Please try again later.',
      );
    } finally {
      clearTimeout(timeout);
    }

    // Post-filter the model output: replace any flag pattern with [redacted]
    const sanitizedResponse = this.sanitizeFlagPatterns(rawResponse);

    // Save usage record
    await this.prisma.aiHintUsage.create({
      data: {
        userId,
        challengeId,
        question: dto.question,
        response: sanitizedResponse,
      },
    });

    const remainingUses = MAX_HINTS_PER_CHALLENGE - (currentUsage + 1);

    return {
      hint: sanitizedResponse,
      remainingUses,
    };
  }

  private sanitizeFlagPatterns(text: string): string {
    return text
      .replace(/(?:FLAG|LUCY)\{[^}]*\}/gi, '[redacted]')
      .replace(/[a-zA-Z0-9_-]{4,}\{[^}]*\}/gi, '[redacted]');
  }
}
