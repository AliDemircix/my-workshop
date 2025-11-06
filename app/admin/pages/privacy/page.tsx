import { prisma } from '@/lib/prisma';
import { savePrivacy } from '@/app/admin/pages/privacy/save';
import EditorField from '@/components/admin/EditorField';
import ClientOnly from '@/components/ClientOnly';
import PolicyToast from '@/components/admin/PolicyToast';

export const dynamic = 'force-dynamic';

export default async function AdminPrivacyPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return (
    <div className="space-y-6">
      <ClientOnly>
        <PolicyToast successMessage="Privacy policy saved" errorMessage="Could not save privacy policy" />
      </ClientOnly>
      <h1 className="text-xl font-semibold">Edit Privacy Policy</h1>
      <form action={savePrivacy} className="space-y-3">
        <ClientOnly>
          <EditorField
            name="privacyContent"
            label="Privacy Policy Content"
            defaultValue={settings?.privacyContent ?? ''}
            placeholder="Write your privacy policy here with headings, lists, and links..."
          />
        </ClientOnly>
        <div className="text-sm text-gray-500">
          This content appears on <code>/privacy-policy</code>.
        </div>
        <button className="bg-gray-900 text-white rounded px-4 py-2">Save</button>
      </form>
    </div>
  );
}
