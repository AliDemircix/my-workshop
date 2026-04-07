"use client";
import { format } from 'date-fns';
import { type PrefillSession } from './AddWorkshopDialog';

type Props = {
  session: {
    categoryId: number;
    startTime: Date | string;
    endTime: Date | string;
    capacity: number;
    priceCents: number;
  };
  onDuplicate: (data: PrefillSession) => void;
};

export default function DuplicateSessionButton({ session, onDuplicate }: Props) {
  function handleClick() {
    onDuplicate({
      categoryId: session.categoryId,
      startTime: format(new Date(session.startTime), 'HH:mm'),
      endTime: format(new Date(session.endTime), 'HH:mm'),
      capacity: session.capacity,
      priceCents: session.priceCents,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Duplicate session"
      aria-label="Duplicate session"
      className="text-gray-500 hover:text-[#c99706] inline-flex flex-col items-center px-1 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
      </svg>
      <span className="text-[10px] text-gray-500 block text-center">Copy</span>
    </button>
  );
}
