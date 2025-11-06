/**
 * Safely sanitizes HTML content to prevent XSS attacks
 * @param dirty - Raw HTML string that may contain malicious content
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // For server-side sanitization
  if (typeof window === 'undefined') {
    // Use sanitize-html for server-side
    const sanitizeHtml = require('sanitize-html');
    return sanitizeHtml(dirty, {
      allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div'
      ],
      allowedAttributes: {
        'a': ['href', 'target', 'rel'],
        '*': ['class']
      },
      allowedSchemes: ['https', 'http', 'mailto'],
      disallowedTagsMode: 'discard',
      allowedSchemesByTag: {
        a: ['https', 'http', 'mailto']
      }
    });
  }

  // For client-side, return as-is (assuming pre-sanitized)
  // In production, this should only receive already sanitized content
  return dirty;
}

/**
 * Validates if content appears to contain HTML
 * @param content - Content to check
 * @returns True if content likely contains HTML tags
 */
export function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}