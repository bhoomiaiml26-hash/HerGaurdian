import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true, gfm: true });

/**
 * Renders AI (IBM Granite) markdown output safely.
 * HTML is sanitized with DOMPurify before insertion.
 */
function Markdown({ content, className = "" }) {
  const html = useMemo(() => {
    if (!content) return "";
    let raw;
    try {
      raw = marked.parse(content);
    } catch {
      raw = content;
    }
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div
      className={`nb-prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default Markdown;
