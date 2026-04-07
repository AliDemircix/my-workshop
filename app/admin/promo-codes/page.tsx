import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import PromoCodesClient from '@/components/admin/PromoCodesClient';

export const runtime = 'nodejs';

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  async function createPromoCode(formData: FormData) {
    'use server';
    requireAdminAction();

    const code = String(formData.get('code') || '').trim().toUpperCase();
    const type = String(formData.get('type') || '');
    const value = parseFloat(String(formData.get('value') || '0'));
    const maxUsesRaw = String(formData.get('maxUses') || '').trim();
    const validFromRaw = String(formData.get('validFrom') || '').trim();
    const validUntilRaw = String(formData.get('validUntil') || '').trim();
    const categoryIdRaw = String(formData.get('categoryId') || '').trim();

    if (!code || !type || isNaN(value) || value <= 0) {
      redirect('/admin/promo-codes?error=Invalid+promo+code+data');
    }
    if (!['PERCENTAGE', 'FIXED_EUR'].includes(type)) {
      redirect('/admin/promo-codes?error=Invalid+discount+type');
    }
    if (type === 'PERCENTAGE' && value > 100) {
      redirect('/admin/promo-codes?error=Percentage+cannot+exceed+100');
    }

    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) {
      redirect('/admin/promo-codes?error=A+promo+code+with+this+code+already+exists');
    }

    await prisma.promoCode.create({
      data: {
        code,
        type,
        value,
        maxUses: maxUsesRaw ? parseInt(maxUsesRaw, 10) : null,
        validFrom: validFromRaw ? new Date(validFromRaw) : null,
        validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
        categoryId: categoryIdRaw ? parseInt(categoryIdRaw, 10) : null,
      },
    });

    logAction('PROMO_CODE_CREATED', 'PromoCode', code);
    revalidatePath('/admin/promo-codes');
    redirect('/admin/promo-codes?success=Promo+code+created');
  }

  async function deletePromoCode(formData: FormData) {
    'use server';
    requireAdminAction();

    const id = Number(formData.get('id'));
    if (!id) redirect('/admin/promo-codes?error=Invalid+promo+code');

    const promo = await prisma.promoCode.findUnique({ where: { id } });
    if (!promo) redirect('/admin/promo-codes?error=Promo+code+not+found');

    await prisma.promoCode.delete({ where: { id } });
    logAction('PROMO_CODE_DELETED', 'PromoCode', String(id));
    revalidatePath('/admin/promo-codes');
    redirect('/admin/promo-codes');
  }

  const [promoCodes, categories] = await Promise.all([
    prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
        <p className="text-gray-600 mt-1">Create and manage discount promo codes for workshop bookings</p>
      </div>

      {searchParams?.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}
      {searchParams?.success && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {decodeURIComponent(searchParams.success)}
        </div>
      )}

      <PromoCodesClient
        promoCodes={promoCodes as any}
        categories={categories}
        createAction={createPromoCode}
        deleteAction={deletePromoCode}
      />
    </div>
  );
}
