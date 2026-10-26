import { PrismaClient, ChallengeCategory, ScoringMode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('--- Seeding Lucy CTF Platform ---');

  // 1. Seed Global Event Settings
  const event = await prisma.eventSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      name: 'Lucy CTF: Dinkinesh Open',
      startsAt: new Date(Date.now() - 3600 * 1000), // started 1 hour ago
      endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // ends in 7 days
      isPaused: false,
    },
  });
  console.log(`✓ Event settings initialized: "${event.name}"`);

  // 2. Seed Default Admin User
  const adminPasswordHash = await bcrypt.hash('LucyAdmin2026!', SALT_ROUNDS);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lucyctf.io' },
    update: { isAdmin: true },
    create: {
      email: 'admin@lucyctf.io',
      username: 'lucy_admin',
      passwordHash: adminPasswordHash,
      isAdmin: true,
      emailVerified: true,
    },
  });
  console.log(`✓ Default Admin created: ${adminUser.username} (admin@lucyctf.io / LucyAdmin2026!)`);

  // 3. Seed Challenges
  const challenges = [
    {
      title: 'Welcome to Lucy CTF',
      description:
        'Every good CTF starts with an easy one. The flag is hidden in plain sight — check the page source or investigate the fossil dig.',
      category: ChallengeCategory.MISC,
      points: 50,
      scoringMode: ScoringMode.STATIC,
      flag: 'LUCY{w3lc0m3_t0_th3_dig}',
      hints: [
        { text: 'Look carefully at the problem title and description.', cost: 0, order: 1 },
      ],
    },
    {
      title: 'Base Instincts',
      description:
        'Decode this message recovered from an old satellite transmission: TFVDWXtiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259 — what encoding is this?',
      category: ChallengeCategory.CRYPTO,
      points: 100,
      scoringMode: ScoringMode.STATIC,
      flag: 'LUCY{base64_is_not_encryption}',
      hints: [
        { text: 'RFC 4648 describes radix-64 representation.', cost: 10, order: 1 },
      ],
    },
    {
      title: 'Hidden in the Metadata',
      description:
        'We found an old archival photo of Lucy’s excavation site. Something suspicious is hidden inside the EXIF metadata tags.',
      category: ChallengeCategory.FORENSICS,
      points: 250,
      scoringMode: ScoringMode.DYNAMIC,
      initialPoints: 500,
      minPoints: 100,
      decay: 10,
      flag: 'LUCY{3x1f_d4t4_t3ll5_5t0r13s}',
      hints: [
        { text: 'Use exiftool or strings to inspect image comment segments.', cost: 25, order: 1 },
      ],
    },
    {
      title: 'Reverse the Fossil',
      description:
        'This x86-64 ELF binary checks an input passkey before revealing the flag. Reverse engineer the verification algorithm.',
      category: ChallengeCategory.REVERSE_ENGINEERING,
      points: 350,
      scoringMode: ScoringMode.DYNAMIC,
      initialPoints: 500,
      minPoints: 150,
      decay: 8,
      flag: 'LUCY{r3v3rs1ng_1s_l1k3_p4l30nt0l0gy}',
      hints: [
        { text: 'Open the binary in Ghidra or IDA and inspect the strcmp routine.', cost: 30, order: 1 },
        { text: 'The key is XORed with 0x42 in a loop.', cost: 50, order: 2 },
      ],
    },
    {
      title: 'SQL Dig Site',
      description:
        'The fossil excavation database authentication form appears vulnerable to input manipulation. Can you bypass authentication?',
      category: ChallengeCategory.WEB,
      points: 300,
      scoringMode: ScoringMode.DYNAMIC,
      initialPoints: 500,
      minPoints: 100,
      decay: 15,
      flag: 'LUCY{sql1_1nj3ct10n_uncov3r3d}',
      hints: [
        { text: 'Classic tautology attack: `\' OR 1=1 --`', cost: 20, order: 1 },
      ],
    },
  ];

  for (const c of challenges) {
    const flagHash = await bcrypt.hash(c.flag, SALT_ROUNDS);

    const challengeRecord = await prisma.challenge.upsert({
      where: { title: c.title },
      update: {
        scoringMode: c.scoringMode,
        initialPoints: c.initialPoints ?? c.points,
        minPoints: c.minPoints ?? c.points,
        decay: c.decay ?? 10,
      },
      create: {
        title: c.title,
        description: c.description,
        category: c.category,
        points: c.points,
        scoringMode: c.scoringMode,
        initialPoints: c.initialPoints ?? c.points,
        minPoints: c.minPoints ?? c.points,
        decay: c.decay ?? 10,
        flagHash,
      },
    });

    if (c.hints && c.hints.length > 0) {
      for (const h of c.hints) {
        const existingHint = await prisma.hint.findFirst({
          where: { challengeId: challengeRecord.id, order: h.order },
        });
        if (!existingHint) {
          await prisma.hint.create({
            data: {
              challengeId: challengeRecord.id,
              text: h.text,
              cost: h.cost,
              order: h.order,
            },
          });
        }
      }
    }
  }

  console.log(`✓ Seeded ${challenges.length} challenges with dynamic scoring and hints.`);
  console.log('--- Seeding Complete! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
