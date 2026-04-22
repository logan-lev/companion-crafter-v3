import type { Character, AbilityKey } from '../types/character';
import { ABILITY_NAMES, calcMod, modStr } from '../data/srd';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export default function AbilityScores({ character, onChange }: Props) {
  const set = (key: AbilityKey, rawValue: string) => {
    const digitsOnly = rawValue.replace(/[^\d]/g, '');
    const parsed = parseInt(digitsOnly, 10);
    onChange({
      ...character,
      abilityScores: {
        ...character.abilityScores,
        [key]: Number.isFinite(parsed) ? Math.min(30, Math.max(1, parsed)) : 1,
      },
    });
  };

  return (
    <div className="section-box">
      <div className="section-title">Ability Scores</div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {ABILITIES.map((key) => {
        const score = character.abilityScores[key];
        const mod = calcMod(score);
        return (
          <div key={key} className="stat-box flex min-h-[220px] flex-col items-center justify-between gap-3 px-4 py-5">
            <span className="field-label">{ABILITY_NAMES[key].slice(0, 3)}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={score}
              onChange={(e) => set(key, e.target.value)}
              className="ability-score h-20 w-full overflow-visible bg-transparent border-none text-center text-[4rem] leading-none tracking-tight text-[#f0d080] outline-none"
            />
            <div className="flex flex-col items-center gap-1">
              <div className="modifier-badge min-w-[86px] px-3 py-1 text-xl">{modStr(score)}</div>
              <span className="field-label text-[0.7rem]">{mod >= 0 ? `+${mod}` : mod} mod</span>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
