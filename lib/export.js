"use client";

// Client-side document export helpers. The heavy libraries (turndown, jspdf,
// html2canvas) are dynamically imported only when an export is triggered, so
// they add nothing to the initial bundle and never run during SSR.

// Make a filesystem-safe filename from a document title.
function safeName(title) {
  const base = (title || "document").trim().replace(/[\\/:*?"<>|]+/g, "-");
  return base.length ? base : "document";
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Markdown ---
// Convert the document's HTML to Markdown and download it as a .md file.
export async function exportAsMarkdown(html, title) {
  const TurndownService = (await import("turndown")).default;
  const td = new TurndownService({
    headingStyle: "atx", // "# Heading" style
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  const markdown = td.turndown(html || "");
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `${safeName(title)}.md`);
}

// --- PDF ---
// Render the document HTML into an off-screen, print-styled container, rasterize
// it with html2canvas, and slice it across A4 pages in a jsPDF document.
export async function exportAsPdf(html, title) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const PAGE_WIDTH_PX = 794; // ~A4 width (210mm) at 96dpi
  const container = document.createElement("div");
  container.className = "rich-text";
  Object.assign(container.style, {
    position: "fixed",
    left: "-99999px",
    top: "0",
    width: `${PAGE_WIDTH_PX}px`,
    padding: "48px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#0f172a",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "16px",
    lineHeight: "1.6",
  });
  container.innerHTML = html && html.trim() ? html : "<p></p>";
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      windowWidth: PAGE_WIDTH_PX,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
    heightLeft -= pageH;

    // Add extra pages by shifting the same tall image upward.
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
      heightLeft -= pageH;
    }

    pdf.save(`${safeName(title)}.pdf`);
  } finally {
    container.remove();
  }
}
