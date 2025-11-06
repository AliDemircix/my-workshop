import { prisma } from '@/lib/prisma';
import { saveRefund } from '@/app/admin/pages/refund/save';
import EditorField from '@/components/admin/EditorField';
import ClientOnly from '@/components/ClientOnly';
import PolicyToast from '@/components/admin/PolicyToast';

export const dynamic = 'force-dynamic';

export default async function AdminRefundPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return (
    <div className="space-y-6">
      <ClientOnly>
        <PolicyToast successMessage="Refund policy saved" errorMessage="Could not save refund policy" />
      </ClientOnly>
      <h1 className="text-xl font-semibold">Edit Refund Policy</h1>
      <form action={saveRefund} className="space-y-3">
        <ClientOnly>
          <EditorField
            name="refundContent"
            label="Refund Policy Content"
            defaultValue={settings?.refundContent ?? ''}
            placeholder="Write your refund policy here with headings, lists, and links..."
          />
        </ClientOnly>
        <div className="text-sm text-gray-500">This content appears on <code>/refund</code>.</div>
        <button className="bg-gray-900 text-white rounded px-4 py-2">Save</button>
      </form>
    </div>
  );
}
