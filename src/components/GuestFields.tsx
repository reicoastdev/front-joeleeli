interface GuestFieldsProps {
  names: string[];
  guestLimit: number;
  disabled: boolean;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function GuestFields({
  names,
  guestLimit,
  disabled,
  onChange,
  onAdd,
  onRemove,
}: GuestFieldsProps) {
  return (
    <div className="guest-fields">
      {names.map((name, index) => {
        const inputId = `guest-name-${index}`;
        return (
          <div className="guest-field" key={inputId}>
            <label htmlFor={inputId}>Participante {index + 1}</label>
            <div className="input-row">
              <input
                id={inputId}
                name={inputId}
                type="text"
                autoComplete="name"
                maxLength={255}
                value={name}
                disabled={disabled}
                onChange={(event) => onChange(index, event.target.value)}
              />
              {names.length > 1 && (
                <button
                  type="button"
                  className="remove-button"
                  aria-label={`Remover participante ${index + 1}`}
                  disabled={disabled}
                  onClick={() => onRemove(index)}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        );
      })}

      {names.length < guestLimit && (
        <button
          type="button"
          className="text-button add-button"
          disabled={disabled}
          onClick={onAdd}
        >
          <span aria-hidden="true">＋</span> Adicionar participante
        </button>
      )}
    </div>
  );
}
