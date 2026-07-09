"use client";

import { Download } from "lucide-react";
import { downloadInvoiceHtml, type DownloadInvoiceData } from "@/lib/invoice-download";

type DownloadSavedInvoiceButtonProps = {
  invoice: DownloadInvoiceData;
};

export default function DownloadSavedInvoiceButton({ invoice }: DownloadSavedInvoiceButtonProps) {
  return (
    <button className="icon-action" onClick={() => downloadInvoiceHtml(invoice)} type="button">
      <Download size={15} />
      Download
    </button>
  );
}
