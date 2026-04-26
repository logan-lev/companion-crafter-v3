import type { AbilityKey } from '../types/character';

export interface RaceTrait {
  name: string;
  description: string;
}

export interface SubraceData {
  name: string;
  flavorText?: string;
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
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. In darkness, you can’t discern color, only shades of gray.' },
      { name: 'Dwarven Resilience', description: 'You have advantage on saving throws against poison, and you have resistance against poison damage.' },
      { name: 'Dwarven Combat Training', description: 'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.' },
      { name: 'Tool Proficiency', description: 'You gain proficiency with the artisan\'s tools of your choice: smith\'s tools, brewer\'s supplies, or mason\'s tools.' },
      { name: 'Stonecunning', description: 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.' },
    ],
    proficiencies: ['Battleaxe', 'Handaxe', 'Throwing Hammer', 'Warhammer'],
    languages: ['Common', 'Dwarvish'],
    subraces: [
      {
        name: 'Hill Dwarf',
        flavorText: 'Hill dwarves are known for keen senses, deep intuition, and remarkable toughness, often serving as wise elders, priests, and lorekeepers.',
        abilityBonus: { wis: 1 },
        traits: [{ name: 'Dwarven Toughness', description: 'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.' }],
      },
      {
        name: 'Mountain Dwarf',
        flavorText: 'Mountain dwarves are broad, hardy, and battle-tested, often raised in strongholds where armor and martial skill are part of daily life.',
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
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. In darkness, you can’t discern color, only shades of gray.' },
      { name: 'Keen Senses', description: 'You have proficiency in the Perception skill.' },
      { name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { name: 'Trance', description: 'Elves don\'t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. While meditating, you can dream after a fashion; such dreams are actually mental exercises that have become reflexive through years of practice. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.' },
    ],
    proficiencies: ['Perception'],
    languages: ['Common', 'Elvish'],
    subraces: [
      {
        name: 'High Elf',
        flavorText: 'High elves are curious, disciplined, and steeped in learning, often drawn toward magic, scholarship, and refined traditions.',
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
        flavorText: 'Wood elves are swift and perceptive wanderers, more closely tied to the natural world and the rhythms of the wild.',
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
        flavorText: 'Drow are elves shaped by life in the Underdark, known for uncanny senses, dangerous grace, and powerful innate magic.',
        abilityBonus: { cha: 1 },
        traits: [
          { name: 'Superior Darkvision', description: 'Your darkvision has a range of 120 feet.' },
          { name: 'Sunlight Sensitivity', description: 'You have disadvantage on attack rolls and on Perception checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.' },
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
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. In darkness, you can’t discern color, only shades of gray.' },
      { name: 'Gnome Cunning', description: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.' },
    ],
    proficiencies: [],
    languages: ['Common', 'Gnomish'],
    subraces: [
      {
        name: 'Forest Gnome',
        flavorText: 'Forest gnomes are elusive, whimsical, and closely attuned to small woodland creatures and subtle natural magic.',
        abilityBonus: { dex: 1 },
        traits: [
          { name: 'Natural Illusionist', description: 'You know the Minor Illusion cantrip. Intelligence is your spellcasting ability.' },
          { name: 'Speak with Small Beasts', description: 'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts. Forest gnomes love animals and often keep squirrels, badgers, rabbits, moles, woodpeckers, and other creatures as beloved pets.' },
        ],
      },
      {
        name: 'Rock Gnome',
        flavorText: 'Rock gnomes are ingenious tinkerers, fascinated by craft, invention, and the practical side of arcane curiosity.',
        abilityBonus: { con: 1 },
        traits: [
          { name: "Artificer's Lore", description: 'Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, add twice your proficiency bonus.' },
          { name: 'Tinker', description: 'Tinker. You have proficiency with artisan\'s tools (tinker\'s tools). Tinker\'s tools are a collection of hand tools, gears, clamps, and fine implements used to build, repair, and modify delicate mechanical devices. Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (AC 5, 1 hp). The device ceases to function after 24 hours (unless you spend 1 hour repairing it to keep the device functioning), or when you use your action to dismantle it; at that time, you can reclaim the materials used to create it. You can have up to three such devices active at a time.\nWhen you create a device, choose one of the following options:\nClockwork Toy. This toy is a clockwork animal, monster, or person, such as a frog, mouse, bird, dragon, or soldier. When placed on the ground, the toy moves 5 feet across the ground on each of your turns in a random direction. It makes noises as appropriate to the creature it represents.\nFire Starter. The device produces a miniature flame, which you can use to light a candle, torch, or campfire. Using the device requires your action.\nMusic Box. When opened, this music box plays a single song at a moderate volume. The box stops playing when it reaches the song\'s end or when it is closed.' },
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
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. In darkness, you can’t discern color, only shades of gray.' },
      { name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { name: 'Skill Versatility', description: 'You gain proficiency in two skills of your choice. Choose any two different skills to reflect the broad adaptability of your mixed heritage.' },
      { name: 'Ability Score Flexibility', description: 'Two ability scores of your choice each increase by 1, in addition to your +2 Charisma. These two +1 bonuses must go to different abilities and can’t be applied to Charisma.' },
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
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. In darkness, you can’t discern color, only shades of gray.' },
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
      { name: 'Lucky', description: 'When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.' },
      { name: 'Brave', description: 'You have advantage on saving throws against being frightened.' },
      { name: 'Halfling Nimbleness', description: 'You can move through the space of any creature that is of a size larger than yours.' },
    ],
    proficiencies: [],
    languages: ['Common', 'Halfling'],
    subraces: [
      {
        name: 'Lightfoot',
        flavorText: 'Lightfoot halflings are personable and quick-witted, thriving in crowds and slipping easily through larger societies.',
        abilityBonus: { cha: 1 },
        traits: [{ name: 'Naturally Stealthy', description: 'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.' }],
      },
      {
        name: 'Stout',
        flavorText: 'Stout halflings are hardier and more resilient, with a sturdiness that helps them weather poison and hardship alike.',
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
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. In darkness, you can’t discern color, only shades of gray.' },
      { name: 'Hellish Resistance', description: 'You have resistance to fire damage.' },
      { name: 'Infernal Legacy', description: 'You know the Thaumaturgy cantrip. At 3rd level, you can cast Hellish Rebuke as a 2nd-level spell once per day. At 5th level, you can also cast Darkness once per day. Charisma is your spellcasting ability.' },
    ],
    proficiencies: [],
    languages: ['Common', 'Infernal'],
  },
];
