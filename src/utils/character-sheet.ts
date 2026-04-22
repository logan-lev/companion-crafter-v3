import type { Attack, Character, InventoryItem, Spell, SpellSlots } from '../types/character';
import { calcMod, LANGUAGES, parseLevel } from '../data/srd';
import { CLASS_DATA, getSlotsAtLevel, maxSpellLevel, type ClassData } from '../data/srd-classes';
import { getSpellsForClass, type SpellData } from '../data/srd-spells';

const CURRENCY_KEYS = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;

type CurrencyKey = typeof CURRENCY_KEYS[number];

type CurrencyMap = Character['currency'];

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twenty: 20,
  fifty: 50,
};

interface WeaponTemplate {
  damage: string;
  category: 'simple' | 'martial';
  kind: 'melee' | 'ranged';
  finesse?: boolean;
}

const WEAPON_TEMPLATES: Record<string, WeaponTemplate> = {
  club: { damage: '1d4 bludgeoning', category: 'simple', kind: 'melee' },
  dagger: { damage: '1d4 piercing', category: 'simple', kind: 'melee', finesse: true },
  greatclub: { damage: '1d8 bludgeoning', category: 'simple', kind: 'melee' },
  handaxe: { damage: '1d6 slashing', category: 'simple', kind: 'melee' },
  javelin: { damage: '1d6 piercing', category: 'simple', kind: 'melee' },
  'light hammer': { damage: '1d4 bludgeoning', category: 'simple', kind: 'melee' },
  mace: { damage: '1d6 bludgeoning', category: 'simple', kind: 'melee' },
  quarterstaff: { damage: '1d6 bludgeoning', category: 'simple', kind: 'melee' },
  sickle: { damage: '1d4 slashing', category: 'simple', kind: 'melee' },
  spear: { damage: '1d6 piercing', category: 'simple', kind: 'melee' },
  crossbow: { damage: '1d8 piercing', category: 'simple', kind: 'ranged' },
  'light crossbow': { damage: '1d8 piercing', category: 'simple', kind: 'ranged' },
  dart: { damage: '1d4 piercing', category: 'simple', kind: 'ranged', finesse: true },
  shortbow: { damage: '1d6 piercing', category: 'simple', kind: 'ranged' },
  sling: { damage: '1d4 bludgeoning', category: 'simple', kind: 'ranged' },
  battleaxe: { damage: '1d8 slashing', category: 'martial', kind: 'melee' },
  flail: { damage: '1d8 bludgeoning', category: 'martial', kind: 'melee' },
  glaive: { damage: '1d10 slashing', category: 'martial', kind: 'melee' },
  greataxe: { damage: '1d12 slashing', category: 'martial', kind: 'melee' },
  greatsword: { damage: '2d6 slashing', category: 'martial', kind: 'melee' },
  halberd: { damage: '1d10 slashing', category: 'martial', kind: 'melee' },
  lance: { damage: '1d12 piercing', category: 'martial', kind: 'melee' },
  longsword: { damage: '1d8 slashing', category: 'martial', kind: 'melee' },
  maul: { damage: '2d6 bludgeoning', category: 'martial', kind: 'melee' },
  morningstar: { damage: '1d8 piercing', category: 'martial', kind: 'melee' },
  pike: { damage: '1d10 piercing', category: 'martial', kind: 'melee' },
  rapier: { damage: '1d8 piercing', category: 'martial', kind: 'melee', finesse: true },
  scimitar: { damage: '1d6 slashing', category: 'martial', kind: 'melee', finesse: true },
  shortsword: { damage: '1d6 piercing', category: 'martial', kind: 'melee', finesse: true },
  trident: { damage: '1d6 piercing', category: 'martial', kind: 'melee' },
  'war pick': { damage: '1d8 piercing', category: 'martial', kind: 'melee' },
  warhammer: { damage: '1d8 bludgeoning', category: 'martial', kind: 'melee' },
  whip: { damage: '1d4 slashing', category: 'martial', kind: 'melee', finesse: true },
  blowgun: { damage: '1 piercing', category: 'martial', kind: 'ranged' },
  'hand crossbow': { damage: '1d6 piercing', category: 'martial', kind: 'ranged' },
  'heavy crossbow': { damage: '1d10 piercing', category: 'martial', kind: 'ranged' },
  longbow: { damage: '1d8 piercing', category: 'martial', kind: 'ranged' },
  net: { damage: 'Special', category: 'martial', kind: 'ranged' },
};

const WEAPON_NAMES = new Set(Object.keys(WEAPON_TEMPLATES));

function emptyCurrency(): CurrencyMap {
  return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function singularizeWord(word: string): string {
  const irregulars: Record<string, string> = {
    daggers: 'dagger',
    arrows: 'arrow',
    bolts: 'bolt',
    javelins: 'javelin',
    darts: 'dart',
    handaxes: 'handaxe',
    knives: 'knife',
    clothes: 'clothes',
    thieves: 'thieves',
    tools: 'tools',
  };

  if (irregulars[word]) return irregulars[word];
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ves')) return `${word.slice(0, -3)}f`;
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function extractQuantityAndName(value: string): { quantity: number; name: string } {
  const normalized = normalizeWhitespace(value);
  const match = normalized.match(/^(\d+|[a-z-]+)\s+(.+)$/i);
  if (!match) return { quantity: 1, name: normalized };

  const rawQuantity = match[1].toLowerCase();
  const quantity = /^\d+$/.test(rawQuantity) ? parseInt(rawQuantity, 10) : NUMBER_WORDS[rawQuantity];
  if (!quantity) return { quantity: 1, name: normalized };

  const remainder = match[2].trim();
  const words = remainder.split(' ');
  if (words.length === 0) return { quantity, name: normalized };

  words[0] = singularizeWord(words[0].toLowerCase());

  return {
    quantity,
    name: titleCase(words.join(' ')),
  };
}

function toList(value: string): string[] {
  return value
    .split(/\n|;/)
    .flatMap(part => part.split(','))
    .map(entry => normalizeWhitespace(entry))
    .filter(Boolean);
}

function normalizeLanguageEntries(values: string[]): string[] {
  return [...new Set(values.map(value => normalizeWhitespace(value)).filter(Boolean))];
}

function mergeCurrency(base: CurrencyMap, patch: Partial<CurrencyMap>): CurrencyMap {
  return {
    cp: base.cp + (patch.cp ?? 0),
    sp: base.sp + (patch.sp ?? 0),
    ep: base.ep + (patch.ep ?? 0),
    gp: base.gp + (patch.gp ?? 0),
    pp: base.pp + (patch.pp ?? 0),
  };
}

function extractCurrency(value: string): { cleaned: string; currency: Partial<CurrencyMap> } {
  const currency = emptyCurrency();
  let cleaned = value;

  cleaned = cleaned.replace(/(\d+)\s*(cp|sp|ep|gp|pp)\b/gi, (_, amount, denomination: CurrencyKey) => {
    currency[denomination] += parseInt(amount, 10) || 0;
    return '';
  });

  cleaned = cleaned
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/^,\s*|\s*,$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { cleaned, currency };
}

function inferItemType(name: string, fallback: InventoryItem['itemType'] = 'gear'): InventoryItem['itemType'] {
  const lower = name.toLowerCase();
  if ([...WEAPON_NAMES].some(weaponName => lower.includes(weaponName))) return 'weapon';
  if (lower.includes('armor') || lower.includes('shield')) return 'armor';
  if (lower.includes('tool') || lower.includes('kit') || lower.includes('supplies')) return 'tool';
  if (lower.includes('potion') || lower.includes('rations') || lower.includes('water')) return 'consumable';
  return fallback;
}

function splitCombinedEntries(items: InventoryItem[]): { items: InventoryItem[]; currency: CurrencyMap } {
  const collectedCurrency = emptyCurrency();
  const normalizedItems: InventoryItem[] = [];

  items.forEach(item => {
    const extractedDescription = extractCurrency(item.description ?? '');
    Object.entries(extractedDescription.currency).forEach(([key, amount]) => {
      collectedCurrency[key as CurrencyKey] += amount;
    });

    const rawParts = item.name
      .split('\n')
      .flatMap(part => part.split(','))
      .map(part => normalizeWhitespace(part))
      .filter(Boolean);

    const shouldSplitCombinedName = rawParts.length > 1 && (
      !item.itemType
      || item.description === 'Background starting equipment'
      || item.description === 'Class starting equipment'
    );

    if (!shouldSplitCombinedName) {
      const extractedName = extractCurrency(item.name);
      const cleanedName = normalizeWhitespace(extractedName.cleaned);
      const parsed = extractQuantityAndName(cleanedName);
      Object.entries(extractedName.currency).forEach(([key, amount]) => {
        collectedCurrency[key as CurrencyKey] += amount;
      });

      if (!cleanedName && !extractedDescription.cleaned.trim()) {
        return;
      }

      normalizedItems.push({
        ...item,
        name: parsed.name || normalizeWhitespace(extractedDescription.cleaned),
        description: normalizeWhitespace(extractedDescription.cleaned),
        quantity: Math.max(1, parsed.quantity || item.quantity || 1),
        weight: item.weight || 0,
        itemType: item.itemType ?? inferItemType(parsed.name || normalizeWhitespace(extractedDescription.cleaned)),
      });
      return;
    }

    rawParts.forEach(part => {
      const extracted = extractCurrency(part);
      Object.entries(extracted.currency).forEach(([key, amount]) => {
        collectedCurrency[key as CurrencyKey] += amount;
      });

      const cleaned = normalizeWhitespace(extracted.cleaned);
      if (!cleaned) return;
      const parsed = extractQuantityAndName(cleaned);

      normalizedItems.push({
        id: crypto.randomUUID(),
        name: parsed.name,
        quantity: parsed.quantity,
        weight: 0,
        description: normalizeWhitespace(extractedDescription.cleaned),
        itemType: inferItemType(parsed.name),
      });
    });
  });

  return { items: normalizedItems, currency: collectedCurrency };
}

export function createInventoryFromText(value: string, description = ''): { items: InventoryItem[]; currency: CurrencyMap } {
  return splitCombinedEntries([
    {
      id: crypto.randomUUID(),
      name: value,
      quantity: 1,
      weight: 0,
      description,
      itemType: 'gear',
    },
  ]);
}

function findCharacterClass(character: Character): ClassData | undefined {
  const lower = character.classAndLevel.toLowerCase();
  return CLASS_DATA.find(cls => lower.includes(cls.name.toLowerCase()));
}

function buildSpellSlots(character: Character, cls?: ClassData): Record<number, SpellSlots> {
  const slots = Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [index + 1, { total: 0, used: 0 }]),
  ) as Record<number, SpellSlots>;

  if (!cls?.spellcasting) return slots;

  const level = parseLevel(character.classAndLevel);

  if (cls.spellcasting.type === 'pact') {
    const slotLevel = Math.min(5, Math.ceil(level / 2));
    const total = level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1;
    const prior = character.spellSlots?.[slotLevel]?.used ?? 0;
    slots[slotLevel] = { total, used: Math.min(prior, total) };
    return slots;
  }

  const slotCounts = getSlotsAtLevel(cls.spellcasting, level);
  slotCounts.forEach((total, index) => {
    const prior = character.spellSlots?.[index + 1]?.used ?? 0;
    slots[index + 1] = { total, used: Math.min(prior, total) };
  });

  return slots;
}

function getAvailableSpells(character: Character, cls?: ClassData): SpellData[] {
  if (!cls?.spellcasting) return [];
  const level = parseLevel(character.classAndLevel);

  if (cls.spellcasting.type === 'pact') {
    const maxLevel = Math.min(5, Math.ceil(level / 2));
    return getSpellsForClass(cls.name).filter(spell => spell.level <= maxLevel);
  }

  const slots = getSlotsAtLevel(cls.spellcasting, level);
  const maxLevel = maxSpellLevel(slots);
  return getSpellsForClass(cls.name).filter(spell => spell.level <= maxLevel);
}

function getSpellcastingAbilityMod(character: Character, cls?: ClassData): number {
  if (!cls?.spellcasting) return 0;
  return calcMod(character.abilityScores[cls.spellcasting.ability]);
}

function lookupWeapon(name: string): WeaponTemplate | undefined {
  const lower = name.toLowerCase();

  return Object.entries(WEAPON_TEMPLATES).find(([weaponName]) => lower.includes(weaponName))?.[1];
}

function isWeaponProficient(character: Character, weapon: WeaponTemplate, itemName: string): boolean {
  const profs = character.otherProficiencies.toLowerCase();
  if (profs.includes(itemName.toLowerCase())) return true;
  if (weapon.category === 'simple' && profs.includes('simple weapons')) return true;
  if (weapon.category === 'martial' && profs.includes('martial weapons')) return true;
  return false;
}

function buildInventoryAttacks(character: Character): Attack[] {
  return character.inventory.flatMap(item => {
    if (item.itemType !== 'weapon') return [];
    const weapon = lookupWeapon(item.name);
    if (!weapon) return [];

    const strMod = calcMod(character.abilityScores.str);
    const dexMod = calcMod(character.abilityScores.dex);
    const abilityMod = weapon.kind === 'ranged'
      ? dexMod
      : weapon.finesse
        ? Math.max(strMod, dexMod)
        : strMod;
    const proficient = isWeaponProficient(character, weapon, item.name);
    const attackBonus = abilityMod + (proficient ? character.proficiencyBonus : 0);

    return [{
      id: `inventory-${item.id}`,
      name: item.name,
      attackBonus: `${attackBonus >= 0 ? '+' : ''}${attackBonus}`,
      damageType: weapon.damage,
      source: 'inventory',
      linkedItemName: item.name,
    }];
  });
}

function normalizeSpells(character: Character, cls?: ClassData): Spell[] {
  if (!cls?.spellcasting) return [];
  const available = new Set(getAvailableSpells(character, cls).map(spell => spell.name));
  return character.spells
    .filter(spell => available.has(spell.name))
    .map(spell => ({ ...spell, prepared: cls.spellcasting?.prepares ? spell.prepared : true }));
}

export function canCharacterCastSpells(character: Character): boolean {
  return Boolean(findCharacterClass(character)?.spellcasting);
}

export function getCharacterClass(character: Character): ClassData | undefined {
  return findCharacterClass(character);
}

export function getAvailableSpellOptions(character: Character): Map<number, SpellData[]> {
  const cls = findCharacterClass(character);
  const map = new Map<number, SpellData[]>();
  for (let level = 0; level <= 9; level += 1) map.set(level, []);
  getAvailableSpells(character, cls).forEach(spell => {
    map.get(spell.level)?.push(spell);
  });
  return map;
}

export function getSpellSummary(character: Character): { saveDC: number | null; attackBonus: number | null } {
  const cls = findCharacterClass(character);
  if (!cls?.spellcasting) return { saveDC: null, attackBonus: null };
  const mod = getSpellcastingAbilityMod(character, cls);
  return {
    saveDC: 8 + character.proficiencyBonus + mod,
    attackBonus: character.proficiencyBonus + mod,
  };
}

export function getListItems(value: string): string[] {
  return toList(value).filter(item => !/\bbonus language(s)?\b/i.test(item) && !/\bextra language of your choice\b/i.test(item));
}

export function normalizeCharacter(character: Character): Character {
  const cls = findCharacterClass(character);
  const inventoryNormalized = splitCombinedEntries(character.inventory ?? []);
  const treasureNormalized = splitCombinedEntries(character.treasureItems ?? []);
  const currency = mergeCurrency(
    mergeCurrency(emptyCurrency(), character.currency ?? emptyCurrency()),
    mergeCurrency(inventoryNormalized.currency, treasureNormalized.currency),
  );
  const normalizedInventory = inventoryNormalized.items.map(item => ({
    ...item,
    quantity: Math.max(1, item.quantity || 1),
    weight: item.weight || 0,
    itemType: item.itemType ?? inferItemType(item.name),
  }));
  const rawProficiencyItems = getListItems(character.otherProficiencies ?? '');
  const knownLanguageSet = new Set(LANGUAGES.map(language => language.toLowerCase()));
  const parsedLanguages = rawProficiencyItems.filter(item => knownLanguageSet.has(item.toLowerCase()));
  const remainingProficiencies = rawProficiencyItems.filter(item => !knownLanguageSet.has(item.toLowerCase()));
  const manualAttacks = (character.attacks ?? [])
    .filter(attack => attack.source !== 'inventory')
    .map(attack => ({ ...attack, source: 'manual' as const }));
  const derivedAttacks = buildInventoryAttacks({ ...character, inventory: normalizedInventory });

  return {
    ...character,
    experiencePoints: 0,
    currency,
    inventory: normalizedInventory,
    treasureItems: treasureNormalized.items,
    treasure: '',
    attacks: [...manualAttacks, ...derivedAttacks],
    otherProficiencies: remainingProficiencies.join(', '),
    languages: normalizeLanguageEntries([...(character.languages ?? []), ...parsedLanguages]),
    spellcastingClass: cls?.spellcasting ? cls.name : '',
    spellcastingAbility: cls?.spellcasting?.ability ?? '',
    spellSlots: buildSpellSlots(character, cls),
    spells: normalizeSpells(character, cls),
  };
}
