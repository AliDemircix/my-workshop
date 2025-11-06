export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // remove non alphanum
    .replace(/\s+/g, '-') // spaces to hyphen
    .replace(/-+/g, '-') // collapse hyphens
    .replace(/^-|-$/g, ''); // trim hyphens
}