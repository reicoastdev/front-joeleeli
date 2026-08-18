import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { CheckInApiError, login } from "../checkin/api";
import { getCheckInSession, saveLoginSession } from "../checkin/session";

export function CheckInLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (getCheckInSession()) {
    return <Navigate to="/check-in" replace />;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      saveLoginSession(await login(email.trim(), password));
      navigate("/check-in", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof CheckInApiError && requestError.status === 401
          ? "E-mail ou senha inválidos."
          : "Não foi possível entrar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="checkin-shell checkin-login-shell">
      <section className="checkin-login-card">
        <p className="checkin-kicker">Área operacional</p>
        <h1>Check-in do evento</h1>
        <p className="checkin-muted">Entre com o acesso de supervisor.</p>
        <form className="checkin-form" onSubmit={(event) => void submit(event)}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="checkin-error" role="alert">{error}</p>}
          <button className="checkin-primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
