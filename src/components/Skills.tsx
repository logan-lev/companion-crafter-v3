import type { Character } from '../types/character';
import { SKILLS, calcMod } from '../data/srd';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
}

export default function Skills({ character, onChange }: Props) {
  const toggle = (skillName: string) => {
    const current = character.skillProfs[skillName];
    let next: boolean | 'expertise';
    if (!current) next = true;
    else if (current === true) next = 'expertise';
    else next = false;
    onChange({ ...character, skillProfs: { ...character.skillProfs, [skillName]: next } });
  };

  return (
    <div className="section-box">
      <div className="section-title">Skills</div>
      <div className="grid grid-cols-1 gap-2 2xl:grid-cols-2">
        {SKILLS.map(({ name, ability }) => {
          const prof = character.skillProfs[name];
          const base = calcMod(character.abilityScores[ability]);
          const bonus = prof === 'expertise' ? character.proficiencyBonus * 2 : prof ? character.proficiencyBonus : 0;
          const total = base + bonus;
          const sign = total >= 0 ? '+' : '';
          return (
            <div key={name} className="flex items-center gap-2 rounded border border-[var(--color-border-subtle)] px-3 py-2">
              <span
                className={`circle-check ${prof ? 'checked' : ''} ${prof === 'expertise' ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => toggle(name)}
                title={prof === 'expertise' ? 'Expertise (click to remove)' : prof ? 'Proficient (click for expertise)' : 'Click to add proficiency'}
              />
              <span className="text-sm text-[var(--color-text-strong)] w-8 text-right">{sign}{total}</span>
              <span className="text-sm text-[var(--color-text)] flex-1">{name}</span>
              <span className="text-[0.65rem] text-[var(--color-text-dim)]">({ability.toUpperCase()})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
