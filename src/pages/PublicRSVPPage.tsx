import { useEffect, useState } from "react";

import { getPublicRSVP, RSVPApiError, submitPublicRSVP } from "../api/rsvp";
import { GuestFields } from "../components/GuestFields";
import { InvitationDetails } from "../components/InvitationDetails";
import type { PublicRSVP } from "../types";

type PageState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "error" }
  | { kind: "ready"; data: PublicRSVP };

type InteractionMode = "summary" | "choice" | "confirm" | "decline";

function initialMode(data: PublicRSVP): InteractionMode {
  return data.rsvp.status === "PENDING" && data.rsvp.can_respond
    ? "choice"
    : "summary";
}

export function PublicRSVPPage() {
  const [token] = useState(() => window.location.hash.slice(1));
  const [pageState, setPageState] = useState<PageState>({ kind: "loading" });
  const [mode, setMode] = useState<InteractionMode>("summary");
  const [guestNames, setGuestNames] = useState<string[]>([""]);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getPublicRSVP(token, controller.signal)
      .then((data) => {
        setPageState({ kind: "ready", data });
        setMode(initialMode(data));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (error instanceof RSVPApiError && error.status === 404) {
          setPageState({ kind: "unavailable" });
          return;
        }
        setPageState({ kind: "error" });
      });

    return () => controller.abort();
  }, [token, loadAttempt]);

  if (pageState.kind === "loading") {
    return (
      <main className="page-shell centered-state" aria-busy="true">
        <div className="loading-mark" aria-hidden="true" />
        <p>Preparando seu convite…</p>
      </main>
    );
  }

  if (pageState.kind === "unavailable") {
    return (
      <main className="page-shell centered-state">
        <p className="eyebrow">Convite</p>
        <h1>Este convite não está disponível.</h1>
        <p>Confira o link recebido ou entre em contato com os anfitriões.</p>
      </main>
    );
  }

  if (pageState.kind === "error") {
    return (
      <main className="page-shell centered-state">
        <p className="eyebrow">Não foi possível abrir</p>
        <h1>Não foi possível carregar o convite. Tente novamente.</h1>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setPageState({ kind: "loading" });
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          Tentar novamente
        </button>
      </main>
    );
  }

  const data = pageState.data;

  function startConfirmation() {
    const currentNames =
      data.rsvp.status === "CONFIRMED" && data.rsvp.guests.length > 0
        ? data.rsvp.guests
        : [""];
    setGuestNames([...currentNames]);
    setFormError("");
    setMode("confirm");
  }

  function startEditing() {
    setFormError("");
    setMode("choice");
  }

  function updateGuestName(index: number, value: string) {
    setGuestNames((current) =>
      current.map((name, nameIndex) => (nameIndex === index ? value : name)),
    );
    setFormError("");
  }

  async function submit(status: "CONFIRMED" | "DECLINED") {
    if (isSubmitting || !data.rsvp.can_respond) {
      return;
    }

    const names = status === "CONFIRMED" ? guestNames.map((name) => name.trim()) : [];
    if (status === "CONFIRMED" && names.some((name) => name.length === 0)) {
      setFormError("Preencha o nome de cada participante ou remova o campo vazio.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      const updatedData = await submitPublicRSVP(token, {
        status,
        guests: names,
      });
      setPageState({ kind: "ready", data: updatedData });
      setMode("summary");
    } catch (error: unknown) {
      if (error instanceof RSVPApiError) {
        if (error.status === 400) {
          setFormError("Revise os nomes informados e tente novamente.");
          return;
        }
        if (error.status === 404) {
          setPageState({ kind: "unavailable" });
          return;
        }
        if (error.status === 409) {
          setPageState({
            kind: "ready",
            data: {
              ...data,
              rsvp: { ...data.rsvp, can_respond: false },
            },
          });
          setMode("summary");
          return;
        }
      }
      setFormError("Não foi possível enviar sua resposta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <article className="invitation-card">
        <InvitationDetails data={data} />

        <section className="rsvp-section" aria-live="polite">
          {!data.rsvp.can_respond && (
            <div className="deadline-notice" role="status">
              <span aria-hidden="true">◇</span>
              <p>O prazo para confirmação foi encerrado.</p>
            </div>
          )}

          {mode === "choice" && data.rsvp.can_respond && (
            <div className="rsvp-panel">
              <p className="section-kicker">Confirmação de presença</p>
              <h2>Você poderá comparecer?</h2>
              <p className="section-copy">
                Sua resposta nos ajuda a preparar cada detalhe com carinho.
              </p>
              <div className="button-stack">
                <button
                  type="button"
                  className="primary-button"
                  onClick={startConfirmation}
                >
                  Sim, confirmarei presença
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setFormError("");
                    setMode("decline");
                  }}
                >
                  Não poderei comparecer
                </button>
                {data.rsvp.status !== "PENDING" && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setMode("summary")}
                  >
                    Manter resposta atual
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === "confirm" && data.rsvp.can_respond && (
            <form
              className="rsvp-panel"
              onSubmit={(event) => {
                event.preventDefault();
                void submit("CONFIRMED");
              }}
            >
              <p className="section-kicker">Quem estará presente?</p>
              <h2>Informe os participantes</h2>
              <p className="section-copy">
                Você pode confirmar de 1 a {data.invitation.guest_limit}{" "}
                {data.invitation.guest_limit === 1 ? "pessoa" : "pessoas"}.
              </p>

              <GuestFields
                names={guestNames}
                guestLimit={data.invitation.guest_limit}
                disabled={isSubmitting}
                onChange={updateGuestName}
                onAdd={() => setGuestNames((names) => [...names, ""])}
                onRemove={(index) =>
                  setGuestNames((names) =>
                    names.filter((_, nameIndex) => nameIndex !== index),
                  )
                }
              />

              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="button-stack form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando…" : "Confirmar presença"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={isSubmitting}
                  onClick={() => setMode(initialMode(data))}
                >
                  Voltar
                </button>
              </div>
            </form>
          )}

          {mode === "decline" && data.rsvp.can_respond && (
            <div className="rsvp-panel">
              <p className="section-kicker">Confirmar resposta</p>
              <h2>Sentiremos sua falta</h2>
              <p className="section-copy">
                Deseja informar que as pessoas deste convite não poderão comparecer?
              </p>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="button-stack">
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSubmitting}
                  onClick={() => void submit("DECLINED")}
                >
                  {isSubmitting ? "Enviando…" : "Confirmar que não iremos"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={isSubmitting}
                  onClick={() => setMode(initialMode(data))}
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {mode === "summary" && (
            <div className="rsvp-panel response-summary">
              {data.rsvp.status === "PENDING" && (
                <>
                  <p className="section-kicker">Confirmação de presença</p>
                  <h2>Aguardando sua resposta</h2>
                </>
              )}

              {data.rsvp.status === "CONFIRMED" && (
                <>
                  <div className="status-mark confirmed" aria-hidden="true">
                    ✓
                  </div>
                  <p className="section-kicker">Resposta registrada</p>
                  <h2>Presença confirmada</h2>
                  <p className="section-copy">Ficamos felizes em celebrar com vocês.</p>
                  <ul className="confirmed-guests" aria-label="Participantes confirmados">
                    {data.rsvp.guests.map((name, index) => (
                      <li key={`${name}-${index}`}>{name}</li>
                    ))}
                  </ul>
                </>
              )}

              {data.rsvp.status === "DECLINED" && (
                <>
                  <div className="status-mark declined" aria-hidden="true">
                    ◇
                  </div>
                  <p className="section-kicker">Resposta registrada</p>
                  <h2>Ausência informada</h2>
                  <p className="section-copy">
                    Obrigado por nos avisar. Sentiremos a falta de vocês.
                  </p>
                </>
              )}

              {data.rsvp.can_respond && data.rsvp.status !== "PENDING" && (
                <button
                  type="button"
                  className="secondary-button edit-response"
                  onClick={startEditing}
                >
                  Alterar resposta
                </button>
              )}
            </div>
          )}
        </section>

        <footer className="invitation-footer">
          <div className="small-flourish" aria-hidden="true">❧</div>
          <p>Esperamos celebrar este momento com você.</p>
        </footer>
      </article>
    </main>
  );
}
