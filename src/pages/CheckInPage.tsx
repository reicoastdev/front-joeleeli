import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  cancelCheckIn,
  checkInGuest,
  checkInInvitationGuests,
  CheckInApiError,
  getInvitation,
  getMetrics,
  searchInvitations,
  UnknownMutationResultError,
} from "../checkin/api";
import {
  clearCheckInSession,
  getCheckInSession,
  selectSessionEvent,
} from "../checkin/session";
import type {
  CheckInMetrics,
  CheckInSession,
  InvitationDetail,
  InvitationSearchResult,
  OperationalGuest,
  PresenceStatus,
} from "../checkin/types";
import { CancelCheckInDialog } from "../components/CancelCheckInDialog";
import { InvitationResultCard } from "../components/InvitationResultCard";

const statusLabel: Record<PresenceStatus, string> = {
  PENDING: "Pendente",
  PARTIAL: "Parcial",
  COMPLETE: "Completo",
};

type MutationIntent =
  | { kind: "individual"; guestId: number }
  | { kind: "group"; invitationId: number; guestIds: number[] }
  | { kind: "cancel"; checkInId: number; reason: string };

interface RetryOperation {
  intent: MutationIntent;
  key: string;
}

export function CheckInPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CheckInSession | null>(() =>
    getCheckInSession(),
  );
  const [metrics, setMetrics] = useState<CheckInMetrics | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InvitationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [detail, setDetail] = useState<InvitationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);
  const [cancelTarget, setCancelTarget] = useState<OperationalGuest | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [retryOperation, setRetryOperation] = useState<RetryOperation | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const mutationLock = useRef(false);

  const event = session?.events.find(
    (availableEvent) => availableEvent.id === session.selected_event_id,
  );

  useEffect(() => {
    if (!session || !event) return;
    let active = true;
    getMetrics(event.id, session.access_token)
      .then((data) => active && setMetrics(data))
      .catch(() => active && setMetrics(null));
    return () => {
      active = false;
    };
  }, [event, session, refreshVersion]);

  useEffect(() => {
    if (!session || !event || detail) return;
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsSearching(true);
      setSearchError("");
      searchInvitations(
        event.id,
        session.access_token,
        normalizedQuery,
        controller.signal,
      )
        .then((data) => setResults(data.results))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setSearchError("Não foi possível buscar. Verifique sua conexão.");
        })
        .finally(() => setIsSearching(false));
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [detail, event, query, refreshVersion, session]);

  if (!session) {
    return <Navigate to="/check-in/login" replace />;
  }
  const activeSession = session;

  function logout() {
    clearCheckInSession();
    navigate("/check-in/login", { replace: true });
  }

  function chooseEvent(eventId: number) {
    const updated = selectSessionEvent(eventId);
    if (updated) setSession(updated);
  }

  async function openInvitation(invitationId: number) {
    if (!event || isLoadingDetail) return;
    setIsLoadingDetail(true);
    setMutationError("");
    try {
      const invitation = await getInvitation(
        event.id,
        invitationId,
        activeSession.access_token,
      );
      setDetail(invitation);
      setSelectedGuestIds([]);
      setRetryOperation(null);
    } catch {
      setSearchError("Não foi possível abrir o convite.");
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function runMutation(
    intent: MutationIntent,
    idempotencyKey: string = crypto.randomUUID(),
  ) {
    if (!event || mutationLock.current) return;
    mutationLock.current = true;
    setIsMutating(true);
    setMutationError("");
    try {
      const response =
        intent.kind === "individual"
          ? await checkInGuest(
              event.id,
              intent.guestId,
              activeSession.access_token,
              idempotencyKey,
            )
          : intent.kind === "group"
            ? await checkInInvitationGuests(
                event.id,
                intent.invitationId,
                intent.guestIds,
                activeSession.access_token,
                idempotencyKey,
              )
            : await cancelCheckIn(
                event.id,
                intent.checkInId,
                intent.reason,
                activeSession.access_token,
                idempotencyKey,
              );
      setDetail(response.invitation);
      setSelectedGuestIds([]);
      setCancelTarget(null);
      setRetryOperation(null);
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      if (error instanceof UnknownMutationResultError) {
        setCancelTarget(null);
        setRetryOperation({ intent, key: idempotencyKey });
        setMutationError(
          "A conexão caiu antes da confirmação. Tente novamente para consultar o mesmo resultado com segurança.",
        );
      } else {
        setRetryOperation(null);
        setMutationError(
          error instanceof CheckInApiError && error.status === 409
            ? "Esta operação já foi concluída ou não pode mais ser repetida."
            : "Não foi possível concluir a operação.",
        );
      }
    } finally {
      mutationLock.current = false;
      setIsMutating(false);
    }
  }

  if (!event) {
    return (
      <main className="checkin-shell">
        <header className="checkin-topbar">
          <div>
            <p className="checkin-kicker">Supervisor</p>
            <strong>{session.user.email}</strong>
          </div>
          <button type="button" className="checkin-link-button" onClick={logout}>
            Sair
          </button>
        </header>
        <section className="checkin-content">
          <h1>Selecione o evento</h1>
          {session.events.length === 0 ? (
            <p className="checkin-error">Nenhum evento está disponível para este acesso.</p>
          ) : (
            <div className="checkin-event-list">
              {session.events.map((availableEvent) => (
                <button
                  type="button"
                  className="checkin-result-card"
                  key={availableEvent.id}
                  onClick={() => chooseEvent(availableEvent.id)}
                >
                  <strong>{availableEvent.name}</strong>
                  <small>Supervisor</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  const pendingGuests = detail?.guests.filter((guest) => !guest.is_present) ?? [];

  return (
    <main className="checkin-shell">
      <header className="checkin-topbar">
        <div>
          <p className="checkin-kicker">{event.name}</p>
          <strong>{session.user.email}</strong>
        </div>
        <button type="button" className="checkin-link-button" onClick={logout}>
          Sair
        </button>
      </header>

      <section className="checkin-content">
        {detail ? (
          <>
            <button
              type="button"
              className="checkin-back-button"
              onClick={() => {
                setDetail(null);
                setMutationError("");
                setRetryOperation(null);
              }}
            >
              ← Voltar à busca
            </button>
            <section className="checkin-detail-header">
              <p className="checkin-kicker">{detail.category.name}</p>
              <h1>{detail.description}</h1>
              <p>Responsável: {detail.responsible_name}</p>
              {detail.notes && <p className="checkin-notes">{detail.notes}</p>}
              <span
                className={`checkin-status checkin-status-${detail.presence_status.toLowerCase()}`}
              >
                {statusLabel[detail.presence_status]} · {detail.present_count}/
                {detail.confirmed_count} presentes
              </span>
            </section>

            {mutationError && (
              <div className="checkin-error-panel" role="alert">
                <p>{mutationError}</p>
                {retryOperation && (
                  <button
                    type="button"
                    className="checkin-primary-button"
                    disabled={isMutating}
                    onClick={() =>
                      void runMutation(retryOperation.intent, retryOperation.key)
                    }
                  >
                    {isMutating ? "Verificando…" : "Tentar novamente com segurança"}
                  </button>
                )}
              </div>
            )}

            <section className="checkin-participant-list">
              {detail.guests.map((guest) => (
                <article className="checkin-participant" key={guest.id}>
                  {!guest.is_present && (
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${guest.name}`}
                      checked={selectedGuestIds.includes(guest.id)}
                      disabled={isMutating}
                      onChange={(event) =>
                        setSelectedGuestIds((current) =>
                          event.target.checked
                            ? [...current, guest.id]
                            : current.filter((id) => id !== guest.id),
                        )
                      }
                    />
                  )}
                  <div className="checkin-participant-name">
                    <strong>{guest.name}</strong>
                    <span>{guest.is_present ? "✓ Presente" : "○ Pendente"}</span>
                  </div>
                  {guest.is_present && guest.active_check_in ? (
                    <button
                      type="button"
                      className="checkin-cancel-button"
                      disabled={isMutating}
                      onClick={() => setCancelTarget(guest)}
                    >
                      Cancelar entrada
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="checkin-small-primary"
                      disabled={isMutating}
                      onClick={() =>
                        void runMutation({ kind: "individual", guestId: guest.id })
                      }
                    >
                      {isMutating ? "Aguarde…" : "Registrar entrada"}
                    </button>
                  )}
                </article>
              ))}
            </section>

            {pendingGuests.length > 0 && (
              <div className="checkin-sticky-actions">
                <button
                  type="button"
                  className="checkin-primary-button"
                  disabled={isMutating}
                  onClick={() =>
                    void runMutation({
                      kind: "group",
                      invitationId: detail.id,
                      guestIds: pendingGuests.map((guest) => guest.id),
                    })
                  }
                >
                  {isMutating ? "Registrando…" : "Registrar todos os pendentes"}
                </button>
                <button
                  type="button"
                  className="checkin-secondary-button"
                  disabled={isMutating || selectedGuestIds.length === 0}
                  onClick={() =>
                    void runMutation({
                      kind: "group",
                      invitationId: detail.id,
                      guestIds: selectedGuestIds,
                    })
                  }
                >
                  Registrar selecionados ({selectedGuestIds.length})
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <section className="checkin-metrics" aria-label="Resumo do evento">
              <div>
                <span>Presentes</span>
                <strong>
                  {metrics ? `${metrics.present_guests} / ${metrics.confirmed_guests}` : "—"}
                </strong>
              </div>
              <div>
                <span>Pendentes</span>
                <strong>{metrics?.pending_guests ?? "—"}</strong>
              </div>
            </section>
            <label className="checkin-search-label">
              <span>Buscar convite ou convidado</span>
              <input
                type="search"
                autoComplete="off"
                placeholder="Ex.: Família Oliveira ou Ana"
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  if (!value.trim()) {
                    setResults([]);
                    setSearchError("");
                    setIsSearching(false);
                  }
                }}
              />
            </label>
            {isSearching && <div className="checkin-skeleton">Buscando convites…</div>}
            {isLoadingDetail && <div className="checkin-skeleton">Abrindo convite…</div>}
            {searchError && <p className="checkin-error" role="alert">{searchError}</p>}
            {!isSearching && query.trim() && results.length === 0 && !searchError && (
              <p className="checkin-empty">Nenhum convite encontrado.</p>
            )}
            <section className="checkin-results" aria-live="polite">
              {results.map((invitation) => (
                <InvitationResultCard
                  key={invitation.id}
                  invitation={invitation}
                  onOpen={() => void openInvitation(invitation.id)}
                />
              ))}
            </section>
          </>
        )}
      </section>

      {cancelTarget?.active_check_in && (
        <CancelCheckInDialog
          key={cancelTarget.active_check_in.id}
          guestName={cancelTarget.name}
          isSubmitting={isMutating}
          onCancel={() => setCancelTarget(null)}
          onConfirm={(reason) =>
            void runMutation({
              kind: "cancel",
              checkInId: cancelTarget.active_check_in!.id,
              reason,
            })
          }
        />
      )}
    </main>
  );
}
