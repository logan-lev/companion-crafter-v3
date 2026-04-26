import type { Character, AbilityKey, Spell, SpellSlots } from '../types/character';
import type { WizardState } from '../types/wizard';
import { calcMod, profBonusFromLevel } from '../data/srd';
import { BACKGROUND_DATA } from '../data/srd-backgrounds';
import {
  BARD_COLLEGES,
  CLERIC_DOMAINS,
  CLASS_DATA,
  getFeaturesUpToLevel,
  getSlotsAtLevel,
  getSubclassAutoPreparedSpells,
  type ClassFeature,
} from '../data/srd-classes';
import {
  CLASS_EQUIPMENT_CHOICES,
  CLASS_FIXED_EQUIPMENT,
  CLASS_STARTER_EQUIPMENT,
  EQUIPMENT_DYNAMIC_OPTION_POOLS,
} from '../data/srd-class-equipment';
import { RACE_DATA } from '../data/srd-races';
import { SPELL_LIST } from '../data/srd-spells';
import { createBlankCharacter } from './storage';
import { createInventoryFromText } from './character-sheet';

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const SKILL_NAMES = new Set([
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival',
]);

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function getSelectedRace(state: WizardState) {
  return RACE_DATA.find(race => race.name === state.race);
}

export function getSelectedSubrace(state: WizardState) {
  return getSelectedRace(state)?.subraces?.find(subrace => subrace.name === state.subrace);
}

export function getSelectedClass(state: WizardState) {
  return CLASS_DATA.find(cls => cls.name === state.className);
}

export function getSelectedBackground(state: WizardState) {
  return BACKGROUND_DATA.find(background => background.name === state.background);
}

export function getResolvedBackgroundToolProficiencies(state: WizardState): string[] {
  const background = getSelectedBackground(state);
  if (!background) return [];

  return (background.toolProfs ?? []).flatMap(tool => {
    if (/one type of gaming set/i.test(tool) || /one type of musical instrument/i.test(tool) || /artisan's tools \(one type\)/i.test(tool)) {
      return state.backgroundSelections['background-tool-choice']
        ? [state.backgroundSelections['background-tool-choice']]
        : [];
    }

    return [tool];
  });
}

export function getResolvedBackgroundEquipment(state: WizardState): string {
  const background = getSelectedBackground(state);
  if (!background) return '';

  let equipment = background.equipment;
  const toolChoice = state.backgroundSelections['background-tool-choice'];
  const equipmentChoice = state.backgroundSelections['background-equipment-choice'];

  if (toolChoice) {
    equipment = equipment
      .replace(/Musical instrument/gi, toolChoice)
      .replace(/Artisan's tools/gi, toolChoice);
  }

  if (equipmentChoice) {
    equipment = equipment
      .replace(/tools of the con of your choice/gi, equipmentChoice)
      .replace(/set of bone dice or deck of cards/gi, equipmentChoice);
  }

  return equipment;
}

export function getRacialBonus(state: WizardState): Partial<Record<AbilityKey, number>> {
  const race = getSelectedRace(state);
  if (!race) return {};

  const bonus: Partial<Record<AbilityKey, number>> = { ...race.abilityBonus };
  const subrace = getSelectedSubrace(state);

  if (subrace) {
    for (const key of ABILITY_KEYS) {
      bonus[key] = (bonus[key] ?? 0) + (subrace.abilityBonus[key] ?? 0);
    }
  }

  if (state.race === 'Half-Elf') {
    for (const key of ABILITY_KEYS) {
      bonus[key] = (bonus[key] ?? 0) + (state.halfElfBonuses[key] ?? 0);
    }
  }

  return bonus;
}

export function getFinalAbilityScores(state: WizardState): Record<AbilityKey, number> {
  const racialBonus = getRacialBonus(state);
  return ABILITY_KEYS.reduce((scores, key) => {
    const preChampion = Math.min(
      20,
      (state.baseScores[key] ?? 8) + (racialBonus[key] ?? 0) + (state.classAbilityBonuses[key] ?? 0)
    );
    const primalChampionBonus =
      state.className === 'Barbarian' && state.level >= 20 && (key === 'str' || key === 'con') ? 4 : 0;
    scores[key] = Math.min(24, preChampion + primalChampionBonus);
    return scores;
  }, {} as Record<AbilityKey, number>);
}

export function getAllSkillProficiencies(state: WizardState): string[] {
  const race = getSelectedRace(state);
  const subrace = getSelectedSubrace(state);
  const background = getSelectedBackground(state);

  return unique([
    ...(state.classSkillChoices ?? []),
    ...(background?.skillProfs ?? []),
    ...((race?.proficiencies ?? []).filter(item => SKILL_NAMES.has(item))),
    ...((subrace?.proficiencies ?? []).filter(item => SKILL_NAMES.has(item))),
    ...(state.raceSkillChoices ?? []),
    ...(state.bardLoreSkillChoices ?? []),
  ]);
}

export function getAllOtherProficiencies(state: WizardState): string[] {
  const race = getSelectedRace(state);
  const subrace = getSelectedSubrace(state);
  const cls = getSelectedClass(state);
  const clericDomain = CLERIC_DOMAINS.find(option => option.name === state.clericDomain);

  return unique([
    ...((race?.proficiencies ?? []).filter(item => !SKILL_NAMES.has(item))),
    ...((subrace?.proficiencies ?? []).filter(item => !SKILL_NAMES.has(item))),
    ...(state.dwarfToolProficiency ? [state.dwarfToolProficiency] : []),
    ...getResolvedBackgroundToolProficiencies(state),
    ...(cls?.armorProf ?? []),
    ...(cls?.weaponProf ?? []),
    ...((cls?.toolProf ?? []).filter(item => item !== 'Three musical instruments of your choice')),
    ...(state.bardInstrumentChoices ?? []),
    ...(state.bardCollege === 'College of Valor' ? ['Medium Armor', 'Shields', 'Martial Weapons'] : []),
    ...(state.className === 'Cleric' && clericDomain?.name === 'Knowledge Domain'
      ? ['Two bonus languages', 'Arcana expertise', 'History expertise']
      : []),
    ...(state.className === 'Cleric' && clericDomain?.name === 'Life Domain' ? ['Heavy Armor'] : []),
    ...(state.className === 'Cleric' && clericDomain?.name === 'Nature Domain' ? ['Heavy Armor'] : []),
    ...(state.className === 'Cleric' && (clericDomain?.name === 'Tempest Domain' || clericDomain?.name === 'War Domain')
      ? ['Heavy Armor', 'Martial Weapons']
      : []),
  ]);
}

export function getLanguages(state: WizardState): string[] {
  const race = getSelectedRace(state);
  const languages = [...(race?.languages ?? [])]
    .filter(language => !/extra language of your choice/i.test(language));

  languages.push(...(state.raceLanguageChoices ?? []));
  languages.push(...(state.backgroundLanguageChoices ?? []));

  return unique(languages);
}

export function getTraitEntries(state: WizardState): string[] {
  const race = getSelectedRace(state);
  const subrace = getSelectedSubrace(state);
  const background = getSelectedBackground(state);
  const classFeatures = state.className
    ? getFeaturesUpToLevel(state.className, state.level, {
        barbarianPath: state.barbarianPath,
        barbarianTotemSpirit: state.barbarianTotemSpirit,
        barbarianAspectSpirit: state.barbarianAspectSpirit,
        barbarianAttunementSpirit: state.barbarianAttunementSpirit,
        bardCollege: state.bardCollege,
        clericDomain: state.clericDomain,
        paladinOath: state.paladinOath,
      })
    : [];

  const entries = [
    ...(race?.traits.map(trait => `${trait.name}: ${trait.description}`) ?? []),
    ...(subrace?.traits.map(trait => `${trait.name}: ${trait.description}`) ?? []),
    ...(background ? [`${background.feature.name}: ${background.feature.description}`] : []),
    ...classFeatures.map(feature => `Level ${feature.level} - ${feature.name}: ${feature.description}`),
  ];

  if (state.highElfCantrip) {
    entries.push(`High Elf Cantrip: You know ${state.highElfCantrip}.`);
  }

  if (state.dwarfToolProficiency) {
    entries.push(`Dwarven Tool Proficiency: You chose proficiency with ${state.dwarfToolProficiency}.`);
  }

  if (state.dragonbornAncestry) {
    entries.push(`Draconic Ancestry: You chose ${state.dragonbornAncestry}.`);
  }

  if (state.barbarianPath) {
    entries.push(`Primal Path: You chose ${state.barbarianPath}.`);
  }

  if (state.barbarianTotemSpirit) {
    entries.push(`Totem Spirit: You chose ${state.barbarianTotemSpirit}.`);
  }

  if (state.barbarianAspectSpirit) {
    entries.push(`Aspect of the Beast: You chose ${state.barbarianAspectSpirit}.`);
  }

  if (state.barbarianAttunementSpirit) {
    entries.push(`Totemic Attunement: You chose ${state.barbarianAttunementSpirit}.`);
  }

  if (state.bardCollege) {
    const college = BARD_COLLEGES.find(option => option.name === state.bardCollege);
    if (college) entries.push(`Bard College: You chose ${college.name}.`);
  }

  if (state.clericDomain) {
    entries.push(`Divine Domain: You chose ${state.clericDomain}.`);
  }

  if (state.paladinOath) {
    entries.push(`Sacred Oath: You chose ${state.paladinOath}.`);
  }

  return entries;
}

export function getFutureClassFeatures(state: WizardState): ClassFeature[] {
  const cls = getSelectedClass(state);
  if (!cls) return [];
  return getFeaturesUpToLevel(cls.name, 20, {
    barbarianPath: state.barbarianPath,
    barbarianTotemSpirit: state.barbarianTotemSpirit,
    barbarianAspectSpirit: state.barbarianAspectSpirit,
    barbarianAttunementSpirit: state.barbarianAttunementSpirit,
    bardCollege: state.bardCollege,
    clericDomain: state.clericDomain,
    paladinOath: state.paladinOath,
  })
    .filter(feature => feature.level > state.level)
    .slice(0, 6);
}

export function getFeatMilestones(state: WizardState): number[] {
  const cls = getSelectedClass(state);
  if (!cls) return [];

  return unique(
    cls.features
      .filter(feature => feature.name === 'Ability Score Improvement')
      .flatMap(feature => [feature.level, ...Array.from(feature.description.matchAll(/levels? ([\d,\sand]+)/gi)).flatMap(match =>
        (match[1] ?? '')
          .replace(/and/gi, ',')
          .split(',')
          .map(part => parseInt(part.trim(), 10))
          .filter(Number.isFinite)
      )])
      .map(level => String(level))
  )
    .map(level => parseInt(level, 10))
    .sort((a, b) => a - b);
}

export function getSpeed(state: WizardState): number {
  const race = getSelectedRace(state);
  const subrace = getSelectedSubrace(state);
  const cls = getSelectedClass(state);
  let speed = race?.speed ?? 30;

  if (state.race === 'Elf' && subrace?.name === 'Wood Elf') speed = 35;
  if (cls?.name === 'Barbarian' && state.level >= 5) speed += 10;
  if (cls?.name === 'Monk' && state.level >= 2) {
    if (state.level >= 18) speed += 30;
    else if (state.level >= 14) speed += 25;
    else if (state.level >= 10) speed += 20;
    else if (state.level >= 6) speed += 15;
    else speed += 10;
  }

  return speed;
}

export function getArmorClass(state: WizardState): number {
  const cls = getSelectedClass(state);
  const scores = getFinalAbilityScores(state);
  const dex = calcMod(scores.dex);

  if (cls?.name === 'Monk') return 10 + dex + calcMod(scores.wis);
  if (cls?.name === 'Barbarian') return 10 + dex + calcMod(scores.con);

  return 10 + dex;
}

export function getMaxHp(state: WizardState): number {
  const cls = getSelectedClass(state);
  const conMod = calcMod(getFinalAbilityScores(state).con);
  const hitDie = cls?.hitDie ?? 8;
  const averagePerLevel = Math.floor(hitDie / 2) + 1;
  const firstLevel = hitDie + conMod;
  const laterLevels = Math.max(0, state.level - 1) * (averagePerLevel + conMod);
  const hillDwarfBonus = state.race === 'Dwarf' && state.subrace === 'Hill Dwarf' ? state.level : 0;

  return Math.max(1, firstLevel + laterLevels + hillDwarfBonus);
}

function getSpellSlotsRecord(state: WizardState): Record<number, SpellSlots> {
  const result = Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [index + 1, { total: 0, used: 0 }])
  ) as Record<number, SpellSlots>;
  const cls = getSelectedClass(state);
  const spellcasting = cls?.spellcasting;

  if (!spellcasting) return result;

  if (spellcasting.type === 'pact') {
    const slotLevel = Math.min(5, Math.ceil(state.level / 2));
    const total = state.level >= 17 ? 4 : state.level >= 11 ? 3 : state.level >= 2 ? 2 : 1;
    result[slotLevel] = { total, used: 0 };
    return result;
  }

  const slots = getSlotsAtLevel(spellcasting, state.level);
  slots.forEach((count, index) => {
    result[index + 1] = { total: count, used: 0 };
  });

  return result;
}

function getExtraSpellNames(state: WizardState): string[] {
  const names: string[] = [];

  if (state.highElfCantrip) names.push(state.highElfCantrip);
  if (state.race === 'Tiefling') names.push('Thaumaturgy');
  if (state.race === 'Gnome' && state.subrace === 'Forest Gnome') names.push('Minor Illusion');
  if (state.race === 'Elf' && state.subrace === 'Dark Elf (Drow)') names.push('Dancing Lights');
  if (state.className === 'Cleric' || state.className === 'Paladin') {
    names.push(
      ...getSubclassAutoPreparedSpells(state.className, state.level, {
        clericDomain: state.clericDomain,
        paladinOath: state.paladinOath,
      })
    );
  }
  names.push(...(state.bardMagicalSecretChoices ?? []));
  names.push(...(state.bardAdditionalMagicalSecretChoices ?? []));

  return unique(names);
}

function spellToCharacterSpell(name: string, prepared: boolean): Spell | null {
  const spell = SPELL_LIST.find(entry => entry.name === name);
  if (!spell) return null;

  return {
    id: crypto.randomUUID(),
    name: spell.name,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    prepared,
    description: spell.description,
  };
}

function resolveEquipmentOption(
  state: WizardState,
  choiceKey: string,
  option: string
): string[] {
  const dynamicCounts = new Map<string, number>();

  return option
    .split(',')
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => {
      const pool = EQUIPMENT_DYNAMIC_OPTION_POOLS[token];
      if (!pool) return token;

      const index = dynamicCounts.get(token) ?? 0;
      dynamicCounts.set(token, index + 1);
      return state.classEquipmentSelections[`${choiceKey}-specific-${index}`] ?? '';
    })
    .filter(Boolean);
}

function getResolvedClassEquipment(state: WizardState, className: string): string {
  const classChoices = CLASS_EQUIPMENT_CHOICES[className] ?? [];
  const fixedItems = CLASS_FIXED_EQUIPMENT[className] ?? [];

  if (!classChoices.length && !fixedItems.length) {
    return CLASS_STARTER_EQUIPMENT[className] ?? '';
  }

  const resolvedItems = classChoices.flatMap(choice => {
    const selectedOption = state.classEquipmentSelections[choice.key];
    if (!selectedOption) {
      return [];
    }
    return resolveEquipmentOption(state, choice.key, selectedOption);
  });

  return [...resolvedItems, ...fixedItems].join(', ');
}

export function createCharacterFromWizard(state: WizardState): Character {
  const character = createBlankCharacter();
  const cls = getSelectedClass(state);
  const background = getSelectedBackground(state);
  const abilityScores = getFinalAbilityScores(state);
  const proficiencyBonus = profBonusFromLevel(state.level);
  const skillProfs = getAllSkillProficiencies(state);
  const traitEntries = getTraitEntries(state);
  const otherProficiencies = getAllOtherProficiencies(state);
  const spellNames = unique([...getExtraSpellNames(state), ...state.selectedCantrips, ...state.selectedSpells]);
  const alwaysPreparedSpellNames = new Set(getExtraSpellNames(state));
  const spells = spellNames
    .map(name =>
      spellToCharacterSpell(
        name,
        alwaysPreparedSpellNames.has(name) || state.selectedSpells.includes(name) || state.selectedCantrips.includes(name)
      )
    )
    .filter((spell): spell is Spell => spell !== null);
  const backgroundEquipment = background
    ? createInventoryFromText(getResolvedBackgroundEquipment(state), 'Background starting equipment')
    : { items: [], currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } };
  const classEquipment = cls
    ? createInventoryFromText(getResolvedClassEquipment(state, cls.name), 'Class starting equipment')
    : { items: [], currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } };

  return {
    ...character,
    name: state.name,
    classAndLevel: state.className ? `${state.className} ${state.level}` : '',
    background: state.background,
    playerName: state.playerName,
    race: [state.subrace || state.race, state.subrace ? `(${state.race})` : ''].filter(Boolean).join(' '),
    alignment: state.alignment,
    experiencePoints: 0,
    abilityScores,
    proficiencyBonus,
    savingThrowProfs: ABILITY_KEYS.reduce((profs, key) => {
      profs[key] = Boolean(cls?.savingThrows.includes(key));
      return profs;
    }, {} as Record<AbilityKey, boolean>),
    skillProfs: skillProfs.reduce((profs, skill) => {
      profs[skill] = state.bardExpertiseChoices.includes(skill) ? 'expertise' : true;
      return profs;
    }, {} as Record<string, boolean | 'expertise'>),
    armorClass: getArmorClass(state),
    initiative: calcMod(abilityScores.dex),
    speed: getSpeed(state),
    maxHp: getMaxHp(state),
    currentHp: getMaxHp(state),
    hitDice: {
      total: state.level,
      remaining: state.level,
      dieType: cls?.hitDie ?? 8,
    },
    personalityTraits: state.personalityTraits,
    ideals: state.ideals,
    bonds: state.bonds,
    flaws: state.flaws,
    featuresAndTraits: traitEntries.join('\n\n'),
    otherProficiencies: unique(otherProficiencies).join(', '),
    languages: getLanguages(state),
    spellcastingClass: cls?.spellcasting ? state.className : '',
    spellcastingAbility: cls?.spellcasting?.ability ?? '',
    spellSlots: getSpellSlotsRecord(state),
    spells,
    backstory: state.backstory,
    inventory: [...classEquipment.items, ...backgroundEquipment.items],
    currency: {
      cp: classEquipment.currency.cp + backgroundEquipment.currency.cp,
      sp: classEquipment.currency.sp + backgroundEquipment.currency.sp,
      ep: classEquipment.currency.ep + backgroundEquipment.currency.ep,
      gp: classEquipment.currency.gp + backgroundEquipment.currency.gp,
      pp: classEquipment.currency.pp + backgroundEquipment.currency.pp,
    },
    treasureItems: [],
  };
}
