import type { CheckInSession, LoginResponse } from "./types";

const sessionKey = "joeleeli.checkin.session";

export function getCheckInSession(): CheckInSession | null {
  const rawSession = sessionStorage.getItem(sessionKey);
  if (!rawSession) {
    return null;
  }
  try {
    return JSON.parse(rawSession) as CheckInSession;
  } catch {
    clearCheckInSession();
    return null;
  }
}

export function saveLoginSession(login: LoginResponse): CheckInSession {
  const session: CheckInSession = {
    ...login,
    selected_event_id: login.events.length === 1 ? login.events[0].id : null,
  };
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}

export function selectSessionEvent(eventId: number): CheckInSession | null {
  const session = getCheckInSession();
  if (!session || !session.events.some((event) => event.id === eventId)) {
    return null;
  }
  const updated = { ...session, selected_event_id: eventId };
  sessionStorage.setItem(sessionKey, JSON.stringify(updated));
  return updated;
}

export function clearCheckInSession() {
  sessionStorage.removeItem(sessionKey);
}
