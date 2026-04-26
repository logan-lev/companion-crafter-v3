import { useState } from 'react';
import type { WizardState } from '../../types/wizard';
import {
  BARD_COLLEGES,
  BARBARIAN_PRIMAL_PATHS,
  BARBARIAN_RAGE_DAMAGE_BY_LEVEL,
  BARBARIAN_RAGES_BY_LEVEL,
  BARBARIAN_TOTEM_SPIRITS,
  CLASS_DATA,
  CLERIC_DOMAINS,
  PALADIN_OATHS,
  type ClassFeature,
  getCantripsKnown,
  getClassFeatureTimeline,
  getSubclassAutoPreparedSpells,
  getSlotsAtLevel,
  getSpellsKnown,
} from '../../data/srd-classes';
import {
  CLASS_EQUIPMENT_CHOICES,
  CLASS_FIXED_EQUIPMENT,
  CLASS_STARTER_EQUIPMENT,
  EQUIPMENT_PACK_CONTENTS,
  EQUIPMENT_DYNAMIC_OPTION_POOLS,
  MUSICAL_INSTRUMENTS,
} from '../../data/srd-class-equipment';
import { ABILITY_NAMES, profBonusFromLevel } from '../../data/srd';
import { SPELL_LIST } from '../../data/srd-spells';
import type { AbilityKey } from '../../types/character';
import { getAllSkillProficiencies, getFinalAbilityScores, getRacialBonus } from '../../utils/character-builder';

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

type MagicalSecretsSource =
  | 'All'
  | 'Bard'
  | 'Cleric'
  | 'Druid'
  | 'Paladin'
  | 'Ranger'
  | 'Sorcerer'
  | 'Warlock'
  | 'Wizard';

const SPELLCASTING_TYPE_DETAILS: Record<'full' | 'half' | 'third' | 'pact', string> = {
  full: 'Full caster: fastest spell slot progression, reaching 9th-level spells.',
  half: 'Half caster: slower spell progression, reaching up to 5th-level spells.',
  third: 'Third caster: limited spell progression, reaching up to 4th-level spells.',
  pact: 'Pact magic: very few slots that recharge on a short rest and scale to a fixed slot level.',
};

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

function getDynamicEquipmentSelections(choiceKey: string, option: string) {
  const tokens = option.split(',').map(token => token.trim()).filter(Boolean);
  const totals = new Map<string, number>();
  tokens.forEach(token => {
    if (EQUIPMENT_DYNAMIC_OPTION_POOLS[token]) {
      totals.set(token, (totals.get(token) ?? 0) + 1);
    }
  });

  const current = new Map<string, number>();
  return tokens.flatMap(token => {
    const pool = EQUIPMENT_DYNAMIC_OPTION_POOLS[token];
    if (!pool) return [];

    const index = current.get(token) ?? 0;
    current.set(token, index + 1);
    const total = totals.get(token) ?? 1;
    const labelBase = token.replace(/^Any other /, '').replace(/^Any /, '');

    return [{
      token,
      pool,
      specificKey: `${choiceKey}-specific-${index}`,
      label: total > 1 ? `${labelBase} ${index + 1}` : labelBase,
    }];
  });
}

function resolveEquipmentChoiceDisplay(
  state: WizardState,
  choiceKey: string,
  option: string
): string[] {
  const dynamicEntries = getDynamicEquipmentSelections(choiceKey, option);
  const dynamicUsage = new Map<string, number>();

  return option
    .split(',')
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => {
      if (!EQUIPMENT_DYNAMIC_OPTION_POOLS[token]) return token;
      const index = dynamicUsage.get(token) ?? 0;
      dynamicUsage.set(token, index + 1);
      const match = dynamicEntries.find(entry => entry.token === token && entry.specificKey === `${choiceKey}-specific-${index}`);
      return match ? state.classEquipmentSelections[match.specificKey] ?? `${match.label} (choose one)` : token;
    });
}

function formatEquipmentOptionLabel(option: string): string {
  const parts = option.split(',').map(token => token.trim()).filter(Boolean);
  if (parts.length <= 1) return option;

  if (parts.length === 2) {
    return `${parts[0]} + ${parts[1]}`;
  }

  return `${parts[0]} + ${parts.length - 1} more`;
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

function groupSpellsByLevel(spells: typeof SPELL_LIST): Array<{ level: number; spells: typeof SPELL_LIST }> {
  const map = new Map<number, typeof SPELL_LIST>();

  spells.forEach(spell => {
    const existing = map.get(spell.level) ?? [];
    existing.push(spell);
    map.set(spell.level, existing);
  });

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, list]) => ({
      level,
      spells: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

function getFeatureSpellDetails(feature: ClassFeature): SpellDetail[] {
  return CLASS_FEATURE_SPELLS[feature.name] ?? [];
}

function isBardCollegeFeature(feature: ClassFeature): boolean {
  return BARD_COLLEGES.some(college =>
    college.features.some(collegeFeature => collegeFeature.level === feature.level && collegeFeature.name === feature.name)
  );
}

export default function ClassStep({ state, onChange }: Props) {
  const [magicalSecretsSource, setMagicalSecretsSource] = useState<MagicalSecretsSource>('All');
  const [collapsedSpellGroups, setCollapsedSpellGroups] = useState<Record<string, boolean>>({});
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
      bardCollege: '',
      clericDomain: '',
      paladinOath: '',
      bardInstrumentChoices: [],
      bardExpertiseChoices: [],
      bardLoreSkillChoices: [],
      bardMagicalSecretChoices: [],
      bardAdditionalMagicalSecretChoices: [],
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

    const nextClass = CLASS_DATA.find(item => item.name === state.className);
    const nextSpellcasting = nextClass?.spellcasting;
    const nextCantripLimit = nextSpellcasting ? getCantripsKnown(nextSpellcasting, nextLevel) : 0;
    const nextBaseSpellsKnown = nextSpellcasting?.spellsKnown ? getSpellsKnown(nextSpellcasting, nextLevel) : 0;
    const nextMagicalSecrets = state.className === 'Bard'
      ? getClassFeatureTimeline('Bard', { bardCollege: state.bardCollege })
          .filter(feature => feature.name === 'Magical Secrets' && feature.level <= nextLevel).length * 2
      : 0;
    const nextAdditionalMagicalSecrets =
      state.className === 'Bard' && state.bardCollege === 'College of Lore' && nextLevel >= 6 ? 2 : 0;
    const nextMagicalSecretChoices = state.bardMagicalSecretChoices.slice(0, nextMagicalSecrets);
    const nextAdditionalMagicalSecretChoices =
      state.bardAdditionalMagicalSecretChoices.slice(0, nextAdditionalMagicalSecrets);
    const nextNormalSpellLimit = Math.max(0, nextBaseSpellsKnown - nextMagicalSecrets);

    onChange({
      level: nextLevel,
      classAbilityBonuses: nextBonuses,
      selectedCantrips: state.selectedCantrips.slice(0, nextCantripLimit),
      selectedSpells: state.selectedSpells.slice(0, nextNormalSpellLimit),
      bardExpertiseChoices:
        state.className === 'Bard'
          ? state.bardExpertiseChoices.slice(
              0,
              getClassFeatureTimeline('Bard', { bardCollege: state.bardCollege })
                .filter(feature => feature.name === 'Expertise' && feature.level <= nextLevel).length * 2
            )
          : [],
      bardLoreSkillChoices:
        state.className === 'Bard' && state.bardCollege === 'College of Lore' && nextLevel >= 3
          ? state.bardLoreSkillChoices.slice(0, 3)
          : [],
      bardMagicalSecretChoices: nextMagicalSecretChoices,
      bardAdditionalMagicalSecretChoices: nextAdditionalMagicalSecretChoices,
      ...(nextLevel < 3
        ? {
            barbarianPath: '',
            barbarianTotemSpirit: '',
            barbarianAspectSpirit: '',
            barbarianAttunementSpirit: '',
            bardCollege: '',
            bardLoreSkillChoices: [],
            paladinOath: '',
          }
        : nextLevel < 1
        ? { clericDomain: '' }
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

  const toggleBardInstrument = (instrument: string) => {
    const current = state.bardInstrumentChoices;
    if (current.includes(instrument)) {
      onChange({ bardInstrumentChoices: current.filter(item => item !== instrument) });
    } else if (current.length < 3) {
      onChange({ bardInstrumentChoices: [...current, instrument] });
    }
  };

  const toggleBardExpertise = (skill: string) => {
    const current = state.bardExpertiseChoices;
    if (current.includes(skill)) {
      onChange({ bardExpertiseChoices: current.filter(item => item !== skill) });
    } else if (current.length < bardExpertiseAllowed) {
      onChange({ bardExpertiseChoices: [...current, skill] });
    }
  };

  const toggleBardLoreSkill = (skill: string) => {
    const current = state.bardLoreSkillChoices;
    if (current.includes(skill)) {
      onChange({ bardLoreSkillChoices: current.filter(item => item !== skill) });
    } else if (current.length < 3) {
      onChange({ bardLoreSkillChoices: [...current, skill] });
    }
  };

  const clearCantripsInGroup = (spellNames: string[]) => {
    onChange({ selectedCantrips: state.selectedCantrips.filter(name => !spellNames.includes(name)) });
  };

  const clearClassSpellsInGroup = (spellNames: string[]) => {
    onChange({ selectedSpells: state.selectedSpells.filter(name => !spellNames.includes(name)) });
  };

  const clearMagicalSecretsInGroup = (spellNames: string[]) => {
    onChange({
      bardMagicalSecretChoices: state.bardMagicalSecretChoices.filter(name => !spellNames.includes(name)),
      bardAdditionalMagicalSecretChoices: state.bardAdditionalMagicalSecretChoices.filter(name => !spellNames.includes(name)),
    });
  };

  const toggleClassCantrip = (name: string) => {
    if (!spellcasting) return;
    const current = state.selectedCantrips;
    if (current.includes(name)) {
      onChange({ selectedCantrips: current.filter(item => item !== name) });
    } else if (current.length < cantripAllowance) {
      onChange({ selectedCantrips: [...current, name] });
    }
  };

  const toggleClassSpell = (name: string) => {
    if (!spellcasting) return;
    const current = state.selectedSpells;
    if (current.includes(name)) {
      onChange({ selectedSpells: current.filter(item => item !== name) });
    } else if (!state.bardMagicalSecretChoices.includes(name) && current.length < spellAllowance) {
      onChange({ selectedSpells: [...current, name] });
    }
  };

  const toggleMagicalSecret = (name: string) => {
    const baseCurrent = state.bardMagicalSecretChoices;
    const additionalCurrent = state.bardAdditionalMagicalSecretChoices;
    if (baseCurrent.includes(name)) {
      onChange({ bardMagicalSecretChoices: baseCurrent.filter(item => item !== name) });
    } else if (additionalCurrent.includes(name)) {
      onChange({ bardAdditionalMagicalSecretChoices: additionalCurrent.filter(item => item !== name) });
    } else if (!state.selectedSpells.includes(name)) {
      if (baseCurrent.length < bardMagicalSecretsAllowed) {
        onChange({ bardMagicalSecretChoices: [...baseCurrent, name] });
      } else if (
        additionalCurrent.length < bardAdditionalMagicalSecretsAllowed &&
        state.selectedSpells.length + baseCurrent.length + additionalCurrent.length < totalSpellAllowance
      ) {
        onChange({ bardAdditionalMagicalSecretChoices: [...additionalCurrent, name] });
      }
    }
  };

  const toggleSpellGroupCollapsed = (groupKey: string) => {
    setCollapsedSpellGroups(current => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const toggleAllSpellGroups = (groupPrefix: string, spells: typeof SPELL_LIST) => {
    const groups = groupSpellsByLevel(spells);
    const allCollapsed = groups.every(group => collapsedSpellGroups[`${groupPrefix}-${group.level}`] ?? false);

    setCollapsedSpellGroups(current => {
      const next = { ...current };
      groups.forEach(group => {
        next[`${groupPrefix}-${group.level}`] = !allCollapsed;
      });
      return next;
    });
  };

  const features = previewClass
    ? getClassFeatureTimeline(previewClass.name, {
        barbarianPath: state.barbarianPath,
        barbarianTotemSpirit: state.barbarianTotemSpirit,
        barbarianAspectSpirit: state.barbarianAspectSpirit,
        barbarianAttunementSpirit: state.barbarianAttunementSpirit,
        bardCollege: state.bardCollege,
        clericDomain: state.clericDomain,
        paladinOath: state.paladinOath,
      })
    : [];
  const baseFeatures = features.filter(feature => !isBarbarianPathFeature(feature) && !isBardCollegeFeature(feature));
  const unlockedFeatures = features.filter(feature => feature.level <= level);
  const selectedPrimalPath = BARBARIAN_PRIMAL_PATHS.find(path => path.name === state.barbarianPath);
  const selectedBardCollege = BARD_COLLEGES.find(college => college.name === state.bardCollege);
  const selectedClericDomain = CLERIC_DOMAINS.find(domain => domain.name === state.clericDomain);
  const selectedPaladinOath = PALADIN_OATHS.find(oath => oath.name === state.paladinOath);
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
  const bardCollegeFeatures = selectedBardCollege?.features ?? [];
  const clericDomainFeatures = selectedClericDomain?.features ?? [];
  const paladinOathFeatures = selectedPaladinOath?.features ?? [];

  const classEquipmentChoices = previewClass ? (CLASS_EQUIPMENT_CHOICES[previewClass.name] ?? []) : [];
  const displayedEquipment = previewClass
    ? (() => {
        const fixedItems = CLASS_FIXED_EQUIPMENT[previewClass.name] ?? [];
        if (!classEquipmentChoices.length && !fixedItems.length) {
          return splitEquipmentList(CLASS_STARTER_EQUIPMENT[previewClass.name] ?? '');
        }

        return [
          ...classEquipmentChoices.flatMap(choice => {
            const selectedOption = state.classEquipmentSelections[choice.key];
            return selectedOption ? resolveEquipmentChoiceDisplay(state, choice.key, selectedOption) : [];
          }),
          ...fixedItems,
        ];
      })()
    : [];

  const allCurrentSkillProficiencies = getAllSkillProficiencies(state);
  const bardExpertiseAllowed = state.className === 'Bard'
    ? unlockedFeatures.filter(feature => feature.name === 'Expertise').length * 2
    : 0;
  const bardMagicalSecretsAllowed = state.className === 'Bard'
    ? unlockedFeatures.filter(feature => feature.name === 'Magical Secrets').length * 2
    : 0;
  const bardAdditionalMagicalSecretsAllowed =
    state.className === 'Bard' && state.bardCollege === 'College of Lore' && level >= 6 ? 2 : 0;
  const finalScores = getFinalAbilityScores(state);
  const spellcasting = previewClass?.spellcasting;
  const spellcastingAbilityMod = spellcasting ? Math.floor(((finalScores[spellcasting.ability] ?? 10) - 10) / 2) : 0;
  const spellSaveDC = spellcasting ? 8 + profBonus + spellcastingAbilityMod : 0;
  const spellAttackBonus = spellcastingAbilityMod + profBonus;
  const spellSlots = spellcasting ? getSlotsAtLevel(spellcasting, level) : [];
  const maxSpellLevel = spellSlots.length ? spellSlots.reduce((highest, count, index) => (count > 0 ? index + 1 : highest), 0) : 0;
  const cantripAllowance = spellcasting ? getCantripsKnown(spellcasting, level) : 0;
  const baseSpellAllowance = spellcasting ? (spellcasting.prepares
    ? Math.max(1, spellcastingAbilityMod + (spellcasting.type === 'half' ? Math.max(1, Math.ceil(level / 2)) : level))
    : getSpellsKnown(spellcasting, level)) : 0;
  const totalSpellAllowance =
    previewClass?.name === 'Bard' ? baseSpellAllowance + bardAdditionalMagicalSecretsAllowed : baseSpellAllowance;
  const reservedMagicalSecretsSlots = previewClass?.name === 'Bard' ? bardMagicalSecretsAllowed : 0;
  const spellAllowance = Math.max(0, baseSpellAllowance - reservedMagicalSecretsSlots);
  const classSpellOptions = previewClass ? SPELL_LIST.filter(spell => spell.classes.includes(previewClass.name)) : [];
  const subclassAutoPreparedSpells =
    previewClass && (previewClass.name === 'Cleric' || previewClass.name === 'Paladin')
      ? getSubclassAutoPreparedSpells(previewClass.name, level, {
          clericDomain: state.clericDomain,
          paladinOath: state.paladinOath,
        })
      : [];
  const subclassAutoPreparedSpellDetails = subclassAutoPreparedSpells
    .map(name => SPELL_LIST.find(spell => spell.name === name))
    .filter((spell): spell is (typeof SPELL_LIST)[number] => Boolean(spell));
  const classCantripOptions = classSpellOptions.filter(spell => spell.level === 0);
  const classLevelSpellOptions = classSpellOptions.filter(spell => spell.level > 0 && spell.level <= Math.max(1, maxSpellLevel));
  const bardMagicalSecretOptions = previewClass?.name === 'Bard'
    ? SPELL_LIST.filter(spell => spell.level === 0 || spell.level <= Math.max(1, maxSpellLevel))
    : [];
  const bardMagicalSecretSourceOptions: MagicalSecretsSource[] = [
    'All',
    'Bard',
    'Cleric',
    'Druid',
    'Paladin',
    'Ranger',
    'Sorcerer',
    'Warlock',
    'Wizard',
  ];
  const filteredMagicalSecretOptions = bardMagicalSecretOptions.filter(
    spell => magicalSecretsSource === 'All' || spell.classes.includes(magicalSecretsSource)
  );
  const bardSecretSelectedNames = [...state.bardMagicalSecretChoices, ...state.bardAdditionalMagicalSecretChoices];

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

  const renderGroupedSpellPicker = (
    groupPrefix: string,
    spells: typeof SPELL_LIST,
    selected: string[],
    onToggle: (name: string) => void,
    current: number,
    max: number,
    emptyText: string,
    selectedMeta?: Record<string, string>,
    onClearGroup?: (spellNames: string[]) => void
  ) => {
    const grouped = groupSpellsByLevel(spells);

    return (
      <div>
        <div className="mb-2 text-[0.72rem] uppercase tracking-[0.18em] text-[#b8962e]">
          Selected {current}/{max}
        </div>
        {grouped.length ? (
          <div className="space-y-4">
            {grouped.map(group => (
              <div key={`group-${group.level}`}>
                {(() => {
                  const groupKey = `${groupPrefix}-${group.level}`;
                  const collapsed = collapsedSpellGroups[groupKey] ?? false;
                  const selectedSpellsInGroup = group.spells.filter(spell => selected.includes(spell.name));
                  const selectedInGroup = selectedSpellsInGroup.length;
                  return (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-2 rounded border border-[#4b2c69] bg-[#170a25] px-3 py-2">
                        <button
                          onClick={() => toggleSpellGroupCollapsed(groupKey)}
                          className="text-left"
                        >
                          <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#d6b8ff]">
                            {group.level === 0 ? 'Cantrips' : `Level ${group.level} Spells`}
                          </div>
                          <div className="mt-1 text-[0.66rem] uppercase tracking-wide text-[#8f73ae]">
                            {selectedInGroup} selected · {collapsed ? 'Collapsed' : 'Expanded'}
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          {selectedInGroup > 0 && (
                            <button
                              onClick={() => {
                                onClearGroup?.(group.spells.map(spell => spell.name));
                              }}
                              className="rounded border border-[#6b4a92] px-2 py-1 text-[0.68rem] text-purple-200 transition-all hover:bg-[#24113b]"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => toggleSpellGroupCollapsed(groupKey)}
                            className="rounded border border-[#6b4a92] px-2 py-1 text-[0.68rem] text-purple-200 transition-all hover:bg-[#24113b]"
                          >
                            {collapsed ? 'Open' : 'Close'}
                          </button>
                        </div>
                      </div>
                      {!collapsed && (
                        <div className="flex flex-wrap gap-2">
                          {group.spells.map(spell => {
                            const isSelected = selected.includes(spell.name);
                            return (
                              <button
                                key={spell.name}
                                onClick={() => onToggle(spell.name)}
                                className={`rounded border px-3 py-2 text-left text-xs transition-all ${
                                  isSelected
                                    ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                                    : 'border-[#5a4a1b] text-[#b8962e] hover:bg-[#1a1000]'
                                }`}
                              >
                                <div className="font-bold">{spell.name}</div>
                                <div className="mt-1 text-[0.62rem] uppercase tracking-wide text-[#7a6020]">
                                  {spell.school}{selectedMeta?.[spell.name] ? ` · ${selectedMeta[spell.name]}` : ''}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {selectedInGroup > 0 && (
                        <div className="mt-3 grid gap-2 lg:grid-cols-2">
                          {selectedSpellsInGroup.map(spell => (
                            <div key={`group-detail-${groupPrefix}-${spell.name}`} className="rounded border border-[#6b5a24] bg-[#120d02] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold text-[#f0d080]">{spell.name}</div>
                                <div className="text-[0.68rem] uppercase tracking-wide text-[#b8962e]">
                                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                                </div>
                              </div>
                              <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[#7a6020]">
                                {spell.school} · {spell.castingTime} · {spell.range}
                                {selectedMeta?.[spell.name] ? ` · ${selectedMeta[spell.name]}` : ''}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-[#a38846]">{spell.description}</p>
                              {spell.upcast && <p className="mt-2 text-xs leading-5 text-purple-300">{spell.upcast}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm italic text-[#6f5b2b]">{emptyText}</div>
        )}
      </div>
    );
  };

  const renderSelectedSpellDetails = (selectedNames: string[], selectedMeta?: Record<string, string>) => {
    const selectedDetails = selectedNames
      .map(name => SPELL_LIST.find(spell => spell.name === name))
      .filter((spell): spell is (typeof SPELL_LIST)[number] => Boolean(spell));

    if (!selectedDetails.length) return null;

    const grouped = groupSpellsByLevel(selectedDetails);

    return (
      <div className="mt-3 space-y-4">
        {grouped.map(group => (
          <div key={`detail-group-${group.level}`}>
            <div className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#7a6020]">
              {group.level === 0 ? 'Cantrips' : `Level ${group.level} Spells`}
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {group.spells.map(spell => (
                <div key={`detail-${spell.name}`} className="rounded border border-[#6b5a24] bg-[#120d02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-[#f0d080]">{spell.name}</div>
                    <div className="text-[0.68rem] uppercase tracking-wide text-[#b8962e]">
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                    </div>
                  </div>
                  <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[#7a6020]">
                    {spell.school} · {spell.castingTime} · {spell.range}
                    {selectedMeta?.[spell.name] ? ` · ${selectedMeta[spell.name]}` : ''}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#a38846]">{spell.description}</p>
                  {spell.upcast && <p className="mt-2 text-xs leading-5 text-purple-300">{spell.upcast}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const packItemsInDisplay = displayedEquipment.filter(item => item.includes('Pack'));
  const loreSkillPool = previewClass?.skillOptions.filter(skill => !state.classSkillChoices.includes(skill)) ?? [];

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

              {spellcasting && (
                <div className="rounded border border-purple-900 bg-[#0b0216] p-4">
                  <div className="section-title text-purple-200">Spellcasting</div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                    <div className="space-y-4">
                      <div className="rounded border border-purple-950 bg-[#11051f] p-3">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                          {spellcasting.type === 'full'
                            ? 'Full Caster'
                            : spellcasting.type === 'half'
                            ? 'Half Caster'
                            : spellcasting.type === 'third'
                            ? 'Third Caster'
                            : 'Pact Magic'}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#b8a0d0]">
                          {SPELLCASTING_TYPE_DETAILS[spellcasting.type]}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="stat-box">
                            <div className="text-base font-bold">{spellcasting.ability.toUpperCase()}</div>
                            <div className="field-label">Spellcasting Ability</div>
                          </div>
                          <div className="stat-box">
                            <div className="text-base font-bold">{spellcasting.prepares ? 'Prepared' : 'Known'}</div>
                            <div className="field-label">Spell Access</div>
                          </div>
                          <div className="stat-box">
                            <div className="text-base font-bold">{spellSaveDC}</div>
                            <div className="field-label">Spell Save DC</div>
                          </div>
                          <div className="stat-box">
                            <div className="text-base font-bold">{modString(spellAttackBonus)}</div>
                            <div className="field-label">Spell Attack Modifier</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded border border-purple-950 bg-[#11051f] p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                            Choose Cantrips
                          </div>
                          <button
                            onClick={() => toggleAllSpellGroups('class-cantrip', classCantripOptions)}
                            className="rounded border border-[#6b4a92] px-2 py-1 text-[0.68rem] text-purple-200 transition-all hover:bg-[#24113b]"
                          >
                            {groupSpellsByLevel(classCantripOptions).every(group => collapsedSpellGroups[`class-cantrip-${group.level}`] ?? false)
                              ? 'Open All'
                              : 'Close All'}
                          </button>
                        </div>
                        {renderGroupedSpellPicker(
                          'class-cantrip',
                          classCantripOptions,
                          state.selectedCantrips,
                          toggleClassCantrip,
                          state.selectedCantrips.length,
                          cantripAllowance,
                          'No cantrips available for this class yet.',
                          undefined,
                          clearCantripsInGroup
                        )}
                      </div>

                      <div className="rounded border border-purple-950 bg-[#11051f] p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                            Choose {spellcasting.prepares ? 'Prepared' : 'Known'} Spells
                          </div>
                          <button
                            onClick={() => toggleAllSpellGroups('class-spell', classLevelSpellOptions)}
                            className="rounded border border-[#6b4a92] px-2 py-1 text-[0.68rem] text-purple-200 transition-all hover:bg-[#24113b]"
                          >
                            {groupSpellsByLevel(classLevelSpellOptions).every(group => collapsedSpellGroups[`class-spell-${group.level}`] ?? false)
                              ? 'Open All'
                              : 'Close All'}
                          </button>
                        </div>
                        <div className="mb-3 text-sm leading-6 text-[#b8a0d0]">
                          {previewClass.name === 'Bard' ? 'Bard spells selected' : 'Spells selected'} {state.selectedSpells.length}/{spellAllowance}
                          {previewClass.name === 'Bard' && bardMagicalSecretsAllowed > 0
                            ? ` · Magical Secrets ${state.bardMagicalSecretChoices.length}/${bardMagicalSecretsAllowed}${bardAdditionalMagicalSecretsAllowed > 0 ? ` · Additional ${state.bardAdditionalMagicalSecretChoices.length}/${bardAdditionalMagicalSecretsAllowed}` : ''} · Total ${state.selectedSpells.length + bardSecretSelectedNames.length}/${totalSpellAllowance}`
                            : ''}
                        </div>
                        {renderGroupedSpellPicker(
                          'class-spell',
                          classLevelSpellOptions,
                          state.selectedSpells,
                          toggleClassSpell,
                          state.selectedSpells.length,
                          spellAllowance,
                          'No leveled spells available at this level yet.',
                          undefined,
                          clearClassSpellsInGroup
                        )}
                      </div>

                      {subclassAutoPreparedSpellDetails.length > 0 && (
                        <div className="rounded border border-purple-950 bg-[#11051f] p-3">
                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                            {previewClass?.name === 'Cleric' ? 'Domain Spells' : 'Oath Spells'}
                          </div>
                          <div className="mb-3 text-sm leading-6 text-[#b8a0d0]">
                            These spells are granted by your subclass and are always prepared. They do not count against the number of spells you choose manually.
                          </div>
                          {renderSelectedSpellDetails(subclassAutoPreparedSpellDetails.map(spell => spell.name))}
                        </div>
                      )}

                      {previewClass.name === 'Bard' && (bardMagicalSecretsAllowed > 0 || bardAdditionalMagicalSecretsAllowed > 0) && (
                        <div className="rounded border border-purple-950 bg-[#11051f] p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                              Magical Secrets
                            </div>
                            <button
                              onClick={() => toggleAllSpellGroups('magical-secrets', filteredMagicalSecretOptions)}
                              className="rounded border border-[#6b4a92] px-2 py-1 text-[0.68rem] text-purple-200 transition-all hover:bg-[#24113b]"
                            >
                              {groupSpellsByLevel(filteredMagicalSecretOptions).every(group => collapsedSpellGroups[`magical-secrets-${group.level}`] ?? false)
                                ? 'Open All'
                                : 'Close All'}
                            </button>
                          </div>
                          <div className="mb-3 text-sm leading-6 text-[#b8a0d0]">
                            Choose {bardMagicalSecretsAllowed} Magical Secrets spells from any class.
                            {bardAdditionalMagicalSecretsAllowed > 0 && ` You also gain ${bardAdditionalMagicalSecretsAllowed} Additional Magical Secrets picks that do not count against your bard spells known.`}
                          </div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            {bardMagicalSecretSourceOptions.map(source => {
                              const selected = magicalSecretsSource === source;
                              return (
                                <button
                                  key={`secret-source-${source}`}
                                  onClick={() => setMagicalSecretsSource(source)}
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selected
                                      ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                                      : 'border-[#5a4a1b] text-[#b8962e] hover:bg-[#1a1000]'
                                  }`}
                                >
                                  {source}
                                </button>
                              );
                            })}
                          </div>
                          {renderGroupedSpellPicker(
                            'magical-secrets',
                            filteredMagicalSecretOptions,
                            bardSecretSelectedNames,
                            toggleMagicalSecret,
                            bardSecretSelectedNames.length,
                            bardMagicalSecretsAllowed + bardAdditionalMagicalSecretsAllowed,
                            'No magical secret choices are available from that spell list at this level.',
                            Object.fromEntries([
                              ...state.bardMagicalSecretChoices.map(name => [name, 'Magical Secret'] as const),
                              ...state.bardAdditionalMagicalSecretChoices.map(name => [name, 'Additional'] as const),
                            ]),
                            clearMagicalSecretsInGroup
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded border border-purple-950 bg-[#11051f] p-3">
                      <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                        Spell Slots
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {spellSlots.map((slots, index) => (
                          <div
                            key={`slot-${index}`}
                            className={`rounded border p-2 text-center ${
                              slots > 0 ? 'border-purple-700 bg-purple-950/40 text-purple-200' : 'border-[#241534] bg-[#0d0d0d] text-[#514069]'
                            }`}
                          >
                            <div className="text-sm font-bold">{slots > 0 ? slots : '—'}</div>
                            <div className="text-[0.62rem] uppercase tracking-wide">Level {index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                      const takenByLore = state.bardLoreSkillChoices.includes(skill);
                      const canAdd = state.classSkillChoices.length < previewClass.skillCount;
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          disabled={takenByLore || (!chosen && !canAdd)}
                          className={`rounded border px-2 py-0.5 text-[0.68rem] transition-all ${
                            chosen
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : takenByLore
                              ? 'cursor-not-allowed border-[#2a1f00] bg-[#15100a] text-[#5b4714]'
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

              {previewClass.name === 'Bard' && state.className === 'Bard' && (
                <div>
                  <div className="mb-1 field-label">
                    Choose Musical Instrument Proficiencies ({state.bardInstrumentChoices.length}/3)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MUSICAL_INSTRUMENTS.map(instrument => {
                      const chosen = state.bardInstrumentChoices.includes(instrument);
                      const canAdd = state.bardInstrumentChoices.length < 3;
                      return (
                        <button
                          key={instrument}
                          onClick={() => toggleBardInstrument(instrument)}
                          disabled={!chosen && !canAdd}
                          className={`rounded border px-3 py-1 text-xs transition-all ${
                            chosen
                              ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                              : canAdd
                              ? 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                              : 'cursor-not-allowed border-[#2a1f00] text-[#3a2a00]'
                          }`}
                        >
                          {instrument}
                        </button>
                      );
                    })}
                  </div>
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

              {previewClass.name === 'Bard' && bardExpertiseAllowed > 0 && (
                <div>
                  <div className="mb-1 field-label">
                    Choose Expertise Skills ({state.bardExpertiseChoices.length}/{bardExpertiseAllowed})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allCurrentSkillProficiencies.map(skill => {
                      const selected = state.bardExpertiseChoices.includes(skill);
                      const canAdd = state.bardExpertiseChoices.length < bardExpertiseAllowed;
                      return (
                        <button
                          key={`expertise-${skill}`}
                          onClick={() => toggleBardExpertise(skill)}
                          disabled={!selected && !canAdd}
                          className={`rounded border px-3 py-1 text-xs transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
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

              {previewClass.name === 'Bard' && level >= 3 && (
                <div className="section-box border-[#5a4a1b] bg-[#0f0f0f]">
                  <div className="section-title">Choose Bard College</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {BARD_COLLEGES.map(college => {
                      const selected = state.bardCollege === college.name;
                      return (
                        <button
                          key={college.name}
                          onClick={() =>
                            onChange({
                              bardCollege: college.name,
                              bardLoreSkillChoices: college.name === 'College of Lore' ? state.bardLoreSkillChoices : [],
                              bardAdditionalMagicalSecretChoices: college.name === 'College of Lore' ? state.bardAdditionalMagicalSecretChoices : [],
                            })
                          }
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200]'
                              : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#f0d080]">{college.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[#9a8040]">{college.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedBardCollege && (
                    <div className="mt-4">
                      {selectedBardCollege.name === 'College of Lore' && level >= 3 && (
                        <div className="mb-4">
                          <div className="section-title">College of Lore Bonus Proficiencies</div>
                          <div className="mb-2 text-sm leading-6 text-[#9a8040]">
                            Choose three additional skill proficiencies that you do not already have. ({state.bardLoreSkillChoices.length}/3)
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {loreSkillPool.map(skill => {
                              const selected = state.bardLoreSkillChoices.includes(skill);
                              const canAdd = state.bardLoreSkillChoices.length < 3;
                              return (
                                <button
                                  key={`lore-${skill}`}
                                  onClick={() => toggleBardLoreSkill(skill)}
                                  disabled={!selected && !canAdd}
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selected
                                      ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
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

                      {selectedBardCollege.name === 'College of Valor' && (
                        <div className="mb-4">
                          <div className="section-title">Additional Proficiencies</div>
                          <div className="text-sm leading-6 text-[#c8a84b]">
                            Medium Armor · Shields · Martial Weapons
                          </div>
                        </div>
                      )}

                      <div className="section-title">Bard College Features</div>
                      <div className="flex flex-col gap-2">
                        {bardCollegeFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-college-${i}`}
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
                  )}
                </div>
              )}

              {previewClass.name === 'Cleric' && level >= 1 && (
                <div className="section-box border-[#5a4a1b] bg-[#0f0f0f]">
                  <div className="section-title">Choose Divine Domain</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {CLERIC_DOMAINS.map(domain => {
                      const selected = state.clericDomain === domain.name;
                      return (
                        <button
                          key={domain.name}
                          onClick={() => onChange({ clericDomain: domain.name })}
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200]'
                              : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#f0d080]">{domain.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[#9a8040]">{domain.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedClericDomain && (
                    <div className="mt-4">
                      <div className="section-title">Divine Domain Features</div>
                      <div className="flex flex-col gap-2">
                        {clericDomainFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-domain-${i}`}
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
                  )}
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

              {previewClass.name === 'Paladin' && level >= 3 && (
                <div className="section-box border-[#5a4a1b] bg-[#0f0f0f]">
                  <div className="section-title">Choose Sacred Oath</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {PALADIN_OATHS.map(oath => {
                      const selected = state.paladinOath === oath.name;
                      return (
                        <button
                          key={oath.name}
                          onClick={() => onChange({ paladinOath: oath.name })}
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#f0d080] bg-[#1a1200]'
                              : 'border-[#b8962e] bg-[#0d0d0d] hover:bg-[#111100]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#f0d080]">{oath.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[#9a8040]">{oath.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedPaladinOath && (
                    <div className="mt-4">
                      <div className="section-title">Sacred Oath Features</div>
                      <div className="flex flex-col gap-2">
                        {paladinOathFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-oath-${i}`}
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
                {displayedEquipment.length ? (
                  <div className="mb-4 grid gap-2 lg:grid-cols-2">
                    {displayedEquipment.map(item => (
                      <div
                        key={`displayed-equipment-${item}`}
                        className="rounded border border-[#5a4a1b] bg-[#101010] px-3 py-2 text-sm text-[#c8a84b]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 text-sm leading-6 text-[#c8a84b]">No starter equipment listed.</div>
                )}

                {packItemsInDisplay.length > 0 && (
                  <div className="mb-4 grid gap-3 lg:grid-cols-2">
                    {packItemsInDisplay.map(pack => (
                      <div key={`display-pack-${pack}`} className="rounded border border-[#5a4a1b] bg-[#121212] p-3 text-sm leading-6 text-[#9a8040]">
                        <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#b8962e]">
                          {pack} Contents
                        </div>
                        {EQUIPMENT_PACK_CONTENTS[pack]}
                      </div>
                    ))}
                  </div>
                )}

                {classEquipmentChoices.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {classEquipmentChoices.map(choice => {
                      const selectedOption = state.classEquipmentSelections[choice.key] ?? '';
                      const packDescription = selectedOption.includes('Pack')
                        ? EQUIPMENT_PACK_CONTENTS[selectedOption]
                        : undefined;
                      const expandedOptions = selectedOption ? getDynamicEquipmentSelections(choice.key, selectedOption) : [];
                      const selectedPackageParts = selectedOption ? selectedOption.split(',').map(token => token.trim()).filter(Boolean) : [];

                      return (
                        <div key={choice.key}>
                          <div className="mb-1 field-label">{choice.label}</div>
                          <div className="flex flex-wrap gap-2">
                            {choice.options.map(option => {
                              const selected = selectedOption === option;
                              return (
                                <button
                                  key={option}
                                  onClick={() => {
                                    const preservedSelections = Object.fromEntries(
                                      Object.entries(state.classEquipmentSelections).filter(([key]) => !key.startsWith(`${choice.key}-specific-`))
                                    );
                                    onChange({
                                      classEquipmentSelections: {
                                        ...preservedSelections,
                                        [choice.key]: option,
                                      },
                                    });
                                  }}
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selected
                                      ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                                      : 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                                  }`}
                                >
                                  {formatEquipmentOptionLabel(option)}
                                </button>
                              );
                            })}
                          </div>

                          {!selectedOption && (
                            <div className="mt-2 text-sm italic text-[#7a6020]">
                              Select one of the options above to resolve this equipment choice.
                            </div>
                          )}

                          {selectedPackageParts.length > 1 && (
                            <div className="mt-3 rounded border border-[#5a4a1b] bg-[#121212] p-3">
                              <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#b8962e]">
                                This option includes
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedPackageParts.map(part => (
                                  <span
                                    key={`${choice.key}-${part}`}
                                    className="rounded border border-[#4a3c15] bg-[#181203] px-2 py-1 text-[0.72rem] text-[#c8a84b]"
                                  >
                                    {part}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {packDescription && (
                            <div className="mt-3 rounded border border-[#5a4a1b] bg-[#121212] p-3 text-sm leading-6 text-[#9a8040]">
                              <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#b8962e]">
                                Pack Contents
                              </div>
                              {packDescription}
                            </div>
                          )}

                          {expandedOptions.length > 0 && (
                            <div className="mt-3 rounded border border-[#5a4a1b] bg-[#121212] p-3">
                              <div className="mb-2 border-b border-[#5a4a1b] pb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#b8962e]">
                                Choose a specific item
                              </div>
                              <div className="flex flex-col gap-3">
                                {expandedOptions.map(entry => (
                                  <div key={entry.specificKey}>
                                    <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[#7a6020]">
                                      {entry.label}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {entry.pool.map(option => {
                                        const selected = state.classEquipmentSelections[entry.specificKey] === option;
                                        return (
                                          <button
                                            key={`${entry.specificKey}-${option}`}
                                            onClick={() => onChange({
                                              classEquipmentSelections: {
                                                ...state.classEquipmentSelections,
                                                [entry.specificKey]: option,
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
                                ))}
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
