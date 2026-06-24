import { marked } from "marked";

// Convert uploaded plain-text / markdown files into the HTML that TipTap stores.
// Only .txt and .md are supported (stated in the UI + README).

export const ALLOWED_EXTENSIONS = [".txt", ".md"];
export const MAX_UPLOAD_BYTES = 1_000_000; // 1 MB — generous for text files

export function getExtension(filename) {
  if (typeof filename !== "string") return "";
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function isAllowedFilename(filename) {
  return ALLOWED_EXTENSIONS.includes(getExtension(filename));
}

// Strip the extension to use as a default document title.
export function titleFromFilename(filename) {
  const dot = filename.lastIndexOf(".");
  const base = dot === -1 ? filename : filename.slice(0, dot);
  return base.trim() || "Untitled document";
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Plain text -> paragraphs. Blank lines separate paragraphs; single newlines
// become <br>.
export function txtToHtml(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n{2,}/);
  const html = blocks
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
    .map((b) => `<p>${escapeHtml(b).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return html || "<p></p>";
}

// Markdown -> HTML via marked.
export function mdToHtml(text) {
  return marked.parse(text, { async: false });
}

// Dispatch on extension. Caller must have validated the extension first.
export function fileToHtml(filename, text) {
  return getExtension(filename) === ".md" ? mdToHtml(text) : txtToHtml(text);
}
