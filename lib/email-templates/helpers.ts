export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renders a gold CTA button that works in most email clients. */
export function ctaButton(href: string, label: string): string {
  return `<p>
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#c99706;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
      ${escapeHtml(label)}
    </a>
  </p>`;
}

/** Wraps the body HTML in a minimal email shell. */
export function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;">
  ${body}
</body>
</html>`;
}
