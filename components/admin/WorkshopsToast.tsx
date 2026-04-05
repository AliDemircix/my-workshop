"use client";
import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function WorkshopsToast() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const added = search.get('added');
    const error = search.get('error');
    const categoryId = search.get('categoryId');
    const cleanUrl = categoryId ? `${pathname}?categoryId=${categoryId}` : pathname;
    if (added === '1') {
      toast.success('Workshop added');
      router.replace(cleanUrl);
    } else if (error) {
      const message = error === '1' ? 'Operation failed' : decodeURIComponent(error);
      toast.error(message);
      router.replace(cleanUrl);
    }
  }, [search, router, pathname]);

  return null;
}
