import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import SettingsToast from '@/components/admin/SettingsToast';

export const dynamic = 'force-dynamic';

async function saveTestimonialsSettings(formData: FormData) {
  'use server';
  requireAdminAction();

  const { prisma } = await import('@/lib/prisma');

  // Hidden "0" is always submitted; checkbox sends "1" when checked.
  // getAll().includes('1') detects the checked state regardless of field order.
  const showTestimonials = formData.getAll('showTestimonials').includes('1');

  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: 1 },
      update: { showTestimonials },
      create: { id: 1, showTestimonials },
    });
  } catch {
    return redirect('/admin/settings/testimonials?error=1');
  }

  revalidatePath('/');
  redirect('/admin/settings/testimonials?saved=1');
}

export default async function TestimonialsSettingsPage() {
  const { prisma } = await import('@/lib/prisma');
  const current = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });

  const showTestimonials: boolean = current?.showTestimonials ?? false;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-gray-600 mt-1">
          Control the visibility of the &quot;What Our Students Say&quot; section on the homepage.
          This section currently contains placeholder content.
        </p>
      </div>

      <SettingsToast />

      {!showTestimonials && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 text-gray-700 rounded-lg px-4 py-3 text-sm font-medium">
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
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
          The Testimonials section is currently <strong className="ml-1">hidden</strong> and not shown on the homepage.
        </div>
      )}

      <form action={saveTestimonialsSettings} className="space-y-6">
        <section className="border rounded p-4 space-y-5">
          <h2 className="font-semibold">Settings</h2>

          {/* Toggle */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-gray-700">
                Show Testimonials section
              </label>
              <p className="text-xs text-gray-500">
                When enabled, the &quot;What Our Students Say&quot; section is visible on the homepage.
                Recommended to keep disabled until real Google reviews are integrated.
              </p>
            </div>

            {/*
              Hidden "0" is always submitted. If the checkbox is also checked,
              "1" is submitted too. The server action uses getAll().includes('1')
              to detect the checked state regardless of field order.
            */}
            <input type="hidden" name="showTestimonials" value="0" />
            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
              <input
                type="checkbox"
                name="showTestimonials"
                value="1"
                defaultChecked={showTestimonials}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#c99706] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c99706]" />
            </label>
          </div>
        </section>

        <div>
          <button
            type="submit"
            className="bg-gray-900 text-white rounded px-4 py-2"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
