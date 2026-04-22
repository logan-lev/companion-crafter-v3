import type { Character } from '../types/character';
import { profBonusFromLevel, parseLevel } from '../data/srd';
import { normalizeCharacter } from './character-sheet';

const STORAGE_KEY = 'companion_crafter_characters';

export function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).map((character: Character) => normalizeCharacter({ ...createBlankCharacter(), ...character })) : [];
  } catch {
    return [];
  }
}

export function saveCharacters(characters: Character[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

export function createBlankCharacter(): Character {
  return {
    id: crypto.randomUUID(),
    name: '',
    classAndLevel: '',
    background: '',
    playerName: '',
    race: '',
    alignment: '',
    experiencePoints: 0,
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 2,
    inspiration: false,
    savingThrowProfs: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    skillProfs: {},
    armorClass: 10,
    initiative: 0,
    speed: 30,
    maxHp: 0,
    currentHp: 0,
    temporaryHp: 0,
    hitDice: { total: 1, remaining: 1, dieType: 8 },
    deathSaves: { successes: 0, failures: 0 },
    attacks: [],
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    featuresAndTraits: '',
    otherProficiencies: '',
    languages: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    spellcastingClass: '',
    spellcastingAbility: '',
    spellSlots: {
      1: { total: 0, used: 0 },
      2: { total: 0, used: 0 },
      3: { total: 0, used: 0 },
      4: { total: 0, used: 0 },
      5: { total: 0, used: 0 },
      6: { total: 0, used: 0 },
      7: { total: 0, used: 0 },
      8: { total: 0, used: 0 },
      9: { total: 0, used: 0 },
    },
    spells: [],
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    appearance: '',
    backstory: '',
    alliesAndOrgs: '',
    additionalFeatures: '',
    treasure: '',
    treasureItems: [],
  };
}

export function recalcProfBonus(char: Character): Character {
  const level = parseLevel(char.classAndLevel);
  return { ...char, proficiencyBonus: profBonusFromLevel(level) };
}
