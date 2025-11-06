"use client";
import { useEffect, useState } from 'react';
import RichTextEditor from './RichTextEditor';

type Props = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label: string;
};

export default function EditorField({ name, defaultValue = '', placeholder, label }: Props) {
  const [value, setValue] = useState<string>(defaultValue);
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <RichTextEditor value={value} onChange={setValue} placeholder={placeholder} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
