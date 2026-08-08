"use client";

import { useActionState, useEffect } from "react";
import { updateEditorialGuidelines } from "../actions";

export default function EditorialSettings({
  guidelines,
  onClose,
}: {
  guidelines: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateEditorialGuidelines,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="office-modal-backdrop" onClick={onClose}>
      <div className="office-modal" onClick={(e) => e.stopPropagation()}>
        <h2>note記事の編集方針</h2>
        <p className="office-modal-hint">
          CMO・執筆担当のAIが記事を書く前に必ず参照するルールです。ここで決めた内容は次回の定期実行から反映されます。
        </p>
        <form action={formAction}>
          {state?.error && <p className="error-text">{state.error}</p>}
          <div className="field">
            <label htmlFor="editorial-guidelines">方針</label>
            <textarea
              id="editorial-guidelines"
              name="guidelines"
              defaultValue={guidelines}
              rows={10}
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
