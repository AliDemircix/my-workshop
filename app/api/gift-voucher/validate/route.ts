import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code || code.trim().length === 0) {
    return NextResponse.json({ valid: false, error: 'Voucher code is required' }, { status: 400 });
  }

  const voucher = await prisma.giftVoucher.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!voucher) {
    return NextResponse.json({ valid: false, error: 'Voucher code not found' });
  }

  if (voucher.status !== 'PAID') {
    if (voucher.status === 'USED') {
      return NextResponse.json({ valid: false, error: 'This voucher has already been used' });
    }
    if (voucher.status === 'EXPIRED') {
      return NextResponse.json({ valid: false, error: 'This voucher has expired' });
    }
    return NextResponse.json({ valid: false, error: 'This voucher is not yet active' });
  }

  if (new Date(voucher.expiresAt) < new Date()) {
    // Lazily mark it as expired
    await prisma.giftVoucher.update({ where: { id: voucher.id }, data: { status: 'EXPIRED' } });
    return NextResponse.json({ valid: false, error: 'This voucher has expired' });
  }

  return NextResponse.json({
    valid: true,
    amountCents: voucher.amountCents,
    expiresAt: voucher.expiresAt.toISOString(),
  });
}
