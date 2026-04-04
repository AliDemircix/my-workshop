import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminAuthenticated } from '@/lib/auth';

const ALLOWED_LANGS = ['NL', 'EN', 'TR', 'DE', 'FR', 'ES', 'IT', 'PT', 'PL', 'RU', 'JA', 'ZH'] as const;
const MAX_TEXT_LENGTH = 5000;

const translateSchema = z.object({
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  targetLang: z.enum(ALLOWED_LANGS),
});

// Strip HTML tags to get plain text for DeepL (DeepL supports HTML but free tier is safer with text)
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPL_API_KEY not configured' }, { status: 503 });
  }

  const parsed = translateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { text, targetLang } = parsed.data;

  // DeepL works best with plain text — strip HTML tags before sending
  const plainText = stripHtml(text);

  const body = new URLSearchParams({
    text: plainText,
    target_lang: targetLang,
  });

  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    console.error('DeepL error:', res.status, await res.text());
    return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
  }

  const data = await res.json() as { translations: { text: string }[] };
  const translated = data.translations?.[0]?.text ?? '';

  return NextResponse.json({ translated });
}
