import { useState } from 'react';
import type { WizardState } from '../../types/wizard';
import { BACKGROUND_DATA } from '../../data/srd-backgrounds';
import { CHARLATAN_FAVORITE_SCHEMES } from '../../data/srd-backgrounds';
import { CRIMINAL_SPECIALTIES } from '../../data/srd-backgrounds';
import { ENTERTAINER_ADMIRER_FAVORS } from '../../data/srd-backgrounds';
import { GLADIATOR_WEAPON_OPTIONS } from '../../data/srd-backgrounds';
import { ENTERTAINER_ROUTINES } from '../../data/srd-backgrounds';
import { LANGUAGES } from '../../data/srd';
import { RACE_DATA } from '../../data/srd-races';
import {
  getResolvedBackgroundEquipment,
  getResolvedBackgroundEquipmentItems,
  getResolvedBackgroundToolProficiencies,
} from '../../utils/character-builder';
import PhbGodsReference from './PhbGodsReference';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export default function BackgroundStep({ state, onChange }: Props) {
  const [showGodsReference, setShowGodsReference] = useState(false);
  const [backgroundScrollY, setBackgroundScrollY] = useState(0);
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
  const resolvedEquipmentItems = preview ? getResolvedBackgroundEquipmentItems(state) : [];
  const acolyteFaithChoice = state.backgroundSelections['acolyte-faith-choice'] ?? '';
  const acolyteCustomOptionLabel = preview?.flavorCustomOptionLabel ?? '';
  const acolyteIsCustomChoice = acolyteFaithChoice === preview?.flavorCustomOptionLabel;
  const criminalVariant = state.backgroundSelections['criminal-variant'] ?? 'Normal Criminal';
  const isSpyVariant = preview?.name === 'Criminal' && criminalVariant === 'Spy Variant';
  const entertainerVariant = state.backgroundSelections['entertainer-variant'] ?? 'Normal Entertainer';
  const isGladiatorVariant = preview?.name === 'Entertainer' && entertainerVariant === 'Gladiator Variant';
  const entertainerRoutineChoices = (state.backgroundSelections['entertainer-routines'] ?? '')
    .split('|')
    .map(item => item.trim())
    .filter(Boolean);
  const backgroundToolChoiceAffectsEquipment = preview
    ? /musical instrument|artisan's tools/i.test(preview.equipment)
    : false;
  const restoreBackgroundScroll = () => {
    setTimeout(() => {
      window.scrollTo({ top: backgroundScrollY, behavior: 'auto' });
    }, 0);
  };
  const openGodsReference = () => {
    setBackgroundScrollY(window.scrollY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowGodsReference(true);
  };
  const previewTitle = isSpyVariant ? 'Criminal (Spy Variant)' : preview?.name ?? '';
  const finalPreviewTitle = isGladiatorVariant ? 'Entertainer (Gladiator Variant)' : previewTitle;
  const previewFlavorText = isSpyVariant
    ? 'Although your capabilities are not much different from those of a burglar or smuggler, you learned and practiced them in a very different context: as an espionage agent. You might have been an officially sanctioned agent of the crown, or perhaps you sold the secrets you uncovered to the highest bidder.'
    : isGladiatorVariant
    ? 'A gladiator is as much an entertainer as any minstrel or circus performer, trained to make the arts of combat into a spectacle the crowd can enjoy. This kind of flashy combat is your entertainer routine, though you might also have some skills as a tumbler or actor.'
    : preview?.flavorText ?? '';
  const previewFeatureName = isSpyVariant ? 'Spy Contact' : preview?.feature.name ?? '';
  const previewFeatureDescription = isSpyVariant
    ? 'You have a reliable and trustworthy contact who acts as your liaison to a network of other spies. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and seedy sailors who can deliver messages for you.'
    : isGladiatorVariant
    ? 'You can find a place to perform in any place that features combat for entertainment-perhaps a gladiatorial arena or secret pit fighting club. You can replace the musical instrument in your equipment package with an inexpensive but unusual weapon, such as a trident or net.'
    : preview?.feature.description ?? '';

  if (showGodsReference) {
    return (
      <PhbGodsReference
        selectedGod={acolyteIsCustomChoice ? '' : acolyteFaithChoice}
        onBack={() => {
          setShowGodsReference(false);
          restoreBackgroundScroll();
        }}
        onSelectGod={godName => {
          onChange({
            backgroundSelections: {
              ...state.backgroundSelections,
              'acolyte-faith-choice': godName,
              'acolyte-faith-custom': '',
            },
          });
          setShowGodsReference(false);
          restoreBackgroundScroll();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[var(--color-text-strong)] text-lg font-bold tracking-wide mb-1">Choose Your Background</h2>
        <p className="text-[var(--color-text-dim)] text-xs">Your background reflects where you came from, your original occupation, and your place in the world.</p>
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
                    ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                    : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)] hover:border-[#d4a93a]'
                }`}
              >
                <div className="text-sm font-bold">{bg.name}</div>
                <div className="mt-1 text-[0.7rem] text-[var(--color-text-muted)]">{bg.skillProfs.join(', ')}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          {preview ? (
            <div className="section-box flex flex-col gap-3">
              {state.background === preview.name && preview.name === 'Criminal' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="field-label mb-2">Criminal Variant</div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {[
                      {
                        label: 'Normal Criminal',
                        description: 'Use the standard criminal background with criminal contacts in the underworld.',
                      },
                      {
                        label: 'Spy Variant',
                        description: 'Use the spy variant, trading criminal contacts for a network of espionage contacts.',
                      },
                    ].map(option => {
                      const selected = criminalVariant === option.label;
                      return (
                        <button
                          key={option.label}
                          onClick={() =>
                            onChange({
                              backgroundSelections: {
                                ...state.backgroundSelections,
                                'criminal-variant': option.label,
                              },
                            })
                          }
                          className={`rounded border px-4 py-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-2)] text-[var(--color-text-soft)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold">{option.label}</div>
                          <div className="mt-1 text-xs leading-5">{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.background === preview.name && preview.name === 'Entertainer' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="field-label mb-2">Entertainer Variant</div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {[
                      {
                        label: 'Normal Entertainer',
                        description: 'Use the standard entertainer background centered on performance and public acclaim.',
                      },
                      {
                        label: 'Gladiator Variant',
                        description: 'Use the gladiator variant, treating combat spectacle as your performance tradition.',
                      },
                    ].map(option => {
                      const selected = entertainerVariant === option.label;
                      return (
                        <button
                          key={option.label}
                          onClick={() =>
                            onChange({
                              backgroundSelections: {
                                ...state.backgroundSelections,
                                'entertainer-variant': option.label,
                              },
                            })
                          }
                          className={`rounded border px-4 py-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-2)] text-[var(--color-text-soft)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold">{option.label}</div>
                          <div className="mt-1 text-xs leading-5">{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[var(--color-text-strong)] text-xl font-bold">{finalPreviewTitle}</h3>
                  <p className="mt-1 text-sm italic leading-6 text-[var(--color-text-dim)]">{previewFlavorText}</p>
                </div>
                {state.background === preview.name && (
                  <span className="text-green-400 text-xs border border-green-700 px-2 py-1 rounded ml-2 flex-shrink-0">Selected ✓</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Proficiencies */}
                <div>
                  <div className="field-label mb-1">Skill Proficiencies</div>
                  <div className="flex gap-1 flex-wrap">
                    {preview.skillProfs.map(s => (
                      <span key={s} className="text-[0.65rem] bg-[var(--color-selected)] border border-[var(--color-accent)] px-2 py-0.5 rounded text-[var(--color-text-strong)]">{s}</span>
                    ))}
                  </div>

                  {preview.languages > 0 && state.background === preview.name && (
                    <div className="mt-3">
                      <div className="field-label mb-1">
                        Bonus Languages ({state.backgroundLanguageChoices.length}/{preview.languages})
                      </div>
                      <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                        Choose {preview.languages} bonus language{preview.languages === 1 ? '' : 's'}.
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
                                  ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                  : disabled
                                  ? 'cursor-not-allowed border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                                  : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                              }`}
                            >
                              {language}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {state.background === preview.name && preview.name === 'Acolyte' && preview.flavorChoiceOptions && (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="section-title mb-0">{preview.flavorChoiceLabel ?? 'Choose Background Details'}</div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-3)] px-3 py-3">
                          <div className="field-label mb-1">Chosen God</div>
                          <div className="text-sm leading-6 text-[var(--color-text-soft)]">
                            {acolyteIsCustomChoice
                              ? state.backgroundSelections['acolyte-faith-custom'] || 'Custom god or religious service'
                              : acolyteFaithChoice || 'No god selected yet.'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={openGodsReference} className="tab-btn">
                            God List
                          </button>
                          {acolyteCustomOptionLabel && (
                            <button
                              onClick={() =>
                                onChange({
                                  backgroundSelections: {
                                    ...state.backgroundSelections,
                                    'acolyte-faith-choice': acolyteCustomOptionLabel,
                                  },
                                })
                              }
                              className={`rounded border px-3 py-1 text-xs transition-all ${
                                acolyteIsCustomChoice
                                  ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                  : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                              }`}
                            >
                              Custom God or Religious Service
                            </button>
                          )}
                        </div>
                        {preview.flavorCustomOptionLabel && acolyteIsCustomChoice && (
                          <div className="mt-3">
                            <label className="field-label mb-1 block">Custom God or Religious Service</label>
                            <textarea
                              value={state.backgroundSelections['acolyte-faith-custom'] ?? ''}
                              onChange={event =>
                                onChange({
                                  backgroundSelections: {
                                    ...state.backgroundSelections,
                                    'acolyte-faith-custom': event.target.value,
                                  },
                                })
                              }
                              rows={3}
                              className="w-full rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-3)] px-3 py-2 text-sm leading-6 text-[var(--color-text)]"
                              placeholder="Describe your god or religious service."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {state.background === preview.name && preview.name === 'Criminal' && preview.toolChoiceOptions && (
                    <div className="mt-3">
                      <div className="mb-1 text-sm font-bold text-[var(--color-text-strong)]">
                        {preview.toolChoiceLabel ?? 'Choose Included Tool or Instrument'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preview.toolChoiceOptions.map(option => {
                          const selected = state.backgroundSelections['background-tool-choice'] === option;
                          return (
                            <button
                              key={option}
                              onClick={() =>
                                onChange({
                                  backgroundSelections: {
                                    ...state.backgroundSelections,
                                    'background-tool-choice': option,
                                  },
                                })
                              }
                              className={`rounded border px-3 py-1 text-xs transition-all ${
                                selected
                                  ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                  : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {preview.toolProfs.length > 0 && (
                    <div className="mt-3">
                      <div className="field-label mb-1">Tool Proficiencies</div>
                      <div className="flex gap-1 flex-wrap">
                        {(resolvedToolProficiencies.length ? resolvedToolProficiencies : preview.toolProfs).map(t => (
                          <span key={t} className="text-[0.65rem] bg-[var(--color-selected)] border border-[var(--color-accent)] px-2 py-0.5 rounded text-[var(--color-text-strong)]">{t}</span>
                        ))}
                      </div>
                      {state.background === preview.name && preview.toolChoiceOptions && !backgroundToolChoiceAffectsEquipment && preview.name !== 'Criminal' && preview.name !== 'Spy' && (
                        <div className="mt-3">
                          <div className="mb-1 text-sm font-bold text-[var(--color-text-strong)]">
                            {preview.toolChoiceLabel ?? 'Choose Included Tool or Instrument'}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {preview.toolChoiceOptions.map(option => {
                              const selected = state.backgroundSelections['background-tool-choice'] === option;
                              return (
                                <button
                                  key={option}
                                  onClick={() =>
                                    onChange({
                                      backgroundSelections: {
                                        ...state.backgroundSelections,
                                        'background-tool-choice': option,
                                      },
                                    })
                                  }
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {state.background === preview.name && preview.name === 'Charlatan' && (
                        <div className="mt-3">
                          <div className="field-label mb-1">Favorite Schemes</div>
                          <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            Every charlatan has an angle he or she uses in preference to other schemes. Choose a favorite scam.
                          </div>
                          <div className="flex flex-col gap-2">
                            {CHARLATAN_FAVORITE_SCHEMES.map(scheme => {
                              const selected = state.backgroundSelections['charlatan-favorite-scheme'] === scheme;
                              return (
                                <button
                                  key={scheme}
                                  onClick={() =>
                                    onChange({
                                      backgroundSelections: {
                                        ...state.backgroundSelections,
                                        'charlatan-favorite-scheme': scheme,
                                      },
                                    })
                                  }
                                  className={`rounded border px-3 py-2 text-left text-sm transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-text-soft)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  {scheme}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {state.background === preview.name && preview.name === 'Entertainer' && (
                        <div className="mt-3">
                          <div className="field-label mb-1">Entertainer Routines ({entertainerRoutineChoices.length}/3)</div>
                          <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            Choose up to three kinds of performance you are known for.
                          </div>
                          <div className="flex flex-col gap-2">
                            {ENTERTAINER_ROUTINES.map(routine => {
                              const selected = entertainerRoutineChoices.includes(routine);
                              const disabled = !selected && entertainerRoutineChoices.length >= 3;
                              return (
                                <button
                                  key={routine}
                                  onClick={() => {
                                    if (selected) {
                                      const next = entertainerRoutineChoices.filter(item => item !== routine);
                                      onChange({
                                        backgroundSelections: {
                                          ...state.backgroundSelections,
                                          'entertainer-routines': next.join('|'),
                                        },
                                      });
                                      return;
                                    }
                                    if (disabled) return;
                                    onChange({
                                      backgroundSelections: {
                                        ...state.backgroundSelections,
                                        'entertainer-routines': [...entertainerRoutineChoices, routine].join('|'),
                                      },
                                    });
                                  }}
                                  disabled={disabled}
                                  className={`rounded border px-3 py-2 text-left text-sm transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                      : disabled
                                      ? 'cursor-not-allowed border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-text-soft)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  {routine}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {state.background === preview.name && preview.name === 'Criminal' && (
                        <div className="mt-3">
                          <div className="field-label mb-1">Criminal Specialty</div>
                          <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            There are many kinds of criminals, and within a thieves' guild or similar criminal organization, individual members have particular specialties. Even criminals who operate outside of such organizations have strong preferences for certain kinds of crimes over others. Choose the role you played in your criminal life.
                          </div>
                          <div className="flex flex-col gap-2">
                            {CRIMINAL_SPECIALTIES.map(option => {
                              const selected = state.backgroundSelections['criminal-specialty'] === option;
                              return (
                                <button
                                  key={option}
                                  onClick={() =>
                                    onChange({
                                      backgroundSelections: {
                                        ...state.backgroundSelections,
                                        'criminal-specialty': option,
                                      },
                                    })
                                  }
                                  className={`rounded border px-3 py-2 text-left text-sm transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-text-soft)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Feature */}
              <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                <div className="section-title">Background Feature</div>
                <div>
                  <div className="text-base font-bold text-[var(--color-text-strong)]">{previewFeatureName}</div>
                  <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-text-soft)]">{previewFeatureDescription}</div>
                </div>
              </div>

              {state.background === preview.name && preview.flavorChoiceOptions && preview.name !== 'Acolyte' && (
                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="section-title mb-0">{preview.flavorChoiceLabel ?? 'Choose Background Details'}</div>
                    </div>
                  {preview.name === 'Acolyte' ? (
                    <div className="space-y-3">
                      <div className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-3)] px-3 py-3">
                        <div className="field-label mb-1">Chosen God</div>
                        <div className="text-sm leading-6 text-[var(--color-text-soft)]">
                          {acolyteIsCustomChoice
                            ? state.backgroundSelections['acolyte-faith-custom'] || 'Custom god or religious service'
                            : acolyteFaithChoice || 'No god selected yet.'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={openGodsReference} className="tab-btn">
                          God List
                        </button>
                        {acolyteCustomOptionLabel && (
                          <button
                            onClick={() =>
                              onChange({
                                backgroundSelections: {
                                  ...state.backgroundSelections,
                                  'acolyte-faith-choice': acolyteCustomOptionLabel,
                                },
                              })
                            }
                            className={`rounded border px-3 py-1 text-xs transition-all ${
                              acolyteIsCustomChoice
                                ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                            }`}
                          >
                            Custom God or Religious Service
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {preview.flavorChoiceOptions.map(option => {
                        const selected = state.backgroundSelections['acolyte-faith-choice'] === option;
                        return (
                          <button
                            key={option}
                            onClick={() =>
                              onChange({
                                backgroundSelections: {
                                  ...state.backgroundSelections,
                                  'acolyte-faith-choice': option,
                                },
                              })
                            }
                            className={`rounded border px-3 py-1 text-xs transition-all ${
                              selected
                                ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {preview.flavorCustomOptionLabel &&
                    acolyteIsCustomChoice && (
                      <div className="mt-3">
                        <label className="field-label mb-1 block">Custom God or Religious Service</label>
                        <textarea
                          value={state.backgroundSelections['acolyte-faith-custom'] ?? ''}
                          onChange={event =>
                            onChange({
                              backgroundSelections: {
                                ...state.backgroundSelections,
                                'acolyte-faith-custom': event.target.value,
                              },
                            })
                          }
                          rows={3}
                          className="w-full rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-3)] px-3 py-2 text-sm leading-6 text-[var(--color-text)]"
                          placeholder="Describe your god or religious service."
                        />
                      </div>
                    )}
                </div>
              )}

              <div className="col-span-2">
                <div className="field-label mb-1">Starting Equipment</div>
                {state.background === preview.name && (preview.toolChoiceOptions || preview.equipmentChoiceOptions) && (
                  <div className="mb-3 space-y-3">
                    {preview.toolChoiceOptions && backgroundToolChoiceAffectsEquipment && !isGladiatorVariant && (
                      <div>
                        <div className="mb-1 text-sm font-bold text-[var(--color-text-strong)]">
                          {preview.toolChoiceLabel ?? 'Choose Included Tool or Instrument'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {preview.toolChoiceOptions.map(option => {
                            const selected = state.backgroundSelections['background-tool-choice'] === option;
                            return (
                              <button
                                key={option}
                                onClick={() =>
                                  onChange({
                                    backgroundSelections: {
                                      ...state.backgroundSelections,
                                      'background-tool-choice': option,
                                    },
                                  })
                                }
                                className={`rounded border px-3 py-1 text-xs transition-all ${
                                  selected
                                    ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                    : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {preview.equipmentChoiceOptions && (
                      <div>
                        <div className="mb-1 text-sm font-bold text-[var(--color-text-strong)]">
                          {preview.equipmentChoiceLabel ?? 'Choose Equipment Option'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(preview.name === 'Entertainer' ? ENTERTAINER_ADMIRER_FAVORS : preview.equipmentChoiceOptions).map(option => {
                            const selected = state.backgroundSelections['background-equipment-choice'] === option;
                            return (
                              <button
                                key={option}
                                onClick={() =>
                                  onChange({
                                    backgroundSelections: {
                                      ...state.backgroundSelections,
                                      'background-equipment-choice': option,
                                    },
                                  })
                                }
                                className={`rounded border px-3 py-1 text-xs transition-all ${
                                  selected
                                    ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                    : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {state.background === preview.name && preview.name === 'Entertainer' && isGladiatorVariant && (
                      <div>
                        <div className="mb-1 text-sm font-bold text-[var(--color-text-strong)]">
                          Choose your unusual gladiator weapon
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {GLADIATOR_WEAPON_OPTIONS.map(option => {
                            const selected = state.backgroundSelections['entertainer-gladiator-weapon'] === option;
                            return (
                              <button
                                key={option}
                                onClick={() =>
                                  onChange({
                                    backgroundSelections: {
                                      ...state.backgroundSelections,
                                      'entertainer-gladiator-weapon': option,
                                    },
                                  })
                                }
                                className={`rounded border px-3 py-1 text-xs transition-all ${
                                  selected
                                    ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                    : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {(resolvedEquipmentItems.length ? resolvedEquipmentItems : [resolvedEquipment || preview.equipment]).map(item => (
                    <div
                      key={item}
                      className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-3)] px-3 py-2 text-sm leading-6 text-[var(--color-text-soft)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="section-box flex items-center justify-center h-48 text-[var(--color-text-dim)] text-sm italic">
              Select a background to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
