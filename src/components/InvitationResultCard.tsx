import type { InvitationSearchResult, PresenceStatus } from "../checkin/types";

const statusLabel: Record<PresenceStatus, string> = {
  PENDING: "Pendente",
  PARTIAL: "Parcial",
  COMPLETE: "Completo",
};

interface Props {
  invitation: InvitationSearchResult;
  onOpen: () => void;
}

export function InvitationResultCard({ invitation, onOpen }: Props) {
  return (
    <button type="button" className="checkin-result-card" onClick={onOpen}>
      <span className="checkin-card-heading">
        <strong>{invitation.description}</strong>
        <small>{invitation.category.name}</small>
      </span>
      <span className={`checkin-status checkin-status-${invitation.presence_status.toLowerCase()}`}>
        {statusLabel[invitation.presence_status]} · {invitation.present_count}/
        {invitation.confirmed_count} presentes
      </span>
      <span className="checkin-preview-list">
        {invitation.participants_preview.map((participant) => (
          <span key={participant.id}>
            <span aria-hidden="true">{participant.is_present ? "✓" : "○"}</span>{" "}
            {participant.name}
          </span>
        ))}
        {invitation.remaining_participants > 0 && (
          <span className="checkin-more">
            +{invitation.remaining_participants} participantes
          </span>
        )}
      </span>
    </button>
  );
}
