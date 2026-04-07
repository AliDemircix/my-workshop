"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PromoCode {
  id: number;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

interface Props {
  promoCodes: PromoCode[];
  categories: Category[];
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isExpired(validUntil: string | null): boolean {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

function isExhausted(maxUses: number | null, usedCount: number): boolean {
  return maxUses !== null && usedCount >= maxUses;
}

export default function PromoCodesClient({ promoCodes, categories, createAction, deleteAction }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* Create Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Create New Promo Code</h2>
        <form action={createAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                name="code"
                required
                type="text"
                placeholder="SUMMER20"
                className="w-full border rounded px-3 py-2 text-sm uppercase tracking-widest font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              >
                <option value="">Select type</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_EUR">Fixed amount (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value <span className="text-red-500">*</span>
              </label>
              <input
                name="value"
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="10"
                className="w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              />
              <p className="text-xs text-gray-400 mt-1">For percentage: 0–100. For fixed: amount in euros.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
              <input
                name="maxUses"
                type="number"
                min="1"
                placeholder="Unlimited"
                className="w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input
                name="validFrom"
                type="datetime-local"
                className="w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                name="validUntil"
                type="datetime-local"
                className="w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restrict to Category (optional)
              </label>
              <select
                name="categoryId"
                className="w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#c99706] hover:bg-[#b3860a] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Create Promo Code
            </button>
          </div>
        </form>
      </div>

      {/* Promo Codes Table */}
      {promoCodes.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">All Promo Codes ({promoCodes.length})</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Value</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Uses</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Valid From</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Valid Until</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promoCodes.map((p) => {
                  const expired = isExpired(p.validUntil);
                  const exhausted = isExhausted(p.maxUses, p.usedCount);
                  const inactive = expired || exhausted;

                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 ${inactive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-mono font-semibold tracking-wider">{p.code}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.type === 'PERCENTAGE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {p.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed EUR'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {p.type === 'PERCENTAGE'
                          ? `${p.value}%`
                          : `€${p.value.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3">
                        {p.usedCount}
                        {p.maxUses !== null ? ` / ${p.maxUses}` : ' / ∞'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.validFrom)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.validUntil)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                            Expired
                          </span>
                        ) : exhausted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Exhausted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {confirmDeleteId === p.id ? (
                          <form action={deleteAction} className="flex items-center gap-2">
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              className="text-xs text-red-600 hover:text-red-800 font-semibold"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="text-xs text-gray-500 hover:text-gray-700"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-700 focus-visible:outline-none"
                            onClick={() => setConfirmDeleteId(p.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center space-y-2">
          <p className="text-gray-600 font-medium">No promo codes yet</p>
          <p className="text-sm text-gray-400">Create your first promo code using the form above.</p>
        </div>
      )}
    </div>
  );
}
