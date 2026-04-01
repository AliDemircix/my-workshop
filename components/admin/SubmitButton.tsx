"use client";
import { useFormStatus } from 'react-dom';

/**
 * A form submit button that automatically disables itself while the form is
 * pending (i.e. while the server action is in-flight), preventing duplicate
 * submissions. Drop it inside any <form> that uses a Server Action.
 */
export default function SubmitButton({
  children,
  className,
  pendingText,
}: {
  children: React.ReactNode;
  /** Tailwind class string for the button. Defaults to a dark "Save" style. */
  className?: string;
  /** Label to show while the form is pending. Defaults to children with an ellipsis. */
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  const base =
    className ??
    'bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium transition-opacity';

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${base} disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-1`}
    >
      {pending ? (pendingText ?? '…') : children}
    </button>
  );
}
