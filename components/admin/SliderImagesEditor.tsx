"use client";
import { useEffect, useState } from 'react';

export default function SliderImagesEditor({ initial = [] as string[] }) {
  const baseCount = 5;
  const [count, setCount] = useState(Math.max(baseCount, initial.length || 0));
  const [values, setValues] = useState<string[]>(() => {
    const arr = Array.from({ length: Math.max(baseCount, initial.length || 0) }, (_, i) => initial[i] || '');
    return arr;
  });

  useEffect(() => {
    const needed = Math.max(baseCount, initial.length || 0);
    setCount(needed);
    setValues((prev) => {
      const next = Array.from({ length: needed }, (_, i) => initial[i] ?? prev[i] ?? '');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.length]);

  const addOne = () => {
    setCount((c) => c + 1);
    setValues((prev) => [...prev, '']);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <input
            key={i}
            type="url"
            name="sliderImages"
            placeholder={`Image URL #${i + 1}`}
            defaultValue={values[i] || ''}
            className="border rounded px-3 py-2"
          />
        ))}
      </div>
      <button type="button" className="border rounded px-3 py-1 hover:bg-gray-50" onClick={addOne}>Add more image</button>
      <p className="text-xs text-gray-500">Start with up to 5 images by default. Click "Add more image" to add additional image URLs.</p>
    </div>
  );
}
