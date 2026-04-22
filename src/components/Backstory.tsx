import type { Character } from '../types/character';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
}

export default function Backstory({ character, onChange }: Props) {
  const up = <K extends keyof Character>(key: K, val: Character[K]) =>
    onChange({ ...character, [key]: val });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        {/* Physical Description */}
        <div className="section-box">
          <div className="section-title">Physical Description</div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {(['age', 'height', 'weight', 'eyes', 'skin', 'hair'] as const).map(field => (
              <div key={field}>
                <label className="field-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input value={character[field]}
                  onChange={(e) => up(field, e.target.value)}
                  className="field-input" />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="field-label">Appearance Notes</label>
            <textarea value={character.appearance}
              onChange={(e) => up('appearance', e.target.value)}
              className="field-input w-full mt-1" rows={6} />
          </div>
        </div>

        {/* Backstory */}
        <div className="section-box">
          <div className="section-title">Character Backstory</div>
          <textarea value={character.backstory}
            onChange={(e) => up('backstory', e.target.value)}
            className="field-input w-full" rows={16}
            placeholder="Your character's history, motivations, and story..." />
        </div>
      </div>

      {/* Allies & Organizations */}
      <div className="section-box">
        <div className="section-title">Allies & Organizations</div>
        <textarea value={character.alliesAndOrgs}
          onChange={(e) => up('alliesAndOrgs', e.target.value)}
          className="field-input w-full" rows={8}
          placeholder="Factions, guilds, allies, enemies..." />
      </div>
    </div>
  );
}
