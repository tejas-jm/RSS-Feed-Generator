import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.feed.findFirst();
  if (existing) return;
  await prisma.feed.create({
    data: {
      name: 'Demo feed',
      baseUrl: 'https://example.com/news',
      fields: {
        itemList: { selector: 'article' },
        item: { selector: 'article' },
        title: { selector: 'h2', attr: 'text' },
        link: { selector: 'a', attr: 'href', absoluteUrl: true },
        description: { selector: 'p', attr: 'text' },
      },
      schedule: '0 * * * *',
      format: 'all',
      maxItems: 20,
      dedupKey: 'link',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
