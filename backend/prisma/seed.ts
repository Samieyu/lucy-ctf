import { PrismaClient, ChallengeCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  const challenges = [
    {
      title: 'Welcome to Lucy CTF',
      description:
        'Every good CTF starts with an easy one. The flag is hidden in plain sight — check the page source.',
      category: ChallengeCategory.MISC,
      points: 50,
      flag: 'LUCY{w3lc0m3_t0_th3_dig}',
    },
    {
      title: 'Base Instincts',
      description:
        'Decode this: TFVDWXtiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259 — what encoding is this?',
      category: ChallengeCategory.CRYPTO,
      points: 100,
      flag: 'LUCY{base64_is_not_encryption}',
    },
    {
      title: 'Hidden in the Metadata',
      description:
        'We found this old photo of Lucy\'s excavation site. Something is hidden in its EXIF data.',
      category: ChallengeCategory.FORENSICS,
      points: 150,
      flag: 'LUCY{3x1f_d4t4_t3ll5_5t0r13s}',
    },
    {
      title: 'Reverse the Fossil',
      description:
        'This binary checks a password before printing the flag. Figure out what it wants.',
      category: ChallengeCategory.REVERSE_ENGINEERING,
      points: 200,
      flag: 'LUCY{r3v3rs1ng_1s_l1k3_p4l30nt0l0gy}',
    },
    {
      title: 'SQL Dig Site',
      description:
        'This login form looks vulnerable. Can you dig your way past it?',
      category: ChallengeCategory.WEB,
      points: 150,
      flag: 'LUCY{sql1_1nj3ct10n_uncov3r3d}',
    },
  ];

  for (const c of challenges) {
    const flagHash = await bcrypt.hash(c.flag, SALT_ROUNDS);

    await prisma.challenge.upsert({
      where: { title: c.title },
      update: {},
      create: {
        title: c.title,
        description: c.description,
        category: c.category,
        points: c.points,
        flagHash,
      },
    });
  }

  console.log(`Seeded ${challenges.length} challenges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });