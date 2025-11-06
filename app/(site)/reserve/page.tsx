import ReservationFlow from '@/components/reservation/ReservationFlow';

export default function ReservePage() {
  return (
    <main className="space-y-4">
  <h2 className="text-2xl md:text-3xl font-semibold">Reserve a workshop</h2>
      <div className="h-px bg-gray-200" />
      <ReservationFlow />
    </main>
  );
}
