import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import SettingsToast from '@/components/admin/SettingsToast';

export const dynamic = 'force-dynamic';

const DEFAULT_MESSAGE =
  "We are currently performing scheduled maintenance. We'll be back shortly!";

async function saveMaintenanceSettings(formData: FormData) {
  'use server';
  requireAdminAction();

  const { prisma } = await import('@/lib/prisma');

  // The form submits a hidden "0" field + an optional checkbox "1" field under
  // the same name. getAll() collects both; if '1' is present the box is checked.
  const maintenanceMode = formData.getAll('maintenanceMode').includes('1');
  const maintenanceMessage =
    String(formData.get('maintenanceMessage') ?? '').trim() || DEFAULT_MESSAGE;

  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: 1 },
      update: { maintenanceMode, maintenanceMessage },
      create: { id: 1, maintenanceMode, maintenanceMessage },
    });

  } catch {
    return redirect('/admin/settings/maintenance?error=1');
  }

  revalidatePath('/');
  redirect('/admin/settings/maintenance?saved=1');
}

export default async function MaintenanceSettingsPage() {
  const { prisma } = await import('@/lib/prisma');
  const current = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });

  const maintenanceMode: boolean = current?.maintenanceMode ?? false;
  const maintenanceMessage: string = current?.maintenanceMessage ?? DEFAULT_MESSAGE;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Mode</h1>
        <p className="text-gray-600 mt-1">
          When enabled, all public pages redirect to a maintenance notice. Admin
          pages remain fully accessible.
        </p>
      </div>

      <SettingsToast />

      {maintenanceMode && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-4 py-3 text-sm font-medium">
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
          </svg>
          Maintenance mode is currently <strong className="ml-1">ON</strong>. Your
          public site is hidden from visitors.
        </div>
      )}

      <form action={saveMaintenanceSettings} className="space-y-6">
        <section className="border rounded p-4 space-y-5">
          <h2 className="font-semibold">Settings</h2>

          {/* Toggle */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-700">
                Enable maintenance mode
              </label>
              <p className="text-xs text-gray-500">
                Visitors to the public site will see the maintenance page instead
                of the normal content.
              </p>
            </div>

            {/*
              Hidden "0" is always submitted. If the checkbox is also checked,
              "1" is submitted too. The server action uses getAll().includes('1')
              to detect the checked state regardless of field order.
            */}
            <input type="hidden" name="maintenanceMode" value="0" />
            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
              <input
                type="checkbox"
                name="maintenanceMode"
                value="1"
                defaultChecked={maintenanceMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#c99706] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c99706]" />
            </label>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="maintenanceMessage"
              className="text-sm font-medium text-gray-700"
            >
              Maintenance message{' '}
              <span className="text-xs text-gray-400">(shown on the maintenance page)</span>
            </label>
            <textarea
              id="maintenanceMessage"
              name="maintenanceMessage"
              rows={3}
              className="border rounded px-3 py-2 text-sm resize-y"
              placeholder={DEFAULT_MESSAGE}
              defaultValue={maintenanceMessage}
            />
          </div>
        </section>

        <div>
          <button
            type="submit"
            className="bg-gray-900 text-white rounded px-4 py-2"
          >
            Save maintenance settings
          </button>
        </div>
      </form>
    </div>
  );
}
