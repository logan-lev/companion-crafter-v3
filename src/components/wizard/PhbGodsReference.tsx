import { PHB_GOD_PANTHEONS } from '../../data/phb-gods';

interface Props {
  onBack: () => void;
  onSelectGod?: (godName: string) => void;
  selectedGod?: string;
}

export default function PhbGodsReference({ onBack, onSelectGod, selectedGod }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="section-box">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-[var(--color-text-strong)] text-xl font-bold">Gods of the Multiverse</div>
          <button onClick={onBack} className="tab-btn">
            Back to Background
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {PHB_GOD_PANTHEONS.map(pantheon => (
            <div key={pantheon.name} className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-3)] p-3">
              <div className="section-title">{pantheon.name}</div>
              <div className="flex flex-col gap-2">
                {pantheon.gods.map(god => (
                  <div
                    key={`${pantheon.name}-${god.name}`}
                    className={`rounded border p-3 transition-all ${
                      selectedGod === god.name
                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                        : 'border-[var(--color-border-muted)] bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="text-sm font-bold text-[var(--color-text-strong)]">{god.name}</div>
                      {onSelectGod && (
                        <button
                          onClick={() => onSelectGod(god.name)}
                          className={`rounded border px-2 py-1 text-[0.65rem] transition-all ${
                            selectedGod === god.name
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          {selectedGod === god.name ? 'Selected' : 'Choose'}
                        </button>
                      )}
                    </div>
                    <div className="text-sm leading-6 text-[var(--color-text-soft)]">
                      <span className="font-bold text-[var(--color-text-strong)]">Name:</span> {god.name}
                    </div>
                    <div className="text-sm leading-6 text-[var(--color-text-soft)]">
                      <span className="font-bold text-[var(--color-text-strong)]">Title:</span> {god.title}
                    </div>
                    <div className="text-sm leading-6 text-[var(--color-text-soft)]">
                      <span className="font-bold text-[var(--color-text-strong)]">Alignment:</span> {god.alignment}
                    </div>
                    <div className="text-sm leading-6 text-[var(--color-text-soft)]">
                      <span className="font-bold text-[var(--color-text-strong)]">Domains:</span> {god.domains.join(', ')}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">
                      <span className="font-bold text-[var(--color-text-strong)]">Symbol:</span> {god.symbol}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
