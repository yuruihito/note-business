"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { submitOfficeRequest } from "../actions";

export default function OfficeRequestForm({
  onSuccess,
  footer,
  autoFocus = true,
}: {
  onSuccess?: () => void;
  footer?: ReactNode;
  autoFocus?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitOfficeRequest,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction}>
      {state?.error && <p className="error-text">{state.error}</p>}
      <div className="field">
        <textarea
          name="text"
          placeholder="例: noteで〇〇について市場調査して"
          required
          autoFocus={autoFocus}
        />
      </div>
      <div className="actions-row">
        <button type="submit" disabled={pending}>
          {pending ? "送信中..." : "依頼する"}
        </button>
        {footer}
      </div>
    </form>
  );
}
