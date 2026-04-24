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

export const SIMPLE_WEAPONS = [
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
};
