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
  MONK_TRADITIONS,
  MONK_ELEMENTAL_DISCIPLINES,
  PALADIN_OATHS,
  RANGER_ARCHETYPES,
  RANGER_FAVORED_ENEMY_OPTIONS,
  RANGER_FAVORED_TERRAINS,
  RANGER_HUMANOID_RACE_OPTIONS,
  ROGUE_ARCHETYPES,
  WARLOCK_PACT_LEVEL,
  WARLOCK_PACT_SLOTS,
  WARLOCK_ELDRITCH_INVOCATIONS,
  WARLOCK_PACT_BOONS,
  WARLOCK_PATRONS,
  SORCERER_DRAGON_ANCESTORS,
  SORCERER_METAMAGIC_OPTIONS,
  SORCEROUS_ORIGINS,
  type ClassFeature,
  type NamedDescriptionOption,
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

const WILD_MAGIC_SURGE_REFERENCE = [
  { roll: '01–02', effect: 'Roll on this table at the start of each of your turns for the next minute, ignoring this result on subsequent rolls.' },
  { roll: '03–04', effect: 'For the next minute, you can see any invisible creature if you have line of sight to it.' },
  { roll: '05–06', effect: 'A modron chosen and controlled by the DM appears in an unoccupied space within 5 feet of you, then disappears 1 minute later.' },
  { roll: '07–08', effect: 'You cast fireball as a 3rd-level spell centered on yourself.' },
  { roll: '09–10', effect: 'You cast magic missile as a 5th-level spell.' },
  { roll: '11–12', effect: 'Roll a d10. Your height changes by a number of inches equal to the roll. If the roll is odd, you shrink. If the roll is even, you grow.' },
  { roll: '13–14', effect: 'You cast confusion centered on yourself.' },
  { roll: '15–16', effect: 'For the next minute, you regain 5 hit points at the start of each of your turns.' },
  { roll: '17–18', effect: 'You grow a long beard made of feathers that remains until you sneeze, at which point the feathers explode out from your face.' },
  { roll: '19–20', effect: 'You cast grease centered on yourself.' },
  { roll: '21–22', effect: 'Creatures have disadvantage on saving throws against the next spell you cast in the next minute that involves a saving throw.' },
  { roll: '23–24', effect: 'Your skin turns a vibrant shade of blue. A remove curse spell can end this effect.' },
  { roll: '25–26', effect: 'An eye appears on your forehead for the next minute. During that time, you have advantage on Wisdom (Perception) checks that rely on sight.' },
  { roll: '27–28', effect: 'For the next minute, all your spells with a casting time of 1 action have a casting time of 1 bonus action.' },
  { roll: '29–30', effect: 'You teleport up to 60 feet to an unoccupied space of your choice that you can see.' },
  { roll: '31–32', effect: 'You are transported to the Astral Plane until the end of your next turn, after which time you return to the space you previously occupied or the nearest unoccupied space if that space is occupied.' },
  { roll: '33–34', effect: 'Maximize the damage of the next damaging spell you cast within the next minute.' },
  { roll: '35–36', effect: 'Roll a d10. Your age changes by a number of years equal to the roll. If the roll is odd, you get younger (minimum 1 year old). If the roll is even, you get older.' },
  { roll: '37–38', effect: '1d6 flumphs controlled by the DM appear in unoccupied spaces within 60 feet of you and are frightened of you. They vanish after 1 minute.' },
  { roll: '39–40', effect: 'You regain 2d10 hit points.' },
  { roll: '41–42', effect: 'You turn into a potted plant until the start of your next turn. While a plant, you are incapacitated and have vulnerability to all damage. If you drop to 0 hit points, your pot breaks, and your form reverts.' },
  { roll: '43–44', effect: 'For the next minute, you can teleport up to 20 feet as a bonus action on each of your turns.' },
  { roll: '45–46', effect: 'You cast levitate on yourself.' },
  { roll: '47–48', effect: 'A unicorn controlled by the DM appears in a space within 5 feet of you, then disappears 1 minute later.' },
  { roll: '49–50', effect: 'You can’t speak for the next minute. Whenever you try, pink bubbles float out of your mouth.' },
  { roll: '51–52', effect: 'A spectral shield hovers near you for the next minute, granting you a +2 bonus to AC and immunity to magic missile.' },
  { roll: '53–54', effect: 'You are immune to being intoxicated by alcohol for the next 5d6 days.' },
  { roll: '55–56', effect: 'Your hair falls out but grows back within 24 hours.' },
  { roll: '57–58', effect: 'For the next minute, any flammable object you touch that isn’t being worn or carried by another creature bursts into flame.' },
  { roll: '59–60', effect: 'You regain your lowest-level expended spell slot.' },
  { roll: '61–62', effect: 'For the next minute, you must shout when you speak.' },
  { roll: '63–64', effect: 'You cast fog cloud centered on yourself.' },
  { roll: '65–66', effect: 'Up to three creatures you choose within 30 feet of you take 4d10 lightning damage.' },
  { roll: '67–68', effect: 'You are frightened by the nearest creature until the end of your next turn.' },
  { roll: '69–70', effect: 'Each creature within 30 feet of you becomes invisible for the next minute. The invisibility ends on a creature when it attacks or casts a spell.' },
  { roll: '71–72', effect: 'You gain resistance to all damage for the next minute.' },
  { roll: '73–74', effect: 'A random creature within 60 feet of you becomes poisoned for 1d4 hours.' },
  { roll: '75–76', effect: 'You glow with bright light in a 30-foot radius for the next minute. Any creature that ends its turn within 5 feet of you is blinded until the end of its next turn.' },
  { roll: '77–78', effect: 'You cast polymorph on yourself. If you fail the saving throw, you turn into a sheep for the spell’s duration.' },
  { roll: '79–80', effect: 'Illusory butterflies and flower petals flutter in the air within 10 feet of you for the next minute.' },
  { roll: '81–82', effect: 'You can take one additional action immediately.' },
  { roll: '83–84', effect: 'Each creature within 30 feet of you takes 1d10 necrotic damage. You regain hit points equal to the sum of the necrotic damage dealt.' },
  { roll: '85–86', effect: 'You cast mirror image.' },
  { roll: '87–88', effect: 'You cast fly on a random creature within 60 feet of you.' },
  { roll: '89–90', effect: 'You become invisible for the next minute. During that time, other creatures can’t hear you. The invisibility ends if you attack or cast a spell.' },
  { roll: '91–92', effect: 'If you die within the next minute, you immediately come back to life as if by the reincarnate spell.' },
  { roll: '93–94', effect: 'Your size increases by one size category for the next minute.' },
  { roll: '95–96', effect: 'You and all creatures within 30 feet of you gain vulnerability to piercing damage for the next minute.' },
  { roll: '97–98', effect: 'You are surrounded by faint, ethereal music for the next minute.' },
  { roll: '99–00', effect: 'You regain all expended sorcery points.' },
] as const;

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

const MONK_SHADOW_ARTS_SPELLS = ['Minor Illusion', 'Darkness', 'Darkvision', 'Pass without Trace', 'Silence'];
const RANGER_FAVORED_ENEMY_LANGUAGE_OPTIONS: Record<string, string[]> = {
  Aberrations: ['Deep Speech', 'Undercommon'],
  Beasts: [],
  Celestials: ['Celestial'],
  Constructs: [],
  Dragons: ['Draconic'],
  Elementals: ['Primordial'],
  Fey: ['Elvish', 'Sylvan'],
  Fiends: ['Abyssal', 'Infernal'],
  Giants: ['Giant'],
  Monstrosities: [],
  Oozes: [],
  Plants: [],
  Undead: [],
  'Two Humanoid Races': [],
};
const RANGER_HUMANOID_LANGUAGE_MAP: Record<string, string[]> = {
  Bugbears: ['Goblin'],
  Goblins: ['Goblin'],
  Gnolls: [],
  Hobgoblins: ['Goblin'],
  Kobolds: ['Draconic'],
  Lizardfolk: ['Draconic'],
  Orcs: ['Orc'],
  Sahuagin: [],
  Troglodytes: ['Draconic'],
  Yuanti: ['Abyssal'],
};
const RANGER_HUNTER_PREY_OPTIONS: NamedDescriptionOption[] = [
  { name: 'Colossus Slayer', description: 'Your tenacity can wear down the most potent foes. When you hit a creature with a weapon attack, the creature takes an extra 1d8 damage if it is below its hit point maximum. You can deal this extra damage only once per turn.' },
  { name: 'Giant Killer', description: 'When a Large or larger creature within 5 feet of you hits or misses you with an attack, you can use your reaction to attack that creature immediately after its attack, provided that you can see the creature.' },
  { name: 'Horde Breaker', description: 'Once on each of your turns when you make a weapon attack, you can make another attack with the same weapon against a different creature that is within 5 feet of the original target and within range of your weapon.' },
];
const RANGER_DEFENSIVE_TACTICS_OPTIONS: NamedDescriptionOption[] = [
  { name: 'Escape the Horde', description: 'Opportunity attacks against you are made with disadvantage.' },
  { name: 'Multiattack Defense', description: 'When a creature hits you with an attack, you gain a +4 bonus to AC against all subsequent attacks made by that creature for the rest of the turn.' },
  { name: 'Steel Will', description: 'You have advantage on saving throws against being frightened.' },
];
const RANGER_MULTIATTACK_OPTIONS: NamedDescriptionOption[] = [
  { name: 'Volley', description: 'You can use your action to make a ranged attack against any number of creatures within 10 feet of a point you can see within your weapon’s range. You must have ammunition for each target, as normal, and you make a separate attack roll for each target.' },
  { name: 'Whirlwind Attack', description: 'You can use your action to make a melee attack against any number of creatures within 5 feet of you, with a separate attack roll for each target.' },
];
const RANGER_SUPERIOR_DEFENSE_OPTIONS: NamedDescriptionOption[] = [
  { name: 'Evasion', description: 'When you are subjected to an effect, such as a red dragon’s fiery breath or a lightning bolt spell, that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.' },
  { name: 'Stand Against the Tide', description: 'When a hostile creature misses you with a melee attack, you can use your reaction to force that creature to repeat the same attack against another creature (other than itself) of your choice.' },
  { name: 'Uncanny Dodge', description: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack’s damage against you.' },
];
const WARLOCK_CHAIN_FAMILIAR_FORMS = ['Imp', 'Pseudodragon', 'Quasit', 'Sprite'] as const;

const CLASS_FEATURE_SPELLS: Record<string, SpellDetail[]> = {
  'Shadow Arts': MONK_SHADOW_ARTS_SPELLS.map(spellName => {
    const spell = SPELL_LIST.find(option => option.name === spellName);
    return {
      name: spellName,
      levelLabel:
        spellName === 'Minor Illusion'
          ? 'Cantrip'
          : spell
          ? `${spell.level}${spell.level === 1 ? 'st' : spell.level === 2 ? 'nd' : spell.level === 3 ? 'rd' : 'th'}-level spell`
          : 'Spell',
      description:
        spell?.description ??
        'A shadow art granted by your monastic tradition.',
      ritual: false,
    };
  }),
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

function getMonkMartialArtsDie(level: number): string {
  if (level >= 17) return 'd10';
  if (level >= 11) return 'd8';
  if (level >= 5) return 'd6';
  return 'd4';
}

function getMonkKiPoints(level: number): number {
  return level >= 2 ? level : 0;
}

function getMonkUnarmoredMovementBonus(level: number): number {
  if (level >= 18) return 30;
  if (level >= 14) return 25;
  if (level >= 10) return 20;
  if (level >= 6) return 15;
  if (level >= 2) return 10;
  return 0;
}

function getMonkElementalDisciplineLimit(level: number): number {
  if (level >= 17) return 4;
  if (level >= 11) return 3;
  if (level >= 6) return 2;
  if (level >= 3) return 1;
  return 0;
}

function getRangerFavoredEnemySlots(level: number): number {
  if (level >= 14) return 3;
  if (level >= 6) return 2;
  return level >= 1 ? 1 : 0;
}

function getRangerFavoredTerrainSlots(level: number): number {
  if (level >= 10) return 3;
  if (level >= 6) return 2;
  return level >= 1 ? 1 : 0;
}

function parseHumanoidChoice(value: string | undefined): string[] {
  return (value ?? '').split('|').map(part => part.trim()).filter(Boolean);
}

function getRangerLanguageOptions(choice: string, humanoidValue: string | undefined): string[] {
  if (!choice) return [];
  if (choice === 'Two Humanoid Races') {
    return [...new Set(parseHumanoidChoice(humanoidValue).flatMap(race => RANGER_HUMANOID_LANGUAGE_MAP[race] ?? []))];
  }
  return RANGER_FAVORED_ENEMY_LANGUAGE_OPTIONS[choice] ?? [];
}

function getRogueSneakAttackDice(level: number): string {
  const dice = Math.min(10, Math.ceil(level / 2));
  return `${dice}d6`;
}

function getSorceryPoints(level: number): number {
  return level >= 2 ? level : 0;
}

function getWarlockInvocationLimit(level: number): number {
  if (level >= 18) return 8;
  if (level >= 15) return 7;
  if (level >= 12) return 6;
  if (level >= 9) return 5;
  if (level >= 7) return 4;
  if (level >= 5) return 3;
  if (level >= 2) return 2;
  return 0;
}

function getWarlockMysticArcanumLevels(level: number): number[] {
  const levels: number[] = [];
  if (level >= 11) levels.push(6);
  if (level >= 13) levels.push(7);
  if (level >= 15) levels.push(8);
  if (level >= 17) levels.push(9);
  return levels;
}

function getValidWarlockInvocations(
  invocations: string[],
  level: number,
  pactBoon: string,
  selectedCantrips: string[] = []
): string[] {
  return invocations.filter(name => {
    const invocation = WARLOCK_ELDRITCH_INVOCATIONS.find(option => option.name === name);
    return Boolean(
      invocation &&
        invocation.levelRequired <= level &&
        (!invocation.pactBoonRequired || invocation.pactBoonRequired === pactBoon) &&
        (!invocation.cantripRequired || selectedCantrips.includes(invocation.cantripRequired))
    );
  });
}

function getWarlockInvocationLockReason(
  invocation: (typeof WARLOCK_ELDRITCH_INVOCATIONS)[number],
  level: number,
  pactBoon: string,
  selectedCantrips: string[]
): string | null {
  if (invocation.levelRequired > level) {
    return `Requires warlock level ${invocation.levelRequired}`;
  }
  if (invocation.pactBoonRequired && invocation.pactBoonRequired !== pactBoon) {
    return `Requires ${invocation.pactBoonRequired}`;
  }
  if (invocation.cantripRequired && !selectedCantrips.includes(invocation.cantripRequired)) {
    return `Requires ${invocation.cantripRequired}`;
  }
  return null;
}

function getWarlockInvocationPrerequisiteText(
  invocation: (typeof WARLOCK_ELDRITCH_INVOCATIONS)[number]
): string | null {
  if (invocation.prerequisiteText) return invocation.prerequisiteText;

  const requirements: string[] = [];
  if (invocation.levelRequired > 2) {
    requirements.push(`${invocation.levelRequired}th level`);
  }
  if (invocation.pactBoonRequired) {
    requirements.push(`${invocation.pactBoonRequired} feature`);
  }
  if (invocation.cantripRequired) {
    requirements.push(`${invocation.cantripRequired.toLowerCase()} cantrip`);
  }

  return requirements.length ? requirements.join(', ') : null;
}

function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
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
  features: ClassFeature[],
  state?: WizardState
): { resistances: EffectSummary[]; advantages: EffectSummary[] } {
  if (
    className !== 'Barbarian' &&
    className !== 'Cleric' &&
    className !== 'Druid' &&
    className !== 'Monk' &&
    className !== 'Ranger' &&
    className !== 'Sorcerer' &&
    className !== 'Warlock'
  ) {
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

    if (feature.name === 'Purity of Body') {
      resistances.push({
        label: 'Disease and poison',
      });
    }

    if (feature.name === 'Empty Body') {
      resistances.push({
        label: 'All damage except force',
        condition: 'While Empty Body is active',
      });
    }

    if (feature.name === 'Elemental Affinity') {
      const chosenAncestor = SORCERER_DRAGON_ANCESTORS.find(option => option.name === state?.sorcererDragonAncestor);
      resistances.push({
        label: chosenAncestor ? `${chosenAncestor.damageType} damage` : 'Damage type associated with your draconic ancestry',
        condition: 'When you spend 1 sorcery point after casting a matching spell',
      });
    }

    if (feature.name === 'Beguiling Defenses') {
      advantages.push({
        label: 'You are immune to being charmed',
      });
    }

    if (feature.name === 'Fiendish Resilience') {
      resistances.push({
        label: 'One chosen damage type',
        condition: 'Chosen after a short or long rest',
      });
    }

    if (feature.name === 'Thought Shield') {
      resistances.push({
        label: 'Psychic damage',
      });
    }

    if (feature.name === 'Favored Enemy' || feature.name === 'Favored Enemy (Additional Choice)') {
      const favoredEnemies = state?.rangerFavoredEnemyChoices?.filter(Boolean) ?? [];
      if (favoredEnemies.length) {
        advantages.push({
          label: `Wisdom (Survival) checks to track favored enemies: ${favoredEnemies.join(', ')}`,
        });
        advantages.push({
          label: `Intelligence checks to recall information about favored enemies: ${favoredEnemies.join(', ')}`,
        });
      }
    }

    if (feature.name === "Land's Stride") {
      advantages.push({
        label: 'Saving throws against plants that are magically created or manipulated to impede movement',
      });
    }

    if (feature.name === 'Defensive Tactics' && state?.rangerDefensiveTacticsChoice === 'Steel Will') {
      advantages.push({
        label: 'Saving throws against being frightened',
      });
    }

    if (feature.name === "Superior Hunter's Defense" && state?.rangerSuperiorDefenseChoice === 'Evasion') {
      advantages.push({
        label: 'Dexterity saving throws against effects that allow half damage on a success',
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

function chooseWarlockPactBoon(
  state: WizardState,
  onChange: (patch: Partial<WizardState>) => void,
  boonName: string
) {
  const nextPactBoon = state.warlockPactBoon === boonName ? '' : boonName;
  const nextInvocations = getValidWarlockInvocations(
    state.warlockInvocations,
    state.level,
    nextPactBoon,
    state.selectedCantrips
  );

  onChange({
    warlockPactBoon: nextPactBoon,
    warlockChainFamiliarForm: nextPactBoon === 'Pact of the Chain' ? state.warlockChainFamiliarForm : '',
    warlockTomeCantrips: nextPactBoon === 'Pact of the Tome' ? state.warlockTomeCantrips : [],
    warlockInvocations: nextInvocations,
  });
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

function isMonkTraditionFeature(feature: ClassFeature): boolean {
  return MONK_TRADITIONS.some(tradition =>
    tradition.features.some(traditionFeature => traditionFeature.level === feature.level && traditionFeature.name === feature.name)
  );
}

function isPaladinOathFeature(feature: ClassFeature): boolean {
  return PALADIN_OATHS.some(oath =>
    oath.features.some(
      oathFeature =>
        oathFeature.name === feature.name ||
        feature.name.startsWith(`${oathFeature.name} (`)
    )
  );
}

function isRangerArchetypeFeature(feature: ClassFeature): boolean {
  return RANGER_ARCHETYPES.some(archetype =>
    archetype.features.some(
      archetypeFeature =>
        archetypeFeature.name === feature.name ||
        feature.name.startsWith(`${archetypeFeature.name} (`)
    )
  );
}

function isRogueArchetypeFeature(feature: ClassFeature): boolean {
  return ROGUE_ARCHETYPES.some(archetype =>
    archetype.features.some(
      archetypeFeature =>
        archetypeFeature.name === feature.name ||
        feature.name.startsWith(`${archetypeFeature.name} (`)
    )
  );
}

function isSorcerousOriginFeature(feature: ClassFeature): boolean {
  return SORCEROUS_ORIGINS.some(origin =>
    origin.features.some(
      originFeature =>
        originFeature.name === feature.name ||
        feature.name.startsWith(`${originFeature.name} (`)
    )
  );
}

function isWarlockPatronFeature(feature: ClassFeature): boolean {
  return WARLOCK_PATRONS.some(patron =>
    patron.features.some(
      patronFeature =>
        patronFeature.name === feature.name ||
        feature.name.startsWith(`${patronFeature.name} (`)
    )
  );
}

export default function ClassStep({ state, onChange }: Props) {
  const [magicalSecretsSource, setMagicalSecretsSource] = useState<MagicalSecretsSource>('All');
  const [collapsedSpellGroups, setCollapsedSpellGroups] = useState<Record<string, boolean>>({});
  const [showWildMagicTable, setShowWildMagicTable] = useState(false);
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
      rangerArchetype: '',
      rangerFightingStyle: '',
      rangerFavoredEnemyChoices: [],
      rangerFavoredEnemyHumanoids: [],
      rangerFavoredEnemyLanguages: [],
      rangerFavoredTerrains: [],
      rangerHunterPreyChoice: '',
      rangerDefensiveTacticsChoice: '',
      rangerMultiattackChoice: '',
      rangerSuperiorDefenseChoice: '',
      rogueArchetype: '',
      rogueExpertiseChoices: [],
      sorcerousOrigin: '',
      sorcererDragonAncestor: '',
      sorcererMetamagicChoices: [],
      warlockPatron: '',
      warlockInvocations: [],
      warlockPactBoon: '',
      warlockChainFamiliarForm: '',
      warlockTomeCantrips: [],
      warlockMysticArcanumChoices: [],
      monkTradition: '',
      monkToolProficiency: '',
      monkElementalDisciplines: [],
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
      rogueArchetype: state.rogueArchetype,
    });
    const nextCantripLimit = nextSpellcasting
      ? Math.max(
          0,
          getCantripsKnown(nextSpellcasting, nextLevel) -
            (state.className === 'Rogue' && state.rogueArchetype === 'Arcane Trickster' && nextLevel >= 3 ? 1 : 0)
        )
      : 0;
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
    const nextMonkDisciplineLimit =
      state.className === 'Monk' && state.monkTradition === 'Way of the Four Elements'
        ? getMonkElementalDisciplineLimit(nextLevel)
        : 0;
    const nextMonkElementalDisciplines =
      state.className === 'Monk' && state.monkTradition === 'Way of the Four Elements'
        ? state.monkElementalDisciplines
            .filter(name => {
              const discipline = MONK_ELEMENTAL_DISCIPLINES.find(option => option.name === name);
              return discipline && discipline.levelRequired <= nextLevel && discipline.name !== 'Elemental Attunement';
            })
            .slice(0, nextMonkDisciplineLimit)
        : [];
    const nextRangerFavoredEnemySlots = state.className === 'Ranger' ? getRangerFavoredEnemySlots(nextLevel) : 0;
    const nextRangerFavoredTerrainSlots = state.className === 'Ranger' ? getRangerFavoredTerrainSlots(nextLevel) : 0;
    const nextRogueExpertiseAllowed =
      state.className === 'Rogue'
        ? getClassFeatureTimeline('Rogue', { rogueArchetype: state.rogueArchetype })
            .filter(feature => feature.name === 'Expertise' && feature.level <= nextLevel).length * 2
        : 0;
    const nextSorcererMetamagicAllowed =
      state.className === 'Sorcerer'
        ? nextLevel >= 17
          ? 4
          : nextLevel >= 10
          ? 3
          : nextLevel >= 3
          ? 2
          : 0
        : 0;
    const nextWarlockInvocationLimit =
      state.className === 'Warlock' ? getWarlockInvocationLimit(nextLevel) : 0;
    const nextWarlockMysticArcanumCount =
      state.className === 'Warlock' ? getWarlockMysticArcanumLevels(nextLevel).length : 0;
    const nextWarlockPactBoon =
      state.className === 'Warlock' && nextLevel >= 3 ? state.warlockPactBoon : '';
    const nextWarlockChainFamiliarForm =
      state.className === 'Warlock' && nextWarlockPactBoon === 'Pact of the Chain'
        ? state.warlockChainFamiliarForm
        : '';
    const nextWarlockTomeCantrips =
      state.className === 'Warlock' && nextWarlockPactBoon === 'Pact of the Tome'
        ? state.warlockTomeCantrips.slice(0, 3)
        : [];
    const nextValidWarlockInvocations =
      state.className === 'Warlock'
        ? getValidWarlockInvocations(state.warlockInvocations, nextLevel, nextWarlockPactBoon, state.selectedCantrips).slice(
            0,
            nextWarlockInvocationLimit
          )
        : [];
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
      rangerFightingStyle:
        state.className === 'Ranger' && nextLevel >= 2 ? state.rangerFightingStyle : '',
      rangerFavoredEnemyChoices:
        state.className === 'Ranger' ? state.rangerFavoredEnemyChoices.slice(0, nextRangerFavoredEnemySlots) : [],
      rangerFavoredEnemyHumanoids:
        state.className === 'Ranger' ? state.rangerFavoredEnemyHumanoids.slice(0, nextRangerFavoredEnemySlots) : [],
      rangerFavoredEnemyLanguages:
        state.className === 'Ranger' ? state.rangerFavoredEnemyLanguages.slice(0, nextRangerFavoredEnemySlots) : [],
      rangerFavoredTerrains:
        state.className === 'Ranger' ? state.rangerFavoredTerrains.slice(0, nextRangerFavoredTerrainSlots) : [],
      rangerHunterPreyChoice:
        state.className === 'Ranger' && state.rangerArchetype === 'Hunter' && nextLevel >= 3 ? state.rangerHunterPreyChoice : '',
      rangerDefensiveTacticsChoice:
        state.className === 'Ranger' && state.rangerArchetype === 'Hunter' && nextLevel >= 7 ? state.rangerDefensiveTacticsChoice : '',
      rangerMultiattackChoice:
        state.className === 'Ranger' && state.rangerArchetype === 'Hunter' && nextLevel >= 11 ? state.rangerMultiattackChoice : '',
      rangerSuperiorDefenseChoice:
        state.className === 'Ranger' && state.rangerArchetype === 'Hunter' && nextLevel >= 15 ? state.rangerSuperiorDefenseChoice : '',
      rogueArchetype:
        state.className === 'Rogue' && nextLevel >= 3 ? state.rogueArchetype : '',
      rogueExpertiseChoices:
        state.className === 'Rogue' ? state.rogueExpertiseChoices.slice(0, nextRogueExpertiseAllowed) : [],
      sorcerousOrigin:
        state.className === 'Sorcerer' ? state.sorcerousOrigin : '',
      sorcererDragonAncestor:
        state.className === 'Sorcerer' && state.sorcerousOrigin === 'Draconic Bloodline'
          ? state.sorcererDragonAncestor
          : '',
      sorcererMetamagicChoices:
        state.className === 'Sorcerer'
          ? state.sorcererMetamagicChoices.slice(0, nextSorcererMetamagicAllowed)
          : [],
      warlockPatron:
        state.className === 'Warlock' ? state.warlockPatron : '',
      warlockInvocations: nextValidWarlockInvocations,
      warlockPactBoon:
        nextWarlockPactBoon,
      warlockChainFamiliarForm: nextWarlockChainFamiliarForm,
      warlockTomeCantrips: nextWarlockTomeCantrips,
      warlockMysticArcanumChoices:
        state.className === 'Warlock' ? state.warlockMysticArcanumChoices.slice(0, nextWarlockMysticArcanumCount) : [],
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
      monkElementalDisciplines: nextMonkElementalDisciplines,
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
            rangerArchetype: '',
            rogueArchetype: '',
            rogueExpertiseChoices: [],
            sorcerousOrigin: state.className === 'Sorcerer' ? state.sorcerousOrigin : '',
            sorcererDragonAncestor:
              state.className === 'Sorcerer' && state.sorcerousOrigin === 'Draconic Bloodline'
                ? state.sorcererDragonAncestor
                : '',
            sorcererMetamagicChoices:
              state.className === 'Sorcerer' ? state.sorcererMetamagicChoices.slice(0, nextSorcererMetamagicAllowed) : [],
            warlockPatron: state.className === 'Warlock' ? state.warlockPatron : '',
            warlockInvocations: nextValidWarlockInvocations,
            warlockPactBoon:
              nextWarlockPactBoon,
            warlockChainFamiliarForm: nextWarlockChainFamiliarForm,
            warlockTomeCantrips: nextWarlockTomeCantrips,
            warlockMysticArcanumChoices:
              state.className === 'Warlock' ? state.warlockMysticArcanumChoices.slice(0, nextWarlockMysticArcanumCount) : [],
            monkTradition: '',
            monkElementalDisciplines: [],
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

  const toggleRangerFightingStyle = (style: string) => {
    if (previewClass?.name !== 'Ranger') return;
    onChange({ rangerFightingStyle: state.rangerFightingStyle === style ? '' : style });
  };

  const updateRangerArrayValue = (
    key: 'rangerFavoredEnemyChoices' | 'rangerFavoredEnemyHumanoids' | 'rangerFavoredEnemyLanguages' | 'rangerFavoredTerrains',
    index: number,
    value: string
  ) => {
    const next = [...(state[key] ?? [])];
    next[index] = value;
    while (next.length && !next[next.length - 1]) next.pop();
    onChange({ [key]: next } as Partial<WizardState>);
  };

  const selectRangerFavoredEnemy = (index: number, choice: string) => {
    const current = state.rangerFavoredEnemyChoices[index] ?? '';
    const nextChoice = current === choice ? '' : choice;
    const nextHumanoids = [...state.rangerFavoredEnemyHumanoids];
    const nextLanguages = [...state.rangerFavoredEnemyLanguages];

    if (nextChoice !== 'Two Humanoid Races') {
      nextHumanoids[index] = '';
    }
    if (!nextChoice) {
      nextLanguages[index] = '';
      nextHumanoids[index] = '';
    } else {
      nextLanguages[index] = '';
    }

    const nextChoices = [...state.rangerFavoredEnemyChoices];
    nextChoices[index] = nextChoice;
    while (nextChoices.length && !nextChoices[nextChoices.length - 1]) nextChoices.pop();
    while (nextHumanoids.length && !nextHumanoids[nextHumanoids.length - 1]) nextHumanoids.pop();
    while (nextLanguages.length && !nextLanguages[nextLanguages.length - 1]) nextLanguages.pop();

    onChange({
      rangerFavoredEnemyChoices: nextChoices,
      rangerFavoredEnemyHumanoids: nextHumanoids,
      rangerFavoredEnemyLanguages: nextLanguages,
    });
  };

  const toggleRangerHumanoidRace = (slotIndex: number, race: string) => {
    const current = parseHumanoidChoice(state.rangerFavoredEnemyHumanoids[slotIndex]);
    const selected = current.includes(race);
    let next = current;

    if (selected) {
      next = current.filter(item => item !== race);
    } else if (current.length < 2) {
      next = [...current, race];
    }

    const nextHumanoidValue = next.join('|');
    const validLanguages = getRangerLanguageOptions('Two Humanoid Races', nextHumanoidValue);
    const currentLanguage = state.rangerFavoredEnemyLanguages[slotIndex] ?? '';
    const nextLanguages = [...state.rangerFavoredEnemyLanguages];
    if (currentLanguage && !validLanguages.includes(currentLanguage)) {
      nextLanguages[slotIndex] = '';
    }
    const nextHumanoids = [...state.rangerFavoredEnemyHumanoids];
    nextHumanoids[slotIndex] = nextHumanoidValue;
    while (nextHumanoids.length && !nextHumanoids[nextHumanoids.length - 1]) nextHumanoids.pop();
    while (nextLanguages.length && !nextLanguages[nextLanguages.length - 1]) nextLanguages.pop();
    onChange({
      rangerFavoredEnemyHumanoids: nextHumanoids,
      rangerFavoredEnemyLanguages: nextLanguages,
    });
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

  const toggleRogueExpertise = (proficiency: string) => {
    const current = state.rogueExpertiseChoices;
    if (current.includes(proficiency)) {
      onChange({ rogueExpertiseChoices: current.filter(item => item !== proficiency) });
    } else if (current.length < rogueExpertiseAllowed) {
      onChange({ rogueExpertiseChoices: [...current, proficiency] });
    }
  };

  const toggleSorcererMetamagic = (name: string) => {
    if (state.className !== 'Sorcerer') return;
    const current = state.sorcererMetamagicChoices;
    const limit = level >= 17 ? 4 : level >= 10 ? 3 : level >= 3 ? 2 : 0;
    if (current.includes(name)) {
      onChange({ sorcererMetamagicChoices: current.filter(item => item !== name) });
    } else if (current.length < limit) {
      onChange({ sorcererMetamagicChoices: [...current, name] });
    }
  };

  const toggleWarlockInvocation = (name: string) => {
    if (state.className !== 'Warlock') return;
    const invocation = WARLOCK_ELDRITCH_INVOCATIONS.find(option => option.name === name);
    if (!invocation) return;
    const current = state.warlockInvocations;
    const limit = getWarlockInvocationLimit(level);
    const lockReason = getWarlockInvocationLockReason(invocation, level, state.warlockPactBoon, state.selectedCantrips);
    if (current.includes(name)) {
      onChange({ warlockInvocations: current.filter(item => item !== name) });
    } else if (!lockReason && current.length < limit) {
      onChange({ warlockInvocations: [...current, name] });
    }
  };

  const chooseWarlockMysticArcanum = (spellLevel: number, spellName: string) => {
    if (state.className !== 'Warlock') return;
    const arcanumLevels = getWarlockMysticArcanumLevels(level);
    const index = arcanumLevels.indexOf(spellLevel);
    if (index === -1) return;
    const next = [...state.warlockMysticArcanumChoices];
    next[index] = next[index] === spellName ? '' : spellName;
    onChange({ warlockMysticArcanumChoices: next });
  };

  const toggleWarlockTomeCantrip = (name: string) => {
    if (state.className !== 'Warlock' || state.warlockPactBoon !== 'Pact of the Tome') return;
    const current = state.warlockTomeCantrips;
    if (current.includes(name)) {
      onChange({ warlockTomeCantrips: current.filter(item => item !== name) });
    } else if (current.length < 3) {
      onChange({ warlockTomeCantrips: [...current, name] });
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

  const toggleMonkElementalDiscipline = (name: string) => {
    if (state.className !== 'Monk' || state.monkTradition !== 'Way of the Four Elements') return;
    const current = state.monkElementalDisciplines;
    const limit = getMonkElementalDisciplineLimit(level);
    if (current.includes(name)) {
      onChange({ monkElementalDisciplines: current.filter(item => item !== name) });
    } else if (current.length < limit) {
      onChange({ monkElementalDisciplines: [...current, name] });
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
      const nextSelectedCantrips = current.filter(item => item !== name);
      onChange({
        selectedCantrips: nextSelectedCantrips,
        warlockInvocations:
          state.className === 'Warlock'
            ? getValidWarlockInvocations(state.warlockInvocations, level, state.warlockPactBoon, nextSelectedCantrips).slice(
                0,
                warlockInvocationLimit
              )
            : state.warlockInvocations,
      });
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
        (previewClass?.name === 'Fighter' && state.fighterArchetype === 'Eldritch Knight') ||
        (previewClass?.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster')
      ) {
        const spell = classLevelSpellOptions.find(option => option.name === name);
        if (!spell) return;

        const restrictedSchools =
          previewClass?.name === 'Fighter' ? ['Abjuration', 'Evocation'] : ['Enchantment', 'Illusion'];
        const unrestrictedSpellChoices = [8, 14, 20].filter(levelValue => level >= levelValue).length;
        const selectedUnrestrictedCount = current.filter(selectedName => {
          const selectedSpell = classLevelSpellOptions.find(option => option.name === selectedName);
          return selectedSpell && !restrictedSchools.includes(selectedSpell.school);
        }).length;
        const isRestrictedSchool = restrictedSchools.includes(spell.school);

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
      rangerArchetype: state.rangerArchetype,
      rogueArchetype: state.rogueArchetype,
      sorcerousOrigin: state.sorcerousOrigin,
      warlockPatron: state.warlockPatron,
      monkTradition: state.monkTradition,
      paladinOath: state.paladinOath,
    })
    : [];
  const baseFeatures = features.filter(
    feature =>
      !(previewClass?.name === 'Sorcerer' && feature.name === 'Flexible Casting') &&
      !isBarbarianPathFeature(feature) &&
      !isBardCollegeFeature(feature) &&
      !isClericDomainFeature(feature) &&
      !isDruidCircleFeature(feature) &&
      !isFighterArchetypeFeature(feature) &&
      !isRangerArchetypeFeature(feature) &&
      !isRogueArchetypeFeature(feature) &&
      !isSorcerousOriginFeature(feature) &&
      !isWarlockPatronFeature(feature) &&
      !isMonkTraditionFeature(feature) &&
      !isPaladinOathFeature(feature)
  );
  const unlockedFeatures = features.filter(feature => feature.level <= level);
  const selectedPrimalPath = BARBARIAN_PRIMAL_PATHS.find(path => path.name === state.barbarianPath);
  const selectedBardCollege = BARD_COLLEGES.find(college => college.name === state.bardCollege);
  const selectedClericDomain = CLERIC_DOMAINS.find(domain => domain.name === state.clericDomain);
  const selectedDruidCircle = DRUID_CIRCLES.find(circle => circle.name === state.druidCircle);
  const selectedFighterArchetype = FIGHTER_ARCHETYPES.find(archetype => archetype.name === state.fighterArchetype);
  const selectedRangerArchetype = RANGER_ARCHETYPES.find(archetype => archetype.name === state.rangerArchetype);
  const selectedRogueArchetype = ROGUE_ARCHETYPES.find(archetype => archetype.name === state.rogueArchetype);
  const selectedSorcerousOrigin = SORCEROUS_ORIGINS.find(origin => origin.name === state.sorcerousOrigin);
  const selectedWarlockPatron = WARLOCK_PATRONS.find(patron => patron.name === state.warlockPatron);
  const selectedMonkTradition = MONK_TRADITIONS.find(tradition => tradition.name === state.monkTradition);
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
  const classEffects = getCombinedFeatureEffects(previewClass?.name ?? '', unlockedFeatures, state);
  const bardCollegeFeatures = selectedBardCollege?.features ?? [];
  const clericDomainFeatures = selectedClericDomain?.features ?? [];
  const druidCircleFeatures = selectedDruidCircle?.features ?? [];
  const fighterArchetypeFeatures = selectedFighterArchetype?.features ?? [];
  const rangerArchetypeFeatures = selectedRangerArchetype?.features ?? [];
  const rogueArchetypeFeatures = selectedRogueArchetype?.features ?? [];
  const sorcerousOriginFeatures = selectedSorcerousOrigin?.features ?? [];
  const warlockPatronFeatures = selectedWarlockPatron?.features ?? [];
  const monkTraditionFeatures = selectedMonkTradition?.features ?? [];
  const monkElementalDisciplineLimit =
    state.className === 'Monk' && state.monkTradition === 'Way of the Four Elements'
      ? getMonkElementalDisciplineLimit(level)
      : 0;
  const availableMonkElementalDisciplines = MONK_ELEMENTAL_DISCIPLINES.filter(
    discipline => discipline.name !== 'Elemental Attunement'
  ).sort((a, b) => a.name.localeCompare(b.name));
  const selectedMonkElementalDisciplineDetails = state.monkElementalDisciplines
    .map(name => MONK_ELEMENTAL_DISCIPLINES.find(option => option.name === name))
    .filter((discipline): discipline is (typeof MONK_ELEMENTAL_DISCIPLINES)[number] => Boolean(discipline))
    .sort((a, b) => a.levelRequired - b.levelRequired || a.name.localeCompare(b.name));
  const paladinOathFeatures = selectedPaladinOath
    ? features.filter(feature => isPaladinOathFeature(feature))
    : [];
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
  const clericDomainAdditionalProficiencies =
    previewClass?.name === 'Cleric'
      ? [
          ...(clericHasHeavyArmor ? ['Heavy Armor'] : []),
          ...(clericHasMartialWeapons ? ['Martial Weapons'] : []),
        ]
      : [];
  const armorWeaponProficiencies = previewClass
    ? [
        ...previewClass.armorProf,
        ...previewClass.weaponProf,
      ]
    : [];
  const toolProficiencies = previewClass
    ? [
        ...((previewClass.toolProf ?? []).filter(item => item !== 'Three musical instruments of your choice' && item !== "One type of artisan's tools or one musical instrument")),
        ...(previewClass.name === 'Bard' ? state.bardInstrumentChoices : []),
        ...(previewClass.name === 'Monk' && state.monkToolProficiency ? [state.monkToolProficiency] : []),
        ...(previewClass.name === 'Fighter' && state.fighterStudentOfWarTool ? [state.fighterStudentOfWarTool] : []),
      ]
    : [];
  const availableClericNatureCantrips = CLERIC_NATURE_CANTRIP_OPTIONS.filter(
    spell => spell.name !== 'Light' || state.clericDomain !== 'Light Domain'
  );
  const bardExpertiseAllowed = state.className === 'Bard'
    ? unlockedFeatures.filter(feature => feature.name === 'Expertise').length * 2
    : 0;
  const rogueExpertiseAllowed = state.className === 'Rogue'
    ? unlockedFeatures.filter(feature => feature.name === 'Expertise').length * 2
    : 0;
  const rogueExpertiseOptions =
    state.className === 'Rogue'
      ? [...new Set([
          ...allCurrentSkillProficiencies,
          ...(previewClass?.toolProf.includes("Thieves' Tools") ? ["Thieves' Tools"] : []),
        ])]
      : [];
  const bardMagicalSecretsAllowed = state.className === 'Bard'
    ? unlockedFeatures.filter(feature => feature.name === 'Magical Secrets').length * 2
    : 0;
  const bardAdditionalMagicalSecretsAllowed =
    state.className === 'Bard' && state.bardCollege === 'College of Lore' && level >= 6 ? 2 : 0;
  const finalScores = getFinalAbilityScores(state);
  const monkKiSaveDC =
    previewClass?.name === 'Monk' && level >= 2 ? 8 + profBonus + getAbilityModifier(finalScores.wis) : 0;
  const rogueDeathStrikeDC =
    previewClass?.name === 'Rogue' && state.rogueArchetype === 'Assassin' && level >= 17
      ? 8 + profBonus + getAbilityModifier(finalScores.dex)
      : 0;
  const sorceryPointCount = previewClass?.name === 'Sorcerer' ? getSorceryPoints(level) : 0;
  const warlockInvocationLimit = previewClass?.name === 'Warlock' ? getWarlockInvocationLimit(level) : 0;
  const warlockMysticArcanumLevels = previewClass?.name === 'Warlock' ? getWarlockMysticArcanumLevels(level) : [];
  const spellcasting = previewClass
    ? getEffectiveSpellcasting(previewClass.name, {
        fighterArchetype: state.fighterArchetype,
        rogueArchetype: state.rogueArchetype,
      })
    : undefined;
  const spellcastingAbilityMod = spellcasting ? Math.floor(((finalScores[spellcasting.ability] ?? 10) - 10) / 2) : 0;
  const spellSaveDC = spellcasting ? 8 + profBonus + spellcastingAbilityMod : 0;
  const spellAttackBonus = spellcastingAbilityMod + profBonus;
  const spellSlots =
    previewClass?.name === 'Warlock'
      ? (() => {
          const slots = Array(9).fill(0);
          const pactLevel = WARLOCK_PACT_LEVEL[level - 1] ?? 1;
          slots[pactLevel - 1] = WARLOCK_PACT_SLOTS[level - 1] ?? 1;
          return slots;
        })()
      : spellcasting
      ? getSlotsAtLevel(spellcasting, level)
      : [];
  const maxSpellLevel =
    previewClass?.name === 'Warlock'
      ? WARLOCK_PACT_LEVEL[level - 1] ?? 1
      : spellSlots.length
      ? spellSlots.reduce((highest, count, index) => (count > 0 ? index + 1 : highest), 0)
      : 0;
  const cantripAllowance = spellcasting
    ? Math.max(
        0,
        getCantripsKnown(spellcasting, level) -
          (previewClass?.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster' && level >= 3 ? 1 : 0)
      )
    : 0;
  const baseSpellAllowance = spellcasting ? (spellcasting.prepares
    ? Math.max(1, spellcastingAbilityMod + (spellcasting.type === 'half' ? Math.max(1, Math.ceil(level / 2)) : level))
    : getSpellsKnown(spellcasting, level)) : 0;
  const totalSpellAllowance =
    previewClass?.name === 'Bard' ? baseSpellAllowance + bardAdditionalMagicalSecretsAllowed : baseSpellAllowance;
  const reservedMagicalSecretsSlots = previewClass?.name === 'Bard' ? bardMagicalSecretsAllowed : 0;
  const spellAllowance = Math.max(0, baseSpellAllowance - reservedMagicalSecretsSlots);
  const spellListClass = spellcasting ? SPELL_LIST_CLASS_MAP[spellcasting.spellListKey] : '';
  const warlockExpandedSpellNames =
    previewClass?.name === 'Warlock' && selectedWarlockPatron?.bonusSpells
      ? selectedWarlockPatron.bonusSpells
          .filter(entry => entry.level <= Math.max(1, maxSpellLevel))
          .flatMap(entry => entry.spells)
      : [];
  const selectedWarlockPatronSpellDetails =
    previewClass?.name === 'Warlock' && selectedWarlockPatron?.bonusSpells
      ? selectedWarlockPatron.bonusSpells
          .flatMap(entry => entry.spells)
          .map(name => SPELL_LIST.find(spell => spell.name === name))
          .filter((spell): spell is (typeof SPELL_LIST)[number] => Boolean(spell))
      : [];
  const warlockFindFamiliarSpellDetails =
    previewClass?.name === 'Warlock' && state.warlockPactBoon === 'Pact of the Chain'
      ? SPELL_LIST.filter(spell => spell.name === 'Find Familiar')
      : [];
  const classSpellOptions =
    spellcasting && spellListClass
      ? SPELL_LIST.filter(
          spell => spell.classes.includes(spellListClass) || (previewClass?.name === 'Warlock' && warlockExpandedSpellNames.includes(spell.name))
        )
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
  const visibleWarlockInvocations =
    previewClass?.name === 'Warlock'
      ? [...WARLOCK_ELDRITCH_INVOCATIONS].sort((a, b) => a.name.localeCompare(b.name))
      : [];
  const warlockMysticArcanumOptions = warlockMysticArcanumLevels.map(spellLevel =>
    SPELL_LIST.filter(spell => spell.classes.includes('Warlock') && spell.level === spellLevel)
  );
  const warlockTomeCantripOptions =
    previewClass?.name === 'Warlock'
      ? SPELL_LIST.filter(
          spell =>
            spell.level === 0 &&
            (!state.selectedCantrips.includes(spell.name) || state.warlockTomeCantrips.includes(spell.name))
        )
      : [];
  const shadowArtsSpellDetails =
    selectedMonkTradition?.name === 'Way of Shadow'
      ? SPELL_LIST.filter(spell => MONK_SHADOW_ARTS_SPELLS.includes(spell.name)).sort(
          (a, b) => a.level - b.level || a.name.localeCompare(b.name)
        )
      : [];
  const classCantripOptions = classSpellOptions.filter(
    spell =>
      spell.level === 0 &&
      !(previewClass?.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster' && spell.name === 'Mage Hand') &&
      !(previewClass?.name === 'Warlock' && state.warlockTomeCantrips.includes(spell.name))
  );
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
  const arcaneTricksterFreeSchoolChoices =
    previewClass?.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster'
      ? [8, 14, 20].filter(levelValue => level >= levelValue).length
      : 0;
  const arcaneTricksterSelectedFreeSchoolChoices =
    previewClass?.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster'
      ? state.selectedSpells.filter(name => {
          const spell = classLevelSpellOptions.find(option => option.name === name);
          return spell && !['Enchantment', 'Illusion'].includes(spell.school);
        }).length
      : 0;
  const arcaneTricksterSelectedMeta =
    previewClass?.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster'
      ? Object.fromEntries(
          state.selectedSpells.map(name => {
            const spell = classLevelSpellOptions.find(option => option.name === name);
            return [
              name,
              spell && !['Enchantment', 'Illusion'].includes(spell.school)
                ? 'Any-school spell'
                : 'Enchantment/Illusion',
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
  const rangerFavoredEnemySlotCount =
    previewClass?.name === 'Ranger' ? getRangerFavoredEnemySlots(level) : 0;
  const rangerFavoredTerrainSlotCount =
    previewClass?.name === 'Ranger' ? getRangerFavoredTerrainSlots(level) : 0;
  const bardSecretSelectedNames = [...state.bardMagicalSecretChoices, ...state.bardAdditionalMagicalSecretChoices];
  const sorcererMetamagicAllowed =
    previewClass?.name === 'Sorcerer'
      ? level >= 17
        ? 4
        : level >= 10
        ? 3
        : level >= 3
        ? 2
        : 0
      : 0;
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
    if (feature.name === 'Martial Arts') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      const intro = paragraphs[0] ?? '';
      const benefits = paragraphs.slice(1, 4);
      const ending = paragraphs[4] ?? '';

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Martial Arts
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{intro}</p>
            <div>
              <p className="mb-2">You gain the following benefits while you are unarmed or wielding only monk weapons and you aren&apos;t wearing armor or wielding a shield:</p>
              <ul className="list-disc space-y-2 pl-6">
                {benefits.map((benefit, index) => (
                  <li key={`martial-arts-${index}`}>{benefit.replace(/^•\s*/, '')}</li>
                ))}
              </ul>
            </div>
            {ending && <p>{ending}</p>}
          </div>
        </div>
      );
    }

    if (feature.name === 'Ki') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      const [intro, spend, startKnowing, regain, saveDcIntro, saveDcFormula] = paragraphs;
      const sections = [
        { title: 'FLURRY OF BLOWS', body: paragraphs[7] ?? '' },
        { title: 'PATIENT DEFENSE', body: paragraphs[9] ?? '' },
        { title: 'STEP OF THE WIND', body: paragraphs[11] ?? '' },
      ];

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Ki
          </div>
          <div className="mt-3 space-y-4 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{intro}</p>
            <p>{spend}</p>
            <p>{startKnowing}</p>
            <p>{regain}</p>
            <div>
              <p>{saveDcIntro}</p>
              <div className="mt-2 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] px-3 py-2 text-sm font-bold text-[var(--color-text-strong)]">
                {saveDcFormula}
              </div>
            </div>
            {sections.map(section => (
              <div key={section.title}>
                <div className="text-lg font-bold uppercase tracking-[0.14em] text-[var(--color-text-strong)]">{section.title}</div>
                <p className="mt-1">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (feature.name === 'Open Hand Technique') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      const intro = paragraphs[0] ?? '';
      const bullets = paragraphs.slice(1);

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Open Hand Technique
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{intro}</p>
            <ul className="list-disc space-y-2 pl-6">
              {bullets.map((bullet, index) => (
                <li key={`open-hand-technique-${index}`}>{bullet.replace(/^•\s*/, '')}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (feature.name === 'Disciple of the Elements') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      const maxKiRows = [
        { levels: '5th–8th', max: '3' },
        { levels: '9th–12th', max: '4' },
        { levels: '13th–16th', max: '5' },
        { levels: '17th–20th', max: '6' },
      ];

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Disciple of the Elements
          </div>
          <div className="mt-3 space-y-4 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{paragraphs[0]}</p>
            <p>{paragraphs[1]}</p>
            <p>{paragraphs[2]}</p>
            <div>
              <div className="text-lg font-bold italic text-[var(--color-text-strong)]">Casting Elemental Spells.</div>
              <p className="mt-1">{paragraphs[3]}</p>
              <p className="mt-3">{paragraphs[4]}</p>
              <p className="mt-3">{paragraphs[5]}</p>
            </div>
            <div className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-accent)] p-3">
              <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Spells and Ki Points
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-[var(--color-text-soft)]">
                <div className="font-bold text-[var(--color-text-strong)]">Monk Levels</div>
                <div className="font-bold text-[var(--color-text-strong)]">Maximum Ki Points for a Spell</div>
                {maxKiRows.map(row => (
                  <div key={`monk-ki-table-${row.levels}`} className="contents">
                    <div>{row.levels}</div>
                    <div>{row.max}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

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

    if (feature.name === 'Sacred Oath') {
      const paragraphs = feature.description
        .split('\n\n')
        .map(part => part.trim())
        .filter(Boolean);
      const headingIndexes = paragraphs.reduce<Record<string, number>>((acc, paragraph, index) => {
        if (paragraph === 'OATH SPELLS' || paragraph === 'CHANNEL DIVINITY') {
          acc[paragraph] = index;
        }
        return acc;
      }, {});
      const oathSpellsIndex = headingIndexes['OATH SPELLS'];
      const channelDivinityIndex = headingIndexes['CHANNEL DIVINITY'];
      const introEnd = oathSpellsIndex ?? paragraphs.length;
      const introBlocks = paragraphs.slice(0, introEnd);
      const oathSpellsBody =
        oathSpellsIndex !== undefined && paragraphs[oathSpellsIndex + 1]
          ? paragraphs[oathSpellsIndex + 1]
          : '';
      const channelDivinityBody =
        channelDivinityIndex !== undefined && paragraphs[channelDivinityIndex + 1]
          ? paragraphs[channelDivinityIndex + 1]
          : '';

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="mt-1 space-y-4 text-[0.98rem] leading-7 text-[var(--color-text-soft)]">
            {introBlocks.map((paragraph, index) => (
              <p key={`sacred-oath-intro-${index}`}>{paragraph}</p>
            ))}

            {oathSpellsBody && (
              <div>
                <div className="text-lg font-bold uppercase tracking-[0.14em] text-[var(--color-text-strong)]">
                  Oath Spells
                </div>
                <p className="mt-2">{oathSpellsBody}</p>
              </div>
            )}

            {channelDivinityBody && (
              <div>
                <div className="text-lg font-bold uppercase tracking-[0.14em] text-[var(--color-text-strong)]">
                  Channel Divinity
                </div>
                <p className="mt-2">{channelDivinityBody}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (feature.name === 'Elder Champion') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      const intro = paragraphs[0] ?? '';
      const transform = paragraphs[1] ?? '';
      const bullets = paragraphs.slice(2, 5);
      const ending = paragraphs[5] ?? '';

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Elder Champion
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{intro}</p>
            <p>{transform}</p>
            <ul className="list-disc space-y-2 pl-6">
              {bullets.map((bullet, index) => (
                <li key={`elder-champion-${index}`}>{bullet.replace(/^•\s*/, '')}</li>
              ))}
            </ul>
            {ending && <p>{ending}</p>}
          </div>
        </div>
      );
    }

    if (feature.name === 'Avenging Angel') {
      const paragraphs = normalizeFeatureParagraphs(feature.description);
      const intro = paragraphs[0] ?? '';
      const transform = paragraphs[1] ?? '';
      const bullets = paragraphs.slice(2, 4);
      const ending = paragraphs[4] ?? '';

      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Avenging Angel
          </div>
          <div className="mt-3 space-y-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>{intro}</p>
            <p>{transform}</p>
            <ul className="list-disc space-y-2 pl-6">
              {bullets.map((bullet, index) => (
                <li key={`avenging-angel-${index}`}>{bullet.replace(/^•\s*/, '')}</li>
              ))}
            </ul>
            {ending && <p>{ending}</p>}
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

    if (feature.name === 'Font of Magic') {
      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Font of Magic
          </div>
          <div className="mt-3 space-y-4 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">
            <p>At 2nd level, you tap into a deep wellspring of magic within yourself. This wellspring is represented by sorcery points, which allow you to create a variety of magical effects.</p>
            <div>
              <div className="text-lg font-bold uppercase tracking-[0.18em] text-[var(--color-text-strong)]">Sorcery Points</div>
              <p className="mt-1">You have 2 sorcery points, and you gain more as you reach higher levels, as shown in the Sorcery Points column of the Sorcerer table. You can never have more sorcery points than shown on the table for your level. You regain all spent sorcery points when you finish a long rest.</p>
            </div>
            <div>
              <div className="text-lg font-bold uppercase tracking-[0.18em] text-[var(--color-text-strong)]">Flexible Casting</div>
              <p className="mt-1">You can use your sorcery points to gain additional spell slots, or sacrifice spell slots to gain additional sorcery points. You learn other ways to use your sorcery points as you reach higher levels.</p>
            </div>
            <div>
              <div className="text-lg font-bold italic text-[var(--color-text-strong)]">Creating Spell Slots.</div>
              <p className="mt-1">You can transform unexpended sorcery points into one spell slot as a bonus action on your turn. The Creating Spell Slots table shows the cost of creating a spell slot of a given level. You can create spell slots no higher in level than 5th.</p>
              <div className="mt-3 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-3">
                <div className="text-lg font-bold uppercase tracking-[0.18em] text-[var(--color-text-strong)]">Creating Spell Slots</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="font-bold text-[var(--color-text-strong)]">Spell Slot Level</div>
                  <div className="font-bold text-[var(--color-text-strong)]">Sorcery Point Cost</div>
                  <div>1st</div><div>2</div>
                  <div>2nd</div><div>3</div>
                  <div>3rd</div><div>5</div>
                  <div>4th</div><div>6</div>
                  <div>5th</div><div>7</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold italic text-[var(--color-text-strong)]">Converting a Spell Slot to Sorcery Points.</div>
              <p className="mt-1">As a bonus action on your turn, you can expend one spell slot and gain a number of sorcery points equal to the slot’s level.</p>
            </div>
          </div>
        </div>
      );
    }

    if (previewClass?.name === 'Sorcerer' && feature.name === 'Spellcasting') {
      return (
        <div className={`mt-2 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4 ${unlocked ? '' : 'opacity-70'}`}>
          <div className="border-b border-[var(--color-border-strong)] pb-2 text-lg font-bold uppercase tracking-[0.22em] text-[var(--color-text-strong)]">
            Spellcasting
          </div>
          <p className="mt-3 text-[0.98rem] leading-8 text-[var(--color-text-soft)]">{feature.description}</p>
        </div>
      );
    }

    return (
      <>
        <p className={`mt-1 whitespace-pre-line text-[0.98rem] leading-7 ${unlocked ? 'text-[var(--color-text-soft)]' : 'text-[var(--color-text-faint)]'}`}>{feature.description}</p>
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

  const renderMonkDisciplineCards = () => {
    if (selectedMonkTradition?.name !== 'Way of the Four Elements') return null;

    return (
      <div className="mt-4 space-y-4">
        <div>
          <div className="section-title">Elemental Disciplines</div>
          <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
            You automatically know <span className="font-bold text-[var(--color-text-strong)]">Elemental Attunement</span>. Choose additional disciplines here. ({state.monkElementalDisciplines.length}/{monkElementalDisciplineLimit})
          </div>
          <div className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3">
            <div className="text-sm font-bold text-[var(--color-text-strong)]">Elemental Attunement</div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
              {MONK_ELEMENTAL_DISCIPLINES.find(discipline => discipline.name === 'Elemental Attunement')?.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {availableMonkElementalDisciplines.map(discipline => {
            const selected = state.monkElementalDisciplines.includes(discipline.name);
            const unlockedByLevel = level >= discipline.levelRequired;
            const canAdd = state.monkElementalDisciplines.length < monkElementalDisciplineLimit;
            return (
              <button
                key={`monk-discipline-${discipline.name}`}
                onClick={() => toggleMonkElementalDiscipline(discipline.name)}
                disabled={!unlockedByLevel || (!selected && !canAdd)}
                className={`rounded border p-3 text-left transition-all ${
                  selected
                    ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                    : !unlockedByLevel || !canAdd
                    ? 'cursor-not-allowed border-[var(--color-border-subtle)] bg-[var(--color-surface-accent)] text-[var(--color-text-dim)]'
                    : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-[var(--color-text-strong)]">{discipline.name}</div>
                  <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-text-dim)]">
                    {discipline.levelRequired > 3 ? `Level ${discipline.levelRequired}` : 'Level 3'}
                  </div>
                </div>
                <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                  {discipline.kiCost > 0 ? `${discipline.kiCost} ki point${discipline.kiCost === 1 ? '' : 's'}` : 'At-will discipline'}
                </div>
                <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{discipline.description}</div>
                {!unlockedByLevel && (
                  <div className="mt-2 text-xs leading-5 text-[var(--color-text-dim)]">
                    Unlocks at monk level {discipline.levelRequired}.
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedMonkElementalDisciplineDetails.length > 0 && (
          <div>
            <div className="section-title">Chosen Disciplines</div>
            <div className="grid gap-3 xl:grid-cols-2">
              {selectedMonkElementalDisciplineDetails.map(discipline => {
                const spell = discipline.spellName
                  ? SPELL_LIST.find(option => option.name === discipline.spellName)
                  : undefined;
                return (
                  <div
                    key={`chosen-monk-discipline-${discipline.name}`}
                    className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-[var(--color-text-strong)]">{discipline.name}</div>
                      <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                        {discipline.kiCost} ki point{discipline.kiCost === 1 ? '' : 's'}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{discipline.description}</p>
                    {spell && (
                      <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{spell.name}</div>
                          <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                            Level {spell.level}
                          </div>
                        </div>
                        <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-text-dim)]">
                          {spell.school} · {spell.castingTime} · {spell.range}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{spell.description}</p>
                        {spell.upcast && (
                          <p className="mt-2 text-xs leading-5 text-[var(--color-spell-strong)]">{spell.upcast}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
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

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="stat-box">
                  <div className="text-base font-bold">{level} d{previewClass.hitDie}</div>
                  <div className="field-label">Hit Dice</div>
                </div>
                <div className="stat-box">
                  <div className="text-sm font-bold">{previewClass.primaryAbility}</div>
                  <div className="field-label">Primary Ability</div>
                </div>
                <div className="stat-box">
                  <div className="text-sm font-bold text-[var(--color-text-strong)]">{previewClass.savingThrows.map(s => ABILITY_NAMES[s]).join(' & ')}</div>
                  <div className="field-label">Saving Throw Proficiencies</div>
                </div>
                <div className="stat-box">
                  <div className="text-base font-bold">+{profBonus}</div>
                  <div className="field-label">Prof Bonus</div>
                </div>
              </div>

              {previewClass.name === 'Monk' && (
                <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 md:grid-cols-4">
                  <div className="stat-box">
                    <div className="text-base font-bold">{getMonkMartialArtsDie(level)}</div>
                    <div className="field-label">Martial Arts Die</div>
                  </div>
                  <div className="stat-box">
                    <div className="text-base font-bold">{getMonkKiPoints(level)}</div>
                    <div className="field-label">Ki Points</div>
                  </div>
                  <div className="stat-box">
                    <div className="text-base font-bold">{level >= 2 ? monkKiSaveDC : '—'}</div>
                    <div className="field-label">Ki Save DC</div>
                  </div>
                  <div className="stat-box">
                    <div className="text-base font-bold">{getMonkUnarmoredMovementBonus(level) > 0 ? `+${getMonkUnarmoredMovementBonus(level)} ft` : '—'}</div>
                    <div className="field-label">Unarmored Movement</div>
                  </div>
                </div>
              )}

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

              {previewClass.name === 'Rogue' && (
                <div className={`mx-auto grid w-full gap-2 ${rogueDeathStrikeDC ? 'max-w-xl grid-cols-1 md:grid-cols-2' : 'max-w-xs grid-cols-1'}`}>
                  <div className="stat-box">
                    <div className="text-base font-bold">{getRogueSneakAttackDice(level)}</div>
                    <div className="field-label">Sneak Attack</div>
                  </div>
                  {rogueDeathStrikeDC ? (
                    <div className="stat-box">
                      <div className="text-base font-bold">{rogueDeathStrikeDC}</div>
                      <div className="field-label">Death Strike Save DC</div>
                    </div>
                  ) : null}
                </div>
              )}

              {previewClass.name === 'Sorcerer' && (
                <div className="mx-auto grid w-full max-w-xs grid-cols-1 gap-2">
                  <div className="stat-box">
                    <div className="text-base font-bold">{sorceryPointCount > 0 ? sorceryPointCount : '—'}</div>
                    <div className="field-label">Sorcery Points</div>
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
                        {previewClass.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster' && (
                          <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-accent)] p-3 text-sm leading-6 text-[var(--color-text-soft)]">
                            You automatically know <span className="font-bold text-[var(--color-text-strong)]">Mage Hand</span>, so the cantrip picker below is for your remaining wizard cantrips.
                            Most Arcane Trickster spells must be from the <span className="font-bold text-[var(--color-text-strong)]">Enchantment</span> or <span className="font-bold text-[var(--color-text-strong)]">Illusion</span> schools.
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
                        {previewClass.name === 'Rogue' && state.rogueArchetype === 'Arcane Trickster' && (
                          <div className="mb-3 text-sm leading-6 text-[var(--color-spell-text)]">
                            Any-school spell choices used {arcaneTricksterSelectedFreeSchoolChoices}/{arcaneTricksterFreeSchoolChoices}. All other known spells must be Enchantment or Illusion.
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
                          eldritchKnightSelectedMeta ?? arcaneTricksterSelectedMeta,
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

              {previewClass.name === 'Monk' && state.className === 'Monk' && (
                <div>
                  <div className="mb-1 field-label">Choose Tool Proficiency (1/1)</div>
                  <div className="flex flex-wrap gap-2">
                    {[...ARTISAN_TOOL_OPTIONS, ...MUSICAL_INSTRUMENTS].map(option => {
                      const selected = state.monkToolProficiency === option;
                      return (
                        <button
                          key={`monk-tool-${option}`}
                          onClick={() => onChange({ monkToolProficiency: selected ? '' : option })}
                          className={`rounded border px-3 py-1 text-xs transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                              : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          {option}
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

              {previewClass.name === 'Sorcerer' && sorcererMetamagicAllowed > 0 && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">
                    Metamagic Choices ({state.sorcererMetamagicChoices.length}/{sorcererMetamagicAllowed})
                  </div>
                  <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                    Choose your Metamagic options.
                  </div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {SORCERER_METAMAGIC_OPTIONS.map(option => {
                      const selected = state.sorcererMetamagicChoices.includes(option.name);
                      const canAdd = state.sorcererMetamagicChoices.length < sorcererMetamagicAllowed;
                      return (
                        <button
                          key={`metamagic-${option.name}`}
                          onClick={() => toggleSorcererMetamagic(option.name)}
                          disabled={!selected && !canAdd}
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : canAdd
                              ? 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                              : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{option.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {previewClass.name === 'Ranger' && state.className === 'Ranger' && (
                <div className="space-y-4">
                  <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                    <div className="section-title">Favored Enemy Choices</div>
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Choose your favored enemies and an associated language, if that enemy speaks one at all.
                    </div>
                    <div className="space-y-4">
                      {Array.from({ length: rangerFavoredEnemySlotCount }, (_, index) => {
                        const currentChoice = state.rangerFavoredEnemyChoices[index] ?? '';
                        const currentHumanoids = parseHumanoidChoice(state.rangerFavoredEnemyHumanoids[index]);
                        const currentLanguage = state.rangerFavoredEnemyLanguages[index] ?? '';
                        const unlockLevel = index === 0 ? 1 : index === 1 ? 6 : 14;
                        const usedOtherChoices = new Set(
                          (state.rangerFavoredEnemyChoices ?? []).filter((choice, choiceIndex) => choiceIndex !== index && Boolean(choice))
                        );
                        const usedOtherHumanoids = new Set(
                          (state.rangerFavoredEnemyHumanoids ?? [])
                            .flatMap((value, humanoidIndex) => (
                              humanoidIndex === index ? [] : parseHumanoidChoice(value)
                            ))
                        );
                        const availableLanguages = getRangerLanguageOptions(currentChoice, state.rangerFavoredEnemyHumanoids[index]);
                        return (
                          <div key={`ranger-favored-enemy-${index}`} className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="text-sm font-bold text-[var(--color-text-strong)]">
                                Favored Enemy {index + 1}
                              </div>
                              <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                                Unlocks at level {unlockLevel}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {RANGER_FAVORED_ENEMY_OPTIONS.filter(
                                option => !usedOtherChoices.has(option) || currentChoice === option
                              ).map(option => {
                                const selected = currentChoice === option;
                                return (
                                  <button
                                    key={`ranger-enemy-${index}-${option}`}
                                    onClick={() => selectRangerFavoredEnemy(index, option)}
                                    className={`rounded border px-3 py-1 text-xs transition-all ${
                                      selected
                                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                        : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                    }`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>

                            {currentChoice === 'Two Humanoid Races' && (
                              <div className="mt-3">
                                <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                                  Choose Two Humanoid Races ({currentHumanoids.length}/2)
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {RANGER_HUMANOID_RACE_OPTIONS.map(option => {
                                    const selected = currentHumanoids.includes(option);
                                    const canAdd = currentHumanoids.length < 2;
                                    const alreadyTaken = usedOtherHumanoids.has(option) && !selected;
                                    return (
                                      <button
                                        key={`ranger-humanoid-${index}-${option}`}
                                        onClick={() => toggleRangerHumanoidRace(index, option)}
                                        disabled={alreadyTaken || (!selected && !canAdd)}
                                        className={`rounded border px-3 py-1 text-xs transition-all ${
                                          selected
                                            ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                            : alreadyTaken || !canAdd
                                            ? 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                                            : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {currentChoice && (
                              <div className="mt-3">
                                <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                                  Associated Language
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => updateRangerArrayValue('rangerFavoredEnemyLanguages', index, '')}
                                    className={`rounded border px-3 py-1 text-xs transition-all ${
                                      !currentLanguage
                                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                        : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                    }`}
                                  >
                                    No Spoken Language
                                  </button>
                                  {availableLanguages.map(language => {
                                    const selected = currentLanguage === language;
                                    return (
                                      <button
                                        key={`ranger-language-${index}-${language}`}
                                        onClick={() => updateRangerArrayValue('rangerFavoredEnemyLanguages', index, selected ? '' : language)}
                                        className={`rounded border px-3 py-1 text-xs transition-all ${
                                          selected
                                            ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                                            : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                                        }`}
                                      >
                                        {language}
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
                  </div>

                  <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                    <div className="section-title">Favored Terrain Choices</div>
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Choose your favored terrains. Your choices unlock at levels 1, 6, and 10.
                    </div>
                    <div className="space-y-4">
                      {Array.from({ length: rangerFavoredTerrainSlotCount }, (_, index) => {
                        const currentTerrain = state.rangerFavoredTerrains[index] ?? '';
                        const unlockLevel = index === 0 ? 1 : index === 1 ? 6 : 10;
                        const usedOtherTerrains = new Set(
                          (state.rangerFavoredTerrains ?? []).filter((terrain, terrainIndex) => terrainIndex !== index && Boolean(terrain))
                        );
                        return (
                          <div key={`ranger-terrain-${index}`} className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="text-sm font-bold text-[var(--color-text-strong)]">Favored Terrain {index + 1}</div>
                              <div className="text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                                Unlocks at level {unlockLevel}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {RANGER_FAVORED_TERRAINS.filter(
                                terrain => !usedOtherTerrains.has(terrain) || currentTerrain === terrain
                              ).map(terrain => {
                                const selected = currentTerrain === terrain;
                                return (
                                  <button
                                    key={`ranger-terrain-choice-${index}-${terrain}`}
                                    onClick={() => updateRangerArrayValue('rangerFavoredTerrains', index, selected ? '' : terrain)}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {(previewClass.name === 'Fighter' || previewClass.name === 'Ranger') && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 field-label">
                      {previewClass.name === 'Fighter'
                        ? `Choose Fighting Style${fighterFightingStyleLimit > 1 ? 's' : ''} (${state.fighterFightingStyles.length}/${fighterFightingStyleLimit})`
                        : `Choose Fighting Style (${state.rangerFightingStyle ? '1' : '0'}/1)`}
                    </div>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {fightingStyleOptions.map(option => {
                        const selected =
                          previewClass.name === 'Fighter'
                            ? state.fighterFightingStyles.includes(option.name)
                            : state.rangerFightingStyle === option.name;
                        const canAdd =
                          previewClass.name === 'Fighter'
                            ? state.fighterFightingStyles.length < fighterFightingStyleLimit
                            : !state.rangerFightingStyle;
                        return (
                          <button
                            key={`${previewClass.name.toLowerCase()}-style-${option.name}`}
                            onClick={() =>
                              previewClass.name === 'Fighter'
                                ? toggleFighterFightingStyle(option.name)
                                : toggleRangerFightingStyle(option.name)
                            }
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

              {previewClass.name === 'Rogue' && rogueExpertiseAllowed > 0 && (
                <div>
                  <div className="mb-1 field-label">
                    Choose Expertise Proficiencies ({state.rogueExpertiseChoices.length}/{rogueExpertiseAllowed})
                  </div>
                  <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                    Choose from your skill proficiencies or thieves&apos; tools.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rogueExpertiseOptions.map(proficiency => {
                      const selected = state.rogueExpertiseChoices.includes(proficiency);
                      const canAdd = state.rogueExpertiseChoices.length < rogueExpertiseAllowed;
                      return (
                        <button
                          key={`rogue-expertise-${proficiency}`}
                          onClick={() => toggleRogueExpertise(proficiency)}
                          disabled={!selected && !canAdd}
                          className={`rounded border px-3 py-1 text-xs transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)] text-[var(--color-text-strong)]'
                              : canAdd
                              ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'
                              : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                          }`}
                        >
                          {proficiency}
                        </button>
                      );
                    })}
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

              {previewClass.name === 'Rogue' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Roguish Archetype</div>
                  {level < 3 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Roguish Archetype unlocks at level 3. You can choose one now to preview its future features.
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                    {ROGUE_ARCHETYPES.map(archetype => {
                      const selected = state.rogueArchetype === archetype.name;
                      return (
                        <button
                          key={archetype.name}
                          onClick={() => onChange({ rogueArchetype: archetype.name })}
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

                  {selectedRogueArchetype && (
                    <div className="mt-4">
                      <div className="section-title">Roguish Archetype Features</div>
                      <div className="flex flex-col gap-2">
                        {rogueArchetypeFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-rogue-archetype-${i}`}
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

                      {selectedRogueArchetype.name === 'Assassin' && level >= 3 && (
                        <div className="mt-4">
                          <div className="section-title">Additional Proficiencies</div>
                          <div className="text-sm leading-6 text-[var(--color-text)]">
                            Disguise Kit · Poisoner&apos;s Kit
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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

                      {clericDomainAdditionalProficiencies.length > 0 && (
                        <div className="mt-4">
                          <div className="section-title">Additional Proficiencies</div>
                          <div className="text-sm leading-6 text-[var(--color-text)]">
                            {clericDomainAdditionalProficiencies.join(' · ')}
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

              {previewClass.name === 'Ranger' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Ranger Archetype</div>
                  {level < 3 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Ranger Archetype unlocks at level 3. You can choose one now to preview its future features.
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {RANGER_ARCHETYPES.map(archetype => {
                      const selected = state.rangerArchetype === archetype.name;
                      return (
                        <button
                          key={archetype.name}
                          onClick={() =>
                            onChange({
                              rangerArchetype: archetype.name,
                              rangerHunterPreyChoice: archetype.name === 'Hunter' ? state.rangerHunterPreyChoice : '',
                              rangerDefensiveTacticsChoice: archetype.name === 'Hunter' ? state.rangerDefensiveTacticsChoice : '',
                              rangerMultiattackChoice: archetype.name === 'Hunter' ? state.rangerMultiattackChoice : '',
                              rangerSuperiorDefenseChoice: archetype.name === 'Hunter' ? state.rangerSuperiorDefenseChoice : '',
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

                  {selectedRangerArchetype && (
                    <div className="mt-4">
                      <div className="section-title">Ranger Archetype Features</div>
                      <div className="flex flex-col gap-2">
                        {rangerArchetypeFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-ranger-archetype-${i}`}
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

                      {selectedRangerArchetype.name === 'Hunter' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <div className="section-title">Hunter's Prey Choice</div>
                            <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                              Choose one Hunter&apos;s Prey option.
                            </div>
                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                              {RANGER_HUNTER_PREY_OPTIONS.map(option => {
                                const selected = state.rangerHunterPreyChoice === option.name;
                                return (
                                  <button
                                    key={`hunter-prey-${option.name}`}
                                    onClick={() => onChange({ rangerHunterPreyChoice: selected ? '' : option.name })}
                                    className={`rounded border p-3 text-left transition-all ${
                                      selected
                                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
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

                          {level >= 7 && (
                            <div>
                              <div className="section-title">Defensive Tactics Choice</div>
                              <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                Choose one Defensive Tactics option.
                              </div>
                              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                {RANGER_DEFENSIVE_TACTICS_OPTIONS.map(option => {
                                  const selected = state.rangerDefensiveTacticsChoice === option.name;
                                  return (
                                    <button
                                      key={`defensive-tactics-${option.name}`}
                                      onClick={() => onChange({ rangerDefensiveTacticsChoice: selected ? '' : option.name })}
                                      className={`rounded border p-3 text-left transition-all ${
                                        selected
                                          ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
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
                          )}

                          {level >= 11 && (
                            <div>
                              <div className="section-title">Multiattack Choice</div>
                              <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                Choose one Multiattack option.
                              </div>
                              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                {RANGER_MULTIATTACK_OPTIONS.map(option => {
                                  const selected = state.rangerMultiattackChoice === option.name;
                                  return (
                                    <button
                                      key={`multiattack-${option.name}`}
                                      onClick={() => onChange({ rangerMultiattackChoice: selected ? '' : option.name })}
                                      className={`rounded border p-3 text-left transition-all ${
                                        selected
                                          ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
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
                          )}

                          {level >= 15 && (
                            <div>
                              <div className="section-title">Superior Hunter's Defense Choice</div>
                              <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                                Choose one Superior Hunter&apos;s Defense option.
                              </div>
                              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                {RANGER_SUPERIOR_DEFENSE_OPTIONS.map(option => {
                                  const selected = state.rangerSuperiorDefenseChoice === option.name;
                                  return (
                                    <button
                                      key={`superior-defense-${option.name}`}
                                      onClick={() => onChange({ rangerSuperiorDefenseChoice: selected ? '' : option.name })}
                                      className={`rounded border p-3 text-left transition-all ${
                                        selected
                                          ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
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
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {previewClass.name === 'Monk' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Monastic Tradition</div>
                  {level < 3 && (
                    <div className="mb-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      Monastic Tradition unlocks at level 3. You can choose one now to preview its future features.
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                    {MONK_TRADITIONS.map(tradition => {
                      const selected = state.monkTradition === tradition.name;
                      return (
                        <button
                          key={tradition.name}
                          onClick={() =>
                            onChange({
                              monkTradition: tradition.name,
                              monkElementalDisciplines:
                                tradition.name === 'Way of the Four Elements'
                                  ? state.monkElementalDisciplines.filter(name => {
                                      const discipline = MONK_ELEMENTAL_DISCIPLINES.find(option => option.name === name);
                                      return Boolean(discipline && discipline.levelRequired <= level);
                                    })
                                  : [],
                            })
                          }
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{tradition.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{tradition.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedMonkTradition && (
                    <div className="mt-4">
                      <div className="section-title">Monastic Tradition Features</div>
                      <div className="flex flex-col gap-2">
                        {monkTraditionFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-monk-tradition-${i}`}
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

                      {selectedMonkTradition.name === 'Way of Shadow' && level >= 3 && shadowArtsSpellDetails.length > 0 && (
                        <div className="mt-4">
                          {renderCollapsibleSpellDetails(
                            'shadow-arts',
                            shadowArtsSpellDetails,
                            'Shadow Arts Spellcasting',
                            'Minor illusion is granted by your tradition, and you can spend 2 ki points to cast darkness, darkvision, pass without trace, or silence without material components.'
                          )}
                        </div>
                      )}

                      {selectedMonkTradition.name === 'Way of the Four Elements' && level >= 3 && (
                        <div className="mt-4">{renderMonkDisciplineCards()}</div>
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
                      {selectedPaladinOath.tenets && selectedPaladinOath.tenets.length > 0 && (
                        <div className="mt-4">
                          <div className="section-title">
                            {selectedPaladinOath.name === 'Oath of the Ancients'
                              ? 'Tenets of the Ancients'
                              : selectedPaladinOath.name === 'Oath of Devotion'
                              ? 'Tenets of Devotion'
                              : `Tenets of ${selectedPaladinOath.name.replace(/^Oath of /, '')}`}
                          </div>
                          <div className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-2)] p-4 text-[0.98rem] leading-7 text-[var(--color-text-soft)]">
                            <p>{selectedPaladinOath.tenets[0]}</p>
                            <ul className="mt-3 list-disc space-y-2 pl-6">
                              {selectedPaladinOath.tenets.slice(1).map(tenet => (
                                <li key={tenet}>{tenet}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

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

              {previewClass.name === 'Sorcerer' && (
                <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                  <div className="section-title">Choose Sorcerous Origin</div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {SORCEROUS_ORIGINS.map(origin => {
                      const selected = state.sorcerousOrigin === origin.name;
                      return (
                        <button
                          key={origin.name}
                          onClick={() =>
                            onChange({
                              sorcerousOrigin: origin.name,
                              sorcererDragonAncestor:
                                origin.name === 'Draconic Bloodline' ? state.sorcererDragonAncestor : '',
                            })
                          }
                          className={`rounded border p-3 text-left transition-all ${
                            selected
                              ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                              : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                          }`}
                        >
                          <div className="text-sm font-bold text-[var(--color-text-strong)]">{origin.name}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{origin.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedSorcerousOrigin && (
                    <div className="mt-4">
                      {selectedSorcerousOrigin.name === 'Draconic Bloodline' && (
                        <div className="mb-4">
                          <div className="section-title">Choose Dragon Ancestor</div>
                          <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                            Choose the dragon type tied to your bloodline. Its damage type is used by your later subclass features.
                          </div>
                          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                            {SORCERER_DRAGON_ANCESTORS.map(option => {
                              const selected = state.sorcererDragonAncestor === option.name;
                              return (
                                <button
                                  key={`dragon-ancestor-${option.name}`}
                                  onClick={() => onChange({ sorcererDragonAncestor: selected ? '' : option.name })}
                                  className={`rounded border p-3 text-left transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  <div className="text-sm font-bold text-[var(--color-text-strong)]">{option.name}</div>
                                  <div className="mt-1 text-[0.72rem] uppercase tracking-wide text-[var(--color-accent)]">
                                    {option.damageType}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="section-title">Sorcerous Origin Features</div>
                      <div className="flex flex-col gap-2">
                        {sorcerousOriginFeatures.map((feature, i) => {
                          const unlocked = feature.level <= level;
                          return (
                            <div
                              key={`${feature.level}-${feature.name}-sorcerous-origin-${i}`}
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
                      {selectedSorcerousOrigin.name === 'Wild Magic' && (
                        <div className="mt-4 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-pop)] p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="section-title">Wild Magic Surge Table</div>
                            <button
                              onClick={() => setShowWildMagicTable(current => !current)}
                              className="rounded border border-[var(--color-border-muted)] px-2 py-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)] transition-all hover:bg-[var(--color-hover)]"
                            >
                              {showWildMagicTable ? 'Close' : 'Open'}
                            </button>
                          </div>
                          {showWildMagicTable && (
                            <div className="mt-3 rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-2)] p-3">
                              <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm text-[var(--color-text-soft)]">
                                <div className="font-bold text-[var(--color-text-strong)]">d100</div>
                                <div className="font-bold text-[var(--color-text-strong)]">Effect</div>
                                {WILD_MAGIC_SURGE_REFERENCE.map(entry => (
                                  <div key={`wild-magic-${entry.roll}`} className="contents">
                                    <div>{entry.roll}</div>
                                    <div>{entry.effect}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {previewClass.name === 'Warlock' && (
                <div className="space-y-4">
                  <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                    <div className="section-title">Choose Otherworldly Patron</div>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                      {WARLOCK_PATRONS.map(patron => {
                        const selected = state.warlockPatron === patron.name;
                        return (
                          <button
                            key={patron.name}
                            onClick={() => onChange({ warlockPatron: patron.name })}
                            className={`rounded border p-3 text-left transition-all ${
                              selected
                                ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                            }`}
                          >
                            <div className="text-sm font-bold text-[var(--color-text-strong)]">{patron.name}</div>
                            <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{patron.description}</div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedWarlockPatron && (
                      <div className="mt-4">
                        {selectedWarlockPatronSpellDetails.length > 0 &&
                          renderCollapsibleSpellDetails(
                            'warlock-expanded',
                            selectedWarlockPatronSpellDetails,
                            'Expanded Spell List',
                            'Your patron adds these spells to the warlock spell list for you. They become available as you gain warlock levels, and once they are available you can choose them like any other warlock spells you know.'
                          )}

                        <div className="section-title">Otherworldly Patron Features</div>
                        <div className="flex flex-col gap-2">
                          {warlockPatronFeatures.map((feature, i) => {
                            const unlocked = feature.level <= level;
                            return (
                              <div
                                key={`${feature.level}-${feature.name}-warlock-patron-${i}`}
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

                  {warlockInvocationLimit > 0 && (
                    <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                      <div className="section-title">
                        Eldritch Invocations ({state.warlockInvocations.length}/{warlockInvocationLimit})
                      </div>
                      <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                        Choose your eldritch invocations. You can swap one whenever you gain a warlock level.
                      </div>
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                        {visibleWarlockInvocations.map(option => {
                          const selected = state.warlockInvocations.includes(option.name);
                          const canAdd = state.warlockInvocations.length < warlockInvocationLimit;
                          const lockReason = getWarlockInvocationLockReason(option, level, state.warlockPactBoon, state.selectedCantrips);
                          const prerequisiteText = getWarlockInvocationPrerequisiteText(option);
                          const selectable = selected || (!lockReason && canAdd);
                          const statusLabel = selected
                            ? 'Selected'
                            : lockReason
                            ? 'Locked'
                            : canAdd
                            ? 'Can learn now'
                            : 'Slots full';
                          return (
                            <button
                              key={`warlock-invocation-${option.name}`}
                              onClick={() => toggleWarlockInvocation(option.name)}
                              disabled={!selectable}
                              className={`rounded border p-3 text-left transition-all ${
                                selected
                                  ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                  : selectable
                                  ? 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                  : 'cursor-not-allowed border-[var(--color-border-subtle)] text-[var(--color-text-dim)]'
                              }`}
                            >
                              <div className="text-sm font-bold text-[var(--color-text-strong)]">{option.name}</div>
                              <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                                {statusLabel}
                              </div>
                              {prerequisiteText && (
                                <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-text-dim)]">
                                  Prerequisite: {prerequisiteText}
                                </div>
                              )}
                              <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{option.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {level >= 3 && (
                    <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                      <div className="section-title">Choose Pact Boon</div>
                      <div className="mb-2 text-sm leading-6 text-[var(--color-text-soft)]">
                        Your pact boon changes what your patron’s gift actually does: Chain grants an empowered familiar, Blade grants a summonable pact weapon, and Tome grants a Book of Shadows with extra cantrips.
                      </div>
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                        {WARLOCK_PACT_BOONS.map(option => {
                          const selected = state.warlockPactBoon === option.name;
                          return (
                            <button
                              key={option.name}
                              onClick={() => chooseWarlockPactBoon(state, onChange, option.name)}
                              className={`rounded border p-3 text-left transition-all ${
                                selected
                                  ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                  : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                              }`}
                            >
                              <div className="text-sm font-bold text-[var(--color-text-strong)]">{option.name}</div>
                              <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{option.description}</div>
                            </button>
                          );
                        })}
                      </div>

                      {state.warlockPactBoon === 'Pact of the Chain' && (
                        <div className="mt-4">
                          <div className="section-title">Choose Familiar Form</div>
                          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                            {WARLOCK_CHAIN_FAMILIAR_FORMS.map(form => {
                              const selected = state.warlockChainFamiliarForm === form;
                              return (
                                <button
                                  key={form}
                                  onClick={() => onChange({ warlockChainFamiliarForm: selected ? '' : form })}
                                  className={`rounded border p-3 text-left transition-all ${
                                    selected
                                      ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                      : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                  }`}
                                >
                                  <div className="text-sm font-bold text-[var(--color-text-strong)]">{form}</div>
                                </button>
                              );
                            })}
                          </div>
                          {warlockFindFamiliarSpellDetails.length > 0 && (
                            <div className="mt-4">
                              {renderCollapsibleSpellDetails(
                                'warlock-chain-familiar',
                                warlockFindFamiliarSpellDetails,
                                'Find Familiar',
                                'Pact of the Chain teaches you the find familiar spell and lets you cast it as a ritual. Here is what that spell does.'
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {state.warlockPactBoon === 'Pact of the Tome' && (
                        <div className="mt-4 rounded border border-[var(--color-spell-border)] bg-[var(--color-spell-surface)] p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-spell-strong)]">
                              Choose Tome Cantrips
                            </div>
                            <button
                              onClick={() => toggleAllSpellGroups('warlock-tome-cantrip', warlockTomeCantripOptions)}
                              className="rounded border border-[var(--color-spell-border)] px-2 py-1 text-[0.68rem] text-[var(--color-spell-strong)] transition-all hover:bg-[var(--color-spell-chip-bg)]"
                            >
                              {groupSpellsByLevel(warlockTomeCantripOptions).every(group => collapsedSpellGroups[`warlock-tome-cantrip-${group.level}`] ?? false)
                                ? 'Open All'
                                : 'Close All'}
                            </button>
                          </div>
                          {renderGroupedSpellPicker(
                            'warlock-tome-cantrip',
                            warlockTomeCantripOptions,
                            state.warlockTomeCantrips,
                            toggleWarlockTomeCantrip,
                            state.warlockTomeCantrips.length,
                            3,
                            'No cantrips available.',
                            undefined,
                            spellNames => onChange({ warlockTomeCantrips: state.warlockTomeCantrips.filter(name => !spellNames.includes(name)) })
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {warlockMysticArcanumLevels.length > 0 && (
                    <div className="section-box border-[var(--color-border-muted)] bg-[var(--color-surface-3)]">
                      <div className="section-title">Mystic Arcanum Choices</div>
                      <div className="space-y-4">
                        {warlockMysticArcanumLevels.map((spellLevel, index) => (
                          <div key={`warlock-arcanum-${spellLevel}`}>
                            <div className="mb-2 text-sm font-bold text-[var(--color-text-strong)]">
                              {spellLevel}th-Level Arcanum
                            </div>
                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                              {warlockMysticArcanumOptions[index].map(spell => {
                                const selected = state.warlockMysticArcanumChoices[index] === spell.name;
                                return (
                                  <button
                                    key={`warlock-arcanum-${spellLevel}-${spell.name}`}
                                    onClick={() => chooseWarlockMysticArcanum(spellLevel, spell.name)}
                                    className={`rounded border p-3 text-left transition-all ${
                                      selected
                                        ? 'border-[var(--color-text-strong)] bg-[var(--color-selected)]'
                                        : 'border-[var(--color-accent)] bg-[var(--color-surface-3)] hover:bg-[var(--color-hover)]'
                                    }`}
                                  >
                                    <div className="text-sm font-bold text-[var(--color-text-strong)]">{spell.name}</div>
                                    <div className="mt-1 text-[0.68rem] uppercase tracking-wide text-[var(--color-accent)]">
                                      {spell.school} · {spell.duration}
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{spell.description}</div>
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
