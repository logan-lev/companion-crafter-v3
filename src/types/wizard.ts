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
  barbarianPath: string;
  barbarianTotemSpirit: string;
  barbarianAspectSpirit: string;
  barbarianAttunementSpirit: string;
  bardCollege: string;
  clericDomain: string;
  druidCircle: string;
  druidLandTerrain: string;
  druidLandCantrip: string;
  fighterArchetype: string;
  fighterFightingStyles: string[];
  fighterStudentOfWarTool: string;
  fighterManeuverChoices: string[];
  monkTradition: string;
  monkToolProficiency: string;
  monkElementalDisciplines: string[];
  paladinOath: string;
  clericKnowledgeSkillChoices: string[];
  clericKnowledgeLanguageChoices: string[];
  clericNatureSkillChoice: string;
  clericNatureCantrip: string;
  bardInstrumentChoices: string[];
  bardExpertiseChoices: string[];
  bardLoreSkillChoices: string[];
  bardMagicalSecretChoices: string[];
  bardAdditionalMagicalSecretChoices: string[];
  classEquipmentSelections: Record<string, string>;
  classAbilityBonuses: Partial<Record<AbilityKey, number>>;
  // Step 3 - Background
  background: string;
  backgroundSkillChoices: string[];
  backgroundLanguageChoices: string[];
  backgroundSelections: Record<string, string>;
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
  background: '',
  backgroundSkillChoices: [],
  backgroundLanguageChoices: [],
  backgroundSelections: {},
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
