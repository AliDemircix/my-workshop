import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/auth';
import { formatEUR } from '@/lib/currency';

export default async function GiftCardsPage() {
  requireAdminAction();

  async function createGiftCard(formData: FormData) {
    'use server';
    requireAdminAction();

    const name = String(formData.get('name') || '').trim();
    if (!name) return;

    const priceEuros = parseFloat(String(formData.get('priceEuros') || '0'));
    if (!priceEuros || priceEuros < 1) return;
    const priceCents = Math.round(priceEuros * 100);

    const rawCategoryId = String(formData.get('categoryId') || '').trim();
    const categoryId = rawCategoryId ? parseInt(rawCategoryId, 10) : null;

    const description = String(formData.get('description') || '').trim() || null;
    const imageUrl = String(formData.get('imageUrl') || '').trim() || null;

    await prisma.giftCard.create({
      data: {
        name,
        priceCents,
        categoryId: categoryId && !isNaN(categoryId) ? categoryId : null,
        description,
        imageUrl,
      },
    });

    revalidatePath('/admin/gift-cards');
  }

  async function deleteGiftCard(formData: FormData) {
    'use server';
    requireAdminAction();

    const id = parseInt(String(formData.get('id') || '0'), 10);
    if (!id) return;

    await prisma.giftCard.delete({ where: { id } });
    revalidatePath('/admin/gift-cards');
  }

  async function toggleGiftCard(formData: FormData) {
    'use server';
    requireAdminAction();

    const id = parseInt(String(formData.get('id') || '0'), 10);
    if (!id) return;

    const card = await prisma.giftCard.findUnique({ where: { id } });
    if (!card) return;

    await prisma.giftCard.update({
      where: { id },
      data: { active: !card.active },
    });
    revalidatePath('/admin/gift-cards');
  }

  const [giftCards, categories] = await Promise.all([
    prisma.giftCard.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
        <p className="text-gray-600 mt-1">Create and manage gift card products shown on the public shop</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Gift Card</h2>
        <form action={createGiftCard} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="gc-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="gc-name"
                name="name"
                type="text"
                required
                placeholder="e.g. Pottery Workshop Gift Card"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="gc-price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (€) <span className="text-red-500">*</span>
              </label>
              <input
                id="gc-price"
                name="priceEuros"
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="e.g. 45"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="gc-category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                id="gc-category"
                name="categoryId"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
              >
                <option value="">— No category —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="gc-image" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="gc-image"
                name="imageUrl"
                type="text"
                placeholder="https://..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="gc-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="gc-desc"
              name="description"
              rows={3}
              placeholder="Short description shown on the gift card..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706] resize-none"
            />
          </div>

          <div>
            <button
              type="submit"
              className="bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-5 py-2 rounded text-sm transition-colors"
            >
              Create Gift Card
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Existing Gift Cards</h2>
          <span className="text-sm text-gray-500">
            {giftCards.length} {giftCards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {giftCards.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 text-sm">
            No gift cards created yet. Use the form above to add the first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm">
                  <th className="px-3 py-2 border-b font-medium text-gray-700">Image</th>
                  <th className="px-3 py-2 border-b font-medium text-gray-700">Name</th>
                  <th className="px-3 py-2 border-b font-medium text-gray-700">Category</th>
                  <th className="px-3 py-2 border-b font-medium text-gray-700">Price</th>
                  <th className="px-3 py-2 border-b font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 border-b font-medium text-gray-700">Created</th>
                  <th className="px-3 py-2 border-b font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {giftCards.map((card) => (
                  <tr key={card.id} className="text-sm hover:bg-gray-50">
                    <td className="px-3 py-2">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="h-10 w-14 object-cover rounded border"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded border bg-gray-100" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">{card.name}</p>
                      {card.description && (
                        <p className="text-xs text-gray-500 truncate max-w-xs">{card.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {card.category?.name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {formatEUR(card.priceCents)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          card.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {card.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(card.createdAt).toDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {/* Toggle active */}
                        <form action={toggleGiftCard}>
                          <input type="hidden" name="id" value={card.id} />
                          <button
                            type="submit"
                            className={`text-xs font-medium px-2.5 py-1 rounded border transition-colors ${
                              card.active
                                ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                : 'border-green-300 text-green-700 hover:bg-green-50'
                            }`}
                            title={card.active ? 'Deactivate' : 'Activate'}
                          >
                            {card.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </form>

                        {/* Delete */}
                        <form action={deleteGiftCard}>
                          <input type="hidden" name="id" value={card.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete gift card"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
