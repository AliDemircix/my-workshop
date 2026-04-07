type CategoryStat = {
  name: string;
  bookings: number;
  revenue: number;
  fillRate: number;
};

type Props = {
  stats: CategoryStat[];
};

export default function CategoryStats({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Category Performance</h2>
        <p className="text-sm text-gray-500">No paid bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Category Performance</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.name} className="border border-gray-100 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-800 truncate" title={s.name}>
              {s.name}
            </p>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total bookings</span>
                <span className="font-medium text-gray-900">{s.bookings}</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue</span>
                <span className="font-medium text-[#c99706]">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(s.revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg fill rate</span>
                <span className="font-medium text-gray-900">{s.fillRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
