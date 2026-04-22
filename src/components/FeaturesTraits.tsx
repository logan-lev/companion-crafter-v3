import type { Character } from '../types/character';
import { getListItems } from '../utils/character-sheet';
import StringListEditor from './StringListEditor';
import LanguageListEditor from './LanguageListEditor';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
  editable?: boolean;
}

function TextBlock({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="field-label mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        className="field-input w-full" rows={rows} />
    </div>
  );
}

export default function FeaturesTraits({ character, onChange, editable = true }: Props) {
  const up = <K extends keyof Character>(key: K, val: Character[K]) =>
    onChange({ ...character, [key]: val });
  const featureItems = character.featuresAndTraits
    .split(/\n{2,}/)
    .map(item => item.trim())
    .filter(Boolean);
  const proficiencyItems = getListItems(character.otherProficiencies);
  const languageItems = character.languages ?? [];
  const setFeatureItems = (items: string[]) => up('featuresAndTraits', items.filter(Boolean).join('\n\n'));
  const setProficiencyItems = (items: string[]) => up('otherProficiencies', items.filter(Boolean).join(', '));
  const setLanguageItems = (items: string[]) => up('languages', items.filter(Boolean));

  return (
    <div className="flex flex-col gap-4">
      <div className="section-box">
        <div className="section-title">Personality</div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <TextBlock label="Personality Traits" value={character.personalityTraits}
            onChange={(v) => up('personalityTraits', v)} rows={3} />
          <TextBlock label="Ideals" value={character.ideals}
            onChange={(v) => up('ideals', v)} rows={3} />
          <TextBlock label="Bonds" value={character.bonds}
            onChange={(v) => up('bonds', v)} rows={3} />
          <TextBlock label="Flaws" value={character.flaws}
            onChange={(v) => up('flaws', v)} rows={3} />
        </div>
      </div>

      <div className="section-box">
        <div className="section-title">Features & Traits</div>
        {editable ? (
          <StringListEditor
            label="Class Features, Racial Traits, Feats"
            items={featureItems}
            emptyLabel="No features or traits recorded yet."
            onChange={setFeatureItems}
            addLabel="+ Add Feature or Trait"
            framed={false}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {featureItems.map((item, index) => (
              <div key={index} className="rounded border border-[#2a1f00] px-3 py-2 text-sm leading-6 text-[#e8cf88]">
                <span className="mr-2 text-[#b8962e]">{index + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-box">
        <div className="section-title">Other Proficiencies</div>
        {editable ? (
          <StringListEditor
            label="Armor, Weapons, Tools"
            items={proficiencyItems}
            emptyLabel="No proficiencies recorded yet."
            onChange={setProficiencyItems}
            addLabel="+ Add Proficiency"
            framed={false}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {proficiencyItems.map((item, index) => (
              <div key={index} className="rounded border border-[#2a1f00] px-3 py-2 text-sm leading-6 text-[#e8cf88]">
                <span className="mr-2 text-[#b8962e]">{index + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-box">
        <div className="section-title">Languages</div>
        {editable ? (
          <LanguageListEditor
            title={undefined}
            items={languageItems}
            onChange={setLanguageItems}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {languageItems.map((item, index) => (
              <div key={index} className="rounded border border-[#2a1f00] px-3 py-2 text-sm leading-6 text-[#e8cf88]">
                <span className="mr-2 text-[#b8962e]">{index + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-box">
        <div className="section-title">Additional Features & Traits</div>
        <TextBlock label="Other abilities, boons, etc." value={character.additionalFeatures}
          onChange={(v) => up('additionalFeatures', v)} rows={5} />
      </div>
    </div>
  );
}
