declare module "pdfjs-dist/build/pdf.mjs" {
  export interface PdfTextContent {
    items: unknown[];
  }

  export interface PdfPageProxy {
    getTextContent: () => Promise<PdfTextContent>;
  }

  export interface PdfDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  }

  export interface PdfLoadingTask {
    promise: Promise<PdfDocumentProxy>;
  }

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(args: { data: ArrayBuffer }): PdfLoadingTask;
}
