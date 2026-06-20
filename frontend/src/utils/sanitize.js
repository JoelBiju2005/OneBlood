import DOMPurify from 'dompurify';

/**
 * Strips all HTML tags and returns plain text.
 * Use on any user-generated content before rendering.
 */
export const sanitize = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty || '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

/**
 * Sanitizes HTML while keeping safe formatting tags (bold, italic, links).
 * Use only when you explicitly want to render rich text.
 */
export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty || '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

export default sanitize;
