import type { WizardState } from '../../types/wizard';
import { RACE_DATA } from '../../data/srd-races';
import type { AbilityKey } from '../../types/character';
import { ABILITY_NAMES, LANGUAGES, SKILLS } from '../../data/srd';
import { getSpellsForClass } from '../../data/srd-spells';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function bonusString(bonus: Partial<Record<AbilityKey, number>>): string {
  const parts = ABILITY_KEYS
    .filter(k => (bonus[k] ?? 0) !== 0)
    .map(k => `+${bonus[k]} ${ABILITY_NAMES[k].slice(0, 3)}`);
  return parts.length ? parts.join(', ') : 'None';
}

export default function RaceStep({ state, onChange }: Props) {
  const wizardCantrips = getSpellsForClass('Wizard').filter(spell => spell.level === 0);

  const selectedRaceData = RACE_DATA.find(r => r.name === state.race);
  const previewRace = selectedRaceData;

  const selectRace = (race: (typeof RACE_DATA)[number]) => {
    onChange({
      race: race.name,
      subrace: race.subraces ? race.subraces[0].name : '',
      raceSkillChoices: [],
      raceLanguageChoices: [],
      highElfCantrip: '',
    });
  };
  const raceBonusLanguageCount = previewRace
    ? previewRace.languages.filter(language => /extra language of your choice/i.test(language)).length
    : 0;
  const usedLanguages = new Set([...(previewRace?.languages ?? []).filter(language => !/extra language/i.test(language)), ...(state.backgroundLanguageChoices ?? [])]);
  const availableRaceLanguages = LANGUAGES.filter(language => !usedLanguages.has(language) || state.raceLanguageChoices.includes(language));

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
                <div className="mt-1 text-[0.7rem] text-[#8f7635]">{bonusString(race.abilityBonus)}</div>
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
                  <div className="text-base font-bold">{previewRace.speed} ft</div>
                  <div className="field-label">Speed</div>
                </div>
                <div className="stat-box">
                  <div className="text-base font-bold">{previewRace.size}</div>
                  <div className="field-label">Size</div>
                </div>
                <div className="stat-box">
                  <div className="text-xs font-bold">{bonusString(previewRace.abilityBonus)}</div>
                  <div className="field-label">ASI</div>
                </div>
                <div className="stat-box">
                  <div className="text-xs font-bold">{previewRace.darkvision ? `${previewRace.darkvision} ft` : 'None'}</div>
                  <div className="field-label">Darkvision</div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <div className="field-label mb-1">Languages</div>
                <div className="text-sm leading-6 text-[#c8a84b]">{previewRace.languages.join(', ')}</div>
              </div>

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

              {/* Traits */}
              <div>
                <div className="field-label mb-1">Racial Traits</div>
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {previewRace.traits.map(t => (
                    <div key={t.name} className="border-l-2 border-[#b8962e] pl-2">
                      <div className="text-[#f0d080] text-xs font-bold">{t.name}</div>
                      <div className="mt-0.5 text-sm leading-6 text-[#9a8040]">{t.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proficiencies */}
              {previewRace.proficiencies.length > 0 && (
                <div>
                  <div className="field-label mb-1">Proficiencies</div>
                  <div className="text-sm leading-6 text-[#c8a84b]">{previewRace.proficiencies.join(', ')}</div>
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
                        onClick={() => onChange({ subrace: sub.name })}
                        className={`text-left p-2 border rounded text-xs transition-all ${
                          state.subrace === sub.name
                            ? 'border-[#f0d080] bg-[#1a1200]'
                            : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                        }`}
                      >
                        <div className="font-bold text-[#f0d080]">{sub.name}</div>
                        <div className="text-[#b8962e] text-[0.6rem]">{bonusString(sub.abilityBonus)}</div>
                        {sub.traits.map(t => (
                          <div key={t.name} className="text-[#7a6020] text-[0.6rem] mt-0.5">• {t.name}</div>
                        ))}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Half-elf +1/+1 picker */}
              {state.race === 'Half-Elf' && (
                <div>
                  <div className="section-title">Choose Two +1 Ability Bonuses</div>
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
                  <select
                    value={state.highElfCantrip}
                    onChange={event => onChange({ highElfCantrip: event.target.value })}
                    className="field-input select"
                  >
                    <option value="">—</option>
                    {wizardCantrips.map(spell => (
                      <option key={spell.name} value={spell.name}>
                        {spell.name}
                      </option>
                    ))}
                  </select>
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
