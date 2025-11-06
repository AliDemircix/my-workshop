import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const CreateSchema = z.object({
  sessionId: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  quantity: z.number().int().min(1).max(10),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { sessionId, name, email, quantity } = parsed.data;

  const session = await prisma.session.findUnique({ 
    where: { id: sessionId }, 
    include: { 
      reservations: true,
      category: true
    } 
  });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  const reserved = session.reservations.reduce((a: number, r: { status: string; quantity: number }) => a + (r.status === 'CANCELED' ? 0 : r.quantity), 0);
  const remaining = session.capacity - reserved;
  if (quantity > remaining) return NextResponse.json({ error: 'Not enough slots' }, { status: 409 });

  const reservation = await prisma.reservation.create({
    data: { sessionId, name, email, quantity },
  });

  // Send notification email to info@giftoria.nl
  try {
    const sessionDate = new Date(session.date);
    const sessionTime = `${new Date(session.startTime).toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${new Date(session.endTime).toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;

    await sendMail({
      to: 'info@giftoria.nl',
      subject: `Nieuwe workshop reservering: ${session.category.name}`,
      html: `
        <h2>Nieuwe workshop reservering</h2>
        <p>Er is een nieuwe reservering gemaakt voor een workshop:</p>
        
        <h3>Reservering details:</h3>
        <ul>
          <li><strong>Workshop categorie:</strong> ${session.category.name}</li>
          <li><strong>Datum:</strong> ${sessionDate.toLocaleDateString('nl-NL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</li>
          <li><strong>Tijd:</strong> ${sessionTime}</li>
          <li><strong>Aantal personen:</strong> ${quantity}</li>
          <li><strong>Resterende plekken:</strong> ${remaining - quantity}</li>
        </ul>

        <h3>Klant gegevens:</h3>
        <ul>
          <li><strong>Naam:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>

        <h3>Reservering informatie:</h3>
        <ul>
          <li><strong>Reservering ID:</strong> ${reservation.id}</li>
          <li><strong>Status:</strong> ${reservation.status}</li>
          <li><strong>Aangemaakt op:</strong> ${reservation.createdAt.toLocaleString('nl-NL')}</li>
        </ul>
      `,
      text: `
Nieuwe workshop reservering

Workshop categorie: ${session.category.name}
Datum: ${sessionDate.toLocaleDateString('nl-NL')}
Tijd: ${sessionTime}
Aantal personen: ${quantity}
Resterende plekken: ${remaining - quantity}

Klant gegevens:
Naam: ${name}
Email: ${email}

Reservering informatie:
Reservering ID: ${reservation.id}
Status: ${reservation.status}
Aangemaakt op: ${reservation.createdAt.toLocaleString('nl-NL')}
      `
    });
  } catch (error) {
    logger.emailError('reservation notification', error as Error, { reservationId: reservation.id, sessionId, email });
    // Don't fail the reservation if email fails
  }

  return NextResponse.json(reservation, { status: 201 });
}
