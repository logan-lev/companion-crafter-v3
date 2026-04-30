import { useState } from 'react';
import type { WizardState } from '../../types/wizard';
import {
  ARTISAN_TOOL_OPTIONS,
  BARD_COLLEGES,
  BARBARIAN_PRIMAL_PATHS,
  BARBARIAN_RAGE_DAMAGE_BY_LEVEL,
  BARBARIAN_RAGES_BY_LEVEL,
  BARBARIAN_TOTEM_SPIRITS,
  BATTLE_MASTER_MANEUVERS,
  CLASS_DATA,
  CLERIC_DOMAINS,
  DRUID_CIRCLES,
  DRUID_LAND_TERRAINS,
  FIGHTER_ARCHETYPES,
  FIGHTING_STYLE_OPTIONS,
  PALADIN_OATHS,
  type ClassFeature,
  getCantripsKnown,
  getClassFeatureTimeline,
  getEffectiveSpellcasting,
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
import { ABILITY_NAMES, LANGUAGES, profBonusFromLevel } from '../../data/srd';
import { SPELL_LIST } from '../../data/srd-spells';
import type { AbilityKey } from '../../types/character';
import { getAllSkillProficiencies, getFinalAbilityScores, getLanguages, getRacialBonus } from '../../utils/character-builder';

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

const SPELL_LIST_CLASS_MAP: Record<string, string> = {
  bard: 'Bard',
  cleric: 'Cleric',
  druid: 'Druid',
  paladin: 'Paladin',
  ranger: 'Ranger',
  sorcerer: 'Sorcerer',
  warlock: 'Warlock',
  wizard: 'Wizard',
};

const CLERIC_KNOWLEDGE_SKILL_OPTIONS = ['Arcana', 'History', 'Nature', 'Religion'];
const CLERIC_NATURE_SKILL_OPTIONS = ['Animal Handling', 'Nature', 'Survival'];
const CLERIC_NATURE_CANTRIP_OPTIONS = SPELL_LIST
  .filter(spell => spell.level === 0 && spell.classes.includes('Druid'))
  .sort((a, b) => a.name.localeCompare(b.name));

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
  if (className !== 'Barbarian' && className !== 'Cleric' && className !== 'Druid') {
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

    if (feature.name === 'Dampen Elements') {
      resistances.push({
        label: 'Acid, cold, fire, lightning, and thunder damage',
        condition: 'When you use your reaction on a creature within 30 feet',
      });
    }

    if (feature.name === 'Wrath of the Storm') {
      advantages.push({
        label: 'Reactive lightning or thunder rebuke against nearby attackers',
      });
    }

    if (feature.name === 'Blessing of the Trickster') {
      advantages.push({
        label: 'Dexterity (Stealth) checks',
        condition: 'For the creature you bless',
      });
    }

    if (feature.name === 'Channel Divinity: Invoke Duplicity') {
      advantages.push({
        label: 'Attack rolls against a creature when both you and the illusion are within 5 feet of it',
      });
    }

    if (feature.name === 'Avatar of Battle') {
      resistances.push({
        label: 'Bludgeoning, piercing, and slashing damage from nonmagical weapons',
      });
    }

    if (feature.name === 'Dampen Elements') {
      resistances.push({
        label: 'Acid, cold, fire, lightning, or thunder damage',
        condition: 'When you use your reaction on yourself or a creature within 30 feet',
      });
    }

    if (feature.name === "Nature's Ward") {
      resistances.push({
        label: 'Poison and disease',
      });
      advantages.push({
        label: "You can't be charmed or frightened by elementals or fey",
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

function normalizeFeatureParagraphs(description: string): string[] {
  return description.split('\n').map(part => part.trim()).filter(Boolean);
}

function getFeatureSpellDetails(feature: ClassFeature): SpellDetail[] {
  return CLASS_FEATURE_SPELLS[feature.name] ?? [];
}

function isBardCollegeFeature(feature: ClassFeature): boolean {
  return BARD_COLLEGES.some(college =>
    college.features.some(collegeFeature => collegeFeature.level === feature.level && collegeFeature.name === feature.name)
  );
}

function isClericDomainFeature(feature: ClassFeature): boolean {
  return CLERIC_DOMAINS.some(domain =>
    domain.features.some(domainFeature => domainFeature.level === feature.level && domainFeature.name === feature.name)
  );
}

function isDruidCircleFeature(feature: ClassFeature): boolean {
  return DRUID_CIRCLES.some(circle =>
    circle.features.some(circleFeature => circleFeature.level === feature.level && circleFeature.name === feature.name)
  );
}

function isFighterArchetypeFeature(feature: ClassFeature): boolean {
  return FIGHTER_ARCHETYPES.some(archetype =>
    archetype.features.some(archetypeFeature => archetypeFeature.level === feature.level && archetypeFeature.name === feature.name)
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
      druidCircle: '',
      druidLandTerrain: '',
      druidLandCantrip: '',
      fighterArchetype: '',
      fighterFightingStyles: [],
      fighterStudentOfWarTool: '',
      fighterManeuverChoices: [],
      paladinOath: '',
      clericKnowledgeSkillChoices: [],
      clericKnowledgeLanguageChoices: [],
      clericNatureSkillChoice: '',
      clericNatureCantrip: '',
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

    const nextSpellcasting = getEffectiveSpellcasting(state.className, {
      fighterArchetype: state.fighterArchetype,
    });
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
      fighterFightingStyles:
        state.className === 'Fighter'
          ? state.fighterFightingStyles.slice(
              0,
              1 +
                (state.fighterArchetype === 'Champion' && nextLevel >= 10 ? 1 : 0)
            )
          : [],
      fighterStudentOfWarTool:
        state.className === 'Fighter' && state.fighterArchetype === 'Battle Master' && nextLevel >= 3
          ? state.fighterStudentOfWarTool
          : '',
      fighterManeuverChoices:
        state.className === 'Fighter' && state.fighterArchetype === 'Battle Master'
          ? state.fighterManeuverChoices.slice(
              0,
              nextLevel >= 15 ? 9 : nextLevel >= 10 ? 7 : nextLevel >= 7 ? 5 : nextLevel >= 3 ? 3 : 0
            )
          : [],
      ...(nextLevel < 3
        ? {
            barbarianPath: '',
            barbarianTotemSpirit: '',
            barbarianAspectSpirit: '',
            barbarianAttunementSpirit: '',
            bardCollege: '',
            bardLoreSkillChoices: [],
            fighterArchetype: '',
            fighterStudentOfWarTool: '',
            fighterManeuverChoices: [],
            paladinOath: '',
          }
        : nextLevel < 1
        ? {
            clericDomain: '',
            clericKnowledgeSkillChoices: [],
            clericKnowledgeLanguageChoices: [],
            clericNatureSkillChoice: '',
            clericNatureCantrip: '',
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

  const toggleFighterFightingStyle = (style: string) => {
    if (previewClass?.name !== 'Fighter') return;
    const current = state.fighterFightingStyles;
    if (current.includes(style)) {
      onChange({ fighterFightingStyles: current.filter(item => item !== style) });
    } else if (current.length < fighterFightingStyleLimit) {
      onChange({ fighterFightingStyles: [...current, style] });
    }
  };

  const toggleFighterManeuver = (maneuver: string) => {
    if (state.fighterArchetype !== 'Battle Master') return;
    const current = state.fighterManeuverChoices;
    if (current.includes(maneuver)) {
      onChange({ fighterManeuverChoices: current.filter(item => item !== maneuver) });
    } else if (current.length < fighterManeuverLimit) {
      onChange({ fighterManeuverChoices: [...current, maneuver] });
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

  const toggleClericKnowledgeSkill = (skill: string) => {
    const current = state.clericKnowledgeSkillChoices;
    if (current.includes(skill)) {
      onChange({ clericKnowledgeSkillChoices: current.filter(item => item !== skill) });
    } else if (current.length < 2) {
      onChange({ clericKnowledgeSkillChoices: [...current, skill] });
    }
  };

  const toggleClericKnowledgeLanguage = (language: string) => {
    const current = state.clericKnowledgeLanguageChoices;
    if (current.includes(language)) {
      onChange({ clericKnowledgeLanguageChoices: current.filter(item => item !== language) });
    } else if (current.length < 2) {
      onChange({ clericKnowledgeLanguageChoices: [...current, language] });
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
      if (
        previewClass?.name === 'Fighter' &&
        state.fighterArchetype === 'Eldritch Knight'
      ) {
        const spell = classLevelSpellOptions.find(option => option.name === name);
        if (!spell) return;

        const unrestrictedSpellChoices = [8, 14, 20].filter(levelValue => level >= levelValue).length;
        const selectedUnrestrictedCount = current.filter(selectedName => {
          const selectedSpell = classLevelSpellOptions.find(option => option.name === selectedName);
          return selectedSpell && !['Abjuration', 'Evocation'].includes(selectedSpell.school);
        }).length;
        const isRestrictedSchool = ['Abjuration', 'Evocation'].includes(spell.school);

        if (!isRestrictedSchool && selectedUnrestrictedCount >= unrestrictedSpellChoices) {
          return;
        }
      }
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
        druidCircle: state.druidCircle,
        fighterArchetype: state.fighterArchetype,
        paladinOath: state.paladinOath,
      })
    : [];
  const baseFeatures = features.filter(
    feature =>
      !isBarbarianPathFeature(feature) &&
      !isBardCollegeFeature(feature) &&
      !isClericDomainFeature(feature) &&
      !isDruidCircleFeature(feature) &&
      !isFighterArchetypeFeature(feature)
  );
  const unlockedFeatures = features.filter(feature => feature.level <= level);
  const selectedPrimalPath = BARBARIAN_PRIMAL_PATHS.find(path => path.name === state.barbarianPath);
  const selectedBardCollege = BARD_COLLEGES.find(college => college.name === state.bardCollege);
  const selectedClericDomain = CLERIC_DOMAINS.find(domain => domain.name === state.clericDomain);
  const selectedDruidCircle = DRUID_CIRCLES.find(circle => circle.name === state.druidCircle);
  const selectedFighterArchetype = FIGHTER_ARCHETYPES.find(archetype => archetype.name === state.fighterArchetype);
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
  const druidCircleFeatures = selectedDruidCircle?.features ?? [];
  const fighterArchetypeFeatures = selectedFighterArchetype?.features ?? [];
  const paladinOathFeatures = selectedPaladinOath?.features ?? [];
  const fightingStyleOptions = previewClass ? FIGHTING_STYLE_OPTIONS[previewClass.name] ?? [] : [];
  const fighterFightingStyleLimit =
    previewClass?.name === 'Fighter' ? 1 + (state.fighterArchetype === 'Champion' && level >= 10 ? 1 : 0) : 0;
  const fighterManeuverLimit =
    state.fighterArchetype === 'Battle Master'
      ? level >= 15
        ? 9
        : level >= 10
        ? 7
        : level >= 7
        ? 5
        : level >= 3
        ? 3
        : 0
      : 0;

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
  const knownLanguages = new Set(getLanguages(state));
  const clericHasHeavyArmor =
    previewClass?.name === 'Cleric' &&
    Boolean(
      selectedClericDomain &&
        ['Life Domain', 'Nature Domain', 'Tempest Domain', 'War Domain'].includes(selectedClericDomain.name)
    );
  const clericHasMartialWeapons =
    previewClass?.name === 'Cleric' &&
    Boolean(selectedClericDomain && ['Tempest Domain', 'War Domain'].includes(selectedClericDomain.name));
  const armorWeaponProficiencies = previewClass
    ? [
        ...previewClass.armorProf,
        ...previewClass.weaponProf,
        ...(previewClass.name === 'Cleric' && clericHasHeavyArmor ? ['Heavy Armor'] : []),
        ...(previewClass.name === 'Cleric' && clericHasMartialWeapons ? ['Martial Weapons'] : []),
      ]
    : [];
  const toolProficiencies = previewClass
    ? [
        ...((previewClass.toolProf ?? []).filter(item => item !== 'Three musical instruments of your choice')),
        ...(previewClass.name === 'Bard' ? state.bardInstrumentChoices : []),
        ...(previewClass.name === 'Fighter' && state.fighterStudentOfWarTool ? [state.fighterStudentOfWarTool] : []),
      ]
    : [];
  const availableClericNatureCantrips = CLERIC_NATURE_CANTRIP_OPTIONS.filter(
    spell => spell.name !== 'Light' || state.clericDomain !== 'Light Domain'
  );
  const bardExpertiseAllowed = state.className === 'Bard'
    ? unlockedFeatures.filter(feature => feature.name === 'Expertise').length * 2
    : 0;
  const bardMagicalSecretsAllowed = state.className === 'Bard'
    ? unlockedFeatures.filter(feature => feature.name === 'Magical Secrets').length * 2
    : 0;
  const bardAdditionalMagicalSecretsAllowed =
    state.className === 'Bard' && state.bardCollege === 'College of Lore' && level >= 6 ? 2 : 0;
  const finalScores = getFinalAbilityScores(state);
  const spellcasting = previewClass
    ? getEffectiveSpellcasting(previewClass.name, {
        fighterArchetype: state.fighterArchetype,
      })
    : undefined;
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
  const spellListClass = spellcasting ? SPELL_LIST_CLASS_MAP[spellcasting.spellListKey] : '';
  const classSpellOptions =
    spellcasting && spellListClass
      ? SPELL_LIST.filter(spell => spell.classes.includes(spellListClass))
      : [];
  const subclassAutoPreparedSpells =
    previewClass && (previewClass.name === 'Cleric' || previewClass.name === 'Paladin' || previewClass.name === 'Druid')
      ? getSubclassAutoPreparedSpells(previewClass.name, level, {
          clericDomain: state.clericDomain,
          druidCircle: state.druidCircle,
          druidLandTerrain: state.druidLandTerrain,
          paladinOath: state.paladinOath,
        })
      : [];
  const subclassAutoPreparedSpellDetails = subclassAutoPreparedSpells
    .map(name => SPELL_LIST.find(spell => spell.name === name))
    .filter((spell): spell is (typeof SPELL_LIST)[number] => Boolean(spell));
  const clericDomainGrantedCantripDetails =
    previewClass?.name === 'Cleric' &&
    selectedClericDomain?.name === 'Light Domain' &&
    !state.selectedCantrips.includes('Light')
      ? SPELL_LIST.filter(spell => spell.name === 'Light')
      : [];
  const clericNatureChosenCantripDetails =
    previewClass?.name === 'Cleric' &&
    selectedClericDomain?.name === 'Nature Domain' &&
    state.clericNatureCantrip
      ? SPELL_LIST.filter(spell => spell.name === state.clericNatureCantrip)
      : [];
  const druidLandChosenCantripDetails =
    previewClass?.name === 'Druid' &&
    selectedDruidCircle?.name === 'Circle of the Land' &&
    state.druidLandCantrip
      ? SPELL_LIST.filter(spell => spell.name === state.druidLandCantrip)
      : [];
  const classCantripOptions = classSpellOptions.filter(spell => spell.level === 0);
  const availableDruidLandCantrips =
    previewClass?.name === 'Druid'
      ? classCantripOptions.filter(
          spell => !state.selectedCantrips.includes(spell.name) || state.druidLandCantrip === spell.name
        )
      : [];
  const classLevelSpellOptions = classSpellOptions.filter(spell => spell.level > 0 && spell.level <= Math.max(1, maxSpellLevel));
  const eldritchKnightFreeSchoolChoices =
    previewClass?.name === 'Fighter' && state.fighterArchetype === 'Eldritch Knight'
      ? [8, 14, 20].filter(levelValue => level >= levelValue).length
      : 0;
  const eldritchKnightSelectedFreeSchoolChoices =
    previewClass?.name === 'Fighter' && state.fighterArchetype === 'Eldritch Knight'
      ? state.selectedSpells.filter(name => {
          const spell = classLevelSpellOptions.find(option => option.name === name);
          return spell && !['Abjuration', 'Evocation'].includes(spell.school);
        }).length
      : 0;
  const eldritchKnightSelectedMeta =
    previewClass?.name === 'Fighter' && state.fighterArchetype === 'Eldritch Knight'
      ? Object.fromEntries(
          state.selectedSpells.map(name => {
            const spell = classLevelSpellOptions.find(option => option.name === name);
            return [
              name,
              spell && !['Abjuration', 'Evocation'].includes(spell.school)
                ? 'Any-school spell'
                : 'Abjuration/Evocation',
            ];
          })
        )
      : undefined;
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
  const selectedFighterArchetypeFeatureNames = new Set(fighterArchetypeFeatures.map(feature => feature.name));

  const isEquipmentOptionAvailable = (choiceKey: string, option: string) => {
    if (previewClass?.name !== 'Cleric') return true;
    if (choiceKey === 'cleric-weapon' && option === 'Warhammer') return clericHasMartialWeapons;
    if (choiceKey === 'cleric-armor' && option === 'Chain Mail') return clericHasHeavyArmor;
    return true;
  };

  const renderSpellCards = (feature: ClassFeature) => {
    const spells = getFeatureSpellDetails(feature);
    if (!spells.length) return null;

    return (
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        {spells.map(spell => (
          <div key={`${feature.name}-${spell.name}`} className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-[var(--color-text-strong)]">{spell.name}</div>
              <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                {spell.levelLabel}{spell.ritual ? ' · ritual' : ''}
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{spell.description}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderFeatureDescription = (feature: ClassFeature, unlocked: boolean) => {
    if (feature.name === 'Fighting Style') {
      const styleOptions = fightingStyleOptions;

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Fighting Style
          </div>
          <div className="mt-3 space-y-4 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{feature.description}</p>
            {styleOptions.map(option => (
              <div key={`${previewClass?.name}-${option.name}`}>
                <div className="text-lg font-bold uppercase tracking-[0.14em] text-[var(--color-text-strong)]">{option.name}</div>
                <p className="mt-1">{option.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (feature.name === 'Additional Fighting Style') {
      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Additional Fighting Style
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{feature.description}</p>
            {state.fighterFightingStyles.length > 1 && (
              <div className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3 text-sm">
                Chosen additional style: <span className="font-bold text-[var(--color-text-strong)]">{state.fighterFightingStyles[1]}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (feature.name === 'Combat Superiority') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Combat Superiority
          </div>
          <div className="mt-3 space-y-4 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{paragraphs[0]}</p>
            {paragraphs.slice(1).map((paragraph, index) => {
              const [heading, ...rest] = paragraph.split('. ');
              const body = rest.join('. ');
              const isNamedSection = ['Maneuvers', 'Superiority Dice', 'Saving Throws'].includes(heading);
              return isNamedSection ? (
                <div key={`combat-superiority-${index}`}>
                  <div className="text-lg font-bold italic text-[var(--color-text-strong)]">{heading}.</div>
                  <p className="mt-1">{body}</p>
                </div>
              ) : (
                <p key={`combat-superiority-${index}`}>{paragraph}</p>
              );
            })}
            {state.fighterManeuverChoices.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Chosen Maneuvers
                </div>
                <div className="grid gap-2 lg:grid-cols-2">
                  {state.fighterManeuverChoices.map(name => {
                    const maneuver = BATTLE_MASTER_MANEUVERS.find(option => option.name === name);
                    if (!maneuver) return null;
                    return (
                      <div key={`chosen-maneuver-${name}`} className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3">
                        <div className="text-sm font-bold text-[var(--color-text-strong)]">{maneuver.name}</div>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{maneuver.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (feature.name === 'Know Your Enemy') {
      const [intro, ...rest] = feature.description.split('\n');
      const bullets = rest.filter(line => line.trim().startsWith('•')).map(line => line.replace(/^•\s*/, '').trim());
      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Know Your Enemy
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{intro}</p>
            {bullets.length > 0 && (
              <ul className="list-disc space-y-1 pl-6">
                {bullets.map(item => (
                  <li key={`know-your-enemy-${item}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    if (feature.name === 'Rage') {
      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Rage
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
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
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-[var(--color-accent)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--color-text-strong)]">
              Spirit Choice
            </span>
            <span className="text-sm italic text-[var(--color-text-muted)]">Pick a totem animal below to unlock the matching feature.</span>
          </div>
          <p className="text-[0.98rem] leading-7 text-[var(--color-text-soft)]">{feature.description}</p>
          {selectedTotemSpirit ? (
            <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3">
              <div className="text-sm font-bold text-[var(--color-text-strong)]">{selectedTotemSpirit.name}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{selectedTotemSpirit.description}</p>
            </div>
          ) : (
            <div className="mt-3 rounded border border-dashed border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3 text-sm text-[var(--color-text-muted)]">
              Choose a spirit to see the level 3 totem benefit here.
            </div>
          )}
        </div>
      );
    }

    if (feature.name === 'Visions of the Past') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      const intro = paragraphs[0] ?? '';
      const recharge = paragraphs[1] ?? '';
      const objectParagraph = paragraphs[2] ?? '';
      const areaParagraph = paragraphs[3] ?? '';
      const objectMatch = objectParagraph.match(/^Object Reading\.\s*(.*?)(?:\s*If the object was owned by another creature.*)$/);
      const objectFollowupMatch = objectParagraph.match(/(If the object was owned by another creature.*)$/);
      const areaMatch = areaParagraph.match(/^Area Reading\.\s*(.*?)(?:\s*Significant events typically involve.*)$/);
      const areaFollowupMatch = areaParagraph.match(/(Significant events typically involve.*)$/);
      const objectSection = objectMatch?.[1] ?? objectParagraph.replace(/^Object Reading\.\s*/, '');
      const objectDetails = objectFollowupMatch?.[1] ?? '';
      const areaSection = areaMatch?.[1] ?? areaParagraph.replace(/^Area Reading\.\s*/, '');
      const areaDetails = areaFollowupMatch?.[1] ?? '';

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Visions of the Past
          </div>
          <div className="mt-3 space-y-4 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{intro}</p>
            <p>{recharge}</p>
            <div>
              <div className="text-lg font-bold italic text-[var(--color-text-strong)]">Object Reading.</div>
              <p className="mt-1">{objectSection}</p>
              {objectDetails && <p className="mt-2">{objectDetails}</p>}
            </div>
            <div>
              <div className="text-lg font-bold italic text-[var(--color-text-strong)]">Area Reading.</div>
              <p className="mt-1">{areaSection}</p>
              {areaDetails && <p className="mt-2">{areaDetails}</p>}
            </div>
          </div>
        </div>
      );
    }

    if (feature.name === 'Wild Shape') {
      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Wild Shape
          </div>
          <div className="mt-3 space-y-4 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>Starting at 2nd level, you can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice. You regain expended uses when you finish a short or long rest.</p>
            <p>Your druid level determines the beasts you can transform into, as shown in the Beast Shapes table. At 2nd level, for example, you can transform into any beast that has a challenge rating of 1/4 or lower that doesn't have a flying or swimming speed.</p>
            <div className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-3">
              <div className="text-lg font-bold uppercase tracking-[0.18em] text-[var(--color-text-strong)]">Beast Shapes</div>
              <div className="mt-3 grid grid-cols-[100px_100px_minmax(0,1fr)_100px] gap-2 text-sm">
                <div className="font-bold text-[var(--color-text-strong)]">Level</div>
                <div className="font-bold text-[var(--color-text-strong)]">Max. CR</div>
                <div className="font-bold text-[var(--color-text-strong)]">Limitations</div>
                <div className="font-bold text-[var(--color-text-strong)]">Example</div>
                <div>2nd</div>
                <div>1/4</div>
                <div>No flying or swimming speed</div>
                <div>Wolf</div>
                <div>4th</div>
                <div>1/2</div>
                <div>No flying speed</div>
                <div>Crocodile</div>
                <div>8th</div>
                <div>1</div>
                <div>—</div>
                <div>Giant eagle</div>
              </div>
            </div>
            <p>You can stay in a beast shape for a number of hours equal to half your druid level (rounded down). You then revert to your normal form unless you expend another use of this feature. You can revert to your normal form earlier by using a bonus action on your turn. You automatically revert if you fall unconscious, drop to 0 hit points, or die.</p>
            <div>
              <p className="mb-2">While you are transformed, the following rules apply:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Your game statistics are replaced by the statistics of the beast, but you retain your alignment, personality, and Intelligence, Wisdom, and Charisma scores. You also retain all of your skill and saving throw proficiencies, in addition to gaining those of the creature. If the creature has the same proficiency as you and the bonus in its stat block is higher than yours, use the creature's bonus instead of yours. If the creature has any legendary or lair actions, you can't use them.</li>
                <li>When you transform, you assume the beast's hit points and Hit Dice. When you revert to your normal form, you return to the number of hit points you had before you transformed. However, if you revert as a result of dropping to 0 hit points, any excess damage carries over to your normal form. For example, if you take 10 damage in animal form and have only 1 hit point left, you revert and take 9 damage. As long as the excess damage doesn't reduce your normal form to 0 hit points, you aren't knocked unconscious.</li>
                <li>You can't cast spells, and your ability to speak or take any action that requires hands is limited to the capabilities of your beast form. Transforming doesn't break your concentration on a spell you've already cast, however, or prevent you from taking actions that are part of a spell, such as call lightning, that you've already cast.</li>
                <li>You retain the benefit of any features from your class, race, or other source and can use them if the new form is physically capable of doing so. However, you can't use any of your special senses, such as darkvision, unless your new form also has that sense.</li>
                <li>You choose whether your equipment falls to the ground in your space, merges into your new form, or is worn by it. Worn equipment functions as normal, but the DM decides whether it is practical for the new form to wear a piece of equipment, based on the creature's shape and size. Your equipment doesn't change size or shape to match the new form, and any equipment that the new form can't wear must either fall to the ground or merge with it. Equipment that merges with the form has no effect until you leave the form.</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <p className={`mt-1 text-[0.98rem] leading-7 ${unlocked ? 'text-[var(--color-text-soft)]' : 'text-[var(--color-text-faint)]'}`}>{feature.description}</p>
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
        <span className="text-[0.68rem] uppercase tracking-wide text-[var(--color-text-dim)]">Spirit</span>
        {BARBARIAN_TOTEM_SPIRITS.map(spirit => {
          const selected = selectedValue === spirit.name;
          return (
            <button
              key={`${mode}-${spirit.name}`}
              onClick={() => onSelect(spirit.name)}
              className={`rounded border px-2 py-1 text-[0.68rem] transition-all ${
                selected
                  ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                  : 'border-[var(--color-border-muted)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
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
        <div className="mb-2 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-accent)]">
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
                      <div className="mb-2 flex items-center justify-between gap-2 rounded border border-[var(--color-spell-border-strong)] bg-[var(--color-spell-surface)] px-3 py-2">
                        <button
                          onClick={() => toggleSpellGroupCollapsed(groupKey)}
                          className="text-left"
                        >
                          <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                            {group.level === 0 ? 'Cantrips' : `Level ${group.level} Spells`}
                          </div>
                          <div className="mt-1 text-[0.66rem] uppercase tracking-wide text-[var(--color-spell-muted)]">
                            {selectedInGroup} selected · {collapsed ? 'Collapsed' : 'Expanded'}
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          {selectedInGroup > 0 && (
                            <button
                              onClick={() => {
                                onClearGroup?.(group.spells.map(spell => spell.name));
                              }}
                              className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => toggleSpellGroupCollapsed(groupKey)}
                            className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
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
                                    ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                    : 'border-[var(--color-border-muted)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                }`}
                              >
                                <div className="font-bold">{spell.name}</div>
                                <div className="mt-1 text-[0.62rem] uppercase tracking-wide text-[var(--color-text-dim)]">
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
                            <div key={`group-detail-${groupPrefix}-${spell.name}`} className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold text-[var(--color-text-strong)]">{spell.name}</div>
                                <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                                </div>
                              </div>
                              <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-text-dim)]">
                                {spell.school} · {spell.castingTime} · {spell.range}
                                {selectedMeta?.[spell.name] ? ` · ${selectedMeta[spell.name]}` : ''}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{spell.description}</p>
                              {spell.upcast && <p className="mt-2 text-xs leading-5 text-[var(--color-spell-strong)]">{spell.upcast}</p>}
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
          <div className="text-sm italic text-[var(--color-text-faint)]">{emptyText}</div>
        )}
      </div>
    );
  };

  const renderCollapsibleSpellDetails = (
    groupPrefix: string,
    spells: typeof SPELL_LIST,
    title: string,
    intro?: string
  ) => {
    const grouped = groupSpellsByLevel(spells);

    if (!grouped.length) return null;

    return (
      <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
            {title}
          </div>
          <button
            onClick={() => toggleAllSpellGroups(groupPrefix, spells)}
            className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
          >
            {grouped.every(group => collapsedSpellGroups[`${groupPrefix}-${group.level}`] ?? false) ? 'Open All' : 'Close All'}
          </button>
        </div>
        {intro && <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">{intro}</div>}
        <div className="space-y-4">
          {grouped.map(group => {
            const groupKey = `${groupPrefix}-${group.level}`;
            const collapsed = collapsedSpellGroups[groupKey] ?? false;
            return (
              <div key={`detail-group-${groupPrefix}-${group.level}`}>
                <div className="mb-2 flex items-center justify-between gap-2 rounded border border-[var(--color-spell-border-strong)] bg-[var(--color-spell-surface)] px-3 py-2">
                  <button onClick={() => toggleSpellGroupCollapsed(groupKey)} className="text-left">
                    <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                      {group.level === 0 ? 'Cantrips' : `Level ${group.level} Spells`}
                    </div>
                    <div className="mt-1 text-[0.66rem] uppercase tracking-wide text-[var(--color-spell-muted)]">
                      {group.spells.length} spell{group.spells.length === 1 ? '' : 's'} · {collapsed ? 'Collapsed' : 'Expanded'}
                    </div>
                  </button>
                  <button
                    onClick={() => toggleSpellGroupCollapsed(groupKey)}
                    className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
                  >
                    {collapsed ? 'Open' : 'Close'}
                  </button>
                </div>
                {!collapsed && (
                  <div className="grid gap-2 lg:grid-cols-2">
                    {group.spells.map(spell => (
                      <div key={`${groupPrefix}-${spell.name}`} className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{spell.name}</div>
                          <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                          </div>
                        </div>
                        <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-text-dim)]">
                          {spell.school} · {spell.castingTime} · {spell.range}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{spell.description}</p>
                        {spell.upcast && <p className="mt-2 text-xs leading-5 text-[var(--color-spell-strong)]">{spell.upcast}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const packItemsInDisplay = displayedEquipment.filter(item => item.includes('Pack'));
  const loreSkillPool = previewClass?.skillOptions.filter(skill => !state.classSkillChoices.includes(skill)) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 text-lg font-bold tracking-wide text-[var(--color-text-strong)]">Choose Your Class & Level</h2>
        <p className="text-xs text-[var(--color-text-dim)]">Your class is the primary definition of what your character can do.</p>
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
                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-accent)] hover:border-[#d4a93a] hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <div className="text-sm font-bold">{cls.name}</div>
                  <div className="mt-1 text-[0.72rem] text-[var(--color-text-muted)]">d{cls.hitDie} · {cls.primaryAbility}</div>
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
                    className="flex-1 accent-[var(--color-accent)]"
                  />
                  <span className="w-10 text-center text-lg font-bold text-[var(--color-text-strong)]">{level}</span>
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
                  <h3 className="text-xl font-bold text-[var(--color-text-strong)]">{previewClass.name}</h3>
                  <p className="mt-1 text-sm italic leading-6 text-[var(--color-text-dim)]">{previewClass.flavorText}</p>
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
                  <div className="text-xs font-bold text-[var(--color-text-strong)]">{previewClass.savingThrows.map(s => ABILITY_NAMES[s]).join(', ')}</div>
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
                <div className="rounded border border-[var(--color-spell-border-strong)] bg-[var(--color-spell-panel)] p-4">
                  <div className="section-title text-[var(--color-spell-strong)]">Spellcasting</div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                    <div className="space-y-4">
                      <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                          {spellcasting.type === 'full'
                            ? 'Full Caster'
                            : spellcasting.type === 'half'
                            ? 'Half Caster'
                            : spellcasting.type === 'third'
                            ? 'Third Caster'
                            : 'Pact Magic'}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-spell-text)]">
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
                        {previewClass.name === 'Fighter' && state.fighterArchetype === 'Eldritch Knight' && (
                          <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3 text-sm leading-6 text-[var(--color-text-soft)]">
                            You learn two wizard cantrips of your choice at 3rd level and a third at 10th level.
                            Most Eldritch Knight spells must be from the <span className="font-bold text-[var(--color-text-strong)]">Abjuration</span> or <span className="font-bold text-[var(--color-text-strong)]">Evocation</span> schools.
                            At 8th, 14th, and 20th level, one spell you learn at that level can be from any school of magic.
                          </div>
                        )}
                      </div>

                      <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                            Choose Cantrips
                          </div>
                          <button
                            onClick={() => toggleAllSpellGroups('class-cantrip', classCantripOptions)}
                            className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
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

                      <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                            Choose {spellcasting.prepares ? 'Prepared' : 'Known'} Spells
                          </div>
                          <button
                            onClick={() => toggleAllSpellGroups('class-spell', classLevelSpellOptions)}
                            className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
                          >
                            {groupSpellsByLevel(classLevelSpellOptions).every(group => collapsedSpellGroups[`class-spell-${group.level}`] ?? false)
                              ? 'Open All'
                              : 'Close All'}
                          </button>
                        </div>
                        <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">
                          {previewClass.name === 'Bard' ? 'Bard spells selected' : 'Spells selected'} {state.selectedSpells.length}/{spellAllowance}
                          {previewClass.name === 'Bard' && bardMagicalSecretsAllowed > 0
                            ? ` · Magical Secrets ${state.bardMagicalSecretChoices.length}/${bardMagicalSecretsAllowed}${bardAdditionalMagicalSecretsAllowed > 0 ? ` · Additional ${state.bardAdditionalMagicalSecretChoices.length}/${bardAdditionalMagicalSecretsAllowed}` : ''} · Total ${state.selectedSpells.length + bardSecretSelectedNames.length}/${totalSpellAllowance}`
                            : ''}
                        </div>
                        {previewClass.name === 'Fighter' && state.fighterArchetype === 'Eldritch Knight' && (
                          <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">
                            Any-school spell choices used {eldritchKnightSelectedFreeSchoolChoices}/{eldritchKnightFreeSchoolChoices}. All other known spells must be Abjuration or Evocation.
                          </div>
                        )}
                        {renderGroupedSpellPicker(
                          'class-spell',
                          classLevelSpellOptions,
                          state.selectedSpells,
                          toggleClassSpell,
                          state.selectedSpells.length,
                          spellAllowance,
                          'No leveled spells available at this level yet.',
                          eldritchKnightSelectedMeta,
                          clearClassSpellsInGroup
                        )}
                      </div>

                      {subclassAutoPreparedSpellDetails.length > 0 &&
                        renderCollapsibleSpellDetails(
                          'subclass-auto',
                          subclassAutoPreparedSpellDetails,
                          previewClass?.name === 'Cleric'
                            ? 'Domain Spells'
                            : previewClass?.name === 'Druid'
                            ? 'Circle Spells'
                            : 'Oath Spells',
                          previewClass?.name === 'Druid'
                            ? 'These spells are granted by your druid circle terrain and are always prepared for you. They do not count against the number of spells you prepare manually.'
                            : 'These spells are granted by your subclass and are always prepared. They do not count against the number of spells you choose manually.'
                        )}

                      {previewClass.name === 'Druid' && selectedDruidCircle?.name === 'Circle of the Land' && (
                        <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                            Circle of the Land
                          </div>
                          <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">
                            Your mystical connection to the land infuses you with the ability to cast certain spells. At 3rd, 5th, 7th, and 9th level you gain access to circle spells connected to the land where you became a druid. Choose that land-arctic, coast, desert, forest, grassland, mountain, swamp, or Underdark-and consult the associated list of spells.
                            Once you gain access to a circle spell, you always have it prepared, and it doesn't count against the number of spells you can prepare each day. If you gain access to a spell that doesn't appear on the druid spell list, the spell is nonetheless a druid spell for you.
                          </div>
                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                            Choose Terrain
                          </div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            {DRUID_LAND_TERRAINS.map(terrain => {
                              const selected = state.druidLandTerrain === terrain;
                              return (
                                <button
                                  key={`druid-terrain-${terrain}`}
                                  onClick={() => onChange({ druidLandTerrain: selected ? '' : terrain })}
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                      : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  {terrain}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                            Bonus Cantrip
                          </div>
                          <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">
                            Choose one additional druid cantrip. It does not count against the druid cantrips you choose manually.
                          </div>
                          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                            {availableDruidLandCantrips.map(spell => {
                              const selected = state.druidLandCantrip === spell.name;
                              return (
                                <button
                                  key={`druid-land-cantrip-${spell.name}`}
                                  onClick={() => onChange({ druidLandCantrip: selected ? '' : spell.name })}
                                  className={`rounded border p-3 text-left transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  <div className="text-sm font-bold text-[var(--color-text-strong)]">{spell.name}</div>
                                  <div className="mt-1 text-[0.7rem] uppercase tracking-wide text-[var(--color-accent)]">{spell.school} Cantrip</div>
                                  <div className="mt-2 text-[0.72rem] leading-6 text-[var(--color-text-soft)]">{spell.description}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {previewClass.name === 'Cleric' && selectedClericDomain?.name === 'Nature Domain' && (
                        <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                            Acolyte of Nature Cantrip
                          </div>
                          <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">
                            Choose one druid cantrip granted by your domain. It does not count against the cleric cantrips you choose manually.
                          </div>
                          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                            {availableClericNatureCantrips.map(spell => {
                              const selected = state.clericNatureCantrip === spell.name;
                              return (
                                <button
                                  key={spell.name}
                                  onClick={() => onChange({ clericNatureCantrip: selected ? '' : spell.name })}
                                  className={`rounded border p-3 text-left transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  <div className="text-sm font-bold text-[var(--color-text-strong)]">{spell.name}</div>
                                  <div className="mt-1 text-[0.7rem] uppercase tracking-wide text-[var(--color-accent)]">{spell.school} Cantrip</div>
                                  <div className="mt-2 text-[0.72rem] leading-6 text-[var(--color-text-soft)]">{spell.description}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {clericDomainGrantedCantripDetails.length > 0 &&
                        renderCollapsibleSpellDetails(
                          'subclass-cantrip',
                          clericDomainGrantedCantripDetails,
                          'Domain Cantrip',
                          'This cantrip is granted by your domain and does not count against the number of cantrips you choose manually.'
                        )}

                      {clericNatureChosenCantripDetails.length > 0 &&
                        renderCollapsibleSpellDetails(
                          'nature-domain-cantrip',
                          clericNatureChosenCantripDetails,
                          'Chosen Nature Domain Cantrip',
                          'This druid cantrip is granted by Acolyte of Nature and does not count against the number of cleric cantrips you choose manually.'
                        )}

                      {druidLandChosenCantripDetails.length > 0 &&
                        renderCollapsibleSpellDetails(
                          'land-circle-cantrip',
                          druidLandChosenCantripDetails,
                          'Chosen Circle of the Land Cantrip',
                          'This druid cantrip is granted by Circle of the Land and does not count against the number of druid cantrips you choose manually.'
                        )}

                      {previewClass.name === 'Bard' && (bardMagicalSecretsAllowed > 0 || bardAdditionalMagicalSecretsAllowed > 0) && (
                        <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                              Magical Secrets
                            </div>
                            <button
                              onClick={() => toggleAllSpellGroups('magical-secrets', filteredMagicalSecretOptions)}
                              className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
                            >
                              {groupSpellsByLevel(filteredMagicalSecretOptions).every(group => collapsedSpellGroups[`magical-secrets-${group.level}`] ?? false)
                                ? 'Open All'
                                : 'Close All'}
                            </button>
                          </div>
                          <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">
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
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                      : 'border-[var(--color-border-muted)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
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

                    <div className="rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                      <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                        Spell Slots
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {spellSlots.map((slots, index) => (
                          <div
                            key={`slot-${index}`}
                            className={`rounded border p-2 text-center ${
                              slots > 0 ? 'border-[var(--color-spell-chip-border)] bg-[var(--color-spell-chip-bg)] text-[var(--color-spell-strong)]' : 'border-[var(--color-spell-border)] bg-[var(--color-surface-3)] text-[var(--color-spell-muted)]'
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
                <div className="text-sm leading-6 text-[var(--color-text)]">
                  {armorWeaponProficiencies.join(' · ') || 'None'}
                </div>
              </div>

              <div>
                <div className="mb-1 field-label">Tool Proficiencies</div>
                <div className="text-sm leading-6 text-[var(--color-text)]">
                  {toolProficiencies.join(' · ') || 'None'}
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
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                              : takenByLore
                              ? 'cursor-not-allowed border-[var(--color-border-subtle)] bg-[var(--color-surface-accent)] text-[var(--color-text-dim)]'
                              : canAdd
                              ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                              : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
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
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                              : canAdd
                              ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                              : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
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
                        className={`border-l-2 pl-3 ${unlocked ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-faint)]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[var(--color-accent)] text-[var(--color-text-strong)]' : 'border-[var(--color-border-faint)] text-[var(--color-text-dim)]'}`}>
                            Level {feature.level}
                          </span>
                          <span className={`text-base font-bold ${unlocked ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-muted)]'}`}>{feature.name}</span>
                        </div>
                        {renderFeatureDescription(feature, unlocked)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {previewClass.name === 'Fighter' && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 field-label">
                      Choose Fighting Style{fighterFightingStyleLimit > 1 ? 's' : ''} ({state.fighterFightingStyles.length}/{fighterFightingStyleLimit})
                    </div>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {fightingStyleOptions.map(option => {
                        const selected = state.fighterFightingStyles.includes(option.name);
                        const canAdd = state.fighterFightingStyles.length < fighterFightingStyleLimit;
                        return (
                          <button
                            key={`fighter-style-${option.name}`}
                            onClick={() => toggleFighterFightingStyle(option.name)}
                            disabled={!selected && !canAdd}
                            className={`rounded border p-3 text-left transition-all ${
                              selected
                                ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                : !canAdd
                                ? 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                            }`}
                          >
                            <div className="text-sm font-bold text-[var(--color-text-strong)]">{option.name}</div>
                            <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{option.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

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
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                              : canAdd
                              ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                              : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
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
                  <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
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
                        <div key={key} className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-3)] p-3">
                          <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">{ABILITY_NAMES[key]}</div>
                          <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-text-dim)]">
                            ASI Current {asiCurrent} · ASI Max {scoreCap}
                            {primalChampionBonus > 0 ? ` · Final ${finalCurrent}/${displayedMax}` : ''}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <button onClick={() => updateAsi(key, -1)} className="rounded border border-[var(--color-border-muted)] px-2 py-1 text-sm text-[var(--color-accent)]">−</button>
                            <div className="text-base font-bold text-[var(--color-text-strong)]">{modString(value)}</div>
                            <button onClick={() => updateAsi(key, 1)} className="rounded border border-[var(--color-border-muted)] px-2 py-1 text-sm text-[var(--color-accent)]">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {previewClass.name === 'Bard' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Bard College</div>
                  {level < 3 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Bard College unlocks at level 3. You can choose one now to preview its future features.
                    </div>
                  )}
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
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{college.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{college.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedBardCollege && (
                    <div className="mt-4">
                      <div className="section-title">Bard College Features</div>
                      <div className="flex flex-col gap-2">
                        {bardCollegeFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-college-${i}`}
                              className={`border-l-2 pl-3 ${unlocked ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-faint)]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[var(--color-accent)] text-[var(--color-text-strong)]' : 'border-[var(--color-border-faint)] text-[var(--color-text-dim)]'}`}>
                                  Level {feature.level}
                                </span>
                                <span className={`text-base font-bold ${unlocked ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-muted)]'}`}>{feature.name}</span>
                              </div>
                              {renderFeatureDescription(feature, unlocked)}
                            </div>
                          );
                        })}
                      </div>

                      {selectedBardCollege.name === 'College of Lore' && level >= 3 && (
                        <div className="mt-4">
                          <div className="section-title">College of Lore Bonus Proficiencies</div>
                          <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
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
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                      : canAdd
                                      ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                      : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
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
                        <div className="mt-4">
                          <div className="section-title">Additional Proficiencies</div>
                          <div className="text-sm leading-6 text-[var(--color-text)]">
                            Medium Armor · Shields · Martial Weapons
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {previewClass.name === 'Cleric' && level >= 1 && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Divine Domain</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {CLERIC_DOMAINS.map(domain => {
                      const selected = state.clericDomain === domain.name;
                      return (
                        <button
                          key={domain.name}
                          onClick={() =>
                            onChange({
                              clericDomain: domain.name,
                              clericKnowledgeSkillChoices: domain.name === 'Knowledge Domain' ? state.clericKnowledgeSkillChoices : [],
                              clericKnowledgeLanguageChoices: domain.name === 'Knowledge Domain' ? state.clericKnowledgeLanguageChoices : [],
                              clericNatureSkillChoice: domain.name === 'Nature Domain' ? state.clericNatureSkillChoice : '',
                              clericNatureCantrip: domain.name === 'Nature Domain' ? state.clericNatureCantrip : '',
                              classEquipmentSelections: Object.fromEntries(
                                Object.entries(state.classEquipmentSelections).filter(([key]) => key !== 'cleric-weapon' && key !== 'cleric-armor')
                              ),
                            })
                          }
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{domain.name}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
                            Deity and domain overview
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedClericDomain && (
                    <div className="mt-4">
                      <div className="section-title">Divine Domain Description</div>
                      <div className="mb-4 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] px-3 py-3 text-[0.98rem] leading-7 text-[var(--color-text-soft)]">
                        {selectedClericDomain.description}
                      </div>

                      <div className="mb-4 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] px-3 py-2 text-sm leading-6 text-[var(--color-text-soft)]">
                        Check the spellcasting section for your domain spells. Those spells unlock at the listed cleric levels and are always prepared for you.
                      </div>

                      <div className="section-title">Divine Domain Features</div>
                      <div className="flex flex-col gap-2">
                        {clericDomainFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-domain-${i}`}
                              className={`border-l-2 pl-3 ${unlocked ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-faint)]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[var(--color-accent)] text-[var(--color-text-strong)]' : 'border-[var(--color-border-faint)] text-[var(--color-text-dim)]'}`}>
                                  Level {feature.level}
                                </span>
                                <span className={`text-base font-bold ${unlocked ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-muted)]'}`}>{feature.name}</span>
                              </div>
                              {renderFeatureDescription(feature, unlocked)}
                            </div>
                          );
                        })}
                      </div>

                      {selectedClericDomain.name === 'Knowledge Domain' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <div className="section-title">Blessings of Knowledge Skills</div>
                            <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                              Choose two of the following skills to gain proficiency and expertise. ({state.clericKnowledgeSkillChoices.length}/2)
                            </div>
                            <div className="mb-2 text-xs leading-5 text-[var(--color-text-dim)]">
                              Locked skills are already covered by one of your existing proficiencies.
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {CLERIC_KNOWLEDGE_SKILL_OPTIONS.map(skill => {
                                const selected = state.clericKnowledgeSkillChoices.includes(skill);
                                const takenElsewhere = allCurrentSkillProficiencies.includes(skill) && !selected;
                                const canAdd = state.clericKnowledgeSkillChoices.length < 2;
                                return (
                                  <button
                                    key={skill}
                                    onClick={() => toggleClericKnowledgeSkill(skill)}
                                    disabled={takenElsewhere || (!selected && !canAdd)}
                                    className={`rounded border px-3 py-1 text-xs transition-all ${
                                      selected
                                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                        : takenElsewhere
                                        ? 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                        : canAdd
                                        ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                        : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                    }`}
                                >
                                  {skill}{takenElsewhere ? ' · already proficient' : ''}
                                </button>
                              );
                            })}
                          </div>
                          </div>

                          <div>
                            <div className="section-title">Blessings of Knowledge Languages</div>
                            <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                              Choose two bonus languages. ({state.clericKnowledgeLanguageChoices.length}/2)
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {LANGUAGES.map(language => {
                                const selected = state.clericKnowledgeLanguageChoices.includes(language);
                                const knownAlready = knownLanguages.has(language) && !selected;
                                const canAdd = state.clericKnowledgeLanguageChoices.length < 2;
                                return (
                                  <button
                                    key={language}
                                    onClick={() => toggleClericKnowledgeLanguage(language)}
                                    disabled={knownAlready || (!selected && !canAdd)}
                                    className={`rounded border px-3 py-1 text-xs transition-all ${
                                      selected
                                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                        : knownAlready
                                        ? 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                        : canAdd
                                        ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                        : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                    }`}
                                  >
                                    {language}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedClericDomain.name === 'Nature Domain' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <div className="section-title">Acolyte of Nature Skill</div>
                            <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                              Choose one skill proficiency.
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {CLERIC_NATURE_SKILL_OPTIONS.map(skill => {
                                const selected = state.clericNatureSkillChoice === skill;
                                const takenElsewhere = allCurrentSkillProficiencies.includes(skill) && !selected;
                                return (
                                  <button
                                    key={skill}
                                    onClick={() => onChange({ clericNatureSkillChoice: selected ? '' : skill })}
                                    disabled={takenElsewhere}
                                    className={`rounded border px-3 py-1 text-xs transition-all ${
                                      selected
                                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                        : takenElsewhere
                                        ? 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                        : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                    }`}
                                  >
                                    {skill}{takenElsewhere ? ' · already proficient' : ''}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-2 text-xs leading-5 text-[var(--color-text-dim)]">
                              Locked skills are unavailable because you already have proficiency in them.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {previewClass.name === 'Druid' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Druid Circle</div>
                  {level < 2 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Druid Circle unlocks at level 2. You can choose one now to preview its future features.
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {DRUID_CIRCLES.map(circle => {
                      const selected = state.druidCircle === circle.name;
                      return (
                        <button
                          key={circle.name}
                          onClick={() =>
                            onChange({
                              druidCircle: circle.name,
                              druidLandTerrain: circle.name === 'Circle of the Land' ? state.druidLandTerrain : '',
                              druidLandCantrip: circle.name === 'Circle of the Land' ? state.druidLandCantrip : '',
                            })
                          }
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{circle.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{circle.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDruidCircle && (
                    <div className="mt-4">
                      <div className="section-title">Druid Circle Features</div>
                      <div className="flex flex-col gap-2">
                        {druidCircleFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-circle-${i}`}
                              className={`border-l-2 pl-3 ${unlocked ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-faint)]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[var(--color-accent)] text-[var(--color-text-strong)]' : 'border-[var(--color-border-faint)] text-[var(--color-text-dim)]'}`}>
                                  Level {feature.level}
                                </span>
                                <span className={`text-base font-bold ${unlocked ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-muted)]'}`}>{feature.name}</span>
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

              {previewClass.name === 'Fighter' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Martial Archetype</div>
                  {level < 3 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Martial Archetype unlocks at level 3. You can choose one now to preview its future features.
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                    {FIGHTER_ARCHETYPES.map(archetype => {
                      const selected = state.fighterArchetype === archetype.name;
                      return (
                        <button
                          key={archetype.name}
                          onClick={() =>
                            onChange({
                              fighterArchetype: archetype.name,
                              fighterFightingStyles:
                                archetype.name === 'Champion'
                                  ? state.fighterFightingStyles
                                  : state.fighterFightingStyles.slice(0, 1),
                              fighterStudentOfWarTool:
                                archetype.name === 'Battle Master' ? state.fighterStudentOfWarTool : '',
                              fighterManeuverChoices:
                                archetype.name === 'Battle Master' ? state.fighterManeuverChoices : [],
                              selectedCantrips:
                                archetype.name === 'Eldritch Knight' ? state.selectedCantrips : [],
                              selectedSpells:
                                archetype.name === 'Eldritch Knight' ? state.selectedSpells : [],
                            })
                          }
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{archetype.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{archetype.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedFighterArchetype && (
                    <div className="mt-4">
                      <div className="section-title">Martial Archetype Features</div>
                      <div className="flex flex-col gap-2">
                        {fighterArchetypeFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-fighter-archetype-${i}`}
                              className={`border-l-2 pl-3 ${unlocked ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-faint)]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[var(--color-accent)] text-[var(--color-text-strong)]' : 'border-[var(--color-border-faint)] text-[var(--color-text-dim)]'}`}>
                                  Level {feature.level}
                                </span>
                                <span className={`text-base font-bold ${unlocked ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-muted)]'}`}>{feature.name}</span>
                              </div>
                              {renderFeatureDescription(feature, unlocked)}
                            </div>
                          );
                        })}
                      </div>

                      {selectedFighterArchetype.name === 'Battle Master' && level >= 3 && (
                        <div className="mt-4 space-y-4">
                          {selectedFighterArchetypeFeatureNames.has('Student of War') && (
                            <div>
                              <div className="section-title">Student of War Tool Proficiency</div>
                              <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                Choose one type of artisan&apos;s tools.
                              </div>
                              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                {ARTISAN_TOOL_OPTIONS.map(tool => {
                                  const selected = state.fighterStudentOfWarTool === tool;
                                  return (
                                    <button
                                      key={`student-of-war-${tool}`}
                                      onClick={() =>
                                        onChange({
                                          fighterStudentOfWarTool: selected ? '' : tool,
                                        })
                                      }
                                      className={`rounded border p-3 text-left transition-all ${
                                        selected
                                          ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                          : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                      }`}
                                    >
                                      <div className="text-sm font-bold text-[var(--color-text-strong)]">{tool}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {selectedFighterArchetypeFeatureNames.has('Combat Superiority') && (
                            <div>
                              <div className="section-title">
                                Choose Maneuvers ({state.fighterManeuverChoices.length}/{fighterManeuverLimit})
                              </div>
                              <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                Choose your Battle Master maneuvers. At 7th, 10th, and 15th level, choose two additional maneuvers. You can deselect one to replace it.
                              </div>
                              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                {BATTLE_MASTER_MANEUVERS.map(maneuver => {
                                  const selected = state.fighterManeuverChoices.includes(maneuver.name);
                                  const canAdd = state.fighterManeuverChoices.length < fighterManeuverLimit;
                                  return (
                                    <button
                                      key={`maneuver-${maneuver.name}`}
                                      onClick={() => toggleFighterManeuver(maneuver.name)}
                                      disabled={!selected && !canAdd}
                                      className={`rounded border p-3 text-left transition-all ${
                                        selected
                                          ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                          : canAdd
                                          ? 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                          : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                      }`}
                                    >
                                      <div className="text-sm font-bold text-[var(--color-text-strong)]">{maneuver.name}</div>
                                      <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{maneuver.description}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {previewClass.name === 'Barbarian' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Primal Path</div>
                  {level < 3 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Primal Path unlocks at level 3. You can choose one now to preview its future features.
                    </div>
                  )}
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
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{path.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{path.description}</div>
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
                              className={`border-l-2 pl-3 ${unlocked ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-faint)]'}`}
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[var(--color-accent)] text-[var(--color-text-strong)]' : 'border-[var(--color-border-faint)] text-[var(--color-text-dim)]'}`}>
                                  Level {feature.level}
                                </span>
                                <span className={`text-base font-bold ${unlocked ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-muted)]'}`}>{feature.name}</span>
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

              {previewClass.name === 'Paladin' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Sacred Oath</div>
                  {level < 3 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Sacred Oath unlocks at level 3. You can choose one now to preview its future features.
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {PALADIN_OATHS.map(oath => {
                      const selected = state.paladinOath === oath.name;
                      return (
                        <button
                          key={oath.name}
                          onClick={() => onChange({ paladinOath: oath.name })}
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{oath.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{oath.description}</div>
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
                              className={`border-l-2 pl-3 ${unlocked ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-faint)]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`rounded border px-2 py-0.5 text-[0.8rem] font-bold ${unlocked ? 'border-[var(--color-accent)] text-[var(--color-text-strong)]' : 'border-[var(--color-border-faint)] text-[var(--color-text-dim)]'}`}>
                                  Level {feature.level}
                                </span>
                                <span className={`text-base font-bold ${unlocked ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-muted)]'}`}>{feature.name}</span>
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
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Class Resistances & Advantage Rolls</div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <div className="mb-2 field-label">Resistances</div>
                      <div className="flex flex-col gap-2">
                        {classEffects.resistances.length > 0 ? (
                          classEffects.resistances.map((effect, index) => (
                            <div key={`resistance-${index}`} className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]">
                              <span>{effect.label}</span>
                              {effect.condition && (
                                <span className="ml-2 rounded border border-[var(--color-text-dim)] px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-[var(--color-accent)]">
                                  {effect.condition}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-[var(--color-text-faint)]">No class resistances yet.</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 field-label">Advantage Rolls</div>
                      <div className="flex flex-col gap-2">
                        {classEffects.advantages.length > 0 ? (
                          classEffects.advantages.map((effect, index) => (
                            <div key={`advantage-${index}`} className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]">
                              <span>{effect.label}</span>
                              {effect.condition && (
                                <span className="ml-2 rounded border border-[var(--color-text-dim)] px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-[var(--color-accent)]">
                                  {effect.condition}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-[var(--color-text-faint)]">No class advantage effects yet.</div>
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
                        className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 text-sm leading-6 text-[var(--color-text)]">No starter equipment listed.</div>
                )}

                {packItemsInDisplay.length > 0 && (
                  <div className="mb-4 grid gap-3 lg:grid-cols-2">
                    {packItemsInDisplay.map(pack => (
                      <div key={`display-pack-${pack}`} className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-4)] p-3 text-sm leading-6 text-[var(--color-text-soft)]">
                        <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--color-accent)]">
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
                              const available = isEquipmentOptionAvailable(choice.key, option);
                              return (
                                <button
                                  key={option}
                                  onClick={() => {
                                    if (!available) return;
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
                                  disabled={!available}
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                      : available
                                      ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                      : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)] opacity-60'
                                  }`}
                                >
                                  {formatEquipmentOptionLabel(option)}
                                </button>
                              );
                            })}
                          </div>

                          {previewClass?.name === 'Cleric' && choice.key === 'cleric-weapon' && !clericHasMartialWeapons && (
                            <div className="mt-2 text-sm italic text-[var(--color-text-dim)]">
                              Warhammer requires martial weapon proficiency from a domain such as Tempest or War.
                            </div>
                          )}
                          {previewClass?.name === 'Cleric' && choice.key === 'cleric-armor' && !clericHasHeavyArmor && (
                            <div className="mt-2 text-sm italic text-[var(--color-text-dim)]">
                              Chain Mail requires heavy armor proficiency from a domain such as Life, Nature, Tempest, or War.
                            </div>
                          )}

                          {!selectedOption && (
                            <div className="mt-2 text-sm italic text-[var(--color-text-dim)]">
                              Select one of the options above to resolve this equipment choice.
                            </div>
                          )}

                          {selectedPackageParts.length > 1 && (
                            <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-4)] p-3">
                              <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--color-accent)]">
                                This option includes
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedPackageParts.map(part => (
                                  <span
                                    key={`${choice.key}-${part}`}
                                    className="rounded border border-[var(--color-border-faint)] bg-[var(--color-surface-accent)] px-2 py-1 text-[0.72rem] text-[var(--color-text)]"
                                  >
                                    {part}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {packDescription && (
                            <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-4)] p-3 text-sm leading-6 text-[var(--color-text-soft)]">
                              <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--color-accent)]">
                                Pack Contents
                              </div>
                              {packDescription}
                            </div>
                          )}

                          {expandedOptions.length > 0 && (
                            <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-4)] p-3">
                              <div className="mb-2 border-b border-[var(--color-border-muted)] pb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--color-accent)]">
                                Choose a specific item
                              </div>
                              <div className="flex flex-col gap-3">
                                {expandedOptions.map(entry => (
                                  <div key={entry.specificKey}>
                                    <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--color-text-dim)]">
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
                                                ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]'
                                                : 'border-[var(--color-border-muted)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
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
            <div className="section-box flex h-48 items-center justify-center text-sm italic text-[var(--color-text-dim)]">
              Select a class to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
