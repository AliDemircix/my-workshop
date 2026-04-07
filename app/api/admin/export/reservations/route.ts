import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function csvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  // Wrap in quotes if the value contains a comma, double-quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const cookieStore = cookies();
  const adminCookie = (cookieStore as any).get('admin');
  if (!adminCookie || adminCookie.value !== '1') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      session: {
        include: { category: { select: { name: true } } },
      },
    },
  });

  // Fetch any voucher codes that were used — keyed by reservationId via redeemedByReservationId
  const redeemedVouchers = await prisma.giftVoucher.findMany({
    where: { redeemedByReservationId: { not: null } },
    select: { redeemedByReservationId: true, code: true },
  });
  const voucherByReservation = new Map<number, string>();
  for (const v of redeemedVouchers) {
    if (v.redeemedByReservationId !== null) {
      voucherByReservation.set(v.redeemedByReservationId, v.code);
    }
  }

  const headers = [
    'Date',
    'Session',
    'Category',
    'Name',
    'Email',
    'Phone',
    'Quantity',
    'Amount (€)',
    'Status',
    'Voucher Code',
  ];

  const rows = reservations.map((r) => {
    const sessionDate = new Date(r.session.date).toLocaleDateString('nl-NL');
    const sessionTime = `${new Date(r.session.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}–${new Date(r.session.endTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
    const amountEur = ((r.session.priceCents * r.quantity) / 100).toFixed(2);
    const voucherCode = voucherByReservation.get(r.id) ?? '';

    return [
      csvField(sessionDate),
      csvField(sessionTime),
      csvField(r.session.category.name),
      csvField(r.name),
      csvField(r.email),
      csvField(r.phone),
      csvField(r.quantity),
      csvField(amountEur),
      csvField(r.status),
      csvField(voucherCode),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const filename = `reservations-${month}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
