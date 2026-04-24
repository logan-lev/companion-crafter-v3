import { useMemo, useState } from 'react';
import type { Character } from '../types/character';
import type { WizardState } from '../types/wizard';
import { WIZARD_INITIAL_STATE } from '../types/wizard';
import { ABILITY_NAMES, modStr, profBonusFromLevel } from '../data/srd';
import RaceStep from './wizard/RaceStep';
import ClassStep from './wizard/ClassStep';
import BackgroundStep from './wizard/BackgroundStep';
import AbilityScoreStep from './wizard/AbilityScoreStep';
import SpellsStep from './wizard/SpellsStep';
import DetailsStep from './wizard/DetailsStep';
import ReviewStep from './wizard/ReviewStep';
import {
  ABILITY_KEYS,
  createCharacterFromWizard,
  getAllOtherProficiencies,
  getAllSkillProficiencies,
  getArmorClass,
  getFeatMilestones,
  getFinalAbilityScores,
  getFutureClassFeatures,
  getLanguages,
  getMaxHp,
  getSelectedClass,
  getSpeed,
  getTraitEntries,
} from '../utils/character-builder';
import { getCantripsKnown, getSlotsAtLevel, getSpellsKnown } from '../data/srd-classes';

interface Props {
  onFinish: (character: Character) => void;
  onCancel: () => void;
}

interface StepDefinition {
  id: string;
  label: string;
  description: string;
}

const BASE_STEPS: StepDefinition[] = [
  { id: 'race', label: 'Race', description: 'Choose ancestry, traits, and racial bonuses.' },
  { id: 'class', label: 'Class', description: 'Choose class, level, proficiencies, and features.' },
  { id: 'background', label: 'Background', description: 'Choose history, proficiencies, and feature.' },
  { id: 'abilities', label: 'Stats', description: 'Assign ability scores with standard, point buy, or rolling.' },
  { id: 'details', label: 'Details', description: 'Name the character and shape their personality.' },
  { id: 'review', label: 'Review', description: 'Check the final build before creating the sheet.' },
];

const SPELLS_STEP: StepDefinition = {
  id: 'spells',
  label: 'Spells',
  description: 'Pick spells from the class list based on level and casting rules.',
};

export default function CharacterWizard({ onFinish, onCancel }: Props) {
  const [state, setState] = useState<WizardState>(WIZARD_INITIAL_STATE);

  const cls = getSelectedClass(state);
  const finalScores = getFinalAbilityScores(state);
  const skillProfs = getAllSkillProficiencies(state);
  const otherProfs = getAllOtherProficiencies(state);
  const languages = getLanguages(state);
  const traits = getTraitEntries(state);
  const futureFeatures = getFutureClassFeatures(state);
  const featMilestones = getFeatMilestones(state);
  const proficiencyBonus = profBonusFromLevel(state.level);
  const canCastSpells = Boolean(cls?.spellcasting);

  const steps = useMemo(() => {
    const withSpells = [...BASE_STEPS];
    if (canCastSpells) withSpells.splice(4, 0, SPELLS_STEP);
    return withSpells;
  }, [canCastSpells]);

  const [rawStepIndex, setStepIndex] = useState(0);
  const stepIndex = Math.min(rawStepIndex, steps.length - 1);

  const currentStep = steps[stepIndex];

  const updateState = (patch: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...patch }));
  };

  const goNext = () => setStepIndex(current => Math.min(current + 1, steps.length - 1));
  const goBack = () => setStepIndex(current => Math.max(current - 1, 0));

  const finishWizard = () => onFinish(createCharacterFromWizard(state));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="section-box">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="field-label">Creation Flow</div>
            <div className="mt-1 text-lg font-bold text-[#f0d080]">
              Step {stepIndex + 1} of {steps.length}: {currentStep.label}
            </div>
          </div>
          <button onClick={onCancel} className="delete-btn px-5 py-2 text-[0.7rem]">
            Cancel Creation
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isComplete = index < stepIndex;

            return (
              <button
                key={step.id}
                onClick={() => setStepIndex(index)}
                className={`rounded border px-4 py-4 text-left transition-all ${
                  isActive
                    ? 'border-[#f0d080] bg-[#1a1200]'
                    : isComplete
                    ? 'border-[#5a4a1b] bg-[#12100a]'
                    : 'border-[#2a1f00] bg-[#0d0d0d] hover:border-[#b8962e]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[0.78rem] font-bold uppercase tracking-[0.18em] ${isActive ? 'text-[#f0d080]' : 'text-[#b8962e]'}`}>
                    {index + 1}. {step.label}
                  </span>
                  <span className={`text-[0.68rem] ${isComplete ? 'text-green-400' : 'text-[#7a6020]'}`}>
                    {isComplete ? 'Done' : `Page ${index + 1}`}
                  </span>
                </div>
                <p className="mt-2 text-[0.78rem] leading-6 text-[#8f7635]">{step.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="section-box">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div>
                <div className="field-label">Character Builder</div>
                <h2 className="text-4xl font-bold text-[#f0d080]">{state.name || 'New Adventurer'}</h2>
                <p className="mt-2 text-lg text-[#8f7635]">
                  Page {stepIndex + 1} of {steps.length}: {currentStep.label}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 2xl:min-w-[420px]">
                <div className="stat-box">
                  <div className="text-base font-bold">{state.race || '—'}</div>
                  <div className="field-label">Race</div>
                </div>
                <div className="stat-box">
                  <div className="text-base font-bold">{state.className ? `${state.className} ${state.level}` : '—'}</div>
                  <div className="field-label">Class</div>
                </div>
                <div className="stat-box">
                  <div className="text-base font-bold">{state.background || '—'}</div>
                  <div className="field-label">Background</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-box min-h-[780px]">
            {currentStep.id === 'race' && <RaceStep state={state} onChange={updateState} />}
            {currentStep.id === 'class' && <ClassStep state={state} onChange={updateState} />}
            {currentStep.id === 'background' && <BackgroundStep state={state} onChange={updateState} />}
            {currentStep.id === 'abilities' && <AbilityScoreStep state={state} onChange={updateState} />}
            {currentStep.id === 'spells' && <SpellsStep state={state} onChange={updateState} />}
            {currentStep.id === 'details' && <DetailsStep state={state} onChange={updateState} />}
            {currentStep.id === 'review' && <ReviewStep state={state} onFinish={finishWizard} />}
          </div>

          {currentStep.id !== 'review' && (
            <div className="flex items-center justify-between gap-3 border-t border-[#2a1f00] pt-2">
              <button
                onClick={goBack}
                disabled={stepIndex === 0}
                className={`tab-btn ${stepIndex === 0 ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                Previous
              </button>
              <button onClick={goNext} className="save-btn">
                {stepIndex === steps.length - 2 ? 'Review Character' : 'Next Page'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <div className="section-box">
          <div className="section-title">Live Preview</div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="stat-box">
              <div className="text-base font-bold">{getArmorClass(state)}</div>
              <div className="field-label">Armor Class</div>
            </div>
            <div className="stat-box">
              <div className="text-base font-bold">{getMaxHp(state)}</div>
              <div className="field-label">Hit Points</div>
            </div>
            <div className="stat-box">
              <div className="text-base font-bold">+{proficiencyBonus}</div>
              <div className="field-label">Prof Bonus</div>
            </div>
            <div className="stat-box">
              <div className="text-base font-bold">{getSpeed(state)} ft</div>
              <div className="field-label">Speed</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {ABILITY_KEYS.map(key => (
              <div key={key} className="stat-box py-2">
                <div className="text-[0.6rem] font-bold uppercase text-[#b8962e]">{ABILITY_NAMES[key].slice(0, 3)}</div>
                <div className="text-lg font-bold text-[#f0d080]">{finalScores[key]}</div>
                <div className="text-[0.65rem] text-[#8f7635]">{modStr(finalScores[key])}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="section-box">
            <div className="section-title">Build Snapshot</div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <div className="field-label mb-1">Skills</div>
              <div className="text-sm leading-6 text-[#c8a84b]">{skillProfs.length ? skillProfs.join(', ') : 'No skill proficiencies selected yet.'}</div>
            </div>
            <div>
              <div className="field-label mb-1">Other Proficiencies</div>
              <div className="text-sm leading-6 text-[#c8a84b]">{otherProfs.length ? otherProfs.join(', ') : 'No extra proficiencies yet.'}</div>
            </div>
            <div>
              <div className="field-label mb-1">Languages</div>
              <div className="text-sm leading-6 text-[#c8a84b]">{languages.length ? languages.join(', ') : 'No languages selected yet.'}</div>
            </div>
          </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="section-box">
              <div className="section-title">Current Benefits</div>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {traits.length ? traits.slice(0, 10).map(entry => (
                  <div key={entry} className="border-l-2 border-[#b8962e] pl-2 text-sm leading-6 text-[#9a8040]">
                    {entry}
                  </div>
                )) : (
                  <div className="text-sm italic text-[#5e4917]">Race, class, and background benefits will appear here as you build.</div>
                )}
              </div>
            </div>

            {cls && (
              <div className="section-box">
                <div className="section-title">Level Progression</div>
                <div className="mb-3 text-sm text-[#c8a84b]">
                  {cls.name} level {state.level}
                </div>

                {featMilestones.length > 0 && (
                  <div className="mb-3">
                    <div className="field-label mb-1">ASI / Feat Levels</div>
                    <div className="flex flex-wrap gap-1">
                      {featMilestones.map(level => (
                        <span
                          key={level}
                          className={`rounded border px-2 py-0.5 text-[0.7rem] ${
                            level <= state.level
                              ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                              : 'border-[#5a4a1b] text-[#b8962e]'
                          }`}
                        >
                          Lv {level}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {futureFeatures.length ? futureFeatures.map(feature => (
                    <div key={`${feature.level}-${feature.name}`} className="border-l-2 border-[#5a4a1b] pl-3">
                      <div className="text-xs font-bold text-[#f0d080]">Lv {feature.level} · {feature.name}</div>
                      <div className="text-sm leading-6 text-[#8f7635]">{feature.description}</div>
                    </div>
                  )) : (
                    <div className="text-sm italic text-[#5e4917]">No later-level features to preview yet.</div>
                  )}
                </div>
              </div>
            )}

            {cls?.spellcasting && (
              <div className="section-box">
                <div className="section-title">Spellcasting Snapshot</div>
                <div className="space-y-2 text-sm leading-6 text-[#c8a84b]">
                  <div>
                    Casting ability: <span className="text-[#f0d080] uppercase">{cls.spellcasting.ability}</span>
                  </div>
                  <div>
                    Cantrips: <span className="text-[#f0d080]">{getCantripsKnown(cls.spellcasting, state.level)}</span>
                  </div>
                  {cls.spellcasting.spellsKnown && (
                    <div>
                      Spells known: <span className="text-[#f0d080]">{getSpellsKnown(cls.spellcasting, state.level)}</span>
                    </div>
                  )}
                  <div>
                    Slots: <span className="text-[#f0d080]">
                      {getSlotsAtLevel(cls.spellcasting, state.level)
                        .map((count, index) => count > 0 ? `${count}xL${index + 1}` : null)
                        .filter(Boolean)
                        .join(' · ') || 'No spell slots yet'}
                    </span>
                  </div>
                  <div>
                    Chosen spells: <span className="text-[#f0d080]">{state.selectedCantrips.length + state.selectedSpells.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
