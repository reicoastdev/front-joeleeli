import type { PublicRSVP } from "../types";

interface InvitationDetailsProps {
  data: PublicRSVP;
}

function formatEventDate(date: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(date));
}

export function InvitationDetails({ data }: InvitationDetailsProps) {
  const { event, invitation } = data;

  return (
    <header className="invitation-header">
      <p className="eyebrow">Convite especial</p>
      <h1>{event.name}</h1>
      <div className="flourish" aria-hidden="true">
        <span />
        <i>◆</i>
        <span />
      </div>

      <dl className="event-details">
        <div>
          <dt>Data e horário</dt>
          <dd>{formatEventDate(event.starts_at, event.timezone)}</dd>
        </div>
        <div>
          <dt>Local</dt>
          <dd>{event.location}</dd>
        </div>
      </dl>

      <div className="invitation-intro">
        <p>Este convite foi preparado para</p>
        <h2>{invitation.description}</h2>
        <p>
          Aos cuidados de <strong>{invitation.responsible_name}</strong>
        </p>
        <p className="guest-limit">
          Reserva para até {invitation.guest_limit}{" "}
          {invitation.guest_limit === 1 ? "pessoa" : "pessoas"}
        </p>
      </div>
    </header>
  );
}
