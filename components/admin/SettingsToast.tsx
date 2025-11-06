"use client";
import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function SettingsToast() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = search.get('saved');
    const error = search.get('error');
    if (saved === '1') {
      toast.success('Settings saved');
      router.replace(pathname);
    } else if (error === '1') {
      toast.error('Could not save settings');
      router.replace(pathname);
    }
  }, [search, router, pathname]);

  return null;
}
