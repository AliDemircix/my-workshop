import { PrismaClient } from '@prisma/client';
import { addDays, subDays, setHours, setMinutes, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Ensure a default SiteSettings row exists
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      privacyLabel: 'Privacy Policy',
      privacyUrl: '/privacy-policy',
      contactLabel: 'Contact',
      contactUrl: 'https://www.giftoria.nl/contact-us',
      refundLabel: 'Refund Policy',
      refundUrl: '/refund',
      privacyContent: '<p>Default privacy policy content. Update via Admin → Privacy page.</p>',
      refundContent: '<p>Default refund policy content. Update via Admin → Refund page.</p>',
      facebookUrl: '',
      instagramUrl: '',
      youtubeUrl: '',
      email: 'info@example.com',
      telephone: '+31 6 12345678',
      address: 'Example street 1, 1000 AA Amsterdam, NL',
      kvk: 'KVK 12345678',
      iban: 'IBAN NL00BANK0123456789',
    },
  });

  // Clear existing data (order matters due to relations)
  await prisma.reservation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.category.deleteMany();

  // Seed categories
  const [oorbellen, kettingen] = await Promise.all([
    prisma.category.create({ data: { name: 'Epoxy Oorbellen', description: 'Maak stijlvolle epoxy oorbellen' } }),
    prisma.category.create({ data: { name: 'Epoxy Kettingen', description: 'Ontwerp je eigen epoxy ketting' } }),
  ]);

  const today = startOfDay(new Date());

  // Helper to create a session with optional reservations
  async function createSessionWithReservations(opts: {
    categoryId: number;
    date: Date;
    startHour: number;
    endHour: number;
    capacity: number;
    priceCents: number;
    reservations?: Array<{ name: string; email: string; quantity: number; status: 'PENDING' | 'PAID' | 'CANCELED' | 'REFUNDED' }>
  }) {
    const start = setMinutes(setHours(opts.date, opts.startHour), 0);
    const end = setMinutes(setHours(opts.date, opts.endHour), 0);
    const session = await prisma.session.create({
      data: {
        categoryId: opts.categoryId,
        date: opts.date,
        startTime: start,
        endTime: end,
        capacity: opts.capacity,
        priceCents: opts.priceCents,
      },
    });
    if (opts.reservations && opts.reservations.length) {
      for (const r of opts.reservations) {
        await prisma.reservation.create({
          data: {
            sessionId: session.id,
            name: r.name,
            email: r.email,
            quantity: r.quantity,
            status: r.status,
          },
        });
      }
    }
    return session;
  }

  // Future sessions (some full, some with one person)
  await createSessionWithReservations({
    categoryId: oorbellen.id,
    date: addDays(today, 2),
    startHour: 12,
    endHour: 15,
    capacity: 5,
    priceCents: 4500,
    reservations: [
      { name: 'Alice Example', email: 'alice@example.com', quantity: 1, status: 'PAID' },
      { name: 'Bob Buyer', email: 'bob@example.com', quantity: 2, status: 'PAID' },
      { name: 'Chris Client', email: 'chris@example.com', quantity: 2, status: 'PAID' }, // full (1+2+2=5)
    ],
  });

  await createSessionWithReservations({
    categoryId: oorbellen.id,
    date: addDays(today, 5),
    startHour: 10,
    endHour: 13,
    capacity: 6,
    priceCents: 4000,
    reservations: [
      { name: 'Diana Doe', email: 'diana@example.com', quantity: 1, status: 'PENDING' }, // one person
    ],
  });

  await createSessionWithReservations({
    categoryId: kettingen.id,
    date: addDays(today, 8),
    startHour: 14,
    endHour: 17,
    capacity: 8,
    priceCents: 5000,
  });

  // Past sessions
  await createSessionWithReservations({
    categoryId: kettingen.id,
    date: subDays(today, 3),
    startHour: 9,
    endHour: 12,
    capacity: 5,
    priceCents: 4200,
    reservations: [
      { name: 'Eve Example', email: 'eve@example.com', quantity: 2, status: 'PAID' },
      { name: 'Frank Foo', email: 'frank@example.com', quantity: 1, status: 'REFUNDED' },
    ],
  });

  await createSessionWithReservations({
    categoryId: oorbellen.id,
    date: subDays(today, 1),
    startHour: 11,
    endHour: 14,
    capacity: 4,
    priceCents: 3800,
    reservations: [
      { name: 'Grace Guest', email: 'grace@example.com', quantity: 4, status: 'PAID' }, // full in past
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
