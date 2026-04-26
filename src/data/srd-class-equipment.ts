export const CLASS_STARTER_EQUIPMENT: Record<string, string> = {
  Barbarian: 'Greataxe, two handaxes, explorer\'s pack, four javelins',
  Bard: 'Rapier, diplomat\'s pack, lute, leather armor, dagger',
  Cleric: 'Mace, scale mail, light crossbow, 20 bolts, priest\'s pack, shield, holy symbol',
  Druid: 'Wooden shield, scimitar, explorer\'s pack, druidic focus, leather armor',
  Fighter: 'Chain mail, longsword, shield, light crossbow, 20 bolts, dungeoneer\'s pack',
  Monk: 'Shortsword, dungeoneer\'s pack, 10 darts',
  Paladin: 'Chain mail, martial weapon, shield, five javelins, priest\'s pack, holy symbol',
  Ranger: 'Scale mail, two shortswords, longbow, 20 arrows, dungeoneer\'s pack',
  Rogue: 'Rapier, shortbow, 20 arrows, burglar\'s pack, leather armor, two daggers, thieves\' tools',
  Sorcerer: 'Light crossbow, 20 bolts, dungeoneer\'s pack, two daggers, arcane focus',
  Warlock: 'Light crossbow, 20 bolts, scholar\'s pack, leather armor, simple weapon, two daggers, arcane focus',
  Wizard: 'Quarterstaff, spellbook, scholar\'s pack, component pouch',
};

export interface ClassEquipmentChoice {
  key: string;
  label: string;
  options: string[];
}

export const SIMPLE_MELEE_WEAPONS = [
  'Club',
  'Dagger',
  'Greatclub',
  'Handaxe',
  'Javelin',
  'Light Hammer',
  'Mace',
  'Quarterstaff',
  'Sickle',
  'Spear',
];

export const MARTIAL_MELEE_WEAPONS = [
  'Battleaxe',
  'Flail',
  'Glaive',
  'Greataxe',
  'Greatsword',
  'Halberd',
  'Lance',
  'Longsword',
  'Maul',
  'Morningstar',
  'Pike',
  'Rapier',
  'Scimitar',
  'Shortsword',
  'Trident',
  'War Pick',
  'Warhammer',
  'Whip',
];

export const MARTIAL_WEAPONS = [
  ...MARTIAL_MELEE_WEAPONS,
  'Blowgun',
  'Hand Crossbow',
  'Heavy Crossbow',
  'Longbow',
  'Net',
];

export const SIMPLE_WEAPONS = [
  ...SIMPLE_MELEE_WEAPONS,
  'Light Crossbow',
  'Dart',
  'Shortbow',
  'Sling',
];

export const MUSICAL_INSTRUMENTS = [
  'Bagpipes',
  'Drum',
  'Dulcimer',
  'Flute',
  'Horn',
  'Lute',
  'Lyre',
  'Pan Flute',
  'Shawm',
  'Viol',
];

export const EQUIPMENT_DYNAMIC_OPTION_POOLS: Record<string, string[]> = {
  'Any martial melee weapon': MARTIAL_MELEE_WEAPONS,
  'Any martial weapon': MARTIAL_WEAPONS,
  'Any simple weapon': SIMPLE_WEAPONS,
  'Any simple melee weapon': SIMPLE_MELEE_WEAPONS,
  'Any musical instrument': MUSICAL_INSTRUMENTS,
  'Any other musical instrument': MUSICAL_INSTRUMENTS.filter(instrument => instrument !== 'Lute'),
};

export const CLASS_FIXED_EQUIPMENT: Record<string, string[]> = {
  Barbarian: ["Explorer's Pack", 'Four Javelins'],
  Bard: ['Leather Armor', 'Dagger'],
  Cleric: ['Shield', 'Holy Symbol'],
  Druid: ['Leather Armor', "Explorer's Pack", 'Druidic Focus'],
  Fighter: [],
  Monk: ['10 Darts'],
  Paladin: ['Chain Mail', 'Holy Symbol'],
  Ranger: ['Longbow', '20 Arrows'],
  Rogue: ['Leather Armor', 'Two Daggers', "Thieves' Tools"],
  Sorcerer: ['Two Daggers'],
  Warlock: ['Leather Armor', 'Two Daggers'],
  Wizard: ['Spellbook'],
};

export const EQUIPMENT_PACK_CONTENTS: Record<string, string> = {
  "Burglar's Pack":
    'Includes a backpack, 1,000 ball bearings, 10 feet of string, a bell, 5 candles, a crowbar, a hammer, 10 pitons, a hooded lantern, 2 flasks of oil, 5 days of rations, a tinderbox, and a waterskin, plus 50 feet of hempen rope strapped to the side.',
  "Diplomat's Pack":
    'Includes a chest, 2 cases for maps and scrolls, a set of fine clothes, a bottle of ink, an ink pen, a lamp, 2 flasks of oil, 5 sheets of paper, a vial of perfume, sealing wax, and soap.',
  "Dungeoneer’s Pack":
    'Includes a backpack, a crowbar, a hammer, 10 pitons, 10 torches, a tinderbox, 10 days of rations, and a waterskin, plus 50 feet of hempen rope strapped to the side.',
  "Dungeoneer's Pack":
    'Includes a backpack, a crowbar, a hammer, 10 pitons, 10 torches, a tinderbox, 10 days of rations, and a waterskin, plus 50 feet of hempen rope strapped to the side.',
  "Entertainer's Pack":
    'Includes a backpack, a bedroll, 2 costumes, 5 candles, 5 days of rations, a waterskin, and a disguise kit.',
  "Explorer’s Pack":
    'Includes a backpack, a bedroll, a mess kit, a tinderbox, 10 torches, 10 days of rations, and a waterskin, plus 50 feet of hempen rope strapped to the side.',
  "Explorer's Pack":
    'Includes a backpack, a bedroll, a mess kit, a tinderbox, 10 torches, 10 days of rations, and a waterskin, plus 50 feet of hempen rope strapped to the side.',
  "Priest’s Pack":
    'Includes a backpack, a blanket, 10 candles, a tinderbox, an alms box, 2 blocks of incense, a censer, vestments, 2 days of rations, and a waterskin.',
  "Priest's Pack":
    'Includes a backpack, a blanket, 10 candles, a tinderbox, an alms box, 2 blocks of incense, a censer, vestments, 2 days of rations, and a waterskin.',
  "Scholar’s Pack":
    'Includes a backpack, a book of lore, a bottle of ink, an ink pen, 10 sheets of parchment, a little bag of sand, and a small knife.',
  "Scholar's Pack":
    'Includes a backpack, a book of lore, a bottle of ink, an ink pen, 10 sheets of parchment, a little bag of sand, and a small knife.',
};

export const CLASS_EQUIPMENT_CHOICES: Record<string, ClassEquipmentChoice[]> = {
  Barbarian: [
    {
      key: 'barbarian-weapon-primary',
      label: 'Choose a starting weapon',
      options: ['Greataxe', 'Any martial melee weapon'],
    },
    {
      key: 'barbarian-weapon-secondary',
      label: 'Choose your backup weapons',
      options: ['Two handaxes', 'Any simple weapon'],
    },
  ],
  Bard: [
    {
      key: 'bard-weapon-primary',
      label: 'Choose a starting weapon',
      options: ['Rapier', 'Longsword', 'Any simple weapon'],
    },
    {
      key: 'bard-pack',
      label: 'Choose your pack',
      options: ["Diplomat's Pack", "Entertainer's Pack"],
    },
    {
      key: 'bard-instrument',
      label: 'Choose your starting instrument',
      options: ['Lute', 'Any other musical instrument'],
    },
  ],
  Cleric: [
    {
      key: 'cleric-weapon',
      label: 'Choose a starting weapon',
      options: ['Mace', 'Warhammer'],
    },
    {
      key: 'cleric-armor',
      label: 'Choose your armor',
      options: ['Scale Mail', 'Leather Armor', 'Chain Mail'],
    },
    {
      key: 'cleric-secondary',
      label: 'Choose a backup weapon',
      options: ['Light Crossbow, 20 Bolts', 'Any simple weapon'],
    },
    {
      key: 'cleric-pack',
      label: 'Choose your pack',
      options: ["Priest's Pack", "Explorer's Pack"],
    },
  ],
  Druid: [
    {
      key: 'druid-primary',
      label: 'Choose a primary item',
      options: ['Wooden Shield', 'Any simple weapon'],
    },
    {
      key: 'druid-secondary',
      label: 'Choose a weapon',
      options: ['Scimitar', 'Any simple melee weapon'],
    },
  ],
  Fighter: [
    {
      key: 'fighter-armor',
      label: 'Choose your armor package',
      options: ['Chain Mail', 'Leather Armor, Longbow, 20 Arrows'],
    },
    {
      key: 'fighter-primary',
      label: 'Choose your main weapons',
      options: ['Any martial weapon, Shield', 'Any martial weapon, Any martial weapon'],
    },
    {
      key: 'fighter-secondary',
      label: 'Choose your side gear',
      options: ['Light Crossbow, 20 Bolts', 'Two Handaxes'],
    },
    {
      key: 'fighter-pack',
      label: 'Choose your pack',
      options: ["Dungeoneer's Pack", "Explorer's Pack"],
    },
  ],
  Monk: [
    {
      key: 'monk-weapon',
      label: 'Choose a starting weapon',
      options: ['Shortsword', 'Any simple weapon'],
    },
    {
      key: 'monk-pack',
      label: 'Choose your pack',
      options: ["Dungeoneer's Pack", "Explorer's Pack"],
    },
  ],
  Paladin: [
    {
      key: 'paladin-primary',
      label: 'Choose your main weapons',
      options: ['Any martial weapon, Shield', 'Any martial weapon, Any martial weapon'],
    },
    {
      key: 'paladin-secondary',
      label: 'Choose your ranged or backup gear',
      options: ['Five Javelins', 'Any simple melee weapon'],
    },
    {
      key: 'paladin-pack',
      label: 'Choose your pack',
      options: ["Priest's Pack", "Explorer's Pack"],
    },
  ],
  Ranger: [
    {
      key: 'ranger-armor',
      label: 'Choose your armor',
      options: ['Scale Mail', 'Leather Armor'],
    },
    {
      key: 'ranger-weapons',
      label: 'Choose your melee weapons',
      options: ['Two Shortswords', 'Any simple melee weapon, Any simple melee weapon'],
    },
    {
      key: 'ranger-pack',
      label: 'Choose your pack',
      options: ["Dungeoneer's Pack", "Explorer's Pack"],
    },
  ],
  Rogue: [
    {
      key: 'rogue-primary',
      label: 'Choose a starting weapon',
      options: ['Rapier', 'Shortsword'],
    },
    {
      key: 'rogue-secondary',
      label: 'Choose your ranged or off-hand weapon',
      options: ['Shortbow, 20 Arrows', 'Shortsword'],
    },
    {
      key: 'rogue-pack',
      label: 'Choose your pack',
      options: ["Burglar's Pack", "Dungeoneer's Pack", "Explorer's Pack"],
    },
  ],
  Sorcerer: [
    {
      key: 'sorcerer-weapon',
      label: 'Choose a starting weapon',
      options: ['Light Crossbow, 20 Bolts', 'Any simple weapon'],
    },
    {
      key: 'sorcerer-focus',
      label: 'Choose a focus',
      options: ['Component Pouch', 'Arcane Focus'],
    },
    {
      key: 'sorcerer-pack',
      label: 'Choose your pack',
      options: ["Dungeoneer's Pack", "Explorer's Pack"],
    },
  ],
  Warlock: [
    {
      key: 'warlock-weapon-ranged',
      label: 'Choose your ranged or backup weapon',
      options: ['Light Crossbow, 20 Bolts', 'Any simple weapon'],
    },
    {
      key: 'warlock-focus',
      label: 'Choose a focus',
      options: ['Component Pouch', 'Arcane Focus'],
    },
    {
      key: 'warlock-pack',
      label: 'Choose your pack',
      options: ["Scholar's Pack", "Dungeoneer's Pack"],
    },
    {
      key: 'warlock-weapon-fixed',
      label: 'Choose your included simple weapon',
      options: ['Any simple weapon'],
    },
  ],
  Wizard: [
    {
      key: 'wizard-weapon',
      label: 'Choose a starting weapon',
      options: ['Quarterstaff', 'Dagger'],
    },
    {
      key: 'wizard-focus',
      label: 'Choose a focus',
      options: ['Component Pouch', 'Arcane Focus'],
    },
    {
      key: 'wizard-pack',
      label: 'Choose your pack',
      options: ["Scholar's Pack", "Explorer's Pack"],
    },
  ],
};
