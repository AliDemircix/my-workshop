import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';

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

  const { text, targetLang } = await req.json() as { text: string; targetLang: string };

  if (!text?.trim() || !targetLang) {
    return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 });
  }

  // DeepL works best with plain text — strip HTML tags before sending
  const plainText = stripHtml(text);

  const body = new URLSearchParams({
    text: plainText,
    target_lang: targetLang.toUpperCase(),
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
    const err = await res.text();
    console.error('DeepL error:', err);
    return NextResponse.json({ error: 'Translation failed', detail: err }, { status: 502 });
  }

  const data = await res.json() as { translations: { text: string }[] };
  const translated = data.translations?.[0]?.text ?? '';

  return NextResponse.json({ translated });
}
