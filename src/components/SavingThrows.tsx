import type { Character, AbilityKey } from '../types/character';
import { ABILITY_NAMES, calcMod } from '../data/srd';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export default function SavingThrows({ character, onChange }: Props) {
  const toggle = (key: AbilityKey) =>
    onChange({
      ...character,
      savingThrowProfs: {
        ...character.savingThrowProfs,
        [key]: !character.savingThrowProfs[key],
      },
    });

  return (
    <div className="section-box">
      <div className="section-title">Saving Throws</div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {ABILITIES.map((key) => {
          const prof = character.savingThrowProfs[key];
          const base = calcMod(character.abilityScores[key]);
          const total = base + (prof ? character.proficiencyBonus : 0);
          const sign = total >= 0 ? '+' : '';
          return (
            <div key={key} className="flex min-w-0 items-center gap-2 rounded border border-[var(--color-border-subtle)] px-3 py-2">
              <span
                className={`circle-check ${prof ? 'checked' : ''}`}
                onClick={() => toggle(key)}
              />
              <span className="text-sm text-[var(--color-text-strong)] w-10 shrink-0 text-right">{sign}{total}</span>
              <span className="min-w-0 flex-1 text-sm text-[var(--color-text)] whitespace-nowrap">{ABILITY_NAMES[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
