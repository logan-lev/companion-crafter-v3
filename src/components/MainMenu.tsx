import type { Character } from '../types/character';

interface Props {
  characters: Character[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MainMenu({ characters, onCreate, onOpen, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <section className="section-box">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="field-label">Main Menu</div>
            <h1 className="text-4xl font-bold text-[var(--color-text-strong)]">Companion Crafter</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
              Start a new companion or jump back into an existing sheet from here.
            </p>
          </div>

          {characters.length > 0 && (
            <button onClick={onCreate} className="save-btn text-sm px-6 py-3">
              + New Character
            </button>
          )}
        </div>
      </section>

      <section className="section-box">
        <div className="section-title">Characters</div>

        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="text-4xl text-[var(--color-accent)]">⚔</div>
            <div className="text-xl font-bold text-[var(--color-text-strong)]">No characters yet</div>
            <div className="max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
              Create your first character to start building companions page by page.
            </div>
            <button onClick={onCreate} className="save-btn text-sm px-6 py-3">
              Create Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {characters.map(character => (
              <div key={character.id} className="section-box border-[var(--color-border-muted)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-2xl font-bold text-[var(--color-text-strong)]">
                      {character.name || 'Unnamed'}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[var(--color-text)]">
                      {[character.race, character.classAndLevel, character.background].filter(Boolean).join(' · ') || 'No details yet'}
                    </div>
                  </div>

                  <div className="rounded border border-[var(--color-border-subtle)] px-3 py-2 text-right">
                    <div className="text-lg font-bold text-[var(--color-text-strong)]">{character.armorClass}</div>
                    <div className="field-label">AC</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="stat-box">
                    <div className="text-base font-bold">{character.currentHp}/{character.maxHp}</div>
                    <div className="field-label">HP</div>
                  </div>
                  <div className="stat-box">
                    <div className="text-base font-bold">{character.speed} ft</div>
                    <div className="field-label">Speed</div>
                  </div>
                  <div className="stat-box">
                    <div className="text-base font-bold">+{character.proficiencyBonus}</div>
                    <div className="field-label">Prof</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button onClick={() => onOpen(character.id)} className="save-btn flex-1">
                    Open
                  </button>
                  <button onClick={() => onDelete(character.id)} className="delete-btn flex-1">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
