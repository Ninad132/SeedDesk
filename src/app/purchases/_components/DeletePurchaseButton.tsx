"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteInwardSlip } from "../actions";

type DeletePurchaseButtonProps = {
  inwardSlipId: string;
};

export default function DeletePurchaseButton({ inwardSlipId }: DeletePurchaseButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isDeleting, startDeleting] = useTransition();

  function deleteRow() {
    const confirmed = window.confirm("Delete this inward entry and reverse its linked purchase stock?");

    if (!confirmed) {
      return;
    }

    setMessage("");
    startDeleting(async () => {
      const result = await deleteInwardSlip(inwardSlipId);

      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="row-action-stack">
      <button className="icon-action danger-action" disabled={isDeleting} onClick={deleteRow} type="button">
        <Trash2 size={15} />
        {isDeleting ? "Deleting" : "Delete"}
      </button>
      {message ? <span className="row-error">{message}</span> : null}
    </div>
  );
}
