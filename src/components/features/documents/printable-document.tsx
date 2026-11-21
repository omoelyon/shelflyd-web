'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DocumentDto } from '@/types/documents';
import DocumentView from './document-view';
import { useMounted } from './use-mounted';

/**
 * How a document prints. The dashboard and the shop pages are full of navigation, so printing the page as it stands
 * would put all of that on paper. Instead a second copy of the document lives in a portal that is a direct child of
 * <body>: on screen it is hidden, and when printing every other child of <body> is removed (display:none, so it takes
 * no space and cannot add blank pages) and only the document remains. Ctrl+P / Cmd+P behaves the same as the button.
 *
 *  - @page (top level, for the widest browser support) sets A4 and the paper margins; the sheet itself then drops its
 *    own padding, width cap and shadow.
 *  - Table header rows repeat on every page and rows are never split across pages.
 *  - Colours are forced to print (browsers otherwise strip backgrounds), such as the header shading and PAID stamp.
 */
const PRINT_CSS = `
.doc-print-portal { display: none; }
@page { size: A4; margin: 14mm; }
@media print {
  html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
  body > *:not(.doc-print-portal) { display: none !important; }
  .doc-print-portal { display: block !important; }
  .doc-print-portal .doc-sheet { max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
  .doc-print-portal, .doc-print-portal * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-print-portal thead { display: table-header-group; }
  .doc-print-portal tr, .doc-print-portal section, .doc-print-portal footer { break-inside: avoid; page-break-inside: avoid; }
}
`;

interface Props {
  doc: DocumentDto;
  /** Extra controls on the left of the toolbar (a back link, the document type switch). */
  toolbar?: ReactNode;
}

/** A document on screen with a "Print / Save as PDF" button, plus the print-only copy described above. */
export default function PrintableDocument({ doc, toolbar }: Props) {
  const mounted = useMounted();

  // Browsers name a saved PDF after the page title, so the title is the document number while this page is open.
  useEffect(() => {
    const previous = document.title;
    document.title = doc.number;
    return () => {
      document.title = previous;
    };
  }, [doc.number]);

  return (
    <>
      <style>{PRINT_CSS}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{toolbar}</div>
        <Button type="button" onClick={() => window.print()} className="bg-[#091426] text-white hover:bg-[#091426]/90">
          <Printer className="mr-1.5 h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="rounded-2xl bg-[#eef2f7] p-2 sm:p-6">
        <DocumentView doc={doc} />
      </div>
      <p className="mt-3 text-xs text-[#64748b]">
        To save a PDF, choose &ldquo;Save as PDF&rdquo; as the printer in the print window.
      </p>

      {mounted && createPortal(<div className="doc-print-portal"><DocumentView doc={doc} /></div>, document.body)}
    </>
  );
}
