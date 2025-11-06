"use client";
import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function PolicyToast({ successMessage = 'Saved', errorMessage = 'Could not save' }: { successMessage?: string; errorMessage?: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = search.get('saved');
    const error = search.get('error');
    if (saved === '1') {
      toast.success(successMessage);
      router.replace(pathname);
    } else if (error) {
      const msg = error === '1' ? errorMessage : decodeURIComponent(error);
      toast.error(msg);
      router.replace(pathname);
    }
  }, [search, router, pathname]);

  return null;
}
