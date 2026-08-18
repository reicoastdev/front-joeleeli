import { useState } from "react";

interface Props {
  guestName: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function CancelCheckInDialog({
  guestName,
  isSubmitting,
  onCancel,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");

  return (
    <div className="checkin-dialog-backdrop" role="presentation">
      <section
        className="checkin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
      >
        <p className="checkin-kicker">Cancelar entrada</p>
        <h2 id="cancel-title">{guestName}</h2>
        <label>
          Motivo do cancelamento
          <textarea
            autoFocus
            rows={3}
            value={reason}
            disabled={isSubmitting}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="checkin-dialog-actions">
          <button
            type="button"
            className="checkin-danger-button"
            disabled={isSubmitting || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
          >
            {isSubmitting ? "Cancelando…" : "Confirmar cancelamento"}
          </button>
          <button
            type="button"
            className="checkin-secondary-button"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Voltar
          </button>
        </div>
      </section>
    </div>
  );
}
