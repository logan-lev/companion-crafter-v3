import type { AbilityKey } from '../types/character';

export interface ClassFeature {
  level: number;
  name: string;
  description: string;
}

export interface SpellcastingInfo {
  ability: AbilityKey;
  type: 'full' | 'half' | 'third' | 'pact';
  prepares: boolean;
  spellListKey: string;
  cantripsKnown: number[];
  spellsKnown?: number[];
  // slot counts per level [l1,l2,l3,l4,l5,l6,l7,l8,l9] indexed by char level 1-20
  slots: number[][];
  pactSlots?: number[];
  pactSlotLevel?: number[];
}

export interface ClassData {
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: AbilityKey[];
  armorProf: string[];
  weaponProf: string[];
  toolProf: string[];
  skillCount: number;
  skillOptions: string[];
  features: ClassFeature[];
  spellcasting?: SpellcastingInfo;
  flavorText: string;
}

export interface ClassSubclassOption {
  name: string;
  description: string;
  features: ClassFeature[];
}

export interface TotemSpiritOption {
  name: string;
  level3: ClassFeature;
  level6: ClassFeature;
  level14: ClassFeature;
}

// Spell slot tables: index = char level - 1, value = [L1,L2,L3,L4,L5,L6,L7,L8,L9]
const FULL_CASTER_SLOTS: number[][] = [
  [2,0,0,0,0,0,0,0,0], // 1
  [3,0,0,0,0,0,0,0,0], // 2
  [4,2,0,0,0,0,0,0,0], // 3
  [4,3,0,0,0,0,0,0,0], // 4
  [4,3,2,0,0,0,0,0,0], // 5
  [4,3,3,0,0,0,0,0,0], // 6
  [4,3,3,1,0,0,0,0,0], // 7
  [4,3,3,2,0,0,0,0,0], // 8
  [4,3,3,3,1,0,0,0,0], // 9
  [4,3,3,3,2,0,0,0,0], // 10
  [4,3,3,3,2,1,0,0,0], // 11
  [4,3,3,3,2,1,0,0,0], // 12
  [4,3,3,3,2,1,1,0,0], // 13
  [4,3,3,3,2,1,1,0,0], // 14
  [4,3,3,3,2,1,1,1,0], // 15
  [4,3,3,3,2,1,1,1,0], // 16
  [4,3,3,3,2,1,1,1,1], // 17
  [4,3,3,3,3,1,1,1,1], // 18
  [4,3,3,3,3,2,1,1,1], // 19
  [4,3,3,3,3,2,2,1,1], // 20
];

const HALF_CASTER_SLOTS: number[][] = [
  [0,0,0,0,0,0,0,0,0], // 1
  [2,0,0,0,0,0,0,0,0], // 2
  [3,0,0,0,0,0,0,0,0], // 3
  [3,0,0,0,0,0,0,0,0], // 4
  [4,2,0,0,0,0,0,0,0], // 5
  [4,2,0,0,0,0,0,0,0], // 6
  [4,3,0,0,0,0,0,0,0], // 7
  [4,3,0,0,0,0,0,0,0], // 8
  [4,3,2,0,0,0,0,0,0], // 9
  [4,3,2,0,0,0,0,0,0], // 10
  [4,3,3,0,0,0,0,0,0], // 11
  [4,3,3,0,0,0,0,0,0], // 12
  [4,3,3,1,0,0,0,0,0], // 13
  [4,3,3,1,0,0,0,0,0], // 14
  [4,3,3,2,0,0,0,0,0], // 15
  [4,3,3,2,0,0,0,0,0], // 16
  [4,3,3,3,1,0,0,0,0], // 17
  [4,3,3,3,1,0,0,0,0], // 18
  [4,3,3,3,2,0,0,0,0], // 19
  [4,3,3,3,2,0,0,0,0], // 20
];

// Warlock pact magic: [slots, slot level] indexed by char level 1-20
export const WARLOCK_PACT_SLOTS = [1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4];
export const WARLOCK_PACT_LEVEL = [1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5];
export const BARBARIAN_RAGES_BY_LEVEL = [2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,999];
export const BARBARIAN_RAGE_DAMAGE_BY_LEVEL = [2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4];
export const BARBARIAN_TOTEM_SPIRITS: TotemSpiritOption[] = [
  {
    name: 'Bear',
    level3: {
      level: 3,
      name: 'Totem Spirit (Bear)',
      description: 'While raging, you have resistance to all damage except psychic damage. The spirit of the bear makes you tough enough to stand up to any punishment.',
    },
    level6: { level: 6, name: 'Aspect of the Beast (Bear)', description: 'You gain the might of a bear. Your carrying capacity doubles, and you have advantage on Strength checks made to push, pull, lift, or break objects.' },
    level14: { level: 14, name: 'Totemic Attunement (Bear)', description: "While raging, any creature within 5 feet of you that is hostile to you has disadvantage on attack rolls against targets other than you or another character with this feature. An enemy is immune to this effect if it can't see or hear you or if it can't be frightened." },
  },
  {
    name: 'Eagle',
    level3: {
      level: 3,
      name: 'Totem Spirit (Eagle)',
      description: "While you're raging and aren't wearing heavy armor, other creatures have disadvantage on opportunity attack rolls against you, and you can use the Dash action as a bonus action on your turn. The spirit of the eagle makes you into a predator who can weave through the fray with ease.",
    },
    level6: { level: 6, name: 'Aspect of the Beast (Eagle)', description: "You gain the eyesight of an eagle. You can see up to 1 mile away with no difficulty, able to discern even fine details as though looking at something no more than 100 feet away from you. Additionally, dim light doesn't impose disadvantage on your Wisdom (Perception) checks." },
    level14: { level: 14, name: 'Totemic Attunement (Eagle)', description: 'While raging, you have a flying speed equal to your current walking speed. This benefit works only in short bursts; you fall if you end your turn in the air and nothing else is holding you aloft.' },
  },
  {
    name: 'Wolf',
    level3: {
      level: 3,
      name: 'Totem Spirit (Wolf)',
      description: "While you're raging, your friends have advantage on melee attack rolls against any creature within 5 feet of you that is hostile to you. The spirit of the wolf makes you a leader of hunters.",
    },
    level6: { level: 6, name: 'Aspect of the Beast (Wolf)', description: 'You gain the hunting sensibilities of a wolf. You can track other creatures while traveling at a fast pace, and you can move stealthily while traveling at a normal pace.' },
    level14: { level: 14, name: 'Totemic Attunement (Wolf)', description: 'While you’re raging, you can use a bonus action on your turn to knock a Large or smaller creature prone when you hit it with a melee weapon attack.' },
  },
];

export const BARBARIAN_PRIMAL_PATHS: ClassSubclassOption[] = [
  {
    name: 'Path of the Berserker',
    description: 'Berserkers channel rage into raw frenzy, sacrificing restraint for relentless aggression and intimidation.',
    features: [
      { level: 3, name: 'Frenzy', description: 'While raging, you can choose to frenzy. If you do, for the duration of your rage you can make a single melee weapon attack as a bonus action on each of your turns after this one. When your rage ends, you suffer one level of exhaustion.' },
      { level: 6, name: 'Mindless Rage', description: 'You can’t be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the duration of the rage.' },
      { level: 10, name: 'Intimidating Presence', description: "You can use your action to frighten someone with your menacing presence. When you do so, choose one creature that you can see within 30 feet of you. If the creature can see or hear you, it must succeed on a Wisdom saving throw (DC equal to 8 + your proficiency bonus + your Charisma modifier) or be frightened of you until the end of your next turn. On subsequent turns, you can use your action to extend the duration of this effect on the frightened creature until the end of your next turn. This effect ends if the creature ends its turn out of line of sight or more than 60 feet away from you. If the creature succeeds on its saving throw, you can't use this feature on that creature again for 24 hours." },
      { level: 14, name: 'Retaliation', description: 'When you take damage from a creature within 5 feet of you, you can use your reaction to make a melee weapon attack against that creature.' },
    ],
  },
  {
    name: 'Path of the Totem Warrior',
    description: 'Totem Warriors bind their rage to spiritual animal guides, gaining mystical resilience and primal utility.',
    features: [
      {
        level: 3,
        name: 'Spirit Seeker',
        description: 'Yours is a path that seeks attunement with the natural world, giving you a kinship with beasts. When you adopt this path, you gain the ability to cast the beast sense and speak with animals spells, but only as rituals.',
      },
      {
        level: 3,
        name: 'Totem Spirit',
        description: 'When you adopt this path, you choose a totem spirit and gain its feature. You must make or acquire a physical totem object-an amulet or similar adornment that incorporates fur or feathers, claws, teeth, or bones of the totem animal. At your option, you also gain minor physical attributes that are reminiscent of your totem spirit. For example, if you have a bear totem spirit, you might be unusually hairy and thick-skinned, or if your totem is the eagle, your eyes turn bright yellow. Your totem animal might be an animal related to those listed here but more appropriate to your homeland. For example, you could choose a hawk or vulture in place of an eagle.',
      },
      { level: 10, name: 'Spirit Walker', description: 'You can cast Commune with Nature as a ritual. When you do so, a spiritual version of one of the animals you chose for Totem Spirit or Aspect of the Beast appears to you to convey the information you seek.' },
    ],
  },
];

export const CLASS_DATA: ClassData[] = [
  {
    name: 'Barbarian',
    hitDie: 12,
    primaryAbility: 'Strength',
    savingThrows: ['str', 'con'],
    armorProf: ['Light Armor', 'Medium Armor', 'Shields'],
    weaponProf: ['Simple Weapons', 'Martial Weapons'],
    toolProf: [],
    skillCount: 2,
    skillOptions: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    flavorText: 'A fierce warrior of primitive background who can enter a battle rage, channeling primal power to become a devastating force on the battlefield.',
    features: [
      { level: 1, name: 'Rage', description: "In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action. While raging, you gain the following benefits if you aren't wearing heavy armor:\n• You have advantage on Strength checks and Strength saving throws.\n• When you make a melee weapon attack using Strength, you gain a bonus to the damage roll that increases as you gain levels as a barbarian, as shown in the Rage Damage column of the Barbarian table.\n• You have resistance to bludgeoning, piercing, and slashing damage.\nIf you are able to cast spells, you can't cast them or concentrate on them while raging.\nYour rage lasts for 1 minute. It ends early if you are knocked unconscious or if your turn ends and you haven't attacked a hostile creature since your last turn or taken damage since then. You can also end your rage on your turn as a bonus action.\nOnce you have raged the number of times shown for your barbarian level in the Rages column of the Barbarian table, you must finish a long rest before you can rage again." },
      { level: 1, name: 'Unarmored Defense', description: 'While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.' },
      { level: 2, name: 'Reckless Attack', description: 'You can throw aside all concern for defense to attack with fierce desperation. When you make your first attack on your turn, you can decide to attack recklessly, giving you advantage on melee weapon attack rolls using Strength during this turn, but attack rolls against you have advantage until your next turn.' },
      { level: 2, name: 'Danger Sense', description: "You gain an uncanny sense of when things nearby aren't as they should be, giving you an edge when you dodge away from danger. You have advantage on Dexterity saving throws against effects that you can see, such as traps and spells. To gain this benefit, you can't be blinded, deafened, or incapacitated." },
      { level: 3, name: 'Primal Path', description: 'You choose a path that shapes the nature of your rage. Choose the Path of the Berserker or the Path of the Totem Warrior. Your choice grants you features at 3rd level and again at 6th, 10th, and 14th levels.' },
      { level: 4, name: 'Ability Score Improvement', description: "You can increase one ability score by 2, or two ability scores by 1 each. You can't increase an ability score above 20 using this feature. Also at levels 8, 12, 16, and 19." },
      { level: 5, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
      { level: 5, name: 'Fast Movement', description: 'Your speed increases by 10 feet while you aren\'t wearing heavy armor.' },
      { level: 7, name: 'Feral Instinct', description: 'Your instincts are so honed that you have advantage on initiative rolls. Additionally, if you are surprised at the beginning of combat and aren\'t incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else.' },
      { level: 9, name: 'Brutal Critical', description: 'You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack. This increases to two additional dice at 13th level and three at 17th level.' },
      { level: 11, name: 'Relentless Rage', description: "Your rage can keep you fighting despite grievous wounds. If you drop to 0 hit points while you're raging and don't die outright, you can make a DC 10 Constitution saving throw. If you succeed, you drop to 1 hit point instead. Each time you use this feature after the first, the DC increases by 5. When you finish a short or long rest, the DC resets to 10." },
      { level: 15, name: 'Persistent Rage', description: 'Your rage is so fierce that it ends early only if you fall unconscious or if you choose to end it.' },
      { level: 18, name: 'Indomitable Might', description: 'If your total for a Strength check is less than your Strength score, you can use that score in place of the total.' },
      { level: 20, name: 'Primal Champion', description: 'You embody the power of the wilds. Your Strength and Constitution scores increase by 4, and their maximum is now 24.' },
    ],
  },
  {
    name: 'Bard',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: ['dex', 'cha'],
    armorProf: ['Light Armor'],
    weaponProf: ['Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    toolProf: ['Three musical instruments of your choice'],
    skillCount: 3,
    skillOptions: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'],
    flavorText: 'An inspiring magician whose power echoes the music of creation. Bards weave magic through words and music to inspire allies and confound enemies.',
    spellcasting: {
      ability: 'cha',
      type: 'full',
      prepares: false,
      spellListKey: 'bard',
      cantripsKnown: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
      spellsKnown: [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
      slots: FULL_CASTER_SLOTS,
    },
    features: [
      { level: 1, name: 'Spellcasting', description: 'You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music. You know 2 cantrips and 4 spells from the bard spell list.' },
      { level: 1, name: 'Bardic Inspiration', description: 'You can inspire others through stirring words or music. As a bonus action, you can give one creature other than yourself a Bardic Inspiration die (d6). Once within the next 10 minutes, the creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw. Uses = CHA modifier, recharge on long rest. The die becomes d8 at 5th level, d10 at 10th, d12 at 15th.' },
      { level: 2, name: 'Jack of All Trades', description: 'You can add half your proficiency bonus, rounded down, to any ability check you make that doesn\'t already include your proficiency bonus.' },
      { level: 2, name: 'Song of Rest', description: 'You can use soothing music or oration to help revitalize your wounded allies during a short rest. Each friendly creature who spends hit dice regains an extra 1d6 HP (increases at higher levels).' },
      { level: 3, name: 'Bard College', description: 'You delve into the advanced techniques of a bard college of your choice (Lore, Valor, etc.). Your choice grants you features at 3rd, 6th, and 14th level.' },
      { level: 3, name: 'Expertise', description: 'Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make using either of those skills. At 10th level, choose two more.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 5, name: 'Font of Inspiration', description: 'You now regain all your Bardic Inspiration uses when you finish a short or long rest.' },
      { level: 6, name: 'Countercharm', description: 'You gain the ability to use musical notes or words of power to disrupt mind-influencing effects. As an action, you can start a performance. Each friendly creature within 30 feet has advantage on saving throws against being frightened or charmed.' },
      { level: 10, name: 'Magical Secrets', description: 'You have plundered magical knowledge from a wide spectrum of disciplines. Choose two spells from any class. These count as bard spells for you. You gain two more at 14th and 18th level.' },
      { level: 20, name: 'Superior Inspiration', description: 'When you roll initiative and have no uses of Bardic Inspiration left, you regain one use.' },
    ],
  },
  {
    name: 'Cleric',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: ['wis', 'cha'],
    armorProf: ['Light Armor', 'Medium Armor', 'Shields'],
    weaponProf: ['Simple Weapons'],
    toolProf: [],
    skillCount: 2,
    skillOptions: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    flavorText: 'A priestly champion who wields divine magic in service of a higher power. Clerics combine healing and support magic with the ability to wade into melee.',
    spellcasting: {
      ability: 'wis',
      type: 'full',
      prepares: true,
      spellListKey: 'cleric',
      cantripsKnown: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
      slots: FULL_CASTER_SLOTS,
    },
    features: [
      { level: 1, name: 'Spellcasting', description: 'As a conduit for divine power, you can cast cleric spells. You prepare WIS modifier + cleric level spells from the full cleric spell list after each long rest.' },
      { level: 1, name: 'Divine Domain', description: 'You choose a domain related to your deity (Life, Light, Trickery, War, Knowledge, Nature, Tempest). Your choice grants you domain spells and other features at 1st, 2nd, 6th, 8th, and 17th level.' },
      { level: 2, name: 'Channel Divinity', description: 'You gain the ability to channel divine energy, using it to fuel magical effects. You start with two effects: Turn Undead and an effect determined by your domain. 1 use per short or long rest (2 uses at L6, 3 at L18).' },
      { level: 2, name: 'Turn Undead', description: 'As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead within 30 feet must make a Wisdom saving throw. If it fails, it is turned for 1 minute or until it takes damage.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 5, name: 'Destroy Undead', description: 'When an undead fails its saving throw against your Turn Undead, the creature is instantly destroyed if its CR is at or below a certain threshold (1/2 at L5, 1 at L8, 2 at L11, 3 at L14, 4 at L17).' },
      { level: 10, name: 'Divine Intervention', description: 'You can call on your deity to intervene on your behalf when your need is great. Roll d100 — if you roll equal to or lower than your cleric level, your deity intervenes. At 20th level, it automatically succeeds.' },
    ],
  },
  {
    name: 'Druid',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: ['int', 'wis'],
    armorProf: ['Light Armor', 'Medium Armor', 'Shields (non-metal)'],
    weaponProf: ['Clubs', 'Daggers', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears'],
    toolProf: ["Herbalism Kit"],
    skillCount: 2,
    skillOptions: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
    flavorText: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms. Druids revere nature above all, gaining their spells and other magical powers from nature itself.',
    spellcasting: {
      ability: 'wis',
      type: 'full',
      prepares: true,
      spellListKey: 'druid',
      cantripsKnown: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
      slots: FULL_CASTER_SLOTS,
    },
    features: [
      { level: 1, name: 'Druidic', description: 'You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages.' },
      { level: 1, name: 'Spellcasting', description: 'Drawing on divine essence of nature, you can cast druid spells. You prepare WIS modifier + druid level spells from the druid spell list after each long rest.' },
      { level: 2, name: 'Wild Shape', description: 'You can use your action to magically assume the shape of a beast you have seen before. CR limit: 1/4 at L2 (no swim/fly speed), 1/2 at L4 (no fly speed), 1 at L8. You can use this feature twice per short or long rest.' },
      { level: 2, name: 'Druid Circle', description: 'You choose to identify with a circle of druids (Circle of the Land, Circle of the Moon, etc.). Your choice grants you features at 2nd, 6th, 10th, and 14th level.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 18, name: 'Timeless Body', description: 'The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year.' },
      { level: 18, name: 'Beast Spells', description: 'You can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components of a druid spell while in a beast shape.' },
      { level: 20, name: 'Archdruid', description: 'You can use your Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost.' },
    ],
  },
  {
    name: 'Fighter',
    hitDie: 10,
    primaryAbility: 'Strength or Dexterity',
    savingThrows: ['str', 'con'],
    armorProf: ['All Armor', 'Shields'],
    weaponProf: ['Simple Weapons', 'Martial Weapons'],
    toolProf: [],
    skillCount: 2,
    skillOptions: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
    flavorText: 'A master of martial combat, skilled with a variety of weapons and armor. Fighters have mastered the art of combat, through training or experience.',
    features: [
      { level: 1, name: 'Fighting Style', description: 'You adopt a particular style of fighting as your specialty. Choose one: Archery (+2 to ranged attack rolls), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon when no other weapon in hand), Great Weapon Fighting, Protection, Two-Weapon Fighting.' },
      { level: 1, name: 'Second Wind', description: 'You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.' },
      { level: 2, name: 'Action Surge', description: 'You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again (twice at level 17).' },
      { level: 3, name: 'Martial Archetype', description: 'You choose an archetype that you strive to emulate in your combat styles and techniques (Champion, Battle Master, Eldritch Knight, etc.). The archetype you choose grants you features at 3rd, 7th, 10th, 15th, and 18th level.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 6, 8, 12, 14, 16, and 19.' },
      { level: 5, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn. The number of attacks increases to three at 11th level and to four at 20th level.' },
      { level: 9, name: 'Indomitable', description: 'You can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can\'t use this feature again until you finish a long rest (two uses at L13, three at L17).' },
    ],
  },
  {
    name: 'Monk',
    hitDie: 8,
    primaryAbility: 'Dexterity & Wisdom',
    savingThrows: ['str', 'dex'],
    armorProf: [],
    weaponProf: ['Simple Weapons', 'Shortswords'],
    toolProf: ['One type of artisan\'s tools or one musical instrument'],
    skillCount: 2,
    skillOptions: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    flavorText: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection. Monks channel ki — an energy that flows through living bodies.',
    features: [
      { level: 1, name: 'Unarmored Defense', description: 'While you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.' },
      { level: 1, name: 'Martial Arts', description: 'Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons. You can use DEX instead of STR, use d4 unarmed damage (increases: d6 at 5, d8 at 11, d10 at 17), and make an unarmed strike as a bonus action when you attack with a monk weapon.' },
      { level: 2, name: 'Ki', description: 'Your training allows you to harness the mystic energy of ki. You have ki points equal to your monk level. You regain spent ki on a short or long rest. Flurry of Blows: spend 1 ki after Attack action to make 2 unarmed strikes as bonus action. Patient Defense: spend 1 ki to Dodge as bonus action. Step of the Wind: spend 1 ki to Dash or Disengage as bonus action.' },
      { level: 2, name: 'Unarmored Movement', description: 'Your speed increases by 10 feet while you aren\'t wearing armor or wielding a shield. This increases by 5 feet at 6th, 10th, 14th, and 18th level.' },
      { level: 3, name: 'Monastic Tradition', description: 'You commit yourself to a monastic tradition (Way of the Open Hand, Way of Shadow, Way of the Four Elements, etc.). Your tradition grants you features at 3rd, 6th, 11th, and 17th level.' },
      { level: 3, name: 'Deflect Missiles', description: 'You can use your reaction to deflect or catch the missile when you are hit by a ranged weapon attack. The damage is reduced by 1d10 + your DEX modifier + your monk level. If you reduce it to 0, you can spend 1 ki to throw the missile back.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 4, name: 'Slow Fall', description: 'You can use your reaction when you fall to reduce any falling damage you take by an amount equal to five times your monk level.' },
      { level: 5, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
      { level: 5, name: 'Stunning Strike', description: 'You can interfere with the flow of ki in an opponent\'s body. When you hit with a melee weapon attack, spend 1 ki to attempt a stunning strike. The target must succeed on a CON saving throw or be stunned until the end of your next turn.' },
      { level: 6, name: 'Ki-Empowered Strikes', description: 'Your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.' },
      { level: 7, name: 'Evasion', description: 'Your instinctive agility lets you dodge out of the way of certain area effects. When subjected to an effect that allows a DEX saving throw to take half damage, you instead take no damage if you succeed, or only half on a fail.' },
      { level: 10, name: 'Purity of Body', description: 'Your mastery of the ki flowing through you makes you immune to disease and poison.' },
      { level: 13, name: 'Tongue of the Sun and Moon', description: 'You learn to touch the ki of other minds so that you understand all spoken languages and every creature that can understand a language can understand you.' },
      { level: 14, name: 'Diamond Soul', description: 'Your mastery of ki grants you proficiency in all saving throws. Additionally, whenever you make a saving throw and fail, you can spend 1 ki point to reroll it and take the second result.' },
      { level: 20, name: 'Perfect Self', description: 'When you roll for initiative and have no ki points remaining, you regain 4 ki points.' },
    ],
  },
  {
    name: 'Paladin',
    hitDie: 10,
    primaryAbility: 'Strength & Charisma',
    savingThrows: ['wis', 'cha'],
    armorProf: ['All Armor', 'Shields'],
    weaponProf: ['Simple Weapons', 'Martial Weapons'],
    toolProf: [],
    skillCount: 2,
    skillOptions: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    flavorText: 'A holy warrior bound to a sacred oath. Paladins combine martial prowess with divine magic, serving as champions of justice and righteousness.',
    spellcasting: {
      ability: 'cha',
      type: 'half',
      prepares: true,
      spellListKey: 'paladin',
      cantripsKnown: [],
      slots: HALF_CASTER_SLOTS,
    },
    features: [
      { level: 1, name: 'Divine Sense', description: 'The presence of strong evil registers on your senses like a noxious odor, and powerful good rings like heavenly music in your ears. As an action, you know the location of any celestial, fiend, or undead within 60 feet. Uses = 1 + CHA modifier per long rest.' },
      { level: 1, name: 'Lay on Hands', description: 'Your blessed touch can heal wounds. You have a pool of healing power equal to 5 × your paladin level. As an action, touch a creature to restore HP from this pool, or spend 5 points to cure a disease or neutralize a poison.' },
      { level: 2, name: 'Fighting Style', description: 'You adopt a particular style of fighting as your specialty. Choose one: Defense, Dueling, Great Weapon Fighting, or Protection.' },
      { level: 2, name: 'Spellcasting', description: 'You have learned to draw on divine magic through meditation and prayer to cast paladin spells. You prepare CHA modifier + half paladin level spells.' },
      { level: 2, name: 'Divine Smite', description: 'When you hit a creature with a melee weapon attack, you can expend one spell slot to deal extra radiant damage: 2d8 for a 1st-level slot + 1d8 per slot level above 1st. +1d8 vs undead or fiends. Max 5d8.' },
      { level: 3, name: 'Divine Health', description: 'The divine magic flowing through you makes you immune to disease.' },
      { level: 3, name: 'Sacred Oath', description: 'You swear the oath that binds you as a paladin forever (Oath of Devotion, Oath of the Ancients, Oath of Vengeance, Oathbreaker). Your oath grants you features at 3rd, 7th, 15th, and 20th level, and a set of oath spells.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 5, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
      { level: 6, name: 'Aura of Protection', description: 'Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus equal to your Charisma modifier (minimum +1). At 18th level, the range increases to 30 feet.' },
      { level: 10, name: 'Aura of Courage', description: 'You and friendly creatures within 10 feet can\'t be frightened while you are conscious. At 18th level, the range increases to 30 feet.' },
      { level: 11, name: 'Improved Divine Smite', description: 'You are so suffused with righteous might that all your melee weapon strikes carry divine power with them. Whenever you hit with a melee weapon, the creature takes an extra 1d8 radiant damage.' },
      { level: 14, name: 'Cleansing Touch', description: 'You can use your action to end one spell on yourself or on one willing creature that you touch. Uses = CHA modifier per long rest.' },
    ],
  },
  {
    name: 'Ranger',
    hitDie: 10,
    primaryAbility: 'Dexterity & Wisdom',
    savingThrows: ['str', 'dex'],
    armorProf: ['Light Armor', 'Medium Armor', 'Shields'],
    weaponProf: ['Simple Weapons', 'Martial Weapons'],
    toolProf: [],
    skillCount: 3,
    skillOptions: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    flavorText: 'A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization. Rangers are most at home in the wilderness.',
    spellcasting: {
      ability: 'wis',
      type: 'half',
      prepares: false,
      spellListKey: 'ranger',
      cantripsKnown: [],
      spellsKnown: [0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11],
      slots: HALF_CASTER_SLOTS,
    },
    features: [
      { level: 1, name: 'Favored Enemy', description: 'You have significant experience studying, tracking, hunting, and talking to a certain type of enemy. Choose a type of favored enemy (aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead) or two races of humanoid. You have advantage on Survival checks to track your favored enemies and Intelligence checks to recall information about them. You gain an additional favored enemy at 6th and 14th level.' },
      { level: 1, name: 'Natural Explorer', description: 'You are particularly familiar with one type of natural environment and are adept at traveling and surviving in such regions. Choose a Favored Terrain (arctic, coast, desert, forest, grassland, mountain, swamp, or Underdark). When you make an Intelligence or Wisdom check related to your Favored Terrain you add double your proficiency bonus.' },
      { level: 2, name: 'Fighting Style', description: 'You adopt a style of fighting. Choose from Archery, Defense, Dueling, or Two-Weapon Fighting.' },
      { level: 2, name: 'Spellcasting', description: 'You have learned to use the magical essence of nature to cast spells. You know 2 ranger spells at 2nd level and learn more as you level up.' },
      { level: 3, name: 'Ranger Archetype', description: 'You choose an archetype that you strive to emulate (Hunter, Beast Master, Gloom Stalker, etc.). Your archetype grants features at 3rd, 7th, 11th, and 15th level.' },
      { level: 3, name: 'Primeval Awareness', description: 'You can use your action and expend one ranger spell slot to focus your awareness on the region around you. For 1 minute per level of the slot, you can sense whether the following types of creatures are present within 1 mile: aberrations, celestials, dragons, elementals, fey, fiends, and undead.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 5, name: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
      { level: 8, name: 'Land\'s Stride', description: 'Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard.' },
      { level: 10, name: 'Hide in Plain Sight', description: 'You can spend 1 minute creating camouflage for yourself. You must have access to fresh mud, dirt, plants, soot, and other naturally occurring materials. Once camouflaged, you can try to hide by pressing yourself up against a solid surface. You gain a +10 bonus to Stealth checks as long as you remain there without moving.' },
      { level: 14, name: 'Vanish', description: 'You can use the Hide action as a bonus action on your turn. Also, you can\'t be tracked by nonmagical means, unless you choose to leave a trail.' },
      { level: 18, name: 'Feral Senses', description: 'You gain preternatural senses that help you fight creatures you can\'t see. You don\'t suffer disadvantage on attack rolls against invisible creatures, and you are aware of the location of any invisible creature within 30 feet of you.' },
    ],
  },
  {
    name: 'Rogue',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrows: ['dex', 'int'],
    armorProf: ['Light Armor'],
    weaponProf: ['Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    toolProf: ["Thieves' Tools"],
    skillCount: 4,
    skillOptions: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    flavorText: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies. Rogues rely on skill, stealth, and their foes\' vulnerabilities.',
    features: [
      { level: 1, name: 'Expertise', description: 'Choose two of your skill proficiencies, or one skill proficiency and your proficiency with thieves\' tools. Your proficiency bonus is doubled for any ability check you make using either of the chosen proficiencies. At 6th level, choose two more.' },
      { level: 1, name: 'Sneak Attack', description: 'You know how to strike subtly and exploit a foe\'s distraction. Once per turn, you can deal extra damage to one creature you hit if you have advantage on the attack roll or if another enemy of the target is within 5 feet of it. Damage: 1d6 at L1, increasing by 1d6 every other level up to 10d6 at L19.' },
      { level: 1, name: "Thieves' Cant", description: 'During your rogue training you learned thieves\' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.' },
      { level: 2, name: 'Cunning Action', description: 'Your quick thinking and agility allow you to move and act quickly. You can take a bonus action on each of your turns to Dash, Disengage, or Hide.' },
      { level: 3, name: 'Roguish Archetype', description: 'You choose an archetype that you emulate in the exercise of your rogue abilities (Thief, Assassin, Arcane Trickster, etc.). Your archetype grants you features at 3rd, 9th, 13th, and 17th level.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 10, 12, 16, and 19.' },
      { level: 5, name: 'Uncanny Dodge', description: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\'s damage against you.' },
      { level: 7, name: 'Evasion', description: 'When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.' },
      { level: 11, name: 'Reliable Talent', description: 'You have refined your chosen skills until they approach perfection. Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.' },
      { level: 14, name: 'Blindsense', description: 'If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.' },
      { level: 15, name: 'Slippery Mind', description: 'You have acquired greater mental strength. You gain proficiency in Wisdom saving throws.' },
      { level: 18, name: 'Elusive', description: 'You are so evasive that attackers rarely gain the upper hand against you. No attack roll has advantage against you while you aren\'t incapacitated.' },
      { level: 20, name: 'Stroke of Luck', description: 'You have an uncanny knack for succeeding when you need to. If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. You can\'t use this feature again until you finish a short or long rest.' },
    ],
  },
  {
    name: 'Sorcerer',
    hitDie: 6,
    primaryAbility: 'Charisma',
    savingThrows: ['con', 'cha'],
    armorProf: [],
    weaponProf: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'],
    toolProf: [],
    skillCount: 2,
    skillOptions: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    flavorText: 'A spellcaster who draws on inherent magic from a gift or bloodline, rather than study. Sorcerers carry a magical birthright bestowed upon them by an exotic bloodline.',
    spellcasting: {
      ability: 'cha',
      type: 'full',
      prepares: false,
      spellListKey: 'sorcerer',
      cantripsKnown: [4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
      spellsKnown: [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
      slots: FULL_CASTER_SLOTS,
    },
    features: [
      { level: 1, name: 'Spellcasting', description: 'An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. You know 4 cantrips and 2 spells. Charisma is your spellcasting ability.' },
      { level: 1, name: 'Sorcerous Origin', description: 'Choose a sorcerous origin which describes the source of your innate magical power: Draconic Bloodline, Wild Magic, Storm Sorcery, etc. Your choice grants you features at 1st, 6th, 14th, and 18th level.' },
      { level: 2, name: 'Font of Magic', description: 'You tap into a deep wellspring of magic within yourself. You have sorcery points equal to your sorcerer level. You can convert sorcery points to spell slots and vice versa. Regain on long rest.' },
      { level: 2, name: 'Flexible Casting', description: 'You can use your sorcery points to gain additional spell slots, or sacrifice spell slots to gain additional sorcery points. Bonus: 2pts→L1, 3→L2, 5→L3, 6→L4, 7→L5. Convert slot: L1→1pt, L2→2, L3→3, L4→4, L5→5.' },
      { level: 3, name: 'Metamagic', description: 'You gain the ability to twist your spells to suit your needs. Choose 2 options from: Careful, Distant, Empowered, Extended, Heightened, Quickened, Subtle, Twinned Spell. You gain one more at 10th and 17th level.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 20, name: 'Sorcerous Restoration', description: 'You regain 4 expended sorcery points whenever you finish a short rest.' },
    ],
  },
  {
    name: 'Warlock',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: ['wis', 'cha'],
    armorProf: ['Light Armor'],
    weaponProf: ['Simple Weapons'],
    toolProf: [],
    skillCount: 2,
    skillOptions: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
    flavorText: 'A wielder of magic that is derived from a bargain with an extraplanar entity. Warlocks are seekers of knowledge that lies hidden in the fabric of the multiverse.',
    spellcasting: {
      ability: 'cha',
      type: 'pact',
      prepares: false,
      spellListKey: 'warlock',
      cantripsKnown: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
      spellsKnown: [2,3,4,5,6,7,8,9,10,10,11,11,12,12,14,15,15,15,15,15],
      slots: Array(20).fill([0,0,0,0,0,0,0,0,0]),
    },
    features: [
      { level: 1, name: 'Otherworldly Patron', description: 'You have struck a bargain with an otherworldly being of your choice: The Archfey, The Fiend, The Great Old One, etc. Your choice grants you features at 1st, 6th, 10th, and 14th level.' },
      { level: 1, name: 'Pact Magic', description: 'Your arcane research and the magic bestowed on you by your patron have given you facility with spells. You have spell slots that are regained on a short or long rest. All warlock spell slots are the same level (Pact Slot Level), which increases as you level up. Slots: 1 (L1-2), 2 (L3-4), 2 (L5-6), 3 (L11-16), 4 (L17-20). Slot level: 1st (L1-2), 2nd (L3-4), 3rd (L5-6), 4th (L7-8), 5th (L9+).' },
      { level: 2, name: 'Eldritch Invocations', description: 'In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. You gain 2 invocations at level 2. You gain more as you level up (total of 8 by L15).' },
      { level: 3, name: 'Pact Boon', description: 'Your otherworldly patron bestows a gift upon you for your loyal service. Choose one: Pact of the Chain (familiar), Pact of the Blade (magical weapon), Pact of the Tome (Book of Shadows with 3 cantrips).' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 11, name: 'Mystic Arcanum', description: 'Your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast it once without expending a spell slot. You must finish a long rest before you can do so again. You gain higher-level arcana at 13th (7th), 15th (8th), and 17th (9th) level.' },
      { level: 20, name: 'Eldritch Master', description: 'You can draw on your inner reserve of mystical power while entreating your patron to regain expended spell slots. You can spend 1 minute entreating your patron for aid to regain all your expended spell slots from your Pact Magic feature. Once you regain spell slots with this feature, you must finish a long rest before you can do so again.' },
    ],
  },
  {
    name: 'Wizard',
    hitDie: 6,
    primaryAbility: 'Intelligence',
    savingThrows: ['int', 'wis'],
    armorProf: [],
    weaponProf: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'],
    toolProf: [],
    skillCount: 2,
    skillOptions: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
    flavorText: 'A scholarly magic-user capable of manipulating the structures of reality. Wizards spend their lives in the study of magic, to master the most powerful force in the world.',
    spellcasting: {
      ability: 'int',
      type: 'full',
      prepares: true,
      spellListKey: 'wizard',
      cantripsKnown: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
      slots: FULL_CASTER_SLOTS,
    },
    features: [
      { level: 1, name: 'Spellcasting', description: 'As a student of arcane magic, you have a spellbook containing 6 first-level wizard spells. You prepare INT modifier + wizard level spells from your spellbook each long rest. When you gain a wizard level, you can add 2 spells to your spellbook (of any level you can cast).' },
      { level: 1, name: 'Arcane Recovery', description: 'You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. Their combined level can\'t exceed half your wizard level (minimum 1), and none can be 6th level or higher.' },
      { level: 2, name: 'Arcane Tradition', description: 'You choose an arcane tradition, shaping your practice of magic through one of eight schools (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation). Your choice grants you features at 2nd, 6th, 10th, and 14th level.' },
      { level: 4, name: 'Ability Score Improvement', description: 'You can increase one ability score by 2, or two ability scores by 1 each. Also at levels 8, 12, 16, and 19.' },
      { level: 18, name: 'Spell Mastery', description: 'You have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level and a 2nd-level spell in your spellbook that have the casting time of 1 action. You can cast those spells at their lowest level without expending a spell slot.' },
      { level: 20, name: 'Signature Spells', description: 'You gain mastery over two powerful spells and can cast them with little effort. Choose two 3rd-level wizard spells in your spellbook as your signature spells. You always have these spells prepared and can cast each of them once at 3rd level without expending a spell slot.' },
    ],
  },
];

export function getSpellcasterInfo(className: string): SpellcastingInfo | undefined {
  return CLASS_DATA.find(c => c.name === className)?.spellcasting;
}

function parseAdditionalLevels(description: string): number[] {
  return Array.from(description.matchAll(/levels? ([\d,\sand]+)/gi)).flatMap(match =>
    (match[1] ?? '')
      .replace(/and/gi, ',')
      .split(',')
      .map(part => parseInt(part.trim(), 10))
      .filter(Number.isFinite)
  );
}

function cleanRepeatedLevelText(description: string): string {
  return description.replace(/\s*Also at levels? [^.]+\./gi, '').trim();
}

function expandFeature(feature: ClassFeature): ClassFeature[] {
  if (feature.name === 'Ability Score Improvement') {
    const baseDescription = cleanRepeatedLevelText(feature.description);
    return [feature.level, ...parseAdditionalLevels(feature.description)]
      .sort((a, b) => a - b)
      .map(level => ({ level, name: feature.name, description: baseDescription }));
  }

  if (feature.name === 'Brutal Critical') {
    return [
      { level: 9, name: 'Brutal Critical (1 die)', description: 'You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack.' },
      { level: 13, name: 'Brutal Critical (2 dice)', description: 'You can roll two additional weapon damage dice when determining the extra damage for a critical hit with a melee attack.' },
      { level: 17, name: 'Brutal Critical (3 dice)', description: 'You can roll three additional weapon damage dice when determining the extra damage for a critical hit with a melee attack.' },
    ];
  }

  return [feature];
}

export function getClassFeatureTimeline(
  className: string,
  options?: {
    barbarianPath?: string;
    barbarianTotemSpirit?: string;
    barbarianAspectSpirit?: string;
    barbarianAttunementSpirit?: string;
  }
): ClassFeature[] {
  const cls = CLASS_DATA.find(c => c.name === className);
  if (!cls) return [];

  const expanded = cls.features.flatMap(expandFeature);
  const subclassFeatures =
    className === 'Barbarian' && options?.barbarianPath
      ? options.barbarianPath === 'Path of the Totem Warrior'
        ? (() => {
            const base = BARBARIAN_PRIMAL_PATHS.find(path => path.name === options.barbarianPath)?.features ?? [];
            const selectedLevel3 = BARBARIAN_TOTEM_SPIRITS.find(option => option.name === options.barbarianTotemSpirit);
            const selectedLevel6 = BARBARIAN_TOTEM_SPIRITS.find(option => option.name === options.barbarianAspectSpirit);
            const selectedLevel14 = BARBARIAN_TOTEM_SPIRITS.find(option => option.name === options.barbarianAttunementSpirit);

            return [
              ...base,
              ...(selectedLevel3 ? [selectedLevel3.level3] : []),
              ...(selectedLevel6 ? [selectedLevel6.level6] : []),
              ...(selectedLevel14 ? [selectedLevel14.level14] : []),
            ];
          })()
        : BARBARIAN_PRIMAL_PATHS.find(path => path.name === options.barbarianPath)?.features ?? []
      : [];

  return [...expanded, ...subclassFeatures].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });
}

export function getFeaturesUpToLevel(
  className: string,
  level: number,
  options?: {
    barbarianPath?: string;
    barbarianTotemSpirit?: string;
    barbarianAspectSpirit?: string;
    barbarianAttunementSpirit?: string;
  }
): ClassFeature[] {
  return getClassFeatureTimeline(className, options).filter(f => f.level <= level);
}

export function getSlotsAtLevel(spellcasting: SpellcastingInfo, charLevel: number): number[] {
  return spellcasting.slots[charLevel - 1] ?? Array(9).fill(0);
}

export function getCantripsKnown(spellcasting: SpellcastingInfo, charLevel: number): number {
  return spellcasting.cantripsKnown[charLevel - 1] ?? 0;
}

export function getSpellsKnown(spellcasting: SpellcastingInfo, charLevel: number): number {
  if (!spellcasting.spellsKnown) return 0;
  return spellcasting.spellsKnown[charLevel - 1] ?? 0;
}

export function maxSpellLevel(slots: number[]): number {
  for (let i = 8; i >= 0; i--) {
    if (slots[i] > 0) return i + 1;
  }
  return 0;
}
