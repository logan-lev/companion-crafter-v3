import type { AbilityKey } from '../types/character';

export const RACES = [
  'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf',
  'Half-Orc', 'Halfling', 'Human', 'Tiefling',
];

export const CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
  'Warlock', 'Wizard',
];

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

export const LANGUAGES = [
  'Common',
  'Dwarvish',
  'Elvish',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Infernal',
  'Orc',
  'Draconic',
  'Sylvan',
  'Celestial',
  'Abyssal',
  'Undercommon',
  'Primordial',
  'Giant',
  'Deep Speech',
];

export const BACKGROUNDS = [
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer',
  'Folk Hero', 'Guild Artisan', 'Hermit', 'Noble',
  'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin',
];

export const SKILLS: { name: string; ability: AbilityKey }[] = [
  { name: 'Acrobatics', ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' },
  { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' },
  { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' },
  { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' },
  { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' },
  { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' },
  { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' },
  { name: 'Survival', ability: 'wis' },
];

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];

export function calcMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function modStr(score: number): string {
  const m = calcMod(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

export function profBonusFromLevel(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

export function parseLevel(classAndLevel: string): number {
  const match = classAndLevel.match(/\d+/);
  return match ? Math.min(20, Math.max(1, parseInt(match[0]))) : 1;
}
