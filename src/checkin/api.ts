import { clearCheckInSession } from "./session";
import type {
  CheckInMetrics,
  InvitationDetail,
  InvitationSearchResult,
  LoginResponse,
  MutationResponse,
} from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class CheckInApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("Não foi possível concluir a solicitação.");
    this.name = "CheckInApiError";
    this.status = status;
  }
}

export class UnknownMutationResultError extends Error {
  constructor() {
    super("A conexão caiu antes de confirmar o resultado.");
    this.name = "UnknownMutationResultError";
  }
}

async function parseResponse<T>(
  response: Response,
  redirectOnUnauthorized = true,
): Promise<T> {
  if (response.status === 401 && redirectOnUnauthorized) {
    clearCheckInSession();
    window.location.assign("/check-in/login");
    throw new CheckInApiError(401);
  }
  if (!response.ok) {
    throw new CheckInApiError(response.status);
  }
  return (await response.json()) as T;
}

async function operationalFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return parseResponse<T>(response);
}

async function mutationFetch(
  path: string,
  token: string,
  idempotencyKey: string,
  body?: object,
) {
  try {
    return await operationalFetch<MutationResponse>(path, token, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new UnknownMutationResultError();
    }
    throw error;
  }
}

export async function login(email: string, password: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login/`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<LoginResponse>(response, false);
}

export function getMetrics(eventId: number, token: string) {
  return operationalFetch<CheckInMetrics>(
    `/api/v1/events/${eventId}/check-in/metrics/`,
    token,
  );
}

export function searchInvitations(
  eventId: number,
  token: string,
  query: string,
  signal?: AbortSignal,
) {
  return operationalFetch<{ results: InvitationSearchResult[] }>(
    `/api/v1/events/${eventId}/check-in/search/?q=${encodeURIComponent(query)}`,
    token,
    { signal },
  );
}

export function getInvitation(eventId: number, invitationId: number, token: string) {
  return operationalFetch<InvitationDetail>(
    `/api/v1/events/${eventId}/check-in/invitations/${invitationId}/`,
    token,
  );
}

export function checkInGuest(
  eventId: number,
  guestId: number,
  token: string,
  idempotencyKey: string,
) {
  return mutationFetch(
    `/api/v1/events/${eventId}/check-in/guests/${guestId}/`,
    token,
    idempotencyKey,
  );
}

export function checkInInvitationGuests(
  eventId: number,
  invitationId: number,
  guestIds: number[],
  token: string,
  idempotencyKey: string,
) {
  return mutationFetch(
    `/api/v1/events/${eventId}/check-in/invitations/${invitationId}/`,
    token,
    idempotencyKey,
    { guest_ids: guestIds },
  );
}

export function cancelCheckIn(
  eventId: number,
  checkInId: number,
  reason: string,
  token: string,
  idempotencyKey: string,
) {
  return mutationFetch(
    `/api/v1/events/${eventId}/check-in/check-ins/${checkInId}/cancel/`,
    token,
    idempotencyKey,
    { reason },
  );
}
