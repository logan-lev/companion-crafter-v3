import type { WizardState } from '../../types/wizard';
import { RACE_DATA } from '../../data/srd-races';
import type { AbilityKey } from '../../types/character';
import { ABILITY_NAMES, LANGUAGES, SKILLS } from '../../data/srd';
import { getSpellsForClass, SPELL_LIST } from '../../data/srd-spells';
import type { RaceTrait } from '../../data/srd-races';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const DWARVEN_TOOL_OPTIONS = [
  {
    name: "Smith's Tools",
    description: 'A hammer, tongs, and metalworking implements used to forge, repair, and shape metal items such as weapons, armor, and hardware.',
  },
  {
    name: "Brewer's Supplies",
    description: 'Kegs, tubing, and fermentation tools used to brew ale and spirits, identify ingredients, and judge the quality of drinks.',
  },
  {
    name: "Mason's Tools",
    description: 'Chisels, trowels, and measuring tools used to shape stone, inspect masonry, and understand how stone structures are built.',
  },
];
const DRAGONBORN_ANCESTRIES = [
  { name: 'Black', damageType: 'Acid', breath: '5 by 30 ft. line (Dex save)' },
  { name: 'Blue', damageType: 'Lightning', breath: '5 by 30 ft. line (Dex save)' },
  { name: 'Brass', damageType: 'Fire', breath: '5 by 30 ft. line (Dex save)' },
  { name: 'Bronze', damageType: 'Lightning', breath: '5 by 30 ft. line (Dex save)' },
  { name: 'Copper', damageType: 'Acid', breath: '5 by 30 ft. line (Dex save)' },
  { name: 'Gold', damageType: 'Fire', breath: '15 ft. cone (Dex save)' },
  { name: 'Green', damageType: 'Poison', breath: '15 ft. cone (Con save)' },
  { name: 'Red', damageType: 'Fire', breath: '15 ft. cone (Dex save)' },
  { name: 'Silver', damageType: 'Cold', breath: '15 ft. cone (Con save)' },
  { name: 'White', damageType: 'Cold', breath: '15 ft. cone (Con save)' },
];

function bonusString(bonus: Partial<Record<AbilityKey, number>>): string {
  const parts = ABILITY_KEYS
    .filter(k => (bonus[k] ?? 0) !== 0)
    .map(k => `+${bonus[k]} ${ABILITY_NAMES[k].slice(0, 3)}`);
  return parts.length ? parts.join(', ') : 'None';
}

function getRaceCardBonusText(raceName: string, bonus: Partial<Record<AbilityKey, number>>): string {
  if (raceName === 'Half-Elf') return '+2 Cha, +1 to two abilities';
  return bonusString(bonus);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTraitSpellDetails(description: string): string[] {
  return SPELL_LIST
    .filter(spell => new RegExp(`\\b${escapeRegExp(spell.name)}\\b`).test(description))
    .map(spell => `${spell.name}: ${spell.description}`);
}

function getResistanceSummary(traits: RaceTrait[]): string[] {
  return traits.flatMap(trait => {
    const matches = [...trait.description.matchAll(/resistance (?:against|to) ([^.]+?) damage/gi)];
    return matches.map(match => `${trait.name}: ${match[1]} damage`);
  });
}

function getAdvantageSummary(traits: RaceTrait[]): string[] {
  return traits
    .filter(trait => /advantage on|advantage against/i.test(trait.description))
    .map(trait => `${trait.name}: ${trait.description}`);
}

function renderTraitDescription(name: string, description: string) {
  if (name !== 'Tinker') {
    return <div className="mt-0.5 text-sm leading-6 text-[#9a8040] whitespace-pre-line">{description}</div>;
  }

  const parts = description.split('\n').map(part => part.trim()).filter(Boolean);
  const intro = parts[0] ?? '';
  const setup = parts[1] ?? '';
  const deviceOptions = parts.slice(2);

  return (
    <div className="mt-1 flex flex-col gap-2 text-sm leading-6 text-[#9a8040]">
      <div>{intro}</div>
      {setup && (
        <div className="rounded border border-[#5a4a1b] bg-[#131000] px-3 py-2 text-[#c8a84b]">
          {setup}
        </div>
      )}
      {deviceOptions.length > 0 && (
        <div className="rounded border border-[#5a4a1b] bg-[#0f0f0f] p-3">
          <div className="mb-2 text-[0.72rem] uppercase tracking-wide text-[#b8962e]">Clockwork Device Options</div>
          <div className="flex flex-col gap-2">
            {deviceOptions.map(option => {
              const [label, ...rest] = option.split('. ');
              return (
                <div key={option} className="rounded border border-[#3d3212] bg-[#121212] px-3 py-2">
                  <div className="text-xs font-bold text-[#f0d080]">{label}</div>
                  <div className="mt-1 text-[0.82rem] leading-6 text-[#9a8040]">{rest.join('. ')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RaceStep({ state, onChange }: Props) {
  const wizardCantrips = getSpellsForClass('Wizard').filter(spell => spell.level === 0);

  const selectedRaceData = RACE_DATA.find(r => r.name === state.race);
  const previewRace = selectedRaceData;
  const selectedSubrace = previewRace?.subraces?.find(sub => sub.name === state.subrace);

  const selectRace = (race: (typeof RACE_DATA)[number]) => {
    onChange({
      race: race.name,
      subrace: '',
      raceSkillChoices: [],
      raceLanguageChoices: [],
      dwarfToolProficiency: '',
      dragonbornAncestry: '',
      highElfCantrip: '',
    });
  };
  const raceBonusLanguageCount = previewRace
    ? previewRace.languages.filter(language => /extra language of your choice/i.test(language)).length + (selectedSubrace?.extraLanguage ? 1 : 0)
    : 0;
  const usedLanguages = new Set([
    ...(previewRace?.languages ?? []).filter(language => !/extra language/i.test(language)),
    ...(state.backgroundLanguageChoices ?? []),
  ]);
  const availableRaceLanguages = LANGUAGES.filter(language => !usedLanguages.has(language) || state.raceLanguageChoices.includes(language));
  const displayedSpeed = state.race === 'Elf' && selectedSubrace?.name === 'Wood Elf' ? 35 : previewRace?.speed;
  const displayedDarkvision = selectedSubrace?.traits.some(trait => trait.name === 'Superior Darkvision') ? 120 : previewRace?.darkvision;
  const displayedProficiencies = [
    ...(previewRace?.proficiencies ?? []),
    ...(selectedSubrace?.proficiencies ?? []),
    ...(state.dwarfToolProficiency ? [state.dwarfToolProficiency] : []),
  ];
  const displayedLanguages = [
    ...((previewRace?.languages ?? []).filter(language => !/extra language of your choice/i.test(language))),
    ...state.raceLanguageChoices,
  ];
  const displayedAbilityBonus = Object.fromEntries(
    ABILITY_KEYS.map(key => [key, (previewRace?.abilityBonus[key] ?? 0) + (selectedSubrace?.abilityBonus[key] ?? 0)])
  ) as Partial<Record<AbilityKey, number>>;
  const selectedDragonbornAncestry = DRAGONBORN_ANCESTRIES.find(option => option.name === state.dragonbornAncestry);
  const displayedRaceTraits: RaceTrait[] = previewRace?.name === 'Dragonborn' && selectedDragonbornAncestry
    ? previewRace.traits.map(trait => {
        if (trait.name === 'Draconic Ancestry') {
          return {
            ...trait,
            description: `Your draconic ancestry is ${selectedDragonbornAncestry.name}. This ancestry ties you to ${selectedDragonbornAncestry.damageType.toLowerCase()} dragons and shapes your breath weapon and resistance.`,
          };
        }

        if (trait.name === 'Breath Weapon') {
          return {
            ...trait,
            description: `You can use your action to exhale destructive energy as a ${selectedDragonbornAncestry.breath.toLowerCase()} that deals ${selectedDragonbornAncestry.damageType.toLowerCase()} damage. Creatures in the area must make a saving throw (DC = 8 + your Constitution modifier + your proficiency bonus). You can use this trait once per short or long rest.`,
          };
        }

        if (trait.name === 'Damage Resistance') {
          return {
            ...trait,
            description: `You have resistance to ${selectedDragonbornAncestry.damageType.toLowerCase()} damage.`,
          };
        }

        return trait;
      })
    : (previewRace?.traits ?? []);
  const displayedResistances = getResistanceSummary(displayedRaceTraits);
  const displayedAdvantages = getAdvantageSummary(displayedRaceTraits);
  const halfElfFlexTrait = displayedRaceTraits.find(trait => trait.name === 'Ability Score Flexibility');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[#f0d080] text-lg font-bold tracking-wide mb-1">Choose Your Race</h2>
        <p className="text-[#7a6020] text-xs">Your race determines your physical traits, innate abilities, and where you come from.</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="section-box">
          <div className="section-title">Race Selection</div>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
            {RACE_DATA.map(race => (
              <button
                key={race.name}
                onClick={() => selectRace(race)}
                className={`rounded border px-3 py-3 text-left transition-all ${
                  state.race === race.name
                    ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                    : 'border-[#b8962e] bg-[#0d0d0d] text-[#b8962e] hover:bg-[#111100] hover:border-[#d4a93a]'
                }`}
              >
                <div className="text-sm font-bold">{race.name}</div>
                <div className="mt-1 text-[0.7rem] text-[#8f7635]">{getRaceCardBonusText(race.name, race.abilityBonus)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          {previewRace ? (
            <div className="section-box flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[#f0d080] text-xl font-bold">{previewRace.name}</h3>
                  <p className="mt-1 text-sm italic leading-6 text-[#7a6020]">{previewRace.flavorText}</p>
                </div>
                {state.race === previewRace.name && (
                  <span className="text-green-400 text-xs border border-green-700 px-2 py-1 rounded ml-2 flex-shrink-0">Selected ✓</span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="stat-box">
                  <div className="text-base font-bold">{displayedSpeed} ft</div>
                  <div className="field-label">Speed</div>
                </div>
                <div className="stat-box">
                  <div className="text-base font-bold">{previewRace.size}</div>
                  <div className="field-label">Size</div>
                </div>
                <div className="stat-box">
                  <div className="text-xs font-bold">{bonusString(displayedAbilityBonus)}</div>
                  <div className="field-label">ASI</div>
                </div>
                <div className="stat-box">
                  <div className="text-xs font-bold">{displayedDarkvision ? `${displayedDarkvision} ft` : 'None'}</div>
                  <div className="field-label">Darkvision</div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <div className="field-label mb-1">Languages</div>
                <div className="text-sm leading-6 text-[#c8a84b]">
                  {displayedLanguages.length ? displayedLanguages.join(', ') : 'None'}
                </div>
              </div>

              {state.race === 'Half-Elf' && halfElfFlexTrait && (
                <div>
                  <div className="section-title">Choose Two +1 Ability Bonuses</div>
                  <div className="mb-2 text-sm leading-6 text-[#9a8040]">{halfElfFlexTrait.description}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {ABILITY_KEYS.filter(k => k !== 'cha').map(k => {
                      const cur = state.halfElfBonuses[k] ?? 0;
                      const totalChosen = Object.values(state.halfElfBonuses).filter(v => v === 1).length;
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            const next = { ...state.halfElfBonuses };
                            if (cur === 1) { delete next[k]; }
                            else if (totalChosen < 2) { next[k] = 1; }
                            onChange({ halfElfBonuses: next });
                          }}
                          className={`p-2 border rounded text-xs font-bold ${
                            cur === 1
                              ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                              : 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                          }`}
                        >
                          +1 {ABILITY_NAMES[k].slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.race === previewRace.name && raceBonusLanguageCount > 0 && (
                <div>
                  <div className="section-title">Bonus Languages</div>
                  <div className="mb-2 text-sm leading-6 text-[#c8a84b]">
                    Pick {raceBonusLanguageCount} total. Chosen {state.raceLanguageChoices.length}/{raceBonusLanguageCount}.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableRaceLanguages.map(language => {
                      const selected = state.raceLanguageChoices.includes(language);
                      const alreadyTakenElsewhere = usedLanguages.has(language) && !selected;
                      const atLimit = !selected && state.raceLanguageChoices.length >= raceBonusLanguageCount;
                      const disabled = alreadyTakenElsewhere || atLimit;

                      return (
                        <button
                          key={language}
                          onClick={() => {
                            if (selected) {
                              onChange({ raceLanguageChoices: state.raceLanguageChoices.filter(item => item !== language) });
                              return;
                            }
                            if (disabled) return;
                            onChange({ raceLanguageChoices: [...state.raceLanguageChoices, language] });
                          }}
                          disabled={disabled}
                          className={`rounded border px-3 py-1 text-xs transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : disabled
                              ? 'cursor-not-allowed border-[#2a1f00] bg-[#101010] text-[#4d4d4d]'
                              : 'border-[#b8962e] bg-[#0d0d0d] text-[#b8962e] hover:bg-[#1a1000]'
                          }`}
                        >
                          {language}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.race === 'Dragonborn' && (
                <div>
                  <div className="section-title">Choose Draconic Ancestry</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {DRAGONBORN_ANCESTRIES.map(option => {
                      const selected = state.dragonbornAncestry === option.name;
                      return (
                        <button
                          key={option.name}
                          onClick={() => onChange({ dragonbornAncestry: option.name })}
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200]'
                              : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#f0d080]">{option.name} Dragon</div>
                          <div className="mt-1 text-[0.7rem] uppercase tracking-wide text-[#b8962e]">{option.damageType} Resistance</div>
                          <div className="mt-2 text-[0.72rem] leading-6 text-[#9a8040]">Breath Weapon: {option.breath}</div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedDragonbornAncestry && (
                    <div className="mt-3 text-sm leading-6 text-[#c8a84b]">
                      Chosen ancestry: {selectedDragonbornAncestry.name}. Your breath weapon and damage resistance both use {selectedDragonbornAncestry.damageType}.
                    </div>
                  )}
                </div>
              )}

              {/* Traits */}
              <div>
                <div className="field-label mb-1">Racial Traits</div>
                <div className="flex flex-col gap-2">
                  {displayedRaceTraits.map(t => (
                    <div key={t.name} className="border-l-2 border-[#b8962e] pl-2">
                      <div className="text-[#f0d080] text-xs font-bold">{t.name}</div>
                      {renderTraitDescription(t.name, t.description)}
                      {getTraitSpellDetails(t.description).map(detail => (
                        <div key={detail} className="mt-1 text-[0.72rem] leading-6 text-[#c8a84b]">
                          {detail}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Proficiencies */}
              {displayedProficiencies.length > 0 && (
                <div>
                  <div className="field-label mb-1">Proficiencies</div>
                  <div className="text-sm leading-6 text-[#c8a84b]">
                    {displayedProficiencies.join(', ')}
                  </div>
                </div>
              )}

              {displayedResistances.length > 0 && (
                <div>
                  <div className="field-label mb-1">Resistances</div>
                  <div className="text-sm leading-6 text-[#c8a84b]">{displayedResistances.join(', ')}</div>
                </div>
              )}

              {displayedAdvantages.length > 0 && (
                <div>
                  <div className="field-label mb-1">Advantage Rolls</div>
                  <div className="text-sm leading-6 text-[#c8a84b]">{displayedAdvantages.join(' ')}</div>
                </div>
              )}

              {state.race === 'Dwarf' && (
                <div>
                  <div className="section-title">Choose Dwarven Tool Proficiency</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                    {DWARVEN_TOOL_OPTIONS.map(tool => {
                      const selected = state.dwarfToolProficiency === tool.name;
                      return (
                        <button
                          key={tool.name}
                          onClick={() => onChange({ dwarfToolProficiency: tool.name })}
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200]'
                              : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#f0d080]">{tool.name}</div>
                          <div className="mt-2 text-[0.72rem] leading-6 text-[#9a8040]">{tool.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subrace selection */}
              {state.race === previewRace.name && previewRace.subraces && (
                <div>
                  <div className="section-title">Choose Subrace</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewRace.subraces.map(sub => (
                      <button
                        key={sub.name}
                        onClick={() => onChange({
                          subrace: sub.name,
                          highElfCantrip: sub.spellcasting?.cantrip === 'choose' ? state.highElfCantrip : '',
                          raceLanguageChoices: sub.extraLanguage ? state.raceLanguageChoices : [],
                        })}
                        className={`text-left p-2 border rounded text-xs transition-all ${
                          state.subrace === sub.name
                            ? 'border-[#f0d080] bg-[#1a1200]'
                            : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                        }`}
                      >
                        <div className="font-bold text-[#f0d080]">{sub.name}</div>
                        {sub.flavorText && <div className="mt-1 text-[0.65rem] italic leading-5 text-[#8f7635]">{sub.flavorText}</div>}
                        <div className="text-[#b8962e] text-[0.6rem]">{bonusString(sub.abilityBonus)}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {sub.traits.map(t => (
                            <div key={t.name} className="rounded border border-[#5a4a1b] px-2 py-0.5 text-[0.62rem] text-[#b8962e]">
                              {t.name}
                            </div>
                          ))}
                        </div>
                        {sub.proficiencies && sub.proficiencies.length > 0 && (
                          <div className="mt-2 text-[0.62rem] leading-5 text-[#8f7635]">
                            Proficiencies: {sub.proficiencies.join(', ')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubrace && (
                <div className="section-box border-[#5a4a1b] bg-[#0f0f0f]">
                  <div className="section-title">Selected Subrace</div>
                  <div className="text-lg font-bold text-[#f0d080]">{selectedSubrace.name}</div>
                  {selectedSubrace.flavorText && (
                    <p className="mt-2 text-sm italic leading-6 text-[#8f7635]">{selectedSubrace.flavorText}</p>
                  )}
                  <div className="mt-3 flex flex-col gap-2">
                    {selectedSubrace.traits.map(trait => (
                      <div key={trait.name} className="border-l-2 border-[#b8962e] pl-2">
                        <div className="text-xs font-bold text-[#f0d080]">{trait.name}</div>
                        {renderTraitDescription(trait.name, trait.description)}
                        {getTraitSpellDetails(trait.description).map(detail => (
                          <div key={detail} className="mt-1 text-[0.72rem] leading-6 text-[#c8a84b]">
                            {detail}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.race === 'Half-Elf' && (
                <div>
                  <div className="section-title">Choose Two Bonus Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {SKILLS.map(skill => {
                      const selected = state.raceSkillChoices.includes(skill.name);
                      const canAdd = selected || state.raceSkillChoices.length < 2;
                      return (
                        <button
                          key={skill.name}
                          onClick={() => {
                            if (selected) {
                              onChange({ raceSkillChoices: state.raceSkillChoices.filter(item => item !== skill.name) });
                            } else if (canAdd) {
                              onChange({ raceSkillChoices: [...state.raceSkillChoices, skill.name] });
                            }
                          }}
                          disabled={!canAdd}
                          className={`text-[0.6rem] px-2 py-0.5 border rounded transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : canAdd
                              ? 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                              : 'border-[#2a1f00] text-[#3a2a00] cursor-not-allowed'
                          }`}
                        >
                          {skill.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.race === 'Elf' && state.subrace === 'High Elf' && (
                <div>
                  <div className="section-title">Choose Your Bonus Cantrip</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {wizardCantrips.map(spell => {
                      const selected = state.highElfCantrip === spell.name;
                      return (
                        <button
                          key={spell.name}
                          onClick={() => onChange({ highElfCantrip: spell.name })}
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200]'
                              : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#f0d080]">{spell.name}</div>
                          <div className="mt-1 text-[0.7rem] uppercase tracking-wide text-[#b8962e]">{spell.school} Cantrip</div>
                          <div className="mt-2 text-[0.72rem] leading-6 text-[#9a8040]">{spell.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="section-box flex items-center justify-center h-48 text-[#3a2a00] text-sm italic">
              Select a race to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
