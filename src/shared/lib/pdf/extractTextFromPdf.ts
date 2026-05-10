import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

// Pure client-side worker from CDN (no webpack worker config needed).
const WORKER_CDN = "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

interface PdfDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
}

interface PdfPageProxy {
  getTextContent: () => Promise<PdfTextContent>;
}

interface PdfTextContent {
  items: unknown[];
}

interface PdfLoadingTask {
  promise: Promise<PdfDocumentProxy>;
}

type PdfJs = typeof pdfjsLib & {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (args: { data: ArrayBuffer }) => PdfLoadingTask;
};

interface TextItemLike {
  str: string;
}

function isTextItemLike(item: unknown): item is TextItemLike {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const maybeItem = item as { str?: unknown };
  return typeof maybeItem.str === "string";
}

const pdf = pdfjsLib as unknown as PdfJs;
pdf.GlobalWorkerOptions.workerSrc = WORKER_CDN;

export async function extractTextFromPdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const loadingTask = pdf.getDocument({ data: buf });
  const doc = await loadingTask.promise;

  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((item) => (isTextItemLike(item) ? item.str : ""))
      .join(" ");

    parts.push(pageText);
  }

  return parts
    .join("\n\n")
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
