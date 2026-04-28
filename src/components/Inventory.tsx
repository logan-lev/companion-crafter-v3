import { useState } from 'react';
import type { Character, InventoryItem } from '../types/character';
import { ITEM_CATALOG, findCatalogItem } from '../data/srd-items';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
}

const CURRENCIES = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;
const ITEM_TYPES: NonNullable<InventoryItem['itemType']>[] = ['weapon', 'armor', 'gear', 'tool', 'consumable', 'treasure'];
type AddMode = 'catalog' | 'custom' | null;

interface CustomDraft {
  name: string;
  quantity: number;
  weight: number;
  description: string;
  itemType: NonNullable<InventoryItem['itemType']>;
}

const EMPTY_CUSTOM_DRAFT = (itemType: NonNullable<InventoryItem['itemType']>): CustomDraft => ({
  name: '',
  quantity: 1,
  weight: 0,
  description: '',
  itemType,
});

function InventoryList({
  title,
  items,
  onUpdate,
  onAddCatalog,
  onAddCustom,
  onRemove,
  query,
  onQueryChange,
  addMode,
  onModeChange,
  customDraft,
  onCustomDraftChange,
}: {
  title: string;
  items: InventoryItem[];
  onUpdate: (id: string, patch: Partial<InventoryItem>) => void;
  onAddCatalog: () => void;
  onAddCustom: () => void;
  onRemove: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  addMode: AddMode;
  onModeChange: (mode: AddMode) => void;
  customDraft: CustomDraft;
  onCustomDraftChange: (draft: CustomDraft) => void;
}) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const suggestions = query.trim()
    ? ITEM_CATALOG.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="section-box">
      <div className="section-title">{title}</div>
      <div className="grid grid-cols-12 gap-2 mb-2 px-1">
        <span className="field-label col-span-3">Name</span>
        <span className="field-label col-span-2">Type</span>
        <span className="field-label col-span-2">Qty</span>
        <span className="field-label col-span-2">Wt (lb)</span>
        <span className="field-label col-span-2">Notes</span>
        <span className="field-label col-span-1">Del</span>
      </div>
      {items.map(item => (
        <div key={item.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <input value={item.name}
            onChange={(e) => onUpdate(item.id, { name: e.target.value })}
            className="field-input text-xs col-span-3" placeholder="Item name" />
          <select
            value={item.itemType ?? 'gear'}
            onChange={(e) => onUpdate(item.id, { itemType: e.target.value as InventoryItem['itemType'] })}
            className="field-input select text-xs col-span-2"
          >
            {ITEM_TYPES.map(type => (
              <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          <input type="number" min={0} value={item.quantity}
            onChange={(e) => onUpdate(item.id, { quantity: parseInt(e.target.value) || 0 })}
            className="field-input text-xs col-span-2" />
          <input type="number" min={0} step={0.1} value={item.weight}
            onChange={(e) => onUpdate(item.id, { weight: parseFloat(e.target.value) || 0 })}
            className="field-input text-xs col-span-2" />
          <input value={item.description}
            onChange={(e) => onUpdate(item.id, { description: e.target.value })}
            className="field-input text-xs col-span-2" placeholder="Notes" />
          <button onClick={() => onRemove(item.id)}
            className="text-red-500 text-xs col-span-1 text-center">✕</button>
        </div>
      ))}
      <div className="mt-4 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              onModeChange(addMode === 'catalog' ? null : 'catalog');
              setShowSuggestions(true);
            }}
            className={`text-xs border px-3 py-1 transition-all ${addMode === 'catalog' ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]' : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'}`}
          >
            + Add Item
          </button>
          <button
            onClick={() => onModeChange(addMode === 'custom' ? null : 'custom')}
            className={`text-xs border px-3 py-1 transition-all ${addMode === 'custom' ? 'border-[var(--color-text-strong)] bg-[var(--color-selected-strong)] text-[var(--color-text-strong)]' : 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]'}`}
          >
            + Add Custom
          </button>
        </div>

        {addMode === 'catalog' && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => {
                  onQueryChange(e.target.value);
                  setShowSuggestions(true);
                }}
                className="field-input w-full text-sm"
                placeholder={`Search ${title.toLowerCase()}`}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded border border-[var(--color-accent)] bg-[var(--color-surface-pop)] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                  {suggestions.map(item => (
                    <button
                      key={item.name}
                      onClick={() => {
                        onQueryChange(item.name);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between border-b border-[var(--color-border-subtle)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--color-hover)]"
                    >
                      <span className="text-sm text-[var(--color-text-strong)]">{item.name}</span>
                      <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-text-muted)]">{item.itemType}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={onAddCatalog}
              className="self-start text-xs text-[var(--color-accent)] border border-[var(--color-accent)] px-3 py-1 hover:bg-[var(--color-hover)]">
              Add Selected Item
            </button>
          </div>
        )}

        {addMode === 'custom' && (
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
            <input
              value={customDraft.name}
              onChange={(e) => onCustomDraftChange({ ...customDraft, name: e.target.value })}
              className="field-input text-sm lg:col-span-2"
              placeholder="Custom item name"
            />
            <select
              value={customDraft.itemType}
              onChange={(e) => onCustomDraftChange({ ...customDraft, itemType: e.target.value as CustomDraft['itemType'] })}
              className="field-input select text-sm"
            >
              {ITEM_TYPES.map(type => (
                <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={customDraft.quantity}
              onChange={(e) => onCustomDraftChange({ ...customDraft, quantity: parseInt(e.target.value) || 1 })}
              className="field-input text-sm"
              placeholder="Qty"
            />
            <input
              type="number"
              min={0}
              step={0.1}
              value={customDraft.weight}
              onChange={(e) => onCustomDraftChange({ ...customDraft, weight: parseFloat(e.target.value) || 0 })}
              className="field-input text-sm"
              placeholder="Weight"
            />
            <input
              value={customDraft.description}
              onChange={(e) => onCustomDraftChange({ ...customDraft, description: e.target.value })}
              className="field-input text-sm lg:col-span-4"
              placeholder="Notes"
            />
            <button onClick={onAddCustom}
              className="self-start text-xs text-[var(--color-accent)] border border-[var(--color-accent)] px-3 py-2 hover:bg-[var(--color-hover)]">
              Add Custom Item
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <span className="text-xs text-[var(--color-accent)]">Total Weight: {totalWeight.toFixed(1)} lb</span>
      </div>
    </div>
  );
}

export default function Inventory({ character, onChange }: Props) {
  const [inventoryQuery, setInventoryQuery] = useState('');
  const [treasureQuery, setTreasureQuery] = useState('');
  const [inventoryMode, setInventoryMode] = useState<AddMode>(null);
  const [treasureMode, setTreasureMode] = useState<AddMode>(null);
  const [inventoryCustomDraft, setInventoryCustomDraft] = useState<CustomDraft>(EMPTY_CUSTOM_DRAFT('gear'));
  const [treasureCustomDraft, setTreasureCustomDraft] = useState<CustomDraft>(EMPTY_CUSTOM_DRAFT('treasure'));
  const up = <K extends keyof Character>(key: K, val: Character[K]) =>
    onChange({ ...character, [key]: val });

  const updateItem = (key: 'inventory' | 'treasureItems', id: string, patch: Partial<InventoryItem>) => {
    onChange({
      ...character,
      [key]: character[key].map(i => i.id === id ? { ...i, ...patch } : i),
    });
  };

  const addCatalogItem = (key: 'inventory' | 'treasureItems') => {
    const query = (key === 'inventory' ? inventoryQuery : treasureQuery).trim();
    const catalogItem = query ? findCatalogItem(query) : undefined;
    if (!catalogItem && !query) return;
    const defaultName = query || (key === 'treasureItems' ? 'New treasure' : 'New item');
    const newItem: InventoryItem = catalogItem
      ? {
          id: crypto.randomUUID(),
          name: catalogItem.name,
          quantity: 1,
          weight: catalogItem.weight,
          description: catalogItem.description ?? '',
          itemType: key === 'treasureItems' ? 'treasure' : catalogItem.itemType,
        }
      : {
          id: crypto.randomUUID(),
          name: defaultName,
          quantity: 1,
          weight: 0,
          description: '',
          itemType: key === 'treasureItems' ? 'treasure' : 'gear',
        };
    onChange({
      ...character,
      [key]: [...character[key], newItem],
    });
    if (key === 'inventory') {
      setInventoryQuery('');
      setInventoryMode(null);
    } else {
      setTreasureQuery('');
      setTreasureMode(null);
    }
  };

  const addCustomItem = (key: 'inventory' | 'treasureItems') => {
    const draft = key === 'inventory' ? inventoryCustomDraft : treasureCustomDraft;
    if (!draft.name.trim()) return;

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      quantity: draft.quantity || 1,
      weight: draft.weight || 0,
      description: draft.description.trim(),
      itemType: key === 'treasureItems' ? 'treasure' : draft.itemType,
    };

    onChange({
      ...character,
      [key]: [...character[key], newItem],
    });

    if (key === 'inventory') {
      setInventoryCustomDraft(EMPTY_CUSTOM_DRAFT('gear'));
      setInventoryMode(null);
    } else {
      setTreasureCustomDraft(EMPTY_CUSTOM_DRAFT('treasure'));
      setTreasureMode(null);
    }
  };

  const removeItem = (key: 'inventory' | 'treasureItems', id: string) => {
    onChange({ ...character, [key]: character[key].filter(i => i.id !== id) });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Currency */}
      <div className="section-box">
        <div className="section-title">Currency</div>
        <div className="grid grid-cols-5 gap-2">
          {CURRENCIES.map(cur => (
            <div key={cur} className="stat-box">
              <input
                type="number"
                min={0}
                value={character.currency[cur]}
                onChange={(e) => up('currency', { ...character.currency, [cur]: parseInt(e.target.value) || 0 })}
                className="text-lg font-bold text-center w-full bg-transparent border-none outline-none text-[var(--color-text-strong)]"
              />
              <div className="field-label">{cur.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      <InventoryList
        title="Equipment & Inventory"
        items={character.inventory}
        onUpdate={(id, patch) => updateItem('inventory', id, patch)}
        onAddCatalog={() => addCatalogItem('inventory')}
        onAddCustom={() => addCustomItem('inventory')}
        onRemove={(id) => removeItem('inventory', id)}
        query={inventoryQuery}
        onQueryChange={setInventoryQuery}
        addMode={inventoryMode}
        onModeChange={setInventoryMode}
        customDraft={inventoryCustomDraft}
        onCustomDraftChange={setInventoryCustomDraft}
      />

      <InventoryList
        title="Treasure & Other Valuables"
        items={character.treasureItems}
        onUpdate={(id, patch) => updateItem('treasureItems', id, patch)}
        onAddCatalog={() => addCatalogItem('treasureItems')}
        onAddCustom={() => addCustomItem('treasureItems')}
        onRemove={(id) => removeItem('treasureItems', id)}
        query={treasureQuery}
        onQueryChange={setTreasureQuery}
        addMode={treasureMode}
        onModeChange={setTreasureMode}
        customDraft={treasureCustomDraft}
        onCustomDraftChange={setTreasureCustomDraft}
      />
    </div>
  );
}
