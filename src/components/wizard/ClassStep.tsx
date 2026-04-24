import type { WizardState } from '../../types/wizard';
import {
  BARBARIAN_PRIMAL_PATHS,
  BARBARIAN_RAGE_DAMAGE_BY_LEVEL,
  BARBARIAN_RAGES_BY_LEVEL,
  BARBARIAN_TOTEM_SPIRITS,
  CLASS_DATA,
  type ClassFeature,
  getCantripsKnown,
  getClassFeatureTimeline,
  getSlotsAtLevel,
  getSpellsKnown,
  WARLOCK_PACT_LEVEL,
  WARLOCK_PACT_SLOTS,
} from '../../data/srd-classes';
import {
  CLASS_EQUIPMENT_CHOICES,
  CLASS_STARTER_EQUIPMENT,
  MARTIAL_MELEE_WEAPONS,
  SIMPLE_WEAPONS,
} from '../../data/srd-class-equipment';
import { ABILITY_NAMES, profBonusFromLevel } from '../../data/srd';
import { SPELL_LIST } from '../../data/srd-spells';
import type { AbilityKey } from '../../types/character';
import { getRacialBonus } from '../../utils/character-builder';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

interface EffectSummary {
  label: string;
  condition?: string;
}

interface SpellDetail {
  name: string;
  levelLabel: string;
  description: string;
  ritual?: boolean;
}

const CLASS_FEATURE_SPELLS: Record<string, SpellDetail[]> = {
  'Spirit Seeker': [
    {
      name: 'Beast Sense',
      levelLabel: '2nd-level ritual',
      ritual: true,
      description:
        "You touch a willing beast. For the duration, you can use your action to see through the beast's eyes and hear what it hears while gaining the benefits of any special senses it has.",
    },
    {
      name: 'Speak with Animals',
      levelLabel: '1st-level ritual',
      ritual: true,
      description:
        SPELL_LIST.find(spell => spell.name === 'Speak with Animals')?.description ??
        'You gain the ability to comprehend and verbally communicate with beasts for the duration.',
    },
  ],
  'Spirit Walker': [
    {
      name: 'Commune with Nature',
      levelLabel: '5th-level ritual',
      ritual: true,
      description:
        'You briefly become one with nature and gain knowledge of the surrounding territory, learning about terrain, bodies of water, plants, minerals, peoples, powerful celestials, fey, fiends, elementals, and undead within range.',
    },
  ],
};

function getAsiLevels(className: string, barbarianPath: string): number[] {
  return getClassFeatureTimeline(className, { barbarianPath })
    .filter(feature => feature.name === 'Ability Score Improvement')
    .map(feature => feature.level);
}

function getAllocatedAsiPoints(state: WizardState): number {
  return Object.values(state.classAbilityBonuses).reduce((sum, value) => sum + (value ?? 0), 0);
}

function getAvailableAsiPoints(state: WizardState): number {
  return getAsiLevels(state.className, state.barbarianPath).filter(level => level <= state.level).length * 2;
}

function modString(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function getBarbarianRageCount(level: number): string {
  const count = BARBARIAN_RAGES_BY_LEVEL[level - 1] ?? 2;
  return count >= 999 ? '∞' : String(count);
}

function getBarbarianRageDamage(level: number): string {
  return `+${BARBARIAN_RAGE_DAMAGE_BY_LEVEL[level - 1] ?? 2}`;
}

function splitEquipmentList(text: string): string[] {
  return text.split(',').map(item => item.trim()).filter(Boolean);
}

function isBarbarianPathFeature(feature: ClassFeature): boolean {
  return BARBARIAN_PRIMAL_PATHS.some(path =>
    path.features.some(pathFeature => pathFeature.level === feature.level && pathFeature.name === feature.name)
  ) || BARBARIAN_TOTEM_SPIRITS.some(spirit =>
    [spirit.level3, spirit.level6, spirit.level14].some(pathFeature => pathFeature.level === feature.level && pathFeature.name === feature.name)
  );
}

function getAsiCap(): number {
  return 20;
}

function getDisplayedAbilityMax(state: WizardState, key: AbilityKey): number {
  if (state.className === 'Barbarian' && state.level >= 20 && (key === 'str' || key === 'con')) {
    return 24;
  }

  return 20;
}

function getCombinedFeatureEffects(
  className: string,
  features: ClassFeature[]
): { resistances: EffectSummary[]; advantages: EffectSummary[] } {
  if (className !== 'Barbarian') {
    return { resistances: [], advantages: [] };
  }

  const resistances: EffectSummary[] = [];
  const advantages: EffectSummary[] = [];

  features.forEach(feature => {
    if (feature.name === 'Rage') {
      advantages.push({
        label: 'Strength checks and Strength saving throws',
        condition: 'While raging',
      });
      resistances.push({
        label: 'Bludgeoning, piercing, and slashing damage',
        condition: 'While raging',
      });
    }

    if (feature.name === 'Danger Sense') {
      advantages.push({
        label: 'Dexterity saving throws against visible effects',
      });
    }

    if (feature.name === 'Feral Instinct') {
      advantages.push({
        label: 'Initiative rolls',
      });
    }

    if (feature.name === 'Totem Spirit (Bear)') {
      resistances.push({
        label: 'All damage except psychic',
        condition: 'While raging',
      });
    }

    if (feature.name === 'Totem Spirit (Wolf)') {
      advantages.push({
        label: 'Allies gain advantage on melee attack rolls against hostile creatures within 5 feet of you',
        condition: 'While raging',
      });
    }

    if (feature.name === 'Totem Spirit (Eagle)') {
      advantages.push({
        label: 'Opportunity attacks against you are at disadvantage; Dash as a bonus action',
        condition: "While raging and not wearing heavy armor",
      });
    }

    if (feature.name === 'Aspect of the Beast (Bear)') {
      advantages.push({
        label: 'Strength checks to push, pull, lift, or break objects',
      });
    }

    if (feature.name === 'Mindless Rage') {
      resistances.push({
        label: 'Charmed and frightened conditions',
        condition: 'While raging',
      });
    }
  });

  return { resistances, advantages };
}

function getTotemSpiritOption(level: 3 | 6 | 14, spiritName: string): ClassFeature | null {
  const spirit = BARBARIAN_TOTEM_SPIRITS.find(option => option.name === spiritName);
  if (!spirit) return null;
  if (level === 3) return spirit.level3;
  if (level === 6) return spirit.level6;
  return spirit.level14;
}

function getFeatureSpellDetails(feature: ClassFeature): SpellDetail[] {
  return CLASS_FEATURE_SPELLS[feature.name] ?? [];
}

export default function ClassStep({ state, onChange }: Props) {
  const selectedClassData = CLASS_DATA.find(c => c.name === state.className);
  const previewClass = selectedClassData;
  const level = state.level;
  const profBonus = profBonusFromLevel(level);

  const selectClass = (cls: (typeof CLASS_DATA)[number]) => {
    onChange({
      className: cls.name,
      classSkillChoices: [],
      selectedCantrips: [],
      selectedSpells: [],
      barbarianPath: '',
      barbarianTotemSpirit: '',
      barbarianAspectSpirit: '',
      barbarianAttunementSpirit: '',
      classEquipmentSelections: {},
      classAbilityBonuses: {},
    });
  };

  const handleLevelChange = (nextLevel: number) => {
    const nextAvailable =
      getAsiLevels(state.className, state.barbarianPath).filter(levelValue => levelValue <= nextLevel).length * 2;
    const racialBonus = getRacialBonus(state);
    let remaining = nextAvailable;
    const nextBonuses: Partial<Record<AbilityKey, number>> = {};

    for (const key of ABILITY_KEYS) {
      const current = state.classAbilityBonuses[key] ?? 0;
      const maxByScore = Math.max(
        0,
        getAsiCap() - ((state.baseScores[key] ?? 8) + (racialBonus[key] ?? 0))
      );
      const allowed = Math.min(current, maxByScore, remaining);
      if (allowed > 0) {
        nextBonuses[key] = allowed;
        remaining -= allowed;
      }
    }

    onChange({
      level: nextLevel,
      classAbilityBonuses: nextBonuses,
      ...(nextLevel < 3
        ? {
            barbarianPath: '',
            barbarianTotemSpirit: '',
            barbarianAspectSpirit: '',
            barbarianAttunementSpirit: '',
          }
        : nextLevel < 6
        ? { barbarianAspectSpirit: '' }
        : nextLevel < 14
        ? { barbarianAttunementSpirit: '' }
        : {}),
    });
  };

  const toggleSkill = (skill: string) => {
    const cls = CLASS_DATA.find(c => c.name === state.className);
    if (!cls) return;
    const cur = state.classSkillChoices;
    if (cur.includes(skill)) {
      onChange({ classSkillChoices: cur.filter(s => s !== skill) });
    } else if (cur.length < cls.skillCount) {
      onChange({ classSkillChoices: [...cur, skill] });
    }
  };

  const updateAsi = (key: AbilityKey, delta: number) => {
    const current = state.classAbilityBonuses[key] ?? 0;
    const allocated = getAllocatedAsiPoints(state);
    const available = getAvailableAsiPoints(state);
    const racialBonus = getRacialBonus(state);
    const maxByScore = Math.max(
      0,
      getAsiCap() - ((state.baseScores[key] ?? 8) + (racialBonus[key] ?? 0))
    );

    if (delta > 0 && allocated >= available) return;
    if (delta < 0 && current <= 0) return;
    if (delta > 0 && current >= maxByScore) return;

    const next = { ...state.classAbilityBonuses, [key]: Math.max(0, current + delta) };
    if (next[key] === 0) delete next[key];
    onChange({ classAbilityBonuses: next });
  };

  const features = previewClass
    ? getClassFeatureTimeline(previewClass.name, {
        barbarianPath: state.barbarianPath,
        barbarianTotemSpirit: state.barbarianTotemSpirit,
        barbarianAspectSpirit: state.barbarianAspectSpirit,
        barbarianAttunementSpirit: state.barbarianAttunementSpirit,
      })
    : [];
  const baseFeatures = features.filter(feature => !isBarbarianPathFeature(feature));
  const unlockedFeatures = features.filter(feature => feature.level <= level);
  const selectedPrimalPath = BARBARIAN_PRIMAL_PATHS.find(path => path.name === state.barbarianPath);
  const selectedTotemSpirit = getTotemSpiritOption(3, state.barbarianTotemSpirit);
  const selectedAspectSpirit = getTotemSpiritOption(6, state.barbarianAspectSpirit);
  const selectedAttunementSpirit = getTotemSpiritOption(14, state.barbarianAttunementSpirit);
  const primalPathDisplayFeatures =
    selectedPrimalPath?.name === 'Path of the Totem Warrior'
      ? [
          ...selectedPrimalPath.features,
          selectedAspectSpirit ?? {
            level: 6,
            name: 'Aspect of the Beast (Choose a spirit first)',
            description: 'Choose a spirit animal to gain your 6th-level aspect feature.',
          },
          selectedAttunementSpirit ?? {
            level: 14,
            name: 'Totemic Attunement (Choose a spirit first)',
            description: 'Choose a spirit animal to gain your 14th-level attunement feature.',
          },
        ].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
      : selectedPrimalPath?.features ?? [];
  const classEffects = getCombinedFeatureEffects(previewClass?.name ?? '', unlockedFeatures);

  const classEquipmentChoices = previewClass ? (CLASS_EQUIPMENT_CHOICES[previewClass.name] ?? []) : [];
  const primaryEquipmentChoice = state.classEquipmentSelections['barbarian-weapon-primary'] ?? 'Greataxe';
  const secondaryEquipmentChoice = state.classEquipmentSelections['barbarian-weapon-secondary'] ?? 'Two handaxes';

  const displayedEquipment = previewClass?.name === 'Barbarian'
    ? [
        primaryEquipmentChoice === 'Any martial melee weapon'
          ? state.classEquipmentSelections['barbarian-weapon-primary-specific'] ?? MARTIAL_MELEE_WEAPONS[0]
          : primaryEquipmentChoice,
        secondaryEquipmentChoice === 'Any simple weapon'
          ? state.classEquipmentSelections['barbarian-weapon-secondary-specific'] ?? SIMPLE_WEAPONS[0]
          : secondaryEquipmentChoice,
        "Explorer's pack",
        'Four javelins',
      ]
    : splitEquipmentList(previewClass ? CLASS_STARTER_EQUIPMENT[previewClass.name] ?? '' : '');

  const renderSpellCards = (feature: ClassFeature) => {
    const spells = getFeatureSpellDetails(feature);
    if (!spells.length) return null;

    return (
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        {spells.map(spell => (
          <div key={`${feature.name}-${spell.name}`} className="rounded border border-[#6b5a24] bg-[#120d02] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-[#f0d080]">{spell.name}</div>
              <div className="text-[0.68rem] uppercase tracking-wide text-[#b8962e]">
                {spell.levelLabel}{spell.ritual ? ' · ritual' : ''}
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#a38846]">{spell.description}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderFeatureDescription = (feature: ClassFeature, unlocked: boolean) => {
    if (feature.name === 'Rage') {
      return (
        <div className={`mt-2 rounded border border-[#6b5a24] bg-[#120d02] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[#6b5a24] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[#f0d080]">
            Rage
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[#b6974c]">
            <p>In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action.</p>
            <div>
              <p className="mb-2">While raging, you gain the following benefits if you aren't wearing heavy armor:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>You have advantage on Strength checks and Strength saving throws.</li>
                <li>When you make a melee weapon attack using Strength, you gain a bonus to the damage roll that increases as you gain levels as a barbarian, as shown in the Rage Damage column of the Barbarian table.</li>
                <li>You have resistance to bludgeoning, piercing, and slashing damage.</li>
              </ul>
            </div>
            <p>If you are able to cast spells, you can't cast them or concentrate on them while raging.</p>
            <p>Your rage lasts for 1 minute. It ends early if you are knocked unconscious or if your turn ends and you haven't attacked a hostile creature since your last turn or taken damage since then. You can also end your rage on your turn as a bonus action.</p>
            <p>Once you have raged the number of times shown for your barbarian level in the Rages column of the Barbarian table, you must finish a long rest before you can rage again.</p>
          </div>
        </div>
      );
    }

    if (feature.name === 'Totem Spirit') {
      return (
        <div className={`mt-2 rounded border border-[#6b5a24] bg-[#120d02] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-[#b8962e] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#f0d080]">
              Spirit Choice
            </span>
            <span className="text-sm italic text-[#8f7635]">Pick a totem animal below to unlock the matching feature.</span>
          </div>
          <p className="text-[0.98rem] leading-7 text-[#b6974c]">{feature.description}</p>
          {selectedTotemSpirit ? (
            <div className="mt-3 rounded border border-[#5a4a1b] bg-[#161005] p-3">
              <div className="text-sm font-bold text-[#f0d080]">{selectedTotemSpirit.name}</div>
              <p className="mt-2 text-sm leading-6 text-[#a38846]">{selectedTotemSpirit.description}</p>
            </div>
          ) : (
            <div className="mt-3 rounded border border-dashed border-[#5a4a1b] bg-[#161005] p-3 text-sm text-[#8f7635]">
              Choose a spirit to see the level 3 totem benefit here.
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <p className={`mt-1 text-[0.98rem] leading-7 ${unlocked ? 'text-[#9a8040]' : 'text-[#6f5b2b]'}`}>{feature.description}</p>
        {renderSpellCards(feature)}
      </>
    );
  };

  const renderSpiritChoiceInline = (mode: 'totem' | 'aspect' | 'attunement') => {
    const selectedValue =
      mode === 'totem'
        ? state.barbarianTotemSpirit
        : mode === 'aspect'
        ? state.barbarianAspectSpirit
        : state.barbarianAttunementSpirit;
    const onSelect =
      mode === 'totem'
        ? (spirit: string) => onChange({ barbarianTotemSpirit: spirit })
        : mode === 'aspect'
        ? (spirit: string) => onChange({ barbarianAspectSpirit: spirit })
        : (spirit: string) => onChange({ barbarianAttunementSpirit: spirit });

    return (
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <span className="text-[0.68rem] uppercase tracking-wide text-[#7a6020]">Spirit</span>
        {BARBARIAN_TOTEM_SPIRITS.map(spirit => {
          const selected = selectedValue === spirit.name;
          return (
            <button
              key={`${mode}-${spirit.name}`}
              onClick={() => onSelect(spirit.name)}
              className={`rounded border px-2 py-1 text-[0.68rem] transition-all ${
                selected
                  ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                  : 'border-[#5a4a1b] text-[#b8962e] hover:bg-[#1a1000]'
              }`}
            >
              {spirit.name}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 text-lg font-bold tracking-wide text-[#f0d080]">Choose Your Class & Level</h2>
        <p className="text-xs text-[#7a6020]">Your class is the primary definition of what your character can do.</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="section-box">
          <div className="section-title">Class Selection</div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {CLASS_DATA.map(cls => (
                <button
                  key={cls.name}
                  onClick={() => selectClass(cls)}
                  className={`rounded border px-3 py-3 text-left transition-all ${
                    state.className === cls.name
                      ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                      : 'border-[#b8962e] bg-[#0d0d0d] text-[#b8962e] hover:border-[#d4a93a] hover:bg-[#111100]'
                  }`}
                >
                  <div className="text-sm font-bold">{cls.name}</div>
                  <div className="mt-1 text-[0.72rem] text-[#8f7635]">d{cls.hitDie} · {cls.primaryAbility}</div>
                </button>
              ))}
            </div>

            {state.className && (
              <div>
                <div className="mb-2 field-label">Character Level</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={level}
                    onChange={e => handleLevelChange(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#b8962e]"
                  />
                  <span className="w-10 text-center text-lg font-bold text-[#f0d080]">{level}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          {previewClass ? (
            <div className="section-box flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#f0d080]">{previewClass.name}</h3>
                  <p className="mt-1 text-sm italic leading-6 text-[#7a6020]">{previewClass.flavorText}</p>
                </div>
                <span className="ml-2 rounded border border-green-700 px-2 py-1 text-xs text-green-400">Selected ✓</span>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <div className="stat-box">
                  <div className="text-base font-bold">{level} d{previewClass.hitDie}</div>
                  <div className="field-label">Hit Dice</div>
                </div>
                <div className="stat-box">
                  <div className="text-sm font-bold">{previewClass.primaryAbility}</div>
                  <div className="field-label">Primary Ability</div>
                </div>
                <div className="stat-box lg:col-span-2">
                  <div className="text-xs font-bold text-[#f0d080]">{previewClass.savingThrows.map(s => ABILITY_NAMES[s]).join(', ')}</div>
                  <div className="field-label">Saving Throw Proficiencies</div>
                </div>
                <div className="stat-box lg:col-span-4">
                  <div className="text-base font-bold">+{profBonus}</div>
                  <div className="field-label">Prof Bonus</div>
                </div>
              </div>

              {previewClass.name === 'Barbarian' && (
                <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-2">
                  <div className="stat-box">
                    <div className="text-base font-bold">{getBarbarianRageCount(level)}</div>
                    <div className="field-label">Rages</div>
                  </div>
                  <div className="stat-box">
                    <div className="text-base font-bold">{getBarbarianRageDamage(level)}</div>
                    <div className="field-label">Rage Damage</div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1 field-label">Armor & Weapon Proficiencies</div>
                <div className="text-sm leading-6 text-[#c8a84b]">
                  {[...previewClass.armorProf, ...previewClass.weaponProf].join(' · ') || 'None'}
                </div>
              </div>

              {state.className === previewClass.name && (
                <div>
                  <div className="mb-1 field-label">
                    Choose Skill Proficiencies ({state.classSkillChoices.length}/{previewClass.skillCount})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {previewClass.skillOptions.map(skill => {
                      const chosen = state.classSkillChoices.includes(skill);
                      const canAdd = state.classSkillChoices.length < previewClass.skillCount;
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          disabled={!chosen && !canAdd}
                          className={`rounded border px-2 py-0.5 text-[0.68rem] transition-all ${
                            chosen
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : canAdd
                              ? 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                              : 'cursor-not-allowed border-[#2a1f00] text-[#3a2a00]'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {previewClass.spellcasting && (
                <div className="rounded border border-purple-900 bg-[#0a0014] p-3">
                  <div className="mb-1 text-xs font-bold text-purple-300">✦ Spellcasting</div>
                  <div className="text-[0.72rem] text-[#9a80a0]">
                    Ability: <span className="text-purple-300">{previewClass.spellcasting.ability.toUpperCase()}</span>
                    {' · '}Type: <span className="text-purple-300">{previewClass.spellcasting.type}</span>
                    {' · '}{previewClass.spellcasting.prepares ? 'Prepares spells' : 'Knows spells'}
                  </div>
                  {previewClass.spellcasting.type !== 'pact' ? (
                    <div className="mt-2">
                      <div className="mb-1 text-[0.66rem] text-[#7a6060]">
                        Cantrips: {getCantripsKnown(previewClass.spellcasting, level)}
                        {previewClass.spellcasting.spellsKnown && <> · Spells known: {getSpellsKnown(previewClass.spellcasting, level)}</>}
                      </div>
                      <div className="grid grid-cols-9 gap-0.5">
                        {getSlotsAtLevel(previewClass.spellcasting, level).map((slots, i) => (
                          <div key={i} className={`rounded p-0.5 text-center text-[0.55rem] ${slots > 0 ? 'bg-purple-900 text-purple-200' : 'bg-[#111] text-[#333]'}`}>
                            <div className="font-bold">{slots > 0 ? slots : '—'}</div>
                            <div>L{i + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[0.7rem] text-purple-300">
                      Pact Slots: {WARLOCK_PACT_SLOTS[level - 1]} × {['', '1st', '2nd', '3rd', '4th', '5th'][WARLOCK_PACT_LEVEL[level - 1]]}-level
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="mb-2 field-label">Class Features</div>
                <div className="flex flex-col gap-2">
                  {baseFeatures.map((feature, i) => {
                    const unlocked = feature.level <= level;
                    return (
                      <div
                        key={`${feature.level}-${feature.name}-${i}`}
                        className={`border-l-2 pl-3 ${unlocked ? 'border-[#b8962e]' : 'border-[#4a4020]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[#b8962e] text-[#f0d080]' : 'border-[#4a4020] text-[#7a6020]'}`}>
                            Level {feature.level}
                          </span>
                          <span className={`text-base font-bold ${unlocked ? 'text-[#f0d080]' : 'text-[#8f7635]'}`}>{feature.name}</span>
                        </div>
                        {renderFeatureDescription(feature, unlocked)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {getAvailableAsiPoints(state) > 0 && (
                <div>
                  <div className="mb-1 field-label">Ability Score Improvement Choices</div>
                  <div className="mb-2 text-sm leading-6 text-[#9a8040]">
                    Spend your earned ASI points here. Allocated {getAllocatedAsiPoints(state)}/{getAvailableAsiPoints(state)}.
                  </div>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                    {ABILITY_KEYS.map(key => {
                      const value = state.classAbilityBonuses[key] ?? 0;
                      const scoreCap = getAsiCap();
                      const displayedMax = getDisplayedAbilityMax(state, key);
                      const racialBonus = getRacialBonus(state)[key] ?? 0;
                      const primalChampionBonus =
                        state.className === 'Barbarian' && state.level >= 20 && (key === 'str' || key === 'con') ? 4 : 0;
                      const asiCurrent = Math.min(
                        20,
                        (state.baseScores[key] ?? 8) + racialBonus + (state.classAbilityBonuses[key] ?? 0)
                      );
                      const finalCurrent = Math.min(displayedMax, asiCurrent + primalChampionBonus);
                      return (
                        <div key={key} className="rounded border border-[#5a4a1b] bg-[#0f0f0f] p-3">
                          <div className="text-xs font-bold uppercase tracking-wide text-[#b8962e]">{ABILITY_NAMES[key]}</div>
                          <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[#7a6020]">
                            ASI Current {asiCurrent} · ASI Max {scoreCap}
                            {primalChampionBonus > 0 ? ` · Final ${finalCurrent}/${displayedMax}` : ''}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <button onClick={() => updateAsi(key, -1)} className="rounded border border-[#5a4a1b] px-2 py-1 text-sm text-[#b8962e]">−</button>
                            <div className="text-base font-bold text-[#f0d080]">{modString(value)}</div>
                            <button onClick={() => updateAsi(key, 1)} className="rounded border border-[#5a4a1b] px-2 py-1 text-sm text-[#b8962e]">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {previewClass.name === 'Barbarian' && level >= 3 && (
                <div className="section-box border-[#5a4a1b] bg-[#0f0f0f]">
                  <div className="section-title">Choose Primal Path</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {BARBARIAN_PRIMAL_PATHS.map(path => {
                      const selected = state.barbarianPath === path.name;
                      return (
                        <button
                          key={path.name}
                          onClick={() =>
                            onChange({
                              barbarianPath: path.name,
                              barbarianTotemSpirit: path.name === 'Path of the Totem Warrior' ? state.barbarianTotemSpirit : '',
                              barbarianAspectSpirit: path.name === 'Path of the Totem Warrior' ? state.barbarianAspectSpirit : '',
                              barbarianAttunementSpirit: path.name === 'Path of the Totem Warrior' ? state.barbarianAttunementSpirit : '',
                            })
                          }
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200]'
                              : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#f0d080]">{path.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[#9a8040]">{path.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedPrimalPath && (
                    <div className="mt-4">
                      <div className="section-title">Primal Path Features</div>
                      <div className="flex flex-col gap-2">
                        {primalPathDisplayFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          const inlineSpiritChoice =
                            selectedPrimalPath.name === 'Path of the Totem Warrior'
                              ? feature.name === 'Totem Spirit' || feature.name.startsWith('Totem Spirit (')
                                ? renderSpiritChoiceInline('totem')
                                : feature.name === 'Aspect of the Beast (Choose a spirit first)' || feature.name.startsWith('Aspect of the Beast (')
                                ? renderSpiritChoiceInline('aspect')
                                : feature.name === 'Totemic Attunement (Choose a spirit first)' || feature.name.startsWith('Totemic Attunement (')
                                ? renderSpiritChoiceInline('attunement')
                                : null
                              : null;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-${i}`}
                              className={`border-l-2 pl-3 ${unlocked ? 'border-[#b8962e]' : 'border-[#4a4020]'}`}
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[#b8962e] text-[#f0d080]' : 'border-[#4a4020] text-[#7a6020]'}`}>
                                  Level {feature.level}
                                </span>
                                <span className={`text-base font-bold ${unlocked ? 'text-[#f0d080]' : 'text-[#8f7635]'}`}>{feature.name}</span>
                                {inlineSpiritChoice}
                              </div>
                              {renderFeatureDescription(feature, unlocked)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(classEffects.resistances.length > 0 || classEffects.advantages.length > 0) && (
                <div className="section-box border-[#5a4a1b] bg-[#0f0f0f]">
                  <div className="section-title">Class Resistances & Advantage Rolls</div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <div className="mb-2 field-label">Resistances</div>
                      <div className="flex flex-col gap-2">
                        {classEffects.resistances.length > 0 ? (
                          classEffects.resistances.map((effect, index) => (
                            <div key={`resistance-${index}`} className="rounded border border-[#5a4a1b] bg-[#111] px-3 py-2 text-sm text-[#c8a84b]">
                              <span>{effect.label}</span>
                              {effect.condition && (
                                <span className="ml-2 rounded border border-[#7a6020] px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-[#b8962e]">
                                  {effect.condition}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-[#6f5b2b]">No class resistances yet.</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 field-label">Advantage Rolls</div>
                      <div className="flex flex-col gap-2">
                        {classEffects.advantages.length > 0 ? (
                          classEffects.advantages.map((effect, index) => (
                            <div key={`advantage-${index}`} className="rounded border border-[#5a4a1b] bg-[#111] px-3 py-2 text-sm text-[#c8a84b]">
                              <span>{effect.label}</span>
                              {effect.condition && (
                                <span className="ml-2 rounded border border-[#7a6020] px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-[#b8962e]">
                                  {effect.condition}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-[#6f5b2b]">No class advantage effects yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1 field-label">Class Equipment</div>
                <div className="mb-3 text-sm leading-6 text-[#c8a84b]">
                  {displayedEquipment.length ? displayedEquipment.join(' · ') : 'No starter equipment listed.'}
                </div>

                {classEquipmentChoices.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {classEquipmentChoices.map(choice => {
                      const selectedOption = state.classEquipmentSelections[choice.key] ?? choice.options[0];
                      const expandedOptions =
                        choice.key === 'barbarian-weapon-primary' && selectedOption === 'Any martial melee weapon'
                          ? MARTIAL_MELEE_WEAPONS
                          : choice.key === 'barbarian-weapon-secondary' && selectedOption === 'Any simple weapon'
                          ? SIMPLE_WEAPONS
                          : [];

                      return (
                        <div key={choice.key}>
                          <div className="mb-1 field-label">{choice.label}</div>
                          <div className="flex flex-wrap gap-2">
                            {choice.options.map(option => {
                              const selected = selectedOption === option;
                              return (
                                <button
                                  key={option}
                                  onClick={() => onChange({
                                    classEquipmentSelections: {
                                      ...state.classEquipmentSelections,
                                      [choice.key]: option,
                                      ...(choice.key === 'barbarian-weapon-primary' && option !== 'Any martial melee weapon'
                                        ? { 'barbarian-weapon-primary-specific': '' }
                                        : {}),
                                      ...(choice.key === 'barbarian-weapon-secondary' && option !== 'Any simple weapon'
                                        ? { 'barbarian-weapon-secondary-specific': '' }
                                        : {}),
                                    },
                                  })}
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selected
                                      ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                                      : 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>

                          {expandedOptions.length > 0 && (
                            <div className="mt-3 rounded border border-[#5a4a1b] bg-[#121212] p-3">
                              <div className="mb-2 border-b border-[#5a4a1b] pb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#b8962e]">
                                Choose a specific item
                              </div>
                              <div className="flex flex-wrap gap-2">
                              {expandedOptions.map(option => {
                                const specificKey = choice.key === 'barbarian-weapon-primary'
                                  ? 'barbarian-weapon-primary-specific'
                                  : 'barbarian-weapon-secondary-specific';
                                const selected = state.classEquipmentSelections[specificKey] === option;
                                return (
                                  <button
                                    key={option}
                                    onClick={() => onChange({
                                      classEquipmentSelections: {
                                        ...state.classEquipmentSelections,
                                        [specificKey]: option,
                                      },
                                    })}
                                    className={`rounded border px-3 py-1 text-xs transition-all ${
                                      selected
                                        ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                                        : 'border-[#5a4a1b] text-[#b8962e] hover:bg-[#1a1000]'
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
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="section-box flex h-48 items-center justify-center text-sm italic text-[#3a2a00]">
              Select a class to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
