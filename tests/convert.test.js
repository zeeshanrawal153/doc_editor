import { describe, it, expect } from "vitest";
import {
  isAllowedFilename,
  titleFromFilename,
  txtToHtml,
  mdToHtml,
} from "@/lib/convert";

describe("upload file-type validation", () => {
  it("accepts .txt and .md (case-insensitive)", () => {
    expect(isAllowedFilename("notes.txt")).toBe(true);
    expect(isAllowedFilename("README.md")).toBe(true);
    expect(isAllowedFilename("Notes.MD")).toBe(true);
  });

  it("rejects other extensions", () => {
    expect(isAllowedFilename("resume.docx")).toBe(false);
    expect(isAllowedFilename("image.png")).toBe(false);
    expect(isAllowedFilename("noextension")).toBe(false);
  });
});

describe("titleFromFilename", () => {
  it("strips the extension", () => {
    expect(titleFromFilename("My Notes.md")).toBe("My Notes");
    expect(titleFromFilename("plain.txt")).toBe("plain");
  });
});

describe("txtToHtml", () => {
  it("wraps blank-line-separated blocks in paragraphs", () => {
    expect(txtToHtml("Hello\n\nWorld")).toBe("<p>Hello</p><p>World</p>");
  });

  it("turns single newlines into <br>", () => {
    expect(txtToHtml("line one\nline two")).toBe("<p>line one<br>line two</p>");
  });

  it("escapes HTML special characters", () => {
    expect(txtToHtml("a < b & c")).toBe("<p>a &lt; b &amp; c</p>");
  });
});

describe("mdToHtml", () => {
  it("converts markdown headings and bold to HTML", () => {
    const html = mdToHtml("# Title\n\nSome **bold** text");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("converts markdown lists", () => {
    const html = mdToHtml("- one\n- two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
  });
});
