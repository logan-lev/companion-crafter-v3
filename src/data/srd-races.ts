import type { AbilityKey } from '../types/character';

export interface RaceTrait {
  name: string;
  description: string;
}

export interface SubraceData {
  name: string;
  abilityBonus: Partial<Record<AbilityKey, number>>;
  traits: RaceTrait[];
  proficiencies?: string[];
  extraLanguage?: boolean;
  spellcasting?: { cantrip: string; ability: AbilityKey };
}

export interface RaceData {
  name: string;
  abilityBonus: Partial<Record<AbilityKey, number>>;
  speed: number;
  size: 'Small' | 'Medium';
  darkvision?: number;
  traits: RaceTrait[];
  proficiencies: string[];
  languages: string[];
  subraces?: SubraceData[];
  flavorText: string;
}

export const RACE_DATA: RaceData[] = [
  {
    name: 'Dragonborn',
    abilityBonus: { str: 2, cha: 1 },
    speed: 30,
    size: 'Medium',
    flavorText: 'Born of dragons, as their name proclaims, the dragonborn walk proudly through a world that greets them with fearful incomprehension.',
    traits: [
      { name: 'Draconic Ancestry', description: 'You have draconic ancestry of a particular dragon type. Choose one: Black (Acid), Blue (Lightning), Brass (Fire), Bronze (Lightning), Copper (Acid), Gold (Fire), Green (Poison), Red (Fire), Silver (Cold), White (Cold).' },
      { name: 'Breath Weapon', description: 'You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type. When you use your breath weapon, creatures in the area must make a saving throw (DC = 8 + your Constitution modifier + your proficiency bonus). You can use this trait once per short or long rest.' },
      { name: 'Damage Resistance', description: 'You have resistance to the damage type associated with your draconic ancestry.' },
    ],
    proficiencies: [],
    languages: ['Common', 'Draconic'],
  },
  {
    name: 'Dwarf',
    abilityBonus: { con: 2 },
    speed: 25,
    size: 'Medium',
    darkvision: 60,
    flavorText: 'Kingdoms rich in ancient grandeur, halls carved into the roots of mountains, the echoing of picks and hammers in deep mines — this is the home of the dwarves.',
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Dwarven Resilience', description: 'You have advantage on saving throws against poison, and you have resistance against poison damage.' },
      { name: 'Dwarven Combat Training', description: 'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.' },
      { name: 'Tool Proficiency', description: 'You gain proficiency with the artisan\'s tools of your choice: smith\'s tools, brewer\'s supplies, or mason\'s tools.' },
      { name: 'Stonecunning', description: 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.' },
    ],
    proficiencies: ['Battleaxe', 'Handaxe', 'Light Hammer', 'Warhammer'],
    languages: ['Common', 'Dwarvish'],
    subraces: [
      {
        name: 'Hill Dwarf',
        abilityBonus: { wis: 1 },
        traits: [{ name: 'Dwarven Toughness', description: 'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.' }],
      },
      {
        name: 'Mountain Dwarf',
        abilityBonus: { str: 2 },
        traits: [{ name: 'Dwarven Armor Training', description: 'You have proficiency with light and medium armor.' }],
        proficiencies: ['Light Armor', 'Medium Armor'],
      },
    ],
  },
  {
    name: 'Elf',
    abilityBonus: { dex: 2 },
    speed: 30,
    size: 'Medium',
    darkvision: 60,
    flavorText: 'Elves are a magical people of otherworldly grace, living in the world but not quite part of it. They live in places of ethereal beauty.',
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Keen Senses', description: 'You have proficiency in the Perception skill.' },
      { name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { name: 'Trance', description: 'Elves don\'t need to sleep. Instead, they meditate deeply for 4 hours a day (long rest = 4 hours of trance).' },
    ],
    proficiencies: ['Perception'],
    languages: ['Common', 'Elvish'],
    subraces: [
      {
        name: 'High Elf',
        abilityBonus: { int: 1 },
        traits: [
          { name: 'Elf Weapon Training', description: 'You have proficiency with the longsword, shortsword, shortbow, and longbow.' },
          { name: 'Cantrip', description: 'You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability.' },
          { name: 'Extra Language', description: 'You can speak, read, and write one extra language of your choice.' },
        ],
        proficiencies: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'],
        extraLanguage: true,
        spellcasting: { cantrip: 'choose', ability: 'int' },
      },
      {
        name: 'Wood Elf',
        abilityBonus: { wis: 1 },
        traits: [
          { name: 'Elf Weapon Training', description: 'You have proficiency with the longsword, shortsword, shortbow, and longbow.' },
          { name: 'Fleet of Foot', description: 'Your base walking speed increases to 35 feet.' },
          { name: 'Mask of the Wild', description: 'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.' },
        ],
        proficiencies: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'],
      },
      {
        name: 'Dark Elf (Drow)',
        abilityBonus: { cha: 1 },
        traits: [
          { name: 'Superior Darkvision', description: 'Your darkvision has a range of 120 feet.' },
          { name: 'Sunlight Sensitivity', description: 'You have disadvantage on attack rolls and Perception checks when you or the target is in direct sunlight.' },
          { name: 'Drow Magic', description: 'You know the Dancing Lights cantrip. At 3rd level, you can cast Faerie Fire once per day. At 5th level, you can cast Darkness once per day. Charisma is your spellcasting ability.' },
          { name: 'Drow Weapon Training', description: 'You have proficiency with rapiers, shortswords, and hand crossbows.' },
        ],
        proficiencies: ['Rapier', 'Shortsword', 'Hand Crossbow'],
      },
    ],
  },
  {
    name: 'Gnome',
    abilityBonus: { int: 2 },
    speed: 25,
    size: 'Small',
    darkvision: 60,
    flavorText: 'A gnome\'s energy and enthusiasm for living shines through every inch of his or her tiny body. Gnomes average slightly over 3 feet tall.',
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Gnome Cunning', description: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.' },
    ],
    proficiencies: [],
    languages: ['Common', 'Gnomish'],
    subraces: [
      {
        name: 'Forest Gnome',
        abilityBonus: { dex: 1 },
        traits: [
          { name: 'Natural Illusionist', description: 'You know the Minor Illusion cantrip. Intelligence is your spellcasting ability.' },
          { name: 'Speak with Small Beasts', description: 'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.' },
        ],
      },
      {
        name: 'Rock Gnome',
        abilityBonus: { con: 1 },
        traits: [
          { name: "Artificer's Lore", description: 'Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, add twice your proficiency bonus.' },
          { name: 'Tinker', description: 'You have proficiency with artisan\'s tools (tinker\'s tools). Using those tools, you can spend 1 hour and 10 gp to construct a Tiny clockwork device.' },
        ],
        proficiencies: ["Tinker's Tools"],
      },
    ],
  },
  {
    name: 'Half-Elf',
    abilityBonus: { cha: 2 },
    speed: 30,
    size: 'Medium',
    darkvision: 60,
    flavorText: 'Walking in two worlds but truly belonging to neither, half-elves combine what some say are the best qualities of their elf and human parents.',
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { name: 'Skill Versatility', description: 'You gain proficiency in two skills of your choice.' },
      { name: 'Ability Score Flexibility', description: 'You gain +1 to two ability scores of your choice (in addition to +2 Charisma).' },
    ],
    proficiencies: [],
    languages: ['Common', 'Elvish', 'One extra language of your choice'],
  },
  {
    name: 'Half-Orc',
    abilityBonus: { str: 2, con: 1 },
    speed: 30,
    size: 'Medium',
    darkvision: 60,
    flavorText: 'Whether united under the leadership of a mighty warlock or having fought to a standstill after years of conflict, orc and human communities mix and sometimes produce children who carry the strength of both peoples.',
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Menacing', description: 'You gain proficiency in the Intimidation skill.' },
      { name: 'Relentless Endurance', description: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can\'t use this feature again until you finish a long rest.' },
      { name: 'Savage Attacks', description: 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the critical hit.' },
    ],
    proficiencies: ['Intimidation'],
    languages: ['Common', 'Orc'],
  },
  {
    name: 'Halfling',
    abilityBonus: { dex: 2 },
    speed: 25,
    size: 'Small',
    flavorText: 'The comforts of home are the goals of most halflings\' lives: a place to settle in peace and quiet, far from marauding monsters and clashing armies.',
    traits: [
      { name: 'Lucky', description: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.' },
      { name: 'Brave', description: 'You have advantage on saving throws against being frightened.' },
      { name: 'Halfling Nimbleness', description: 'You can move through the space of any creature that is of a size larger than yours.' },
    ],
    proficiencies: [],
    languages: ['Common', 'Halfling'],
    subraces: [
      {
        name: 'Lightfoot',
        abilityBonus: { cha: 1 },
        traits: [{ name: 'Naturally Stealthy', description: 'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.' }],
      },
      {
        name: 'Stout',
        abilityBonus: { con: 1 },
        traits: [{ name: 'Stout Resilience', description: 'You have advantage on saving throws against poison, and you have resistance against poison damage.' }],
      },
    ],
  },
  {
    name: 'Human',
    abilityBonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30,
    size: 'Medium',
    flavorText: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    traits: [
      { name: 'Ability Score Increase', description: 'Your ability scores each increase by 1.' },
      { name: 'Extra Language', description: 'You can speak, read, and write one extra language of your choice.' },
    ],
    proficiencies: [],
    languages: ['Common', 'One extra language of your choice'],
  },
  {
    name: 'Tiefling',
    abilityBonus: { int: 1, cha: 2 },
    speed: 30,
    size: 'Medium',
    darkvision: 60,
    flavorText: 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling.',
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Hellish Resistance', description: 'You have resistance to fire damage.' },
      { name: 'Infernal Legacy', description: 'You know the Thaumaturgy cantrip. At 3rd level, you can cast Hellish Rebuke as a 2nd-level spell once per long rest. At 5th level, you can also cast Darkness once per long rest. Charisma is your spellcasting ability.' },
    ],
    proficiencies: [],
    languages: ['Common', 'Infernal'],
  },
];
