"use client";

import { useActionState, useEffect } from "react";
import { updateOfficeNames } from "../actions";

export default function NameSettings({
  names,
  onClose,
}: {
  names: { cmo: string; cfo: string; ceo: string };
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateOfficeNames,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="office-modal-backdrop" onClick={onClose}>
      <div className="office-modal" onClick={(e) => e.stopPropagation()}>
        <h2>アバターの名前を編集</h2>
        <form action={formAction}>
          {state?.error && <p className="error-text">{state.error}</p>}
          <div className="field">
            <label htmlFor="office-name-ceo">社長(あなた)</label>
            <input
              id="office-name-ceo"
              name="ceo"
              type="text"
              defaultValue={names.ceo}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="office-name-cmo">CMO</label>
            <input
              id="office-name-cmo"
              name="cmo"
              type="text"
              defaultValue={names.cmo}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="office-name-cfo">CFO</label>
            <input
              id="office-name-cfo"
              name="cfo"
              type="text"
              defaultValue={names.cfo}
              required
            />
          </div>
          <div className="actions-row">
            <button type="submit" disabled={pending}>
              {pending ? "保存中..." : "保存する"}
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
