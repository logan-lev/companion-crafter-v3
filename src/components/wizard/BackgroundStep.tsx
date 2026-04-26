import type { WizardState } from '../../types/wizard';
import { BACKGROUND_DATA } from '../../data/srd-backgrounds';
import { LANGUAGES } from '../../data/srd';
import { RACE_DATA } from '../../data/srd-races';
import { getResolvedBackgroundEquipment, getResolvedBackgroundToolProficiencies } from '../../utils/character-builder';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export default function BackgroundStep({ state, onChange }: Props) {
  const selectedBg = BACKGROUND_DATA.find(b => b.name === state.background);
  const preview = selectedBg;
  const raceData = RACE_DATA.find(race => race.name === state.race);
  const builtInRaceLanguages = (raceData?.languages ?? []).filter(language => !/extra language/i.test(language));
  const usedLanguages = new Set([
    ...builtInRaceLanguages,
    ...(state.raceLanguageChoices ?? []),
  ]);
  const availableBackgroundLanguages = LANGUAGES.filter(language => !usedLanguages.has(language) || state.backgroundLanguageChoices.includes(language));
  const resolvedToolProficiencies = preview ? getResolvedBackgroundToolProficiencies(state) : [];
  const resolvedEquipment = preview ? getResolvedBackgroundEquipment(state) : '';

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[#f0d080] text-lg font-bold tracking-wide mb-1">Choose Your Background</h2>
        <p className="text-[#7a6020] text-xs">Your background reflects where you came from, your original occupation, and your place in the world.</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="section-box">
          <div className="section-title">Background Selection</div>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
            {BACKGROUND_DATA.map(bg => (
              <button
                key={bg.name}
                onClick={() => onChange({ background: bg.name, backgroundLanguageChoices: [], backgroundSelections: {} })}
                className={`rounded border px-3 py-3 text-left transition-all ${
                  state.background === bg.name
                    ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                    : 'border-[#b8962e] bg-[#0d0d0d] text-[#b8962e] hover:bg-[#111100] hover:border-[#d4a93a]'
                }`}
              >
                <div className="text-sm font-bold">{bg.name}</div>
                <div className="mt-1 text-[0.7rem] text-[#8f7635]">{bg.skillProfs.join(', ')}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          {preview ? (
            <div className="section-box flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[#f0d080] text-xl font-bold">{preview.name}</h3>
                  <p className="mt-1 text-sm italic leading-6 text-[#7a6020]">{preview.flavorText}</p>
                </div>
                {state.background === preview.name && (
                  <span className="text-green-400 text-xs border border-green-700 px-2 py-1 rounded ml-2 flex-shrink-0">Selected ✓</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {/* Proficiencies */}
                <div>
                  <div className="field-label mb-1">Skill Proficiencies</div>
                  <div className="flex gap-1 flex-wrap">
                    {preview.skillProfs.map(s => (
                      <span key={s} className="text-[0.65rem] bg-[#1a1200] border border-[#b8962e] px-2 py-0.5 rounded text-[#f0d080]">{s}</span>
                    ))}
                  </div>
                </div>

                {/* Tool profs */}
                {preview.toolProfs.length > 0 && (
                  <div>
                    <div className="field-label mb-1">Tool Proficiencies</div>
                    <div className="flex gap-1 flex-wrap">
                      {(resolvedToolProficiencies.length ? resolvedToolProficiencies : preview.toolProfs).map(t => (
                        <span key={t} className="text-[0.65rem] bg-[#0d0d1a] border border-purple-800 px-2 py-0.5 rounded text-purple-300">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {preview.languages > 0 && (
                  <div>
                    <div className="field-label mb-1">Bonus Languages</div>
                    <div className="text-sm leading-6 text-[#c8a84b]">{preview.languages} of your choice</div>
                  </div>
                )}

                {/* Equipment */}
                <div className="col-span-2">
                  <div className="field-label mb-1">Starting Equipment</div>
                  <div className="text-sm leading-6 text-[#9a8040]">{resolvedEquipment || preview.equipment}</div>
                </div>
              </div>

              {/* Feature */}
              <div className="border border-[#2a1f00] rounded p-2">
                <div className="text-[#f0d080] text-xs font-bold mb-1">Feature: {preview.feature.name}</div>
                <div className="text-sm leading-6 text-[#9a8040]">{preview.feature.description}</div>
              </div>

              {state.background === preview.name && preview.languages > 0 && (
                <div>
                  <div className="section-title">Bonus Languages</div>
                  <div className="mb-2 text-sm leading-6 text-[#c8a84b]">
                    Pick {preview.languages} total. Chosen {state.backgroundLanguageChoices.length}/{preview.languages}.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableBackgroundLanguages.map(language => {
                      const selected = state.backgroundLanguageChoices.includes(language);
                      const alreadyTakenElsewhere = usedLanguages.has(language) && !selected;
                      const atLimit = !selected && state.backgroundLanguageChoices.length >= preview.languages;
                      const disabled = alreadyTakenElsewhere || atLimit;

                      return (
                        <button
                          key={language}
                          onClick={() => {
                            if (selected) {
                              onChange({ backgroundLanguageChoices: state.backgroundLanguageChoices.filter(item => item !== language) });
                              return;
                            }
                            if (disabled) return;
                            onChange({ backgroundLanguageChoices: [...state.backgroundLanguageChoices, language] });
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

              {state.background === preview.name && preview.toolChoiceOptions && (
                <div>
                  <div className="section-title">{preview.toolChoiceLabel ?? 'Choose Tool Proficiency'}</div>
                  <div className="flex flex-wrap gap-2">
                    {preview.toolChoiceOptions.map(option => {
                      const selected = state.backgroundSelections['background-tool-choice'] === option;
                      return (
                        <button
                          key={option}
                          onClick={() => onChange({
                            backgroundSelections: {
                              ...state.backgroundSelections,
                              'background-tool-choice': option,
                            },
                          })}
                          className={`rounded border px-3 py-1 text-xs transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : 'border-[#b8962e] bg-[#0d0d0d] text-[#b8962e] hover:bg-[#1a1000]'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.background === preview.name && preview.equipmentChoiceOptions && (
                <div>
                  <div className="section-title">{preview.equipmentChoiceLabel ?? 'Choose Equipment Option'}</div>
                  <div className="flex flex-wrap gap-2">
                    {preview.equipmentChoiceOptions.map(option => {
                      const selected = state.backgroundSelections['background-equipment-choice'] === option;
                      return (
                        <button
                          key={option}
                          onClick={() => onChange({
                            backgroundSelections: {
                              ...state.backgroundSelections,
                              'background-equipment-choice': option,
                            },
                          })}
                          className={`rounded border px-3 py-1 text-xs transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : 'border-[#b8962e] bg-[#0d0d0d] text-[#b8962e] hover:bg-[#1a1000]'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested traits (only when selected) */}
              {state.background === preview.name && (preview.suggestedTraits || preview.suggestedIdeals) && (
                <div className="flex flex-col gap-2">
                  {preview.suggestedTraits && (
                    <div>
                      <div className="field-label mb-1">Suggested Personality Traits</div>
                      <div className="flex flex-col gap-1">
                        {preview.suggestedTraits.slice(0, 3).map((t, i) => (
                          <button
                            key={i}
                            onClick={() => onChange({ personalityTraits: t })}
                            className="text-left text-[0.65rem] text-[#9a8040] hover:text-[#f0d080] border-b border-[#1a1500] pb-1"
                          >
                            "{t}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {preview.suggestedIdeals && (
                    <div>
                      <div className="field-label mb-1">Suggested Ideals</div>
                      <div className="flex flex-col gap-1">
                        {preview.suggestedIdeals.slice(0, 2).map((t, i) => (
                          <button
                            key={i}
                            onClick={() => onChange({ ideals: t })}
                            className="text-left text-[0.65rem] text-[#9a8040] hover:text-[#f0d080] border-b border-[#1a1500] pb-1"
                          >
                            "{t}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="section-box flex items-center justify-center h-48 text-[#3a2a00] text-sm italic">
              Select a background to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
