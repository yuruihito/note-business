"use client";

import { useActionState, useEffect } from "react";
import { submitOfficeRequest } from "../actions";

export default function RequestModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(
    submitOfficeRequest,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="office-modal-backdrop" onClick={onClose}>
      <div className="office-modal" onClick={(e) => e.stopPropagation()}>
        <h2>依頼する</h2>
        <form action={formAction}>
          {state?.error && <p className="error-text">{state.error}</p>}
          <div className="field">
            <label htmlFor="office-request-text">依頼内容</label>
            <textarea id="office-request-text" name="text" required autoFocus />
          </div>
          <div className="actions-row">
            <button type="submit" disabled={pending}>
              {pending ? "送信中..." : "依頼する"}
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              閉じる
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
