export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface HitDice {
  total: number;
  remaining: number;
  dieType: number;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Attack {
  id: string;
  name: string;
  attackBonus: string;
  damageType: string;
  source?: 'manual' | 'inventory';
  linkedItemName?: string;
}

export interface SpellSlots {
  total: number;
  used: number;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  prepared: boolean;
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description: string;
  itemType?: 'weapon' | 'armor' | 'gear' | 'tool' | 'consumable' | 'treasure';
}

export interface Character {
  id: string;
  // Basic Info
  name: string;
  classAndLevel: string;
  background: string;
  playerName: string;
  race: string;
  alignment: string;
  experiencePoints: number;
  // Ability Scores
  abilityScores: AbilityScores;
  // Proficiency & Inspiration
  proficiencyBonus: number;
  inspiration: boolean;
  // Saving Throws proficiency
  savingThrowProfs: Record<AbilityKey, boolean>;
  // Skills proficiency (true = proficient, 'expertise' = double)
  skillProfs: Record<string, boolean | 'expertise'>;
  // Combat
  armorClass: number;
  initiative: number;
  speed: number;
  maxHp: number;
  currentHp: number;
  temporaryHp: number;
  hitDice: HitDice;
  deathSaves: DeathSaves;
  attacks: Attack[];
  // Features & Traits
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  featuresAndTraits: string;
  otherProficiencies: string;
  languages: string[];
  // Equipment
  inventory: InventoryItem[];
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };
  // Spellcasting
  spellcastingClass: string;
  spellcastingAbility: AbilityKey | '';
  spellSlots: Record<number, SpellSlots>;
  spells: Spell[];
  // Appearance
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
  appearance: string;
  backstory: string;
  alliesAndOrgs: string;
  additionalFeatures: string;
  treasure: string;
  treasureItems: InventoryItem[];
}
