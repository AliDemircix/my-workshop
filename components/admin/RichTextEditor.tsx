"use client";
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const ReactQuill = dynamic(async () => (await import('react-quill')).default, {
  ssr: false,
  loading: () => <div className="min-h-[120px] bg-white" />,
});
// Add a query string to mitigate stale chunk caching across dev port changes
import 'react-quill/dist/quill.snow.css?v=1';

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'clean'],
      ],
    }),
    []
  );
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'link',
  ];
  return (
    <div className="bg-white text-black">
      <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} formats={formats} placeholder={placeholder} />
    </div>
  );
}
