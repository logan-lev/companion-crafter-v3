import type { AbilityKey } from './character';

export type AbilityMethod = 'pointbuy' | 'standard' | 'roll';

export interface WizardState {
  // Step 1 - Race
  race: string;
  subrace: string;
  raceSkillChoices: string[];
  raceLanguageChoices: string[];
  dwarfToolProficiency: string;
  dragonbornAncestry: string;
  // Step 2 - Class
  className: string;
  level: number;
  // Step 3 - Background
  background: string;
  backgroundSkillChoices: string[];
  backgroundLanguageChoices: string[];
  // Step 4 - Ability Scores
  abilityMethod: AbilityMethod;
  baseScores: Record<AbilityKey, number>;
  rolledScores: number[];
  assignedRolls: Record<AbilityKey, number | null>;
  standardAssignments: Record<AbilityKey, number | null>;
  // Step 5 - Spells (conditional)
  selectedCantrips: string[];
  selectedSpells: string[];
  // Step 6 - Details
  name: string;
  playerName: string;
  alignment: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  // Class skill choices
  classSkillChoices: string[];
  // Half-elf bonus ability scores
  halfElfBonuses: Partial<Record<AbilityKey, number>>;
  // High elf cantrip
  highElfCantrip: string;
}

export const WIZARD_INITIAL_STATE: WizardState = {
  race: '',
  subrace: '',
  raceSkillChoices: [],
  raceLanguageChoices: [],
  dwarfToolProficiency: '',
  dragonbornAncestry: '',
  className: '',
  level: 1,
  background: '',
  backgroundSkillChoices: [],
  backgroundLanguageChoices: [],
  abilityMethod: 'standard',
  baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
  rolledScores: [],
  assignedRolls: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  selectedCantrips: [],
  selectedSpells: [],
  name: '',
  playerName: '',
  alignment: '',
  personalityTraits: '',
  ideals: '',
  bonds: '',
  flaws: '',
  backstory: '',
  classSkillChoices: [],
  halfElfBonuses: {},
  highElfCantrip: '',
};
