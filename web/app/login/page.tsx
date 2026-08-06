"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="login-wrap">
      <h1>AI-CEO ダッシュボード</h1>
      <form action={formAction}>
        {state?.error && <p className="error-text">{state.error}</p>}
        <div className="field">
          <label htmlFor="password">パスフレーズ</label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            required
          />
        </div>
        <button type="submit" disabled={pending}>
          {pending ? "確認中..." : "入る"}
        </button>
      </form>
    </div>
  );
}
