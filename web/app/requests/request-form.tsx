"use client";

import { useActionState } from "react";
import { submitRequest } from "../actions";

export default function RequestForm() {
  const [state, formAction, pending] = useActionState(
    submitRequest,
    undefined
  );

  return (
    <form action={formAction}>
      {state?.error && <p className="error-text">{state.error}</p>}
      <div className="field">
        <label htmlFor="text">依頼内容</label>
        <textarea id="text" name="text" required />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "送信中..." : "依頼する"}
      </button>
    </form>
  );
}
