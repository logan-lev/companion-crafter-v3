import { useMemo, useState } from 'react';
import type { Character, Spell } from '../types/character';
import { parseLevel } from '../data/srd';
import { getAvailableSpellOptions, getCharacterClass, getSpellSummary } from '../utils/character-sheet';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
}

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const LEVEL_LABELS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

export default function SpellSheet({ character, onChange }: Props) {
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [pendingByLevel, setPendingByLevel] = useState<Record<number, string>>({});
  const cls = getCharacterClass(character);
  const spellSummary = getSpellSummary(character);
  const availableByLevel = useMemo(() => getAvailableSpellOptions(character), [character]);

  if (!cls?.spellcasting) {
    return (
      <div className="section-box">
        <div className="section-title">Spells</div>
        <div className="text-sm italic text-[var(--color-text-dim)]">This class does not have spellcasting.</div>
      </div>
    );
  }
  const spellcasting = cls.spellcasting;

  const updateSpell = (id: string, patch: Partial<Spell>) => {
    onChange({
      ...character,
      spells: character.spells.map(spell => spell.id === id ? { ...spell, ...patch } : spell),
    });
  };

  const removeSpell = (id: string) => {
    onChange({ ...character, spells: character.spells.filter(spell => spell.id !== id) });
  };

  const updateSlotUsed = (level: number, used: number) => {
    const total = character.spellSlots[level]?.total ?? 0;
    onChange({
      ...character,
      spellSlots: {
        ...character.spellSlots,
        [level]: { total, used: Math.max(0, Math.min(used, total)) },
      },
    });
  };

  const addSpellFromLevel = (level: number) => {
    const selectedName = pendingByLevel[level];
    if (!selectedName) return;
    const option = availableByLevel.get(level)?.find(spell => spell.name === selectedName);
    if (!option) return;

    onChange({
      ...character,
      spells: [
        ...character.spells,
        {
          id: crypto.randomUUID(),
          name: option.name,
          level: option.level,
          school: option.school,
          castingTime: option.castingTime,
          range: option.range,
          components: option.components,
          duration: option.duration,
          prepared: !spellcasting.prepares,
          description: option.description,
        },
      ],
    });
    setPendingByLevel(current => ({ ...current, [level]: '' }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="section-box">
        <div className="section-title">Spellcasting</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <div className="stat-box">
            <div className="text-lg font-bold">{cls.name}</div>
            <div className="field-label">Spellcasting Class</div>
          </div>
          <div className="stat-box">
            <div className="text-lg font-bold">Level {parseLevel(character.classAndLevel)}</div>
            <div className="field-label">Milestone Progression</div>
          </div>
          <div className="stat-box">
            <div className="text-lg font-bold">{spellSummary.saveDC ?? '—'}</div>
            <div className="field-label">Spell Save DC</div>
          </div>
          <div className="stat-box">
            <div className="text-lg font-bold">{spellSummary.attackBonus !== null ? `${spellSummary.attackBonus >= 0 ? '+' : ''}${spellSummary.attackBonus}` : '—'}</div>
            <div className="field-label">Spell Attack Bonus</div>
          </div>
        </div>
      </div>

      <div className="section-box">
        <div className="section-title">Spell Slots</div>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-5 xl:grid-cols-9">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
            <div key={level} className="stat-box">
              <div className="field-label">Level {level}</div>
              <div className="text-lg font-bold">{character.spellSlots[level]?.total ?? 0}</div>
              <div className="mt-2 text-[0.65rem] text-[var(--color-text-muted)]">Used</div>
              <input
                type="number"
                min={0}
                max={character.spellSlots[level]?.total ?? 0}
                value={character.spellSlots[level]?.used ?? 0}
                onChange={(e) => updateSlotUsed(level, parseInt(e.target.value) || 0)}
                className="mt-1 w-14 border-b border-[var(--color-accent)] bg-transparent text-center text-sm font-bold text-[var(--color-text-strong)] outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {SPELL_LEVELS.map(level => {
        const existingSpells = character.spells.filter(spell => spell.level === level);
        const availableOptions = (availableByLevel.get(level) ?? []).filter(option =>
          !character.spells.some(spell => spell.name === option.name),
        );

        if (level > 0 && (character.spellSlots[level]?.total ?? 0) === 0) return null;

        return (
          <div key={level} className="section-box">
            <div className="section-title">
              {level === 0 ? 'Cantrips (At Will)' : `${LEVEL_LABELS[level]} Level Spells`}
            </div>

            <div className="mb-3 flex flex-col gap-2 md:flex-row">
              <select
                value={pendingByLevel[level] ?? ''}
                onChange={(e) => setPendingByLevel(current => ({ ...current, [level]: e.target.value }))}
                className="field-input select flex-1"
              >
                <option value="">Choose an available {level === 0 ? 'cantrip' : `level ${level} spell`}</option>
                {availableOptions.map(option => (
                  <option key={option.name} value={option.name}>{option.name}</option>
                ))}
              </select>
              <button
                onClick={() => addSpellFromLevel(level)}
                className="text-xs text-[var(--color-accent)] border border-[var(--color-accent)] px-3 py-1 hover:bg-[var(--color-hover)]"
              >
                + Add {level === 0 ? 'Cantrip' : 'Spell'}
              </button>
            </div>

            {existingSpells.length === 0 ? (
              <div className="text-[var(--color-text-dim)] text-xs italic text-center py-2">No spells selected.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {existingSpells.map(spell => (
                  <div key={spell.id} className="rounded border border-[var(--color-border-subtle)]">
                    <div
                      className="flex cursor-pointer items-center gap-2 p-3 hover:bg-[var(--color-hover)]"
                      onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                    >
                      {level > 0 && spellcasting.prepares && (
                        <span
                          className={`circle-check ${spell.prepared ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSpell(spell.id, { prepared: !spell.prepared });
                          }}
                          title="Prepared"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-[var(--color-text-strong)]">{spell.name}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{spell.school} · {spell.castingTime} · {spell.range}</div>
                      </div>
                      <span className="text-[var(--color-text-dim)] text-xs">{expandedSpell === spell.id ? '▲' : '▼'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSpell(spell.id);
                        }}
                        className="text-red-500 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                    {expandedSpell === spell.id && (
                      <div className="border-t border-[var(--color-border-subtle)] p-3 text-sm leading-6 text-[var(--color-text-rich)]">
                        <div><span className="text-[var(--color-accent)]">Components:</span> {spell.components}</div>
                        <div><span className="text-[var(--color-accent)]">Duration:</span> {spell.duration}</div>
                        <div className="mt-2 text-[var(--color-text-rich)]">{spell.description}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
