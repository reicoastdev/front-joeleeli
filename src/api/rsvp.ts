import type { PublicRSVP, RSVPSubmission } from "../types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class RSVPApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("Não foi possível concluir a solicitação.");
    this.name = "RSVPApiError";
    this.status = status;
  }
}

function rsvpEndpoint(token: string) {
  return `${apiBaseUrl}/api/v1/public/invitations/${encodeURIComponent(token)}/rsvp/`;
}

async function parseResponse(response: Response): Promise<PublicRSVP> {
  if (!response.ok) {
    throw new RSVPApiError(response.status);
  }
  return (await response.json()) as PublicRSVP;
}

export async function getPublicRSVP(
  token: string,
  signal?: AbortSignal,
): Promise<PublicRSVP> {
  const response = await fetch(rsvpEndpoint(token), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  return parseResponse(response);
}

export async function submitPublicRSVP(
  token: string,
  submission: RSVPSubmission,
): Promise<PublicRSVP> {
  const response = await fetch(rsvpEndpoint(token), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });
  return parseResponse(response);
}
