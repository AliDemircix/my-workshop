"use client";
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import RichTextEditor from './RichTextEditor';

type Props = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label: string;
  onValueChange?: (value: string) => void;
};

export type EditorFieldHandle = { getValue: () => string };

const EditorField = forwardRef<EditorFieldHandle, Props>(
  ({ name, defaultValue = '', placeholder, label, onValueChange }, ref) => {
    const [value, setValue] = useState<string>(defaultValue);

    useEffect(() => { setValue(defaultValue); }, [defaultValue]);

    useImperativeHandle(ref, () => ({ getValue: () => value }), [value]);

    function handleChange(v: string) {
      setValue(v);
      onValueChange?.(v);
    }

    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <RichTextEditor value={value} onChange={handleChange} placeholder={placeholder} />
        <input type="hidden" name={name} value={value} />
      </div>
    );
  }
);

EditorField.displayName = 'EditorField';
export default EditorField;
