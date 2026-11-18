import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "del",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "br",
    "hr",
    "input",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    ul: ["data-type", "class"],
    li: ["data-type", "data-checked", "class"],
    input: ["type", "checked", "disabled"],
    span: ["class", "style"],
    code: ["class"],
    pre: ["class"],
    p: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => {
      // Enforce safe target and rel for external links
      return {
        tagName: "a",
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      };
    },
  },
};

/**
 * Sanitize HTML to prevent stored XSS while preserving rich text formatting.
 */
export function sanitizeNoteHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}

/**
 * Extract clean plain text from HTML for search indexing and snippet display.
 */
export function extractPlainText(html: string): string {
  if (!html || typeof html !== "string") return "";

  // Replace block elements and line breaks with space
  const withSpaces = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<\/h[1-6]>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<\/blockquote>/gi, " ");

  // Strip all remaining tags
  const stripped = withSpaces.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  const decoded = stripped
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");

  // Normalize multiple spaces into single space
  return decoded.replace(/\s+/g, " ").trim();
}

/**
 * Compute word count from plain text.
 */
export function computeWordCount(plainText: string): number {
  if (!plainText || typeof plainText !== "string") return 0;
  const words = plainText.trim().split(/\s+/).filter(Boolean);
  return words.length;
}
